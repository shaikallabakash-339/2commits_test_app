import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertCircle, Upload, QrCode } from 'lucide-react';
import axios from 'axios';
import '../styles/payment-modal.css';

function PaymentModal({ isOpen, onClose, user, onSubscriptionSuccess }) {
  const [step, setStep] = useState(1); // 1: Plans, 2: Payment, 3: Confirmation
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [transactionProof, setTransactionProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      setStep(1);
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/subscriptions/plans');
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('[v0] Error fetching plans:', err);
      setError('Failed to load subscription plans');
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      setError('');
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentScreenshot || !transactionProof) {
      setError('Please upload screenshot and enter transaction ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload screenshot to MinIO
      const formData = new FormData();
      formData.append('file', paymentScreenshot);

      const uploadRes = await axios.post('http://localhost:5000/api/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const screenshotUrl = uploadRes.data.url;

      // Create subscription request
      const subRes = await axios.post('http://localhost:5000/api/subscriptions/request', {
        user_id: user.id,
        plan_id: selectedPlan.id,
        payment_screenshot_url: screenshotUrl,
        transaction_proof: transactionProof
      });

      if (subRes.data.success) {
        setSuccess(true);
        setStep(3);
        setTimeout(() => {
          if (onSubscriptionSuccess) {
            onSubscriptionSuccess();
          }
        }, 3000);
      }
    } catch (err) {
      console.error('[v0] Error submitting payment:', err);
      setError(err.response?.data?.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="payment-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="payment-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Upgrade to Premium</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Select Plan</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Payment</div>
          <div className={`step ${step === 3 ? 'active' : ''}`}>3. Confirmation</div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="error-alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Step 1: Select Plan */}
        {step === 1 && (
          <motion.div
            className="step-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>Choose Your Plan</h3>
            <div className="plans-grid">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  className="plan-card"
                  whileHover={{ translateY: -5 }}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <div className="plan-header">
                    <h4>{plan.name}</h4>
                    <p className="plan-duration">{plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''}</p>
                  </div>
                  <div className="plan-price">
                    <span className="currency">₹</span>
                    <span className="amount">{plan.price}</span>
                  </div>
                  <ul className="plan-features">
                    <li><Check size={16} /> {plan.max_conversations} conversations</li>
                    <li><Check size={16} /> {plan.max_resumes} resumes</li>
                    {plan.priority_support && <li><Check size={16} /> Priority support</li>}
                  </ul>
                  <button className="select-btn">Select Plan</button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && selectedPlan && (
          <motion.div
            className="step-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>Payment Details</h3>
            
            <div className="payment-summary">
              <div className="summary-item">
                <span>Plan:</span>
                <strong>{selectedPlan.name}</strong>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <strong>{selectedPlan.duration_months} months</strong>
              </div>
              <div className="summary-total">
                <span>Total:</span>
                <strong>₹{selectedPlan.price}</strong>
              </div>
            </div>

            <div className="qr-code-section">
              <QrCode size={120} />
              <p>Scan QR code to pay via UPI/Phone Pay</p>
            </div>

            <form onSubmit={handleSubmitPayment} className="payment-form">
              {/* File Upload */}
              <div className="form-group">
                <label>Upload Payment Screenshot</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <div className="upload-area">
                    <Upload size={32} />
                    <p>Click to upload or drag and drop</p>
                    {paymentScreenshot && (
                      <p className="file-name">✓ {paymentScreenshot.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction Proof */}
              <div className="form-group">
                <label>Transaction ID / Reference Number</label>
                <input
                  type="text"
                  value={transactionProof}
                  onChange={(e) => setTransactionProof(e.target.value)}
                  placeholder="Enter transaction ID (e.g., TXN123456789)"
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading || !paymentScreenshot || !transactionProof}
                >
                  {loading ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && success && (
          <motion.div
            className="step-content confirmation"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h3>Payment Submitted Successfully!</h3>
            <p>
              Your subscription request has been received. 
              An admin will review your payment within 24 hours.
            </p>
            <p className="info-text">
              You'll receive an email notification once your subscription is approved.
            </p>
            <button className="confirm-btn" onClick={onClose}>
              Close
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default PaymentModal;
