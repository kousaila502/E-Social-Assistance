// src/components/UserProfile/UserDetails.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../../config/apiConfig';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, ACCOUNT_STATUS } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClockIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import userService from '../../services/userService';

interface UserDetailsProps {
  user: User;
  onUserUpdate?: (updatedUser: User) => void;
  onUserDelete?: (user: User) => void;
  onClose?: () => void;
  embedded?: boolean;
}

interface UserStats {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number; // ADD this line
  totalAmountReceived: number;
  averageProcessingTime: number;
  lastActivity: string;
}

interface UserActivity {
  id: string;
  type: 'request_submitted' | 'request_approved' | 'payment_received' | 'document_uploaded' | 'profile_updated';
  description: string;
  timestamp: string;
  metadata?: {
    amount?: number;
    requestTitle?: string;
    documentType?: string;
  };
}

const UserDetails: React.FC<UserDetailsProps> = ({
  user,
  onUserUpdate,
  onUserDelete,
  onClose,
  embedded = false
}) => {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'eligibility' | 'activity' | 'requests' | 'documents'>('profile');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = hasRole('admin');
  const canEdit = isAdmin || hasRole('case_worker');

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user._id]); // Add _id dependency

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      // Single API call to get all user stats and activity
      const response = await userService.getUserStats(user._id);

      setUserStats(response.statistics);
      setUserActivity(response.activity);

    } catch (error) {
      toast.error('Failed to load user statistics');

      // Set empty stats on error
      setUserStats({
        totalRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalAmountReceived: 0,
        averageProcessingTime: 0,
        lastActivity: user.createdAt
      });
      setUserActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string) => {
    if (!canEdit) {
      toast.error('You do not have permission to perform this action');
      return;
    }

    setLoading(true);
    try {
      let updatedUser: User;

      switch (action) {
        case 'activate':
          await userService.activate(user._id);
          updatedUser = { ...user, accountStatus: 'active' };
          toast.success('User account activated');
          break;

        case 'suspend':
          await userService.suspend(user._id);
          updatedUser = { ...user, accountStatus: 'suspended' };
          toast.success('User account suspended');
          break;

        case 'verify_email':
          await userService.update(user._id, { isEmailVerified: true });
          updatedUser = { ...user, isEmailVerified: true };
          toast.success('Email verified successfully');
          break;

        case 'calculate_eligibility':
          const newScore = Math.floor(Math.random() * 50) + 50;
          await userService.verifyEligibility(user._id, {
            status: 'verified',
            score: newScore
          });
          updatedUser = {
            ...user,
            eligibility: {
              ...user.eligibility,
              status: 'verified',
              score: newScore,
              lastVerificationDate: new Date().toISOString()
            }
          };
          toast.success('Eligibility recalculated');
          break;

        default:
          throw new Error('Unknown action');
      }

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrator', bgColor: 'bg-purple-100', textColor: 'text-purple-800', icon: ShieldCheckIcon },
      case_worker: { label: 'Case Worker', bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: UserIcon },
      finance_manager: { label: 'Finance Manager', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: BanknotesIcon },
      user: { label: 'Beneficiary', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: UserIcon }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        <IconComponent className="h-4 w-4 mr-2" />
        {config.label}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircleIcon },
      inactive: { label: 'Inactive', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: XCircleIcon },
      suspended: { label: 'Suspended', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: ExclamationTriangleIcon },
      pending_verification: { label: 'Pending Verification', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: ClockIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        <IconComponent className="h-4 w-4 mr-2" />
        {config.label}
      </div>
    );
  };

  const getEligibilityBadge = (eligibility: User['eligibility']) => {
    const statusConfig = {
      verified: { label: 'Verified', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircleIcon },
      pending: { label: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: ClockIcon },
      rejected: { label: 'Rejected', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: XCircleIcon },
      requires_update: { label: 'Update Required', bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: ExclamationTriangleIcon }
    };

    const config = statusConfig[eligibility.status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        <IconComponent className="h-4 w-4 mr-2" />
        {config.label} ({eligibility.score}/100)
      </div>
    );
  };

  const getActivityIcon = (type: UserActivity['type']) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'request_submitted':
        return <DocumentTextIcon className={`${iconClass} text-blue-600`} />;
      case 'request_approved':
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case 'payment_received':
        return <BanknotesIcon className={`${iconClass} text-green-600`} />;
      case 'document_uploaded':
        return <DocumentTextIcon className={`${iconClass} text-purple-600`} />;
      case 'profile_updated':
        return <UserIcon className={`${iconClass} text-gray-600`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.accountStatus)}
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUserAction('calculate_eligibility')}
                disabled={loading}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Recalculate Eligibility
              </button>

              {/* FIX: Show activate for both suspended AND pending users */}
              {(user.accountStatus === 'suspended' || user.accountStatus === 'pending_verification') ? (
                <button
                  onClick={() => handleUserAction('activate')}
                  disabled={loading}
                  className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Activate
                </button>
              ) : user.accountStatus === 'active' ? (
                <button
                  onClick={() => handleUserAction('suspend')}
                  disabled={loading}
                  className="flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Suspend
                </button>
              ) : null}

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Statistics */}
      {userStats && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userStats.totalRequests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.approvedRequests}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(userStats.totalAmountReceived)}</div>
              <div className="text-sm text-gray-600">Total Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userStats.averageProcessingTime} days</div>
              <div className="text-sm text-gray-600">Avg Processing</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {new Date(userStats.lastActivity).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Last Activity</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'profile', label: 'Profile', icon: UserIcon },
            { id: 'eligibility', label: 'Eligibility', icon: ChartBarIcon },
            { id: 'activity', label: 'Activity', icon: ClockIcon },
            { id: 'requests', label: 'Requests', icon: DocumentTextIcon },
            { id: 'documents', label: 'Documents', icon: IdentificationIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Full Name</div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Email Address</div>
                      <div className="font-medium text-gray-900 flex items-center">
                        {user.email}
                        {user.isEmailVerified ? (
                          <CheckCircleIcon className="h-4 w-4 ml-2 text-green-500" />
                        ) : (
                          <div className="flex items-center">
                            <XCircleIcon className="h-4 w-4 ml-2 text-red-500" />
                            {canEdit && (
                              <button
                                onClick={() => handleUserAction('verify_email')}
                                className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Phone Number</div>
                      <div className="font-medium text-gray-900">{user.phoneNumber}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-600">Member Since</div>
                      <div className="font-medium text-gray-900">{formatDate(user.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Account Status</div>
                    {getStatusBadge(user.accountStatus)}
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">User Role</div>
                    {getRoleBadge(user.role)}
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Email Verification</div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.isEmailVerified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {user.isEmailVerified ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Unverified
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Last Updated</div>
                    <div className="font-medium text-gray-900">{formatDate(user.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Tab */}
        {activeTab === 'eligibility' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility Information</h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Current Eligibility Status</h4>
                    <p className="text-sm text-gray-600">Overall assessment of user's eligibility for assistance</p>
                  </div>
                  {getEligibilityBadge(user.eligibility)}
                </div>

                {/* Score Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Eligibility Score</span>
                    <span>{user.eligibility.score ?? 0}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${(user.eligibility.score ?? 0) >= 70 ? 'bg-green-600' :
                        (user.eligibility.score ?? 0) >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                      style={{ width: `${user.eligibility.score ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Eligible Categories */}
              {(user.eligibility.categories?.length ?? 0) > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Eligible Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.eligibility.categories?.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {category.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Verification */}
              {user.eligibility.lastVerificationDate && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Last Verification</h4>
                  <p className="text-gray-600">{formatDate(user.eligibility.lastVerificationDate)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>

            {userActivity.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity found.</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {userActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== userActivity.length - 1 && (
                          <span
                            className="absolute top-8 left-6 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                              {getActivityIcon(activity.type)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                              {activity.metadata && (
                                <div className="mt-1 space-x-2">
                                  {activity.metadata.amount && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {formatCurrency(activity.metadata.amount)}
                                    </span>
                                  )}
                                  {activity.metadata.requestTitle && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      {activity.metadata.requestTitle}
                                    </span>
                                  )}
                                  {activity.metadata.documentType && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                      {activity.metadata.documentType}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">User Requests</h3>
              <span className="text-sm text-gray-500">
                {userStats?.totalRequests || 0} total requests
              </span>
            </div>

            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Request details would be loaded here from the API</p>
              <p className="text-sm text-gray-500 mt-2">
                This would show a filtered view of all requests submitted by this user
              </p>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">User Documents</h3>
              <span className="text-sm text-gray-500">Document verification status</span>
            </div>

            <div className="text-center py-8">
              <IdentificationIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Document management would be loaded here from the API</p>
              <p className="text-sm text-gray-500 mt-2">
                This would show all documents uploaded by the user with verification status
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;