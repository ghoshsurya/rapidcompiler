import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const value = {
    user,
    loading,
    login: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    register: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    logout: () => setUser(null),
    updateProfile: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    updatePassword: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    uploadAvatar: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    adminLogin: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    resetPassword: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    updatePasswordWithToken: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    signInWithGoogle: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    getAllUsers: () => Promise.resolve({ success: false, error: 'Not implemented' }),
    deleteUser: () => Promise.resolve({ success: false, error: 'Not implemented' })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};