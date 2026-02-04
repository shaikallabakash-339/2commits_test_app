/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { uploadFile, deleteFile, getFileUrl } = require('../utils/minio');
const { sanitizeString } = require('../utils/validation');
const fs = require('fs');

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('[v0] Admin login attempt:', email);
    
    // TODO: Implement admin user table and authentication
    // For now, use hardcoded admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillconnect.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      res.json({
        success: true,
        message: 'Admin login successful',
        admin: {
          email: email,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
  } catch (err) {
    console.error('[v0] Admin login error:', err);
    res.status(500).json({
      success: false,
      message: 'Admin login failed',
      error: err.message
    });
  }
});

// Get all users with filters
router.get("/users", async (req, res) => {
  try {
    const { status, company, search } = req.query;
    let query = 'SELECT id, email, fullname, company, status, phone, city, created_at FROM users WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (company) {
      query += ' AND company ILIKE $' + (params.length + 1);
      params.push(`%${company}%`);
    }

    if (search) {
      query += ' AND (fullname ILIKE $' + (params.length + 1) + ' OR email ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 1000';

    const result = await pool.query(query, params);
    res.json({
      success: true,
      users: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: err.message
    });
  }
});

// Send bulk message to users
router.post("/send-bulk-message", async (req, res) => {
  try {
    const { title, message, category, target_users } = req.body;

    if (!title || !message || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, message, category'
      });
    }

    console.log('[v0] Sending bulk message to category:', category);

    // Insert message
    const messageQuery = `
      INSERT INTO messages (id, category, message, message_type, target_users, timestamp)
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const messageResult = await pool.query(messageQuery, [
      category,
      message,
      'bulk',
      target_users || 0
    ]);

    const msgId = messageResult.rows[0].id;

    // Get all users in this category
    const usersQuery = 'SELECT id FROM users WHERE status = $1';
    const usersResult = await pool.query(usersQuery, [category]);

    // Create message_recipients entries
    let recipientCount = 0;
    for (const user of usersResult.rows) {
      await pool.query(
        'INSERT INTO message_recipients (id, message_id, user_id, is_read) VALUES (uuid_generate_v4(), $1, $2, false)',
        [msgId, user.id]
      );
      recipientCount++;
    }

    console.log('[v0] Bulk message sent to', recipientCount, 'users');

    res.json({
      success: true,
      message: `Message sent to ${recipientCount} users`,
      messageId: msgId,
      recipientCount: recipientCount
    });
  } catch (err) {
    console.error('[v0] Error sending bulk message:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk message',
      error: err.message
    });
  }
});

// Get all donations
router.get("/donations", async (req, res) => {
  try {
    const { type, from_date, to_date } = req.query;
    let query = 'SELECT * FROM donations WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (from_date) {
      query += ' AND created_at >= $' + (params.length + 1);
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND created_at <= $' + (params.length + 1);
      params.push(to_date);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    // Calculate totals
    const totalAmount = result.rows.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    res.json({
      success: true,
      donations: result.rows,
      count: result.rows.length,
      totalAmount: totalAmount
    });
  } catch (err) {
    console.error('[v0] Error fetching donations:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: err.message
    });
  }
});

// Get dashboard analytics
router.get("/analytics", async (req, res) => {
  try {
    // Total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Users by status
    const statusResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM users GROUP BY status'
    );

    // Total messages sent
    const messagesResult = await pool.query(
      'SELECT COUNT(*) as count FROM messages'
    );
    const totalMessages = parseInt(messagesResult.rows[0].count);

    // Total donations
    const donationsResult = await pool.query(
      'SELECT SUM(CAST(amount AS DECIMAL)) as total FROM donations'
    );
    const totalDonations = parseFloat(donationsResult.rows[0].total) || 0;

    // Email stats
    const emailResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM email_logs GROUP BY status'
    );

    res.json({
      success: true,
      analytics: {
        totalUsers,
        usersByStatus: statusResult.rows,
        totalMessages,
        totalDonations,
        emailStats: emailResult.rows
      }
    });
  } catch (err) {
    console.error('[v0] Error fetching analytics:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: err.message
    });
  }
});

// Get email statistics
router.get("/email-stats", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT year, month, total_emails_sent, unique_recipients FROM email_statistics ORDER BY year DESC, month DESC'
    );

    res.json({
      success: true,
      stats: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching email stats:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching email statistics',
      error: err.message
    });
  }
});

// Get recent activities
router.get("/activities", async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    // Get recent user registrations
    const usersResult = await pool.query(
      'SELECT id, email, fullname, created_at FROM users ORDER BY created_at DESC LIMIT $1',
      [limit]
    );

    // Get recent donations
    const donationsResult = await pool.query(
      'SELECT * FROM donations ORDER BY created_at DESC LIMIT $1',
      [limit]
    );

    // Get recent messages
    const messagesResult = await pool.query(
      'SELECT * FROM messages ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );

    res.json({
      success: true,
      activities: {
        recentUsers: usersResult.rows,
        recentDonations: donationsResult.rows,
        recentMessages: messagesResult.rows
      }
    });
  } catch (err) {
    console.error('[v0] Error fetching activities:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: err.message
    });
  }
});

module.exports = router;
