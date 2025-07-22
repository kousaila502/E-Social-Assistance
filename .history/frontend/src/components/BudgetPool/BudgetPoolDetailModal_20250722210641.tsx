// src/components/BudgetPool/BudgetPoolDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { BudgetPool, BudgetAllocation, BudgetTransfer } from '../../config/apiConfig';
import { useAuth } from '../../hooks/useAuth';
import budgetService from '../../services/budgetService';
import { ErrorHandler } from '../../utils/errorHandler';
import {
    XMarkIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    BanknotesIcon,
    UserIcon,
    TagIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface BudgetPoolDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    budgetPool: BudgetPool | null;
    onEdit?: (budgetPool: BudgetPool) => void;
    onAllocate?: (budgetPool: BudgetPool) => void;
}

type TabType = 'overview' | 'allocations' | 'transfers' | 'analytics';

const BudgetPoolDetailModal: React.FC<BudgetPoolDetailModalProps> = ({
    isOpen,
    onClose,
    budgetPool,
    onEdit,
    onAllocate
}) => {
    const { hasAnyRole } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(false);
    const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
    const [transfers, setTransfers] = useState<BudgetTransfer[]>([]);

    // Permissions
    const canEdit = hasAnyRole(['admin', 'finance_manager']);
    const canAllocate = hasAnyRole(['admin', 'finance_manager']);

    // Load detailed data when modal opens
    useEffect(() => {
        if (isOpen && budgetPool) {
            loadDetailedData();
        }
    }, [isOpen, budgetPool]);

    const loadDetailedData = async () => {
        if (!budgetPool) return;

        try {
            setLoading(true);
            // Fetch detailed budget pool data with allocations and transfers
            const detailedData = await budgetService.getById(budgetPool._id);
            setAllocations(detailedData.budgetPool.allocations || []);
            setTransfers(detailedData.budgetPool.transfers || []);
        } catch (error: any) {
            console.error('Error loading detailed data:', error);
            ErrorHandler.showError(error, 'Failed to load detailed budget pool data');
        } finally {
            setLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format percentage
    const formatPercentage = (value: number): string => {
        return `${value.toFixed(1)}%`;
    };

    // Format date
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        const statusStyles = {
            'active': 'bg-green-100 text-green-800',
            'draft': 'bg-gray-100 text-gray-800',
            'frozen': 'bg-yellow-100 text-yellow-800',
            'depleted': 'bg-red-100 text-red-800',
            'expired': 'bg-red-100 text-red-800',
            'cancelled': 'bg-gray-100 text-gray-800',
            'transferred': 'bg-blue-100 text-blue-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Calculate progress
    const getUtilizationProgress = () => {
        if (!budgetPool || budgetPool.totalAmount === 0) return 0;
        return Math.min((budgetPool.spentAmount / budgetPool.totalAmount) * 100, 100);
    };

    const getAvailableProgress = () => {
        if (!budgetPool || budgetPool.totalAmount === 0) return 0;
        return Math.min(((budgetPool.availableAmount || 0) / budgetPool.totalAmount) * 100, 100);
    };

    if (!isOpen || !budgetPool) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
        { id: 'allocations', label: 'Allocations', icon: CurrencyDollarIcon },
        { id: 'transfers', label: 'Transfers', icon: ArrowRightIcon },
        { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
    ];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-lg bg-white">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {budgetPool.name}
                                </h3>
                                <div className="flex items-center space-x-4 mt-1">
                                    <p className="text-sm text-gray-600">
                                        {budgetPool.department} • FY {budgetPool.fiscalYear}
                                    </p>
                                    {getStatusBadge(budgetPool.status)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {canEdit && (
                                <button
                                    onClick={() => onEdit?.(budgetPool)}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    Edit Pool
                                </button>
                            )}
                            {canAllocate && budgetPool.status === 'active' && (
                                <button
                                    onClick={() => onAllocate?.(budgetPool)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Allocate Funds
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <tab.icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Financial Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <BanknotesIcon className="h-8 w-8 text-blue-600 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-900">Total Budget</p>
                                                <p className="text-xl font-bold text-blue-900">
                                                    {formatCurrency(budgetPool.totalAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-green-900">Available</p>
                                                <p className="text-xl font-bold text-green-900">
                                                    {formatCurrency(budgetPool.availableAmount || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-yellow-900">Allocated</p>
                                                <p className="text-xl font-bold text-yellow-900">
                                                    {formatCurrency(budgetPool.allocatedAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-purple-900">Spent</p>
                                                <p className="text-xl font-bold text-purple-900">
                                                    {formatCurrency(budgetPool.spentAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bars */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                                            <span className="text-sm text-gray-500">
                                                {formatPercentage(getUtilizationProgress())}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${getUtilizationProgress()}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Available Funds</span>
                                            <span className="text-sm text-gray-500">
                                                {formatPercentage(getAvailableProgress())}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${getAvailableProgress()}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Basic Information */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Pool Number:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {budgetPool.poolNumber || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Department:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {budgetPool.department}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Funding Source:</span>
                                                <span className="text-sm font-medium text-gray-900 capitalize">
                                                    {budgetPool.fundingSource}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Program Type:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {budgetPool.program.type}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Program ID:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {budgetPool.program.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Budget Period & Status */}
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Period & Status</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Start Date:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatDate(budgetPool.budgetPeriod.startDate)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">End Date:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatDate(budgetPool.budgetPeriod.endDate)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Days Remaining:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {budgetPool.daysUntilExpiration || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Created:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatDate(budgetPool.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Last Updated:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatDate(budgetPool.updatedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h4 className="text-lg font-medium text-gray-900 mb-3">Description</h4>
                                    <p className="text-sm text-gray-700">{budgetPool.description}</p>
                                </div>

                                {/* Allocation Rules */}
                                {budgetPool.allocationRules && (
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Allocation Rules</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-600">Max Per Request:</span>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(budgetPool.allocationRules.maxAmountPerRequest || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Auto-Approval Limit:</span>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(budgetPool.allocationRules.autoApprovalLimit || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Requires Approval:</span>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {budgetPool.allocationRules.requiresApproval ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Alert Thresholds */}
                                {budgetPool.alertThresholds && (
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Alert Thresholds</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-600">Low Balance Warning:</span>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {budgetPool.alertThresholds.lowBalanceWarning}%
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Critical Balance Alert:</span>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {budgetPool.alertThresholds.criticalBalanceAlert}%
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Expiration Warning:</span>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {budgetPool.alertThresholds.expirationWarning} days
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Allocations Tab */}
                        {activeTab === 'allocations' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium text-gray-900">Budget Allocations</h4>
                                    <span className="text-sm text-gray-500">
                                        {allocations.length} total allocations
                                    </span>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : allocations.length > 0 ? (
                                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Request
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Amount
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {allocations.map((allocation, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {typeof allocation.demande === 'string' 
                                                                ? allocation.demande 
                                                                : allocation.demande.title || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatCurrency(allocation.amount)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getStatusBadge(allocation.status)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(allocation.allocatedAt)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No allocations</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No funds have been allocated from this budget pool yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Transfers Tab */}
                        {activeTab === 'transfers' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-medium text-gray-900">Fund Transfers</h4>
                                    <span className="text-sm text-gray-500">
                                        {transfers.length} total transfers
                                    </span>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : transfers.length > 0 ? (
                                    <div className="space-y-3">
                                        {transfers.map((transfer, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        {transfer.type === 'incoming' ? (
                                                            <ArrowLeftIcon className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <ArrowRightIcon className="h-5 w-5 text-blue-600" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {transfer.type === 'incoming' ? 'Incoming Transfer' : 'Outgoing Transfer'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {transfer.reason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {formatCurrency(transfer.amount)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDate(transfer.transferredAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <ArrowRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No transfers</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No fund transfers have been made for this budget pool.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && (
                            <div className="space-y-6">
                                <h4 className="text-lg font-medium text-gray-900">Budget Analytics</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h5 className="text-md font-medium text-gray-900 mb-4">Utilization Metrics</h5>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Utilization Rate:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatPercentage(budgetPool.utilizationRate || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Remaining Budget:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(budgetPool.remainingAmount || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Reserved Amount:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(budgetPool.reservedAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h5 className="text-md font-medium text-gray-900 mb-4">Activity Summary</h5>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Total Allocations:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {allocations.length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Total Transfers:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {transfers.length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Days Active:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {Math.ceil((new Date().getTime() - new Date(budgetPool.createdAt).getTime()) / (1000 * 3600 * 24))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h5 className="text-sm font-medium text-blue-900 mb-2">Performance Insights</h5>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Budget pool is {budgetPool.utilizationRate && budgetPool.utilizationRate > 75 ? 'highly utilized' : 'moderately utilized'}</li>
                                        <li>• {budgetPool.daysUntilExpiration && budgetPool.daysUntilExpiration < 30 ? 'Expires soon - consider renewal' : 'Sufficient time remaining'}</li>
                                        <li>• {allocations.length} allocations processed to date</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetPoolDetailModal;