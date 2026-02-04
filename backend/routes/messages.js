/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { sendEmail, sendEmailByStatus } = require('../utils/sendpulseService');
const { sanitizeString, sanitizeEmail } = require('../utils/validation');

/**
 * ADMIN MESSAGE ROUTES - Send messages to users by status
 */

// Send message to users by status (employed, pursuing, graduated)
router.post('/send-message', async (req, res) => {
  const { category, message, adminId } = req.body;
  
  try {
    console.log('[v0] Sending message for category:', category);
    
    if (!category || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category and message are required' 
      });
    }

    const timestamp = new Date().toISOString();
    
    // Store message in database
    const insertQuery = `
      INSERT INTO messages (category, message, timestamp) 
      VALUES ($1, $2, $3) 
      RETURNING id, category, message, timestamp
    `;
    const insertResult = await pool.query(insertQuery, [
      sanitizeString(category), 
      sanitizeString(message), 
      timestamp
    ]);

    // Fetch users in the specified category
    const usersQuery = 'SELECT id, email, fullname FROM users WHERE status = $1';
    const usersResult = await pool.query(usersQuery, [category]);

    console.log('[v0] Found', usersResult.rows.length, 'users to notify');

    // Create notifications for each user
    for (const user of usersResult.rows) {
      const notificationQuery = `
        INSERT INTO notifications (user_id, title, message, is_read)
        VALUES ($1, $2, $3, false)
      `;
      await pool.query(notificationQuery, [user.id, 'New Message from Admin', message]);
    }

    // Send email using SendPulse (with 300 user limit)
    const recipients = usersResult.rows.map(u => u.email);
    const emailResult = await sendEmail(
      recipients[0],
      'New Message from Skill Connect',
      message,
      adminId
    );

    console.log('[v0] Message sent successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: insertResult.rows[0].id,
      recipientCount: usersResult.rows.length,
      emailStatus: emailResult
    });
  } catch (err) {
    console.error('[v0] Error sending message:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get admin messages by category
router.get('/messages', async (req, res) => {
  const { category } = req.query;
  try {
    console.log('[v0] Fetching messages for category:', category);

    let query = 'SELECT * FROM messages WHERE 1=1';
    const values = [];
    
    if (category) {
      query += ' AND category = $1';
      values.push(category);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT 100';
    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      messages: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching messages:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching messages', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get message statistics
router.get('/message-stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        category,
        COUNT(*) as count,
        MAX(timestamp) as latest
      FROM messages
      GROUP BY category
    `;
    const result = await pool.query(query);

    const stats = {
      employed: 0,
      pursuing: 0,
      graduated: 0
    };

    result.rows.forEach(row => {
      stats[row.category] = row.count;
    });

    res.status(200).json({
      success: true,
      totalMessages: result.rows.reduce((sum, row) => sum + row.count, 0),
      categoryCount: stats,
      messages: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching message stats:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching message stats', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

/**
 * USER-TO-USER MESSAGE ROUTES - Real-time chat
 */

// Send message to another user
router.post('/user-message/send', async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  try {
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Sender, receiver, and message are required'
      });
    }

    // Check if sender is premium or has available chats (max 5 for free users)
    const senderQuery = `SELECT is_premium FROM users WHERE id = $1`;
    const senderResult = await pool.query(senderQuery, [senderId]);
    
    if (senderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }

    const senderData = senderResult.rows[0];

    // Check conversation limit for free users
    if (!senderData.is_premium) {
      const conversationQuery = `
        SELECT COUNT(DISTINCT contact_id) as conversation_count
        FROM conversations
        WHERE user_id = $1 AND is_active = true
      `;
      const conversationResult = await pool.query(conversationQuery, [senderId]);
      const conversationCount = parseInt(conversationResult.rows[0].conversation_count);

      // Check if this is a new contact
      const existingConversationQuery = `
        SELECT id FROM conversations
        WHERE user_id = $1 AND contact_id = $2
      `;
      const existingResult = await pool.query(existingConversationQuery, [senderId, receiverId]);

      if (existingResult.rows.length === 0 && conversationCount >= 5) {
        return res.status(403).json({
          success: false,
          message: 'You have reached the maximum number of chats (5). Upgrade to premium to chat with more users.',
          currentChats: conversationCount,
          limit: 5
        });
      }
    }

    // Insert message
    const messageQuery = `
      INSERT INTO user_messages (sender_id, receiver_id, message, is_read)
      VALUES ($1, $2, $3, false)
      RETURNING id, created_at
    `;
    const messageResult = await pool.query(messageQuery, [senderId, receiverId, sanitizeString(message)]);

    // Update or create conversation
    const conversationQuery = `
      INSERT INTO conversations (user_id, contact_id, last_message, last_message_time)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, contact_id) DO UPDATE SET
        last_message = $3,
        last_message_time = NOW(),
        is_active = true
      RETURNING id
    `;
    await pool.query(conversationQuery, [senderId, receiverId, sanitizeString(message)]);

    // Create notification for receiver
    const notificationQuery = `
      INSERT INTO notifications (user_id, title, message, is_read)
      VALUES ($1, $2, $3, false)
    `;
    const senderNameQuery = `SELECT fullname, email FROM users WHERE id = $1`;
    const senderNameResult = await pool.query(senderNameQuery, [senderId]);
    const senderName = senderNameResult.rows[0]?.fullname || 'A user';

    await pool.query(notificationQuery, [
      receiverId,
      'New Message',
      `${senderName} sent you a message`
    ]);

    // Send email notification to receiver (optional, can be limited)
    const receiverEmailQuery = `SELECT email FROM users WHERE id = $1`;
    const receiverEmailResult = await pool.query(receiverEmailQuery, [receiverId]);
    if (receiverEmailResult.rows.length > 0) {
      sendEmail(
        receiverEmailResult.rows[0].email,
        'New Message on Skill Connect',
        `${senderName} sent you a message: "${message}"`,
        senderId
      ).catch(err => console.error('[v0] Email notification failed:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      messageId: messageResult.rows[0].id,
      createdAt: messageResult.rows[0].created_at
    });
  } catch (err) {
    console.error('[v0] Error sending user message:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get messages between two users
router.get('/user-message/:senderId/:receiverId', async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const query = `
      SELECT id, sender_id, receiver_id, message, is_read, created_at
      FROM user_messages
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [senderId, receiverId]);

    // Mark messages as read
    const updateQuery = `
      UPDATE user_messages
      SET is_read = true
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
    `;
    await pool.query(updateQuery, [senderId, receiverId]);

    res.status(200).json({
      success: true,
      messages: result.rows
    });
  } catch (err) {
    console.error('[v0] Error fetching messages:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT 
        c.id,
        c.contact_id,
        u.fullname,
        u.profile_image_url,
        u.company_name,
        c.last_message,
        c.last_message_time,
        c.is_active
      FROM conversations c
      JOIN users u ON c.contact_id = u.id
      WHERE c.user_id = $1 AND c.is_active = true
      ORDER BY c.last_message_time DESC
    `;

    const result = await pool.query(query, [userId]);

    res.status(200).json({
      success: true,
      conversations: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('[v0] Error fetching conversations:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

/**
 * NOTIFICATIONS
 */

// Get notifications for a user
router.get('/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  const { unreadOnly } = req.query;

  try {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const values = [userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      notifications: result.rows,
      unreadCount: result.rows.filter(n => !n.is_read).length
    });
  } catch (err) {
    console.error('[v0] Error fetching notifications:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;

  try {
    const query = 'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [notificationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      notification: result.rows[0]
    });
  } catch (err) {
    console.error('[v0] Error marking notification as read:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

module.exports = router;
