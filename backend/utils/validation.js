/*
 * Copyright (c) 2025-2026 Your Company Name
 * All rights reserved.
 */
const validator = require('validator');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return validator.isEmail(email);
};

/**
 * Validate phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  return /^[\d\-\+\(\)\s]{10,}$/.test(phone);
};

/**
 * Sanitize email
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
  return validator.normalizeEmail(email);
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return validator.trim(validator.escape(input));
};

/**
 * Validate required fields
 * @param {Object} data - Data object
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - { isValid: boolean, errors: array }
 */
const validateRequiredFields = (data, requiredFields) => {
  const errors = [];
  
  requiredFields.forEach(field => {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate signup data
 * @param {Object} data - Signup data
 * @returns {Object} - Validation result
 */
const validateSignupData = (data) => {
  const errors = [];
  
  // Check required fields
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  // FIXED: Changed fullName → fullname (matches what frontend sends)
  if (!data.fullname || data.fullname.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!data.status) {
    errors.push('Status is required');
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone format');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} - Validation result
 */
const validateLoginData = (data) => {
  const errors = [];
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('Invalid password format');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  sanitizeEmail,
  sanitizeString,
  validateRequiredFields,
  validateSignupData,
  validateLoginData
};