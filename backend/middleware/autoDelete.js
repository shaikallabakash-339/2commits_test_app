/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/middleware/autoDelete.js
const supabase = require('../config/db');

// Function to delete messages older than 2 days
const deleteOldMessages = async () => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .lt('timestamp', twoDaysAgo);
    if (error) throw error;
    console.log('Old messages deleted:', data);
  } catch (err) {
    console.error('Error deleting old messages:', err);
  }
};

// Run every hour
setInterval(deleteOldMessages, 60 * 60 * 1000);

module.exports = deleteOldMessages;