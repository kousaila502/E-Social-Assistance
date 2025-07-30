import React from 'react';
import { useAuth } from '../hooks/useAuth';
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
import userService from '../services/userService';
import { useQuery } from '@tanstack/react-query';

const DashboardPage: React.FC = () => {
  const { user, hasRole, hasAnyRole } = useAuth();

  // React Query hooks
  const userStatsQuery = useQuery({
    queryKey: ['userDashboardStats'],
    queryFn: () => requestService.getDashboardStats(),
    enabled: !hasAnyRole(['admin', 'case_worker', 'finance_manager']),
  });
  const adminRequestStatsQuery = useQuery({
    queryKey: ['adminRequestStats'],
    queryFn: () => requestService.getDashboardStats(),
    enabled: hasAnyRole(['admin', 'case_worker', 'finance_manager']),
  });
  const adminBudgetStatsQuery = useQuery({
    queryKey: ['adminBudgetStats'],
    queryFn: () => budgetService.getDashboardStats(),
    enabled: hasAnyRole(['admin', 'case_worker', 'finance_manager']),
  });
  const totalUsersQuery = useQuery({
    queryKey: ['totalUsers'],
    queryFn: () => userService.getAll({ limit: 1 }),
    enabled: hasAnyRole(['admin', 'case_worker', 'finance_manager']),
  });

  // Remove all useState and useEffect for stats

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // User dashboard
  const renderUserDashboard = () => {
    const stats = userStatsQuery.data?.statistics;
    return (
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
            value={stats?.totalRequests || 0}
            icon={ClipboardDocumentListIcon}
            color="blue"
          />
          <StatsWidget
            title="Approved"
            value={stats?.totalApproved || 0}
            icon={CheckCircleIcon}
            color="green"
          />
          <StatsWidget
            title="Pending"
            value={stats?.statusBreakdown?.find(s => s.status === 'pending')?.count || 0}
            icon={ClockIcon}
            color="yellow"
          />
          <StatsWidget
            title="Total Received"
            value={`$${stats?.totalRequested || 0}`}
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
  };

  // Admin/staff dashboard
  const renderStaffDashboard = () => {
    const reqStats = adminRequestStatsQuery.data?.statistics;
    const budgetStats = adminBudgetStatsQuery.data?.statistics?.overall;
    const totalUsers =
      totalUsersQuery.data?.summary?.totalUsers ||
      totalUsersQuery.data?.pagination?.totalCount ||
      0;
    return (
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
            value={totalUsers}
            icon={UserGroupIcon}
            color="blue"
            change="+12%"
          />
          <StatsWidget
            title="Total Requests"
            value={reqStats?.totalRequests || 0}
            icon={ClipboardDocumentListIcon}
            color="green"
            change="+8%"
          />
          <StatsWidget
            title="Pending Reviews"
            value={reqStats?.statusBreakdown?.find(s => s.status === 'under_review')?.count || 0}
            icon={ExclamationTriangleIcon}
            color="yellow"
            urgent={(reqStats?.statusBreakdown?.find(s => s.status === 'under_review')?.count || 0) > 20}
          />
          <StatsWidget
            title="Budget Used"
            value={
              budgetStats && budgetStats.totalBudget
                ? `${Math.round((budgetStats.totalSpent / budgetStats.totalBudget) * 100)}%`
                : '0%'
            }
            icon={CurrencyDollarIcon}
            color="purple"
            subtitle={
              budgetStats
                ? `$${budgetStats.totalSpent?.toLocaleString()} / $${budgetStats.totalBudget?.toLocaleString()}`
                : ''
            }
          />
        </div>

        {/* Quick Actions for Staff */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hasAnyRole(['admin', 'case_worker']) && (
            <DashboardCard
              title="Review Requests"
              description="Process pending applications"
              icon={ClipboardDocumentListIcon}
              link={ROUTES.REQUEST_MANAGEMENT}
              buttonText="Review Now"
              buttonColor="blue"
              badge={reqStats?.statusBreakdown?.find(s => s.status === 'under_review')?.count || 0
                ? reqStats?.statusBreakdown?.find(s => s.status === 'under_review')?.count.toString()
                : undefined}
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
              link={ROUTES.ADMIN.BUDGET}
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
              <div className="text-2xl font-bold text-gray-900">{reqStats?.totalRequests || 0}</div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{reqStats?.totalApproved || 0}</div>
              <div className="text-sm text-gray-500">Total Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{reqStats?.statusBreakdown?.find(s => s.status === 'under_review')?.count || 0}</div>
              <div className="text-sm text-gray-500">Pending Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
          </div>
        </DashboardCard>
      </div>
    );
  };

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