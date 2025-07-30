// src/components/RequestManagement/RequestDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Demande } from '../../config/apiConfig';
import requestService from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import StatusUpdater from './StatusUpdater';
import { REQUEST_STATUS_CONFIG, URGENCY_LEVEL_CONFIG, ROUTES } from '../../utils/constants';
import userService from '../../services/userService';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface RequestDetailsProps {
  requestId?: string;
  onBack?: () => void;
  embedded?: boolean; // If true, renders without navigation controls
}


interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  isVerified: boolean;
  verificationNotes?: string;
  uploadedAt: string;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({
  requestId: propRequestId,
  onBack,
  embedded = false
}) => {
  const { id: paramRequestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();

  const requestId = propRequestId || paramRequestId;

  const [request, setRequest] = useState<Demande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusUpdater, setShowStatusUpdater] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'timeline'>('overview');


  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const canManageRequest = hasAnyRole(['admin', 'case_worker']);
  const isOwnRequest = user?._id === (typeof request?.applicant === 'string' ? request?.applicant : request?.applicant?._id); const canViewRequest = canManageRequest || isOwnRequest;

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  useEffect(() => {
    if (request) {
      fetchDocuments();
    }
  }, [request]);

  const fetchRequestDetails = async () => {
    if (!requestId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await requestService.getById(requestId);
      setRequest(response.demande);
    } catch (err: any) {
      console.error('Error fetching request details:', err);
      setError(err?.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!request) return;

    // Get the applicant ID from the request
    const applicantId = typeof request.applicant === 'string'
      ? request.applicant
      : request.applicant?._id;

    if (!applicantId) return;

    setDocumentsLoading(true);
    try {
      const response = await userService.getUserDocuments(applicantId);
      setDocuments(response.documents || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      // Optionally show error toast
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleStatusUpdate = (updatedRequest: Demande) => {
    setRequest(updatedRequest);
    setShowStatusUpdater(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (!embedded) {
      navigate(canManageRequest ? ROUTES.ADMIN.REQUESTS : ROUTES.MY_REQUESTS);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const config = REQUEST_STATUS_CONFIG[status as keyof typeof REQUEST_STATUS_CONFIG];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const config = URGENCY_LEVEL_CONFIG[urgency as keyof typeof URGENCY_LEVEL_CONFIG];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading request details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Request</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchRequestDetails}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Request Not Found</h3>
        <p className="text-gray-600">The requested assistance application could not be found.</p>
      </div>
    );
  }

  if (!canViewRequest) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to view this request.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to {canManageRequest ? 'Requests' : 'My Requests'}
          </button>

          {canManageRequest && (
            <button
              onClick={() => setShowStatusUpdater(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Update Status
            </button>
          )}
        </div>
      )}

      {/* Request Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Social Assistance Request</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Submitted {formatDate(request.createdAt)}
              </span>
              <span className="flex items-center">
                <TagIcon className="h-4 w-4 mr-1" />
                {request.category?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getUrgencyBadge(request.urgencyLevel)}
            {getStatusBadge(request.status)}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm text-blue-600 font-medium">Requested</div>
              <div className="text-lg font-bold text-blue-900">{formatCurrency(request.requestedAmount)}</div>
            </div>
          </div>

          {request.approvedAmount && (
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-green-600 font-medium">Approved</div>
                <div className="text-lg font-bold text-green-900">{formatCurrency(request.approvedAmount)}</div>
              </div>
            </div>
          )}

          {request.paidAmount && (
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-purple-600 font-medium">Paid</div>
                <div className="text-lg font-bold text-purple-900">{formatCurrency(request.paidAmount)}</div>
              </div>
            </div>
          )}

          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <ClockIcon className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600 font-medium">Days Since</div>
              <div className="text-lg font-bold text-gray-900">
                {Math.floor((Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
              { id: 'documents', label: documentsLoading ? 'Documents (...)' : `Documents (${documents.length})`, icon: PaperClipIcon },
              { id: 'timeline', label: 'Timeline', icon: ClockIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Request Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
                </div>
              </div>

              {/* Applicant Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Applicant Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Applicant</div>
                        <div className="font-medium text-gray-900">
                          {typeof request.applicant === 'string' ? 'User ID: ' + request.applicant : request.applicant.name || 'Unknown User'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium text-gray-900">
                          {typeof request.applicant === 'string' ? 'Not Available' : request.applicant.email || 'Not Available'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              {request.assignedTo && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Assigned Case Worker</h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <UserIcon className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-green-900">
                          {typeof request.assignedTo === 'string' ? 'User ID: ' + request.assignedTo : request.assignedTo.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-green-600">
                          {typeof request.assignedTo === 'string' ? 'Not Available' : request.assignedTo.email || 'Not Available'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Supporting Documents</h3>
                {isOwnRequest && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    Upload Documents
                  </button>
                )}
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <PaperClipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <PaperClipIcon className="h-6 w-6 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(doc.size)} • Uploaded {formatDate(doc.uploadedAt)}
                          </div>
                          {doc.verificationNotes && (
                            <div className="text-sm text-yellow-600 mt-1">
                              Note: {doc.verificationNotes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {doc.isVerified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Request Timeline</h3>

              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <DocumentTextIcon className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Request submitted</p>
                            <p className="text-sm text-gray-500">
                              Initial application submitted by {typeof request.applicant === 'string' ? 'User' : request.applicant.name || 'Unknown User'}
                            </p>                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>

                  {request.assignedTo && (
                    <li>
                      <div className="relative pb-8">
                        <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                              <UserIcon className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Assigned to case worker</p>
                              <p className="text-sm text-gray-500">
                                Assigned to {typeof request.assignedTo === 'string' ? 'User' : request.assignedTo.name || 'Unknown User'}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(request.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )}

                  <li>
                    <div className="relative">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${request.status === 'approved' ? 'bg-green-500' :
                            request.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}>
                            {request.status === 'approved' ? (
                              <CheckCircleIcon className="h-4 w-4 text-white" />
                            ) : request.status === 'rejected' ? (
                              <ExclamationTriangleIcon className="h-4 w-4 text-white" />
                            ) : (
                              <ClockIcon className="h-4 w-4 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Status: {REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.label}</p>
                            <p className="text-sm text-gray-500">Current status of the request</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {formatDate(request.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Updater Modal */}
      {showStatusUpdater && canManageRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-full overflow-y-auto">
            <StatusUpdater
              request={request}
              onStatusUpdate={handleStatusUpdate}
              onClose={() => setShowStatusUpdater(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;