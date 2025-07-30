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

export default StatusUpdater;