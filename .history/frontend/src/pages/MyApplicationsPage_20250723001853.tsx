// src/pages/MyApplicationsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import requestService, { Demande, DemandeQueryParams } from '../services/requestService';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';

interface FilterState {
  status: string;
  category: string;
  search: string;
  sortBy: 'createdAt' | 'updatedAt' | 'requestedAmount';
  sortOrder: 'asc' | 'desc';
}

const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [applications, setApplications] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDemandes: 0
  });
  
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    category: '',
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle success message from location state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state to prevent message from showing again on refresh
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Fetch applications
  const fetchApplications = async (page: number = 1) => {
    try {
      setLoading(page === 1);
      setError(null);
      
      const queryParams: DemandeQueryParams = {
        page,
        limit: 10,
        applicant: user?._id, // Filter by current user
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await requestService.getAll(queryParams);
      setApplications(response.demandes);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchApplications();
  }, [filters, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchApplications(pagination.currentPage);
    setRefreshing(false);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number) => {
    fetchApplications(page);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: {
        icon: DocumentTextIcon,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: 'Draft',
        description: 'Application not yet submitted'
      },
      submitted: {
        icon: ClockIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Submitted',
        description: 'Awaiting initial review'
      },
      under_review: {
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        label: 'Under Review',
        description: 'Being evaluated by our team'
      },
      pending_docs: {
        icon: DocumentPlusIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'Documents Needed',
        description: 'Additional documents required'
      },
      approved: {
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Approved',
        description: 'Application approved, processing payment'
      },
      partially_paid: {
        icon: CurrencyDollarIcon,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        label: 'Partially Paid',
        description: 'Partial payment processed'
      },
      paid: {
        icon: CheckCircleIcon,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        label: 'Completed',
        description: 'Payment completed successfully'
      },
      rejected: {
        icon: XCircleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Not Approved',
        description: 'Application was not approved'
      },
      cancelled: {
        icon: XCircleIcon,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: 'Cancelled',
        description: 'Application was cancelled'
      },
      expired: {
        icon: ClockIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Expired',
        description: 'Application expired'
      }
    };
    
    return configs[status as keyof typeof configs] || configs.submitted;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      routine: 'text-gray-600',
      important: 'text-blue-600',
      urgent: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[urgency as keyof typeof colors] || 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getNextStepMessage = (application: Demande) => {
    switch (application.status) {
      case 'draft':
        return 'Complete and submit your application';
      case 'submitted':
        return 'We\'ll review your application within 3-5 business days';
      case 'under_review':
        return 'Our team is evaluating your application';
      case 'pending_docs':
        return 'Please upload the requested documents';
      case 'approved':
        return 'Payment is being processed';
      case 'partially_paid':
        return 'Remaining payment will be processed soon';
      case 'paid':
        return 'Your application is complete';
      case 'rejected':
        return 'You can appeal this decision or apply for other services';
      case 'cancelled':
        return 'You can submit a new application anytime';
      case 'expired':
        return 'You can submit a new application';
      default:
        return 'Check back for updates';
    }
  };

  const renderApplicationCard = (application: Demande) => {
    const statusConfig = getStatusConfig(application.status);
    const StatusIcon = statusConfig.icon;
    const nextStep = getNextStepMessage(application);
    
    return (
      <div key={application._id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {application.title}
              </h3>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <span>#{application.requestNumber || application._id.slice(-6)}</span>
                <span className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(application.updatedAt)}
                </span>
                <span className={`capitalize ${getUrgencyColor(application.urgencyLevel)}`}>
                  {application.urgencyLevel}
                </span>
              </div>
            </div>
            
            <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusConfig.label}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {application.description}
          </p>

          {/* Amount and Category */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Requested
                </span>
                <p className="text-lg font-semibold text-gray-900">
                  ${application.requestedAmount.toLocaleString()}
                </p>
              </div>
              
              {application.approvedAmount && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Approved
                  </span>
                  <p className="text-lg font-semibold text-green-600">
                    ${application.approvedAmount.toLocaleString()}
                  </p>
                </div>
              )}
              
              {application.paidAmount && application.paidAmount > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Received
                  </span>
                  <p className="text-lg font-semibold text-emerald-600">
                    ${application.paidAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Category
              </span>
              <p className="text-sm text-gray-900 capitalize">
                {requestService.getCategoryLabel(application.category)}
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Next Steps</p>
                <p className="text-sm text-blue-800">{nextStep}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/applications/${application._id}`)}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                View Details
              </button>
              
              {(application.status === 'under_review' || application.status === 'pending_docs') && (
                <button
                  onClick={() => navigate(`/applications/${application._id}/messages`)}
                  className="flex items-center text-gray-600 hover:text-gray-700 text-sm font-medium"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Messages
                </button>
              )}
              
              {application.status === 'draft' && (
                <button
                  onClick={() => navigate(`/apply/${application._id}`)}
                  className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  Continue
                </button>
              )}
            </div>
            
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = () => (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-6 transition-all duration-200 ${showFilters ? 'block' : 'hidden'}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="pending_docs">Documents Needed</option>
            <option value="approved">Approved</option>
            <option value="paid">Completed</option>
            <option value="rejected">Not Approved</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="emergency_assistance">Emergency Assistance</option>
            <option value="housing_support">Housing Support</option>
            <option value="medical_assistance">Medical Assistance</option>
            <option value="educational_support">Educational Support</option>
            <option value="food_assistance">Food Assistance</option>
            <option value="employment_support">Employment Support</option>
            <option value="elderly_care">Elderly Care</option>
            <option value="disability_support">Disability Support</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="requestedAmount">Amount</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {filters.search || filters.status || filters.category 
          ? 'No applications found' 
          : 'No applications yet'
        }
      </h3>
      <p className="text-gray-600 mb-6">
        {filters.search || filters.status || filters.category
          ? 'Try adjusting your filters to see more results.'
          : 'When you apply for assistance, your applications will appear here.'
        }
      </p>
      <button
        onClick={() => navigate('/apply')}
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Apply for Assistance
      </button>
    </div>
  );

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-8">
        <p className="text-sm text-gray-700">
          Showing applications {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalDemandes)} of {pagination.totalDemandes}
        </p>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  pagination.currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your applications...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-2">
                Track the status of your assistance applications and view their progress.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => navigate('/apply')}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Application
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-colors duration-200 ${
                  showFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {renderFilters()}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Applications List */}
          {applications.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-6">
              {applications.map(renderApplicationCard)}
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MyApplicationsPage;