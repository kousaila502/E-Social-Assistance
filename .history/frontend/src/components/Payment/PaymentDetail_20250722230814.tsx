import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import {
    XMarkIcon,
    BanknotesIcon,
    CreditCardIcon,
    DocumentTextIcon,
    UserIcon,
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    PaperClipIcon,
    ChatBubbleLeftRightIcon,
    BuildingOffice2Icon,
    ReceiptPercentIcon,
    CurrencyDollarIcon,
    PlayIcon,
    StopIcon,
    InformationCircleIcon,
    EyeIcon,
    DocumentDuplicateIcon,
    PencilIcon
} from '@heroicons/react/24/outline';

import paymentService, { Payment, ProcessPaymentData, CancelPaymentData } from '../../services/paymentService';

interface PaymentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: Payment | null;
    onUpdate?: () => void;
    onEdit?: (payment: Payment) => void;
    canManage?: boolean; // If user can perform actions
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
    isOpen,
    onClose,
    payment,
    onUpdate,
    onEdit,
    canManage = false
}) => {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showProcessForm, setShowProcessForm] = useState(false);
    const [showCancelForm, setShowCancelForm] = useState(false);
    Object literal may only specify known properties, and 'internalNotes' does not exist in type 'CancelPaymentData | (() => CancelPaymentData)'.ts(2353)
        (property) internalNotes: string

    const [cancelData, setCancelData] = useState<CancelPaymentData>({
        reason: '',
        internalNotes: ''
    });

    if (!isOpen || !payment) return null;

    // Helper functions
    const getStatusIcon = (status: string) => {
        const iconClass = "h-5 w-5";
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
            case 'failed':
                return <XCircleIcon className={`${iconClass} text-red-500`} />;
            case 'cancelled':
                return <StopIcon className={`${iconClass} text-gray-500`} />;
            case 'processing':
                return <ClockIcon className={`${iconClass} text-blue-500`} />;
            case 'pending':
                return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />;
            case 'on_hold':
                return <PaperClipIcon className={`${iconClass} text-orange-500`} />;
            case 'refunded':
                return <ArrowPathIcon className={`${iconClass} text-purple-500`} />;
            default:
                return <InformationCircleIcon className={`${iconClass} text-gray-400`} />;
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        const iconClass = "h-5 w-5 text-gray-400";
        switch (method) {
            case 'bank_transfer':
                return <BuildingOffice2Icon className={iconClass} />;
            case 'check':
                return <DocumentTextIcon className={iconClass} />;
            case 'cash':
                return <BanknotesIcon className={iconClass} />;
            case 'mobile_payment':
            case 'card':
                return <CreditCardIcon className={iconClass} />;
            default:
                return <CurrencyDollarIcon className={iconClass} />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRecipientName = () => {
        if (typeof payment.recipient === 'object' && payment.recipient !== null) {
            return payment.recipient.name; // Use the 'name' property from the User interface
        }
        return 'Unknown Recipient';
    };

    const getDemandeTitle = () => {
        if (typeof payment.demande === 'object' && payment.demande !== null) {
            return payment.demande.title || 'Untitled Request';
        }
        return 'Unknown Request';
    };

    const getBudgetPoolName = () => {
        if (typeof payment.budgetPool === 'object' && payment.budgetPool !== null) {
            return payment.budgetPool.name || 'Unnamed Pool';
        }
        return 'No Budget Pool';
    };

    // Action handlers
    const handleProcess = async () => {
        if (!canManage || !paymentService.canProcess(payment)) return;

        setActionLoading('process');
        try {
            await paymentService.process(payment._id, processData);
            toast.success('Payment processed successfully');
            onUpdate?.();
            setShowProcessForm(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to process payment');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!canManage || !paymentService.canCancel(payment)) return;

        setActionLoading('cancel');
        try {
            await paymentService.cancel(payment._id, cancelData);
            toast.success('Payment cancelled successfully');
            onUpdate?.();
            setShowCancelForm(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel payment');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRetry = async () => {
        if (!canManage || !paymentService.canRetry(payment)) return;

        if (!window.confirm('Are you sure you want to retry this payment?')) return;

        setActionLoading('retry');
        try {
            await paymentService.retry(payment._id);
            toast.success('Payment retry initiated successfully');
            onUpdate?.();
        } catch (error: any) {
            toast.error(error.message || 'Failed to retry payment');
        } finally {
            setActionLoading(null);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`${label} copied to clipboard`);
        });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full ${paymentService.getStatusColor(payment.status)}-100`}>
                                            {getPaymentMethodIcon(payment.paymentMethod)}
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                                                Payment #{payment.paymentNumber}
                                            </Dialog.Title>
                                            <div className="flex items-center space-x-2 mt-1">
                                                {getStatusIcon(payment.status)}
                                                <span className={`text-sm font-medium capitalize ${paymentService.getStatusColor(payment.status)}-600`}>
                                                    {payment.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* Action Buttons */}
                                        {canManage && (
                                            <>
                                                {paymentService.canProcess(payment) && (
                                                    <button
                                                        onClick={() => setShowProcessForm(true)}
                                                        disabled={actionLoading !== null}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                                    >
                                                        <PlayIcon className="h-4 w-4 mr-1" />
                                                        Process
                                                    </button>
                                                )}

                                                {paymentService.canCancel(payment) && (
                                                    <button
                                                        onClick={() => setShowCancelForm(true)}
                                                        disabled={actionLoading !== null}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                                    >
                                                        <StopIcon className="h-4 w-4 mr-1" />
                                                        Cancel
                                                    </button>
                                                )}

                                                {paymentService.canRetry(payment) && (
                                                    <button
                                                        onClick={handleRetry}
                                                        disabled={actionLoading !== null}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                                    >
                                                        {actionLoading === 'retry' ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                                        ) : (
                                                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                                                        )}
                                                        Retry
                                                    </button>
                                                )}

                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(payment)}
                                                        disabled={actionLoading !== null}
                                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                                    >
                                                        <PencilIcon className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        <button
                                            onClick={onClose}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Payment Info */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Payment Summary */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-500">Amount</span>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {paymentService.formatAmount(payment.amount, payment.currency)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-500">Net Amount</span>
                                                        <p className="text-lg font-semibold text-gray-900">
                                                            {paymentService.formatAmount(paymentService.getNetAmount(payment), payment.currency)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-500">Payment Method</span>
                                                        <p className="text-sm text-gray-900 capitalize">
                                                            {payment.paymentMethod.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-500">Currency</span>
                                                        <p className="text-sm text-gray-900">{payment.currency}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Request & Recipient Info */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <h4 className="text-lg font-medium text-gray-900 mb-4">Request & Recipient</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-start space-x-3">
                                                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500">Request</span>
                                                            <p className="text-sm text-gray-900">{getDemandeTitle()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start space-x-3">
                                                        <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500">Recipient</span>
                                                            <p className="text-sm text-gray-900">{getRecipientName()}</p>
                                                        </div>
                                                    </div>
                                                    {payment.budgetPool && (
                                                        <div className="flex items-start space-x-3">
                                                            <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Budget Pool</span>
                                                                <p className="text-sm text-gray-900">{getBudgetPoolName()}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Payment Method Details */}
                                            {(payment.bankDetails || payment.checkDetails) && (
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h4>

                                                    {payment.bankDetails && payment.paymentMethod === 'bank_transfer' && (
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-500">Account Number</span>
                                                                    <div className="flex items-center space-x-2">
                                                                        <p className="text-sm text-gray-900 font-mono">
                                                                            {payment.bankDetails.accountNumber}
                                                                        </p>
                                                                        <button
                                                                            onClick={() => copyToClipboard(payment.bankDetails!.accountNumber, 'Account number')}
                                                                            className="text-gray-400 hover:text-gray-600"
                                                                        >
                                                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-500">Bank Name</span>
                                                                    <p className="text-sm text-gray-900">{payment.bankDetails.bankName}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-500">Account Holder</span>
                                                                    <p className="text-sm text-gray-900">{payment.bankDetails.accountHolderName}</p>
                                                                </div>
                                                                {payment.bankDetails.branchCode && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-gray-500">Branch Code</span>
                                                                        <p className="text-sm text-gray-900">{payment.bankDetails.branchCode}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {payment.checkDetails && payment.paymentMethod === 'check' && (
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="text-sm font-medium text-gray-500">Check Number</span>
                                                                    <p className="text-sm text-gray-900 font-mono">{payment.checkDetails.checkNumber}</p>
                                                                </div>
                                                                {payment.checkDetails.bankName && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-gray-500">Bank Name</span>
                                                                        <p className="text-sm text-gray-900">{payment.checkDetails.bankName}</p>
                                                                    </div>
                                                                )}
                                                                {payment.checkDetails.issuedDate && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-gray-500">Issued Date</span>
                                                                        <p className="text-sm text-gray-900">{formatDate(payment.checkDetails.issuedDate)}</p>
                                                                    </div>
                                                                )}
                                                                {payment.checkDetails.memo && (
                                                                    <div>
                                                                        <span className="text-sm font-medium text-gray-500">Memo</span>
                                                                        <p className="text-sm text-gray-900">{payment.checkDetails.memo}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Transaction Info */}
                                            {(payment.transactionId || payment.externalReference) && (
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h4>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {payment.transactionId && (
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Transaction ID</span>
                                                                <div className="flex items-center space-x-2">
                                                                    <p className="text-sm text-gray-900 font-mono">{payment.transactionId}</p>
                                                                    <button
                                                                        onClick={() => copyToClipboard(payment.transactionId!, 'Transaction ID')}
                                                                        className="text-gray-400 hover:text-gray-600"
                                                                    >
                                                                        <DocumentDuplicateIcon className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {payment.externalReference && (
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">External Reference</span>
                                                                <p className="text-sm text-gray-900 font-mono">{payment.externalReference}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {(payment.internalNotes || payment.recipientNotes) && (
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Notes</h4>
                                                    <div className="space-y-4">
                                                        {payment.internalNotes && (
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Internal Notes</span>
                                                                <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                                                                    {payment.internalNotes}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {payment.recipientNotes && (
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Recipient Notes</span>
                                                                <p className="text-sm text-gray-900 mt-1 p-3 bg-blue-50 rounded-md">
                                                                    {payment.recipientNotes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Error Details */}
                                            {payment.errorDetails && payment.status === 'failed' && (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                    <h4 className="text-lg font-medium text-red-800 mb-4">Error Details</h4>
                                                    <div className="space-y-2">
                                                        {payment.errorDetails.errorCode && (
                                                            <div>
                                                                <span className="text-sm font-medium text-red-700">Error Code</span>
                                                                <p className="text-sm text-red-900 font-mono">{payment.errorDetails.errorCode}</p>
                                                            </div>
                                                        )}
                                                        {payment.errorDetails.errorMessage && (
                                                            <div>
                                                                <span className="text-sm font-medium text-red-700">Error Message</span>
                                                                <p className="text-sm text-red-900">{payment.errorDetails.errorMessage}</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-sm font-medium text-red-700">Retry Count</span>
                                                            <p className="text-sm text-red-900">{payment.errorDetails.retryCount}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sidebar */}
                                        <div className="space-y-6">
                                            {/* Status Timeline */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <h4 className="text-lg font-medium text-gray-900 mb-4">Timeline</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-3">
                                                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-500">Created</span>
                                                            <p className="text-sm text-gray-900">{formatDate(payment.createdAt)}</p>
                                                        </div>
                                                    </div>

                                                    {payment.scheduledDate && (
                                                        <div className="flex items-center space-x-3">
                                                            <ClockIcon className="h-5 w-5 text-gray-400" />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Scheduled</span>
                                                                <p className="text-sm text-gray-900">{formatDate(payment.scheduledDate)}</p>
                                                                {paymentService.isOverdue(payment) && (
                                                                    <p className="text-xs text-red-600">
                                                                        Overdue by {paymentService.getDaysSinceScheduled(payment)} days
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {payment.processedAt && (
                                                        <div className="flex items-center space-x-3">
                                                            <PlayIcon className="h-5 w-5 text-gray-400" />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Processed</span>
                                                                <p className="text-sm text-gray-900">{formatDate(payment.processedAt)}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {payment.completedAt && (
                                                        <div className="flex items-center space-x-3">
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-500">Completed</span>
                                                                <p className="text-sm text-gray-900">{formatDate(payment.completedAt)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Fee Breakdown */}
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <h4 className="text-lg font-medium text-gray-900 mb-4">Fee Breakdown</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Processing Fee</span>
                                                        <span className="text-sm text-gray-900">
                                                            {paymentService.formatAmount(payment.fees?.processingFee || 0, payment.currency)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-500">Bank Fee</span>
                                                        <span className="text-sm text-gray-900">
                                                            {paymentService.formatAmount(payment.fees?.bankFee || 0, payment.currency)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="text-sm font-medium text-gray-900">Total Fees</span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {paymentService.formatAmount(payment.fees?.totalFees || 0, payment.currency)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Documents */}
                                            {payment.documents && payment.documents.length > 0 && (
                                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
                                                    <div className="space-y-2">
                                                        {payment.documents.map((doc, index) => (
                                                            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                                                <PaperClipIcon className="h-4 w-4 text-gray-400" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-gray-900 truncate">{doc.originalName}</p>
                                                                    <p className="text-xs text-gray-500 capitalize">{doc.documentType.replace('_', ' ')}</p>
                                                                </div>
                                                                <button className="text-indigo-600 hover:text-indigo-500">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Process Payment Form */}
                                {showProcessForm && (
                                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Transaction ID *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={processData.transactionId}
                                                    onChange={(e) => setProcessData(prev => ({ ...prev, transactionId: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="Enter transaction ID"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Internal Notes
                                                </label>
                                                <textarea
                                                    value={processData.internalNotes || ''}
                                                    onChange={(e) => setProcessData(prev => ({ ...prev, internalNotes: e.target.value }))}
                                                    rows={3}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="Add processing notes..."
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => setShowProcessForm(false)}
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleProcess}
                                                    disabled={!processData.transactionId || actionLoading === 'process'}
                                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {actionLoading === 'process' ? 'Processing...' : 'Confirm Process'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Cancel Payment Form */}
                                {showCancelForm && (
                                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Cancel Payment</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cancellation Reason *
                                                </label>
                                                <select
                                                    value={cancelData.reason}
                                                    onChange={(e) => setCancelData(prev => ({ ...prev, reason: e.target.value }))}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    required
                                                >
                                                    <option value="">Select reason</option>
                                                    <option value="insufficient_funds">Insufficient Funds</option>
                                                    <option value="duplicate_payment">Duplicate Payment</option>
                                                    <option value="incorrect_amount">Incorrect Amount</option>
                                                    <option value="recipient_request">Recipient Request</option>
                                                    <option value="policy_violation">Policy Violation</option>
                                                    <option value="administrative_error">Administrative Error</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Internal Notes
                                                </label>
                                                <textarea
                                                    value={cancelData.internalNotes || ''}
                                                    onChange={(e) => setCancelData(prev => ({ ...prev, internalNotes: e.target.value }))}
                                                    rows={3}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    placeholder="Add cancellation notes..."
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => setShowCancelForm(false)}
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    disabled={!cancelData.reason || actionLoading === 'cancel'}
                                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {actionLoading === 'cancel' ? 'Cancelling...' : 'Confirm Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default PaymentDetailModal;