import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import SharedProject from './pages/SharedProject';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './hooks/useAuth';
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
    <AuthProvider>
      <Router>
        <div className={`min-h-screen ${darkMode ? 'dark bg-dark-bg text-dark-text' : 'bg-gray-50'}`}>
          <Routes>
            {/* Admin routes without navbar */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard darkMode={darkMode} /></AdminRoute>} />
            
            {/* Regular routes with navbar */}
            <Route path="/*" element={
              <>
                <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
                <Routes>
                  <Route path="/" element={<CodeEditor darkMode={darkMode} />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
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