import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
// import { supabase } from '../lib/supabase'; // COMMENTED OUT - MIGRATED TO AUTH0
import { testApiConnection, testAuth } from '../utils/testSupabase';

const AuthDebug = () => {
  const { user, loading } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState('testing...');
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    const runTests = async () => {
      const connectionOk = await testApiConnection();
      setSupabaseStatus(connectionOk ? 'Connected' : 'Failed');
      
      const authData = await testAuth();
      setAuthStatus(authData);
    };
    
    runTests();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      <p>Supabase: {supabaseStatus}</p>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
      
      {user && (
        <div className="mt-2 border-t border-gray-600 pt-2">
          <p>ID: {user.id?.substring(0, 8)}...</p>
          <p>Email: {user.email}</p>
          <p>Username: {user.username}</p>
          <p>Admin: {user.is_admin ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      {authStatus && (
        <div className="mt-2 border-t border-gray-600 pt-2">
          <p>Session: {authStatus.session ? 'Active' : 'None'}</p>
          <p>Auth User: {authStatus.user ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 bg-blue-600 px-2 py-1 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  );
};

export default AuthDebug;