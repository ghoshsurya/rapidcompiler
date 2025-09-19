import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PasswordResetHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a password reset callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    console.log('Callback params:', { accessToken: !!accessToken, type });
    
    if (accessToken && type === 'recovery') {
      // Store the session and redirect to reset password page
      localStorage.setItem('supabase.auth.token', accessToken);
      navigate('/reset-password');
    } else {
      // Not a valid reset link, redirect to home
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing reset link...</p>
      </div>
    </div>
  );
};

export default PasswordResetHandler;