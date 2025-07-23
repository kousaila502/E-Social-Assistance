import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { LoginCredentials } from '../../services/authService';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<LoginCredentials>();

  // Display success message if redirected from registration
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message, {
        duration: 6000,
        position: 'top-center',
      });
    }
  }, [location]);

  // Clear errors when user starts typing
  useEffect(() => {
    clearError();
  }, [clearError]);

  const getErrorMessage = (errorCode: string | undefined, originalMessage: string) => {
    const errorMessages: Record<string, string> = {
      'INVALID_CREDENTIALS': 'Invalid email or password. Please check your credentials and try again.',
      'ACCOUNT_LOCKED': 'Your account has been temporarily locked due to too many failed login attempts. Please try again later.',
      'ACCOUNT_SUSPENDED': 'Your account has been suspended. Please contact support for assistance.',
      'SERVER_ERROR': 'We are experiencing technical difficulties. Please try again in a few moments.',
      'NETWORK_ERROR': 'Unable to connect to our servers. Please check your internet connection and try again.',
    };

    // Don't override with generic message, use original server message
    return errorMessages[errorCode || ''] || originalMessage || 'Login failed. Please try again.';
  };

  const onSubmit = async (data: LoginCredentials) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearErrors();
    clearError();

    try {
      await login(data);

      toast.success('Welcome back! 🎉', {
        duration: 3000,
        position: 'top-center',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);

      let errorMessage = 'Login failed. Please try again.';
      let errorCode = '';

      // Handle different types of errors
      if (err.response?.data) {
        const { message, code, errors: fieldErrors } = err.response.data;
        errorCode = code;
        errorMessage = message || errorMessage;

        // Handle field-specific errors
        if (fieldErrors) {
          Object.keys(fieldErrors).forEach(field => {
            setError(field as keyof LoginCredentials, {
              type: 'server',
              message: fieldErrors[field]
            });
          });
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Get user-friendly error message
      const friendlyMessage = getErrorMessage(errorCode, errorMessage);

      // Show toast notification
      toast.error(friendlyMessage, {
        duration: 5000,
        position: 'top-center',
      });

      // Set form error for display
      setError('root', {
        type: 'manual',
        message: friendlyMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Display general error */}
        {(error || errors.root) && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 animate-in slide-in-from-top-5 duration-300">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-red-700 font-medium">
                  {error || errors.root?.message}
                </div>
                {(error === 'Please verify your email address before signing in. Check your inbox for the verification link.' ||
                  errors.root?.message?.includes('verify')) && (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-500 underline"
                        onClick={() => toast.success('Verification email resent! Please check your inbox.', {
                          duration: 4000,
                          position: 'top-center',
                        })}
                      >
                        Resend verification email
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              id="email"
              type="email"
              autoComplete="email"
              className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${errors.email
                  ? 'border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-colors duration-200`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters long'
                  }
                })}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${errors.password
                    ? 'border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-colors duration-200`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {/* Remember me and Forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-all duration-200 ${isLoading || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
          >
            {isLoading || isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing you in...
              </>
            ) : (
              <>
                Sign in
                <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;