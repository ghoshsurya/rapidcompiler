import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, User, LogOut, Code } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`border-b ${darkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200'} px-2 sm:px-4 py-3`}>
      <div className="w-full flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <Code className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <span className="text-lg sm:text-xl font-bold">RapidCompiler</span>
        </Link>

        <div className="flex items-center space-x-1 sm:space-x-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 sm:p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Link
                to="/projects"
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hidden sm:block`}
              >
                Projects
              </Link>
              <Link
                to="/profile"
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hidden sm:block`}
              >
                Profile
              </Link>
              {user?.is_admin && (
                <Link
                  to="/admin"
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base rounded-lg bg-red-600 text-white hover:bg-red-700 hidden sm:block`}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/profile"
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} sm:hidden`}
              >
                <User className="h-4 w-4" />
              </Link>
              <div className="hidden md:flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="text-sm">{user?.username || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className={`p-1.5 sm:p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Account</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;