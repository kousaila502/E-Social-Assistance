// src/components/UserProfile/UserTable.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../config/apiConfig';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, ACCOUNT_STATUS, ROUTES } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import userService from '../../services/userService';

interface UserTableProps {
  onUserSelect?: (user: User) => void;
  onUserEdit?: (user: User) => void;
  onUserDelete?: (user: User) => void;
  onBulkAction?: (action: string, userIds: string[]) => void;
  onUserStatusChange?: (user: User, newStatus: 'active' | 'suspended') => Promise<void>;  // ← ADD THIS
  onRoleChange?: (user: User, newRole: User['role']) => Promise<void>;  // ← ADD THIS
  filters?: {
    role?: string;
    accountStatus?: string;
    isEmailVerified?: boolean;
    search?: string;
  };
  refreshTrigger?: number;
}

interface SortConfig {
  key: keyof User | 'createdAt';
  direction: 'asc' | 'desc';
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  onUserSelect,
  onUserEdit,
  onUserDelete,
  onBulkAction,
  filters = {},
  refreshTrigger = 0
}) => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState({
    role: filters.role || '',
    accountStatus: filters.accountStatus || '',
    isEmailVerified: filters.isEmailVerified,
    search: filters.search || ''
  });

  const itemsPerPage = 20;
  const isAdmin = hasRole('admin');

  const fetchUsers = async (page: number = 1) => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // REAL API CALL - Replace mock data
      const response = await userService.getAll({
        page,
        limit: itemsPerPage,
        role: localFilters.role as any,
        accountStatus: localFilters.accountStatus as any,
        search: localFilters.search,
        const mapSortKey = (key: keyof User | 'createdAt'): string => {
        const sortMapping: Record<string, string> = {
          'name': 'name',
          'email': 'email', 
          'createdAt': 'createdAt',
          'role': 'role',
          'accountStatus': 'accountStatus'
        };
        return sortMapping[key] || 'createdAt';}
};

      });
      
      setUsers(response.users);
      setPagination(response.pagination);
      
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUsers(1);
    }
  }, [localFilters, sortConfig]);

  const handleSort = (key: keyof User | 'createdAt') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (filterKey: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleUserSelect = (user: User) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }
    
    if (onBulkAction) {
      onBulkAction(action, selectedUsers);
      setSelectedUsers([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
      case_worker: { label: 'Case Worker', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      finance_manager: { label: 'Finance Manager', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      user: { label: 'User', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircleIcon },
      inactive: { label: 'Inactive', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: XCircleIcon },
      suspended: { label: 'Suspended', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: ExclamationTriangleIcon },
      pending_verification: { label: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: ExclamationTriangleIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getEligibilityBadge = (eligibility: User['eligibility']) => {
    const statusConfig = {
      verified: { label: 'Verified', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      pending: { label: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      rejected: { label: 'Rejected', bgColor: 'bg-red-100', textColor: 'text-red-800' },
      requires_update: { label: 'Update Required', bgColor: 'bg-orange-100', textColor: 'text-orange-800' }
    };

    const config = statusConfig[eligibility.status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label} ({eligibility.score}/100)
      </span>
    );
  };

  const SortIcon = ({ column }: { column: keyof User | 'createdAt' }) => {
    if (sortConfig.key !== column) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-gray-600" />
      : <ChevronDownIcon className="h-4 w-4 text-gray-600" />;
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to view user management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
            Filters & Search
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLocalFilters({ role: '', accountStatus: '', isEmailVerified: undefined, search: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
            <button
              onClick={() => fetchUsers(currentPage)}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={localFilters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value={USER_ROLES.ADMIN}>Admin</option>
            <option value={USER_ROLES.CASE_WORKER}>Case Worker</option>
            <option value={USER_ROLES.FINANCE_MANAGER}>Finance Manager</option>
            <option value={USER_ROLES.USER}>User</option>
          </select>

          {/* Status Filter */}
          <select
            value={localFilters.accountStatus}
            onChange={(e) => handleFilterChange('accountStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value={ACCOUNT_STATUS.ACTIVE}>Active</option>
            <option value={ACCOUNT_STATUS.INACTIVE}>Inactive</option>
            <option value={ACCOUNT_STATUS.SUSPENDED}>Suspended</option>
            <option value={ACCOUNT_STATUS.PENDING_VERIFICATION}>Pending Verification</option>
          </select>

          {/* Email Verification Filter */}
          <select
            value={localFilters.isEmailVerified === undefined ? '' : localFilters.isEmailVerified.toString()}
            onChange={(e) => handleFilterChange('isEmailVerified', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Email Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">{pagination.totalCount}</span> users found
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchUsers(currentPage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">No users match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>User</span>
                        <SortIcon column="name" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Role</span>
                        <SortIcon column="role" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('accountStatus')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <SortIcon column="accountStatus" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eligibility
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        <SortIcon column="createdAt" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleUserSelect(user)}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              {user.email}
                              {!user.isEmailVerified && (
                                <ExclamationTriangleIcon className="h-3 w-3 ml-1 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {user.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.accountStatus)}
                      </td>
                      <td className="px-6 py-4">
                        {getEligibilityBadge(user.eligibility)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserSelect(user);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {onUserEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUserEdit(user);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Edit User"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {onUserDelete && user.role !== 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUserDelete(user);
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Delete User"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * itemsPerPage, pagination.totalCount)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserTable;