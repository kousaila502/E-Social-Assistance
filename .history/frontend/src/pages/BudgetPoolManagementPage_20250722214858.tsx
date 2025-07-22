// src/pages/BudgetPoolManagementPage.tsx - REAL BACKEND INTEGRATION
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import CreateBudgetPoolModal from '../components/BudgetPool/CreateBudgetPoolModal';
import BudgetPoolDetailModal from '../components/BudgetPool/BudgetPoolDetailModal';
import BudgetPoolTable from '../components/BudgetPool/BudgetPoolTable';
import BudgetOverview from '../components/BudgetPool/BudgetOverview';
import AllocationManager from '../components/BudgetPool/AllocationManager';

import budgetService from '../services/budgetService';
import { BudgetPool, BudgetPoolFilters, BudgetPoolStatsResponse } from '../config/apiConfig';
import { ROUTES } from '../utils/constants';
import { ErrorHandler } from '../utils/errorHandler';
import {
    CurrencyDollarIcon,
    PlusIcon,
    ChartBarIcon,
    CogIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    FunnelIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    BanknotesIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    ClockIcon,
    FireIcon,
    TableCellsIcon,
    PresentationChartBarIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'overview' | 'allocation';

interface BudgetPoolStats {
    totalPools: number;
    activePools: number;
    totalBudget: number;
    totalAllocated: number;
    totalSpent: number;
    availableBudget: number;
    avgUtilization: number;
    lowBalancePools: number;
    criticalBalancePools: number;
    expiringPools: number;
}

const BudgetPoolManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const { hasAnyRole, user: currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [selectedBudgetPool, setSelectedBudgetPool] = useState<BudgetPool | null>(null);
    const [budgetPools, setBudgetPools] = useState<BudgetPool[]>([]);
    const [stats, setStats] = useState<BudgetPoolStats | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBudgetPool, setEditingBudgetPool] = useState<BudgetPool | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filters from URL params
    const [filters, setFilters] = useState<BudgetPoolFilters>({
        status: (searchParams.get('status') as any) || '',
        fiscalYear: searchParams.get('fiscalYear') ? parseInt(searchParams.get('fiscalYear')!) : undefined,
        department: searchParams.get('department') || '',
        fundingSource: (searchParams.get('fundingSource') as any) || '',
        search: searchParams.get('search') || '',
        page: 1,
        limit: 20
    });

    // Check permissions
    const isAdmin = hasAnyRole(['admin']);
    const isFinanceManager = hasAnyRole(['finance_manager']);
    const canManageBudgetPools = isAdmin || isFinanceManager;

    useEffect(() => {
        if (!canManageBudgetPools) {
            navigate(ROUTES.DASHBOARD);
            ErrorHandler.showError('Access denied. You do not have permission to manage budget pools.');
            return;
        }

        fetchStats();
        fetchBudgetPools();
        setLoading(false);
    }, [canManageBudgetPools, navigate]);

    // Sync filters with URL params
    useEffect(() => {
        const urlStatus = searchParams.get('status');
        const urlFiscalYear = searchParams.get('fiscalYear');
        const urlDepartment = searchParams.get('department');
        const urlFundingSource = searchParams.get('fundingSource');
        const urlSearch = searchParams.get('search');

        const newFilters = {
            ...filters,
            status: (urlStatus as any) || '',
            fiscalYear: urlFiscalYear ? parseInt(urlFiscalYear) : undefined,
            department: urlDepartment || '',
            fundingSource: (urlFundingSource as any) || '',
            search: urlSearch || ''
        };

        if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
            setFilters(newFilters);
            setRefreshTrigger(prev => prev + 1);
        }
    }, [searchParams]);

    // Update URL params when filters change
    useEffect(() => {
        const newParams = new URLSearchParams();
        if (filters.status) newParams.set('status', filters.status);
        if (filters.fiscalYear) newParams.set('fiscalYear', filters.fiscalYear.toString());
        if (filters.department) newParams.set('department', filters.department);
        if (filters.fundingSource) newParams.set('fundingSource', filters.fundingSource);
        if (filters.search) newParams.set('search', filters.search);

        const newUrl = newParams.toString() ? `?${newParams.toString()}` : '';
        if (newUrl !== window.location.search) {
            setSearchParams(newParams);
        }
    }, [filters.status, filters.fiscalYear, filters.department, filters.fundingSource, filters.search, setSearchParams]);

    const fetchStats = async () => {
        if (!canManageBudgetPools) return;

        try {
            setStatsLoading(true);
            const response = await budgetService.getDashboardStats();

            // Handle the actual backend response structure
            const backendStats = response.statistics || {};

            // Parse overall stats
            const overall = backendStats.overall || {};

            // Parse alerts
            const alerts = backendStats.alerts || {};

            setStats({
                totalPools: overall.totalPools || 0,
                activePools: overall.totalPools || 0, // Will be calculated from status breakdown
                totalBudget: overall.totalBudget || 0,
                totalAllocated: overall.totalAllocated || 0,
                totalSpent: overall.totalSpent || 0,
                availableBudget: overall.availableBudget || 0,
                avgUtilization: overall.avgUtilization || 0,
                lowBalancePools: alerts.lowBalancePools || 0,
                criticalBalancePools: alerts.criticalBalancePools || 0,
                expiringPools: alerts.expiringPools || 0
            });
        } catch (error: any) {
            console.error('Error fetching budget pool stats:', error);
            ErrorHandler.showError(error, 'Failed to load budget pool statistics');

            // Set default stats on error
            setStats({
                totalPools: 0,
                activePools: 0,
                totalBudget: 0,
                totalAllocated: 0,
                totalSpent: 0,
                availableBudget: 0,
                avgUtilization: 0,
                lowBalancePools: 0,
                criticalBalancePools: 0,
                expiringPools: 0
            });
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchBudgetPools = async () => {
        if (!canManageBudgetPools) return;

        try {
            const response = await budgetService.getAll(filters);
            setBudgetPools(response.budgetPools);
        } catch (error: any) {
            console.error('Error fetching budget pools:', error);
            ErrorHandler.showError(error, 'Failed to load budget pools');
        }
    };

    useEffect(() => {
        fetchBudgetPools();
    }, [refreshTrigger, filters]);

    const handleCreateBudgetPool = () => {
        setShowCreateModal(true);
    };

    const handleEditBudgetPool = (budgetPool: BudgetPool) => {
        setEditingBudgetPool(budgetPool);
        setShowCreateModal(true);
        setShowDetailModal(false); // Close detail modal when editing
    };

    const handleViewDetails = (budgetPool: BudgetPool) => {
        setSelectedBudgetPool(budgetPool);
        setShowDetailModal(true);
    };

    const handleActivateBudgetPool = async (id: string) => {
        try {
            await budgetService.activate(id);
            ErrorHandler.showSuccess('Budget pool activated successfully');
            setRefreshTrigger(prev => prev + 1);
            fetchStats();
        } catch (error: any) {
            ErrorHandler.showError(error, 'Failed to activate budget pool');
        }
    };

    const handleFreezeBudgetPool = async (id: string) => {
        try {
            await budgetService.freeze(id);
            ErrorHandler.showSuccess('Budget pool frozen successfully');
            setRefreshTrigger(prev => prev + 1);
            fetchStats();
        } catch (error: any) {
            ErrorHandler.showError(error, 'Failed to freeze budget pool');
        }
    };

    const handleCancelBudgetPool = async (id: string) => {
        try {
            await budgetService.cancel(id);
            ErrorHandler.showSuccess('Budget pool cancelled successfully');
            setRefreshTrigger(prev => prev + 1);
            fetchStats();
        } catch (error: any) {
            ErrorHandler.showError(error, 'Failed to cancel budget pool');
        }
    };

    const handleDeleteBudgetPool = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this budget pool? This action cannot be undone.')) return;

        try {
            await budgetService.delete(id);
            ErrorHandler.showSuccess('Budget pool deleted successfully');
            setRefreshTrigger(prev => prev + 1);
            fetchStats();
        } catch (error: any) {
            ErrorHandler.showError(error, 'Failed to delete budget pool');
        }
    };

    const handleModalSuccess = (budgetPool: BudgetPool) => {
        // Refresh the budget pools list
        setRefreshTrigger(prev => prev + 1);

        // Close modal and reset editing state
        setShowCreateModal(false);
        setEditingBudgetPool(null);

        // Show success message is already handled by the modal
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setEditingBudgetPool(null);
    };

    const refreshData = () => {
        setRefreshTrigger(prev => prev + 1);
        fetchStats();
        ErrorHandler.showSuccess('Data refreshed');
    };

    const handleQuickFilter = (filterType: keyof typeof filters, value: string | number) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    // Tab configuration
    const tabs = [
        {
            id: 'table' as ViewMode,
            name: 'Budget Pools',
            icon: TableCellsIcon,
            description: 'View and manage all budget pools'
        },
        {
            id: 'overview' as ViewMode,
            name: 'Overview',
            icon: PresentationChartBarIcon,
            description: 'Budget analytics and insights'
        },
        {
            id: 'allocation' as ViewMode,
            name: 'Allocation Manager',
            icon: ArrowRightIcon,
            description: 'Allocate funds to approved requests'
        }
    ];

    if (!canManageBudgetPools) {
        return null; // Will redirect in useEffect
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading budget pool management...</span>
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
                            <CurrencyDollarIcon className="h-8 w-8 mr-3 text-blue-600" />
                            Budget Pool Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage budget pools, allocations, and financial resources
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={refreshData}
                            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={statsLoading}
                        >
                            <ArrowPathIcon className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        {canManageBudgetPools && (
                            <button
                                onClick={handleCreateBudgetPool}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create Budget Pool
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setViewMode(tab.id)}
                                        className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-center text-sm font-medium hover:bg-gray-50 focus:z-10 transition-colors ${viewMode === tab.id
                                                ? 'text-blue-600 border-b-2 border-blue-600'
                                                : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <Icon className="h-5 w-5" />
                                            <span>{tab.name}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {tab.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Conditional Content Based on View Mode */}
                {viewMode === 'table' && (
                    <>
                        {/* Budget Pool Statistics Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {/* Total Budget */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <BanknotesIcon className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Budget</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                        ) : (
                                            <p className="text-2xl font-bold text-gray-900">
                                                {budgetService.formatCurrency(stats?.totalBudget || 0)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-sm text-green-600 font-medium">
                                        {stats?.totalPools || 0} pools
                                    </span>
                                </div>
                            </div>

                            {/* Available Budget */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Available</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                        ) : (
                                            <p className="text-2xl font-bold text-gray-900">
                                                {budgetService.formatCurrency(stats?.availableBudget || 0)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-sm text-blue-600 font-medium">
                                        {stats && stats.totalBudget > 0
                                            ? Math.round((stats.availableBudget / stats.totalBudget) * 100)
                                            : 0}% of total
                                    </span>
                                </div>
                            </div>

                            {/* Allocated Budget */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Allocated</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                        ) : (
                                            <p className="text-2xl font-bold text-gray-900">
                                                {budgetService.formatCurrency(stats?.totalAllocated || 0)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-sm text-yellow-600 font-medium">
                                        Reserved funds
                                    </span>
                                </div>
                            </div>

                            {/* Spent Budget */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <XCircleIcon className="h-8 w-8 text-red-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Spent</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                        ) : (
                                            <p className="text-2xl font-bold text-gray-900">
                                                {budgetService.formatCurrency(stats?.totalSpent || 0)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-sm text-red-600 font-medium">
                                        {Math.round(stats?.avgUtilization || 0)}% utilization
                                    </span>
                                </div>
                            </div>

                            {/* Alerts */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <FireIcon className="h-8 w-8 text-orange-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Alerts</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                        ) : (
                                            <p className="text-2xl font-bold text-gray-900">
                                                {(stats?.lowBalancePools || 0) + (stats?.criticalBalancePools || 0) + (stats?.expiringPools || 0)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-sm text-orange-600 font-medium">
                                        Needs attention
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Status Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Quick Filters</h3>
                                <button
                                    onClick={() => setFilters({
                                        status: '' as any,
                                        fiscalYear: undefined,
                                        department: '',
                                        fundingSource: '' as any,
                                        search: '',
                                        page: 1,
                                        limit: 20
                                    })}
                                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {Object.entries({
                                    draft: 'Draft',
                                    active: 'Active',
                                    frozen: 'Frozen',
                                    depleted: 'Depleted',
                                    expired: 'Expired'
                                }).map(([status, label]) => (
                                    <button
                                        key={status}
                                        onClick={() => handleQuickFilter('status', status)}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.status === status
                                            ? `${budgetService.getStatusColor(status as any).replace('bg-', 'bg-').replace('text-', 'text-')} ring-2 ring-offset-1 ring-blue-500 transform scale-105`
                                            : `${budgetService.getStatusColor(status as any)} hover:opacity-80 hover:transform hover:scale-105`
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Filters Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <FunnelIcon className="h-5 w-5 mr-2 text-blue-600" />
                                Advanced Filters
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filters.status || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="frozen">Frozen</option>
                                        <option value="depleted">Depleted</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="transferred">Transferred</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
                                    <select
                                        value={filters.fiscalYear || ''}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            fiscalYear: e.target.value ? parseInt(e.target.value) : undefined
                                        }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="">All Years</option>
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                    <input
                                        type="text"
                                        placeholder="Department name..."
                                        value={filters.department || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Funding Source</label>
                                    <select
                                        value={filters.fundingSource || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, fundingSource: e.target.value as any }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="">All Sources</option>
                                        <option value="government">Government</option>
                                        <option value="donations">Donations</option>
                                        <option value="grants">Grants</option>
                                        <option value="internal">Internal</option>
                                        <option value="international">International</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search pools..."
                                        value={filters.search || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Budget Pools Table */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Budget Pools</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {budgetPools.length} pool{budgetPools.length !== 1 ? 's' : ''} found
                                </p>
                            </div>

                            {budgetPools.length === 0 ? (
                                <div className="text-center py-12">
                                    <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No budget pools</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new budget pool.</p>
                                    {canManageBudgetPools && (
                                        <div className="mt-6">
                                            <button
                                                onClick={handleCreateBudgetPool}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                Create Budget Pool
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Pool Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Available
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Department
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {budgetPools.map((pool) => (
                                                <tr key={pool._id}>
                                                    <td className="px-6 py-4">
                                                        <div
                                                            className="flex items-center cursor-pointer"
                                                            onClick={() => handleViewDetails(pool)}
                                                        >
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                                    <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                                                    {pool.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                    {pool.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${budgetService.getStatusColor(pool.status)}`}>
                                                            {budgetService.formatStatus(pool.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {budgetService.formatCurrency(pool.totalAmount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {budgetService.formatCurrency(pool.availableAmount || 0)}
                                                    </td>
                                                    
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end items-center space-x-2">
                                                            {/* Primary Actions - More Prominent */}
                                                            {canManageBudgetPools && pool.status === 'draft' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleActivateBudgetPool(pool._id);
                                                                    }}
                                                                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                                                    title="Activate budget pool"
                                                                >
                                                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                                    Activate
                                                                </button>
                                                            )}

                                                            {canManageBudgetPools && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditBudgetPool(pool);
                                                                    }}
                                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                                    title="Edit budget pool"
                                                                >
                                                                    <PencilIcon className="h-3 w-3 mr-1" />
                                                                    Edit
                                                                </button>
                                                            )}

                                                            {/* Secondary Actions - Dropdown Menu */}
                                                            <div className="relative group">
                                                                <button
                                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    title="More actions"
                                                                >
                                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                    </svg>
                                                                </button>

                                                                {/* Dropdown Menu */}
                                                                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleViewDetails(pool);
                                                                            }}
                                                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                        >
                                                                            <EyeIcon className="h-4 w-4 mr-2" />
                                                                            View Details
                                                                        </button>

                                                                        {canManageBudgetPools && pool.status === 'active' && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleFreezeBudgetPool(pool._id);
                                                                                }}
                                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                            >
                                                                                <XCircleIcon className="h-4 w-4 mr-2" />
                                                                                Freeze
                                                                            </button>
                                                                        )}

                                                                        {canManageBudgetPools && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteBudgetPool(pool._id);
                                                                                }}
                                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                                                            >
                                                                                <TrashIcon className="h-4 w-4 mr-2" />
                                                                                Delete
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Budget Overview Tab */}
                {viewMode === 'overview' && (
                    <BudgetOverview />
                )}

                {/* Allocation Manager Tab */}
                {viewMode === 'allocation' && (
                    <AllocationManager />
                )}

                {/* Performance Overview - Show on table view only */}
                {viewMode === 'table' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                                Budget Performance Overview
                            </h3>
                            <button
                                onClick={() => setViewMode('overview')}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                                View detailed analytics →
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {Math.round(stats?.avgUtilization || 0)}%
                                </div>
                                <div className="text-sm text-gray-600">Average Utilization</div>
                                <div className="text-xs text-green-600 mt-1">↑ 5% from last month</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats?.activePools || 0}
                                </div>
                                <div className="text-sm text-gray-600">Active Pools</div>
                                <div className="text-xs text-blue-600 mt-1">Operational status</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats?.lowBalancePools || 0}
                                </div>
                                <div className="text-sm text-gray-600">Low Balance Alerts</div>
                                <div className="text-xs text-yellow-600 mt-1">Requires attention</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats?.expiringPools || 0}
                                </div>
                                <div className="text-sm text-gray-600">Expiring Soon</div>
                                <div className="text-xs text-red-600 mt-1">Next 30 days</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Help Section - Show on table view only */}
                {viewMode === 'table' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-blue-900 mb-4">Budget Pool Management Guide</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-blue-900 mb-2">Pool Management</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Create pools for specific programs or departments</li>
                                    <li>• Set allocation rules and approval limits</li>
                                    <li>• Monitor utilization rates and spending patterns</li>
                                    <li>• Transfer funds between pools when needed</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-blue-900 mb-2">Best Practices</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Review and activate draft pools regularly</li>
                                    <li>• Set appropriate alert thresholds for monitoring</li>
                                    <li>• Track allocation patterns and adjust rules</li>
                                    <li>• Plan for budget periods and renewal cycles</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modals */}
                {showCreateModal && (
                    <CreateBudgetPoolModal
                        isOpen={showCreateModal}
                        onClose={handleModalClose}
                        onSuccess={handleModalSuccess}
                        editingBudgetPool={editingBudgetPool}
                    />
                )}

                {showDetailModal && selectedBudgetPool && (
                    <BudgetPoolDetailModal
                        isOpen={showDetailModal}
                        onClose={() => setShowDetailModal(false)}
                        budgetPool={selectedBudgetPool}
                        onEdit={handleEditBudgetPool}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default BudgetPoolManagementPage;