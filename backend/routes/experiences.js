const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all experiences for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT id, job_title, company_name, start_date, end_date, 
             is_current, description, created_at
      FROM user_experiences
      WHERE user_id = $1
      ORDER BY start_date DESC, created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({
      success: true,
      experiences: result.rows
    });
  } catch (err) {
    console.error('Get experiences error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experiences'
    });
  }
});

// Add a new experience
router.post('/', async (req, res) => {
  try {
    const { userId, jobTitle, companyName, startDate, endDate, isCurrent, description } = req.body;
    
    if (!userId || !jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const query = `
      INSERT INTO user_experiences 
      (user_id, job_title, company_name, start_date, end_date, is_current, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,
      jobTitle,
      companyName,
      startDate || null,
      endDate || null,
      isCurrent || false,
      description || ''
    ]);
    
    res.json({
      success: true,
      experience: result.rows[0]
    });
  } catch (err) {
    console.error('Add experience error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to add experience'
    });
  }
});

// Update an experience
router.put('/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { jobTitle, companyName, startDate, endDate, isCurrent, description } = req.body;
    
    const query = `
      UPDATE user_experiences
      SET job_title = $1, company_name = $2, start_date = $3, 
          end_date = $4, is_current = $5, description = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      jobTitle,
      companyName,
      startDate || null,
      endDate || null,
      isCurrent || false,
      description || '',
      experienceId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }
    
    res.json({
      success: true,
      experience: result.rows[0]
    });
  } catch (err) {
    console.error('Update experience error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update experience'
    });
  }
});

// Delete an experience
router.delete('/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    
    const query = `
      DELETE FROM user_experiences
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [experienceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Experience deleted successfully'
    });
  } catch (err) {
    console.error('Delete experience error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete experience'
    });
  }
});

module.exports = router;
