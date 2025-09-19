import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Users, Trash2, Shield, Mail, Calendar, Search, Eye } from 'lucide-react';

const AdminDashboard = ({ darkMode }) => {
  const { user, getAllUsers, deleteUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeUsers: 0,
    publicProjects: 0
  });

  useEffect(() => {
    if (user?.is_admin) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    
    // Fetch users
    const usersResult = await getAllUsers();
    if (usersResult.success) {
      setUsers(usersResult.data);
    }
    
    // Fetch all projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*, users(username, email)')
      .order('created_at', { ascending: false });
    
    if (projectsData) {
      setProjects(projectsData);
    }
    
    // Calculate stats
    calculateStats(usersResult.data || [], projectsData || []);
    setLoading(false);
  };

  const calculateStats = (usersData, projectsData) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setStats({
      totalUsers: usersData.length,
      totalProjects: projectsData.length,
      activeUsers: usersData.filter(u => new Date(u.updated_at) > weekAgo).length,
      publicProjects: projectsData.filter(p => p.is_public).length
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    const result = await deleteUser(userId);
    
    if (result.success) {
      alert('User deleted successfully');
      fetchAllData();
    } else {
      alert('Error: ' + result.error);
    }
    setLoading(false);
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);
      
      if (!error) {
        alert(`Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
        fetchAllData();
      }
    } catch (error) {
      alert('Error updating admin status');
    }
  };

  const viewUserProjects = async (userId) => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);
    
    setSelectedUser({ ...users.find(u => u.id === userId), projects: data || [] });
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user?.is_admin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-dark-bg text-dark-text' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-500" />
            <span className="text-sm text-red-600 font-medium">Admin Access</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
            { label: 'Total Projects', value: stats.totalProjects, icon: Eye, color: 'green' },
            { label: 'Active Users', value: stats.activeUsers, icon: Calendar, color: 'yellow' },
            { label: 'Public Projects', value: stats.publicProjects, icon: Shield, color: 'purple' }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`p-6 rounded-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                  <p className="text-3xl font-bold">{value}</p>
                </div>
                <Icon className={`h-8 w-8 text-${color}-500`} />
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow-lg`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-white border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className={`rounded-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'} shadow-lg overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">User Management ({filteredUsers.length})</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id} className={`${darkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {userData.avatar_url ? (
                              <img className="h-10 w-10 rounded-full" src={userData.avatar_url} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {userData.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">{userData.username}</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {userData.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{userData.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userData.is_admin 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {userData.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(userData.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => viewUserProjects(userData.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleAdminStatus(userData.id, userData.is_admin)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title={userData.is_admin ? 'Revoke Admin' : 'Grant Admin'}
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        {userData.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(userData.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`max-w-2xl w-full mx-4 p-6 rounded-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{selectedUser.username}'s Projects</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedUser.projects?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No projects found</p>
                ) : (
                  selectedUser.projects?.map((project) => (
                    <div key={project.id} className={`p-3 border rounded ${
                      darkMode ? 'border-dark-border' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{project.title}</h4>
                          <p className="text-sm text-gray-500">
                            {project.language} • {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          project.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;