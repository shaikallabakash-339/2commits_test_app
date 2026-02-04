import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Eye, Download, Mail } from 'lucide-react';
import axios from 'axios';
import '../styles/admin-subscriptions.css';

function AdminSubscriptions() {
  const [pendingRequests, setP endingRequests] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      if (filter === 'pending') {
        const res = await axios.get('http://localhost:5000/api/subscriptions/admin/pending');
        setP endingRequests(res.data.requests);
      } else {
        const res = await axios.get(`http://localhost:5000/api/subscriptions/admin/all?status=${filter}`);
        setAllSubscriptions(res.data.subscriptions);
      }
    } catch (err) {
      console.error('[v0] Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subscriptionId, adminId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/subscriptions/admin/approve/${subscriptionId}`,
        { adminId }
      );

      if (res.data.success) {
        // Send email notification
        await axios.post('http://localhost:5000/api/send-subscription-email', {
          email: res.data.user_email,
          type: 'approved',
          end_date: res.data.end_date
        });

        alert('Subscription approved and email sent!');
        setSelectedSubscription(null);
        setShowModal(false);
        fetchSubscriptions();
      }
    } catch (err) {
      console.error('[v0] Error approving subscription:', err);
      alert('Failed to approve subscription');
    }
  };

  const handleReject = async (subscriptionId, adminId) => {
    if (!rejectReason) {
      alert('Please enter a rejection reason');
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/subscriptions/admin/reject/${subscriptionId}`,
        { adminId, reason: rejectReason }
      );

      if (res.data.success) {
        alert('Subscription rejected');
        setSelectedSubscription(null);
        setShowModal(false);
        setRejectReason('');
        fetchSubscriptions();
      }
    } catch (err) {
      console.error('[v0] Error rejecting subscription:', err);
      alert('Failed to reject subscription');
    }
  };

  const displayRequests = filter === 'pending' ? pendingRequests : allSubscriptions;

  return (
    <motion.div
      className="admin-subscriptions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="section-header">
        <h3>Subscription Management</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending {pendingRequests.length > 0 && <span className="badge">{pendingRequests.length}</span>}
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading subscriptions...</p>
      ) : displayRequests.length === 0 ? (
        <p className="empty-message">No subscriptions found</p>
      ) : (
        <div className="subscriptions-table">
          <div className="table-header">
            <div>User</div>
            <div>Email</div>
            <div>Plan</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {displayRequests.map((sub) => (
            <motion.div
              key={sub.id}
              className={`table-row status-${sub.status}`}
              whileHover={{ backgroundColor: '#f9f9f9' }}
            >
              <div className="user-col">
                <span className="user-avatar">{sub.fullname.charAt(0)}</span>
                <span>{sub.fullname}</span>
              </div>
              <div>{sub.email}</div>
              <div className="plan-col">{sub.name}</div>
              <div className="amount-col">₹{sub.price}</div>
              <div>
                <span className={`status-badge status-${sub.status}`}>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </div>
              <div className="actions-col">
                {filter === 'pending' && (
                  <>
                    <button
                      className="action-btn approve"
                      title="Approve"
                      onClick={() => {
                        setSelectedSubscription(sub);
                        setShowModal(true);
                      }}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      className="action-btn reject"
                      title="Reject"
                      onClick={() => {
                        setSelectedSubscription(sub);
                        setShowModal(true);
                      }}
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
                <button
                  className="action-btn view"
                  title="View Details"
                  onClick={() => {
                    setSelectedSubscription(sub);
                    setShowModal(true);
                  }}
                >
                  <Eye size={18} />
                </button>
                {sub.payment_screenshot_url && (
                  <a
                    href={sub.payment_screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn download"
                    title="Download Screenshot"
                  >
                    <Download size={18} />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedSubscription && (
        <motion.div
          className="sub-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            className="sub-modal"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h4>Subscription Details</h4>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="detail-row">
                <span className="label">User Name:</span>
                <span className="value">{selectedSubscription.fullname}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{selectedSubscription.email}</span>
              </div>
              <div className="detail-row">
                <span className="label">Plan:</span>
                <span className="value">{selectedSubscription.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount:</span>
                <span className="value">₹{selectedSubscription.price}</span>
              </div>
              <div className="detail-row">
                <span className="label">Duration:</span>
                <span className="value">{selectedSubscription.duration_months} months</span>
              </div>
              <div className="detail-row">
                <span className="label">Transaction ID:</span>
                <span className="value">{selectedSubscription.transaction_proof}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`status-badge status-${selectedSubscription.status}`}>
                  {selectedSubscription.status}
                </span>
              </div>

              {selectedSubscription.payment_screenshot_url && (
                <div className="detail-row">
                  <span className="label">Payment Screenshot:</span>
                  <img
                    src={selectedSubscription.payment_screenshot_url}
                    alt="Payment"
                    className="payment-img"
                  />
                </div>
              )}

              {selectedSubscription.status === 'pending' && (
                <div className="action-section">
                  <div>
                    <label>Rejection Reason (if rejecting):</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="reason-input"
                    />
                  </div>

                  <div className="button-group">
                    <button
                      className="btn approve-btn"
                      onClick={() => handleApprove(selectedSubscription.id, 'admin-id')}
                    >
                      <Check size={18} /> Approve
                    </button>
                    <button
                      className="btn reject-btn"
                      onClick={() => handleReject(selectedSubscription.id, 'admin-id')}
                    >
                      <X size={18} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default AdminSubscriptions;
