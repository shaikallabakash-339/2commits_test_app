const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Initialize or get user status
router.post('/update', async (req, res) => {
  try {
    const { userId, isOnline } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }
    
    // Check if user status exists
    const checkQuery = 'SELECT id FROM user_status WHERE user_id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    let result;
    if (checkResult.rows.length === 0) {
      // Create new status record
      const insertQuery = `
        INSERT INTO user_status (user_id, is_online, last_seen, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
      result = await pool.query(insertQuery, [userId, isOnline || false]);
    } else {
      // Update existing status record
      const updateQuery = `
        UPDATE user_status
        SET is_online = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING *
      `;
      result = await pool.query(updateQuery, [isOnline || false, userId]);
    }
    
    res.json({
      success: true,
      status: result.rows[0]
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

// Get user status
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT id, user_id, is_online, last_seen, updated_at
      FROM user_status
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: {
          user_id: userId,
          is_online: false,
          last_seen: null
        }
      });
    }
    
    res.json({
      success: true,
      status: result.rows[0]
    });
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status'
    });
  }
});

// Get multiple users' statuses
router.post('/batch', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array required'
      });
    }
    
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT id, user_id, is_online, last_seen, updated_at
      FROM user_status
      WHERE user_id IN (${placeholders})
    `;
    
    const result = await pool.query(query, userIds);
    
    // Create a map for quick lookup
    const statusMap = {};
    result.rows.forEach(row => {
      statusMap[row.user_id] = row;
    });
    
    // Fill in missing users with default offline status
    const statuses = userIds.map(userId => 
      statusMap[userId] || {
        user_id: userId,
        is_online: false,
        last_seen: null
      }
    );
    
    res.json({
      success: true,
      statuses
    });
  } catch (err) {
    console.error('Get batch statuses error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statuses'
    });
  }
});

// Mark user as offline (for logging out)
router.post('/logout/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      UPDATE user_status
      SET is_online = false, last_seen = NOW(), updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      status: result.rows[0] || { user_id: userId, is_online: false }
    });
  } catch (err) {
    console.error('Logout status error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update logout status'
    });
  }
});

module.exports = router;
