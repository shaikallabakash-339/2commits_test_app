/*
 * Copyright (c) 2026 Your Company Name
 * All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/navbar.css';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isAuthenticated =
    location.pathname === '/user-dashboard' ||
    location.pathname === '/admin-dashboard';

  return (
    <nav className={isScrolled ? 'scrolled' : ''}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Sparkles size={24} />
          </div>
          <div className="logo-text">
            <h1>Skill Connect</h1>
            <p>Professional Network</p>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="nav-links-desktop">
          {isAuthenticated ? (
            <>
              <Link
                to={
                  location.pathname === '/user-dashboard'
                    ? '/user-dashboard'
                    : '/admin-dashboard'
                }
                className="nav-link"
              >
                Dashboard
              </Link>
              <button onClick={handleLogout} className="nav-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/old-age-homes" className="nav-link">
                Donate to Homes
              </Link>
              <Link to="/orphans" className="nav-link">
                Donate to Orphans
              </Link>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="nav-button">
                Get Started
              </Link>
              <Link to="/admin-login" className="nav-button">
                Admin Login
              </Link>
              <Link to="/user-dashboard" className="nav-button">
                User Dashboard
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`nav-links-mobile ${isMenuOpen ? 'open' : ''}`}>
        {isAuthenticated ? (
          <>
            <Link
              to={
                location.pathname === '/user-dashboard'
                  ? '/user-dashboard'
                  : '/admin-dashboard'
              }
              onClick={() => setIsMenuOpen(false)}
              className="mobile-nav-item"
            >
              Dashboard
            </Link>
            <button onClick={handleLogout} className="mobile-nav-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="mobile-nav-item"
            >
              Home
            </Link>
            <Link
              to="/old-age-homes"
              onClick={() => setIsMenuOpen(false)}
              className="mobile-nav-item"
            >
              Donate to Homes
            </Link>
            <Link
              to="/orphans"
              onClick={() => setIsMenuOpen(false)}
              className="mobile-nav-item"
            >
              Donate to Orphans
            </Link>
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="mobile-nav-item"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsMenuOpen(false)}
              className="mobile-nav-button"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
