import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { user: auth0User, isAuthenticated, isLoading, loginWithRedirect, logout: auth0Logout, getAccessTokenSilently } = useAuth0();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (isAuthenticated && auth0User) {
        try {
          const token = await getAccessTokenSilently();
          localStorage.setItem('auth0_token', token);
          await fetchUserProfile(auth0User);
        } catch (error) {
          console.error('Auth initialization error:', error);
        }
      }
      setLoading(false);
    };

    if (!isLoading) {
      initializeAuth();
    }
  }, [isAuthenticated, auth0User, isLoading, getAccessTokenSilently]);

  const fetchUserProfile = async (auth0User) => {
    try {
      const response = await api.get(`/users/${auth0User.sub}`);
      setUser(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        const newUser = {
          id: auth0User.sub,
          email: auth0User.email,
          username: auth0User.nickname || auth0User.email.split('@')[0],
          full_name: auth0User.name || '',
          avatar_url: auth0User.picture || null,
          is_admin: false
        };
        
        try {
          const response = await api.post('/users', newUser);
          setUser(response.data);
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          setUser(newUser);
        }
      }
    }
  };

  const login = () => loginWithRedirect();

  const logout = () => {
    localStorage.removeItem('auth0_token');
    setUser(null);
    auth0Logout({ returnTo: window.location.origin });
  };

  const updateProfile = async (updates) => {
    try {
      const response = await api.put(`/users/${user.id}`, updates);
      setUser({ ...user, ...response.data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await api.get('/users');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading: loading || isLoading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    getAllUsers,
    deleteUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};