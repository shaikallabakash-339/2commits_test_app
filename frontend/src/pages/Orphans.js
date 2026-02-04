import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Heart, Share2, MapPin, Phone, Mail, QrCode, ArrowRight, Users,
  Search, Filter, DollarSign, Gift
} from 'lucide-react';
import '../styles/donations.css';

function Orphans() {
  const navigate = useNavigate();
  const [orphans, setOrphans] = useState([]);
  const [filteredOrphans, setFilteredOrphans] = useState([]);
  const [selectedOrphan, setSelectedOrphan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('');
  const [donorDetails, setDonorDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    fetchOrphans();
  }, []);

  const fetchOrphans = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/orphans`);
      if (res.data.success) {
        setOrphans(res.data.data || []);
        setFilteredOrphans(res.data.data || []);
      }
    } catch (err) {
      console.error('[v0] Error fetching orphans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = orphans.filter(
      (orphan) =>
        orphan.name.toLowerCase().includes(term.toLowerCase()) ||
        orphan.location?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredOrphans(filtered);
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!donationAmount || !donorDetails.name || !donorDetails.email) {
      alert('Please fill all required fields');
      return;
    }

    setIsDonating(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/donate`, {
        type: 'orphan',
        item_id: selectedOrphan.id,
        item_name: selectedOrphan.name,
        amount: donationAmount,
        name: donorDetails.name,
        email: donorDetails.email,
        phone: donorDetails.phone
      });

      if (res.data.success) {
        alert('Thank you for your donation! Your support means a lot.');
        setShowDonateModal(false);
        setDonationAmount('');
        setDonorDetails({ name: '', email: '', phone: '' });
      }
    } catch (err) {
      console.error('[v0] Error donating:', err);
      alert('Failed to process donation. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };

  return (
    <motion.div
      className="donations-page orphans-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <motion.section
        className="hero-section"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="hero-content">
          <div className="hero-icon">
            <Gift size={80} />
          </div>
          <h1>Support Orphanages</h1>
          <p>Help provide care, education, and a brighter future for children in need</p>
          <div className="hero-stats">
            <div className="stat">
              <Users size={24} />
              <div>
                <h3>{orphans.length}</h3>
                <p>Active Homes</p>
              </div>
            </div>
            <div className="stat">
              <Heart size={24} />
              <div>
                <h3>Thousands</h3>
                <p>Lives Supported</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Search & Filter */}
      <motion.section
        className="search-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          <button className="filter-button">
            <Filter size={20} /> Filter
          </button>
        </div>
      </motion.section>

      {/* Orphans Grid */}
      <motion.section className="grid-section">
        {loading ? (
          <p className="loading">Loading orphanages...</p>
        ) : filteredOrphans.length > 0 ? (
          <div className="orphans-grid">
            {filteredOrphans.map((orphan, index) => (
              <motion.div
                key={orphan.id}
                className="orphan-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                {/* Image */}
                <div className="card-image">
                  <img
                    src={orphan.image_url || 'https://via.placeholder.com/300x200?text=Orphanage'}
                    alt={orphan.name}
                    className="image"
                  />
                  <div className="overlay">
                    <button
                      className="action-button donate-button"
                      onClick={() => {
                        setSelectedOrphan(orphan);
                        setShowDonateModal(true);
                      }}
                    >
                      <Heart size={20} /> Donate Now
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-content">
                  <h3>{orphan.name}</h3>
                  
                  {orphan.description && (
                    <p className="description">{orphan.description}</p>
                  )}

                  {/* Info Grid */}
                  <div className="info-grid">
                    {orphan.location && (
                      <div className="info-item">
                        <MapPin size={16} />
                        <span>{orphan.location}</span>
                      </div>
                    )}
                    {orphan.contact_phone && (
                      <div className="info-item">
                        <Phone size={16} />
                        <span>{orphan.contact_phone}</span>
                      </div>
                    )}
                    {orphan.contact_email && (
                      <div className="info-item">
                        <Mail size={16} />
                        <span>{orphan.contact_email}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  {orphan.qr_url && (
                    <div className="qr-section">
                      <img
                        src={orphan.qr_url}
                        alt="Donation QR Code"
                        className="qr-code"
                        title="Scan to donate"
                      />
                      <p className="qr-text">Scan to donate</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="card-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedOrphan(orphan);
                        setShowDonateModal(true);
                      }}
                    >
                      <DollarSign size={18} /> Donate
                    </button>
                    <button className="btn btn-secondary">
                      <Share2 size={18} /> Share
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="empty-message">No orphanages found. Try adjusting your search.</p>
        )}
      </motion.section>

      {/* Donation Modal */}
      {showDonateModal && selectedOrphan && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowDonateModal(false)}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Donate to {selectedOrphan.name}</h2>
            <p>Your support makes a real difference</p>

            <form onSubmit={handleDonate}>
              {/* Donation Amount */}
              <div className="form-group">
                <label>Donation Amount (in USD)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="quick-amounts">
                <button type="button" onClick={() => setDonationAmount('10')}>
                  $10
                </button>
                <button type="button" onClick={() => setDonationAmount('25')}>
                  $25
                </button>
                <button type="button" onClick={() => setDonationAmount('50')}>
                  $50
                </button>
                <button type="button" onClick={() => setDonationAmount('100')}>
                  $100
                </button>
              </div>

              {/* Donor Details */}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={donorDetails.name}
                  onChange={(e) => setDonorDetails({ ...donorDetails, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={donorDetails.email}
                  onChange={(e) => setDonorDetails({ ...donorDetails, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={donorDetails.phone}
                  onChange={(e) => setDonorDetails({ ...donorDetails, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div>

              {/* Buttons */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDonateModal(false)}
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isDonating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isDonating ? 'Processing...' : 'Complete Donation'}
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Orphans;
