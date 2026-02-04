#!/usr/bin/env node

/**
 * Database Validation Script
 * Checks if PostgreSQL is properly set up with all required tables
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const requiredTables = ['users', 'messages', 'resumes', 'old_age_homes', 'orphans', 'transactions'];

async function validateDatabase() {
  console.log('\n📊 PostgreSQL Database Validation\n');
  console.log('═'.repeat(50));

  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log(`   Connected to: ${process.env.DATABASE_URL.split('@')[1] || 'unknown'}\n`);

    // Check tables
    console.log('🔍 Checking for required tables...');
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    
    const existingTables = result.rows.map(row => row.table_name);
    
    let allTablesExist = true;
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (MISSING)`);
        allTablesExist = false;
      }
    }

    // Check for additional tables
    const extraTables = existingTables.filter(t => !requiredTables.includes(t));
    if (extraTables.length > 0) {
      console.log('\n📌 Additional tables found:');
      extraTables.forEach(table => console.log(`   • ${table}`));
    }

    // Get record counts
    console.log('\n📈 Record counts:');
    for (const table of requiredTables.filter(t => existingTables.includes(t))) {
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = countResult.rows[0].count;
      console.log(`   ${table}: ${count} records`);
    }

    console.log('\n═'.repeat(50));
    
    if (allTablesExist) {
      console.log('✅ All required tables are present!\n');
      console.log('Your database is ready for the application.\n');
      process.exit(0);
    } else {
      console.log('❌ Some tables are missing!\n');
      console.log('Run: psql -U postgres -d your_db -f scripts/postgres-migration.sql\n');
      process.exit(1);
    }

  } catch (err) {
    console.log('\n❌ Database validation failed!\n');
    console.error('Error:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify DATABASE_URL in .env file');
    console.log('3. Ensure database exists');
    console.log('\nExample DATABASE_URL:');
    console.log('postgresql://postgres:password@localhost:5432/your_app_db\n');
    process.exit(1);
  }
}

validateDatabase();
