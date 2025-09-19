import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Download, Share, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const UserProfile = ({ darkMode }) => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    profile_picture: ''
  });
  const [projects, setProjects] = useState([]);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        profile_picture: user.profile_picture || ''
      });
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (!error) setProjects(data || []);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('users')
      .update({
        username: profile.username,
        profile_picture: profile.profile_picture,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      updateUser({ ...user, ...profile });
      alert('Profile updated successfully!');
    } else {
      alert('Failed to update profile');
    }
    setLoading(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }
    
    setLoading(true);
    // Note: In production, you'd verify current password first
    const { error } = await supabase.auth.updateUser({
      password: passwords.new
    });

    if (!error) {
      alert('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } else {
      alert('Failed to change password');
    }
    setLoading(false);
  };

  const toggleProjectVisibility = async (projectId, isPublic) => {
    const { error } = await supabase
      .from('projects')
      .update({ is_public: !isPublic })
      .eq('id', projectId);

    if (!error) {
      fetchUserProjects();
    }
  };

  const downloadProject = (project) => {
    const extensions = {
      python: 'py',
      javascript: 'js',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      php: 'php',
      sql: 'sql',
      web: 'html'
    };
    
    const extension = extensions[project.language] || 'txt';
    const blob = new Blob([project.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareProject = async (project) => {
    const shareUrl = `${window.location.origin}/shared/${project.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark-bg text-dark-text' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Projects
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Security
              </button>
            </nav>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={`rounded-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow p-6`}>
            <h3 className="text-lg font-medium mb-6">Profile Information</h3>
            <form onSubmit={updateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({...profile, username: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className={`w-full px-3 py-2 border rounded-lg opacity-50 ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Profile Picture URL</label>
                  <input
                    type="url"
                    value={profile.profile_picture}
                    onChange={(e) => setProfile({...profile, profile_picture: e.target.value})}
                    placeholder="https://example.com/avatar.jpg"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className={`rounded-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">My Projects ({projects.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project.id} className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium">{project.title}</h4>
                    <p className="text-sm text-gray-500">
                      {project.language} • Updated {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.is_public 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.is_public ? 'Public' : 'Private'}
                    </span>
                    
                    <button
                      onClick={() => toggleProjectVisibility(project.id, project.is_public)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title={project.is_public ? 'Make Private' : 'Make Public'}
                    >
                      {project.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => shareProject(project)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Share Project"
                    >
                      <Share className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => downloadProject(project)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Download Code"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No projects yet. Start coding to see your projects here!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className={`rounded-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow p-6`}>
            <h3 className="text-lg font-medium mb-6">Change Password</h3>
            <form onSubmit={changePassword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Lock className="inline h-4 w-4 mr-2" />
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;