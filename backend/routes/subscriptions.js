const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC'
    );
    res.json({
      success: true,
      plans: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching plans:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: err.message
    });
  }
});

// Create subscription request
router.post('/request', async (req, res) => {
  try {
    const { user_id, plan_id, payment_screenshot_url, transaction_proof } = req.body;

    if (!user_id || !plan_id || !payment_screenshot_url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log('[v0] Creating subscription request for user:', user_id);

    // Check if user already has active subscription
    const activeCheck = await pool.query(
      'SELECT * FROM user_subscriptions WHERE user_id = $1 AND status IN (\'active\', \'pending\') AND is_approved = true',
      [user_id]
    );

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Create subscription request
    const result = await pool.query(
      `INSERT INTO user_subscriptions (id, user_id, plan_id, payment_screenshot_url, transaction_proof, status)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'pending')
       RETURNING *`,
      [user_id, plan_id, payment_screenshot_url, transaction_proof]
    );

    res.json({
      success: true,
      message: 'Subscription request submitted. Please wait for admin approval.',
      subscription: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error creating subscription:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: err.message
    });
  }
});

// Get user's subscription status
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT us.*, sp.name, sp.price, sp.duration_months, sp.max_conversations
       FROM user_subscriptions us
       LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      subscriptions: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching user subscriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: err.message
    });
  }
});

// Admin: Get pending subscription requests
router.get('/admin/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT us.*, u.email, u.fullname, sp.name, sp.price, sp.duration_months
       FROM user_subscriptions us
       JOIN users u ON us.user_id = u.id
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.status = 'pending' AND us.is_approved = false
       ORDER BY us.created_at DESC`
    );

    res.json({
      success: true,
      requests: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching pending requests:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: err.message
    });
  }
});

// Admin: Approve subscription
router.post('/admin/approve/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    console.log('[v0] Admin approving subscription:', subscriptionId);

    // Get subscription and plan details
    const subResult = await pool.query(
      `SELECT us.*, sp.duration_months FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.id = $1`,
      [subscriptionId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subResult.rows[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + subscription.duration_months);

    // Update subscription
    await pool.query(
      `UPDATE user_subscriptions 
       SET is_approved = true, status = 'active', start_date = $1, end_date = $2, approved_by = $3, approved_at = NOW()
       WHERE id = $4`,
      [startDate, endDate, adminId, subscriptionId]
    );

    // Update user to premium
    await pool.query(
      'UPDATE users SET is_premium = true WHERE id = $1',
      [subscription.user_id]
    );

    // Get user email for notification
    const userResult = await pool.query(
      'SELECT email, fullname FROM users WHERE id = $1',
      [subscription.user_id]
    );

    const user = userResult.rows[0];

    res.json({
      success: true,
      message: 'Subscription approved successfully',
      user_email: user.email,
      end_date: endDate
    });
  } catch (err) {
    console.error('[v0] Error approving subscription:', err);
    res.status(500).json({
      success: false,
      message: 'Error approving subscription',
      error: err.message
    });
  }
});

// Admin: Reject subscription
router.post('/admin/reject/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { adminId, reason } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required'
      });
    }

    console.log('[v0] Admin rejecting subscription:', subscriptionId);

    // Get subscription
    const subResult = await pool.query(
      'SELECT user_id, plan_id FROM user_subscriptions WHERE id = $1',
      [subscriptionId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription
    await pool.query(
      `UPDATE user_subscriptions 
       SET status = 'rejected', rejection_reason = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3`,
      [reason || 'Rejected by admin', adminId, subscriptionId]
    );

    // Get user email
    const userResult = await pool.query(
      'SELECT email, fullname FROM users WHERE id = $1',
      [subResult.rows[0].user_id]
    );

    res.json({
      success: true,
      message: 'Subscription rejected',
      user_email: userResult.rows[0].email,
      reason: reason
    });
  } catch (err) {
    console.error('[v0] Error rejecting subscription:', err);
    res.status(500).json({
      success: false,
      message: 'Error rejecting subscription',
      error: err.message
    });
  }
});

// Admin: Get all subscriptions
router.get('/admin/all', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT us.*, u.email, u.fullname, sp.name, sp.price
                 FROM user_subscriptions us
                 JOIN users u ON us.user_id = u.id
                 JOIN subscription_plans sp ON us.plan_id = sp.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND us.status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY us.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      subscriptions: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching subscriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: err.message
    });
  }
});

module.exports = router;
