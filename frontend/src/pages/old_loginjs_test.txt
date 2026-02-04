import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { showToast } from '../utils/toast';
import '../styles/login.css';
import '../styles/toast.css';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Show message from signup redirect
  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, 'info', 3000);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.email || !formData.password) {
      const errMsg = 'Please fill in all fields';
      setError(errMsg);
      showToast(errMsg, 'error', 3000);
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('[v0] Logging in with API:', apiUrl);
      
      const res = await axios.post(`${apiUrl}/api/login`, formData);
      
      if (res.data.success) {
        console.log('[v0] Login successful:', res.data.user.email);
        
        // Show success toast
        const successMsg = `Welcome back, ${res.data.user.fullName || res.data.user.email}! Redirecting...`;
        showToast(successMsg, 'success', 2000);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('token', res.data.token || '');
        setSuccessMessage(successMsg);
        
        // Redirect after toast
        setTimeout(() => {
          navigate('/user-dashboard', { state: { user: res.data.user } });
        }, 2000);
      } else {
        const errorMsg = res.data.message || 'Login failed. Please try again.';
        console.log('[v0] Login failed:', errorMsg);
        setError(errorMsg);
        showToast(errorMsg, 'error', 4000);
      }
    } catch (err) {
      console.error('[v0] Login error:', err);
      console.error('[v0] Error response:', err.response?.data);
      
      let errorMsg = 'Login failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMsg = 'Invalid email or password. Please try again.';
      } else if (err.response?.status === 503) {
        errorMsg = 'Server is not ready. Please try again in a moment.';
      } else if (err.message === 'Network Error') {
        errorMsg = 'Cannot connect to server. Please check your connection.';
      }
      
      setError(errorMsg);
      showToast(errorMsg, 'error', 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left side - Visual */}
      <motion.div
        className="login-visual"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="login-visual-content">
          <div className="visual-icon">
            <Sparkles size={80} />
          </div>
          <h2>Welcome Back</h2>
          <p>Connect with professionals and grow your network</p>
          <div className="visual-features">
            <div className="feature-item">
              <div className="feature-dot"></div>
              <p>Real-time messaging</p>
            </div>
            <div className="feature-item">
              <div className="feature-dot"></div>
              <p>Professional networking</p>
            </div>
            <div className="feature-item">
              <div className="feature-dot"></div>
              <p>Career opportunities</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div
        className="login-form-wrapper"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="login-form-container">
          {/* Logo */}
          <div className="form-header">
            <h1>Skill Connect</h1>
            <p>Professional Network</p>
          </div>

          <h2>Login to Your Account</h2>
          <p className="form-subtitle">Enter your credentials to access your dashboard</p>

          {/* Error Message */}
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <motion.div
              className="form-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              className="form-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>

            {/* Remember & Forgot */}
            <div className="form-remember-forgot">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="submit-button"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Sign Up Link */}
          <p className="signup-link">
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </p>

          {/* Admin Login Link */}
          <p className="admin-login-link">
            <Link to="/admin-login">Admin Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
