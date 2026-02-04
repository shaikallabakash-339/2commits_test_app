/*
 * Copyright (c) 2026 Your Company Name
 * All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Menu, X, LogOut, BarChart3, Users, MessageSquare, Settings, Upload,
  Eye, Trash2, Download, Zap, TrendingUp, Target, Send
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import '../styles/admin-dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });

  // Data
  const [users, setUsers] = useState([]);
  const [userStatusDistribution, setUserStatusDistribution] = useState([]);
  const [messagesByStatus, setMessagesByStatus] = useState({});

  const [oldAgeHomes, setOldAgeHomes] = useState([]);
  const [orphans, setOrphans] = useState([]);

  // Messaging
  const [broadcastForm, setBroadcastForm] = useState({
    targetStatus: 'all',
    message: '',
  });

  // Upload
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'old-age',
    qrImage: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      navigate('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminData));
    loadDashboardData();

    const interval = setInterval(loadDashboardData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchOldAgeHomes(),
        fetchOrphans(),
        // fetchMessageStats(),     // uncomment when backend ready
        // fetchDonationStats(),    // uncomment when backend ready
      ]);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${api}/api/all-users`);
      if (res.data?.users) {
        const list = res.data.users;
        setUsers(list);
        setStats(prev => ({ ...prev, totalUsers: list.length }));

        // Simple status distribution for pie chart
        const statusCount = list.reduce((acc, u) => {
          const s = u.status || 'unknown';
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
        const distribution = Object.entries(statusCount).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }));
        setUserStatusDistribution(distribution);
      }
    } catch (err) {
      console.error('Users fetch failed:', err);
    }
  };

  const fetchOldAgeHomes = async () => {
    try {
      const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${api}/api/old-age-homes`);
      if (res.data?.success) {
        setOldAgeHomes(res.data.data || []);
      }
    } catch (err) {
      console.error('Old age homes fetch failed:', err);
    }
  };

  const fetchOrphans = async () => {
    try {
      const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${api}/api/orphans`);
      if (res.data?.success) {
        setOrphans(res.data.data || []);
      }
    } catch (err) {
      console.error('Orphans fetch failed:', err);
    }
  };

  // Uncomment & implement when backend is ready
  // const fetchMessageStats = async () => { ... }
  // const fetchDonationStats = async () => { ... }

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.message.trim()) return alert('Message is required');

    try {
      const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // Example endpoint - adjust to your real one
      const res = await axios.post(`${api}/api/admin/broadcast`, {
        target: broadcastForm.targetStatus,
        message: broadcastForm.message,
      });
      if (res.data.success) {
        alert('Broadcast sent!');
        setBroadcastForm({ targetStatus: 'all', message: '' });
      }
    } catch (err) {
      alert('Failed to send broadcast');
      console.error(err);
    }
  };

  const handleQRUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.name || !uploadForm.qrImage) {
      return alert('Name and QR image are required');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('name', uploadForm.name);
    formData.append('type', uploadForm.type);
    formData.append('qrImage', uploadForm.qrImage);

    try {
      const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${api}/api/upload-qr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        alert('QR uploaded successfully');
        setUploadForm({ name: '', type: 'old-age', qrImage: null });
        if (uploadForm.type === 'old-age') fetchOldAgeHomes();
        else fetchOrphans();
      }
    } catch (err) {
      alert('Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a78bfa'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        className={`admin-sidebar bg-gradient-to-b from-indigo-800 to-indigo-950 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
        animate={{ width: sidebarOpen ? 288 : 80 }}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="mt-8 px-3 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'users',     label: 'Users',      icon: Users },
            { id: 'messaging', label: 'Messaging',  icon: MessageSquare },
            { id: 'qr-upload', label: 'Upload QR',  icon: Upload },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                currentTab === item.id
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-700/50'
              }`}
            >
              <item.icon size={20} className="mr-3" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600/80 hover:bg-red-700 rounded-lg transition"
          >
            <LogOut size={18} className="mr-2" />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">
              {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700 hidden md:block">
              {admin?.email || 'Admin'}
            </span>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              {(admin?.email?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-6">
          {currentTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Users</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                    </div>
                    <Users className="text-indigo-600" size={32} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Messages</p>
                      <p className="text-3xl font-bold mt-1">{stats.totalMessages || '—'}</p>
                    </div>
                    <MessageSquare className="text-green-600" size={32} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Donations</p>
                      <p className="text-3xl font-bold mt-1">
                        {stats.totalRevenue ? `₹${stats.totalRevenue.toLocaleString()}` : '—'}
                      </p>
                    </div>
                    <TrendingUp className="text-purple-600" size={32} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Today</p>
                      <p className="text-3xl font-bold mt-1">{stats.activeUsers || '—'}</p>
                    </div>
                    <Zap className="text-yellow-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">User Status Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={userStatusDistribution.length > 0 ? userStatusDistribution : [{name: 'No data', value: 1}]}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {(userStatusDistribution.length > 0 ? userStatusDistribution : [{name: 'No data', value: 1}]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Placeholder for messages chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">Messages by Category</h3>
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    {Object.keys(messagesByStatus).length > 0 ? (
                      <ResponsiveContainer>
                        <BarChart data={Object.entries(messagesByStatus).map(([name, value]) => ({ name, value }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p>Message statistics not available yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Registered Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{user.fullname || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{user.company_name || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'employed' ? 'bg-green-100 text-green-800' :
                            user.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            <Eye size={18} />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'messaging' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold mb-6">Send Broadcast Message</h2>

              <form onSubmit={handleBroadcast} className="max-w-2xl">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Group
                  </label>
                  <select
                    value={broadcastForm.targetStatus}
                    onChange={e => setBroadcastForm({...broadcastForm, targetStatus: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Users</option>
                    <option value="employed">Employed</option>
                    <option value="graduated">Graduated</option>
                    <option value="pursuing">Pursuing</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={broadcastForm.message}
                    onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Write your message here..."
                  />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  disabled={!broadcastForm.message.trim()}
                >
                  <Send size={18} className="inline mr-2" />
                  Send Broadcast
                </button>
              </form>
            </div>
          )}

          {currentTab === 'qr-upload' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold mb-6">Upload New QR Code</h2>

              <form onSubmit={handleQRUpload} className="max-w-lg space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={e => setUploadForm({...uploadForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Anand Old Age Home"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={uploadForm.type}
                    onChange={e => setUploadForm({...uploadForm, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="old-age">Old Age Home</option>
                    <option value="orphan">Orphanage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setUploadForm({...uploadForm, qrImage: e.target.files[0]})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadForm.name || !uploadForm.qrImage}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 w-full md:w-auto"
                >
                  {uploading ? 'Uploading...' : 'Upload QR Code'}
                </button>
              </form>

              {/* Preview existing ones */}
              <div className="mt-12">
                <h3 className="text-xl font-semibold mb-4">
                  Existing {uploadForm.type === 'old-age' ? 'Old Age Homes' : 'Orphanages'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(uploadForm.type === 'old-age' ? oldAgeHomes : orphans).map(item => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.qr_url && (
                        <div className="mt-3">
                          <img
                            src={item.qr_url}
                            alt="QR Code"
                            className="w-32 h-32 object-contain mx-auto border rounded"
                          />
                          <a
                            href={item.qr_url}
                            download
                            className="mt-2 text-indigo-600 hover:underline text-sm flex items-center justify-center"
                          >
                            <Download size={16} className="mr-1" />
                            Download QR
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;