// src/pages/RequestManagementPage.tsx - ENHANCED WITH USER MODE SUPPORT
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
  PlusIcon,
  HeartIcon
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

// NEW: Props interface for smart component reuse
interface RequestManagementPageProps {
  userMode?: boolean;
  applicantFilter?: string;
  hideAdminActions?: boolean;
  pageTitle?: string;
  showCreateButton?: boolean;
}

const RequestManagementPage: React.FC<RequestManagementPageProps> = ({
  userMode = false,
  applicantFilter = null,
  hideAdminActions = false,
  pageTitle,
  showCreateButton = true
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

  // Filters from URL params
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    search: searchParams.get('search') || ''
  });

  // NEW: Dynamic page configuration based on mode
  const effectivePageTitle = pageTitle || (userMode ? 'My Applications' : 'Request Management');
  const effectiveDescription = userMode 
    ? "Track the status of your assistance applications and view details."
    : "Manage and review assistance requests from applicants.";

  // Permission check - Skip for user mode
  const canManageRequests = userMode || hasAnyRole(['admin', 'case_worker', 'finance_manager']);

  useEffect(() => {
    if (!userMode && !canManageRequests) {
      navigate(ROUTES.DASHBOARD);
      return;
    }
    
    fetchStats();
    setLoading(false);
  }, [canManageRequests, navigate, userMode]);

  useEffect(() => {
    // Update URL params when filters change (admin mode only)
    if (!userMode) {
      const newParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams);
    }
  }, [filters, userMode, setSearchParams]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      
      // In user mode, fetch user-specific stats
      if (userMode && user) {
        const userStats = await requestService.getDashboardStats();
        setStats({
          totalRequests: userStats.statistics?.totalRequests || 0,
          pendingReviews: userStats.statistics?.pendingRequests || 0,
          approvedRequests: userStats.statistics?.approvedRequests || 0,
          rejectedRequests: userStats.statistics?.rejectedRequests || 0,
          criticalRequests: 0, // Not applicable for users
          totalApprovedAmount: userStats.statistics?.totalApproved || 0,
          averageProcessingTime: 0 // Calculate from user's requests
        });
      } else {
        // Admin mode - fetch system-wide stats
        const response: DashboardStatsResponse = await requestService.getDashboardStats();
        setStats({
          totalRequests: response.statistics?.totalRequests || 0,
          pendingReviews: response.statistics?.pendingRequests || 0,
          approvedRequests: response.statistics?.approvedRequests || 0,
          rejectedRequests: response.statistics?.rejectedRequests || 0,
          criticalRequests: response.statistics?.urgentRequests || 0,
          totalApprovedAmount: response.statistics?.totalApproved || 0,
          averageProcessingTime: response.statistics?.avgProcessingTime || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      ErrorHandler.handleError(error, 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRequestSelect = (request: Demande) => {
    setSelectedRequest(request);
    setViewMode('details');
  };

  const handleRequestEdit = (request: Demande) => {
    // User mode: Navigate to read-only view or edit their own request
    if (userMode) {
      navigate(`/my-applications/${request._id}`);
    } else {
      // Admin mode: Full edit capabilities
      navigate(`${ROUTES.ADMIN.REQUESTS}/${request._id}/edit`);
    }
  };

  const handleRequestDelete = async (request: Demande) => {
    // Only allow in admin mode
    if (userMode) return;
    
    try {
      await requestService.deleteRequest(request._id);
      setRefreshTrigger(prev => prev + 1);
      if (selectedRequest?._id === request._id) {
        setViewMode('table');
        setSelectedRequest(null);
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, 'Failed to delete request');
    }
  };

  const handleBulkAction = async (action: string, selectedRequests: Demande[]) => {
    // Only allow in admin mode
    if (userMode) return;
    
    try {
      // Implement bulk actions for admin
      console.log('Bulk action:', action, selectedRequests);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      ErrorHandler.handleError(error, 'Failed to perform bulk action');
    }
  };

  const handleStatusChange = (request: Demande, newStatus: string) => {
    // Only allow in admin mode
    if (userMode) return;
    
    setSelectedRequest({ ...request, status: newStatus as any });
    setShowStatusUpdater(true);
  };

  const handleBackToTable = () => {
    setViewMode('table');
    setSelectedRequest(null);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  // NEW: Render user-friendly stats for user mode
  const renderUserStats = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    const userStatsCards = [
      {
        title: 'Total Applications',
        value: stats?.totalRequests || 0,
        icon: ClipboardDocumentListIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Under Review',
        value: stats?.pendingReviews || 0,
        icon: ClockIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'Approved',
        value: stats?.approvedRequests || 0,
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Total Approved Amount',
        value: `$${(stats?.totalApprovedAmount || 0).toLocaleString()}`,
        icon: CurrencyDollarIcon,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {userStatsCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} overflow-hidden shadow rounded-lg`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className={`text-lg font-medium ${stat.color}`}>
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Existing renderStatsCards function for admin mode
  const renderStatsCards = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    const adminStatsCards = [
      {
        title: 'Total Requests',
        value: stats?.totalRequests || 0,
        icon: ClipboardDocumentListIcon,
        color: 'text-blue-600',
        change: '+12%',
        changeType: 'increase' as const
      },
      {
        title: 'Pending Reviews',
        value: stats?.pendingReviews || 0,
        icon: ClockIcon,
        color: 'text-yellow-600',
        urgent: (stats?.pendingReviews || 0) > 10
      },
      {
        title: 'Approved',
        value: stats?.approvedRequests || 0,
        icon: CheckCircleIcon,
        color: 'text-green-600'
      },
      {
        title: 'Critical Cases',
        value: stats?.criticalRequests || 0,
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        urgent: (stats?.criticalRequests || 0) > 0
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {adminStatsCards.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className={`text-lg font-medium ${stat.color}`}>
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {effectivePageTitle}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              {effectiveDescription}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>

            {/* Create Button - User Mode */}
            {userMode && (
              <button
                type="button"
                onClick={() => navigate('/apply')}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <HeartIcon className="h-5 w-5 mr-2" />
                Apply for New Assistance
              </button>
            )}

            {/* Create Button - Admin Mode */}
            {!userMode && showCreateButton && (
              <button
                type="button"
                onClick={() => navigate('/apply')}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Request
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {userMode ? renderUserStats() : renderStatsCards()}

        {/* Main Content */}
        {viewMode === 'table' ? (
          <RequestTable
            onRequestSelect={handleRequestSelect}
            onRequestEdit={handleRequestEdit}
            onRequestDelete={handleRequestDelete}
            onBulkAction={handleBulkAction}
            onStatusChange={handleStatusChange}
            filters={filters}
            refreshTrigger={refreshTrigger}
            userMode={userMode}
            applicantFilter={applicantFilter}
            hideAdminActions={hideAdminActions}
          />
        ) : (
          <RequestDetails
            request={selectedRequest!}
            onBack={handleBackToTable}
            onEdit={handleRequestEdit}
            onStatusChange={handleStatusChange}
            userMode={userMode}
            hideAdminActions={hideAdminActions}
          />
        )}

        {/* Status Updater Modal */}
        {showStatusUpdater && selectedRequest && !userMode && (
          <StatusUpdater
            request={selectedRequest}
            onClose={() => setShowStatusUpdater(false)}
            onUpdate={() => {
              setRefreshTrigger(prev => prev + 1);
              setShowStatusUpdater(false);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default RequestManagementPage;