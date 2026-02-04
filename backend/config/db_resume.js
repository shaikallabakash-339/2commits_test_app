/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// backend/config/db_resume.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Same CockroachDB URL
  ssl: { rejectUnauthorized: false }
});

// Function to check if resumes table exists
const initTables = async () => {
  try {
    const result = await pool.query('SELECT * FROM resumes LIMIT 1');
    console.log('Resumes table exists and is accessible.');
  } catch (err) {
    console.error('Error checking resumes table:', err.message);
    console.log('Ensure the "resumes" table is created in CockroachDB.');
  }
};

initTables();

module.exports = pool;