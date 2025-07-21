// src/pages/RequestManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import RequestTable from '../components/RequestManagement/RequestTable';
import RequestDetails from '../components/RequestManagement/RequestDetails';
import StatusUpdater from '../components/RequestManagement/StatusUpdater';
import { useAuth } from '../hooks/useAuth';
import { Demande } from '../config/apiConfig';
import requestService, { DashboardStatsResponse } from '../services/requestService';
import { REQUEST_STATUS_CONFIG, ROUTES } from '../utils/constants';
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
  ArrowPathIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'details';

interface QuickStats {
  totalRequests: number;
  pendingReviews: number;
  approvedToday: number;
  criticalRequests: number;
  averageProcessingTime: number;
  totalApprovedAmount: number;
}

const RequestManagementPage: React.FC = () => {
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

  // Filters from URL params
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    search: searchParams.get('search') || ''
  });

  // Check permissions
  const canManageRequests = hasAnyRole(['admin', 'case_worker']);

  useEffect(() => {
    if (!canManageRequests) {
      navigate(ROUTES.DASHBOARD);
      toast.error('Access denied. You do not have permission to manage requests.');
      return;
    }
    
    fetchDashboardStats();
    setLoading(false);
  }, [canManageRequests, navigate]);

  useEffect(() => {
    // Update URL params when filters change
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    setSearchParams(newParams);
  }, [filters, setSearchParams]);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const response: DashboardStatsResponse = await requestService.getDashboardStats();
      
      // Transform the response to match our QuickStats interface
      const transformedStats: QuickStats = {
        totalRequests: response.statistics.totalRequests || 0,
        pendingReviews: response.statistics.pendingRequests || 0,
        approvedToday: response.statistics.approvedRequests || 0,
        criticalRequests: 0, // We'll calculate this from the table data
        averageProcessingTime: 3.2, // Mock data - would come from backend
        totalApprovedAmount: response.statistics.approvedAmount || 0
      };
      
      setStats(transformedStats);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRequestSelect = (request: Demande) => {
    setSelectedRequest(request);
    setViewMode('details');
  };

  const handleBackToTable = () => {
    setSelectedRequest(null);
    setViewMode('table');
  };

  const handleStatusUpdate = (updatedRequest: Demande) => {
    setSelectedRequest(updatedRequest);
    setShowStatusUpdater(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success('Request status updated successfully!');
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
    fetchDashboardStats();
    toast.success('Data refreshed');
  };

  if (!canManageRequests) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading request management...</span>
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
              <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-blue-600" />
              Request Management
            </h1>
            <p className="text-gray-600 mt-1">
              Review, approve, and manage social assistance requests
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
            
            {viewMode === 'details' && (
              <button
                onClick={handleBackToTable}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Back to List
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Dashboard */}
        {viewMode === 'table' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Requests */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.totalRequests?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleQuickFilter('status', '')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all →
                </button>
              </div>
            </div>

            {/* Pending Reviews */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.pendingReviews?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleQuickFilter('status', 'under_review')}
                  className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  Review now →
                </button>
              </div>
            </div>

            {/* Approved Today */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats?.approvedToday?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleQuickFilter('status', 'approved')}
                  className="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  View approved →
                </button>
              </div>
            </div>

            {/* Total Approved Amount */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : `$${stats?.totalApprovedAmount?.toLocaleString() || '0'}`}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600 font-medium">
                  This month
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Status Filters */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Quick Filters</h3>
              <button
                onClick={() => setFilters({ status: '', category: '', assignedTo: '', search: '' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(REQUEST_STATUS_CONFIG).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => handleQuickFilter('status', status)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.status === status
                      ? `${config.bgColor} ${config.textColor} ring-2 ring-offset-1 ring-blue-500`
                      : `${config.bgColor} ${config.textColor} hover:opacity-80`
                  }`}
                >
                  {config.label}
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
                      <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                      <p className="text-gray-600">ID: {selectedRequest._id}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowStatusUpdater(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        Update Status
                      </button>
                      <button
                        onClick={handleBackToTable}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Back to List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Request Details Component */}
                <RequestDetails
                  requestId={selectedRequest._id}
                  onBack={handleBackToTable}
                  embedded={true}
                />
              </>
            )}
          </div>
        )}

        {/* Performance Insights (Only for Admin) */}
        {viewMode === 'table' && user?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Performance Insights
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View detailed analytics →
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.averageProcessingTime || 0} days
                </div>
                <div className="text-sm text-gray-600">Average Processing Time</div>
                <div className="text-xs text-green-600 mt-1">↓ 0.5 days from last month</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">94%</div>
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
            </div>
          </div>
        )}

        {/* Status Updater Modal */}
        {showStatusUpdater && selectedRequest && (
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

        {/* Help Section */}
        {viewMode === 'table' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Request Processing Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Review all supporting documents before approval</li>
                  <li>• Verify applicant eligibility using the scoring system</li>
                  <li>• Assign requests to appropriate case workers</li>
                  <li>• Process critical and high urgency requests first</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Common Actions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click on any request to view detailed information</li>
                  <li>• Use quick filters to find specific request types</li>
                  <li>• Update request status using the Update Status button</li>
                  <li>• Add internal notes for collaboration with team</li>
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