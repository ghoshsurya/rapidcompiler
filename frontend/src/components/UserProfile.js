import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/supabase';
import { User, Mail, Lock, Camera, Download, Code, Calendar, Trash2, AlertTriangle } from 'lucide-react';

const UserProfile = ({ darkMode }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.put(`/users/${user.id}`, {
        username: formData.username,
        full_name: formData.full_name
      });
      alert('Profile updated successfully!');
      // Update local user data
      window.location.reload();
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }
    
    setLoading(true);
    try {
      // Trigger Auth0 password reset for the user
      const response = await fetch(`https://${process.env.REACT_APP_AUTH0_DOMAIN}/dbconnections/change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
          email: user.email,
          connection: 'Username-Password-Authentication'
        })
      });
      
      if (response.ok) {
        alert('Password reset email sent! Check your email to set a new password.');
        setFormData({ ...formData, newPassword: '', confirmPassword: '' });
      } else {
        alert('Failed to send password reset email. Please try again.');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    alert('Avatar upload feature coming soon! For now, your Auth0 profile picture is used.');
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await api.delete(`/users/${user.id}`);
      alert('Account deleted successfully. You will be logged out.');
      logout();
    } catch (error) {
      alert('Error deleting account: ' + error.message);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const downloadProject = (project) => {
    const extensions = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      c: 'c',
      cpp: 'cpp',
      java: 'java',
      csharp: 'cs',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      ruby: 'rb',
      php: 'php',
      sql: 'sql',
      web: 'html'
    };
    
    const extension = extensions[project.language] || 'txt';
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
    
    const blob = new Blob([project.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-dark-bg text-dark-text' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">User Profile</h1>
        
        {/* Profile Header */}
        <div className={`p-6 rounded-lg mb-6 ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow-lg`}>
          <div className="flex items-center space-x-6">
            <div className="relative">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <Camera className="h-4 w-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user.username}</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${darkMode ? 'border-dark-border' : 'border-gray-200'} mb-6`}>
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: 'Profile Settings', icon: User },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'projects', label: 'My Projects', icon: Code }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow-lg`}>
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className={`w-full px-3 py-2 border rounded-lg opacity-50 ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
              
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-blue-900 bg-opacity-20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h4 className="font-semibold text-blue-600 mb-2">Password Management</h4>
                <p className={`text-sm mb-4 ${
                  darkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Your account is secured with Auth0. Click below to receive a password reset email.
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handlePasswordUpdate(e);
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Password Reset Email'}
                </button>
              </div>
              
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h4 className="font-semibold mb-2">Account Security</h4>
                <ul className={`text-sm space-y-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <li>• Your account is protected by Auth0 security</li>
                  <li>• Two-factor authentication available through Auth0</li>
                  <li>• All login attempts are monitored</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">My Projects ({projects.length})</h3>
              
              {projects.length === 0 ? (
                <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No projects found. Start coding to see your projects here!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className={`p-4 border rounded-lg ${
                      darkMode ? 'border-dark-border bg-dark-bg' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold truncate">{project.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {project.language}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                      
                      <button
                        onClick={() => downloadProject(project)}
                        className={`flex items-center space-x-1 text-sm px-3 py-1 rounded hover:bg-opacity-80 ${
                          darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`max-w-md w-full mx-4 p-6 rounded-lg ${
              darkMode ? 'bg-dark-surface' : 'bg-white'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg mb-6 ${
                darkMode ? 'bg-red-900 bg-opacity-20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <h4 className="font-semibold text-red-600 mb-2">Warning: This will permanently:</h4>
                <ul className={`text-sm space-y-1 ${
                  darkMode ? 'text-red-300' : 'text-red-700'
                }`}>
                  <li>• Delete your account and profile</li>
                  <li>• Remove all your projects ({projects.length} projects)</li>
                  <li>• Invalidate all shared project links</li>
                  <li>• Log you out immediately</li>
                </ul>
              </div>
              
              <div className={`p-4 rounded-lg mb-6 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Before you delete:</strong> Consider downloading your projects first. 
                  You can do this from the "My Projects" tab.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;