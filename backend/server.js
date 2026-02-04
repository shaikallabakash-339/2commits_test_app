/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
const express = require("express")
const cors = require("cors")
const fileUpload = require("express-fileupload")
const fs = require("fs")
const path = require("path")
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const messageRoutes = require("./routes/messages")
const uploadRoutes = require("./routes/admin")
const donationRoutes = require("./routes/donations")
const subscriptionRoutes = require("./routes/subscriptions")
const { pool, testConnection } = require("./config/database")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000;

console.log('[v0] Starting Skill Connect Backend Server...');
console.log('[v0] Node environment:', process.env.NODE_ENV || 'development');
console.log('[v0] Server will run on port:', PORT);

// Use /tmp directory for serverless environments like Vercel
const tempDir = process.env.TEMP_DIR || path.join('/tmp', 'uploads');
if (!fs.existsSync(tempDir)) {
  try {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('Temporary directory created:', tempDir);
  } catch (err) {
    console.error('Error creating temporary directory:', err);
  }
}



app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  useTempFiles: true,
  tempFileDir: tempDir // Use /tmp directory for serverless compatibility
}));

// Root route for testing
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend Server is Running' });
});

// Routes
app.use("/api", authRoutes)
app.use("/api", userRoutes)
app.use("/api", messageRoutes)
app.use("/api", uploadRoutes)
app.use("/api", donationRoutes)
app.use("/api/subscriptions", subscriptionRoutes)

// Enhanced Health Check with Database Status
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'OK',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    console.warn('[v0] Health check failed:', err.message);
    res.status(503).json({ 
      status: 'ERROR',
      database: 'disconnected',
      message: err.message
    });
  }
});

// Database ready endpoint - waits for DB to be ready
app.get('/api/ready', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    res.status(200).json({ 
      status: 'ready',
      database: 'available',
      tables: 'initialized'
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'not-ready',
      message: 'Database initialization in progress',
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
