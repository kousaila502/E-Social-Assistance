// src/components/auth/RoleBasedLanding.tsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RoleBasedLanding: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading while user data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  switch (user.role) {
    case 'user':
      // Citizens go to the friendly service portal
      return <Navigate to="/portal" replace />;
    
    case 'admin':
    case 'case_worker':
    case 'finance_manager':
      // Staff go to admin dashboard
      return <Navigate to="/admin/dashboard" replace />;
    
    default:
      // Fallback - treat unknown roles as regular users
      return <Navigate to="/portal" replace />;
  }
};

export default RoleBasedLanding;