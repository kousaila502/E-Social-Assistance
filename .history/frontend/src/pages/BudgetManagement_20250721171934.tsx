// src/pages/BudgetManagementPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import BudgetOverview from '../components/BudgetPool/BudgetOverview';
import AllocationManager from '../components/BudgetPool/AllocationManager';
import { 
  PieChart, 
  DollarSign, 
  TrendingUp, 
  Settings,
  AlertTriangle 
} from 'lucide-react';

type TabType = 'overview' | 'allocation' | 'pools' | 'reports';

const BudgetManagementPage: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Check if user can access budget management
  const canAccessBudgets = hasAnyRole(['admin', 'finance_manager', 'case_worker']);

  if (!canAccessBudgets) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access budget management.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview' as TabType,
      name: 'Overview',
      icon: PieChart,
      description: 'Budget statistics and alerts'
    },
    {
      id: 'allocation' as TabType,
      name: 'Allocation',
      icon: DollarSign,
      description: 'Allocate funds to requests'
    },
    {
      id: 'pools' as TabType,
      name: 'Budget Pools',
      icon: TrendingUp,
      description: 'Manage budget pools',
      disabled: true // Coming in next phase
    },
    {
      id: 'reports' as TabType,
      name: 'Reports',
      icon: Settings,
      description: 'Budget reports and analytics',
      disabled: true // Coming in next phase
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <BudgetOverview />;
      case 'allocation':
        return <AllocationManager />;
      case 'pools':
        return (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Budget Pools Management</h3>
              <p className="text-gray-600">Coming soon in the next phase.</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Budget Reports</h3>
              <p className="text-gray-600">Advanced reporting features coming soon.</p>
            </div>
          </div>
        );
      default:
        return <BudgetOverview />;
    }
  };

  return (
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
                <p className="mt-2 text-gray-600">
                  Monitor, allocate, and manage budget pools across departments
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Welcome back,</span>
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : tab.disabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon 
                    className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id 
                        ? 'text-blue-500' 
                        : tab.disabled 
                        ? 'text-gray-300'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                  />
                  <span>{tab.name}</span>
                  {tab.disabled && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* Quick Stats Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-6">
              <span>Budget Management System v1.0</span>
              <span>•</span>
              <span>Phase 5A: Budget Pool Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Role: {user?.role?.replace('_', ' ').toUpperCase()}</span>
              {user?.role === 'finance_manager' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Full Access
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default BudgetManagementPage;