/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// src/services/api.js
import axios from 'axios';

// Get API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('[v0] Initializing API client with URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[v0] Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('[v0] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('[v0] API response received:', response.status);
    return response;
  },
  (error) => {
    console.error('[v0] API error:', error.response?.status, error.message);
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
