import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Check, X, ChevronRight, CreditCard, QrCode, Upload, Camera
} from 'lucide-react';
import axios from 'axios';
import { showToast } from '../utils/toast';
import '../styles/premium.css';

function Premium() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [uploadedScreenshot, setUploadedScreenshot] = useState(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Premium',
      price: '₹100',
      period: '/month',
      description: 'Perfect for getting started',
      benefits: [
        'Unlimited conversations',
        'Message anyone on platform',
        'Priority support',
        '1 GB file storage',
        'Featured profile',
      ],
      color: 'primary',
    },
    {
      id: 'yearly',
      name: 'Yearly Premium',
      price: '₹1000',
      period: '/year',
      description: 'Best value (save 17%)',
      benefits: [
        'Unlimited conversations',
        'Message anyone on platform',
        'Priority support',
        '10 GB file storage',
        'Featured profile',
        'Annual discount badge',
      ],
      color: 'secondary',
      popular: true,
    },
  ];

  // Handle screenshot upload
  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast('Please upload PNG or JPEG image', 'error');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showToast('File size must be less than 2MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('email', user.email);

    setScreenshotUploading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/upload-payment-screenshot`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUploadedScreenshot(res.data.screenshot_url);
        showToast('Screenshot uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Error uploading screenshot:', err);
      showToast('Failed to upload screenshot', 'error');
    } finally {
      setScreenshotUploading(false);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPlan) {
      showToast('Please select a plan', 'error');
      return;
    }

    if (paymentMethod === 'manual' && !uploadedScreenshot) {
      showToast('Please upload payment screenshot', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/activate-premium`, {
        user_id: user.id,
        user_email: user.email,
        plan: selectedPlan,
        payment_method: paymentMethod,
        screenshot_url: paymentMethod === 'manual' ? uploadedScreenshot : null,
      });

      if (res.data.success) {
        // Update user data
        const updatedUser = { ...user, is_premium: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        showToast('Premium activation request submitted! Admin will verify soon.', 'success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      showToast('Failed to submit payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="premium-loading">
        <p>Please login to access premium plans</p>
      </div>
    );
  }

  return (
    <motion.div
      className="premium-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.section
        className="premium-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="header-content">
          <h1>Upgrade to Premium</h1>
          <p>Unlock unlimited possibilities and connect with more professionals</p>
        </div>
      </motion.section>

      {/* Plans Section */}
      <motion.section
        className="premium-plans"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="plans-container">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              className={`plan-card ${plan.popular ? 'popular' : ''} ${
                selectedPlan === plan.id ? 'selected' : ''
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              onClick={() => setSelectedPlan(plan.id)}
              whileHover={{ y: -10 }}
            >
              {plan.popular && (
                <div className="popular-badge">
                  <Zap size={16} />
                  Most Popular
                </div>
              )}

              <div className="plan-header">
                <h2>{plan.name}</h2>
                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-price">
                <span className="price">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>

              <ul className="plan-benefits">
                {plan.benefits.map((benefit, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Check size={18} />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.button
                className={`select-plan-btn ${selectedPlan === plan.id ? 'selected' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Payment Section */}
      {selectedPlan && (
        <motion.section
          className="premium-payment"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="payment-container">
            <h2>Complete Your Payment</h2>

            {/* Payment Method Selection */}
            <div className="payment-methods">
              <label className="payment-method-option">
                <input
                  type="radio"
                  value="qr"
                  checked={paymentMethod === 'qr'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="method-info">
                  <QrCode size={20} />
                  <div>
                    <p className="method-name">QR Code Payment</p>
                    <p className="method-desc">Scan QR code to pay using UPI/Google Pay</p>
                  </div>
                </span>
              </label>

              <label className="payment-method-option">
                <input
                  type="radio"
                  value="manual"
                  checked={paymentMethod === 'manual'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="method-info">
                  <CreditCard size={20} />
                  <div>
                    <p className="method-name">Manual Verification</p>
                    <p className="method-desc">Upload screenshot of payment for admin verification</p>
                  </div>
                </span>
              </label>
            </div>

            {/* QR Code Section */}
            {paymentMethod === 'qr' && (
              <motion.div
                className="qr-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="qr-container">
                  <h3>Scan to Pay</h3>
                  <div className="qr-code">
                    {/* Replace with actual QR code image */}
                    <img
                      src="https://via.placeholder.com/300?text=Payment+QR+Code"
                      alt="Payment QR Code"
                    />
                  </div>
                  <p className="qr-instructions">
                    Scan this QR code with your phone to make the payment
                  </p>

                  <div className="payment-details">
                    <div className="detail-item">
                      <span>Amount:</span>
                      <strong>
                        {selectedPlan === 'monthly' ? '₹100' : '₹1000'}
                      </strong>
                    </div>
                    <div className="detail-item">
                      <span>UPI ID:</span>
                      <strong>skillconnect@upi</strong>
                    </div>
                  </div>

                  <p className="warning-text">
                    After payment, please take a screenshot and upload it below
                  </p>
                </div>
              </motion.div>
            )}

            {/* Screenshot Upload Section */}
            <motion.div
              className="screenshot-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3>
                <Camera size={20} />
                Upload Payment Screenshot
              </h3>

              {uploadedScreenshot ? (
                <div className="screenshot-preview">
                  <img src={uploadedScreenshot} alt="Payment Screenshot" />
                  <p className="success-text">✓ Screenshot uploaded successfully</p>
                  <motion.button
                    className="change-screenshot-btn"
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Change Screenshot
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  className="upload-screenshot-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={screenshotUploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload size={20} />
                  {screenshotUploading ? 'Uploading...' : 'Upload Screenshot'}
                </motion.button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                style={{ display: 'none' }}
              />

              <p className="upload-note">
                PNG or JPEG, max 2MB. Must show payment amount and confirmation.
              </p>
            </motion.div>

            {/* Agreement & Submit */}
            <motion.form
              className="payment-form"
              onSubmit={handlePaymentSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="agreement">
                <input type="checkbox" id="agree" required />
                <label htmlFor="agree">
                  I confirm that I have made the payment as shown in the screenshot
                </label>
              </div>

              <motion.button
                type="submit"
                disabled={submitting || !uploadedScreenshot}
                className="submit-payment-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? 'Processing...' : 'Activate Premium'}
              </motion.button>

              <p className="payment-info">
                Your payment will be verified by our admin team within 24 hours.
              </p>
            </motion.form>
          </div>
        </motion.section>
      )}

      {/* Features Comparison */}
      <motion.section
        className="features-comparison"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2>What You'll Get</h2>

        <div className="comparison-table">
          <div className="table-row header">
            <div className="table-cell feature">Feature</div>
            <div className="table-cell free">Free</div>
            <div className="table-cell premium">Premium</div>
          </div>

          {[
            { feature: 'Conversations Limit', free: '5', premium: 'Unlimited' },
            { feature: 'Message Anyone', free: '✗', premium: '✓' },
            { feature: 'File Storage', free: '1 GB', premium: '10 GB' },
            { feature: 'Priority Support', free: '✗', premium: '✓' },
            { feature: 'Featured Profile', free: '✗', premium: '✓' },
            { feature: 'Advanced Search', free: '✗', premium: '✓' },
          ].map((item, idx) => (
            <div key={idx} className="table-row">
              <div className="table-cell feature">{item.feature}</div>
              <div className="table-cell free">{item.free === '✗' ? <X size={18} /> : item.free}</div>
              <div className="table-cell premium">{item.premium === '✓' ? <Check size={18} /> : item.premium}</div>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

export default Premium;
