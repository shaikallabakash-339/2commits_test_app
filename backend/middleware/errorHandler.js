/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// Error handling middleware

const errorHandler = (err, req, res, next) => {
  console.error('[v0] Error:', {
    message: err.message,
    code: err.code,
    status: err.status || 500
  });

  // Database errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference',
      error: 'FOREIGN_KEY_VIOLATION'
    });
  }

  if (err.code === '42P01') {
    return res.status(500).json({
      success: false,
      message: 'Database table not found',
      error: 'TABLE_NOT_FOUND'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Authentication errors
  if (err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'UNAUTHORIZED'
    });
  }

  // Generic server error
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;
