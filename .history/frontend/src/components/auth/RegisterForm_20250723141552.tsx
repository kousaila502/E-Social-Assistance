// src/components/auth/RegisterForm.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { RegisterData } from '../../services/authService';
import toast from 'react-hot-toast';
import ErrorSummary from '../shared/ErrorSummary';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
  terms: boolean;
}

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const { register: registerUser, isLoading, error } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    watch,
    setError,
    clearErrors
  } = useForm<RegisterFormData>();

  const watchPassword = watch('password');

  // Show error summary when form is submitted and has errors
  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) {
      setShowErrorSummary(true);
      // Scroll to top to show error summary
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errors, isSubmitted]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearErrors();
      setShowErrorSummary(false);
      
      const { confirmPassword, terms, ...registerData } = data;
      await registerUser(registerData);
      
      toast.success('🎉 Registration successful! Please check your email to verify your account.', {
        duration: 6000,
        position: 'top-center',
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific validation errors from backend
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        Object.keys(backendErrors).forEach(field => {
          setError(field as keyof RegisterFormData, {
            type: 'server',
            message: backendErrors[field]
          });
        });
        setShowErrorSummary(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // General error
        const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
        setError('root', {
          type: 'manual',
          message: errorMessage
        });
        
        toast.error(errorMessage, {
          duration: 5000,
          position: 'top-center',
        });
      }
    }
  };

  const handleFieldClick = (fieldName: string) => {
    const element = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => element.focus(), 300);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Error Summary */}
        {showErrorSummary && Object.keys(errors).length > 0 && (
          <ErrorSummary 
            errors={errors}
            onFieldClick={handleFieldClick}
            onDismiss={() => setShowErrorSummary(false)}
            title="Please fix the following errors before continuing:"
          />
        )}

        {/* Display general API error */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 animate-in slide-in-from-top-5 duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-red-700 font-medium">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              {...register('name', {
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters long'
                },
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: 'Name should only contain letters and spaces'
                }
              })}
              id="name"
              type="text"
              autoComplete="name"
              className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                errors.name 
                  ? 'border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-colors duration-200`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              id="email"
              type="email"
              autoComplete="email"
              className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                errors.email 
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

          {/* Phone Number field */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <input
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: 'Please enter a valid phone number'
                }
              })}
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                errors.phoneNumber 
                  ? 'border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-colors duration-200`}
              placeholder="Enter your phone number"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters long'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must include uppercase, lowercase, and number'
                  }
                })}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                  errors.password 
                    ? 'border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-colors duration-200`}
                placeholder="Create a strong password"
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

          {/* Confirm Password field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password *
            </label>
            <div className="mt-1 relative">
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === watchPassword || 'Passwords do not match'
                })}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                  errors.confirmPassword 
                    ? 'border-red-300 ring-1 ring-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-colors duration-200`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Optional Personal Information Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Optional Information (can be completed later)
            </h3>
            
            {/* National ID */}
            <div className="mb-4">
              <label htmlFor="personalInfo.nationalId" className="block text-sm font-medium text-gray-700">
                National ID
              </label>
              <input
                {...register('personalInfo.nationalId')}
                id="personalInfo.nationalId"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your national ID (optional)"
              />
            </div>

            {/* Date of Birth */}
            <div className="mb-4">
              <label htmlFor="personalInfo.dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                {...register('personalInfo.dateOfBirth')}
                id="personalInfo.dateOfBirth"
                type="date"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Family Size */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="economicInfo.familySize" className="block text-sm font-medium text-gray-700">
                  Family Size
                </label>
                <input
                  {...register('economicInfo.familySize', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'Family size must be at least 1' }
                  })}
                  id="economicInfo.familySize"
                  type="number"
                  min="1"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="1"
                />
              </div>

              <div>
                <label htmlFor="economicInfo.monthlyIncome" className="block text-sm font-medium text-gray-700">
                  Monthly Income
                </label>
                <input
                  {...register('economicInfo.monthlyIncome', {
                    valueAsNumber: true,
                    min: { value: 0, message: 'Income cannot be negative' }
                  })}
                  id="economicInfo.monthlyIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Employment Status */}
            <div>
              <label htmlFor="economicInfo.employmentStatus" className="block text-sm font-medium text-gray-700">
                Employment Status
              </label>
              <select
                {...register('economicInfo.employmentStatus')}
                id="economicInfo.employmentStatus"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select employment status</option>
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="self_employed">Self Employed</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Terms and conditions */}
        <div className="flex items-start">
          <input
            {...register('terms', {
              required: 'You must accept the terms and conditions to continue'
            })}
            id="terms"
            type="checkbox"
            className={`h-4 w-4 mt-0.5 ${
              errors.terms 
                ? 'text-red-600 border-red-300 focus:ring-red-500' 
                : 'text-blue-600 border-gray-300 focus:ring-blue-500'
            } rounded`}
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I agree to the{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500 underline">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.terms.message}
          </p>
        )}

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-all duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating your account...
              </>
            ) : (
              <>
                Create account
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

export default RegisterForm;