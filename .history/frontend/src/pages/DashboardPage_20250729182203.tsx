// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import DashboardCard from '../components/Dashboard/DashboardCard';
import StatsWidget from '../components/Dashboard/StatsWidget';
import { ROUTES } from '../utils/constants';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import requestService from '../services/requestService';
import budgetService from '../services/budgetService';
import userService from '../services/userService'; // Add this import

const DashboardPage: React.FC = () => {
  const { user, hasRole, hasAnyRole } = useAuth();

  // Replace hardcoded stats with state
  const [userStats, setUserStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0
  });
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalRequests: 0,
    pendingReviews: 0,
    approvedToday: 0,
    totalBudget: 0,
    usedBudget: 0
  });

  useEffect(() => {
    if (!hasAnyRole(['admin', 'case_worker', 'finance_manager'])) {
      // Normal users: only fetch their own request stats
      requestService.getDashboardStats().then((stats) => {
        setUserStats({
          totalRequests: stats.statistics.totalRequests || 0,
          approvedRequests: stats.statistics.totalApproved || 0,
          pendingRequests: stats.statistics.statusBreakdown?.find(s => s.status === 'pending')?.count || 0,
          rejectedRequests: stats.statistics.statusBreakdown?.find(s => s.status === 'rejected')?.count || 0,
          totalAmount: stats.statistics.totalRequested || 0
        });
      });
    } else {
      // Admin/staff: fetch all stats, including total users
      Promise.all([
        requestService.getDashboardStats(),
        budgetService.getDashboardStats(),
        userService.getAll({ limit: 1 }) // Only need summary for total users
      ]).then(([reqStats, budgetStats, usersResp]) => {
        setAdminStats({
          totalUsers: usersResp.summary?.totalUsers || usersResp.pagination?.totalCount || 0,
          totalRequests: reqStats.statistics.totalRequests || 0,
          totalApproved: reqStats.statistics.totalApproved || 0, // <-- add this
          pendingReviews: reqStats.statistics.statusBreakdown?.find(s => s.status === 'under_review')?.count || 0,
          totalBudget: budgetStats.statistics.overall.totalBudget || 0,
          usedBudget: budgetStats.statistics.overall.totalSpent || 0
        });
      });
    }
  }, [hasAnyRole]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderUserDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-blue-100">
          Welcome to your dashboard. Here you can submit new requests and track your existing applications.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Submit New Request"
          description="Apply for social assistance services"
          icon={DocumentPlusIcon}
          link={ROUTES.SUBMIT_REQUEST}
          buttonText="Submit Request"
          buttonColor="blue"
        />
        <DashboardCard
          title="View My Requests"
          description="Track your application status"
          icon={ClipboardDocumentListIcon}
          link={ROUTES.MY_REQUESTS}
          buttonText="View Requests"
          buttonColor="green"
        />
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsWidget
          title="Total Requests"
          value={userStats.totalRequests}
          icon={ClipboardDocumentListIcon}
          color="blue"
        />
        <StatsWidget
          title="Approved"
          value={userStats.approvedRequests}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatsWidget
          title="Pending"
          value={userStats.pendingRequests}
          icon={ClockIcon}
          color="yellow"
        />
        <StatsWidget
          title="Total Received"
          value={`$${userStats.totalAmount}`}
          icon={CurrencyDollarIcon}
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <DashboardCard
        title="Recent Activity"
        description="Your latest request updates"
      >
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Healthcare Request Approved
              </p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
            <ClockIcon className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Education Request Under Review
              </p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );

  const renderStaffDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-green-100">
          Welcome to your admin dashboard. Manage requests, users, and system operations.
        </p>
      </div>

      {/* Admin Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsWidget
          title="Total Users"
          value={adminStats.totalUsers}
          icon={UserGroupIcon}
          color="blue"
          change="+12%"
        />
        <StatsWidget
          title="Total Requests"
          value={adminStats.totalRequests}
          icon={ClipboardDocumentListIcon}
          color="green"
          change="+8%"
        />
        <StatsWidget
          title="Pending Reviews"
          value={adminStats.pendingReviews}
          icon={ExclamationTriangleIcon}
          color="yellow"
          urgent={adminStats.pendingReviews > 20}
        />
        <StatsWidget
          title="Budget Used"
          value={`${Math.round((adminStats.usedBudget / adminStats.totalBudget) * 100)}%`}
          icon={CurrencyDollarIcon}
          color="purple"
          subtitle={`$${adminStats.usedBudget.toLocaleString()} / $${adminStats.totalBudget.toLocaleString()}`}
        />
      </div>

      {/* Quick Actions for Staff */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hasAnyRole(['admin', 'case_worker']) && (
          <DashboardCard
            title="Review Requests"
            description="Process pending applications"
            icon={ClipboardDocumentListIcon}
            link={ROUTES.REQUEST_MANAGEMENT} // <-- Use the correct route constant
            buttonText="Review Now"
            buttonColor="blue"
            badge={adminStats.pendingReviews > 0 ? adminStats.pendingReviews.toString() : undefined}
          />
        )}

        {hasRole('admin') && (
          <DashboardCard
            title="User Management"
            description="Manage system users"
            icon={UserGroupIcon}
            link={ROUTES.ADMIN.USERS}
            buttonText="Manage Users"
            buttonColor="green"
          />
        )}

        {hasAnyRole(['admin', 'finance_manager']) && (
          <DashboardCard
            title="Budget Overview"
            description="Monitor financial resources"
            icon={CurrencyDollarIcon}
            link={ROUTES.ADMIN.BUDGET} // <-- Use the correct route constant
            buttonText="View Budget"
            buttonColor="purple"
          />
        )}
      </div>

      {/* Analytics Preview */}
      <DashboardCard
        title="System Analytics"
        description="Quick overview of platform performance"
        icon={ChartBarIcon}
        link={ROUTES.ADMIN.ANALYTICS}
        buttonText="View Full Analytics"
        buttonColor="indigo"
      >
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{adminStats.totalRequests}</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{adminStats.totalApproved}</div>
            <div className="text-sm text-gray-500">Total Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{adminStats.pendingReviews}</div>
            <div className="text-sm text-gray-500">Pending Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{adminStats.totalUsers}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {hasAnyRole(['admin', 'case_worker', 'finance_manager'])
        ? renderStaffDashboard()
        : renderUserDashboard()
      }
    </div>
  );
};

export default DashboardPage;