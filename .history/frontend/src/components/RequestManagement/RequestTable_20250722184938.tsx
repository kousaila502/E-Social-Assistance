// src/components/RequestManagement/RequestTable.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Demande } from '../../config/apiConfig';
import requestService, { DemandesResponse } from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import { REQUEST_STATUS_CONFIG, URGENCY_LEVEL_CONFIG, ROUTES } from '../../utils/constants';
import {
  EyeIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface RequestTableProps {
  onRequestSelect?: (request: Demande) => void;
  filters?: {
    status?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
  };
  refreshTrigger?: number;
}

interface SortConfig {
  key: keyof Demande | 'applicantName';
  direction: 'asc' | 'desc';
}

const RequestTable: React.FC<RequestTableProps> = ({
  onRequestSelect,
  filters = {},
  refreshTrigger = 0
}) => {
  const { hasAnyRole } = useAuth();
  const [requests, setRequests] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || '',
    category: filters.category || '',
    search: filters.search || ''
  });

  const itemsPerPage = 20;

  // Check if user can manage requests
  const canManageRequests = hasAnyRole(['admin', 'case_worker']);

  const fetchRequests = async (page: number = 1) => {
    if (!canManageRequests) {
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
        ...filters,
        ...localFilters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') {
          delete params[key as keyof typeof params];
        }
      });

      const response: DemandesResponse = await requestService.getAll(params);

      // Check if response exists and has the expected structure
      if (!response) {
        throw new Error('No response from server');
      }

      // Handle potential missing properties with fallbacks
      setRequests(response.demandes || []);

      if (response.pagination) {
        setCurrentPage(response.pagination.currentPage || page);
        setTotalPages(response.pagination.totalPages || 1);
        setTotalCount(response.pagination.totalCount || 0);
      } else {
        // Fallback pagination if pagination object is missing
        setCurrentPage(page);
        setTotalPages(1);
        setTotalCount(response.demandes?.length || 0);
      }
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(currentPage);
  }, [currentPage, filters, refreshTrigger]);

  useEffect(() => {
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchRequests(1);
    }
  }, [localFilters]);

  const handleSort = (key: keyof Demande | 'applicantName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    // Sort the current data
    const sortedRequests = [...requests].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (key === 'applicantName') {
        aValue = a.applicant?.name || '';
        bValue = b.applicant?.name || '';
      } else {
        aValue = a[key];
        bValue = b[key];
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setRequests(sortedRequests);
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleRequestClick = (request: Demande) => {
    if (onRequestSelect) {
      onRequestSelect(request);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config = REQUEST_STATUS_CONFIG[status as keyof typeof REQUEST_STATUS_CONFIG];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const config = URGENCY_LEVEL_CONFIG[urgency as keyof typeof URGENCY_LEVEL_CONFIG];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const SortIcon = ({ column }: { column: keyof Demande | 'applicantName' }) => {
    if (sortConfig.key !== column) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUpIcon className="h-4 w-4 text-gray-600" />
      : <ChevronDownIcon className="h-4 w-4 text-gray-600" />;
  };

  if (!canManageRequests) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <UserIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to view requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
            Filters
          </h3>
          <button
            onClick={() => setLocalFilters({ status: '', category: '', search: '' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(REQUEST_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="medical">Medical</option>
            <option value="education">Education</option>
            <option value="housing">Housing</option>
            <option value="food">Food Assistance</option>
            <option value="employment">Employment</option>
            <option value="disability">Disability Support</option>
            <option value="elderly">Elderly Care</option>
            <option value="child_welfare">Child Welfare</option>
            <option value="other">Other</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium">{totalCount}</span> requests found
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <ClockIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Requests</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchRequests(currentPage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <ClockIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">No requests match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Request</span>
                        <SortIcon column="title" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('applicantName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Applicant</span>
                        <SortIcon column="applicantName" />
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
                      onClick={() => handleSort('requestedAmount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        <SortIcon column="requestedAmount" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('urgencyLevel')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Urgency</span>
                        <SortIcon column="urgencyLevel" />
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
                  {requests.map((request) => (
                    <tr
                      key={request._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRequestClick(request)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {request.title}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {request.category?.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {request.applicant?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.applicant?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(request.requestedAmount)}
                        </div>
                        {request.approvedAmount && (
                          <div className="text-sm text-green-600">
                            Approved: {formatCurrency(request.approvedAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getUrgencyBadge(request.urgencyLevel)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={ROUTES.REQUEST_DETAILS.replace(':id', request._id)}
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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

export default RequestTable;