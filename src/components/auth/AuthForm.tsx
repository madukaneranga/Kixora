import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { showSuccessToast, showErrorToast } from '../ui/CustomToast';
import logoBlack from '../../assests/logo.black.png';

interface AuthFormProps {
  onSuccess: () => void;
  onClose?: () => void;
  initialMode?: AuthMode;
}

const signInSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const signUpSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  fullName: yup.string().required('Full name is required'),
});

const forgotPasswordSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

const resetPasswordSchema = yup.object({
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const changeEmailSchema = yup.object({
  newEmail: yup.string().email('Invalid email').required('New email is required'),
});

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'changeemail';

const AuthForm = ({ onSuccess, onClose, initialMode = 'signin' }: AuthFormProps) => {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword, updateEmail } = useAuth();

  const getSchema = () => {
    switch (authMode) {
      case 'signup': return signUpSchema;
      case 'forgot': return forgotPasswordSchema;
      case 'reset': return resetPasswordSchema;
      case 'changeemail': return changeEmailSchema;
      default: return signInSchema;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(getSchema()),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      switch (authMode) {
        case 'signup':
          const { error: signUpError } = await signUp(data.email, data.password, data.fullName);
          if (signUpError) throw signUpError;
          setEmailSent(true);
          showSuccessToast('Account created! Please check your email to confirm your account.');
          break;

        case 'signin':
          const { error: signInError } = await signIn(data.email, data.password);
          if (signInError) throw signInError;
          showSuccessToast('Signed in successfully!');
          onSuccess();
          break;

        case 'forgot':
          const { error: resetError } = await resetPassword(data.email);
          if (resetError) throw resetError;
          setEmailSent(true);
          showSuccessToast('Password reset email sent! Please check your inbox.');
          break;

        case 'reset':
          const { error: updateError } = await updatePassword(data.password);
          if (updateError) throw updateError;
          showSuccessToast('Password updated successfully!');
          onSuccess();
          break;

        case 'changeemail':
          const { error: emailError } = await updateEmail(data.newEmail);
          if (emailError) throw emailError;
          showSuccessToast('Email change confirmation sent! Please check both your old and new email.');
          onSuccess();
          break;
      }
    } catch (error: any) {
      showErrorToast(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setEmailSent(false);
    reset();
  };


  const getTitle = () => {
    switch (authMode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Forgot Password';
      case 'reset': return 'Reset Password';
      case 'changeemail': return 'Change Email';
      default: return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case 'signup': return 'Join Kixora to start shopping';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Enter your new password';
      case 'changeemail': return 'Enter your new email address';
      default: return 'Sign in to your account to continue';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-3xl shadow-xl overflow-hidden relative"
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={20} />
        </button>
      )}

      {/* Header */}
      <div className="px-6 pt-6 pb-4 text-center">
        <div className="flex items-center justify-center mx-auto mb-4">
          <img src={logoBlack} alt="Kixora" className="h-12 w-auto" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">
          {getTitle()}
        </h1>
        <p className="text-gray-600 text-xs">
          {getSubtitle()}
        </p>
      </div>

      {emailSent && (authMode === 'forgot' || authMode === 'signup') ? (
        <div className="px-6 pb-6 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            {authMode === 'forgot' ? 'Check Your Email' : 'Welcome to Kixora!'}
          </h3>
          <p className="text-gray-600 text-xs leading-relaxed mb-6 max-w-sm mx-auto">
            {authMode === 'forgot'
              ? "We've sent a password reset link to your email address. Click the link to reset your password."
              : "Your account has been created successfully! Please check your email to verify your account and get started."
            }
          </p>
          <button
            onClick={() => switchMode('signin')}
            className="w-full bg-black text-white py-2.5 px-5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {authMode === 'forgot' ? 'Back to Sign In' : 'Continue to Sign In'}
          </button>
        </div>
      ) : (
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Full Name - Only for signup */}
            {authMode === 'signup' && (
              <div>
                <input
                  {...register('fullName')}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                )}
              </div>
            )}

            {/* Email */}
            {(authMode === 'signin' || authMode === 'signup' || authMode === 'forgot') && (
              <div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="Email address"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            )}

            {/* New Email - Only for changeemail */}
            {authMode === 'changeemail' && (
              <div>
                <input
                  type="email"
                  {...register('newEmail')}
                  placeholder="New email address"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                />
                {errors.newEmail && (
                  <p className="mt-1 text-xs text-red-500">{errors.newEmail.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            {(authMode === 'signin' || authMode === 'signup' || authMode === 'reset') && (
              <div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Password"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Confirm Password - Only for reset */}
            {authMode === 'reset' && (
              <div>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}

            {/* Forgot Password Link - Only for signin */}
            {authMode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2.5 px-5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                <>
                  {authMode === 'signin' && 'Sign In'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'forgot' && 'Send Reset Link'}
                  {authMode === 'reset' && 'Update Password'}
                  {authMode === 'changeemail' && 'Change Email'}
                </>
              )}
            </button>
          </form>

          {/* Bottom Links */}
          <div className="text-center mt-4">
            {authMode === 'signin' && (
              <p className="text-gray-600 text-xs">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-black font-medium hover:underline transition-colors"
                >
                  Sign up
                </button>
              </p>
            )}

            {authMode === 'signup' && (
              <p className="text-gray-600 text-xs">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-black font-medium hover:underline transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}

            {(authMode === 'forgot' || authMode === 'reset' || authMode === 'changeemail') && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-gray-600 text-xs hover:text-gray-900 transition-colors"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AuthForm;