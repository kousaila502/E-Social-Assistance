import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';

// Analytics Components
import MetricCard from '../components/Analytics/metricCard';
import TrendChart from '../components/Analytics/trendChart';
import CategoryChart from '../components/Analytics/categoryChart';
import PerformanceMetrics from '../components/Analytics/performanceMetrics';
import GeographicInsights from '../components/Analytics/geographicInsights';

// Analytics Service
import analyticsService, { AnalyticsDashboard } from '../services/analyticsService';

// Icons
import {
  UserGroupIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
  MegaphoneIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChartBarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AnalyticsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Check permissions
  const isAdmin = hasRole('admin');
  const isFinanceManager = hasRole('finance_manager');
  const canViewAnalytics = isAdmin || isFinanceManager;

  useEffect(() => {
    if (!canViewAnalytics) {
      toast.error('Access denied. You do not have permission to view analytics.');
      return;
    }

    fetchAnalytics();
  }, [canViewAnalytics, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDashboardAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchAnalytics();
      toast.success('Analytics data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  if (!canViewAnalytics) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You do not have permission to view analytics.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!analytics) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">No Data Available</h1>
            <p className="mt-2 text-gray-600">Unable to load analytics data.</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const trendMetrics = [
    { key: 'users', label: 'Users', color: '#3b82f6' },
    { key: 'requests', label: 'Requests', color: '#10b981' },
    { key: 'payments', label: 'Payments', color: '#8b5cf6' }
  ];

  const requestCategoryData = analytics.categories.requestCategories.map((cat, index) => ({
    label: cat.category,
    value: cat.count,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
    percentage: 0
  }));

  const paymentMethodData = analytics.categories.paymentMethods.map((method, index) => ({
    label: analyticsService.formatNumber(method.count),
    value: method.count,
    color: ['#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'][index % 5],
    percentage: 0
  }));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Analytics Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive insights and performance metrics
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={analyticsService.formatNumber(analytics.overview.totalUsers)}
            change={{
              value: analytics.overview.monthlyGrowth.users,
              trend: analytics.overview.monthlyGrowth.users > 0 ? 'up' : 'down'
            }}
            icon={UserGroupIcon}
            color="blue"
          />
          <MetricCard
            title="Total Requests"
            value={analyticsService.formatNumber(analytics.overview.totalRequests)}
            change={{
              value: analytics.overview.monthlyGrowth.requests,
              trend: analytics.overview.monthlyGrowth.requests > 0 ? 'up' : 'down'
            }}
            icon={DocumentTextIcon}
            color="green"
          />
          <MetricCard
            title="Total Payments"
            value={analyticsService.formatNumber(analytics.overview.totalPayments)}
            change={{
              value: analytics.overview.monthlyGrowth.payments,
              trend: analytics.overview.monthlyGrowth.payments > 0 ? 'up' : 'down'
            }}
            icon={CreditCardIcon}
            color="purple"
          />
          <MetricCard
            title="Total Budget"
            value={analyticsService.formatAmount(analytics.overview.totalBudget)}
            icon={BanknotesIcon}
            color="indigo"
          />
          <MetricCard
            title="Active Announcements"
            value={analytics.overview.activeAnnouncements}
            icon={MegaphoneIcon}
            color="yellow"
          />
        </div>

        {/* Trends and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TrendChart
            title="Growth Trends"
            data={analytics.trends}
            metrics={trendMetrics}
          />
          <CategoryChart
            title="Request Categories"
            data={requestCategoryData}
            type="donut"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PerformanceMetrics
              requestProcessingTime={analytics.performance.requestProcessingTime}
              paymentSuccessRate={analytics.performance.paymentSuccessRate}
              budgetUtilization={analytics.performance.budgetUtilization}
            />
          </div>
          <div>
            <CategoryChart
              title="Payment Methods"
              data={paymentMethodData}
              type="bar"
            />
          </div>
        </div>

        {/* Geographic Insights */}
        <div className="mb-8">
          <GeographicInsights wilayas={analytics.geographic.wilayas} />
        </div>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4 inline mr-1" />
          Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;