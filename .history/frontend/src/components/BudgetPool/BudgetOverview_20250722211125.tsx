// src/components/BudgetPool/BudgetOverview.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import budgetService from '../../services/budgetService';
import { BudgetPoolStatsResponse } from '../../config/apiConfig';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  PieChart,
  Target,
  Activity,
  Clock
} from 'lucide-react';

const BudgetOverview: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const [stats, setStats] = useState<BudgetDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to view budget data
  const canViewBudgets = hasAnyRole(['admin', 'finance_manager', 'case_worker']);

  useEffect(() => {
    if (!canViewBudgets) {
      setLoading(false);
      return;
    }

    const fetchBudgetStats = async () => {
      try {
        setLoading(true);
        const data = await budgetService.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching budget stats:', err);
        setError(err?.message || 'Failed to load budget statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetStats();
  }, [canViewBudgets]);

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number | undefined): string => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (!canViewBudgets) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            You don't have permission to view budget information.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No budget statistics found.</p>
        </div>
      </div>
    );
  }

  const { statistics, recentActivity } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Overview</h1>
            <p className="text-gray-600 mt-1">
              Monitor and track budget pools across all departments
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Budget Pools */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pools</p>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.totalBudgetPools}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 font-medium">
              {statistics.activePools} active
            </span>
          </div>
        </div>

        {/* Total Allocated */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Allocated</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(statistics.totalAllocated)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              Available for allocation
            </span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(statistics.totalSpent)}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              {formatPercentage((statistics.totalSpent / statistics.totalAllocated) * 100)} utilization
            </span>
          </div>
        </div>

        {/* Average Utilization */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercentage(statistics.averageUtilization)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              Across all pools
            </span>
          </div>
        </div>
      </div>

      {/* Alerts and Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Alerts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Alerts</h3>
          <div className="space-y-4">
            {statistics.poolsNearDepletion > 0 && (
              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {statistics.poolsNearDepletion} pools near depletion
                  </p>
                  <p className="text-xs text-red-600">
                    Require immediate attention
                  </p>
                </div>
              </div>
            )}

            {statistics.poolsExpiring > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {statistics.poolsExpiring} pools expiring soon
                  </p>
                  <p className="text-xs text-yellow-600">
                    Within next 30 days
                  </p>
                </div>
              </div>
            )}

            {statistics.poolsNearDepletion === 0 && statistics.poolsExpiring === 0 && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">All budget pools are healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h3>
          <div className="space-y-3">
            {statistics.departmentBreakdown.length > 0 ? (
              statistics.departmentBreakdown.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dept.department}</p>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(dept.spentAmount)} / {formatCurrency(dept.totalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPercentage(dept.utilizationRate)}
                    </p>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dept.utilizationRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <PieChart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">No department data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type} - {activity.poolName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(activity.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetOverview;