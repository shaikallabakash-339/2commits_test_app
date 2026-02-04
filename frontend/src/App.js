/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import UserDashboard from './pages/UserDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import OldAgeHomes from './pages/OldAgeHomes';
import Orphans from './pages/Orphans';
import Premium from './pages/Premium';
import Navbar from './components/Navbar';
import './styles/App.css';
import './styles/toast.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/old-age-homes" element={<OldAgeHomes />} />
          <Route path="/orphans" element={<Orphans />} />
          <Route path="/premium" element={<Premium />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
