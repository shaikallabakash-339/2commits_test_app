/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
const axios = require('axios');
const { pool } = require('../config/database');
require('dotenv').config();

// SendPulse API Configuration
const SENDPULSE_API_URL = 'https://api.sendpulse.com';
const SENDPULSE_API_KEY = process.env.SENDPULSE_API_KEY;
const SENDPULSE_API_SECRET = process.env.SENDPULSE_API_SECRET;

// Limits
const MAX_RECIPIENTS_PER_BATCH = 300;
const MAX_EMAILS_PER_MONTH = 12000;

/**
 * Get SendPulse access token
 */
const getAccessToken = async () => {
  try {
    const response = await axios.post(`${SENDPULSE_API_URL}/oauth/access_token`, {
      grant_type: 'client_credentials',
      client_id: SENDPULSE_API_KEY,
      client_secret: SENDPULSE_API_SECRET,
    });

    return response.data.access_token;
  } catch (err) {
    console.error('[v0] Error getting SendPulse access token:', err.message);
    throw err;
  }
};

/**
 * Check email limit for the month
 */
const checkEmailLimit = async () => {
  try {
    const query = `
      SELECT COUNT(*) as total_emails
      FROM email_logs
      WHERE service = 'sendpulse'
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
    `;

    const result = await pool.query(query);
    const emailsSent = parseInt(result.rows[0].total_emails);

    return {
      limit: MAX_EMAILS_PER_MONTH,
      sent: emailsSent,
      remaining: MAX_EMAILS_PER_MONTH - emailsSent,
      canSend: emailsSent < MAX_EMAILS_PER_MONTH,
    };
  } catch (err) {
    console.error('[v0] Error checking email limit:', err.message);
    throw err;
  }
};

/**
 * Send email via SendPulse with limit checking
 */
const sendEmail = async (to, subject, body, userId = null) => {
  try {
    // Check limit
    const limitCheck = await checkEmailLimit();
    
    if (!limitCheck.canSend) {
      console.warn('[v0] SendPulse monthly limit reached');
      return {
        success: false,
        message: 'Monthly email limit reached',
        limitReached: true,
      };
    }

    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${SENDPULSE_API_URL}/smtp/emails`,
      {
        email: {
          recipients: [
            {
              address: to,
            },
          ],
          subject: subject,
          text: body,
          from: {
            name: 'Skill Connect',
            email: process.env.SENDPULSE_FROM_EMAIL || 'noreply@skillconnect.com',
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Log email
    await logEmail(userId, to, subject, body, 'sendpulse', 'sent');

    return {
      success: true,
      messageId: response.data.result.id,
      remaining: limitCheck.remaining - 1,
    };
  } catch (err) {
    console.error('[v0] Error sending email via SendPulse:', err.message);
    
    // Log failed email
    await logEmail(userId, to, subject, body, 'sendpulse', 'failed');

    return {
      success: false,
      message: err.message,
    };
  }
};

/**
 * Send batch emails to multiple recipients (max 300 per batch)
 */
const sendBatchEmail = async (recipients, subject, body, userId = null) => {
  try {
    // Check limit
    const limitCheck = await checkEmailLimit();
    const emailsToSend = Math.min(recipients.length, MAX_RECIPIENTS_PER_BATCH);

    if (emailsToSend === 0) {
      return {
        success: false,
        message: 'No recipients to send to or limit reached',
      };
    }

    if (!limitCheck.canSend) {
      return {
        success: false,
        message: 'Monthly email limit reached',
        limitReached: true,
      };
    }

    const accessToken = await getAccessToken();

    // Split recipients into batches of 300
    const batches = [];
    for (let i = 0; i < emailsToSend; i += MAX_RECIPIENTS_PER_BATCH) {
      batches.push(recipients.slice(i, i + MAX_RECIPIENTS_PER_BATCH));
    }

    const results = [];

    for (const batch of batches) {
      const response = await axios.post(
        `${SENDPULSE_API_URL}/smtp/emails`,
        {
          email: {
            recipients: batch.map(email => ({ address: email })),
            subject: subject,
            text: body,
            from: {
              name: 'Skill Connect',
              email: process.env.SENDPULSE_FROM_EMAIL || 'noreply@skillconnect.com',
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Log emails
      for (const email of batch) {
        await logEmail(userId, email, subject, body, 'sendpulse', 'sent');
      }

      results.push({
        batchSize: batch.length,
        messageId: response.data.result.id,
      });
    }

    return {
      success: true,
      batches: results,
      totalSent: emailsToSend,
      totalRequested: recipients.length,
      capped: recipients.length > emailsToSend,
      remaining: limitCheck.remaining - emailsToSend,
    };
  } catch (err) {
    console.error('[v0] Error sending batch email:', err.message);
    return {
      success: false,
      message: err.message,
    };
  }
};

/**
 * Send email to users by status (employed, pursuing, graduate)
 */
const sendEmailByStatus = async (status, subject, body, adminId = null) => {
  try {
    // Get users by status (max 300 per send)
    const query = `
      SELECT email FROM users
      WHERE status = $1
      LIMIT 300
    `;

    const result = await pool.query(query, [status]);
    const recipients = result.rows.map(row => row.email);

    if (recipients.length === 0) {
      return {
        success: false,
        message: `No users found with status: ${status}`,
      };
    }

    // Send batch email
    const sendResult = await sendBatchEmail(recipients, subject, body, adminId);

    // Also send admin notification
    if (sendResult.success) {
      await logEmail(adminId, null, `Bulk email sent to ${status} users`, subject, 'sendpulse', 'sent');
    }

    return sendResult;
  } catch (err) {
    console.error('[v0] Error sending email by status:', err.message);
    return {
      success: false,
      message: err.message,
    };
  }
};

/**
 * Log email in database
 */
const logEmail = async (userId, recipientEmail, subject, body, service, status) => {
  try {
    const query = `
      INSERT INTO email_logs (user_id, recipient_email, subject, body, service, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await pool.query(query, [userId, recipientEmail, subject, body, service, status]);
    return result.rows[0];
  } catch (err) {
    console.error('[v0] Error logging email:', err.message);
  }
};

/**
 * Get email statistics
 */
const getEmailStats = async () => {
  try {
    const limitCheck = await checkEmailLimit();
    
    const query = `
      SELECT 
        service,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM email_logs
      WHERE service = 'sendpulse'
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
      GROUP BY service
    `;

    const result = await pool.query(query);
    const stats = result.rows[0] || {
      service: 'sendpulse',
      total: 0,
      sent: 0,
      failed: 0,
    };

    return {
      stats: stats,
      limit: limitCheck,
    };
  } catch (err) {
    console.error('[v0] Error getting email stats:', err.message);
    throw err;
  }
};

module.exports = {
  sendEmail,
  sendBatchEmail,
  sendEmailByStatus,
  getAccessToken,
  checkEmailLimit,
  getEmailStats,
  logEmail,
};
