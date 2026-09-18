import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Users, Trash2, Shield, Mail, Calendar, Search, Eye, Code, BarChart2 } from 'lucide-react';

const AdminDashboard = ({ darkMode }) => {
  const { user, getAllUsers, deleteUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    if (user?.is_admin) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const usersResult = await getAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.data || []);
        setStats((s) => ({ ...s, totalUsers: (usersResult.data || []).length }));
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all their projects? This cannot be undone.')) return;
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

  const viewUserProjects = async (userId) => {
    try {
      const response = await api.get(`/projects?user_id=${userId}`);
      const targetUser = users.find((u) => u.id === userId);
      setSelectedUser({ ...targetUser, projects: response.data || [] });
    } catch {
      setSelectedUser({ ...users.find((u) => u.id === userId), projects: [] });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-500" />
            <span className="text-sm text-red-600 font-medium">Admin Access</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
            { label: 'Registered', value: users.filter((u) => u.created_at).length, icon: Calendar, color: 'green' },
            { label: 'Admins', value: users.filter((u) => u.is_admin).length, icon: Shield, color: 'red' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'}`}
            >
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

        {/* Search */}
        <div className={`p-4 rounded-lg mb-6 shadow-lg ${darkMode ? 'bg-dark-surface' : 'bg-white'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                darkMode
                  ? 'bg-dark-bg border-dark-border text-dark-text'
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-dark-surface' : 'bg-white'}`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold">
              User Management ({filteredUsers.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? 'bg-dark-bg' : 'bg-gray-50'}>
                  <tr>
                    {['User', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={darkMode ? 'hover:bg-dark-bg' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {u.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={u.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {u.username?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">{u.username}</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {u.full_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            u.is_admin
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {u.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => viewUserProjects(u.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View projects"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Projects Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`max-w-2xl w-full mx-4 p-6 rounded-lg ${
                darkMode ? 'bg-dark-surface' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {selectedUser.username}'s Projects ({selectedUser.projects?.length || 0})
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {!selectedUser.projects?.length ? (
                  <p className="text-gray-500 text-center py-4">No projects found</p>
                ) : (
                  selectedUser.projects.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 border rounded ${
                        darkMode ? 'border-dark-border' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{p.title}</h4>
                          <p className="text-sm text-gray-500">
                            {p.language} •{' '}
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString()
                              : '—'}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            p.is_public
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {p.is_public ? 'Public' : 'Private'}
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
