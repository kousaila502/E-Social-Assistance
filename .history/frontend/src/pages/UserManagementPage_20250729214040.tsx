// src/pages/UserManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import UserTable from '../components/UserProfile/UserTable';
import UserDetails from '../components/UserProfile/UserDetails';
import RoleManager from '../components/UserProfile/RoleManager';
import CreateUserModal from '../components/UserProfile/CreateUserModal';
import { useAuth } from '../hooks/useAuth';
import { User } from '../config/apiConfig';
import { USER_ROLES, ROUTES } from '../utils/constants';
import userService, { UserDashboardStats } from '../services/userService';
import {
  UserGroupIcon,
  PlusIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'details' | 'role_manager';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerification: number;
  suspendedUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole, user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Filters from URL params
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || '',
    accountStatus: searchParams.get('accountStatus') || '',
    isEmailVerified: searchParams.get('isEmailVerified') ? searchParams.get('isEmailVerified') === 'true' : undefined,
    search: searchParams.get('search') || ''
  });

  // Check permissions
  const isAdmin = hasRole('admin');
  const canManageUsers = isAdmin;

  useEffect(() => {
    if (!canManageUsers) {
      navigate(ROUTES.DASHBOARD);
      toast.error('Access denied. You do not have permission to manage users.');
      return;
    }

    fetchUserStats();
    setLoading(false);
  }, [canManageUsers, navigate]);

  // Add this useEffect after your existing ones
  useEffect(() => {
    // Sync filters with URL params when URL changes
    const urlAccountStatus = searchParams.get('accountStatus');
    const urlRole = searchParams.get('role');
    const urlSearch = searchParams.get('search');

    const newFilters = {
      role: urlRole || '',
      accountStatus: urlAccountStatus || '',
      isEmailVerified: searchParams.get('isEmailVerified') ? searchParams.get('isEmailVerified') === 'true' : undefined,
      search: urlSearch || ''
    };

    // Only update if filters actually changed
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      setFilters(newFilters);
      setRefreshTrigger(prev => prev + 1); // Force table refresh
    }
  }, [searchParams]); // Watch for URL changes

  useEffect(() => {
    // Update URL params when filters change
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        newParams.set(key, value.toString());
      }
    });
    setSearchParams(newParams);
  }, [filters, setSearchParams]);

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      // REAL API CALL - Replace mock data
      const dashboardStats: UserDashboardStats = await userService.getDashboardStats();

      // Transform the real API response to match our component's expected format
      const transformedStats: UserStats = {
        totalUsers: dashboardStats.statistics.totalUsers,
        activeUsers: dashboardStats.statistics.activeUsers,
        pendingVerification: dashboardStats.statistics.pendingVerification,
        suspendedUsers: dashboardStats.statistics.suspendedUsers,
        newUsersThisMonth: dashboardStats.statistics.newUsersThisMonth,
        usersByRole: dashboardStats.statistics.roleDistribution.reduce((acc, role) => {
          acc[role.role] = role.count;
          return acc;
        }, {} as Record<string, number>)
      };

      setStats(transformedStats);
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load user statistics');

      // Fallback to prevent crashes - show zero stats
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        pendingVerification: 0,
        suspendedUsers: 0,
        newUsersThisMonth: 0,
        usersByRole: {}
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    // Clear filters and URL when viewing details
    setFilters({ role: '', accountStatus: '', isEmailVerified: undefined, search: '' });
    setSearchParams(new URLSearchParams());
    setSelectedUser(user);
    setViewMode('details');
  };

  const handleUserEdit = (user: User) => {
    // Clear URL params when editing user
    setSearchParams(new URLSearchParams());
    setSelectedUser(user);
    setShowRoleManager(true);
    setViewMode('role_manager');
  };

  const handleUserDelete = async (user: User) => {
    if (user._id === currentUser?._id) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (user.role === USER_ROLES.ADMIN) {
      toast.error('Cannot delete administrator accounts');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // 🔥 REAL API CALL - Replace mock data
      await userService.delete(user._id);

      toast.success(`User ${user.name} has been deleted`);
      setRefreshTrigger(prev => prev + 1);

      // If viewing deleted user, return to table
      if (selectedUser?._id === user._id) {
        handleBackToTable();
      }

      // Refresh stats after deletion
      fetchUserStats();

    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    try {
      // 🔥 REAL API CALL - Replace mock data
      const result = await userService.bulkAction({
        userIds,
        action: action as 'activate' | 'suspend' | 'verify' | 'delete'
      });

      const actionLabels = {
        activate: 'activated',
        suspend: 'suspended',
        verify: 'verified',
        delete: 'deleted'
      };

      const label = actionLabels[action as keyof typeof actionLabels] || action;
      toast.success(`${userIds.length} users have been ${label}`);
      setRefreshTrigger(prev => prev + 1);

      // Refresh stats after bulk action
      fetchUserStats();

    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast.error(error.message || 'Failed to perform bulk action');
    }
  };

  const handleUserUpdate = async (updatedUser: User) => {
    try {
      // Update the selected user state
      setSelectedUser(updatedUser);
      setRefreshTrigger(prev => prev + 1);
      toast.success('User updated successfully');

      // Refresh stats in case role changed
      fetchUserStats();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleRoleUpdate = async (updatedUser: User) => {
    try {
      setSelectedUser(updatedUser);
      setRefreshTrigger(prev => prev + 1);
      setShowRoleManager(false);
      setViewMode('details');
      toast.success('User role updated successfully');

      // Refresh stats since role changed
      fetchUserStats();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleBackToTable = () => {
    // Restore the previous filters when going back to table
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        newParams.set(key, value.toString());
      }
    });
    setSearchParams(newParams);

    setSelectedUser(null);
    setShowRoleManager(false);
    setViewMode('table');
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchUserStats();
    toast.success('Data refreshed');
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames = {
      [USER_ROLES.ADMIN]: 'Administrators',
      [USER_ROLES.CASE_WORKER]: 'Case Workers',
      [USER_ROLES.FINANCE_MANAGER]: 'Finance Managers',
      [USER_ROLES.USER]: 'Beneficiaries'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  // Handle user activation/suspension directly
  const handleUserStatusChange = async (user: User, newStatus: 'active' | 'suspended') => {
    try {
      if (newStatus === 'active') {
        await userService.activate(user._id);
        toast.success(`${user.name} has been activated`);
      } else {
        await userService.suspend(user._id);
        toast.success(`${user.name} has been suspended`);
      }

      setRefreshTrigger(prev => prev + 1);
      fetchUserStats();

      // Update selected user if it's the one being changed
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...user, accountStatus: newStatus });
      }

    } catch (error: any) {
      console.error('Error changing user status:', error);
      toast.error(error.message || 'Failed to change user status');
    }
  };

  // Handle user role change directly  
  const handleRoleChange = async (user: User, newRole: User['role']) => {
    try {
      await userService.changeRole(user._id, newRole);
      toast.success(`${user.name}'s role has been changed to ${userService.getRoleLabel(newRole)}`);

      setRefreshTrigger(prev => prev + 1);
      fetchUserStats();

      // Update selected user if it's the one being changed
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...user, role: newRole });
      }

    } catch (error: any) {
      console.error('Error changing user role:', error);
      toast.error(error.message || 'Failed to change user role');
    }
  };

  if (!canManageUsers) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading user management...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="h-8 w-8 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage users, roles, and permissions across the platform
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={statsLoading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setShowCreateUserModal(true)}  // ← Open modal instead
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add User
            </button>

            {viewMode !== 'table' && (
              <button
                onClick={handleBackToTable}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Back to List
              </button>
            )}
          </div>
        </div>

        {/* User Statistics Dashboard */}
        {viewMode === 'table' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalUsers?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-blue-600 font-medium">
                  +{stats?.newUsersThisMonth || 0} this month
                </span>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.activeUsers?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  {stats && stats.totalUsers > 0
                    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                    : 0}% of total
                </span>
              </div>
            </div>

            {/* Pending Verification */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.pendingVerification?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setFilters({ ...filters, accountStatus: 'pending_verification' });
                    const newParams = new URLSearchParams();
                    newParams.set('accountStatus', 'pending_verification');
                    setSearchParams(newParams);
                    setRefreshTrigger(prev => prev + 1); // This should work!
                  }}
                  className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  Review pending →
                </button>
              </div>
            </div>

            {/* Suspended Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.suspendedUsers?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setFilters({ ...filters, accountStatus: 'suspended' });
                    const newParams = new URLSearchParams();
                    newParams.set('accountStatus', 'suspended');
                    setSearchParams(newParams);
                    setRefreshTrigger(prev => prev + 1); // This should work!
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Review suspended →
                </button>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Role Distribution</p>
                </div>
              </div>
              <div className="space-y-2">
                {statsLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-300 h-4 w-full rounded"></div>
                    ))}
                  </div>
                ) : (
                  Object.entries(stats?.usersByRole || {}).map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">{getRoleDisplayName(role)}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Role Filters */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Quick Filters</h3>
              <button
                onClick={() => setFilters({ role: '', accountStatus: '', isEmailVerified: undefined, search: '' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(USER_ROLES).map(([key, role]) => (
                <button
                  key={role}
                  onClick={() => setFilters({ ...filters, role })}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filters.role === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                >
                  {getRoleDisplayName(role)}
                  {stats && (
                    <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                      {stats.usersByRole[role] || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {viewMode === 'table' ? (
          <UserTable
            onUserSelect={handleUserSelect}
            onUserEdit={handleUserEdit}
            onUserDelete={handleUserDelete}
            onBulkAction={handleBulkAction}
            onUserStatusChange={handleUserStatusChange}
            onRoleChange={handleRoleChange}
            filters={filters}
            refreshTrigger={refreshTrigger}
          />
        ) : viewMode === 'details' ? (
          <div className="space-y-6">
            {selectedUser && (
              <>
                {/* User Details Header Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                      <p className="text-gray-600">Viewing profile for {selectedUser.name}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleUserEdit(selectedUser)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <CogIcon className="h-4 w-4 mr-2" />
                        Manage Role
                      </button>
                      <button
                        onClick={handleBackToTable}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        Back to Users
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Details Component */}
                <UserDetails
                  user={selectedUser}
                  onUserUpdate={handleUserUpdate}
                  onUserDelete={handleUserDelete}
                  embedded={true}
                />
              </>
            )}
          </div>
        ) : viewMode === 'role_manager' ? (
          <div className="space-y-6">
            {selectedUser && (
              <>
                {/* Role Manager Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Role Management</h2>
                      <p className="text-gray-600">Managing roles and permissions for {selectedUser.name}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setViewMode('details');
                          setShowRoleManager(false);
                        }}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        View Profile
                      </button>
                      <button
                        onClick={handleBackToTable}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        Back to Users
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role Manager Component */}
                <RoleManager
                  user={selectedUser}
                  onRoleUpdate={handleRoleUpdate}
                  embedded={true}
                />
              </>
            )}
          </div>
        ) : null}

        {/* System Health Overview (Admin Only) */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                System Health Overview
              </h3>
              <button
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => navigate('/admin/analytics')}
              >
                View detailed analytics →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats && stats.totalUsers > 0
                    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">User Activation Rate</div>
                <div className="text-xs text-green-600 mt-1">↑ 2% from last month</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">2.3 days</div>
                <div className="text-sm text-gray-600">Avg. Verification Time</div>
                <div className="text-xs text-green-600 mt-1">↓ 0.5 days improvement</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">98.2%</div>
                <div className="text-sm text-gray-600">System Uptime</div>
                <div className="text-xs text-green-600 mt-1">Excellent performance</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats ? stats.pendingVerification : 0}
                </div>
                <div className="text-sm text-gray-600">Pending Actions</div>
                <div className="text-xs text-yellow-600 mt-1">Requires attention</div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        {viewMode === 'table' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">User Management Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">User Roles</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Admin:</strong> Full system access and user management</li>
                  <li>• <strong>Case Worker:</strong> Review requests and manage cases</li>
                  <li>• <strong>Finance Manager:</strong> Handle payments and budgets</li>
                  <li>• <strong>Beneficiary:</strong> Submit requests and manage profile</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Best Practices</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Regularly review suspended and pending users</li>
                  <li>• Verify email addresses for new registrations</li>
                  <li>• Use bulk actions for efficient user management</li>
                  <li>• Monitor role distribution and adjust as needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
          onUserCreated={(newUser) => {
            setShowCreateUserModal(false);
            setRefreshTrigger(prev => prev + 1); // Refresh the user table
            toast.success(`User ${newUser.name} created successfully!`);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default UserManagementPage;