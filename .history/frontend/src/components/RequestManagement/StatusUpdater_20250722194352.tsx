// src/components/RequestManagement/StatusUpdater.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Demande } from '../../config/apiConfig';
import requestService, { ReviewDemandeData } from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import { REQUEST_STATUS_CONFIG } from '../../utils/constants';
import { ErrorHandler } from '../../utils/errorHandler';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface StatusUpdaterProps {
  request: Demande;
  onStatusUpdate: (updatedRequest: Demande) => void;
  onClose?: () => void;
}

interface ReviewFormData {
  decision: 'approved' | 'rejected';
  approvedAmount?: number;
  reviewNotes?: string;
  rejectionCategory?: string;
  rejectionDescription?: string;
  budgetPoolId?: string;
}

interface AssignFormData {
  assignedTo: string;
}

// Mock budget pools - in real app, this would come from API
const mockBudgetPools = [
  { id: '1', name: 'Emergency Medical Fund', availableAmount: 50000 },
  { id: '2', name: 'Education Support Pool', availableAmount: 30000 },
  { id: '3', name: 'Housing Assistance Fund', availableAmount: 75000 },
  { id: '4', name: 'General Assistance Pool', availableAmount: 100000 }
];

// Mock case workers - in real app, this would come from API
const mockCaseWorkers = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@agency.com' },
  { id: '2', name: 'Mike Chen', email: 'mike.c@agency.com' },
  { id: '3', name: 'Emily Rodriguez', email: 'emily.r@agency.com' },
  { id: '4', name: 'David Kim', email: 'david.k@agency.com' }
];

const rejectionCategories = [
  { value: 'insufficient_documentation', label: 'Insufficient Documentation' },
  { value: 'ineligible', label: 'Ineligible for Program' },
  { value: 'duplicate_request', label: 'Duplicate Request' },
  { value: 'exceeds_limits', label: 'Exceeds Program Limits' },
  { value: 'incomplete_information', label: 'Incomplete Information' },
  { value: 'other', label: 'Other' }
];

const StatusUpdater: React.FC<StatusUpdaterProps> = ({
  request,
  onStatusUpdate,
  onClose
}) => {
  const { hasAnyRole, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'review' | 'assign' | 'status'>('review');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const hasReviewRole = hasAnyRole(['admin', 'case_worker']);
  const isReviewableStatus = ['submitted', 'under_review', 'pending_docs'].includes(request.status);
  const canReview = hasReviewRole && isReviewableStatus;
  const canAssign = hasRole('admin');
  const canChangeStatus = hasAnyRole(['admin', 'case_worker']);

  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
    formState: { errors: reviewErrors },
    watch: watchReview,
    setValue: setReviewValue
  } = useForm<ReviewFormData>();

  const {
    register: registerAssign,
    handleSubmit: handleAssignSubmit,
    formState: { errors: assignErrors }
  } = useForm<AssignFormData>();

  const watchDecision = watchReview('decision');

  const handleReview = async (data: ReviewFormData) => {
    if (!hasReviewRole) {
      ErrorHandler.showError('You do not have permission to review requests.', 'Access Denied');
      return;
    }

    if (!isReviewableStatus) {
      ErrorHandler.showWarning(`Request must be in 'submitted', 'under review', or 'pending documents' status to be reviewed.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: ReviewDemandeData = {
        decision: data.decision,
        reviewNotes: data.reviewNotes,
        ...(data.decision === 'approved' && {
          approvedAmount: data.approvedAmount,
          budgetPoolId: data.budgetPoolId
        }),
        ...(data.decision === 'rejected' && {
          rejectionCategory: data.rejectionCategory as any,
          rejectionDescription: data.rejectionDescription
        })
      };

      await requestService.review(request._id, reviewData);

      ErrorHandler.showSuccess(`Request ${data.decision} successfully!`);

      // Refresh the request data
      const updatedRequest = await requestService.getById(request._id);
      onStatusUpdate(updatedRequest.demande);

      if (onClose) onClose();
    } catch (error: any) {
      // Use enhanced error handling
      ErrorHandler.showError(error, 'Review Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (data: AssignFormData) => {
    if (!canAssign) {
      toast.error('You do not have permission to assign requests.');
      return;
    }

    setIsSubmitting(true);

    try {
      await requestService.assign(request._id, data.assignedTo);

      const assignedWorker = mockCaseWorkers.find(w => w.id === data.assignedTo);
      const updatedRequest: Demande = {
        ...request,
        assignedTo: assignedWorker ? {
          _id: assignedWorker.id,
          name: assignedWorker.name,
          email: assignedWorker.email,
          phoneNumber: '',
          role: 'case_worker',
          accountStatus: 'active',
          isEmailVerified: true,
          eligibility: {
            status: 'verified',
            score: 100,
            categories: []
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } : undefined
      };

      onStatusUpdate(updatedRequest);
      toast.success('Request assigned successfully!');

      if (onClose) onClose();

    } catch (error: any) {
      console.error('Assignment error:', error);
      toast.error(error?.message || 'Failed to assign request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!canChangeStatus) {
      toast.error('You do not have permission to change request status.');
      return;
    }

    setIsSubmitting(true);

    try {
      // For simple status changes, we can use the update endpoint
      // In a real app, you might have specific endpoints for each status change
      const updatedRequest: Demande = {
        ...request,
        status: newStatus as any
      };

      // Here you would call the appropriate API endpoint
      // For now, we'll simulate the update
      onStatusUpdate(updatedRequest);
      toast.success('Status updated successfully!');

      if (onClose) onClose();

    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error(error?.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
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

  const canPerformActions = canReview || canAssign || canChangeStatus;

  if (!canPerformActions) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to update this request.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Update Request Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              Request: {request.title}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Current Status:</span>
            {getStatusBadge(request.status)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {canReview && (
            <button
              onClick={() => setActiveTab('review')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'review'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <CheckCircleIcon className="h-5 w-5 inline mr-2" />
              Review & Approve
            </button>
          )}
          {canAssign && (
            <button
              onClick={() => setActiveTab('assign')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'assign'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <UserIcon className="h-5 w-5 inline mr-2" />
              Assign Case Worker
            </button>
          )}
          {canChangeStatus && (
            <button
              onClick={() => setActiveTab('status')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <ClockIcon className="h-5 w-5 inline mr-2" />
              Change Status
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {/* Review Tab */}
        {activeTab === 'review' && canReview && (
          <form onSubmit={handleReviewSubmit(handleReview)} className="space-y-6">
            {/* Decision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Review Decision *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    {...registerReview('decision', { required: 'Please select a decision' })}
                    type="radio"
                    value="approved"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${watchDecision === 'approved'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Approve</div>
                        <div className="text-sm text-gray-600">Grant the request</div>
                      </div>
                    </div>
                  </div>
                </label>
                <label className="relative">
                  <input
                    {...registerReview('decision', { required: 'Please select a decision' })}
                    type="radio"
                    value="rejected"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${watchDecision === 'rejected'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="flex items-center">
                      <XCircleIcon className="h-6 w-6 text-red-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Reject</div>
                        <div className="text-sm text-gray-600">Deny the request</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              {reviewErrors.decision && (
                <p className="mt-1 text-sm text-red-600">{reviewErrors.decision.message}</p>
              )}
            </div>

            {/* Approval Fields */}
            {watchDecision === 'approved' && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900">Approval Details</h4>

                {/* Approved Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approved Amount *
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...registerReview('approvedAmount', {
                          required: watchDecision === 'approved' ? 'Approved amount is required' : false,
                          min: { value: 0, message: 'Amount must be positive' },
                          max: {
                            value: request.requestedAmount,
                            message: 'Cannot exceed requested amount'
                          }
                        })}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: ${request.requestedAmount?.toLocaleString()}
                    </p>
                    {reviewErrors.approvedAmount && (
                      <p className="mt-1 text-sm text-red-600">{reviewErrors.approvedAmount.message}</p>
                    )}
                  </div>

                  {/* Budget Pool */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Pool *
                    </label>
                    <select
                      {...registerReview('budgetPoolId', {
                        required: watchDecision === 'approved' ? 'Please select a budget pool' : false
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select budget pool</option>
                      {mockBudgetPools.map((pool) => (
                        <option key={pool.id} value={pool.id}>
                          {pool.name} (${pool.availableAmount.toLocaleString()} available)
                        </option>
                      ))}
                    </select>
                    {reviewErrors.budgetPoolId && (
                      <p className="mt-1 text-sm text-red-600">{reviewErrors.budgetPoolId.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Fields */}
            {watchDecision === 'rejected' && (
              <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900">Rejection Details</h4>

                {/* Rejection Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Category *
                  </label>
                  <select
                    {...registerReview('rejectionCategory', {
                      required: watchDecision === 'rejected' ? 'Please select a rejection category' : false
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select category</option>
                    {rejectionCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {reviewErrors.rejectionCategory && (
                    <p className="mt-1 text-sm text-red-600">{reviewErrors.rejectionCategory.message}</p>
                  )}
                </div>

                {/* Rejection Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Explanation *
                  </label>
                  <textarea
                    {...registerReview('rejectionDescription', {
                      required: watchDecision === 'rejected' ? 'Please provide rejection details' : false,
                      minLength: { value: 10, message: 'Please provide more details' }
                    })}
                    rows={3}
                    placeholder="Explain why this request is being rejected..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  {reviewErrors.rejectionDescription && (
                    <p className="mt-1 text-sm text-red-600">{reviewErrors.rejectionDescription.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Review Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Notes (Internal)
              </label>
              <textarea
                {...registerReview('reviewNotes')}
                rows={3}
                placeholder="Add any internal notes about this review..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes are only visible to staff members
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${watchDecision === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : watchDecision === 'rejected'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `${watchDecision === 'approved' ? 'Approve' : watchDecision === 'rejected' ? 'Reject' : 'Submit'} Request`
                )}
              </button>
            </div>
          </form>
        )}

        {/* Assign Tab */}
        {activeTab === 'assign' && canAssign && (
          <form onSubmit={handleAssignSubmit(handleAssign)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign to Case Worker *
              </label>

              {/* Current Assignment */}
              {request.assignedTo && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Currently assigned to: <span className="font-medium">{request.assignedTo.name}</span>
                  </p>
                </div>
              )}

              {/* Case Worker Selection */}
              <div className="space-y-3">
                {mockCaseWorkers.map((worker) => (
                  <label key={worker.id} className="relative">
                    <input
                      {...registerAssign('assignedTo', { required: 'Please select a case worker' })}
                      type="radio"
                      value={worker.id}
                      className="sr-only"
                    />
                    <div className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-50">
                      <div className="flex items-center">
                        <UserIcon className="h-6 w-6 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{worker.name}</div>
                          <div className="text-sm text-gray-600">{worker.email}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {assignErrors.assignedTo && (
                <p className="mt-1 text-sm text-red-600">{assignErrors.assignedTo.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </>
                ) : (
                  'Assign Case Worker'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Status Tab */}
        {activeTab === 'status' && canChangeStatus && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Change Status
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(REQUEST_STATUS_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    disabled={request.status === key || isSubmitting}
                    className={`p-4 text-left border-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${request.status === key
                      ? 'border-gray-300 bg-gray-100'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{config.label}</div>
                        {request.status === key && (
                          <div className="text-sm text-gray-500">Current Status</div>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                        {config.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Close Button */}
            {onClose && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusUpdater;