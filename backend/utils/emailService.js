const nodemailer = require('nodemailer');
const pool = require('../config/db');

// Email service configuration
const emailConfig = {
  sendpulse: {
    host: process.env.SENDPULSE_SMTP_HOST || 'smtp.sendpulse.com',
    port: parseInt(process.env.SENDPULSE_SMTP_PORT || '587'),
    user: process.env.SENDPULSE_USER,
    pass: process.env.SENDPULSE_PASS,
    maxUsers: parseInt(process.env.SENDPULSE_MAX_USERS || '300'),
    maxEmails: parseInt(process.env.SENDPULSE_MAX_EMAILS || '12000'),
  },
  mailpilt: {
    apiKey: process.env.MAILPILT_API_KEY,
    domain: process.env.MAILPILT_DOMAIN,
  },
  mailpit: {
    host: process.env.MAILPIT_HOST || 'mailpit',
    port: parseInt(process.env.MAILPIT_PORT || '1025'),
  },
};

// Initialize transporters
let sendPulseTransporter = null;
let mailpiltTransporter = null;
let mailpitTransporter = null;

// Initialize SendPulse transporter
const initSendPulse = () => {
  if (emailConfig.sendpulse.user && emailConfig.sendpulse.pass) {
    sendPulseTransporter = nodemailer.createTransport({
      host: emailConfig.sendpulse.host,
      port: emailConfig.sendpulse.port,
      secure: false,
      auth: {
        user: emailConfig.sendpulse.user,
        pass: emailConfig.sendpulse.pass,
      },
    });
    console.log('[Email] SendPulse transporter initialized');
  }
};

// Initialize Mailpilt transporter
const initMailpilt = () => {
  if (emailConfig.mailpilt.apiKey && emailConfig.mailpilt.domain) {
    // Mailpilt uses HTTP API, not SMTP - we'll handle this separately
    console.log('[Email] Mailpilt configured');
  }
};

// Initialize Mailpit transporter (local testing)
const initMailpit = () => {
  mailpitTransporter = nodemailer.createTransport({
    host: emailConfig.mailpit.host,
    port: emailConfig.mailpit.port,
    secure: false,
  });
  console.log('[Email] Mailpit transporter initialized (local testing)');
};

// Initialize all transporters
const initializeEmailService = () => {
  initSendPulse();
  initMailpilt();
  initMailpit();
};

// Check email sending limits
const checkEmailLimits = async () => {
  try {
    // Check unique users count
    const userCountRes = await pool.query('SELECT COUNT(*) as count FROM email_logs WHERE service = $1 AND created_at >= NOW() - INTERVAL \'1 month\'', ['sendpulse']);
    const uniqueUsersRes = await pool.query('SELECT COUNT(DISTINCT recipient_email) as count FROM email_logs WHERE service = $1 AND created_at >= NOW() - INTERVAL \'1 month\'', ['sendpulse']);
    
    const emailsThisMonth = parseInt(userCountRes.rows[0].count);
    const usersThisMonth = parseInt(uniqueUsersRes.rows[0].count);
    
    return {
      usersThisMonth,
      emailsThisMonth,
      usersRemaining: emailConfig.sendpulse.maxUsers - usersThisMonth,
      emailsRemaining: emailConfig.sendpulse.maxEmails - emailsThisMonth,
      canSendToUsers: usersThisMonth < emailConfig.sendpulse.maxUsers,
      canSendEmails: emailsThisMonth < emailConfig.sendpulse.maxEmails,
    };
  } catch (err) {
    console.error('[Email] Error checking limits:', err);
    return null;
  }
};

// Log email sending
const logEmailSend = async (recipientEmail, subject, userId = null, service = 'mailpit') => {
  try {
    await pool.query(
      'INSERT INTO email_logs (user_id, recipient_email, subject, service, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, recipientEmail, subject, service, 'sent']
    );
  } catch (err) {
    console.error('[Email] Error logging email:', err);
  }
};

// Send email with fallback
const sendEmail = async (to, subject, htmlContent, userId = null) => {
  try {
    const limits = await checkEmailLimits();
    
    if (!limits) {
      console.error('[Email] Could not check limits');
      return { success: false, error: 'Could not check email limits' };
    }

    // Check if we can send more emails
    if (!limits.canSendEmails) {
      console.warn('[Email] SendPulse monthly email limit reached');
      return {
        success: false,
        error: `Monthly email limit (${emailConfig.sendpulse.maxEmails}) reached. Using fallback service.`,
      };
    }

    // Try SendPulse first (if configured)
    if (sendPulseTransporter && limits.usersRemaining > 0) {
      try {
        await sendPulseTransporter.sendMail({
          from: `Skill Connect <${emailConfig.sendpulse.user}>`,
          to,
          subject,
          html: htmlContent,
        });
        await logEmailSend(to, subject, userId, 'sendpulse');
        console.log(`[Email] Sent via SendPulse to ${to}`);
        return { success: true, service: 'sendpulse' };
      } catch (err) {
        console.warn('[Email] SendPulse failed, trying fallback:', err.message);
      }
    }

    // Try Mailpit (local development)
    if (mailpitTransporter) {
      try {
        await mailpitTransporter.sendMail({
          from: 'noreply@skillconnect.com',
          to,
          subject,
          html: htmlContent,
        });
        await logEmailSend(to, subject, userId, 'mailpit');
        console.log(`[Email] Sent via Mailpit to ${to}`);
        return { success: true, service: 'mailpit' };
      } catch (err) {
        console.error('[Email] Mailpit failed:', err.message);
      }
    }

    return { success: false, error: 'All email services failed' };
  } catch (err) {
    console.error('[Email] Send error:', err);
    return { success: false, error: err.message };
  }
};

// Send bulk emails to users by category with limit enforcement
const sendBulkEmailsByCategory = async (category, subject, htmlContent) => {
  try {
    const limits = await checkEmailLimits();
    
    if (!limits.canSendEmails) {
      return {
        success: false,
        error: `Monthly email limit (${emailConfig.sendpulse.maxEmails}) reached`,
        sent: 0,
        total: 0,
      };
    }

    // Get users by category
    const usersRes = await pool.query(
      'SELECT id, email, fullname FROM users WHERE status = $1 LIMIT $2',
      [category, limits.usersRemaining]
    );

    const users = usersRes.rows;
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const result = await sendEmail(user.email, subject, htmlContent, user.id);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return {
      success: true,
      category,
      sent,
      failed,
      total: users.length,
      limitInfo: limits,
    };
  } catch (err) {
    console.error('[Email] Bulk send error:', err);
    return { success: false, error: err.message, sent: 0, total: 0 };
  }
};

// Email templates
const emailTemplates = {
  adminMessage: (fullName, message) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2563eb;">Message from Skill Connect Admin</h2>
          <p>Dear ${fullName},</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="white-space: pre-line; margin: 0;">${message}</p>
          </div>
          <p>Best regards,<br/>Skill Connect Team</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `,

  userMessage: (fromName, toName, message) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2563eb;">New Message from ${fromName}</h2>
          <p>Hi ${toName},</p>
          <p>${fromName} has sent you a message on Skill Connect:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="white-space: pre-line; margin: 0;">${message}</p>
          </div>
          <p>
            <a href="${process.env.FRONTEND_URL}/user-dashboard" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View on Skill Connect
            </a>
          </p>
          <p>Best regards,<br/>Skill Connect Team</p>
        </div>
      </body>
    </html>
  `,

  verificationEmail: (fullName, verificationLink) => `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2563eb;">Verify Your Email</h2>
          <p>Welcome ${fullName}! Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>If you did not create an account, please ignore this email.</p>
        </div>
      </body>
    </html>
  `,
};

module.exports = {
  initializeEmailService,
  sendEmail,
  sendBulkEmailsByCategory,
  checkEmailLimits,
  logEmailSend,
  emailTemplates,
};
