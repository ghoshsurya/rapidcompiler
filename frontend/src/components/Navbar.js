import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, Code2, FolderOpen, User, ChevronDown, Shield, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  /* Derive avatar initials */
  const initials = (user?.full_name || user?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
        isActive(to)
          ? darkMode
            ? 'bg-blue-500/15 text-blue-400'
            : 'bg-blue-50 text-blue-600'
          : darkMode
          ? 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
      {isActive(to) && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
      )}
    </Link>
  );

  return (
    <nav
      className={`sticky top-0 z-40 border-b backdrop-blur-md ${
        darkMode
          ? 'bg-[#0d1117]/90 border-[#30363d]'
          : 'bg-white/90 border-gray-200'
      }`}
    >
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* ── Logo ──────────────────────────────────────────────── */}
        <Link
          to="/"
          className="flex items-center space-x-2.5 flex-shrink-0 group"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:shadow-blue-600/50 transition-shadow">
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <span className={`font-bold text-base tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            RapidCompiler
          </span>
        </Link>

        {/* ── Right side ────────────────────────────────────────── */}
        <div className="flex items-center space-x-1 sm:space-x-2">

          {/* Nav links — desktop only */}
          {user && (
            <div className="hidden sm:flex items-center space-x-1 mr-2">
              {navLink('/', 'Editor')}
              {navLink('/projects', 'Projects')}
            </div>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-all duration-150 ${
              darkMode
                ? 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-300/10'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />}
          </button>

          {/* ── Authenticated: avatar dropdown ──────────────────── */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={`flex items-center space-x-2 pl-1 pr-2 py-1 rounded-xl transition-all duration-150 ${
                  dropdownOpen
                    ? darkMode ? 'bg-white/10' : 'bg-gray-100'
                    : darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                }`}
              >
                {/* Avatar */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-blue-500/40">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                )}
                {/* Name — md+ only */}
                <span className={`hidden md:block text-sm font-medium max-w-[100px] truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {user.username || user.full_name || 'User'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-60 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                    darkMode
                      ? 'bg-[#161b22] border-[#30363d] shadow-black/60'
                      : 'bg-white border-gray-200 shadow-gray-200/80'
                  }`}
                >
                  {/* User info header */}
                  <div className={`px-4 py-4 border-b ${darkMode ? 'border-[#30363d]' : 'border-gray-100'}`}>
                    <div className="flex items-center space-x-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-blue-500/30">
                          <span className="text-white text-sm font-bold">{initials}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.full_name || user.username || 'User'}
                        </p>
                        <p className="text-gray-500 text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <DropdownItem
                      to="/profile"
                      icon={<Settings className="h-4 w-4" />}
                      label="Profile & Settings"
                      darkMode={darkMode}
                      onClick={() => setDropdownOpen(false)}
                    />
                    <DropdownItem
                      to="/projects"
                      icon={<FolderOpen className="h-4 w-4" />}
                      label="My Projects"
                      darkMode={darkMode}
                      onClick={() => setDropdownOpen(false)}
                    />
                    {user?.is_admin && (
                      <DropdownItem
                        to="/admin"
                        icon={<Shield className="h-4 w-4" />}
                        label="Admin Dashboard"
                        darkMode={darkMode}
                        onClick={() => setDropdownOpen(false)}
                        accent="red"
                      />
                    )}
                  </div>

                  {/* Sign out */}
                  <div className={`border-t py-1.5 ${darkMode ? 'border-[#30363d]' : 'border-gray-100'}`}>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
                        darkMode
                          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Unauthenticated: login button ──────────────────── */
            <Link
              to="/login"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-md shadow-blue-600/30 hover:shadow-blue-500/40"
            >
              <User className="h-4 w-4" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

/* ─── Dropdown menu item ──────────────────────────────────────────────── */
const DropdownItem = ({ to, icon, label, darkMode, onClick, accent }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
      accent === 'red'
        ? darkMode
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
        : darkMode
        ? 'text-gray-300 hover:bg-white/5 hover:text-white'
        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <span className={accent === 'red' ? '' : darkMode ? 'text-gray-500' : 'text-gray-400'}>
      {icon}
    </span>
    <span className="font-medium">{label}</span>
  </Link>
);

export default Navbar;
