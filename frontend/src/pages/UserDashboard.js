/*
 * Copyright (c) 2026 Your Company Name
 * All rights reserved.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { io as socketIOClient } from 'socket.io-client';
import {
  Home, MessageSquare, Bell, LogOut, Search, Send, Upload, FileText, Trash2,
  ChevronDown, Settings, User, Users, Zap, Lock, CreditCard, Briefcase, Plus
} from 'lucide-react';
import { showToast } from '../utils/toast';
import '../styles/user-dashboard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Auth & User State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false); // Fixed: this was declared but not used properly

  // UI State
  const [activeTab, setActiveTab] = useState('profile');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Home Tab State
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchType, setUserSearchType] = useState('name');
  const [profileUpdateMode, setProfileUpdateMode] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});

  // Messages Tab State
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageFile, setMessageFile] = useState(null);
  const messageFileRef = useRef(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);

  // Notifications Tab State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Resume State
  const [resumes, setResumes] = useState([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeModalUrl, setResumeModalUrl] = useState(null);

  // Profile Tab State (new)
  const [userBio, setUserBio] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [experienceForm, setExperienceForm] = useState({
    jobTitle: '',
    companyName: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: ''
  });
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);

  // Status Tracking State
  const [userStatuses, setUserStatuses] = useState({});
  const [currentUserStatus, setCurrentUserStatus] = useState('offline');

  // Initialize
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setUpdatedProfile(parsedUser);
    setUserBio(parsedUser.bio || '');
    setIsPremium(parsedUser.is_premium || false);

    fetchUserProfile(parsedUser.email);
    fetchAllUsers();
    fetchConversations(parsedUser.id);
    fetchNotifications(parsedUser.id);
    fetchResumes(parsedUser.email);
    fetchExperiences(parsedUser.id);

    // Update user status to online
    updateUserStatus(true);

    setLoading(false);

    // Polling for real-time updates
    // Initialize socket connection for real-time events
    try {
      const socketUrl = process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_API_URL || 'http://localhost:5000');
      socketRef.current = socketIOClient(socketUrl, { transports: ['websocket'] });
      socketRef.current.on('connect', () => {
        socketRef.current.emit('join', parsedUser.id);
      });

      socketRef.current.on('new_message', (payload) => {
        // Payload: { message, from }
        if (!payload || !payload.message) return;
        const m = payload.message;
        // If message involves selected user, append to messages
        const otherId = selectedUser?.id;
        if (otherId && (m.sender_id === otherId || m.receiver_id === otherId)) {
          setMessages(prev => [...prev, m]);
          scrollToBottom();
        }
        // Refresh conversations and notifications
        fetchConversations(parsedUser.id);
        fetchNotifications(parsedUser.id);
      });

      socketRef.current.on('new_notification', () => fetchNotifications(parsedUser.id));
    } catch (err) {
      console.warn('Socket init failed', err.message);
    }

    // Backwards-compatible polling (fallback)
    const interval = setInterval(() => {
      if (selectedUser && parsedUser.id) {
        fetchMessages(parsedUser.id, selectedUser.id);
      }
      fetchNotifications(parsedUser.id);
      fetchConversations(parsedUser.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, selectedUser]);

  useEffect(() => {
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.emit('leave', user?.id);
          socketRef.current.disconnect();
        }
      } catch (e) {}
    };
  }, [user]);

  const fetchUserProfile = async (email) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/user/${email}`);
      if (res.data.success) {
        setUser(res.data.user);
        setUpdatedProfile(res.data.user);
        setIsPremium(res.data.user.is_premium || false);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast('Failed to load profile', 'error');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/all-users`);
      if (res.data?.users) {
        const filtered = res.data.users.filter(u => u.email !== user?.email);
        setAllUsers(filtered);
        setFilteredUsers(filtered);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Failed to load users', 'error');
    }
  };

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(allUsers);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allUsers.filter(u => {
      if (userSearchType === 'name') {
        return u.fullname?.toLowerCase().includes(query);
      } else if (userSearchType === 'company') {
        return u.company_name?.toLowerCase().includes(query);
      }
      return false;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, userSearchType, allUsers]);

  const fetchConversations = async (userId) => {
    if (!userId) return;
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/conversations/${userId}`);
      if (res.data.success) {
        setConversations(res.data.conversations || []);
        setConversationCount(res.data.conversations?.length || 0);
      }
    } catch (err) {
      console.error('Conversations fetch failed:', err);
      showToast('Could not load conversations', 'error');
    }
  };

  const fetchMessages = async (senderId, receiverId) => {
    if (!senderId || !receiverId) return;
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/user-message/${senderId}/${receiverId}`);
      if (res.data.success) {
        setMessages(res.data.messages || []);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Messages fetch failed:', err);
    }
  };

  const fetchNotifications = async (userId) => {
    if (!userId) return;
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/notifications/${userId}`);
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.notifications?.filter(n => !n.is_read).length || 0);
      }
    } catch (err) {
      console.error('Notifications fetch failed:', err);
    }
  };

  const fetchResumes = async (email) => {
    if (!email) return;
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/resumes/${email}`);
      if (res.data.success) {
        setResumes(res.data.resumes || []);
      }
    } catch (err) {
      console.error('Resumes fetch failed:', err);
      showToast('Failed to load resumes', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !messageFile) || !selectedUser) return;

    if (!isPremium && conversationCount >= 5) {
      setShowPremiumWarning(true);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      let res;
      if (messageFile) {
        const form = new FormData();
        form.append('senderId', user.id);
        form.append('receiverId', selectedUser.id);
        form.append('message', messageInput.trim());
        form.append('attachment', messageFile);

        res = await axios.post(`${apiUrl}/api/user-message/send`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post(`${apiUrl}/api/user-message/send`, {
          senderId: user.id,
          receiverId: selectedUser.id,
          message: messageInput.trim(),
        });
      }

      if (res.data.success) {
        setMessageInput('');
        setMessageFile(null);
        if (messageFileRef.current) messageFileRef.current.value = '';
        await fetchMessages(user.id, selectedUser.id);
        await fetchConversations(user.id);
        showToast('Message sent!', 'success');
      } else {
        showToast(res.data.message || 'Failed to send message', 'error');
      }
    } catch (err) {
      console.error('Send message failed:', err);
      showToast('Failed to send message', 'error');
    }
  };

  const handleSelectUser = (person) => {
    const normalizedUser = {
      id: person.id,
      fullname: person.fullname || 'Unknown',
      company_name: person.company_name || '',
      profile_image_url: person.profile_image_url || 'https://via.placeholder.com/40',
    };
    setSelectedUser(normalizedUser);
    setMessageLoading(true);
    fetchMessages(user.id, person.id);
    setTimeout(() => setMessageLoading(false), 400);
  };

  const handleMessageFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Basic size/type checks (15MB limit)
    if (f.size > 15 * 1024 * 1024) {
      showToast('File too large (max 15MB)', 'error');
      e.target.value = '';
      return;
    }
    setMessageFile(f);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      showToast('Only PDF or Word files allowed', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('email', user.email);
    formData.append('name', user.fullname);

    setResumeUploading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Resume uploaded successfully!', 'success');
        fetchResumes(user.email);
      } else {
        showToast(res.data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      showToast('Error uploading resume', 'error');
    } finally {
      setResumeUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Delete this resume?')) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.delete(`${apiUrl}/api/resume/${resumeId}`);
      if (res.data.success) {
        showToast('Resume deleted', 'success');
        fetchResumes(user.email);
      } else {
        showToast('Delete failed', 'error');
      }
    } catch (err) {
      console.error('Delete resume error:', err);
      showToast('Failed to delete resume', 'error');
    }
  };

  const handleUpdateProfile = async () => {
    if (!updatedProfile.fullname || !updatedProfile.email) {
      showToast('Name and email are required', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.put(`${apiUrl}/api/user/${user.id}/update`, updatedProfile);

      if (res.data.success) {
        setUser(updatedProfile);
        localStorage.setItem('user', JSON.stringify(updatedProfile));
        setProfileUpdateMode(false);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Fetch experiences for current user
  const fetchExperiences = async (userId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/experiences/user/${userId}`);
      if (res.data.success) {
        setExperiences(res.data.experiences || []);
      }
    } catch (err) {
      console.error('Fetch experiences error:', err);
    }
  };

  // Add new experience
  const handleAddExperience = async () => {
    if (!experienceForm.jobTitle || !experienceForm.companyName) {
      showToast('Job title and company are required', 'error');
      return;
    }
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/experiences`, {
        userId: user.id,
        jobTitle: experienceForm.jobTitle,
        companyName: experienceForm.companyName,
        startDate: experienceForm.startDate || null,
        endDate: experienceForm.endDate || null,
        isCurrent: experienceForm.isCurrent,
        description: experienceForm.description
      });
      
      if (res.data.success) {
        showToast('Experience added successfully!', 'success');
        setExperiences([...experiences, res.data.experience]);
        setShowExperienceForm(false);
        setExperienceForm({
          jobTitle: '',
          companyName: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: ''
        });
      }
    } catch (err) {
      console.error('Add experience error:', err);
      showToast('Failed to add experience', 'error');
    }
  };

  // Delete experience
  const handleDeleteExperience = async (experienceId) => {
    if (!window.confirm('Delete this experience?')) return;
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.delete(`${apiUrl}/api/experiences/${experienceId}`);
      
      if (res.data.success) {
        showToast('Experience deleted successfully!', 'success');
        setExperiences(experiences.filter(exp => exp.id !== experienceId));
      }
    } catch (err) {
      console.error('Delete experience error:', err);
      showToast('Failed to delete experience', 'error');
    }
  };

  // Update user bio
  const handleUpdateBio = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.put(`${apiUrl}/api/user/${user.id}/update`, {
        bio: userBio
      });
      
      if (res.data.success) {
        showToast('Bio updated successfully!', 'success');
        setUser({ ...user, bio: userBio });
      }
    } catch (err) {
      console.error('Update bio error:', err);
      showToast('Failed to update bio', 'error');
    }
  };

  // Upload profile photo
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      showToast('Only JPG and PNG images are allowed', 'error');
      return;
    }
    
    setProfilePhotoUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${apiUrl}/api/upload-profile-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setUser({ ...user, profile_image_url: res.data.imageUrl });
        showToast('Profile photo updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Profile photo upload error:', err);
      showToast('Failed to upload profile photo', 'error');
    } finally {
      setProfilePhotoUploading(false);
    }
  };

  // Update online status
  const updateUserStatus = async (isOnline) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/status/update`, {
        userId: user.id,
        isOnline
      });
      setCurrentUserStatus(isOnline ? 'online' : 'offline');
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <Zap size={48} className="text-blue-500" />
        </motion.div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="user-dashboard-new min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Sidebar - Profile */}
      <aside className="dashboard-sidebar">
        <motion.div
          className="profile-card bg-white rounded-xl shadow-lg p-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="profile-image-wrapper relative">
            <img
              src={user?.profile_image_url || 'https://via.placeholder.com/120?text=Profile'}
              alt={user?.fullname}
              className="profile-image-large w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
            {isPremium && (
              <div className="premium-badge absolute -bottom-2 -right-2 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
                <CreditCard size={14} className="mr-1" /> Premium
              </div>
            )}
          </div>

          <h2 className="profile-name text-2xl font-bold mt-4 text-center">{user?.fullname}</h2>
          <p className="profile-company text-gray-600 text-center">{user?.company_name || 'No company set'}</p>
          <p className="profile-status text-center mt-2">
            <span className={`status-badge px-3 py-1 rounded-full text-sm ${user?.status}`}>
              {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1)}
            </span>
          </p>

          <motion.button
            className="update-profile-btn w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            onClick={() => setProfileUpdateMode(!profileUpdateMode)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <User size={18} className="inline mr-2" />
            Update Profile
          </motion.button>

          <div className="sidebar-stats grid grid-cols-2 gap-4 mt-6">
            <div className="stat-item text-center">
              <p className="stat-label text-gray-500 text-sm">Conversations</p>
              <p className="stat-value text-2xl font-bold">{conversationCount}</p>
            </div>
            <div className="stat-item text-center">
              <p className="stat-label text-gray-500 text-sm">Notifications</p>
              <p className="stat-value text-2xl font-bold">{unreadCount}</p>
            </div>
          </div>

          {!isPremium && conversationCount >= 5 && (
            <motion.button
              className="upgrade-btn w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition"
              onClick={() => navigate('/premium')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap size={18} className="inline mr-2" />
              Upgrade to Premium
            </motion.button>
          )}
        </motion.div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Navbar */}
        <nav className="dashboard-navbar bg-white shadow-sm">
          <div className="navbar-center flex space-x-8">
            <button
              className={`nav-btn flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('profile')}
            >
              <Home size={20} />
              <span>Profile</span>
            </button>
            <button
              className={`nav-btn flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'messages' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare size={20} />
              <span>Messages</span>
              {conversationCount > 0 && (
                <span className="badge bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{conversationCount}</span>
              )}
            </button>
            {user?.is_admin && (
              <button
                className={`nav-btn flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'admin-messages' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('admin-messages')}
              >
                <MessageSquare size={20} />
                <span>Admin Messages</span>
              </button>
            )}
            <button
              className={`nav-btn flex items-center space-x-2 px-4 py-2 rounded-lg ${activeTab === 'notifications' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={20} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="badge bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
              )}
            </button>
          </div>

          {/* Profile Menu */}
          <div className="navbar-right relative">
            <button
              className="flex items-center space-x-2"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <img
                src={user?.profile_image_url || 'https://via.placeholder.com/40?text=U'}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <ChevronDown size={16} />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  className="profile-dropdown-menu absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="dropdown-header p-4 border-b">
                    <h4 className="font-semibold">{user?.fullname}</h4>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <button className="dropdown-item w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
                    <User size={18} /> View Profile
                  </button>
                  <button className="dropdown-item w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
                    <Settings size={18} /> Settings
                  </button>
                  <button className="dropdown-item premium w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
                    <Zap size={18} />
                    {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
                  </button>
                  <hr className="my-2" />
                  <button
                    className="dropdown-item logout w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center space-x-3"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Welcome Banner */}
        <motion.div
          className="welcome-banner bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl shadow-lg mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold">👋 Welcome back, {user?.fullname?.split(' ')[0]}!</h1>
          <p className="mt-2 opacity-90">Connect, chat, and grow your professional network</p>
        </motion.div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div className="profile-section space-y-8">
              {/* Profile Photo Upload */}
              <motion.div
                className="profile-photo-section bg-white p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-2xl font-bold mb-6">Profile Photo</h3>
                <div className="flex items-center space-x-8">
                  <div className="profile-photo-display w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600 bg-gray-100">
                    <img 
                      src={user?.profile_image_url || 'https://via.placeholder.com/128?text=U'} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <motion.button
                    className="upload-photo-btn px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    onClick={() => document.getElementById('profile-photo-input')?.click()}
                    disabled={profilePhotoUploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload size={18} className="mr-2" />
                    {profilePhotoUploading ? 'Uploading...' : 'Change Photo'}
                  </motion.button>
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleProfilePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </motion.div>

              {/* Profile Information Form */}
              <motion.div
                className="profile-info-section bg-white p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-2xl font-bold mb-6">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={updatedProfile.fullname || ''}
                      onChange={(e) => setUpdatedProfile({ ...updatedProfile, fullname: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={updatedProfile.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={updatedProfile.company_name || ''}
                      onChange={(e) => setUpdatedProfile({ ...updatedProfile, company_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your company"
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={updatedProfile.city || ''}
                      onChange={(e) => setUpdatedProfile({ ...updatedProfile, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your city"
                    />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                    <select
                      value={updatedProfile.status || 'pursuing'}
                      onChange={(e) => setUpdatedProfile({ ...updatedProfile, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pursuing">Pursuing</option>
                      <option value="graduated">Graduated</option>
                      <option value="employed">Employed</option>
                    </select>
                  </div>
                </div>
                <motion.button
                  className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </motion.div>

              {/* Bio Section */}
              <motion.div
                className="bio-section bg-white p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <FileText size={24} className="mr-3 text-blue-600" />
                  About You
                </h3>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
                  <textarea
                    value={userBio}
                    onChange={(e) => setUserBio(e.target.value)}
                    placeholder="Write a few lines about yourself, your skills, and what you're passionate about..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={5}
                  />
                  <p className="text-sm text-gray-500 mt-2">{userBio.length}/500 characters</p>
                </div>
                <motion.button
                  className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={handleUpdateBio}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Bio
                </motion.button>
              </motion.div>

              {/* Resumes Section */}
              <motion.div
                className="resume-section bg-white p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold flex items-center">
                    <FileText size={24} className="mr-3 text-blue-600" />
                    Your Resumes
                  </h3>
                  <motion.button
                    className="upload-resume-btn flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={resumeUploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload size={18} className="mr-2" />
                    {resumeUploading ? 'Uploading...' : 'Upload New Resume'}
                  </motion.button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="resumes-list space-y-4">
                  {resumes.length > 0 ? (
                    resumes.map((resume, idx) => (
                      <motion.div
                        key={resume.id}
                        className="resume-item flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="resume-info flex items-center space-x-4">
                          <FileText size={28} className="text-blue-600" />
                          <div>
                            <p className="font-medium">{resume.file_name}</p>
                            <p className="text-sm text-gray-500">
                              Uploaded: {new Date(resume.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="resume-actions flex space-x-3">
                          <motion.a
                            onClick={() => setResumeModalUrl(resume.minio_url)}
                            className="btn-view px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center justify-center cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View
                          </motion.a>
                          <motion.button
                            className="btn-delete px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            onClick={() => handleDeleteResume(resume.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="empty-state text-center py-12">
                      <FileText size={64} className="mx-auto text-gray-300" />
                      <p className="mt-4 text-gray-500">No resumes uploaded yet</p>
                      <button
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Your First Resume
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Experiences Section */}
              <motion.div
                className="experiences-section bg-white p-8 rounded-xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold flex items-center">
                    <Briefcase size={24} className="mr-3 text-blue-600" />
                    Work Experience
                  </h3>
                  <motion.button
                    className="add-experience-btn flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setShowExperienceForm(!showExperienceForm)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={18} className="mr-2" />
                    Add Experience
                  </motion.button>
                </div>

                {showExperienceForm && (
                  <motion.div
                    className="experience-form bg-gray-50 p-6 rounded-lg mb-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Job Title (e.g., Senior Engineer)"
                        value={experienceForm.jobTitle}
                        onChange={(e) => setExperienceForm({ ...experienceForm, jobTitle: e.target.value })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={experienceForm.companyName}
                        onChange={(e) => setExperienceForm({ ...experienceForm, companyName: e.target.value })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        placeholder="Start Date"
                        value={experienceForm.startDate}
                        onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-4">
                        <input
                          type="date"
                          placeholder="End Date"
                          value={experienceForm.endDate}
                          onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                          disabled={experienceForm.isCurrent}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                        />
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={experienceForm.isCurrent}
                            onChange={(e) => setExperienceForm({ ...experienceForm, isCurrent: e.target.checked, endDate: '' })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Current</span>
                        </label>
                      </div>
                      <textarea
                        placeholder="Description (optional)"
                        value={experienceForm.description}
                        onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                        className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => setShowExperienceForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddExperience}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Experience
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="experiences-list space-y-4">
                  {experiences.length > 0 ? (
                    experiences.map((exp, idx) => (
                      <motion.div
                        key={exp.id}
                        className="experience-item p-4 bg-gray-50 rounded-lg hover:shadow-md transition"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{exp.job_title}</h4>
                            <p className="text-gray-600">{exp.company_name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                              {' '}-{' '}
                              {exp.isCurrent ? 'Current' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                            </p>
                            {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                          </div>
                          <button
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="empty-state text-center py-8">
                      <Briefcase size={48} className="mx-auto text-gray-300" />
                      <p className="mt-3 text-gray-500">No work experience yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add your first work experience to show what you've accomplished</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <motion.div className="messages-section bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="messages-container flex h-[70vh]">
                {/* Conversations List */}
                <div className="conversations-list w-1/3 border-r border-gray-200 bg-gray-50">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold">Conversations</h3>
                    <div className="mt-4 relative">
                      <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={messageSearchQuery}
                        onChange={(e) => setMessageSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <p className="conversation-limit mt-4 text-sm">
                      {isPremium ? (
                        <span className="text-green-600 font-medium flex items-center">
                          <Zap size={16} className="mr-1" /> Unlimited conversations
                        </span>
                      ) : (
                        <span className="text-orange-600 font-medium flex items-center">
                          <Lock size={16} className="mr-1" /> {conversationCount}/5 conversations used
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="conversations-items overflow-y-auto h-[calc(70vh-180px)]">
                    {conversations.length > 0 ? (
                      conversations.map((conv) => (
                        <motion.div
                          key={conv.conversation_partner_id}
                          className={`conversation-item p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer flex items-center space-x-4 ${
                            selectedUser?.id === conv.conversation_partner_id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleSelectUser({
                            id: conv.conversation_partner_id,
                            fullname: conv.conversation_partner_name,
                            profile_image_url: conv.partner_profile_image_url,
                            company_name: conv.company_name || '',
                          })}
                          whileHover={{ x: 4 }}
                        >
                          <img
                            src={conv.partner_profile_image_url || 'https://via.placeholder.com/48?text=U'}
                            alt={conv.conversation_partner_name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => (e.target.src = 'https://via.placeholder.com/48?text=U')}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{conv.conversation_partner_name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {conv.last_message || 'Start a conversation...'}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="empty-state text-center py-12 px-6">
                        <MessageSquare size={48} className="mx-auto text-gray-300" />
                        <p className="mt-4 text-gray-500">No conversations yet</p>
                        <p className="text-sm text-gray-400 mt-2">Start by messaging someone from the Home tab</p>
                      </div>
                    )}
                  </div>
                  <div className="browse-small p-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Browse Professionals</h4>
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {allUsers.slice(0, 10).map(u => (
                        <div key={u.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={u.profile_image_url || 'https://via.placeholder.com/40'} alt={u.fullname} className="w-8 h-8 rounded-full object-cover" />
                            <div className="text-sm">
                              <div className="font-medium truncate" style={{maxWidth:120}}>{u.fullname}</div>
                              <div className="text-xs text-gray-500 truncate" style={{maxWidth:120}}>{u.company_name || ''}</div>
                            </div>
                          </div>
                          <button onClick={() => handleSelectUser(u)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Message</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area flex-1 flex flex-col">
                  {selectedUser ? (
                    <>
                      <div className="chat-header p-6 border-b border-gray-200 bg-white">
                        <div className="flex items-center space-x-4">
                          <img
                            src={selectedUser.profile_image_url || 'https://via.placeholder.com/48'}
                            alt={selectedUser.fullname}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-lg">{selectedUser.fullname}</h4>
                            <p className="text-gray-600">{selectedUser.company_name || 'No company'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="messages-display flex-1 p-6 overflow-y-auto bg-gray-50">
                        {messageLoading ? (
                          <div className="text-center py-12">
                            <p className="text-gray-500">Loading messages...</p>
                          </div>
                        ) : messages.length > 0 ? (
                          messages.map((msg, idx) => (
                            <motion.div
                              key={idx}
                              className={`message mb-4 flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02 }}
                            >
                              <div
                                className={`max-w-[70%] px-5 py-3 rounded-2xl ${
                                  msg.sender_id === user.id
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
                                }`}
                              >
                                <p>{msg.message}</p>
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="mt-2 attachments space-y-2">
                                    {msg.attachments.map((att) => (
                                      <div key={att.id} className="attachment">
                                        {att.file_type?.startsWith('image/') ? (
                                          <img src={att.minio_url} alt={att.file_name} className="w-48 rounded" />
                                        ) : att.file_type?.startsWith('video/') ? (
                                          <video controls src={att.minio_url} className="w-64 rounded" />
                                        ) : (
                                          <a href={att.minio_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                            {att.file_name}
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <span className="text-xs opacity-70 mt-1 block">
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="empty-chat text-center py-20">
                            <MessageSquare size={64} className="mx-auto text-gray-300" />
                            <p className="mt-6 text-gray-600 text-lg">No messages yet</p>
                            <p className="text-gray-400 mt-2">Say something to start the conversation!</p>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {showPremiumWarning && (
                        <div className="premium-warning bg-yellow-100 border-l-4 border-yellow-500 p-4 mx-6 mb-4 rounded">
                          <div className="flex items-center">
                            <Zap size={20} className="text-yellow-600 mr-3" />
                            <span className="text-yellow-800">You've reached the 5-conversation limit for free users.</span>
                          </div>
                          <button
                            onClick={() => navigate('/premium')}
                            className="mt-3 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                          >
                            Upgrade to Premium
                          </button>
                        </div>
                      )}

                      <form
                        className="message-input-form p-6 border-t border-gray-200 bg-white flex space-x-4 items-center"
                        onSubmit={handleSendMessage}
                      >
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type your message..."
                          disabled={showPremiumWarning || !selectedUser}
                          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        />
                        <input ref={messageFileRef} type="file" style={{ display: 'none' }} onChange={handleMessageFileChange} accept="image/*,video/*,.pdf,.doc,.docx" />
                        <button type="button" className="px-3 py-2 border rounded" onClick={() => messageFileRef.current?.click()} title="Attach file">📎</button>
                        {messageFile && <span className="text-sm text-gray-600">{messageFile.name}</span>}
                        <motion.button
                          type="submit"
                          disabled={(!messageInput.trim() && !messageFile) || showPremiumWarning || !selectedUser}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Send size={20} />
                        </motion.button>
                      </form>
                    </>
                  ) : (
                    <div className="empty-chat flex-1 flex flex-col items-center justify-center bg-gray-50">
                      <MessageSquare size={80} className="text-gray-300 mb-6" />
                      <h3 className="text-2xl font-bold text-gray-600 mb-2">Your Messages</h3>
                      <p className="text-gray-500 max-w-md text-center">
                        Select a conversation from the list or start a new one by messaging someone from the Home tab
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <motion.div
              className="notifications-section bg-white p-8 rounded-xl shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-3xl font-bold mb-8">Notifications</h2>

              <div className="notifications-container space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <motion.div
                      key={idx}
                      className={`notification-item p-6 rounded-xl border-l-4 ${
                        notif.is_read ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'
                      } cursor-pointer hover:shadow-md transition`}
                      onClick={() => {
                        if (!notif.is_read) {
                          axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/${notif.id}/read`);
                        }
                        if (notif.type === 'message') {
                          setActiveTab('messages');
                        }
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="notif-icon text-3xl">
                          {notif.type === 'admin' ? <Bell className="text-blue-600" /> : <MessageSquare className="text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{notif.title}</h4>
                          <p className="text-gray-700 mt-1">{notif.message}</p>
                          <span className="notif-type text-sm text-gray-500 mt-2 block">
                            {notif.type === 'admin' ? '📢 Admin Announcement' : '💬 Message'}
                          </span>
                        </div>
                        <span className="notif-time text-sm text-gray-500 whitespace-nowrap">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-notification text-center py-20">
                    <Bell size={80} className="mx-auto text-gray-300" />
                    <p className="mt-6 text-gray-600 text-xl">No notifications yet</p>
                    <p className="text-gray-400 mt-2">We'll notify you when something important happens</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      {resumeModalUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[90%] h-[90%] overflow-hidden">
            <div className="p-3 border-b flex justify-end">
              <button onClick={() => setResumeModalUrl(null)} className="px-3 py-1 bg-red-600 text-white rounded">Close</button>
            </div>
            <iframe src={resumeModalUrl} title="Resume" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default UserDashboard;