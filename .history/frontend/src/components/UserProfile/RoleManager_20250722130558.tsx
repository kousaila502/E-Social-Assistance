// src/components/UserProfile/RoleManager.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../../config/apiConfig';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, ACTION_PERMISSIONS, ROUTE_PERMISSIONS } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import {
  ShieldCheckIcon,
  UserIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  LockClosedIcon,
  KeyIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface RoleManagerProps {
  user: User;
  onRoleUpdate?: (updatedUser: User) => void;
  onClose?: () => void;
  embedded?: boolean;
}

interface RoleDefinition {
  role: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  restrictions: string[];
  bgColor: string;
  textColor: string;
  iconColor: string;
}

interface PermissionGroup {
  category: string;
  permissions: Array<{
    key: string;
    label: string;
    description: string;
    requiresRole: string[];
  }>;
}

const RoleManager: React.FC<RoleManagerProps> = ({
  user,
  onRoleUpdate,
  onClose,
  embedded = false
}) => {
  const { hasRole, user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>(user.role);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'audit'>('roles');

  const isAdmin = hasRole('admin');
  const canManageRoles = isAdmin;
  const isSelfEdit = currentUser?._id === user._id;

  // Role definitions with detailed permissions
  const roleDefinitions: RoleDefinition[] = [
    {
      role: USER_ROLES.ADMIN,
      title: 'Administrator',
      description: 'Full system access with user management and configuration capabilities',
      icon: ShieldCheckIcon,
      permissions: [
        'Manage all users and roles',
        'Access all system features',
        'Configure system settings',
        'View all analytics and reports',
        'Manage budget pools and payments',
        'Create and manage content/announcements'
      ],
      restrictions: [],
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-600'
    },
    {
      role: USER_ROLES.CASE_WORKER,
      title: 'Case Worker',
      description: 'Review and process assistance requests, manage beneficiary cases',
      icon: ClipboardDocumentListIcon,
      permissions: [
        'Review and approve/reject requests',
        'Assign requests to themselves',
        'Add comments and notes to requests',
        'Request additional documents',
        'Verify uploaded documents',
        'View user profiles and eligibility'
      ],
      restrictions: [
        'Cannot delete users',
        'Cannot manage system settings',
        'Cannot create budget pools',
        'Limited access to financial data'
      ],
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
      iconColor: 'text-blue-600'
    },
    {
      role: USER_ROLES.FINANCE_MANAGER,
      title: 'Finance Manager',
      description: 'Manage budget pools, process payments, and financial operations',
      icon: BanknotesIcon,
      permissions: [
        'Process payments to beneficiaries',
        'Manage budget pools and allocations',
        'View financial analytics and reports',
        'Approve high-value requests',
        'Track payment history'
      ],
      restrictions: [
        'Cannot review initial requests',
        'Cannot manage user roles',
        'Limited access to user management',
        'Cannot create system announcements'
      ],
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
      iconColor: 'text-green-600'
    },
    {
      role: USER_ROLES.USER,
      title: 'Beneficiary',
      description: 'Submit assistance requests and manage personal profile',
      icon: UserIcon,
      permissions: [
        'Submit assistance requests',
        'Upload supporting documents',
        'View own request status',
        'Update personal profile',
        'Add comments to own requests'
      ],
      restrictions: [
        'Cannot access admin features',
        'Cannot view other users data',
        'Cannot approve requests',
        'Cannot access system analytics'
      ],
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-900',
      iconColor: 'text-gray-600'
    }
  ];

  // Permission groups for detailed view
  const permissionGroups: PermissionGroup[] = [
    {
      category: 'User Management',
      permissions: [
        {
          key: 'view_users',
          label: 'View Users',
          description: 'Access to user list and profiles',
          requiresRole: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER]
        },
        {
          key: 'edit_users',
          label: 'Edit Users',
          description: 'Modify user profiles and settings',
          requiresRole: [USER_ROLES.ADMIN]
        },
        {
          key: 'delete_users',
          label: 'Delete Users',
          description: 'Remove users from the system',
          requiresRole: [USER_ROLES.ADMIN]
        },
        {
          key: 'manage_roles',
          label: 'Manage Roles',
          description: 'Assign and modify user roles',
          requiresRole: [USER_ROLES.ADMIN]
        }
      ]
    },
    {
      category: 'Request Management',
      permissions: [
        {
          key: 'submit_request',
          label: 'Submit Requests',
          description: 'Create new assistance requests',
          requiresRole: [USER_ROLES.USER]
        },
        {
          key: 'review_request',
          label: 'Review Requests',
          description: 'Evaluate and approve/reject requests',
          requiresRole: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER]
        },
        {
          key: 'assign_request',
          label: 'Assign Requests',
          description: 'Assign requests to case workers',
          requiresRole: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER]
        }
      ]
    },
    {
      category: 'Financial Operations',
      permissions: [
        {
          key: 'process_payment',
          label: 'Process Payments',
          description: 'Execute payments to beneficiaries',
          requiresRole: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_MANAGER]
        },
        {
          key: 'manage_budget',
          label: 'Manage Budget',
          description: 'Create and manage budget pools',
          requiresRole: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_MANAGER]
        },
        {
          key: 'view_financial_reports',
          label: 'View Financial Reports',
          description: 'Access financial analytics and reports',
          requiresRole: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_MANAGER]
        }
      ]
    },
    {
      category: 'System Administration',
      permissions: [
        {
          key: 'system_settings',
          label: 'System Settings',
          description: 'Configure system-wide settings',
          requiresRole: [USER_ROLES.ADMIN]
        },
        {
          key: 'manage_content',
          label: 'Manage Content',
          description: 'Create and edit content/announcements',
          requiresRole: [USER_ROLES.ADMIN]
        },
        {
          key: 'view_analytics',
          label: 'View Analytics',
          description: 'Access system analytics and reports',
          requiresRole: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER]
        }
      ]
    }
  ];

  const handleRoleChange = (newRole: string) => {
    if (newRole === user.role) return;
    
    if (isSelfEdit && newRole !== USER_ROLES.ADMIN) {
      toast.error('You cannot change your own role to a lower privilege level');
      return;
    }
    
    setSelectedRole(newRole);
    setShowConfirmation(true);
  };

  const confirmRoleChange = async () => {
  if (!canManageRoles) {
    toast.error('You do not have permission to change user roles');
    return;
  }

  setLoading(true);
  try {
    // 🔥 REAL API CALL - Replace the mock
    console.log('Changing role for user:', user._id, 'to:', selectedRole);
    await userService.changeRole(user._id, selectedRole as any);
    console.log('Role changed successfully');
    
    const updatedUser: User = {
      ...user,
      role: selectedRole as any,
      updatedAt: new Date().toISOString()
    };

    if (onRoleUpdate) {
      onRoleUpdate(updatedUser);
    }

    toast.success(`User role updated to ${roleDefinitions.find(r => r.role === selectedRole)?.title}`);
    setShowConfirmation(false);
    
  } catch (error: any) {
    console.error('Error updating user role:', error);
    toast.error(error.message || 'Failed to update user role');
    setSelectedRole(user.role); // Reset selection on error
  } finally {
    setLoading(false);
  }
};

  const getCurrentRoleDefinition = () => {
    return roleDefinitions.find(r => r.role === user.role) || roleDefinitions[3];
  };

  const getSelectedRoleDefinition = () => {
    return roleDefinitions.find(r => r.role === selectedRole) || roleDefinitions[3];
  };

  const hasPermission = (permissionKey: string, userRole: string): boolean => {
    const permission = permissionGroups
      .flatMap(group => group.permissions)
      .find(p => p.key === permissionKey);
    
    return permission ? permission.requiresRole.includes(userRole) : false;
  };

  if (!canManageRoles) {
    return (
      <div className="text-center py-12">
        <LockClosedIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage user roles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <KeyIcon className="h-5 w-5 mr-2 text-blue-600" />
              Role Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage user roles and permissions for {user.name}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Current Role Display */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${getCurrentRoleDefinition().bgColor} mr-4`}>
              {React.createElement(getCurrentRoleDefinition().icon, {
                className: `h-6 w-6 ${getCurrentRoleDefinition().iconColor}`
              })}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Current Role</h3>
              <p className="text-lg font-semibold text-gray-900">{getCurrentRoleDefinition().title}</p>
              <p className="text-sm text-gray-600">{getCurrentRoleDefinition().description}</p>
            </div>
          </div>
          
          {isSelfEdit && (
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Editing Own Role
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'roles', label: 'Role Selection', icon: UserIcon },
            { id: 'permissions', label: 'Permissions', icon: CogIcon },
            { id: 'audit', label: 'Audit Log', icon: ClipboardDocumentListIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
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
        {/* Role Selection Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select User Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleDefinitions.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.role;
                  const isCurrent = user.role === role.role;
                  
                  return (
                    <div
                      key={role.role}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isCurrent ? 'ring-2 ring-green-500 ring-opacity-20' : ''}`}
                      onClick={() => handleRoleChange(role.role)}
                    >
                      {isCurrent && (
                        <div className="absolute top-2 right-2">
                          <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Current
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${role.bgColor}`}>
                          <Icon className={`h-6 w-6 ${role.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{role.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                          
                          {/* Key Permissions */}
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Key Permissions:</p>
                            <ul className="text-xs text-gray-600 space-y-0.5">
                              {role.permissions.slice(0, 3).map((permission, index) => (
                                <li key={index} className="flex items-center">
                                  <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                                  {permission}
                                </li>
                              ))}
                              {role.permissions.length > 3 && (
                                <li className="text-gray-500">
                                  +{role.permissions.length - 3} more...
                                </li>
                              )}
                            </ul>
                          </div>
                          
                          {/* Restrictions */}
                          {role.restrictions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Restrictions:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                {role.restrictions.slice(0, 2).map((restriction, index) => (
                                  <li key={index} className="flex items-center">
                                    <XMarkIcon className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" />
                                    {restriction}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Change Summary */}
            {selectedRole !== user.role && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Role Change Pending</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You are about to change this user's role from{' '}
                      <span className="font-medium">{getCurrentRoleDefinition().title}</span> to{' '}
                      <span className="font-medium">{getSelectedRoleDefinition().title}</span>.
                      This will immediately update their permissions and access levels.
                    </p>
                    <div className="mt-3 flex space-x-3">
                      <button
                        onClick={confirmRoleChange}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        {loading ? 'Updating...' : 'Confirm Change'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRole(user.role);
                          setShowConfirmation(false);
                        }}
                        className="px-4 py-2 bg-white text-yellow-800 text-sm font-medium rounded border border-yellow-300 hover:bg-yellow-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permission Details</h3>
              <p className="text-sm text-gray-600 mb-6">
                Current permissions for <span className="font-medium">{user.name}</span> with role{' '}
                <span className="font-medium">{getCurrentRoleDefinition().title}</span>:
              </p>
              
              {permissionGroups.map((group) => (
                <div key={group.category} className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">{group.category}</h4>
                  <div className="space-y-2">
                    {group.permissions.map((permission) => {
                      const hasAccess = hasPermission(permission.key, user.role);
                      
                      return (
                        <div
                          key={permission.key}
                          className={`flex items-start p-3 rounded-lg border ${
                            hasAccess
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {hasAccess ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <XMarkIcon className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className={`font-medium ${
                              hasAccess ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {permission.label}
                            </p>
                            <p className={`text-sm ${
                              hasAccess ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {permission.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Required roles: {permission.requiresRole.join(', ')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role Change History</h3>
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Role change audit log would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  This would show a chronological history of all role changes for this user
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManager;