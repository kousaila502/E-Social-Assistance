import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { 
    XMarkIcon, 
    CheckIcon, 
    ChevronUpDownIcon,
    BanknotesIcon,
    CreditCardIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

import paymentService, { 
    CreatePaymentData, 
    BankDetails, 
    CheckDetails 
} from '../../services/paymentService';
import { Demande, BudgetPool } from '../../config/apiConfig';

interface CreatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingPayment?: any; // Payment object when editing
    availableDemandes?: Demande[]; // Pre-approved demandes
    availableBudgetPools?: BudgetPool[]; // Available budget pools
}

interface FormData {
    demandeId: string;
    amount: number;
    paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'mobile_payment' | 'card' | 'other';
    budgetPoolId: string;
    scheduledDate: string;
    internalNotes: string;
    recipientNotes: string;
    bankDetails: BankDetails;
    checkDetails: CheckDetails;
}

const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: BanknotesIcon },
    { value: 'check', label: 'Check', icon: DocumentTextIcon },
    { value: 'cash', label: 'Cash', icon: BanknotesIcon },
    { value: 'mobile_payment', label: 'Mobile Payment', icon: CreditCardIcon },
    { value: 'card', label: 'Card Payment', icon: CreditCardIcon },
    { value: 'other', label: 'Other', icon: DocumentTextIcon }
];

const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingPayment,
    availableDemandes = [],
    availableBudgetPools = []
}) => {
    const [loading, setLoading] = useState(false);
    const [demandes, setDemandes] = useState<Demande[]>(availableDemandes);
    const [budgetPools, setBudgetPools] = useState<BudgetPool[]>(availableBudgetPools);
    const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
    const [calculatedFees, setCalculatedFees] = useState({ processingFee: 0, bankFee: 0, totalFees: 0 });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState<FormData>({
        demandeId: '',
        amount: 0,
        paymentMethod: 'bank_transfer',
        budgetPoolId: '',
        scheduledDate: '',
        internalNotes: '',
        recipientNotes: '',
        bankDetails: {
            accountNumber: '',
            bankName: '',
            branchCode: '',
            routingNumber: '',
            accountHolderName: ''
        },
        checkDetails: {
            checkNumber: '',
            issuedDate: '',
            bankName: '',
            memo: ''
        }
    });

    const isEditing = !!editingPayment;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                // Populate form with existing payment data
                setFormData({
                    demandeId: editingPayment.demande._id || editingPayment.demande,
                    amount: editingPayment.amount,
                    paymentMethod: editingPayment.paymentMethod,
                    budgetPoolId: editingPayment.budgetPool?._id || editingPayment.budgetPool || '',
                    scheduledDate: editingPayment.scheduledDate ? 
                        new Date(editingPayment.scheduledDate).toISOString().split('T')[0] : '',
                    internalNotes: editingPayment.internalNotes || '',
                    recipientNotes: editingPayment.recipientNotes || '',
                    bankDetails: editingPayment.bankDetails || {
                        accountNumber: '', bankName: '', branchCode: '', routingNumber: '', accountHolderName: ''
                    },
                    checkDetails: editingPayment.checkDetails || {
                        checkNumber: '', issuedDate: '', bankName: '', memo: ''
                    }
                });
            } else {
                resetForm();
            }
            
            // Load data if not provided
            if (demandes.length === 0) {
                fetchApprovedDemandes();
            }
            if (budgetPools.length === 0) {
                fetchBudgetPools();
            }
        }
    }, [isOpen, isEditing, editingPayment]);

    // Calculate fees when amount or payment method changes
    useEffect(() => {
        if (formData.amount > 0 && formData.paymentMethod) {
            const fees = paymentService.calculateTotalFees(formData.amount, formData.paymentMethod);
            setCalculatedFees(fees);
        }
    }, [formData.amount, formData.paymentMethod]);

    // Update selected demande when demandeId changes
    useEffect(() => {
        if (formData.demandeId) {
            const demande = demandes.find(d => d._id === formData.demandeId);
            setSelectedDemande(demande || null);
            
            // Auto-set amount to approved amount if creating new payment
            if (!isEditing && demande?.approvedAmount) {
                setFormData(prev => ({ ...prev, amount: demande.approvedAmount || 0 }));
            }
        }
    }, [formData.demandeId, demandes, isEditing]);

    const resetForm = () => {
        setFormData({
            demandeId: '',
            amount: 0,
            paymentMethod: 'bank_transfer',
            budgetPoolId: '',
            scheduledDate: '',
            internalNotes: '',
            recipientNotes: '',
            bankDetails: {
                accountNumber: '', bankName: '', branchCode: '', routingNumber: '', accountHolderName: ''
            },
            checkDetails: {
                checkNumber: '', issuedDate: '', bankName: '', memo: ''
            }
        });
        setSelectedDemande(null);
        setCalculatedFees({ processingFee: 0, bankFee: 0, totalFees: 0 });
        setValidationErrors([]);
    };

    const fetchApprovedDemandes = async () => {
        try {
            // This would typically fetch from your demande service
            // For now, we'll use the provided demandes
            console.log('Would fetch approved demandes from API');
        } catch (error) {
            console.error('Error fetching demandes:', error);
        }
    };

    const fetchBudgetPools = async () => {
        try {
            // This would typically fetch from your budget pool service
            // For now, we'll use the provided budget pools
            console.log('Would fetch budget pools from API');
        } catch (error) {
            console.error('Error fetching budget pools:', error);
        }
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear validation errors when user starts typing
        if (validationErrors.length > 0) {
            setValidationErrors([]);
        }
    };

    const handleBankDetailsChange = (field: keyof BankDetails, value: string) => {
        setFormData(prev => ({
            ...prev,
            bankDetails: {
                ...prev.bankDetails,
                [field]: value
            }
        }));
    };

    const handleCheckDetailsChange = (field: keyof CheckDetails, value: string) => {
        setFormData(prev => ({
            ...prev,
            checkDetails: {
                ...prev.checkDetails,
                [field]: value
            }
        }));
    };

    const validateForm = (): boolean => {
        const errors = paymentService.validatePaymentData(formData);
        
        // Additional validations
        if (selectedDemande && formData.amount > (selectedDemande.approvedAmount || 0)) {
            errors.push(`Payment amount cannot exceed approved amount (${paymentService.formatAmount(selectedDemande.approvedAmount || 0)})`);
        }

        if (formData.scheduledDate) {
            const scheduledDate = new Date(formData.scheduledDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (scheduledDate < today) {
                errors.push('Scheduled date cannot be in the past');
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        try {
            setLoading(true);

            const submitData: CreatePaymentData = {
                demandeId: formData.demandeId,
                amount: formData.amount,
                paymentMethod: formData.paymentMethod,
                budgetPoolId: formData.budgetPoolId || undefined,
                scheduledDate: formData.scheduledDate || undefined,
                internalNotes: formData.internalNotes || undefined,
                recipientNotes: formData.recipientNotes || undefined
            };

            // Add method-specific details
            if (formData.paymentMethod === 'bank_transfer' && formData.bankDetails.accountNumber) {
                submitData.bankDetails = formData.bankDetails;
            }

            if (formData.paymentMethod === 'check' && formData.checkDetails.checkNumber) {
                submitData.checkDetails = formData.checkDetails;
            }

            if (isEditing) {
                await paymentService.update(editingPayment._id, submitData);
                toast.success('Payment updated successfully');
            } else {
                await paymentService.create(submitData);
                toast.success('Payment created successfully');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} payment`);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {isEditing ? 'Edit Payment' : 'Create New Payment'}
                                    </Dialog.Title>
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
                                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                                        <div className="flex">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
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

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Request Selection */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Request *
                                            </label>
                                            <Listbox 
                                                value={formData.demandeId} 
                                                onChange={(value) => handleInputChange('demandeId', value)}
                                                disabled={isEditing} // Don't allow changing request when editing
                                            >
                                                <div className="relative">
                                                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                                        <span className="block truncate">
                                                            {selectedDemande ? 
                                                                `${selectedDemande.title} - ${paymentService.formatAmount(selectedDemande.approvedAmount || 0)}` 
                                                                : 'Select a request'
                                                            }
                                                        </span>
                                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                                        </span>
                                                    </Listbox.Button>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                            {demandes.map((demande) => (
                                                                <Listbox.Option
                                                                    key={demande._id}
                                                                    value={demande._id}
                                                                    className={({ active }) =>
                                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                            active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                                                                        }`
                                                                    }
                                                                >
                                                                    {({ selected }) => (
                                                                        <>
                                                                            <div>
                                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                                    {demande.title}
                                                                                </span>
                                                                                <span className="text-sm text-gray-500">
                                                                                    Approved: {paymentService.formatAmount(demande.approvedAmount || 0)}
                                                                                </span>
                                                                            </div>
                                                                            {selected && (
                                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                                                                    <CheckIcon className="h-5 w-5" />
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Listbox.Option>
                                                            ))}
                                                        </Listbox.Options>
                                                    </Transition>
                                                </div>
                                            </Listbox>
                                        </div>

                                        {/* Payment Amount */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Amount (DZD) *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.amount}
                                                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="0.00"
                                                required
                                            />
                                            {selectedDemande && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Max: {paymentService.formatAmount(selectedDemande.approvedAmount || 0)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Payment Method */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Method *
                                            </label>
                                            <select
                                                value={formData.paymentMethod}
                                                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                required
                                            >
                                                {paymentMethods.map((method) => (
                                                    <option key={method.value} value={method.value}>
                                                        {method.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Budget Pool */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Budget Pool (Optional)
                                            </label>
                                            <select
                                                value={formData.budgetPoolId}
                                                onChange={(e) => handleInputChange('budgetPoolId', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="">Select budget pool</option>
                                                {budgetPools.map((pool) => (
                                                    <option key={pool._id} value={pool._id}>
                                                        {pool.name} - {paymentService.formatAmount(pool.remainingAmount || 0)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Scheduled Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Scheduled Date (Optional)
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.scheduledDate}
                                                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>

                                    {/* Bank Details (for bank transfer) */}
                                    {formData.paymentMethod === 'bank_transfer' && (
                                        <div className="border-t pt-6">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">Bank Transfer Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Account Number *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bankDetails.accountNumber}
                                                        onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="1234567890"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bank Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bankDetails.bankName}
                                                        onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="Bank name"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Account Holder Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bankDetails.accountHolderName}
                                                        onChange={(e) => handleBankDetailsChange('accountHolderName', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="Full name"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Branch Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bankDetails.branchCode}
                                                        onChange={(e) => handleBankDetailsChange('branchCode', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="Branch code"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Check Details (for check payment) */}
                                    {formData.paymentMethod === 'check' && (
                                        <div className="border-t pt-6">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">Check Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Check Number *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.checkDetails.checkNumber}
                                                        onChange={(e) => handleCheckDetailsChange('checkNumber', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="Check number"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bank Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.checkDetails.bankName}
                                                        onChange={(e) => handleCheckDetailsChange('bankName', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="Bank name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Issue Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.checkDetails.issuedDate}
                                                        onChange={(e) => handleCheckDetailsChange('issuedDate', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Memo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.checkDetails.memo}
                                                        onChange={(e) => handleCheckDetailsChange('memo', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                        placeholder="Memo"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fee Calculation Display */}
                                    {formData.amount > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                            <div className="flex items-start">
                                                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                                                <div className="ml-3">
                                                    <h4 className="text-sm font-medium text-blue-800">Fee Breakdown</h4>
                                                    <div className="mt-2 text-sm text-blue-700">
                                                        <div className="flex justify-between">
                                                            <span>Payment Amount:</span>
                                                            <span>{paymentService.formatAmount(formData.amount)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Processing Fee:</span>
                                                            <span>{paymentService.formatAmount(calculatedFees.processingFee)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Bank Fee:</span>
                                                            <span>{paymentService.formatAmount(calculatedFees.bankFee)}</span>
                                                        </div>
                                                        <div className="flex justify-between font-medium border-t border-blue-200 pt-1 mt-1">
                                                            <span>Net Amount:</span>
                                                            <span>{paymentService.formatAmount(formData.amount - calculatedFees.totalFees)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Internal Notes
                                            </label>
                                            <textarea
                                                value={formData.internalNotes}
                                                onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                                                rows={3}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Internal notes for staff..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Recipient Notes
                                            </label>
                                            <textarea
                                                value={formData.recipientNotes}
                                                onChange={(e) => handleInputChange('recipientNotes', e.target.value)}
                                                rows={3}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Notes visible to recipient..."
                                            />
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex justify-end space-x-3 pt-6 border-t">
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
                                            disabled={loading || !formData.demandeId || !formData.amount}
                                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    {isEditing ? 'Updating...' : 'Creating...'}
                                                </div>
                                            ) : (
                                                isEditing ? 'Update Payment' : 'Create Payment'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CreatePaymentModal;