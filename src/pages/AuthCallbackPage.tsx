import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          showErrorToast('Authentication failed. Please try again.');
          navigate('/');
          return;
        }

        if (data.session) {
          showSuccessToast('Successfully signed in with Google!');
          // Redirect to the page they were trying to access or home
          const redirectTo = sessionStorage.getItem('auth_redirect') || '/';
          sessionStorage.removeItem('auth_redirect');
          navigate(redirectTo);
        } else {
          // No session found, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        showErrorToast('Authentication failed. Please try again.');
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;