/*
 * Copyright (c) 2025-2026 Your Company Name
 * All rights reserved.
 */
// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import '../styles/login.css'; // Reusing login.css for consistent styling

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password', { email, newPassword });
      if (res.data.success) {
        setMessage('Password updated successfully! You can now login with the new password.');
      } else {
        setMessage('Email not found!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-form"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Reset Your Password</h2>
        <form onSubmit={handleSubmit}>
          <motion.input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            whileFocus={{ scale: 1.02, borderColor: '#3498db' }}
            transition={{ duration: 0.2 }}
          />
          <motion.input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
            whileFocus={{ scale: 1.02, borderColor: '#3498db' }}
            transition={{ duration: 0.2 }}
          />
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </motion.button>
        </form>
        <p>{message}</p>
      </motion.div>
      <Footer />
    </div>
  );
}

export default ForgotPassword;