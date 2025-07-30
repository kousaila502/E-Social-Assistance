// src/components/RequestManagement/StatusUpdater.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Demande } from '../../config/apiConfig';
import requestService, { ReviewDemandeData } from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import { REQUEST_STATUS_CONFIG, STATUS_TRANSITIONS } from '../../utils/constants';
import { ErrorHandler } from '../../utils/errorHandler';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ArrowRightIcon,
  PaperAirplaneIcon
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

interface CancelFormData {
  reason: string;
}

// Mock budget pools - replace with real API call
const mockBudgetPools = [
  { id: '1', name: 'Emergency Medical Fund', availableAmount: 50000 },
  { id: '2', name: 'Education Support Pool', availableAmount: 30000 },
  { id: '3', name: 'Housing Assistance Fund', availableAmount: 75000 },
  { id: '4', name: 'General Assistance Pool', availableAmount: 100000 }
];

const rejectionCategories = [
  { value: 'insufficient_documents', label: 'Insufficient Documentation' },
  { value: 'not_eligible', label: 'Not Eligible for Program' },
  { value: 'insufficient_funds', label: 'Insufficient Funds' },
  { value: 'duplicate_request', label: 'Duplicate Request' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'other', label: 'Other' }
];

const StatusUpdater: React.FC<StatusUpdaterProps> = ({
  request,
  onStatusUpdate,
  onClose
}) => {
  const { hasAnyRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'list' | 'review' | 'cancel' | 'confirm'>('list');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Permissions
  const canReview = hasAnyRole(['admin', 'case_worker']);
  const canChangeStatus = hasAnyRole(['admin', 'case_worker']);

  // Forms
  const reviewForm = useForm<ReviewFormData>();
  const cancelForm = useForm<CancelFormData>();

  const watchDecision = reviewForm.watch('decision');

  // Get valid next statuses based on current status
  const getValidNextStatuses = () => {
    const validStatuses = STATUS_TRANSITIONS[request.status as keyof typeof STATUS_TRANSITIONS] || [];
    return validStatuses;
  };

  // Determine action type for a status
  const getActionType = (status: string): 'review' | 'submit' | 'cancel' | 'simple' => {
    if (status === 'approved' || status === 'rejected') return 'review';
    if (status === 'submitted' && request.status === 'draft') return 'submit';
    if (status === 'cancelled') return 'cancel';
    return 'simple';
  };

  // Handle status selection
  const handleStatusSelect = (status: string) => {
    const actionType = getActionType(status);
    setSelectedStatus(status);

    if (actionType === 'review') {
      setActionType('review');
    } else if (actionType === 'cancel') {
      setActionType('cancel');
    } else {
      setActionType('confirm');
    }
  };

  // Handle review submission (approve/reject)
  const handleReview = async (data: ReviewFormData) => {
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

      const result = await requestService.review(request._id, reviewData);

      // Use the returned demande if available, otherwise fetch fresh
      if (result.demande) {
        onStatusUpdate(result.demande);
      } else {
        const updatedRequest = await requestService.getById(request._id);
        onStatusUpdate(updatedRequest.demande);
      }

      toast.success(`Request ${data.decision} successfully!`);
      onClose?.();
    } catch (error: any) {
      ErrorHandler.showError(error, 'Review Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancellation
  const handleCancel = async (data: CancelFormData) => {
    setIsSubmitting(true);
    try {
      await requestService.cancel(request._id, { reason: data.reason });

      // Always fetch the updated request
      const updatedRequest = await requestService.getById(request._id);
      onStatusUpdate(updatedRequest.demande);

      toast.success('Request cancelled successfully!');
      onClose?.();
    } catch (error: any) {
      ErrorHandler.showError(error, 'Cancel Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle simple status changes
  const handleSimpleStatusChange = async () => {
    setIsSubmitting(true);
    try {
      if (selectedStatus === 'submitted' && request.status === 'draft') {
        await requestService.submit(request._id);
      } else {
        await requestService.update(request._id, { status: selectedStatus });
      }

      // Always fetch the updated request
      const updatedRequest = await requestService.getById(request._id);
      onStatusUpdate(updatedRequest.demande);

      toast.success('Status updated successfully!');
      onClose?.();
    } catch (error: any) {
      ErrorHandler.showError(error, 'Status Update Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = REQUEST_STATUS_CONFIG[status as keyof typeof REQUEST_STATUS_CONFIG];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  if (!canChangeStatus) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to update this request.</p>
      </div>
    );
  }

  const validStatuses = getValidNextStatuses();

  return (
    <div className="bg-white rounded-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Update Request Status</h2>
          <p className="text-sm text-gray-600 mt-1">Request: {request.title}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">Current Status:</span>
          {getStatusBadge(request.status)}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Status List View */}
        {actionType === 'list' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Status Changes</h3>
              {validStatuses.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No status changes available for this request.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {validStatuses.map((status) => {
                    const config = REQUEST_STATUS_CONFIG[status as keyof typeof REQUEST_STATUS_CONFIG];
                    const actionType = getActionType(status);

                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusSelect(status)}
                        disabled={isSubmitting}
                        className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{config?.label}</div>
                              <div className="text-sm text-gray-500">
                                {actionType === 'review' && 'Requires detailed review form'}
                                {actionType === 'submit' && 'Submit for review'}
                                {actionType === 'cancel' && 'Requires cancellation reason'}
                                {actionType === 'simple' && 'Simple status change'}
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.bgColor} ${config?.textColor}`}>
                            {config?.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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

        {/* Review Form (Approve/Reject) */}
        {actionType === 'review' && (
          <form onSubmit={reviewForm.handleSubmit(handleReview)} className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setActionType('list')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to status list
              </button>
            </div>

            {/* Decision Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Review Decision *</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    {...reviewForm.register('decision', { required: 'Please select a decision' })}
                    type="radio"
                    value="approved"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${watchDecision === 'approved' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
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
                    {...reviewForm.register('decision', { required: 'Please select a decision' })}
                    type="radio"
                    value="rejected"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${watchDecision === 'rejected' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
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
              {reviewForm.formState.errors.decision && (
                <p className="mt-1 text-sm text-red-600">{reviewForm.formState.errors.decision.message}</p>
              )}
            </div>

            {/* Approval Fields */}
            {watchDecision === 'approved' && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900">Approval Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved Amount *</label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...reviewForm.register('approvedAmount', {
                          required: 'Approved amount is required',
                          min: { value: 0, message: 'Amount must be positive' },
                          max: { value: request.requestedAmount, message: 'Cannot exceed requested amount' }
                        })}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Requested: {request.requestedAmount?.toLocaleString()} DA</p>
                    {reviewForm.formState.errors.approvedAmount && (
                      <p className="mt-1 text-sm text-red-600">{reviewForm.formState.errors.approvedAmount.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Pool</label>
                    <select
                      {...reviewForm.register('budgetPoolId')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select budget pool (optional)</option>
                      {mockBudgetPools.map((pool) => (
                        <option key={pool.id} value={pool.id}>
                          {pool.name} ({pool.availableAmount.toLocaleString()} DA available)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Fields */}
            {watchDecision === 'rejected' && (
              <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900">Rejection Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Category *</label>
                  <select
                    {...reviewForm.register('rejectionCategory', { required: 'Please select a rejection category' })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select category</option>
                    {rejectionCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {reviewForm.formState.errors.rejectionCategory && (
                    <p className="mt-1 text-sm text-red-600">{reviewForm.formState.errors.rejectionCategory.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Explanation *</label>
                  <textarea
                    {...reviewForm.register('rejectionDescription', {
                      required: 'Please provide rejection details',
                      minLength: { value: 10, message: 'Please provide more details' }
                    })}
                    rows={3}
                    placeholder="Explain why this request is being rejected..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  {reviewForm.formState.errors.rejectionDescription && (
                    <p className="mt-1 text-sm text-red-600">{reviewForm.formState.errors.rejectionDescription.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Review Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes (Internal)</label>
              <textarea
                {...reviewForm.register('reviewNotes')}
                rows={3}
                placeholder="Add any internal notes about this review..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">These notes are only visible to staff members</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActionType('list')}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${watchDecision === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                  watchDecision === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
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

        {/* Cancel Form */}
        {actionType === 'cancel' && (
          <form onSubmit={cancelForm.handleSubmit(handleCancel)} className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setActionType('list')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to status list
              </button>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Request</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason *</label>
                <textarea
                  {...cancelForm.register('reason', { required: 'Please provide a cancellation reason' })}
                  rows={3}
                  placeholder="Explain why this request is being cancelled..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                {cancelForm.formState.errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{cancelForm.formState.errors.reason.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActionType('list')}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </form>
        )}

        {/* Confirmation for Simple Status Changes */}
        {actionType === 'confirm' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setActionType('list')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to status list
              </button>
            </div>

            <div className="text-center py-8">
              <PaperAirplaneIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Status Change</h3>
              <p className="text-gray-600 mb-6">
                Change status from <strong>{REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.label}</strong> to{' '}
                <strong>{REQUEST_STATUS_CONFIG[selectedStatus as keyof typeof REQUEST_STATUS_CONFIG]?.label}</strong>?
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setActionType('list')}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimpleStatusChange}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Change'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusUpdater;