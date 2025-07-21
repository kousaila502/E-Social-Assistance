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
  UserIcon
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
  // Common navigation for all users
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['user', 'case_worker', 'finance_manager', 'admin']
  },
  
  // User-specific navigation
  {
    name: 'Submit Request',
    href: '/requests/submit',
    icon: DocumentPlusIcon,
    roles: ['user']
  },
  {
    name: 'My Requests',
    href: '/requests/my-requests',
    icon: ClipboardDocumentListIcon,
    roles: ['user']
  },
  
  // Staff navigation
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
  }
];

const secondaryNavigation: NavigationItem[] = [
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

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => 
    user && hasAnyRole(item.roles as any)
  );

  const filteredSecondaryNavigation = secondaryNavigation.filter(item => 
    user && hasAnyRole(item.roles as any)
  );

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const linkClasses = (href: string) => {
    const baseClasses = "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150";
    const activeClasses = "bg-blue-100 text-blue-700";
    const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
    
    return `${baseClasses} ${isActiveLink(href) ? activeClasses : inactiveClasses}`;
  };

  const iconClasses = (href: string) => {
    const baseClasses = "mr-3 flex-shrink-0 h-6 w-6";
    const activeClasses = "text-blue-500";
    const inactiveClasses = "text-gray-400 group-hover:text-gray-500";
    
    return `${baseClasses} ${isActiveLink(href) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="flex flex-col h-full pt-5 pb-4 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">
              E-Social
            </h1>
            <p className="text-xs text-gray-500">Assistance Platform</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="mt-6 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user.firstName?.charAt(0)}{user.name?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex-1 flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={linkClasses(item.href)}
            >
              <item.icon
                className={iconClasses(item.href)}
                aria-hidden="true"
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Secondary navigation */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <nav className="px-2 space-y-1">
            {filteredSecondaryNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={linkClasses(item.href)}
              >
                <item.icon
                  className={iconClasses(item.href)}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>© 2025 E-Social Assistance</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;