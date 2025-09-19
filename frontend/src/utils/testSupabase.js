import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  try {
    // Test basic connection
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

export const testAuth = async () => {
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