import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import {
  User, Mail, Lock, Camera, Download, Code2, Calendar,
  Trash2, AlertTriangle, Share2, FolderOpen, Settings,
  Shield, ChevronRight, ExternalLink, CheckCircle, Clock,
  MoreHorizontal, Pencil, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/* ─── Language badge colours ─────────────────────────────────────────── */
const LANG_COLORS = {
  python:     'bg-blue-500/15 text-blue-400 ring-blue-500/25',
  javascript: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/25',
  typescript: 'bg-sky-500/15 text-sky-400 ring-sky-500/25',
  c:          'bg-gray-500/15 text-gray-400 ring-gray-500/25',
  cpp:        'bg-purple-500/15 text-purple-400 ring-purple-500/25',
  java:       'bg-red-500/15 text-red-400 ring-red-500/25',
  csharp:     'bg-violet-500/15 text-violet-400 ring-violet-500/25',
  go:         'bg-cyan-500/15 text-cyan-400 ring-cyan-500/25',
  rust:       'bg-orange-500/15 text-orange-400 ring-orange-500/25',
  swift:      'bg-pink-500/15 text-pink-400 ring-pink-500/25',
  ruby:       'bg-rose-500/15 text-rose-400 ring-rose-500/25',
  php:        'bg-indigo-500/15 text-indigo-400 ring-indigo-500/25',
  sql:        'bg-green-500/15 text-green-400 ring-green-500/25',
  web:        'bg-teal-500/15 text-teal-400 ring-teal-500/25',
};

const langColor = (lang) => LANG_COLORS[lang] || 'bg-gray-500/15 text-gray-400 ring-gray-500/25';

const FILE_EXTS = {
  python:'py', javascript:'js', typescript:'ts', c:'c', cpp:'cpp',
  java:'java', csharp:'cs', go:'go', rust:'rs', swift:'swift',
  ruby:'rb', php:'php', sql:'sql', web:'html',
};

/* ─── Toast notification ─────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-[100] flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all duration-300 ${
    type === 'success'
      ? 'bg-[#161b22] border-green-500/30 text-green-400'
      : 'bg-[#161b22] border-red-500/30 text-red-400'
  }`}>
    {type === 'success'
      ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
      : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);

/* ─── Stat card ──────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center space-x-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  </div>
);

const UserProfile = ({ darkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [openProjectMenu, setOpenProjectMenu] = useState(null);
  const [formData, setFormData] = useState({ username: '', full_name: '' });
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username || '', full_name: user.full_name || '' });
      fetchProjects();
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data || []);
    } catch { /* silent */ }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, {
        username: formData.username,
        full_name: formData.full_name,
      });
      showToast('Profile updated successfully!');
      setFormDirty(false);
    } catch (err) {
      showToast('Failed to update profile: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://${process.env.REACT_APP_AUTH0_DOMAIN}/dbconnections/change_password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
            email: user.email,
            connection: 'Username-Password-Authentication',
          }),
        }
      );
      if (res.ok) {
        showToast('Password reset email sent! Check your inbox.');
      } else {
        showToast('Could not send reset email. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setLoading(true);
    try {
      await api.delete(`/users/${user.id}`);
      showToast('Account deleted. Goodbye!');
      setTimeout(() => { logout(); navigate('/'); }, 1500);
    } catch (err) {
      showToast('Failed to delete account: ' + err.message, 'error');
    }
    setLoading(false);
    setShowDeleteModal(false);
  };

  const shareProject = (project) => {
    const url = `${window.location.origin}/share/${project.share_id}`;
    navigator.clipboard.writeText(url);
    showToast('Share link copied to clipboard!');
    setOpenProjectMenu(null);
  };

  const downloadProject = (project) => {
    const ext = FILE_EXTS[project.language] || 'txt';
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
    const blob = new Blob([project.code], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setOpenProjectMenu(null);
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      showToast('Project deleted.');
      fetchProjects();
    } catch {
      showToast('Failed to delete project.', 'error');
    }
    setOpenProjectMenu(null);
  };

  const initials = (user?.full_name || user?.username || 'U')
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile',  label: 'Profile',  icon: Settings },
    { id: 'projects', label: `Projects ${projects.length > 0 ? `(${projects.length})` : ''}`, icon: FolderOpen },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Hero header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#30363d]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-transparent to-purple-600/8 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-2xl"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-blue-500/20 shadow-2xl">
                  <span className="text-white text-3xl font-extrabold">{initials}</span>
                </div>
              )}
              <label className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors shadow-lg">
                <Camera className="h-3.5 w-3.5 text-gray-400" />
                <input type="file" accept="image/*" className="hidden"
                  onChange={() => showToast('Avatar upload coming soon!', 'error')} />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate">
                {user.full_name || user.username || 'Your Profile'}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5 flex items-center space-x-1">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
              <p className="text-gray-600 text-xs mt-1 flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Member since {memberSince}</span>
              </p>
            </div>

            {/* Stats — desktop */}
            <div className="hidden md:grid grid-cols-2 gap-3 flex-shrink-0">
              <StatCard icon={FolderOpen} label="Projects" value={projects.length} accent="bg-blue-500/15 text-blue-400" />
              <StatCard icon={Code2}     label="Languages" value={new Set(projects.map(p => p.language)).size} accent="bg-purple-500/15 text-purple-400" />
            </div>
          </div>

          {/* Stats — mobile */}
          <div className="grid grid-cols-2 gap-3 mt-6 md:hidden">
            <StatCard icon={FolderOpen} label="Projects" value={projects.length} accent="bg-blue-500/15 text-blue-400" />
            <StatCard icon={Code2}      label="Languages" value={new Set(projects.map(p => p.language)).size} accent="bg-purple-500/15 text-purple-400" />
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="border-b border-[#30363d] sticky top-14 bg-[#0d1117]/95 backdrop-blur-md z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex space-x-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-150 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── PROFILE TAB ─────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Profile Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Update your display name and username</p>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => { setFormData({ ...formData, full_name: e.target.value }); setFormDirty(true); }}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 bg-[#161b22] border border-[#30363d] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setFormDirty(true); }}
                  placeholder="your_username"
                  className="w-full px-4 py-2.5 bg-[#161b22] border border-[#30363d] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-[#161b22]/50 border border-[#30363d] rounded-xl text-gray-500 text-sm cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-[#0d1117] px-2 py-0.5 rounded-md border border-[#30363d]">
                    managed by Auth0
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={loading || !formDirty}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
                >
                  {loading ? 'Saving…' : 'Save changes'}
                </button>
                {formDirty && (
                  <button
                    type="button"
                    onClick={() => { setFormData({ username: user.username || '', full_name: user.full_name || '' }); setFormDirty(false); }}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Danger zone */}
            <div className="mt-10 border border-red-500/20 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-red-500/5 border-b border-red-500/20">
                <h3 className="text-red-400 font-semibold text-sm flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Danger Zone</span>
                </h3>
              </div>
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">Delete this account</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Permanently removes your account and all {projects.length} project{projects.length !== 1 ? 's' : ''}. Irreversible.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-shrink-0 px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 text-sm font-medium rounded-xl transition-all"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PROJECTS TAB ────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">My Projects</h2>
                <p className="text-gray-500 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} saved</p>
              </div>
              <Link
                to="/"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
              >
                <Code2 className="h-4 w-4" />
                <span>New project</span>
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-[#161b22] border border-[#30363d] rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="h-7 w-7 text-gray-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs">
                  Head to the editor, write some code, and save your first project.
                </p>
                <Link
                  to="/"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Open editor
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isMenuOpen={openProjectMenu === project.id}
                    onMenuToggle={(id) => setOpenProjectMenu(openProjectMenu === id ? null : id)}
                    onMenuClose={() => setOpenProjectMenu(null)}
                    onShare={shareProject}
                    onDownload={downloadProject}
                    onDelete={deleteProject}
                    langColor={langColor}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SECURITY TAB ────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Security</h2>
              <p className="text-gray-500 text-sm mt-0.5">Manage your authentication and account security</p>
            </div>

            {/* Password reset */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#30363d]">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                    <Lock className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Password</p>
                    <p className="text-gray-500 text-xs">Send a password reset link to your email</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-gray-400 text-sm mb-4">
                  We'll email a secure link to <span className="text-white font-medium">{user.email}</span> to let you set a new password.
                </p>
                <button
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
                >
                  {loading ? 'Sending…' : 'Send reset email'}
                </button>
              </div>
            </div>

            {/* Auth0 security info */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#30363d]">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Auth0 Protection</p>
                    <p className="text-gray-500 text-xs">Your account security features</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-[#30363d]">
                {[
                  { label: 'Brute-force protection',     status: 'Active' },
                  { label: 'Anomaly detection',          status: 'Active' },
                  { label: 'Secure session management',  status: 'Active' },
                  { label: 'Two-factor authentication',  status: 'via Auth0' },
                ].map(({ label, status }) => (
                  <div key={label} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{label}</span>
                    <span className="text-green-400 text-xs font-medium flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>{status}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign out everywhere */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Sign out</p>
                <p className="text-gray-500 text-xs mt-0.5">End your current session</p>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="px-4 py-2 border border-[#30363d] hover:border-red-500/40 text-gray-400 hover:text-red-400 text-sm font-medium rounded-xl transition-all hover:bg-red-500/5"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete account modal ───────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#30363d]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <h3 className="text-white font-bold">Delete Account</h3>
              </div>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <p className="text-gray-300 text-sm leading-relaxed">
                This will permanently delete your account, all <strong className="text-white">{projects.length} project{projects.length !== 1 ? 's' : ''}</strong>, and invalidate all shared links. <strong className="text-red-400">This action cannot be undone.</strong>
              </p>

              <div className="bg-[#0d1117] border border-red-500/20 rounded-xl p-4 space-y-1.5">
                {[
                  'Your profile and account data',
                  `All ${projects.length} saved project${projects.length !== 1 ? 's' : ''}`,
                  'All shared project links',
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-2 text-sm text-red-400">
                    <X className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Type <span className="font-mono font-bold text-white bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 rounded-xl text-white placeholder-gray-700 text-sm font-mono outline-none transition-all"
                />
              </div>

              <div className="flex space-x-3 pt-1">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  className="flex-1 px-4 py-2.5 border border-[#30363d] hover:border-gray-500 text-gray-400 hover:text-gray-200 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmText !== 'DELETE'}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-red-600/20"
                >
                  {loading ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Project card ────────────────────────────────────────────────────── */
const ProjectCard = ({ project, isMenuOpen, onMenuToggle, onMenuClose, onShare, onDownload, onDelete, langColor }) => {
  const menuRef = React.useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onMenuClose();
    };
    if (isMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMenuOpen]);

  return (
    <div className="group bg-[#161b22] border border-[#30363d] hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ring-1 ${langColor(project.language)}`}>
          {project.language}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => onMenuToggle(project.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl z-20 overflow-hidden">
              <button onClick={() => onShare(project)}    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"><Share2 className="h-3.5 w-3.5 text-gray-500" /><span>Copy share link</span></button>
              <button onClick={() => onDownload(project)} className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"><Download className="h-3.5 w-3.5 text-gray-500" /><span>Download</span></button>
              <div className="border-t border-[#30363d]" />
              <button onClick={() => onDelete(project.id)} className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /><span>Delete</span></button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-white font-semibold text-sm mb-1 truncate">{project.title}</h4>

      {/* Meta */}
      <p className="text-gray-600 text-xs flex items-center space-x-1 mb-4">
        <Clock className="h-3 w-3" />
        <span>{new Date(project.updated_at || project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </p>

      {/* Open button */}
      <div className="mt-auto">
        <Link
          to={`/?project=${project.id}`}
          className="flex items-center justify-center space-x-2 w-full py-2 bg-white/5 hover:bg-blue-500/15 border border-[#30363d] hover:border-blue-500/30 rounded-xl text-sm font-medium text-gray-300 hover:text-blue-300 transition-all duration-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Open in editor</span>
        </Link>
      </div>
    </div>
  );
};

export default UserProfile;
