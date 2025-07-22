import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Demande } from '../../config/apiConfig';
import requestService from '../../services/requestService';
import { REQUEST_STATUS_CONFIG, URGENCY_LEVEL_CONFIG, REQUEST_CATEGORIES } from '../../utils/constants';
import {
    XMarkIcon,
    ClipboardDocumentListIcon,
    CalendarIcon,
    UsersIcon,
    MapPinIcon,
    CheckCircleIcon,
    XCircleIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon,
    TagIcon,
    UserGroupIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    BanknotesIcon,
    IdentificationIcon,
    PhoneIcon,
    EnvelopeIcon,
    HomeIcon
} from '@heroicons/react/24/outline';

interface RequestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: Demande | null;
    onEdit?: (request: Demande) => void;
    onUpdate?: () => void;
    canManage?: boolean;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
    isOpen,
    onClose,
    request,
    onEdit,
    onUpdate,
    canManage = false
}) => {
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    if (!isOpen || !request) return null;

    const handleApprove = async () => {
        if (!canManage) return;
        
        setActionLoading('approve');
        try {
            await requestService.review(request._id, {
                decision: 'approved',
                reviewNotes: 'Approved via detail modal',
                approvedAmount: request.requestedAmount
            });
            toast.success('Request approved successfully');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!canManage) return;
        
        const reason = window.prompt('Please provide a reason for rejection:');
        if (!reason) return;

        setActionLoading('reject');
        try {
            await requestService.review(request._id, {
                decision: 'rejected',
                rejectionCategory: 'other',
                rejectionDescription: reason
            });
            toast.success('Request rejected successfully');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!canManage) return;
        
        if (!window.confirm('Are you sure you want to cancel this request? This action cannot be undone.')) {
            return;
        }

        setActionLoading('cancel');
        try {
            await requestService.cancel(request._id, 'Cancelled by administrator');
            toast.success('Request cancelled successfully');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = () => {
        onEdit?.(request);
    };

    const getStatusColor = (status: string) => {
        const config = REQUEST_STATUS_CONFIG[status as keyof typeof REQUEST_STATUS_CONFIG];
        return config ? `${config.bgColor} ${config.textColor}` : 'bg-gray-100 text-gray-800';
    };

    const getUrgencyColor = (urgency: string) => {
        const config = URGENCY_LEVEL_CONFIG[urgency as keyof typeof URGENCY_LEVEL_CONFIG];
        return config ? `${config.bgColor} ${config.textColor}` : 'bg-gray-100 text-gray-800';
    };

    const isUrgent = request.urgencyLevel === 'critical' || request.urgencyLevel === 'high';
    const canApproveReject = canManage && ['submitted', 'under_review'].includes(request.status);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Request Details
                                    </h2>
                                    <div className="flex items-center mt-2 space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.label || request.status}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                                            {URGENCY_LEVEL_CONFIG[request.urgencyLevel as keyof typeof URGENCY_LEVEL_CONFIG]?.label || request.urgencyLevel}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {REQUEST_CATEGORIES[request.category as keyof typeof REQUEST_CATEGORIES] || request.category}
                                        </span>
                                        {isUrgent && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                                Urgent
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {canApproveReject && (
                                    <>
                                        <button
                                            onClick={handleApprove}
                                            disabled={actionLoading === 'approve'}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                        >
                                            {actionLoading === 'approve' ? (
                                                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                            )}
                                            Approve
                                        </button>
                                        
                                        <button
                                            onClick={handleReject}
                                            disabled={actionLoading === 'reject'}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                        >
                                            {actionLoading === 'reject' ? (
                                                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <XCircleIcon className="h-4 w-4 mr-1" />
                                            )}
                                            Reject
                                        </button>
                                    </>
                                )}

                                {canManage && (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <PencilIcon className="h-4 w-4 mr-1" />
                                            Edit
                                        </button>
                                        
                                        <button
                                            onClick={handleCancel}
                                            disabled={actionLoading === 'cancel'}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                                        >
                                            {actionLoading === 'cancel' ? (
                                                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <XCircleIcon className="h-4 w-4 mr-1" />
                                            )}
                                            Cancel
                                        </button>
                                    </>
                                )}
                                
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Request Description */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                                        Request Description
                                    </h3>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {request.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Justification */}
                                {request.justification && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                                            Justification
                                        </h3>
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {request.justification}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Supporting Documents */}
                                {request.supportingDocuments && request.supportingDocuments.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                                            Supporting Documents
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="space-y-2">
                                                {request.supportingDocuments.map((doc, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                                        <div className="flex items-center">
                                                            <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                            <span className="text-sm text-gray-700">{doc}</span>
                                                        </div>
                                                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                                                            View
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Review Notes */}
                                {request.reviewNotes && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                            <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
                                            Review Notes
                                        </h3>
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {request.reviewNotes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Financial Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Financial Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Requested Amount:</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                {request.requestedAmount.toLocaleString()} DA
                                            </span>
                                        </div>
                                        
                                        {request.approvedAmount && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Approved Amount:</span>
                                                <span className="text-lg font-bold text-green-600">
                                                    {request.approvedAmount.toLocaleString()} DA
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Category:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {REQUEST_CATEGORIES[request.category as keyof typeof REQUEST_CATEGORIES] || request.category}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Urgency:</span>
                                            <span className={`text-sm font-medium px-2 py-1 rounded ${getUrgencyColor(request.urgencyLevel)}`}>
                                                {URGENCY_LEVEL_CONFIG[request.urgencyLevel as keyof typeof URGENCY_LEVEL_CONFIG]?.label || request.urgencyLevel}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Submitted:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {request.reviewedAt && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Reviewed:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {new Date(request.reviewedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Applicant Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Applicant Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <IdentificationIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.applicant.personalInfo.firstName} {request.applicant.personalInfo.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ID: {request.applicant.personalInfo.nationalId}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    {request.applicant.personalInfo.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <PhoneIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    {request.applicant.personalInfo.phoneNumber}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <HomeIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    {request.applicant.personalInfo.address}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Age:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {request.applicant.personalInfo.age}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Marital Status:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {request.applicant.personalInfo.maritalStatus}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Dependents:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {request.applicant.personalInfo.numberOfDependents}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Monthly Income:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {request.applicant.financialInfo.monthlyIncome.toLocaleString()} DA
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Employment:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {request.applicant.financialInfo.employmentStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Eligibility Score */}
                                {request.eligibilityScore && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Eligibility Assessment
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Score:</span>
                                                <span className={`text-lg font-bold ${
                                                    request.eligibilityScore.totalScore >= 70 ? 'text-green-600' :
                                                    request.eligibilityScore.totalScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {request.eligibilityScore.totalScore}/100
                                                </span>
                                            </div>
                                            
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${
                                                        request.eligibilityScore.totalScore >= 70 ? 'bg-green-600' :
                                                        request.eligibilityScore.totalScore >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                                                    }`}
                                                    style={{ width: `${request.eligibilityScore.totalScore}%` }}
                                                ></div>
                                            </div>

                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Financial Need:</span>
                                                    <span>{request.eligibilityScore.financialNeedScore}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Priority:</span>
                                                    <span>{request.eligibilityScore.priorityScore}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Documentation:</span>
                                                    <span>{request.eligibilityScore.documentationScore}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Assigned Case Worker */}
                                {request.assignedTo && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Assigned Case Worker
                                        </h3>
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-medium">
                                                    {request.assignedTo.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.assignedTo.name || 'Unknown User'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {request.assignedTo.role || 'Case Worker'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetailModal;