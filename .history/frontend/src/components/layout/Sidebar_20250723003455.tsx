// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  badge?: string;
}

const navigation: NavigationItem[] = [
  // Citizens see a simplified, friendly navigation
  {
    name: 'Services',
    href: '/portal',
    icon: HomeIcon,
    roles: ['user']
  },
  {
    name: 'Apply for Help',
    href: '/apply',
    icon: HeartIcon,
    roles: ['user']
  },
  {
    name: 'My Applications',
    href: '/my-applications',
    icon: ClipboardDocumentListIcon,
    roles: ['user']
  },
  {
    name: 'Help Center',
    href: '/help',
    icon: QuestionMarkCircleIcon,
    roles: ['user']
  },
  
  // Staff see the existing admin navigation
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    roles: ['case_worker', 'finance_manager', 'admin']
  },
  
  // Staff navigation (existing items)
  {
    name: 'Manage Requests',
    href: '/admin/requests',
    icon: ClipboardDocumentListIcon,
    roles: ['case_worker', 'admin']
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: UserGroupIcon,
    roles: ['admin']
  },
  {
    name: 'Budget Management',
    href: '/admin/budget',
    icon: CurrencyDollarIcon,
    roles: ['finance_manager', 'admin']
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CurrencyDollarIcon,
    roles: ['finance_manager', 'admin']
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    roles: ['case_worker', 'finance_manager', 'admin']
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: MegaphoneIcon,
    roles: ['admin']
  },
  
  // Common for all roles
  {
    name: 'Profile',
    href: '/profile',
    icon: UserIcon,
    roles: ['user', 'case_worker', 'finance_manager', 'admin']
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    roles: ['user', 'case_worker', 'finance_manager', 'admin']
  }
];

const Sidebar: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const filteredNavigation = navigation.filter(item => 
    hasAnyRole(item.roles as any[])
  );

  return (
    <div className="h-full flex flex-col bg-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          {user.role === 'user' ? 'Social Assistance' : 'Admin Portal'}
        </h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role === 'user' ? 'Citizen' : user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-6 w-6 flex-shrink-0
                  ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2025 Social Assistance Platform
        </p>
      </div>
    </div>
  );
};

export default Sidebar;