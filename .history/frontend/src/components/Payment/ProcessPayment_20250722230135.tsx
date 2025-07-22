import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import {
    XMarkIcon,
    CheckCircleIcon,
    CreditCardIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    PlayIcon,
    BanknotesIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

import paymentService, { Payment } from '../../services/paymentService';

interface ProcessPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: Payment | null;
    onSuccess?: () => void;
}

interface ProcessFormData {
    transactionId: string;
    completionNotes: string;
}

const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
    isOpen,
    onClose,
    payment,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ProcessFormData>({
        transactionId: '',
        completionNotes: ''
    });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    if (!isOpen || !payment) return null;

    const validateForm = (): boolean => {
        const errors: string[] = [];

        if (!formData.transactionId.trim()) {
            errors.push('Transaction ID is required');
        }

        if (formData.transactionId.length < 3) {
            errors.push('Transaction ID must be at least 3 characters long');
        }

        // Check if payment can be processed
        if (!paymentService.canProcess(payment)) {
            errors.push('This payment cannot be processed at this time');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleInputChange = (field: keyof ProcessFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear validation errors when user starts typing
        if (validationErrors.length > 0) {
            setValidationErrors([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setLoading(true);
        try {
            await paymentService.process(payment._id, {
                transactionId: formData.transactionId,
                completionNotes: formData.completionNotes || undefined
            });

            toast.success('Payment processed successfully');
            onSuccess?.();
            handleClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({ transactionId: '', completionNotes: '' });
            setValidationErrors([]);
            onClose();
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        const iconClass = "h-5 w-5";
        switch (method) {
            case 'bank_transfer':
                return <CreditCardIcon className={iconClass} />;
            case 'check':
                return <DocumentTextIcon className={iconClass} />;
            case 'cash':
                return <BanknotesIcon className={iconClass} />;
            default:
                return <CreditCardIcon className={iconClass} />;
        }
    };

    const getRecipientName = () => {
        if (typeof payment.recipient === 'object' && payment.recipient !== null) {
            return `${payment.recipient.firstName} ${payment.recipient.lastName}`;
        }
        return 'Unknown Recipient';
    };

    const getDemandeTitle = () => {
        if (typeof payment.demande === 'object' && payment.demande !== null) {
            return payment.demande.title || 'Untitled Request';
        }
        return 'Unknown Request';
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 rounded-full bg-green-100">
                                            <PlayIcon className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                                                Process Payment
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500">
                                                Complete payment #{payment.paymentNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        disabled={loading}
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Validation Errors */}
                                {validationErrors.length > 0 && (
                                    <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                                        <div className="flex">
                                            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Please fix the following errors:
                                                </h3>
                                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                                    {validationErrors.map((error, index) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Summary */}
                                <div className="p-6">
                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-start space-x-3">
                                                {getPaymentMethodIcon(payment.paymentMethod)}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {paymentService.formatAmount(payment.amount, payment.currency)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {payment.paymentMethod.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <ClockIcon className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Processing Status
                                                    </p>
                                                    <p className="text-xs text-blue-600 capitalize">
                                                        {payment.status.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-xs text-gray-500">Request: </span>
                                                    <span className="text-sm text-gray-900">{getDemandeTitle()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Recipient: </span>
                                                    <span className="text-sm text-gray-900">{getRecipientName()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Net Amount: </span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {paymentService.formatAmount(paymentService.getNetAmount(payment), payment.currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Process Form */}
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Transaction ID *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.transactionId}
                                                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Enter transaction ID from bank/payment processor"
                                                required
                                                disabled={loading}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                This should be the unique identifier from your payment processor or bank
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Completion Notes (Optional)
                                            </label>
                                            <textarea
                                                value={formData.completionNotes}
                                                onChange={(e) => handleInputChange('completionNotes', e.target.value)}
                                                rows={4}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Add any completion notes, special instructions, or observations..."
                                                disabled={loading}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Internal notes about the payment processing (optional)
                                            </p>
                                        </div>

                                        {/* Important Notice */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                            <div className="flex">
                                                <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                                                <div className="ml-3">
                                                    <h4 className="text-sm font-medium text-blue-800">Important</h4>
                                                    <div className="mt-1 text-sm text-blue-700">
                                                        <ul className="list-disc list-inside space-y-1">
                                                            <li>This will mark the payment as completed and finalize the transaction</li>
                                                            <li>The related request status will be updated to "paid" or "partially paid"</li>
                                                            <li>The recipient will be notified of the payment completion</li>
                                                            <li>This action cannot be undone</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Actions */}
                                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                disabled={loading}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !formData.transactionId.trim()}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                        Complete Payment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ProcessPaymentModal;