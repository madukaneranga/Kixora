import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';
import logoWhite from '../assests/logo.white.png';

const resetPasswordSchema = yup.object({
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const { updatePassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const handleTokenValidation = async () => {
      try {
        // Check URL hash params first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        let accessToken = hashParams.get('access_token');
        let refreshToken = hashParams.get('refresh_token');

        // If no tokens in hash, check URL search params
        if (!accessToken || !refreshToken) {
          const searchParams = new URLSearchParams(window.location.search);
          accessToken = searchParams.get('access_token');
          refreshToken = searchParams.get('refresh_token');
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          setValidToken(true);
        } else {
          // If no tokens found, check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setValidToken(true);
          } else {
            throw new Error('No valid reset token found');
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        showErrorToast('Invalid or expired reset link');
        navigate('/');
      } finally {
        setPageLoading(false);
      }
    };

    handleTokenValidation();
  }, [navigate]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { error } = await updatePassword(data.password);
      if (error) throw error;
      showSuccessToast('Password updated successfully!');
      navigate('/');
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <img
            src={logoWhite}
            alt="Kixora"
            className="h-12 w-auto mx-auto mb-4"
          />
          <div className="flex space-x-2 justify-center">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  y: [-8, 0, -8],
                }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4">Validating reset link...</p>
        </motion.div>
      </div>
    );
  }

  if (!validToken) {
    return null; // This shouldn't show since we redirect on invalid token
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black border border-white/10 rounded-xl shadow-2xl p-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logoWhite}
            alt="Kixora"
            className="h-12 w-auto mx-auto mb-6"
          />
          <h2 className="text-xl font-bold text-white mb-2">
            Reset Password
          </h2>
          <p className="text-gray-400 text-sm">
            Enter your new password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Password */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white uppercase tracking-wide">
              New Password
            </label>
            <Input
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="Enter your new password"
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white uppercase tracking-wide">
              Confirm Password
            </label>
            <Input
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="Confirm your new password"
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
            />
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="mt-6 !bg-white !text-black hover:!bg-gray-200 !text-sm font-medium"
          >
            Update Password
          </Button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;