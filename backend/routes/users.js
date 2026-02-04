/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sanitizeEmail, sanitizeString } = require('../utils/validation');
const { uploadFile, uploadBuffer, deleteFile, getFileUrl } = require('../utils/minio');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

router.get('/users', async (req, res) => {
  try {
    console.log('[v0] Fetching all users');
    const result = await pool.query(`
      SELECT 
        id, email, fullname, company, city, state, country, status, 
        qualification, branch, passoutyear, created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    console.log('[v0] Found', result.rows.length, 'users');
    res.status(200).json({ success: true, users: result.rows });
  } catch (err) {
    console.error('[v0] Error fetching users:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.get('/user-stats', async (req, res) => {
  try {
    console.log('[v0] Generating user statistics');
    const result = await pool.query('SELECT * FROM users');
    const users = result.rows;

    // Aggregate data for stats
    const totalUsers = users.length;
    const statusCount = {
      employed: users.filter(u => u.status === 'employed').length,
      graduated: users.filter(u => u.status === 'graduated').length,
      pursuing: users.filter(u => u.status === 'pursuing').length,
    };

    // Aggregate by city, state, country for filters
    const cityCount = {};
    const stateCount = {};
    const countryCount = {};
    users.forEach(user => {
      if (user.city) cityCount[user.city] = (cityCount[user.city] || 0) + 1;
      if (user.state) stateCount[user.state] = (stateCount[user.state] || 0) + 1;
      if (user.country) countryCount[user.country] = (countryCount[user.country] || 0) + 1;
    });

    // Aggregate by qualification, passoutyear, branch with status
    const qualificationByYearStatus = {};
    const branchByQualYearStatus = {};
    users.forEach(user => {
      const qualKey = `${user.qualification}-${user.passoutyear}-${user.status}`;
      const branchKey = `${user.branch}-${user.qualification}-${user.passoutyear}-${user.status}`;
      qualificationByYearStatus[qualKey] = (qualificationByYearStatus[qualKey] || 0) + 1;
      branchByQualYearStatus[branchKey] = (branchByQualYearStatus[branchKey] || 0) + 1;
    });

    console.log('[v0] User statistics generated successfully');
    res.status(200).json({
      success: true,
      totalUsers,
      statusCount,
      cityCount,
      stateCount,
      countryCount,
      qualificationByYearStatus,
      branchByQualYearStatus
    });
  } catch (err) {
    console.error('[v0] Error generating user stats:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user stats',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Upload resume to MinIO and store metadata in database
router.post('/upload-resume', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const resumeFile = req.files?.resume;
    if (!resumeFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('[v0] Processing resume upload for:', email);

    // Check file size (less than 5MB)
    if (resumeFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
    }

    // Check file type (PDF, DOC, DOCX only)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resumeFile.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only PDF and DOCX/DOC files are allowed' });
    }

    // Use temporary file path
    const tempPath = resumeFile.tempFilePath;
    console.log('[v0] Processing file at:', tempPath);

    // Upload to MinIO
    const minioResult = await uploadFile(tempPath, `resume-${Date.now()}-${resumeFile.name}`, resumeFile.mimetype);
    
    if (!minioResult.success) {
      return res.status(500).json({ success: false, message: 'Error uploading to storage', error: minioResult.error });
    }

    // Get user ID
    const userQuery = 'SELECT id FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [sanitizeEmail(email)]);
    
    if (userResult.rows.length === 0) {
      await deleteFile(minioResult.objectName); // Clean up uploaded file
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Store metadata in PostgreSQL
    const query = `
      INSERT INTO resumes (user_id, email, name, file_name, file_type, minio_url, file_size)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, file_name, minio_url, file_size, created_at
    `;
    const result = await pool.query(query, [
      userId,
      sanitizeEmail(email), 
      sanitizeString(resumeFile.name), 
      resumeFile.name,
      resumeFile.mimetype,
      minioResult.url,
      resumeFile.size
    ]);
    
    console.log('[v0] Resume uploaded successfully for:', email);
    res.status(200).json({ 
      success: true, 
      message: 'Resume uploaded successfully',
      resume: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error uploading resume:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading resume',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get resumes for a user
router.get('/resumes/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('[v0] Fetching resumes for:', email);
    const query = `
      SELECT id, name, file_name, file_type, minio_url, file_size, created_at, updated_at 
      FROM resumes 
      WHERE email = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [sanitizeEmail(email)]);
    
    console.log('[v0] Found', result.rows.length, 'resumes for:', email);
    res.status(200).json({ 
      success: true, 
      resumes: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching resumes:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching resumes',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Delete a specific resume
router.delete('/resume/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'Resume ID is required' });
    }
    
    console.log('[v0] Deleting resume:', resumeId);
    
    // Get file info
    const selectQuery = 'SELECT minio_url FROM resumes WHERE id = $1';
    const selectResult = await pool.query(selectQuery, [resumeId]);
    
    if (selectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const minioUrl = selectResult.rows[0].minio_url;
    const objectName = minioUrl.split('/').pop(); // Extract object name from URL

    // Delete from MinIO
    const deleteMinioResult = await deleteFile(objectName);
    
    // Delete from database
    const deleteQuery = 'DELETE FROM resumes WHERE id = $1 RETURNING id, name';
    const result = await pool.query(deleteQuery, [resumeId]);
    
    console.log('[v0] Resume deleted:', resumeId);
    res.status(200).json({ 
      success: true, 
      message: 'Resume deleted successfully',
      deleteResult
    });
  } catch (err) {
    console.error('[v0] Error deleting resume:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting resume',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get user by email with profile details
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('[v0] Fetching user:', email);
    const query = `
      SELECT 
        id, email, fullname, company_name, city, state, country, 
        phone, status, qualification, branch, passoutyear, 
        profile_image_url, bio, is_premium, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [sanitizeEmail(email)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      user: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error fetching user:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/user/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullname, company_name, bio, city, state, country, phone, qualification, branch, passoutyear, status } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    console.log('[v0] Updating user profile:', userId);

    const query = `
      UPDATE users
      SET 
        fullname = COALESCE($1, fullname),
        company_name = COALESCE($2, company_name),
        bio = COALESCE($3, bio),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        country = COALESCE($6, country),
        phone = COALESCE($7, phone),
        qualification = COALESCE($8, qualification),
        branch = COALESCE($9, branch),
        passoutyear = COALESCE($10, passoutyear),
        status = COALESCE($11, status),
        updated_at = NOW()
      WHERE id = $12
      RETURNING id, email, fullname, company_name, bio, city, state, country, phone, status, qualification, branch, passoutyear, profile_image_url, is_premium, updated_at
    `;

    const result = await pool.query(query, [
      sanitizeString(fullname),
      sanitizeString(company_name),
      sanitizeString(bio),
      sanitizeString(city),
      sanitizeString(state),
      sanitizeString(country),
      sanitizeString(phone),
      sanitizeString(qualification),
      sanitizeString(branch),
      sanitizeString(passoutyear),
      sanitizeString(status),
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('[v0] User profile updated successfully');
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error updating user profile:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Upload profile image to MinIO
router.post('/user/:userId/upload-profile-image', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const imageFile = req.files?.image;
    if (!imageFile) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    console.log('[v0] Uploading profile image for user:', userId);

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed' });
    }

    // Check file size (less than 2MB)
    if (imageFile.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds 2MB limit' });
    }

    // Upload to MinIO
    const minioResult = await uploadFile(
      imageFile.tempFilePath,
      `profile-${Date.now()}-${imageFile.name}`,
      imageFile.mimetype
    );

    if (!minioResult.success) {
      return res.status(500).json({ success: false, message: 'Error uploading image', error: minioResult.error });
    }

    // Update user's profile_image_url
    const updateQuery = `
      UPDATE users
      SET profile_image_url = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, profile_image_url
    `;
    const updateResult = await pool.query(updateQuery, [minioResult.url, userId]);

    if (updateResult.rows.length === 0) {
      await deleteFile(minioResult.objectName); // Clean up
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('[v0] Profile image uploaded successfully');
    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImageUrl: minioResult.url
    });
  } catch (err) {
    console.error('[v0] Error uploading profile image:', err);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get all users for browsing/searching
router.get('/all-users', async (req, res) => {
  try {
    const { search, status, company } = req.query;

    console.log('[v0] Fetching all users with filters');

    let query = `
      SELECT 
        id, email, fullname, company_name, city, status,
        qualification, profile_image_url, bio, is_premium, created_at
      FROM users
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (fullname ILIKE $${paramCount} OR company_name ILIKE $${paramCount})`;
      values.push(`%${sanitizeString(search)}%`);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(sanitizeString(status));
    }

    if (company) {
      paramCount++;
      query += ` AND company_name ILIKE $${paramCount}`;
      values.push(`%${sanitizeString(company)}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await pool.query(query, values);

    console.log('[v0] Found', result.rows.length, 'users');
    res.status(200).json({
      success: true,
      users: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

module.exports = router;
