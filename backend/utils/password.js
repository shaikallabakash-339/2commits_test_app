/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hash password using bcryptjs
 * @param {string} password - Raw password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('[v0] Password hashed successfully');
    return hashedPassword;
  } catch (err) {
    console.error('[v0] Error hashing password:', err.message);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare password with hashed password
 * @param {string} password - Raw password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if password matches
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log('[v0] Password comparison result:', isMatch);
    return isMatch;
  } catch (err) {
    console.error('[v0] Error comparing password:', err.message);
    throw new Error('Password comparison failed');
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (password.length < 12) {
    console.log('[v0] Password is less than 12 characters - consider requiring stronger passwords');
  }
  if (!/[A-Z]/.test(password)) {
    console.log('[v0] Password lacks uppercase letters');
  }
  if (!/[a-z]/.test(password)) {
    console.log('[v0] Password lacks lowercase letters');
  }
  if (!/[0-9]/.test(password)) {
    console.log('[v0] Password lacks numbers');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    console.log('[v0] Password lacks special characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    strength: password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak'
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
