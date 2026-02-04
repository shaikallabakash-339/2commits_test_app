/*
 * Copyright (c) 2025-2026 Your Company Name
 * All rights reserved.
 */
// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { validateSignupData, validateLoginData, sanitizeEmail, sanitizeString } = require('../utils/validation');

router.post('/signup', async (req, res) => {
  console.log('[v0] Signup request received');
  console.log('[v0] Incoming request body:', JSON.stringify(req.body, null, 2));

  // Use field names that match what frontend sends
  const {
    email,
    fullname,
    password,
    company_name,
    phone,
    city,
    state,
    country,
    dob,
    status,
    qualification,
    branch,
    passoutyear
  } = req.body;

  try {
    // Validate with correct field name (fullname, not fullName)
    const validation = validateSignupData({ email, fullname, password, status, phone });
    if (!validation.isValid) {
      console.log('[v0] Signup validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: validation.errors[0]
      });
    }

    // Check password strength
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
      console.log('[v0] Password strength check failed:', strengthCheck.errors);
      return res.status(400).json({
        success: false,
        message: strengthCheck.errors[0]
      });
    }

    // Hash the password
    console.log('[v0] Hashing password...');
    const hashedPassword = await hashPassword(password);

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFullName = sanitizeString(fullname);

    const userData = {
      email: sanitizedEmail,
      fullname: sanitizedFullName,
      password: hashedPassword,
      company_name: company_name ? sanitizeString(company_name) : null,
      dob: dob || null,
      city: city ? sanitizeString(city) : null,
      state: state ? sanitizeString(state) : null,
      country: country ? sanitizeString(country) : null,
      phone: phone ? sanitizeString(phone) : null,
      status: sanitizeString(status),
      qualification: qualification ? sanitizeString(qualification) : null,
      branch: branch ? sanitizeString(branch) : null,
      passoutyear: passoutyear ? sanitizeString(passoutyear) : null
    };

    console.log('[v0] Prepared user data for database:', {
      email: userData.email,
      fullname: userData.fullname,
      hasPassword: !!userData.password,
      company_name: userData.company_name
    });

    // SQL query - columns in same order as values array
    const query = `
      INSERT INTO users (
        email, fullname, password, company_name, dob, city, state, country,
        phone, status, qualification, branch, passoutyear
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, email, fullname, company_name, status, created_at
    `;

    // Values must match column order exactly
    const values = [
      userData.email,
      userData.fullname,
      userData.password,
      userData.company_name,
      userData.dob,
      userData.city,
      userData.state,
      userData.country,
      userData.phone,
      userData.status,
      userData.qualification,
      userData.branch,
      userData.passoutyear
    ];

    console.log('[v0] Executing database insert...');
    const result = await pool.query(query, values);

    if (!result.rows || result.rows.length === 0) {
      console.error('[v0] No rows returned from insert query');
      return res.status(500).json({
        success: false,
        message: 'Failed to create user - no response from database'
      });
    }

    const newUser = result.rows[0];

    console.log('[v0] User registered successfully:', newUser.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullname: newUser.fullname,
        company_name: newUser.company_name,
        status: newUser.status,
        createdAt: newUser.created_at
      }
    });
  } catch (err) {
    console.error('[v0] Signup error:', err.stack || err);

    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    if (err.code === '42703') {
      return res.status(500).json({
        success: false,
        message: 'Database column mismatch error'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const validation = validateLoginData({ email, password });
    if (!validation.isValid) {
      console.log('[v0] Login validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: validation.errors[0]
      });
    }

    console.log('[v0] Login attempt for email:', email);

    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [sanitizeEmail(email)]);

    if (result.rows.length === 0) {
      console.log('[v0] Email not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userRow = result.rows[0];

    const isPasswordValid = await comparePassword(password, userRow.password);
    if (!isPasswordValid) {
      console.log('[v0] Invalid password for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      fullname: userRow.fullname,
      company_name: userRow.company_name,
      city: userRow.city,
      state: userRow.state,
      country: userRow.country,
      phone: userRow.phone,
      status: userRow.status,
      qualification: userRow.qualification,
      branch: userRow.branch,
      passoutyear: userRow.passoutyear,
      profile_image_url: userRow.profile_image_url,
      bio: userRow.bio,
      is_premium: userRow.is_premium
    };

    console.log('[v0] User logged in successfully:', user.email);

    res.status(200).json({
      success: true,
      user,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('[v0] Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
      });
    }

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: strengthCheck.errors[0]
      });
    }

    console.log('[v0] Password reset request for email:', email);

    const hashedPassword = await hashPassword(newPassword);

    const query = 'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, fullname';
    const result = await pool.query(query, [hashedPassword, sanitizeEmail(email)]);

    if (result.rows.length === 0) {
      console.log('[v0] Email not found for password reset:', email);
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    console.log('[v0] Password updated successfully for email:', email);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('[v0] Password reset error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get user profile
router.get('/user/:email', async (req, res) => {
  const { email } = req.params;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('[v0] Fetching user profile for email:', email);

    const query = `
      SELECT 
        id, email, fullname, company_name, dob, city, state, country, phone, status, 
        qualification, branch, passoutyear, profile_image_url, bio, is_premium, 
        message_count, created_at, updated_at 
      FROM users 
      WHERE email = $1
    `;
    const result = await pool.query(query, [sanitizeEmail(email)]);

    if (result.rows.length === 0) {
      console.log('[v0] User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    console.log('[v0] User profile fetched successfully:', email);

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    console.error('[v0] Error fetching user profile:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/user/:email', async (req, res) => {
  const { email } = req.params;
  const { fullname, company_name, phone, city, state, country, bio, profile_image_url } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('[v0] Updating user profile for email:', email);

    const sanitizedData = {
      fullname: fullname ? sanitizeString(fullname) : undefined,
      company_name: company_name ? sanitizeString(company_name) : undefined,
      phone: phone ? sanitizeString(phone) : undefined,
      city: city ? sanitizeString(city) : undefined,
      state: state ? sanitizeString(state) : undefined,
      country: country ? sanitizeString(country) : undefined,
      bio: bio ? sanitizeString(bio) : undefined,
      profile_image_url: profile_image_url ? sanitizeString(profile_image_url) : undefined
    };

    const query = `
      UPDATE users 
      SET 
        fullname = COALESCE($1, fullname),
        company_name = COALESCE($2, company_name),
        phone = COALESCE($3, phone),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        country = COALESCE($6, country),
        bio = COALESCE($7, bio),
        profile_image_url = COALESCE($8, profile_image_url),
        updated_at = NOW()
      WHERE email = $9
      RETURNING 
        id, email, fullname, company_name, phone, city, state, country, 
        bio, profile_image_url, status, qualification, branch, passoutyear
    `;

    const values = [
      sanitizedData.fullname,
      sanitizedData.company_name,
      sanitizedData.phone,
      sanitizedData.city,
      sanitizedData.state,
      sanitizedData.country,
      sanitizedData.bio,
      sanitizedData.profile_image_url,
      sanitizeEmail(email)
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.log('[v0] User not found:', email);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('[v0] User profile updated successfully:', email);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error updating user profile:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

module.exports = router;