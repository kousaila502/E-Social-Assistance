// src/pages/LoginPage.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import { 
  Shield, 
  FileCheck, 
  Clock, 
  Users, 
  Heart,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, clearError } = useAuth();
  const location = useLocation();

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Get the intended destination or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If user is already authenticated, redirect to intended destination
  if (isAuthenticated && !isLoading) {
    return <Navigate to={from} replace />;
  }

  const handleLoginSuccess = () => {
    // Navigation will be handled automatically by the redirect above
  };

  const features = [
    {
      icon: FileCheck,
      title: "Smart Application Process",
      description: "Submit requests with intelligent form assistance and automated eligibility checks"
    },
    {
      icon: Clock,
      title: "Real-Time Tracking",
      description: "Monitor your application status with live updates and notification alerts"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your personal data is protected with enterprise-grade encryption"
    },
    {
      icon: Users,
      title: "Expert Case Workers",
      description: "Get personalized support from qualified social assistance professionals"
    }
  ];

  const stats = [
    { number: "50K+", label: "Families Assisted" },
    { number: "95%", label: "Success Rate" },
    { number: "24/7", label: "Support Available" },
    { number: "<48h", label: "Average Response" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative">
        {/* Background decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        
        <div className="mx-auto w-full max-w-md lg:w-96 relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your social assistance dashboard</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
            <LoginForm onSuccess={handleLoginSuccess} />
            
            {/* Divider */}
            <div className="mt-6 mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to our platform?</span>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <a 
                href="/register" 
                className="group inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Create an account
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
              ))}
            </div>
            <p className="text-sm text-gray-600">Trusted by thousands of families nationwide</p>
          </div>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
          {/* Background patterns */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-32 -ml-32 w-96 h-96 bg-white/5 rounded-full"></div>
          
          <div className="relative flex flex-col justify-center h-full px-12 py-16 text-white z-10">
            <div className="max-w-lg">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold mb-4 leading-tight">
                  Your Gateway to 
                  <span className="text-blue-200 block">Social Support</span>
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Connecting families with essential resources through our comprehensive digital platform
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 gap-6 mb-12">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4 group">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <Icon className="h-6 w-6 text-blue-200" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="border-t border-white/20 pt-8">
                <h3 className="text-lg font-semibold mb-4">Trusted Platform Statistics</h3>
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-blue-200">{stat.number}</div>
                      <div className="text-sm text-blue-100">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success indicators */}
              <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm font-medium">Government Certified Platform</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm font-medium">ISO 27001 Security Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;