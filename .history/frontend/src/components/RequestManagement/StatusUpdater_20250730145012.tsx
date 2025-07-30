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
// Mock budget pools - in real app, this would come from API
const mockBudgetPools = [
  { id: '1', name: 'Emergency Medical Fund', availableAmount: 50000 },
  { id: '2', name: 'Education Support Pool', availableAmount: 30000 },
  { id: '3', name: 'Housing Assistance Fund', availableAmount: 75000 },
  { id: '4', name: 'General Assistance Pool', availableAmount: 100000 }
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const hasReviewRole = hasAnyRole(['admin', 'case_worker']);
  const isReviewableStatus = ['submitted', 'under_review', 'pending_docs'].includes(request.status);
  const canReview = hasReviewRole && isReviewableStatus;
  const canChangeStatus = hasAnyRole(['admin', 'case_worker']);

  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
    formState: { errors: reviewErrors },
    watch: watchReview,
    setValue: setReviewValue
  } = useForm<ReviewFormData>();

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

  const handleStatusChange = async (newStatus: string) => {
    if (!canChangeStatus) {
      ErrorHandler.showError('You do not have permission to change request status.', 'Access Denied');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the appropriate service method based on status
      if (newStatus === 'cancelled') {
        await requestService.cancel(request._id, { reason: 'Status changed by administrator' });
      } else {
        // For all other statuses, use the update endpoint
        await requestService.update(request._id, { status: newStatus });
      }

      ErrorHandler.showSuccess('Status updated successfully!');

      // Refresh the request data
      const updatedRequest = await requestService.getById(request._id);
      onStatusUpdate(updatedRequest.demande);

      if (onClose) onClose();
    } catch (error: any) {
      ErrorHandler.showError(error, 'Status Update Failed');
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

  const canPerformActions = canReview || canChangeStatus;

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
    <div className="bg-white rounded-lg max-w-4xl mx-auto">
      {/* Header with Close Button */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Update Request Status</h2>
          <p className="text-sm text-gray-600 mt-1">
            Request: {request.title}
          </p>
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

      {/* Direct Status Options - No Tabs */}
      <div className="px-6 py-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Status
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(REQUEST_STATUS_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={request.status === key || isSubmitting}
                  className={`p-4 text-left border-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${request.status === key
                    ? 'border-gray-300 bg-gray-100'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
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

          {/* Close Button at Bottom */}
          {onClose && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusUpdater;