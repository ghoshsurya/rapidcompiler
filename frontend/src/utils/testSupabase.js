// SUPABASE TEST UTILITIES - COMMENTED OUT
// import { supabase } from '../lib/supabase';

export const testApiConnection = async () => {
  try {
    const response = await fetch('/.netlify/functions/neon-api/health');
    const data = await response.json();
    console.log('API connection successful:', data);
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
};

export const testAuth = async () => {
  try {
    const token = localStorage.getItem('auth0_token');
    console.log('Auth0 token present:', !!token);
    return !!token;
  } catch (error) {
    console.error('Auth test failed:', error);
    return false;
  }
};

/* ORIGINAL SUPABASE CODE - BACKUP
// import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase test failed:', error);
    return false;
  }
};

export const testAuthOriginal = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    return { session, user };
  } catch (error) {
    console.error('Auth test failed:', error);
    return null;
  }
};
*/