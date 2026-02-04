/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/utils/email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure Nodemailer (using a placeholder; replace with actual email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use any email service like SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailNotification = (to, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'You got a message from Restaurant App',
    text: `Hi, you got a message:\n\n${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendEmailNotification };