import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface AuthFormProps {
  onSuccess: () => void;
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

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(isSignUp ? signUpSchema : signInSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(data.email, data.password, data.fullName);
        if (error) throw error;
        toast.success('Account created successfully!');
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        toast.success('Signed in successfully!');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-600">
          {isSignUp
            ? 'Join SportPro to start shopping'
            : 'Sign in to your account to continue'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isSignUp && (
          <Input
            label="Full Name"
            {...register('fullName')}
            error={errors.fullName?.message}
            placeholder="Enter your full name"
          />
        )}
        
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter your email"
        />
        
        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Enter your password"
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          className="mt-6"
        >
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-orange-600 hover:text-orange-700 font-medium"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;