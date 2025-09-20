import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { showSuccessToast, showErrorToast } from '../ui/CustomToast';
import logoWhite from '../../assests/logo.white.png';

interface AuthFormProps {
  onSuccess: () => void;
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

const AuthForm = ({ onSuccess, initialMode = 'signin' }: AuthFormProps) => {
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
    <div>
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
            {getTitle()}
          </h2>
          <p className="text-gray-400 text-sm">
            {getSubtitle()}
          </p>
        </div>

        {emailSent && (authMode === 'forgot' || authMode === 'signup') ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {authMode === 'forgot' ? 'Email Sent!' : 'Account Created!'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {authMode === 'forgot'
                ? "We've sent a password reset link to your email address. Please check your inbox and follow the instructions."
                : "Welcome to Kixora! We've sent a confirmation email to your inbox. Please click the link in the email to verify your account and complete the registration process."
              }
            </p>
            <button
              onClick={() => switchMode('signin')}
              className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
            >
              {authMode === 'forgot' ? 'Back to Sign In' : 'Continue to Sign In'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name - Only for signup */}
            {authMode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                  Full Name
                </label>
                <Input
                  {...register('fullName')}
                  error={errors.fullName?.message}
                  placeholder="Enter your full name"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                />
              </div>
            )}

            {/* Email - For signin, signup, forgot, changeemail */}
            {(authMode === 'signin' || authMode === 'signup' || authMode === 'forgot') && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                  Email
                </label>
                <Input
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="Enter your email"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                />
              </div>
            )}

            {/* New Email - Only for changeemail */}
            {authMode === 'changeemail' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                  New Email
                </label>
                <Input
                  type="email"
                  {...register('newEmail')}
                  error={errors.newEmail?.message}
                  placeholder="Enter your new email"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                />
              </div>
            )}

            {/* Password - For signin, signup, reset */}
            {(authMode === 'signin' || authMode === 'signup' || authMode === 'reset') && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                  Password
                </label>
                <Input
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="Enter your password"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                />
              </div>
            )}

            {/* Confirm Password - Only for reset */}
            {authMode === 'reset' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-white uppercase tracking-wide">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  placeholder="Confirm your password"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 text-sm"
                />
              </div>
            )}

            {/* Forgot Password Link - Only for signin */}
            {authMode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-gray-400 hover:text-white text-xs transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="mt-6 !bg-white !text-black hover:!bg-gray-200 !text-sm font-medium"
            >
              {authMode === 'signin' && 'Sign In'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'forgot' && 'Send Reset Link'}
              {authMode === 'reset' && 'Update Password'}
              {authMode === 'changeemail' && 'Change Email'}
            </Button>

          </form>
        )}

        <div className="text-center mt-6 space-y-2">
          {authMode === 'signin' && (
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="text-gray-400 hover:text-white font-medium text-sm transition-colors block w-full"
            >
              Don't have an account? Sign up
            </button>
          )}

          {authMode === 'signup' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-gray-400 hover:text-white font-medium text-sm transition-colors block w-full"
            >
              Already have an account? Sign in
            </button>
          )}

          {authMode === 'forgot' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-gray-400 hover:text-white font-medium text-sm transition-colors block w-full"
            >
              Back to Sign In
            </button>
          )}

          {authMode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-gray-400 hover:text-white font-medium text-sm transition-colors block w-full"
            >
              Back to Sign In
            </button>
          )}

          {authMode === 'changeemail' && (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-gray-400 hover:text-white font-medium text-sm transition-colors block w-full"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;