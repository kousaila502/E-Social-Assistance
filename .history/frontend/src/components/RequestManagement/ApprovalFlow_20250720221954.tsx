// src/components/RequestManagement/ApprovalFlow.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Demande } from '../../config/apiConfig';
import requestService from '../../services/requestService';
import { useAuth } from '../../hooks/useAuth';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  UserIcon,
  ArrowRightIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface ApprovalStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'skipped' | 'failed';
  required: boolean;
  actor: 'system' | 'case_worker' | 'admin' | 'finance_manager' | 'applicant';
  estimatedDuration: string;
  dependencies?: string[];
  actions?: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    onClick: () => void;
    disabled?: boolean;
  }>;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  metadata?: {
    documentsRequired?: string[];
    documentsUploaded?: string[];
    approvedAmount?: number;
    rejectionReason?: string;
    assignedTo?: string;
    paymentMethod?: string;
  };
}

interface ApprovalFlowProps {
  request: Demande;
  onStatusUpdate?: (updatedRequest: Demande) => void;
  onStepComplete?: (stepId: string, data: any) => void;
  embedded?: boolean;
}

const ApprovalFlow: React.FC<ApprovalFlowProps> = ({
  request,
  onStatusUpdate,
  onStepComplete,
  embedded = false
}) => {
  const { hasRole, hasAnyRole, user } = useAuth();
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Generate approval steps based on request status and user permissions
  const generateApprovalSteps = (): ApprovalStep[] => {
    const steps: ApprovalStep[] = [
      {
        id: 'submission',
        title: 'Application Submitted',
        description: 'Request has been submitted by the applicant',
        status: 'completed',
        required: true,
        actor: 'applicant',
        estimatedDuration: '0 days',
        completedAt: request.createdAt,
        completedBy: request.applicant.name
      },
      {
        id: 'initial_review',
        title: 'Initial Review',
        description: 'Case worker performs initial assessment of eligibility',
        status: getCurrentStepStatus('initial_review'),
        required: true,
        actor: 'case_worker',
        estimatedDuration: '1-2 days',
        dependencies: ['submission'],
        actions: getStepActions('initial_review'),
        completedAt: request.assignedTo ? request.updatedAt : undefined,
        completedBy: request.assignedTo?.name
      },
      {
        id: 'document_verification',
        title: 'Document Verification',
        description: 'Verify all required supporting documents',
        status: getCurrentStepStatus('document_verification'),
        required: true,
        actor: 'case_worker',
        estimatedDuration: '1-3 days',
        dependencies: ['initial_review'],
        actions: getStepActions('document_verification'),
        metadata: {
          documentsRequired: ['ID', 'Income Proof', 'Medical Records'],
          documentsUploaded: ['ID', 'Income Proof'] // Mock data
        }
      },
      {
        id: 'eligibility_assessment',
        title: 'Eligibility Assessment',
        description: 'Assess applicant eligibility using scoring system',
        status: getCurrentStepStatus('eligibility_assessment'),
        required: true,
        actor: 'case_worker',
        estimatedDuration: '1 day',
        dependencies: ['document_verification'],
        actions: getStepActions('eligibility_assessment')
      },
      {
        id: 'amount_determination',
        title: 'Amount Determination',
        description: 'Determine approved assistance amount',
        status: getCurrentStepStatus('amount_determination'),
        required: true,
        actor: 'case_worker',
        estimatedDuration: '1 day',
        dependencies: ['eligibility_assessment'],
        actions: getStepActions('amount_determination'),
        metadata: {
          approvedAmount: request.approvedAmount
        }
      },
      {
        id: 'supervisor_approval',
        title: 'Supervisor Approval',
        description: 'Final approval from administrator',
        status: getCurrentStepStatus('supervisor_approval'),
        required: request.requestedAmount > 1000, // Mock business rule
        actor: 'admin',
        estimatedDuration: '1-2 days',
        dependencies: ['amount_determination'],
        actions: getStepActions('supervisor_approval')
      },
      {
        id: 'payment_processing',
        title: 'Payment Processing',
        description: 'Process approved payment to beneficiary',
        status: getCurrentStepStatus('payment_processing'),
        required: true,
        actor: 'finance_manager',
        estimatedDuration: '3-5 days',
        dependencies: ['supervisor_approval'],
        actions: getStepActions('payment_processing'),
        metadata: {
          paymentMethod: 'bank_transfer'
        }
      }
    ];

    return steps.filter(step => step.required || step.status !== 'skipped');
  };

  const getCurrentStepStatus = (stepId: string): ApprovalStep['status'] => {
    switch (stepId) {
      case 'submission':
        return 'completed';
      case 'initial_review':
        if (request.assignedTo) return 'completed';
        if (request.status === 'submitted') return 'current';
        return 'pending';
      case 'document_verification':
        if (request.status === 'pending_docs') return 'current';
        if (['approved', 'paid', 'partially_paid'].includes(request.status)) return 'completed';
        if (request.status === 'rejected') return 'failed';
        if (request.assignedTo) return 'current';
        return 'pending';
      case 'eligibility_assessment':
        if (['approved', 'paid', 'partially_paid'].includes(request.status)) return 'completed';
        if (request.status === 'rejected') return 'failed';
        if (request.status === 'under_review') return 'current';
        return 'pending';
      case 'amount_determination':
        if (request.approvedAmount) return 'completed';
        if (request.status === 'rejected') return 'failed';
        if (request.status === 'under_review') return 'current';
        return 'pending';
      case 'supervisor_approval':
        if (request.status === 'approved' || request.status === 'paid' || request.status === 'partially_paid') return 'completed';
        if (request.status === 'rejected') return 'failed';
        if (request.approvedAmount && request.requestedAmount > 1000) return 'current';
        return 'pending';
      case 'payment_processing':
        if (request.status === 'paid') return 'completed';
        if (request.status === 'partially_paid') return 'current';
        if (request.status === 'approved') return 'current';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const getStepActions = (stepId: string): ApprovalStep['actions'] => {
    const actions: ApprovalStep['actions'] = [];
    const stepStatus = getCurrentStepStatus(stepId);

    if (stepStatus !== 'current') return actions;

    switch (stepId) {
      case 'initial_review':
        if (hasAnyRole(['admin', 'case_worker'])) {
          actions.push({
            id: 'assign',
            label: 'Assign to Me',
            type: 'primary',
            onClick: () => handleAssignToSelf(),
            disabled: !!request.assignedTo
          });
        }
        break;
      case 'document_verification':
        if (hasAnyRole(['admin', 'case_worker'])) {
          actions.push({
            id: 'request_docs',
            label: 'Request Documents',
            type: 'secondary',
            onClick: () => handleRequestDocuments()
          });
          actions.push({
            id: 'verify_docs',
            label: 'Verify Documents',
            type: 'primary',
            onClick: () => handleVerifyDocuments()
          });
        }
        break;
      case 'eligibility_assessment':
        if (hasAnyRole(['admin', 'case_worker'])) {
          actions.push({
            id: 'assess',
            label: 'Complete Assessment',
            type: 'primary',
            onClick: () => handleEligibilityAssessment()
          });
        }
        break;
      case 'amount_determination':
        if (hasAnyRole(['admin', 'case_worker'])) {
          actions.push({
            id: 'determine_amount',
            label: 'Set Amount',
            type: 'primary',
            onClick: () => handleAmountDetermination()
          });
        }
        break;
      case 'supervisor_approval':
        if (hasRole('admin')) {
          actions.push({
            id: 'approve',
            label: 'Approve',
            type: 'primary',
            onClick: () => handleSupervisorApproval('approve')
          });
          actions.push({
            id: 'reject',
            label: 'Reject',
            type: 'danger',
            onClick: () => handleSupervisorApproval('reject')
          });
        }
        break;
      case 'payment_processing':
        if (hasAnyRole(['admin', 'finance_manager'])) {
          actions.push({
            id: 'process_payment',
            label: 'Process Payment',
            type: 'primary',
            onClick: () => handlePaymentProcessing()
          });
        }
        break;
    }

    return actions;
  };

  const handleAssignToSelf = async () => {
    if (!user) return;
    setLoadingStep('initial_review');
    try {
      await requestService.assign(request._id, user._id);
      toast.success('Request assigned to you');
      if (onStepComplete) onStepComplete('initial_review', { assignedTo: user._id });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign request');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleRequestDocuments = async () => {
    setLoadingStep('document_verification');
    try {
      await requestService.requestDocuments(request._id, {
        requestMessage: 'Please provide additional documentation',
        requiredDocuments: ['Updated Income Proof', 'Medical Certificate']
      });
      toast.success('Document request sent to applicant');
      if (onStepComplete) onStepComplete('document_verification', { documentsRequested: true });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to request documents');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleVerifyDocuments = async () => {
    setLoadingStep('document_verification');
    try {
      // Mock document verification
      toast.success('Documents verified successfully');
      if (onStepComplete) onStepComplete('document_verification', { documentsVerified: true });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to verify documents');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleEligibilityAssessment = async () => {
    setLoadingStep('eligibility_assessment');
    try {
      // Mock eligibility assessment
      toast.success('Eligibility assessment completed');
      if (onStepComplete) onStepComplete('eligibility_assessment', { eligible: true, score: 85 });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to complete assessment');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleAmountDetermination = async () => {
    setLoadingStep('amount_determination');
    try {
      // Mock amount determination
      const approvedAmount = Math.min(request.requestedAmount, request.requestedAmount * 0.8);
      toast.success(`Amount determined: $${approvedAmount.toLocaleString()}`);
      if (onStepComplete) onStepComplete('amount_determination', { approvedAmount });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to determine amount');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleSupervisorApproval = async (decision: 'approve' | 'reject') => {
    setLoadingStep('supervisor_approval');
    try {
      await requestService.review(request._id, {
        decision: decision === 'approve' ? 'approved' : 'rejected',
        reviewNotes: `Supervisor ${decision}al completed`,
        ...(decision === 'approve' && { approvedAmount: request.requestedAmount })
      });
      toast.success(`Request ${decision}d by supervisor`);
      if (onStepComplete) onStepComplete('supervisor_approval', { decision });
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${decision} request`);
    } finally {
      setLoadingStep(null);
    }
  };

  const handlePaymentProcessing = async () => {
    setLoadingStep('payment_processing');
    try {
      // Mock payment processing
      toast.success('Payment processing initiated');
      if (onStepComplete) onStepComplete('payment_processing', { paymentInitiated: true });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process payment');
    } finally {
      setLoadingStep(null);
    }
  };

  const getStepIcon = (step: ApprovalStep) => {
    const iconClass = "h-5 w-5";
    
    switch (step.status) {
      case 'completed':
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case 'current':
        return <ClockIcon className={`${iconClass} text-blue-600`} />;
      case 'failed':
        return <XCircleIcon className={`${iconClass} text-red-600`} />;
      case 'skipped':
        return <ArrowRightIcon className={`${iconClass} text-gray-400`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStepBorderColor = (step: ApprovalStep): string => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'current':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'skipped':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const formatDuration = (startDate: string, endDate?: string): string => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffHours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
  };

  const steps = generateApprovalSteps();
  const currentStepIndex = steps.findIndex(step => step.status === 'current');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.filter(step => step.required).length;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Approval Progress</h3>
          <div className="text-sm text-gray-600">
            {completedSteps} of {totalSteps} steps completed
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-600">
          {currentStepIndex >= 0 && (
            <>
              Current: <span className="font-medium">{steps[currentStepIndex]?.title}</span>
            </>
          )}
        </div>
      </div>

      {/* Approval Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg transition-all duration-200 ${getStepBorderColor(step)} ${
              step.status === 'current' ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Step Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStepIcon(step)}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                        step.status === 'current' ? 'bg-blue-100 text-blue-800' :
                        step.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    
                    {/* Step Metadata */}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Actor: {step.actor.replace('_', ' ')}</span>
                      <span>Duration: {step.estimatedDuration}</span>
                      {step.completedAt && (
                        <span>
                          Completed: {formatDuration(request.createdAt, step.completedAt)} ago
                        </span>
                      )}
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedStep === step.id && step.metadata && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border">
                        {step.metadata.documentsRequired && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-700">Required Documents:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {step.metadata.documentsRequired.map((doc, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                                  <PaperClipIcon className="h-3 w-3 mr-1" />
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {step.metadata.approvedAmount && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                              <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                              Approved: ${step.metadata.approvedAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Step Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {step.metadata && (
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  {step.actions?.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      disabled={action.disabled || loadingStep === step.id}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        action.type === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                        action.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                        'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {loadingStep === step.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1" />
                          Loading...
                        </div>
                      ) : (
                        action.label
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Summary */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Workflow Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="font-medium text-gray-700">Total Steps</div>
            <div className="text-lg font-bold text-gray-900">{totalSteps}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Completed</div>
            <div className="text-lg font-bold text-green-600">{completedSteps}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Remaining</div>
            <div className="text-lg font-bold text-blue-600">{totalSteps - completedSteps}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Progress</div>
            <div className="text-lg font-bold text-gray-900">{Math.round((completedSteps / totalSteps) * 100)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalFlow;