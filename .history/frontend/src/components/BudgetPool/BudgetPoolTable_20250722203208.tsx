// src/components/BudgetPool/BudgetPoolTable.tsx
import React, { useState, useEffect } from 'react';
import { BudgetPool } from '../../config/apiConfig';
import budgetService from '../../services/budgetService';
import { useAuth } from '../../hooks/useAuth';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  FireIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';

interface BudgetPoolTableProps {
  onBudgetPoolSelect?: (budgetPool: BudgetPool) => void;
  onBudgetPoolEdit?: (budgetPool: BudgetPool) => void;
  onBudgetPoolDelete?: (budgetPool: BudgetPool) => void;
  onBudgetPoolView?: (budgetPool: BudgetPool) => void;
  filters?: {
    status?: string;
    department?: string;
    fiscalYear?: string;
    fundingSource?: string;
    search?: string;
  };
  refreshTrigger?: number;
}

interface SortConfig {
  key: keyof BudgetPool | 'createdAt';
  direction: 'asc' | 'desc';
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const BudgetPoolTable: React.FC<BudgetPoolTableProps> = ({
  onBudgetPoolSelect,
  onBudgetPoolEdit,
  onBudgetPoolDelete,
  onBudgetPoolView,
  filters = {},
  refreshTrigger = 0
}) => {
  const { hasAnyRole } = useAuth();
  const [budgetPools, setBudgetPools] = useState<BudgetPool[]>([]);
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

  const itemsPerPage = 10;

  // Check permissions
  const isAdmin = hasAnyRole(['admin']);
  const isFinanceManager = hasAnyRole(['finance_manager']);
  const canManageBudgetPools = isAdmin || isFinanceManager;
  const canViewBudgetPools = hasAnyRole(['admin', 'finance_manager', 'case_worker']);

  useEffect(() => {
    fetchBudgetPools(1);
  }, [filters, refreshTrigger]);

  const fetchBudgetPools = async (page: number = 1) => {
    if (!canViewBudgetPools) {
      setError('Access denied. Insufficient permissions.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: itemsPerPage,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') {
          delete params[key as keyof typeof params];
        }
      });

      const response = await budgetService.getAll(params);

      if (!response) {
        throw new Error('No response from server');
      }

      setBudgetPools(response.budgetPools || []);
      
      if (response.pagination) {
        setPagination({
          currentPage: response.pagination.currentPage || page,
          totalPages: response.pagination.totalPages || 1,
          totalCount: response.pagination.totalCount || 0,
          hasNextPage: response.pagination.hasNextPage || false,
          hasPrevPage: response.pagination.hasPrevPage || false
        });
      }

    } catch (error: any) {
      console.error('Error fetching budget pools:', error);
      setError(error.message || 'Failed to fetch budget pools');
      setBudgetPools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof BudgetPool | 'createdAt') => {
    const direction = sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc';
    setSortConfig({ key, direction });
    fetchBudgetPools(currentPage);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
      fetchBudgetPools(page);
    }
  };

  const handleView = (budgetPool: BudgetPool) => {
    if (onBudgetPoolView) {
      onBudgetPoolView(budgetPool);
    } else if (onBudgetPoolSelect) {
      onBudgetPoolSelect(budgetPool);
    }
  };

  const handleEdit = (budgetPool: BudgetPool) => {
    if (onBudgetPoolEdit) {
      onBudgetPoolEdit(budgetPool);
    }
  };

  const handleDelete = (budgetPool: BudgetPool) => {
    if (onBudgetPoolDelete) {
      onBudgetPoolDelete(budgetPool);
    }
  };

  // Helper functions
  const calculateUtilization = (budgetPool: BudgetPool) => {
    const spent = budgetPool.totalAmount - (budgetPool.availableAmount || 0);
    return budgetPool.totalAmount > 0 ? (spent / budgetPool.totalAmount) * 100 : 0;
  };

  const isLowBalance = (budgetPool: BudgetPool) => {
    if (!budgetPool.alertThresholds) return false;
    const utilization = calculateUtilization(budgetPool);
    return utilization >= (100 - budgetPool.alertThresholds.lowBalance);
  };

  const isCriticalBalance = (budgetPool: BudgetPool) => {
    if (!budgetPool.alertThresholds) return false;
    const utilization = calculateUtilization(budgetPool);
    return utilization >= (100 - budgetPool.alertThresholds.criticalBalance);
  };

  const isExpired = (budgetPool: BudgetPool) => {
    return budgetPool.budgetPeriod ? new Date(budgetPool.budgetPeriod.endDate) < new Date() : false;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircleIcon;
      case 'frozen': return PauseIcon;
      case 'depleted': return ExclamationTriangleIcon;
      case 'expired': return ClockIcon;
      case 'cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const SortIcon: React.FC<{ column: string }> = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4 text-blue-600" /> : 
      <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
  };

  if (!canViewBudgetPools) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircleIcon className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500 text-center">
          You don't have permission to view budget pools.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
            Budget Pools
          </h3>
          <div className="text-sm text-gray-500">
            {pagination.totalCount} total budget pools
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Budget Pools</h3>
            <p className="text-red-600 text-center mb-4">{error}</p>
            <button
              onClick={() => fetchBudgetPools(currentPage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : budgetPools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Pools Found</h3>
            <p className="text-gray-500 text-center">
              {Object.keys(filters).some(key => filters[key as keyof typeof filters])
                ? 'No budget pools match your current filters.'
                : 'No budget pools have been created yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Budget Pool</span>
                        <SortIcon column="name" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Department</span>
                        <SortIcon column="department" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        <SortIcon column="status" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalAmount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Total Budget</span>
                        <SortIcon column="totalAmount" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilization
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('fiscalYear')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Fiscal Year</span>
                        <SortIcon column="fiscalYear" />
                      </div>
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
                  {budgetPools.map((budgetPool) => {
                    const utilization = calculateUtilization(budgetPool);
                    const lowBalance = isLowBalance(budgetPool);
                    const criticalBalance = isCriticalBalance(budgetPool);
                    const expired = isExpired(budgetPool);
                    const StatusIcon = getStatusIcon(budgetPool.status);

                    return (
                      <tr key={budgetPool._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {budgetPool.name}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {budgetPool.description}
                              </div>
                              <div className="flex items-center mt-1 space-x-2">
                                {expired && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    Expired
                                  </span>
                                )}
                                {criticalBalance && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    <FireIcon className="h-3 w-3 mr-1" />
                                    Critical
                                  </span>
                                )}
                                {lowBalance && !criticalBalance && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                    Low Balance
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{budgetPool.department}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${budgetService.getStatusColor(budgetPool.status as any)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {budgetService.formatStatus(budgetPool.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {budgetService.formatCurrency(budgetPool.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {budgetPool.fundingSource}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {budgetService.formatCurrency(budgetPool.availableAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {budgetService.formatCurrency(budgetPool.totalAmount - (budgetPool.availableAmount || 0))} spent
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  criticalBalance ? 'bg-red-500' :
                                  lowBalance ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${
                              criticalBalance ? 'text-red-600' :
                              lowBalance ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {Math.round(utilization)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{budgetPool.fiscalYear}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(budgetPool.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(budgetPool.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(budgetPool)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {canManageBudgetPools && (
                              <>
                                <button
                                  onClick={() => handleEdit(budgetPool)}
                                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                                  title="Edit Budget Pool"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                {['draft', 'frozen'].includes(budgetPool.status) && (
                                  <button
                                    onClick={() => handleDelete(budgetPool)}
                                    className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Budget Pool"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
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
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, pagination.totalCount)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        const page = Math.max(1, currentPage - 2) + i;
                        if (page > pagination.totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
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

export default BudgetPoolTable;