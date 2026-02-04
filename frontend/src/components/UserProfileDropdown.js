/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// src/components/UserProfileDropdown.js
import React, { useState, useRef, useEffect } from 'react';
import '../styles/components.css';

function UserProfileDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="profile-btn">
        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
      </button>
      {isOpen && (
        <div className="dropdown">
          <h4>{user.fullName || 'User'}</h4>
          <div className="profile-info">
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>City:</strong> {user.city || 'N/A'}</p>
            <p><strong>State:</strong> {user.state || 'N/A'}</p>
            <p><strong>Country:</strong> {user.country || 'N/A'}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
            <p><strong>Status:</strong> {user.status || 'N/A'}</p>
            <p><strong>Qualification:</strong> {user.qualification || 'N/A'}</p>
            <p><strong>Branch:</strong> {user.branch || 'N/A'}</p>
            <p><strong>Passout Year:</strong> {user.passoutYear || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileDropdown;
