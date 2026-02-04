import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Heart, Share2, MapPin, Phone, Mail, QrCode, ArrowRight, Users,
  Search, Filter, DollarSign, Home
} from 'lucide-react';
import '../styles/donations.css';

function OldAgeHomes() {
  const navigate = useNavigate();
  const [homes, setHomes] = useState([]);
  const [filteredHomes, setFilteredHomes] = useState([]);
  const [selectedHome, setSelectedHome] = useState(null);
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
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/old-age-homes`);
      if (res.data.success) {
        setHomes(res.data.data || []);
        setFilteredHomes(res.data.data || []);
      }
    } catch (err) {
      console.error('[v0] Error fetching old-age homes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = homes.filter(
      (home) =>
        home.name.toLowerCase().includes(term.toLowerCase()) ||
        home.location?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredHomes(filtered);
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
        type: 'old-age',
        item_id: selectedHome.id,
        item_name: selectedHome.name,
        amount: donationAmount,
        name: donorDetails.name,
        email: donorDetails.email,
        phone: donorDetails.phone
      });

      if (res.data.success) {
        alert('Thank you for your donation! You are making a difference in their lives.');
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
      className="donations-page old-age-homes-page"
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
            <Home size={80} />
          </div>
          <h1>Support Our Elderly</h1>
          <p>Bring comfort, care, and dignity to senior citizens who need it most</p>
          <div className="hero-stats">
            <div className="stat">
              <Users size={24} />
              <div>
                <h3>{homes.length}</h3>
                <p>Active Homes</p>
              </div>
            </div>
            <div className="stat">
              <Heart size={24} />
              <div>
                <h3>Thousands</h3>
                <p>Elders Supported</p>
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

      {/* Homes Grid */}
      <motion.section className="grid-section">
        {loading ? (
          <p className="loading">Loading old-age homes...</p>
        ) : filteredHomes.length > 0 ? (
          <div className="homes-grid">
            {filteredHomes.map((home, index) => (
              <motion.div
                key={home.id}
                className="home-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                {/* Image */}
                <div className="card-image">
                  <img
                    src={home.image_url || 'https://via.placeholder.com/300x200?text=Old+Age+Home'}
                    alt={home.name}
                    className="image"
                  />
                  <div className="overlay">
                    <button
                      className="action-button donate-button"
                      onClick={() => {
                        setSelectedHome(home);
                        setShowDonateModal(true);
                      }}
                    >
                      <Heart size={20} /> Donate Now
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-content">
                  <h3>{home.name}</h3>
                  
                  {home.description && (
                    <p className="description">{home.description}</p>
                  )}

                  {/* Info Grid */}
                  <div className="info-grid">
                    {home.location && (
                      <div className="info-item">
                        <MapPin size={16} />
                        <span>{home.location}</span>
                      </div>
                    )}
                    {home.contact_phone && (
                      <div className="info-item">
                        <Phone size={16} />
                        <span>{home.contact_phone}</span>
                      </div>
                    )}
                    {home.contact_email && (
                      <div className="info-item">
                        <Mail size={16} />
                        <span>{home.contact_email}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  {home.qr_url && (
                    <div className="qr-section">
                      <img
                        src={home.qr_url}
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
                        setSelectedHome(home);
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
          <p className="empty-message">No old-age homes found. Try adjusting your search.</p>
        )}
      </motion.section>

      {/* Donation Modal */}
      {showDonateModal && selectedHome && (
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
            <h2>Donate to {selectedHome.name}</h2>
            <p>Help us provide care and comfort to our elderly residents</p>

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

export default OldAgeHomes;
