/*
 * Copyright (c) 2026 Your Company Name
 * All rights reserved.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Briefcase, GraduationCap, Calendar, ArrowRight } from 'lucide-react';
import { showToast } from '../utils/toast';
import '../styles/signup.css';
import '../styles/toast.css';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    fullname: '',
    password: '',
    company_name: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    dob: '',
    status: '',
    qualification: '',
    branch: '',
    passoutyear: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.email || !formData.fullname || !formData.password) {
        setError('Please fill in all required fields');
        return false;
      }
      // Added: Frontend check for full name length
      if (formData.fullname.trim().length < 2) {
        setError('Full name must have at least 2 characters');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.status || !formData.dob) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Debug: Log exactly what is being sent to backend
    console.log('[Frontend] Sending signup data:', JSON.stringify(formData, null, 2));

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/signup`, formData);

      if (res.data.success) {
        console.log('[Frontend] Signup successful:', res.data.user);
        showToast('Account created successfully! Redirecting to login...', 'success', 3000);

        // Optional: store user (if you want auto-login)
        localStorage.setItem('user', JSON.stringify(res.data.user));

        setTimeout(() => {
          navigate('/login', { state: { message: 'Account created! Please login with your credentials.' } });
        }, 3000);
      } else {
        const errorMsg = res.data.message || 'Signup failed. Please try again.';
        setError(errorMsg);
        showToast(errorMsg, 'error', 4000);
      }
    } catch (err) {
      console.error('[Frontend] Signup error:', err);
      console.error('[Frontend] Error response:', err.response?.data);

      let errorMsg = 'Signup failed. Please try again.';

      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 409) {
        errorMsg = 'Email already exists. Please use a different email.';
      } else if (err.response?.status === 503) {
        errorMsg = 'Server is not ready. Please try again in a moment.';
      } else if (err.message === 'Network Error') {
        errorMsg = 'Cannot connect to server. Please check your connection.';
      }

      setError(errorMsg);
      showToast(errorMsg, 'error', 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = {
    step1: [
      { name: 'email', type: 'email', placeholder: 'your@email.com', label: 'Email Address', icon: Mail, required: true },
      { name: 'fullname', type: 'text', placeholder: 'John Doe', label: 'Full Name', icon: User, required: true },
      { name: 'password', type: 'password', placeholder: '••••••••', label: 'Password', icon: Lock, required: true },
    ],
    step2: [
      { name: 'phone', type: 'tel', placeholder: '+1 (555) 123-4567', label: 'Phone Number', icon: Phone },
      { name: 'city', type: 'text', placeholder: 'New York', label: 'City', icon: MapPin },
      { name: 'company_name', type: 'text', placeholder: 'Your Company (Optional)', label: 'Company Name', icon: Briefcase },
      { name: 'dob', type: 'date', label: 'Date of Birth', icon: Calendar, required: true },
      { name: 'state', type: 'text', placeholder: 'NY', label: 'State' },
      { name: 'country', type: 'text', placeholder: 'USA', label: 'Country' },
      { name: 'status', type: 'select', label: 'Current Status', icon: Briefcase, required: true,
        options: [
          { value: '', label: 'Select Status' },
          { value: 'employed', label: 'Employed' },
          { value: 'graduated', label: 'Graduated' },
          { value: 'pursuing', label: 'Pursuing' }
        ]
      },
      { name: 'qualification', type: 'text', placeholder: 'B.Tech, M.A., etc.', label: 'Qualification', icon: GraduationCap },
      { name: 'branch', type: 'text', placeholder: 'Computer Science', label: 'Branch/Field' },
      { name: 'passoutyear', type: 'text', placeholder: '2024', label: 'Passout Year', icon: Calendar },
    ]
  };

  const currentFields = step === 1 ? fields.step1 : fields.step2;

  return (
    <div className="signup-container">
      {/* Left side - Visual */}
      <motion.div
        className="signup-visual"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="signup-visual-content">
          <div className="visual-progress">
            <div className="progress-step">
              <div className={`progress-circle ${step >= 1 ? 'active' : ''}`}>1</div>
              <p>Basic Info</p>
            </div>
            <div className="progress-line"></div>
            <div className="progress-step">
              <div className={`progress-circle ${step >= 2 ? 'active' : ''}`}>2</div>
              <p>Details</p>
            </div>
          </div>

          <h2>Join Our Community</h2>
          <p>Connect with professionals, share skills, and grow your network</p>

          <div className="visual-features">
            <div className="feature-item">
              <div className="feature-check">✓</div>
              <p>Build professional connections</p>
            </div>
            <div className="feature-item">
              <div className="feature-check">✓</div>
              <p>Share and discover opportunities</p>
            </div>
            <div className="feature-item">
              <div className="feature-check">✓</div>
              <p>Real-time messaging</p>
            </div>
            <div className="feature-item">
              <div className="feature-check">✓</div>
              <p>Expand your professional circle</p>
            </div>
          </div>

          {step === 1 && (
            <p className="visual-hint">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div
        className="signup-form-wrapper"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="signup-form-container">
          <div className="form-header">
            <h1>Skill Connect</h1>
            <p>Professional Network</p>
          </div>

          <h2>{step === 1 ? 'Create Your Account' : 'Complete Your Profile'}</h2>
          <p className="form-subtitle">
            {step === 1 ? 'Get started in seconds' : 'Help us know you better'}
          </p>

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
            <motion.div
              className="form-fields-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {currentFields.map((field, index) => {
                const IconComponent = field.icon;
                return (
                  <motion.div
                    key={field.name}
                    className="form-group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {field.label && (
                      <label>
                        {field.label}
                        {field.required && <span className="required">*</span>}
                      </label>
                    )}
                    <div className="input-wrapper">
                      {IconComponent && <IconComponent size={20} className="input-icon" />}
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          required={field.required}
                        >
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="form-actions">
              {step === 2 && (
                <motion.button
                  type="button"
                  className="back-button"
                  onClick={() => setStep(1)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back
                </motion.button>
              )}

              <motion.button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? 'Creating Account...' : step === 1 ? 'Continue' : 'Create Account'}
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </form>

          <p className="login-link">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Signup;