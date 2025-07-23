// src/components/RequestManagement/RequestTable.tsx - SMART COMPONENT REUSE VERSION
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

// 🔥 UPDATED: Props interface for smart component reuse
interface RequestTableProps {
  onRequestSelect?: (request: Demande) => void;
  filters?: {
    status?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
  };
  refreshTrigger?: number;
  userMode?: boolean;           // NEW: When true, shows user-friendly version
  applicantFilter?: string;     // NEW: Filter to specific applicant (for My Applications)
  hideAdminActions?: boolean;   // NEW: Hide admin-only columns and actions
}

interface SortConfig {
  key: keyof Demande | 'applicantName';
  direction: 'asc' | 'desc';
}

const RequestTable: React.FC<RequestTableProps> = ({
  onRequestSelect,
  filters = {},
  refreshTrigger = 0,
  userMode = false,              // NEW: Default to admin mode
  applicantFilter,               // NEW: Filter for specific applicant
  hideAdminActions = false       // NEW: Control admin actions visibility
}) => {
  const { hasAnyRole, user } = useAuth();
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
    assignedTo: filters.assignedTo || '',
    search: filters.search || ''
  });

  // 🔥 SMART LOGIC: Dynamic permissions based on mode
  const canManageRequests = userMode ? false : hasAnyRole(['admin', 'case_worker']);
  const canViewAllRequests = userMode ? false : hasAnyRole(['admin', 'case_worker']);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters({
      status: filters.status || '',
      category: filters.category || '',
      assignedTo: filters.assignedTo || '',
      search: filters.search || ''
    });
  }, [filters]);

  // 🔥 SMART LOGIC: Apply applicant filter automatically in user mode
  useEffect(() => {
    if (userMode && user?._id) {
      setLocalFilters(prev => ({
        ...prev,
        assignedTo: user._id // In user mode, only show current user's requests
      }));
    }
  }, [userMode, user?._id]);

  // Fetch requests when component mounts or dependencies change
  useEffect(() => {
    fetchRequests();
  }, [currentPage, sortConfig, localFilters, refreshTrigger, userMode]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      // 🔥 SMART LOGIC: Build query parameters based on mode
      const queryParams: any = {
        page: currentPage,
        limit: 10,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };

      // Apply filters
      if (localFilters.status) queryParams.status = localFilters.status;
      if (localFilters.category) queryParams.category = localFilters.category;
      if (localFilters.search) queryParams.search = localFilters.search;

      // 🔥 SMART LOGIC: In user mode, filter by current user
      if (userMode && user?._id) {
        queryParams.applicant = user._id;
      } else if (localFilters.assignedTo) {
        queryParams.assignedTo = localFilters.assignedTo;
      }

      // Apply explicit applicant filter if provided
      if (applicantFilter) {
        queryParams.applicant = applicantFilter;
      }

      const response: DemandesResponse = await requestService.getAll(queryParams);
      
      setRequests(response.demandes || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.totalDemandes || 0);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to fetch requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Demande | 'applicantName') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      category: '',
      assignedTo: userMode && user?._id ? user._id : '', // Keep user filter in user mode
      search: ''
    };
    setLocalFilters(clearedFilters);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getApplicantName = (request: Demande): string => {
    if (typeof request.applicant === 'object' && request.applicant) {
      return `${request.applicant.firstName || ''} ${request.applicant.lastName || ''}`.trim();
    }
    return 'Unknown Applicant';
  };

  const getAssignedToName = (request: Demande): string => {
    if (typeof request.assignedTo === 'object' && request.assignedTo) {
      return `${request.assignedTo.firstName || ''} ${request.assignedTo.lastName || ''}`.trim();
    }
    return 'Unassigned';
  };

  const SortIcon = ({ column }: { column: keyof Demande | 'applicantName' }) => {
    if (sortConfig.key !== column) {
      return <ChevronUpIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-blue-600" />
      : <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading requests</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with filters - SMART: Different title based on mode */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {userMode ? 'My Applications' : 'Requests'} ({totalCount})
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear filters
          </button>
        </div>

        {/* Filters - SMART: Hide assignedTo filter in user mode */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={userMode ? "Search my applications..." : "Search requests..."}
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(REQUEST_STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="emergency_assistance">Emergency Assistance</option>
            <option value="educational_support">Educational Support</option>
            <option value="medical_assistance">Medical Assistance</option>
            <option value="housing_support">Housing Support</option>
            <option value="food_assistance">Food Assistance</option>
            <option value="employment_support">Employment Support</option>
            <option value="elderly_care">Elderly Care</option>
            <option value="disability_support">Disability Support</option>
            <option value="other">Other</option>
          </select>

          {/* Assigned To Filter - SMART: Only show in admin mode */}
          {!userMode && canViewAllRequests && (
            <select
              value={localFilters.assignedTo}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Assignments</option>
              <option value="unassigned">Unassigned</option>
              {/* Note: In a real app, you'd fetch and populate case workers here */}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Request Info */}
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1">
                  <span>{userMode ? 'Application' : 'Request'}</span>
                  <SortIcon column="title" />
                </div>
              </th>

              {/* Applicant - SMART: Hide in user mode */}
              {!userMode && (
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('applicantName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Applicant</span>
                    <SortIcon column="applicantName" />
                  </div>
                </th>
              )}

              {/* Amount */}
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('requestedAmount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Amount</span>
                  <SortIcon column="requestedAmount" />
                </div>
              </th>

              {/* Status */}
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <SortIcon column="status" />
                </div>
              </th>

              {/* Priority - SMART: Hide in user mode */}
              {!userMode && (
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Priority</span>
                    <SortIcon column="priority" />
                  </div>
                </th>
              )}

              {/* Assigned To - SMART: Hide in user mode or when hideAdminActions */}
              {!userMode && !hideAdminActions && canViewAllRequests && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
              )}

              {/* Date */}
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>{userMode ? 'Submitted' : 'Created'}</span>
                  <SortIcon column="createdAt" />
                </div>
              </th>

              {/* Actions */}
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={userMode ? 4 : 7} className="px-6 py-12 text-center text-gray-500">
                  {userMode ? 'No applications found' : 'No requests found'}
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  {/* Request Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {request.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {request._id.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {request.category?.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Applicant - SMART: Hide in user mode */}
                  {!userMode && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {getApplicantName(request)}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {formatCurrency(request.requestedAmount)}
                    </div>
                    {request.approvedAmount && request.approvedAmount !== request.requestedAmount && (
                      <div className="text-xs text-green-600">
                        Approved: {formatCurrency(request.approvedAmount)}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_CONFIG[request.status]?.bgColor || 'bg-gray-100'} ${REQUEST_STATUS_CONFIG[request.status]?.textColor || 'text-gray-800'}`}>
                      {REQUEST_STATUS_CONFIG[request.status]?.label || request.status}
                    </span>
                  </td>

                  {/* Priority - SMART: Hide in user mode */}
                  {!userMode && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${URGENCY_LEVEL_CONFIG[request.urgencyLevel]?.bgColor || 'bg-gray-100'} ${URGENCY_LEVEL_CONFIG[request.urgencyLevel]?.textColor || 'text-gray-800'}`}>
                        {URGENCY_LEVEL_CONFIG[request.urgencyLevel]?.label || request.urgencyLevel}
                      </span>
                    </td>
                  )}

                  {/* Assigned To - SMART: Hide in user mode or when hideAdminActions */}
                  {!userMode && !hideAdminActions && canViewAllRequests && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getAssignedToName(request)}
                    </td>
                  )}

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDate(request.createdAt)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onRequestSelect?.(request)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {userMode ? 'View' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, totalCount)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
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
    </div>
  );
};

export default RequestTable;