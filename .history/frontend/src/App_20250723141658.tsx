// src/App.tsx - SMART COMPONENT REUSE VERSION
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Main Pages
import DashboardPage from './pages/DashboardPage';
import ServicePortalPage from './pages/ServicePortalPage';
import ApplyForHelpPage from './pages/ApplyForHelpPage';
// REMOVED: import MyApplicationsPage from './pages/MyApplicationsPage'; - Now using RequestManagementPage with props
import HelpCenterPage from './pages/HelpCenterPage';
import BudgetManagement from './pages/BudgetPoolManagementPage';
import RequestSubmission from './pages/RequestSubmission';
import RequestManagementPage from './pages/RequestManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AnnouncementManagementPage from './pages/AnnouncementManagementPage';
import PaymentManagementPage from './pages/paymentManagementPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Role-based landing page component
import RoleBasedLanding from './components/auth/RoleBasedLanding';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Toast Notifications */}
          <Toaster 
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              // Default options for all toasts
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                maxWidth: '500px',
              },
              // Default success toast options
              success: {
                duration: 4000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10B981',
                },
              },
              // Default error toast options
              error: {
                duration: 6000,
                style: {
                  background: '#EF4444',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#EF4444',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root route with role-based landing */}
            <Route path="/" element={
              <ProtectedRoute>
                <RoleBasedLanding />
              </ProtectedRoute>
            } />

            {/* Citizen-focused routes */}
            <Route path="/portal" element={
              <ProtectedRoute roles={['user']}>
                <ServicePortalPage />
              </ProtectedRoute>
            } />

            <Route path="/apply" element={
              <ProtectedRoute roles={['user']}>
                <ApplyForHelpPage />
              </ProtectedRoute>
            } />

            {/* 🔥 SMART REUSE: Use RequestManagementPage with user-friendly props */}
            <Route path="/my-applications" element={
              <ProtectedRoute roles={['user']}>
                <RequestManagementPage 
                  userMode={true}
                  hideAdminActions={true}
                  pageTitle="My Applications"
                  pageDescription="Track the status of your assistance requests"
                />
              </ProtectedRoute>
            } />

            <Route path="/help" element={
              <ProtectedRoute>
                <HelpCenterPage />
              </ProtectedRoute>
            } />

            {/* Legacy user routes for backward compatibility */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RoleBasedLanding />
              </ProtectedRoute>
            } />

            <Route path="/requests/submit" element={
              <ProtectedRoute roles={['user']}>
                <ApplyForHelpPage />
              </ProtectedRoute>
            } />

            {/* 🔥 SMART REUSE: Legacy route also uses RequestManagementPage with props */}
            <Route path="/requests/my-requests" element={
              <ProtectedRoute roles={['user']}>
                <RequestManagementPage 
                  userMode={true}
                  hideAdminActions={true}
                  pageTitle="My Requests"
                  pageDescription="View and track your assistance requests"
                />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin', 'case_worker', 'finance_manager']}>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/analytics" element={
              <ProtectedRoute roles={['admin', 'case_worker', 'finance_manager']}>
                <AnalyticsPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/budget" element={
              <ProtectedRoute roles={['admin', 'finance_manager']}>
                <BudgetManagement />
              </ProtectedRoute>
            } />

            {/* 🔥 ADMIN MODE: RequestManagementPage in default admin mode */}
            <Route path="/admin/requests" element={
              <ProtectedRoute roles={['admin', 'case_worker']}>
                <RequestManagementPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/announcements" element={
              <ProtectedRoute roles={['admin']}>
                <AnnouncementManagementPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/payments" element={
              <ProtectedRoute roles={['admin', 'finance_manager']}>
                <PaymentManagementPage />
              </ProtectedRoute>
            } />

            {/* Legacy admin route */}
            <Route path="/demandes/submit" element={
              <ProtectedRoute roles={['user']}>
                <RequestSubmission />
              </ProtectedRoute>
            } />

            {/* Common routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;