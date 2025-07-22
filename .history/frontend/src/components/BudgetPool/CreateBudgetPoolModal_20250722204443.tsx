// src/components/BudgetPool/CreateBudgetPoolModal.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import budgetService from '../../services/budgetService';
import { ErrorHandler } from '../../utils/errorHandler';
import { BudgetPool, CreateBudgetPoolData, BudgetAlertThresholds } from '../../config/apiConfig';
import {
    XMarkIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    CogIcon,
    BanknotesIcon,
    ShieldCheckIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface CreateBudgetPoolModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (budgetPool: BudgetPool) => void;
    editingBudgetPool?: BudgetPool | null;
}

// Input Field Component
const InputField: React.FC<{
    label: string;
    name: string;
    type?: string;
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    maxLength?: number;
    min?: number;
    step?: string;
    errors: Record<string, string>;
    icon?: React.ComponentType<any>;
    description?: string;
}> = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
    rows,
    maxLength,
    min,
    step,
    errors,
    icon: Icon,
    description
}) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center">
                    {Icon && <Icon className="h-4 w-4 mr-2 text-blue-600" />}
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </div>
            </label>
            {rows ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    maxLength={maxLength}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    step={step}
                    maxLength={maxLength}
                    className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                />
            )}
            {errors[name] && (
                <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{errors[name]}</span>
                </div>
            )}
            {description && (
                <p className="text-xs text-gray-500">{description}</p>
            )}
            {maxLength && typeof value === 'string' && (
                <div className="text-xs text-gray-500 text-right">
                    {value.length}/{maxLength}
                </div>
            )}
        </div>
    );

// Select Field Component
const SelectField: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    errors: Record<string, string>;
    icon?: React.ComponentType<any>;
    description?: string;
}> = ({ label, name, value, onChange, options, required, errors, icon: Icon, description }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center">
                {Icon && <Icon className="h-4 w-4 mr-2 text-blue-600" />}
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </div>
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
        >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        {errors[name] && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{errors[name]}</span>
            </div>
        )}
        {description && (
            <p className="text-xs text-gray-500">{description}</p>
        )}
    </div>
);

const CreateBudgetPoolModal: React.FC<CreateBudgetPoolModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingBudgetPool
}) => {
    const [formData, setFormData] = useState<CreateBudgetPoolData>({
        name: '',
        description: '',
        department: '',
        fiscalYear: new Date().getFullYear(),
        totalAmount: 0,
        fundingSource: 'government',
        budgetPeriod: {
            startDate: '',
            endDate: ''
        },
        allocationRules: {
            maxAmountPerRequest: 0,        // Change from maxAllocationPerRequest
            requiresApproval: true,
            autoApprovalLimit: 0,          // Change from approvalThreshold  
            // Remove autoApproveBelow - not in interface
        },
        alertThresholds: {
            lowBalanceWarning: 20,  // Change from lowBalance
            criticalBalanceAlert: 10  // Change from criticalBalance
            Property 'expirationWarning' is missing in type '{ lowBalanceWarning: number; criticalBalanceAlert: number; }' but required in type 'BudgetAlertThresholds'.ts(2741)
apiConfig.ts(445, 3): 'expirationWarning' is declared here.
(property) CreateBudgetPoolData.alertThresholds?: BudgetAlertThresholds | undefined
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentStep, setCurrentStep] = useState(1);

    const isEditing = !!editingBudgetPool;

    // Initialize form with editing data
    useEffect(() => {
        if (editingBudgetPool) {
            setFormData({
                name: editingBudgetPool.name,
                description: editingBudgetPool.description,
                department: editingBudgetPool.department,
                fiscalYear: editingBudgetPool.fiscalYear,
                totalAmount: editingBudgetPool.totalAmount,
                fundingSource: editingBudgetPool.fundingSource,
                budgetPeriod: {
                    startDate: editingBudgetPool.budgetPeriod.startDate
                        ? new Date(editingBudgetPool.budgetPeriod.startDate).toISOString().slice(0, 10)
                        : '',
                    endDate: editingBudgetPool.budgetPeriod.endDate
                        ? new Date(editingBudgetPool.budgetPeriod.endDate).toISOString().slice(0, 10)
                        : ''
                },
                allocationRules: editingBudgetPool.allocationRules || {
                    maxAllocationPerRequest: 0,
                    requiresApproval: true,
                    approvalThreshold: 0,
                    autoApproveBelow: 0
                },
                alertThresholds: editingBudgetPool.alertThresholds || {
                    lowBalance: 20,
                    criticalBalance: 10
                }
            });
        }
    }, [editingBudgetPool]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                name: '',
                description: '',
                department: '',
                fiscalYear: new Date().getFullYear(),
                totalAmount: 0,
                fundingSource: 'government',
                budgetPeriod: {
                    startDate: '',
                    endDate: ''
                },
                allocationRules: {
                    maxAllocationPerRequest: 0,
                    requiresApproval: true,
                    approvalThreshold: 0,
                    autoApproveBelow: 0
                },
                alertThresholds: {
                    lowBalance: 20,
                    criticalBalance: 10
                }
            });
            setErrors({});
            setCurrentStep(1);
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Basic Information Validation
        if (!formData.name?.trim()) newErrors.name = 'Budget pool name is required';
        if (!formData.description?.trim()) newErrors.description = 'Description is required';
        if (!formData.department?.trim()) newErrors.department = 'Department is required';
        if (!formData.fiscalYear || formData.fiscalYear < 2020) newErrors.fiscalYear = 'Valid fiscal year is required';
        if (!formData.totalAmount || formData.totalAmount <= 0) newErrors.totalAmount = 'Total amount must be greater than 0';
        if (!formData.fundingSource) newErrors.fundingSource = 'Funding source is required';

        // Budget Period Validation
        if (!formData.budgetPeriod.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.budgetPeriod.endDate) newErrors.endDate = 'End date is required';

        if (formData.budgetPeriod.startDate && formData.budgetPeriod.endDate) {
            const startDate = new Date(formData.budgetPeriod.startDate);
            const endDate = new Date(formData.budgetPeriod.endDate);

            if (endDate <= startDate) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        // Allocation Rules Validation
        if (formData.allocationRules.maxAllocationPerRequest <= 0) {
            newErrors.maxAllocationPerRequest = 'Max allocation per request must be greater than 0';
        }

        if (formData.allocationRules.maxAllocationPerRequest > formData.totalAmount) {
            newErrors.maxAllocationPerRequest = 'Max allocation cannot exceed total amount';
        }

        if (formData.allocationRules.approvalThreshold <= 0) {
            newErrors.approvalThreshold = 'Approval threshold must be greater than 0';
        }

        if (formData.allocationRules.autoApproveBelow >= formData.allocationRules.approvalThreshold) {
            newErrors.autoApproveBelow = 'Auto-approve threshold must be less than approval threshold';
        }

        // Alert Thresholds Validation
        if (formData.alertThresholds.lowBalance <= 0 || formData.alertThresholds.lowBalance > 100) {
            newErrors.lowBalance = 'Low balance threshold must be between 1 and 100';
        }

        if (formData.alertThresholds.criticalBalance <= 0 || formData.alertThresholds.criticalBalance > 100) {
            newErrors.criticalBalance = 'Critical balance threshold must be between 1 and 100';
        }

        if (formData.alertThresholds.criticalBalance >= formData.alertThresholds.lowBalance) {
            newErrors.criticalBalance = 'Critical threshold must be less than low balance threshold';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            ErrorHandler.showError('Please fix the validation errors before submitting.');
            return;
        }

        setLoading(true);
        try {
            let savedBudgetPool: BudgetPool;

            if (isEditing && editingBudgetPool) {
                savedBudgetPool = await budgetService.update(editingBudgetPool._id, formData);
                ErrorHandler.showSuccess('Budget pool updated successfully');
            } else {
                savedBudgetPool = await budgetService.create(formData);
                ErrorHandler.showSuccess('Budget pool created successfully');
            }

            onSuccess?.(savedBudgetPool);
            onClose();
        } catch (error: any) {
            console.error('Error saving budget pool:', error);
            ErrorHandler.showError(error, `Failed to ${isEditing ? 'update' : 'create'} budget pool`);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Basic Information', icon: DocumentTextIcon },
        { number: 2, title: 'Budget Period', icon: CalendarIcon },
        { number: 3, title: 'Allocation Rules', icon: CogIcon },
        { number: 4, title: 'Alert Settings', icon: ShieldCheckIcon }
    ];

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {isEditing ? 'Edit Budget Pool' : 'Create New Budget Pool'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isEditing ? 'Update budget pool settings and allocations' : 'Set up a new budget pool for fund management'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.number
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-gray-300 text-gray-400'
                                    }`}>
                                    <step.icon className="h-5 w-5" />
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                                        }`}>
                                        {step.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 mx-4 h-1 rounded ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Basic Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                    <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Basic Information
                                </h4>

                                <div className="grid grid-cols-1 gap-6">
                                    <InputField
                                        label="Budget Pool Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={(value) => setFormData(prev => ({ ...prev, name: value as string }))}
                                        placeholder="Enter budget pool name"
                                        required
                                        maxLength={100}
                                        errors={errors}
                                        icon={CurrencyDollarIcon}
                                        description="A clear, descriptive name for this budget pool"
                                    />

                                    <InputField
                                        label="Description"
                                        name="description"
                                        value={formData.description}
                                        onChange={(value) => setFormData(prev => ({ ...prev, description: value as string }))}
                                        placeholder="Describe the purpose and scope of this budget pool"
                                        required
                                        rows={3}
                                        maxLength={500}
                                        errors={errors}
                                        icon={DocumentTextIcon}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Department"
                                            name="department"
                                            value={formData.department}
                                            onChange={(value) => setFormData(prev => ({ ...prev, department: value as string }))}
                                            placeholder="Enter department name"
                                            required
                                            maxLength={100}
                                            errors={errors}
                                            icon={BuildingOfficeIcon}
                                        />

                                        <InputField
                                            label="Fiscal Year"
                                            name="fiscalYear"
                                            type="number"
                                            value={formData.fiscalYear}
                                            onChange={(value) => setFormData(prev => ({ ...prev, fiscalYear: value as number }))}
                                            placeholder="2024"
                                            required
                                            min={2020}
                                            errors={errors}
                                            icon={CalendarIcon}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Total Amount"
                                            name="totalAmount"
                                            type="number"
                                            value={formData.totalAmount}
                                            onChange={(value) => setFormData(prev => ({ ...prev, totalAmount: value as number }))}
                                            placeholder="0.00"
                                            required
                                            min={0.01}
                                            step="0.01"
                                            errors={errors}
                                            icon={BanknotesIcon}
                                            description="Total budget allocated to this pool"
                                        />

                                        <SelectField
                                            label="Funding Source"
                                            name="fundingSource"
                                            value={formData.fundingSource}
                                            onChange={(value) => setFormData(prev => ({ ...prev, fundingSource: value as any }))}
                                            options={[
                                                { value: 'government', label: 'Government' },
                                                { value: 'donations', label: 'Donations' },
                                                { value: 'grants', label: 'Grants' },
                                                { value: 'internal', label: 'Internal' },
                                                { value: 'international', label: 'International' },
                                                { value: 'other', label: 'Other' }
                                            ]}
                                            required
                                            errors={errors}
                                            icon={BanknotesIcon}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Budget Period */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                    <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Budget Period
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        label="Start Date"
                                        name="startDate"
                                        type="date"
                                        value={formData.budgetPeriod.startDate}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            budgetPeriod: { ...prev.budgetPeriod, startDate: value as string }
                                        }))}
                                        required
                                        errors={errors}
                                        icon={CalendarIcon}
                                        description="When this budget pool becomes active"
                                    />

                                    <InputField
                                        label="End Date"
                                        name="endDate"
                                        type="date"
                                        value={formData.budgetPeriod.endDate}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            budgetPeriod: { ...prev.budgetPeriod, endDate: value as string }
                                        }))}
                                        required
                                        errors={errors}
                                        icon={CalendarIcon}
                                        description="When this budget pool expires"
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h5 className="text-sm font-medium text-blue-900 mb-2">Budget Period Guidelines</h5>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Choose dates that align with your fiscal year</li>
                                        <li>• Budget pools automatically expire at the end date</li>
                                        <li>• Consider leaving buffer time for final allocations</li>
                                        <li>• End date must be after start date</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Allocation Rules */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                    <CogIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Allocation Rules
                                </h4>

                                <div className="grid grid-cols-1 gap-6">
                                    <InputField
                                        label="Maximum Allocation Per Request"
                                        name="maxAllocationPerRequest"
                                        type="number"
                                        value={formData.allocationRules.maxAllocationPerRequest}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            allocationRules: { ...prev.allocationRules, maxAllocationPerRequest: value as number }
                                        }))}
                                        placeholder="0.00"
                                        required
                                        min={0.01}
                                        step="0.01"
                                        errors={errors}
                                        icon={CurrencyDollarIcon}
                                        description="Maximum amount that can be allocated in a single request"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Approval Threshold"
                                            name="approvalThreshold"
                                            type="number"
                                            value={formData.allocationRules.approvalThreshold}
                                            onChange={(value) => setFormData(prev => ({
                                                ...prev,
                                                allocationRules: { ...prev.allocationRules, approvalThreshold: value as number }
                                            }))}
                                            placeholder="0.00"
                                            required
                                            min={0.01}
                                            step="0.01"
                                            errors={errors}
                                            icon={ShieldCheckIcon}
                                            description="Requests above this amount require approval"
                                        />

                                        <InputField
                                            label="Auto-Approve Below"
                                            name="autoApproveBelow"
                                            type="number"
                                            value={formData.allocationRules.autoApproveBelow}
                                            onChange={(value) => setFormData(prev => ({
                                                ...prev,
                                                allocationRules: { ...prev.allocationRules, autoApproveBelow: value as number }
                                            }))}
                                            placeholder="0.00"
                                            min={0}
                                            step="0.01"
                                            errors={errors}
                                            icon={CurrencyDollarIcon}
                                            description="Requests below this amount are auto-approved"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.allocationRules.requiresApproval}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                allocationRules: { ...prev.allocationRules, requiresApproval: e.target.checked }
                                            }))}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-3 text-sm text-gray-700">
                                            Require approval for allocations above threshold
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Alert Settings */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Alert Thresholds
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        label="Low Balance Alert (%)"
                                        name="lowBalanceWarning"  // Change from lowBalance
                                        type="number"
                                        value={formData.alertThresholds.lowBalanceWarning}  // Change property
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            alertThresholds: { ...prev.alertThresholds, lowBalanceWarning: value as number }  // Change property
                                        }))}
                                        placeholder="20"
                                        required
                                        min={1}
                                        max={100}
                                        errors={errors}
                                        icon={ExclamationTriangleIcon}
                                        description="Alert when balance falls below this percentage"
                                    />

                                    <InputField
                                        label="Critical Balance Alert (%)"
                                        name="criticalBalance"
                                        type="number"
                                        value={formData.alertThresholds.criticalBalance}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            alertThresholds: { ...prev.alertThresholds, criticalBalance: value as number }
                                        }))}
                                        placeholder="10"
                                        required
                                        min={1}
                                        max={100}
                                        errors={errors}
                                        icon={ExclamationTriangleIcon}
                                        description="Critical alert when balance falls below this percentage"
                                    />
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h5 className="text-sm font-medium text-yellow-900 mb-2">Alert Settings Guidelines</h5>
                                    <ul className="text-sm text-yellow-800 space-y-1">
                                        <li>• Critical threshold should be lower than low balance threshold</li>
                                        <li>• Alerts help prevent budget pool depletion</li>
                                        <li>• Set appropriate levels based on spending patterns</li>
                                        <li>• Administrators will receive email notifications</li>
                                    </ul>
                                </div>

                                {/* Preview Summary */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h5 className="text-sm font-medium text-gray-900 mb-3">Budget Pool Summary</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Name:</span>
                                            <span className="ml-2 font-medium">{formData.name || 'Not specified'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Department:</span>
                                            <span className="ml-2 font-medium">{formData.department || 'Not specified'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Total Amount:</span>
                                            <span className="ml-2 font-medium">{budgetService.formatCurrency(formData.totalAmount)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Max Per Request:</span>
                                            <span className="ml-2 font-medium">{budgetService.formatCurrency(formData.allocationRules.maxAllocationPerRequest)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                            <div className="flex space-x-3">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>

                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <div className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                                                <span>{isEditing ? 'Update Budget Pool' : 'Create Budget Pool'}</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateBudgetPoolModal;