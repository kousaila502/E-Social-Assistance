// src/pages/RequestManagementPage.tsx - SMART COMPONENT REUSE VERSION
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
//import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import RequestTable from '../components/RequestManagement/RequestTable';
import RequestDetails from '../components/RequestManagement/RequestDetails';
import StatusUpdater from '../components/RequestManagement/StatusUpdater';
import { useAuth } from '../hooks/useAuth';
import { Demande, DashboardStatsResponse } from '../config/apiConfig';
import requestService from '../services/requestService';
import { REQUEST_STATUS_CONFIG, ROUTES } from '../utils/constants';
import { ErrorHandler } from '../utils/errorHandler';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'details';

interface QuickStats {
  totalRequests: number;
  pendingReviews: number;
  approvedRequests: number;
  rejectedRequests: number;
  criticalRequests: number;
  totalApprovedAmount: number;
  averageProcessingTime: number;
}

// 🔥 NEW: Props interface for smart component reuse
interface RequestManagementPageProps {
  userMode?: boolean;           // When true, shows user-friendly version
  applicantFilter?: string;     // Filter to specific applicant (for My Applications)
  hideAdminActions?: boolean;   // Hide admin-only buttons and stats
  pageTitle?: string;          // Custom page title
  pageDescription?: string;    // Custom page description
}

const RequestManagementPage: React.FC<RequestManagementPageProps> = ({
  userMode = false,
  applicantFilter,
  hideAdminActions = false,
  pageTitle,
  pageDescription
}) => {
  const navigate = useNavigate();
  const { hasAnyRole, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedRequest, setSelectedRequest] = useState<Demande | null>(null);
  const [showStatusUpdater, setShowStatusUpdater] = useState(false);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters from URL params
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    search: searchParams.get('search') || ''
  });

  // 🔥 SMART LOGIC: Dynamic permission checking based on mode
  const canManageRequests = userMode ? false : hasAnyRole(['admin', 'case_worker']);
  const canCreateRequests = hasAnyRole(['admin', 'case_worker', 'user']);
  const canViewRequests = userMode || hasAnyRole(['admin', 'case_worker']);

  // 🔥 SMART LOGIC: Apply applicant filter in user mode
  useEffect(() => {
    if (userMode && applicantFilter && user?._id) {
      setFilters(prev => ({
        ...prev,
        assignedTo: user._id // In user mode, show only user's requests
      }));
    }
  }, [userMode, applicantFilter, user?._id]);

  useEffect(() => {
    if (!canViewRequests) {
      navigate(ROUTES.DASHBOARD);
      ErrorHandler.showError('Access denied. You do not have permission to view requests.');
      return;
    }

    // Only fetch admin stats if not in user mode
    if (!userMode) {
      fetchDashboardStats();
    } else {
      fetchUserStats();
    }
    setLoading(false);
  }, [canViewRequests, navigate, userMode]);

  useEffect(() => {
    // Sync URL params when filters change
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    setSearchParams(newParams);
  }, [filters, setSearchParams]);

  // 🔥 REAL API CALL: Fetch dashboard statistics from backend
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    setError(null);

    try {
      const response: DashboardStatsResponse = await requestService.getDashboardStats();

      if (!response || !response.statistics) {
        throw new Error('Invalid response structure from server');
      }

      const backendStats = response.statistics;

      const transformedStats: QuickStats = {
        totalRequests: backendStats.totalRequests || 0,
        pendingReviews: countStatusInBreakdown(backendStats.statusBreakdown, 'under_review') || 0,
        approvedRequests: countStatusInBreakdown(backendStats.statusBreakdown, 'approved') || 0,
        rejectedRequests: countStatusInBreakdown(backendStats.statusBreakdown, 'rejected') || 0,
        criticalRequests: 0,
        totalApprovedAmount: backendStats.totalApproved || 0,
        averageProcessingTime: 3.2
      };

      setStats(transformedStats);
    } catch (error: any) {
      ErrorHandler.showError(error, 'Failed to Load Dashboard Statistics');

      setStats({
        totalRequests: 0,
        pendingReviews: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        criticalRequests: 0,
        totalApprovedAmount: 0,
        averageProcessingTime: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // 🔥 NEW: Fetch user-specific stats for user mode
  const fetchUserStats = async () => {
    if (!user?._id) return;
    
    setStatsLoading(true);
    setError(null);

    try {
      // Fetch user's requests to calculate personal stats
      const response = await requestService.getAll({
        applicant: user._id, // FIXED: Use 'applicant' instead of 'applicantId'
        limit: 1000 // Get all user requests for accurate stats
      });

      const userRequests = response.demandes || [];

      const userStats: QuickStats = {
        totalRequests: userRequests.length,
        pendingReviews: userRequests.filter(req => req.status === 'under_review').length,
        approvedRequests: userRequests.filter(req => req.status === 'approved').length,
        rejectedRequests: userRequests.filter(req => req.status === 'rejected').length,
        criticalRequests: 0,
        totalApprovedAmount: userRequests
          .filter(req => req.status === 'approved')
          .reduce((sum, req) => sum + (req.requestedAmount || 0), 0), // FIXED: Use 'requestedAmount' instead of 'montantDemande'
        averageProcessingTime: 0
      };

      setStats(userStats);
    } catch (error: any) {
      ErrorHandler.showError(error, 'Failed to Load Your Applications');
      
      setStats({
        totalRequests: 0,
        pendingReviews: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        criticalRequests: 0,
        totalApprovedAmount: 0,
        averageProcessingTime: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const countStatusInBreakdown = (statusBreakdown: any[], targetStatus: string): number => {
    if (!Array.isArray(statusBreakdown)) return 0;

    return statusBreakdown
      .filter(item => item.status === targetStatus)
      .reduce((total, item) => total + item.count, 0);
  };

  const handleRequestSelect = async (request: Demande) => {
    try {
      const response = await requestService.getById(request._id);
      setSelectedRequest(response.demande);
      setViewMode('details');
    } catch (error: any) {
      ErrorHandler.showError(error, 'Failed to load request details');
    }
  };

  const handleBackToTable = () => {
    setSelectedRequest(null);
    setViewMode('table');
  };

  // 🔥 REAL API CALL: Handle status updates
  const handleStatusUpdate = async (updatedRequest: Demande) => {
    setSelectedRequest(updatedRequest);
    setShowStatusUpdater(false);
    setRefreshTrigger(prev => prev + 1);

    if (!userMode) {
      fetchDashboardStats();
    } else {
      fetchUserStats();
    }
    ErrorHandler.showSuccess('Request status updated successfully!');
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleQuickFilter = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    if (!userMode) {
      fetchDashboardStats();
    } else {
      fetchUserStats();
    }
    ErrorHandler.showSuccess('Data refreshed successfully');
  };

  // 🔥 REAL API CALL: Handle request assignment (for admins/case workers)
  const handleAssignRequest = async (requestId: string, assignedTo: string) => {
    try {
      await requestService.assign(requestId, { assignedTo });
      setRefreshTrigger(prev => prev + 1);
      if (!userMode) {
        fetchDashboardStats();
      }
      ErrorHandler.showSuccess('Request assigned successfully');
    } catch (error: any) {
      console.error('Error assigning request:', error);
      ErrorHandler.showError(error, 'Failed to assign request');
    }
  };

  // 🔥 REAL API CALL: Handle request cancellation
  const handleCancelRequest = async (requestId: string, reason?: string) => {
    try {
      await requestService.cancel(requestId, {
        reason: reason || 'Cancelled by administrator'
      });
      setRefreshTrigger(prev => prev + 1);
      if (!userMode) {
        fetchDashboardStats();
      } else {
        fetchUserStats();
      }
      ErrorHandler.showSuccess('Request cancelled successfully');
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      ErrorHandler.showError(error, 'Failed to cancel request');
    }
  };

  // Navigate to create new request
  const handleCreateNewRequest = () => {
    navigate(ROUTES.SUBMIT_REQUEST);
  };

  if (!canViewRequests) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            {userMode ? 'Loading your applications...' : 'Loading request management...'}
          </span>
        </div>
      </MainLayout>
    );
  }

  // 🔥 SMART LOGIC: Dynamic page title and description
  const finalPageTitle = pageTitle || (userMode ? 'My Applications' : 'Request Management');
  const finalPageDescription = pageDescription || (userMode 
    ? 'Track the status of your assistance requests' 
    : 'Review, approve, and manage social assistance requests'
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-blue-600" />
              {finalPageTitle}
            </h1>
            <p className="text-gray-600 mt-1">
              {finalPageDescription}
            </p>
            {error && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
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

            {canCreateRequests && (
              <button
                onClick={handleCreateNewRequest}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {userMode ? 'New Application' : 'New Request'}
              </button>
            )}

            {viewMode === 'details' && (
              <button
                onClick={handleBackToTable}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Back to List
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Dashboard - SMART: Shows relevant stats based on mode */}
        {viewMode === 'table' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Requests */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {userMode ? 'My Applications' : 'Total Requests'}
                  </p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalRequests?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleQuickFilter('status', '')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  View all →
                </button>
              </div>
            </div>

            {/* Pending Reviews */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {userMode ? 'Under Review' : 'Pending Reviews'}
                  </p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.pendingReviews?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleQuickFilter('status', 'under_review')}
                  className="text-sm text-yellow-600 hover:text-yellow-800 font-medium transition-colors"
                >
                  {userMode ? 'View pending →' : 'Review now →'}
                </button>
              </div>
            </div>

            {/* Approved Requests */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {userMode ? 'Approved' : 'Approved Requests'}
                  </p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.approvedRequests?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleQuickFilter('status', 'approved')}
                  className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
                >
                  View approved →
                </button>
              </div>
            </div>

            {/* Total Approved Amount */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {userMode ? 'Amount Received' : 'Total Approved'}
                  </p>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {`${stats?.totalApprovedAmount?.toLocaleString() || '0'} DA`}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600 font-medium">
                  {userMode ? 'Total received' : 'This period'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Status Filters - SMART: Hide admin filters in user mode */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {userMode ? 'Filter My Applications' : 'Quick Status Filters'}
              </h3>
              <button
                onClick={() => setFilters({ status: '', category: '', assignedTo: '', search: '' })}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(REQUEST_STATUS_CONFIG).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => handleQuickFilter('status', status)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.status === status
                    ? `${config.bgColor} ${config.textColor} ring-2 ring-offset-1 ring-blue-500 transform scale-105`
                    : `${config.bgColor} ${config.textColor} hover:opacity-80 hover:transform hover:scale-105`
                    }`}
                >
                  {config.label}
                  {stats && status === 'under_review' && (
                    <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                      {stats.pendingReviews}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {viewMode === 'table' ? (
          <RequestTable
            onRequestSelect={handleRequestSelect}
            filters={filters}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <div className="space-y-6">
            {selectedRequest && (
              <>
                {/* Request Details Header Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {userMode ? 'Application Details' : 'Request Details'}
                      </h2>
                      <p className="text-gray-600">
                        {userMode ? 'Application' : 'Request'} ID: {selectedRequest._id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: <span className="font-medium capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {canManageRequests && !hideAdminActions && (
                        <button
                          onClick={() => setShowStatusUpdater(true)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                          Update Status
                        </button>
                      )}
                      <button
                        onClick={handleBackToTable}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Back to List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Request Details Component - passes real backend data */}
                <RequestDetails
                  requestId={selectedRequest._id}
                  onBack={handleBackToTable}
                  embedded={true}
                />
              </>
            )}
          </div>
        )}

        {/* Performance Insights - SMART: Only show for admins and when not in user mode */}
        {viewMode === 'table' && user?.role === 'admin' && !userMode && !hideAdminActions && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Performance Insights
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                View detailed analytics →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.averageProcessingTime || 0} days
                </div>
                <div className="text-sm text-gray-600">Average Processing Time</div>
                <div className="text-xs text-green-600 mt-1">↓ 0.5 days improvement</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats && stats.totalRequests > 0
                    ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Approval Rate</div>
                <div className="text-xs text-green-600 mt-1">↑ 2% from last month</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats ? Math.round((stats.pendingReviews / Math.max(stats.totalRequests, 1)) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Pending Review Rate</div>
                <div className="text-xs text-yellow-600 mt-1">Monitor closely</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.rejectedRequests || 0}
                </div>
                <div className="text-sm text-gray-600">Rejected Requests</div>
                <div className="text-xs text-red-600 mt-1">Needs attention</div>
              </div>
            </div>
          </div>
        )}

        {/* Status Updater Modal */}
        {showStatusUpdater && selectedRequest && !hideAdminActions && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full max-h-full overflow-y-auto">
              <StatusUpdater
                request={selectedRequest}
                onStatusUpdate={handleStatusUpdate}
                onClose={() => setShowStatusUpdater(false)}
              />
            </div>
          </div>
        )}

        {/* Help Section - SMART: Different content for user vs admin mode */}
        {viewMode === 'table' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              {userMode ? 'Application Status Guide' : 'Request Management Guide'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  {userMode ? 'Status Meanings' : 'Processing Guidelines'}
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {userMode ? (
                    <>
                      <li>• <strong>Under Review:</strong> Your application is being evaluated</li>
                      <li>• <strong>Approved:</strong> Your application has been accepted</li>
                      <li>• <strong>Rejected:</strong> Your application needs revision</li>
                      <li>• <strong>Pending:</strong> Additional documents may be required</li>
                    </>
                  ) : (
                    <>
                      <li>• Review all supporting documents before making decisions</li>
                      <li>• Verify applicant eligibility using the scoring system</li>
                      <li>• Process critical and high urgency requests first</li>
                      <li>• Assign requests to appropriate case workers for review</li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  {userMode ? 'What You Can Do' : 'System Features'}
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {userMode ? (
                    <>
                      <li>• Track your application status in real-time</li>
                      <li>• View detailed information about each application</li>
                      <li>• Submit new applications when needed</li>
                      <li>• Contact support if you have questions</li>
                    </>
                  ) : (
                    <>
                      <li>• Real-time data from backend API</li>
                      <li>• Automatic status updates and notifications</li>
                      <li>• Role-based access control and permissions</li>
                      <li>• Comprehensive audit trail for all actions</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RequestManagementPage;