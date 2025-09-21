import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import logo from '../assests/logo.white.png';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [unsubscribeResult, setUnsubscribeResult] = useState<{
    success: boolean;
    message: string;
    email?: string;
  } | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    // If there's a token in the URL, automatically unsubscribe
    if (token) {
      handleUnsubscribeWithToken(token);
    }
  }, [token]);

  const handleUnsubscribeWithToken = async (unsubscribeToken: string) => {
    setLoading(true);
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-unsubscribe`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: unsubscribeToken
        }),
      });

      const data = await response.json();
      setUnsubscribeResult(data);

      if (data.success) {
        showSuccessToast(data.message);
      } else {
        showErrorToast(data.message);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setUnsubscribeResult({
        success: false,
        message: 'Failed to unsubscribe. Please try again.'
      });
      showErrorToast('Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribeWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showErrorToast('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-unsubscribe`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim()
        }),
      });

      const data = await response.json();
      setUnsubscribeResult(data);

      if (data.success) {
        showSuccessToast(data.message);
        setEmail('');
      } else {
        showErrorToast(data.message);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setUnsubscribeResult({
        success: false,
        message: 'Failed to unsubscribe. Please try again.'
      });
      showErrorToast('Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Kixora"
            className="h-16 w-auto mx-auto mb-4"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black border border-white/20 rounded-lg p-6 text-center"
        >
          {loading ? (
            <div className="py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Processing unsubscribe request...</p>
            </div>
          ) : unsubscribeResult ? (
            <div className="py-4">
              {unsubscribeResult.success ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Successfully Unsubscribed
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {unsubscribeResult.email && (
                      <><strong>{unsubscribeResult.email}</strong> has been </>
                    )}
                    removed from our newsletter list.
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    You will no longer receive newsletter emails from us.
                    If you change your mind, you can always subscribe again from our website.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Unsubscribe Failed
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {unsubscribeResult.message}
                  </p>
                </>
              )}

              <Link to="/">
                <Button
                  variant="ghost"
                  className="text-white border-white hover:bg-white hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Mail className="h-12 w-12 text-white mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Unsubscribe from Newsletter
              </h2>
              <p className="text-gray-400 mb-6">
                Sorry to see you go! Enter your email address to unsubscribe from our newsletter.
              </p>

              <form onSubmit={handleUnsubscribeWithEmail} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  variant="dark"
                  className="text-center"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  fullWidth
                  className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  {loading ? 'Unsubscribing...' : 'Unsubscribe'}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/20">
                <Link to="/">
                  <Button
                    variant="ghost"
                    className="text-white border-white hover:bg-white hover:text-black transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Need help? <a href="mailto:support@kixora.com" className="text-white hover:opacity-70">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage;