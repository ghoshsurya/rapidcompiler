import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import Auth from './pages/Auth';
import Projects from './pages/Projects';
import SharedProject from './pages/SharedProject';
import AdminLogin from './pages/AdminLogin';
import ResetPassword from './pages/ResetPassword';
import SimplePasswordReset from './pages/SimplePasswordReset';
import AuthCallback from './pages/AuthCallback';
import PasswordResetHandler from './components/PasswordResetHandler';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import Navbar from './components/Navbar';
import AuthDebug from './components/AuthDebug';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { auth0Config } from './lib/supabase';
import './index.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);



  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience
      }}
    >
      <AuthProvider>
        <Router>
        <div className={`min-h-screen ${darkMode ? 'dark bg-dark-bg text-dark-text' : 'bg-gray-50'}`}>
          <Routes>
            {/* Admin routes without navbar */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/simple-reset" element={<SimplePasswordReset />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard darkMode={darkMode} /></AdminRoute>} />
            
            {/* Regular routes with navbar */}
            <Route path="/*" element={
              <>
                <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
                <Routes>
                  <Route path="/" element={<CodeEditor darkMode={darkMode} />} />
                  <Route path="/login" element={<Auth darkMode={darkMode} />} />
                  <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile darkMode={darkMode} /></ProtectedRoute>} />
                  <Route path="/share/:shareId" element={<SharedProject darkMode={darkMode} />} />
                </Routes>
              </>
            } />
          </Routes>
        </div>
        </Router>
      </AuthProvider>
    </Auth0Provider>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.is_admin ? children : <Navigate to="/admin/login" />;
}

export default App;