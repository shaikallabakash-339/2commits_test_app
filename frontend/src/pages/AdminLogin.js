/*
 * Copyright (c) 2026 Your Company Name
 * All rights reserved.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import '../styles/admin-login.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Hardcoded admin credentials for demo
      if (formData.email === 'admin@skillconnect.com' && formData.password === 'admin123') {
        localStorage.setItem('admin', JSON.stringify({ email: formData.email }));
        navigate('/admin-dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('[v0] Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <motion.div
        className="admin-login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="admin-login-header">
          <h1>Admin Panel</h1>
          <p>Skill Connect Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-group">
            <label htmlFor="email">Email Address</label>
            <div className="admin-input-wrapper">
              <Mail size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@skillconnect.com"
                required
              />
            </div>
          </div>

          <div className="admin-login-group">
            <label htmlFor="password">Password</label>
            <div className="admin-input-wrapper">
              <Lock size={20} />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div
              className="admin-error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="admin-login-btn"
          >
            {loading ? 'Logging in...' : (
              <>
                <LogIn size={18} /> Login to Admin Panel
              </>
            )}
          </motion.button>
        </form>

        <div className="admin-login-footer">
          <p>Demo credentials:</p>
          <p>Email: <strong>admin@skillconnect.com</strong></p>
          <p>Password: <strong>admin123</strong></p>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminLogin;
