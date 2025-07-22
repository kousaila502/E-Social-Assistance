import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import CreatePaymentModal from '../components/Payment/paymentModal';
import PaymentDetailModal from '../components/Payment/paymentDetail';
import ProcessPaymentModal from '../components/';

import paymentService, {
    Payment,
    PaymentFilters,
    PaymentStatsResponse,
    PaymentStatistics,
    MethodBreakdown,
    RecentPayment
} from '../services/paymentService';

import {
    CreditCardIcon,
    PlusIcon,
    ChartBarIcon,
    CogIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    FunnelIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    BanknotesIcon,
    CalendarIcon,
    UserGroupIcon,
    ClockIcon,
    DocumentTextIcon,
    PlayIcon,
    StopIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'details' | 'stats';

interface PaymentStats {
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
    avgAmount: number;
    totalFees: number;
    methodBreakdown: MethodBreakdown[];
    recentPayments: RecentPayment[];
}

const PaymentManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const { hasRole, user: currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalPayments: 0,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Filters from URL params
    const [filters, setFilters] = useState<PaymentFilters>({
        status: searchParams.get('status') || '',
        paymentMethod: searchParams.get('paymentMethod') || '',
        search: searchParams.get('search') || '',
        page: parseInt(searchParams.get('page') || '1'),
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    // Check permissions
    const isAdmin = hasRole('admin');
    const isFinanceManager = hasRole('finance_manager');
    const canManagePayments = isAdmin || isFinanceManager;

    useEffect(() => {
        if (!canManagePayments) {
            navigate('/dashboard');
            toast.error('Access denied. You do not have permission to manage payments.');
            return;
        }

        fetchStats();
        fetchPayments();
    }, [canManagePayments, navigate, refreshTrigger]);

    // Sync filters with URL params
    useEffect(() => {
        const urlStatus = searchParams.get('status');
        const urlPaymentMethod = searchParams.get('paymentMethod');
        const urlSearch = searchParams.get('search');
        const urlPage = searchParams.get('page');

        const newFilters = {
            ...filters,
            status: urlStatus || '',
            paymentMethod: urlPaymentMethod || '',
            search: urlSearch || '',
            page: parseInt(urlPage || '1')
        };

        setFilters(newFilters);
        fetchPayments(newFilters);
    }, [searchParams]);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const response = await paymentService.getStats();
            setStats({
                totalPayments: response.statistics.totalPayments,
                totalAmount: response.statistics.totalAmount,
                completedPayments: response.statistics.completedPayments,
                pendingPayments: response.statistics.pendingPayments,
                failedPayments: response.statistics.failedPayments,
                avgAmount: response.statistics.avgAmount,
                totalFees: response.statistics.totalFees,
                methodBreakdown: response.methodBreakdown,
                recentPayments: response.recentPayments
            });
        } catch (error: any) {
            console.error('Error fetching payment stats:', error);
            toast.error('Failed to load payment statistics');
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchPayments = async (filterOverrides?: PaymentFilters) => {
        try {
            setLoading(true);
            const currentFilters = filterOverrides || filters;
            const response = await paymentService.getAll(currentFilters);

            setPayments(response.payments);
            // Map the response pagination to our local state structure
            setPagination({
                currentPage: response.pagination.currentPage,
                totalPages: response.pagination.totalPages,
                totalPayments: response.pagination.totalCount, // Map totalCount to totalPayments
                hasNextPage: response.pagination.hasNextPage,
                hasPrevPage: response.pagination.hasPrevPage
            });
        } catch (error: any) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: Partial<PaymentFilters>) => {
        const updatedFilters = { ...filters, ...newFilters, page: 1 };
        setFilters(updatedFilters);

        // Update URL params
        const params = new URLSearchParams();
        if (updatedFilters.status) params.set('status', updatedFilters.status);
        if (updatedFilters.paymentMethod) params.set('paymentMethod', updatedFilters.paymentMethod);
        if (updatedFilters.search) params.set('search', updatedFilters.search);
        if (updatedFilters.page && updatedFilters.page > 1) params.set('page', updatedFilters.page.toString());

        setSearchParams(params);
    };

    const handlePageChange = (page: number) => {
        const newFilters = { ...filters, page };
        setFilters(newFilters);

        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        toast.success('Data refreshed');
    };

    const handleViewPayment = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowDetailModal(true);
    };

    const handleEditPayment = (payment: Payment) => {
        setEditingPayment(payment);
        setShowCreateModal(true);
    };

    const handleProcessPayment = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowProcessModal(true);
    };

    const handleCancelPayment = async (payment: Payment) => {
        if (!window.confirm('Are you sure you want to cancel this payment?')) return;

        try {
            const reason = prompt('Please provide a reason for cancellation:');
            if (!reason) return;

            await paymentService.cancel(payment._id, { reason });
            toast.success('Payment cancelled successfully');
            handleRefresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel payment');
        }
    };

    const handleRetryPayment = async (payment: Payment) => {
        if (!window.confirm('Are you sure you want to retry this payment?')) return;

        try {
            await paymentService.retry(payment._id);
            toast.success('Payment retry initiated');
            handleRefresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to retry payment');
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'processing': 'bg-blue-100 text-blue-800',
            'completed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'cancelled': 'bg-gray-100 text-gray-800',
            'refunded': 'bg-purple-100 text-purple-800',
            'on_hold': 'bg-orange-100 text-orange-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const getMethodBadge = (method: string) => {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                {paymentService.getPaymentMethodName(method)}
            </span>
        );
    };

    const renderStatsCards = () => {
        if (statsLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                            <div className="p-5">
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <BanknotesIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats?.totalPayments || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ChartBarIcon className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {paymentService.formatAmount(stats?.totalAmount || 0)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats?.completedPayments || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                                    <dd className="text-lg font-medium text-gray-900">{stats?.pendingPayments || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFilters = () => (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange({ status: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="on_hold">On Hold</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                        value={filters.paymentMethod || ''}
                        onChange={(e) => handleFilterChange({ paymentMethod: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">All Methods</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="check">Check</option>
                        <option value="cash">Cash</option>
                        <option value="mobile_payment">Mobile Payment</option>
                        <option value="card">Card</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                        type="text"
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                        placeholder="Payment number, transaction ID..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={() => handleFilterChange({ status: '', paymentMethod: '', search: '' })}
                        className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Payment Management
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage financial transactions and payment processing
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                        <button
                            onClick={handleRefresh}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <ArrowPathIcon className="h-4 w-4 mr-2" />
                            Refresh
                        </button>

                        {canManagePayments && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create Payment
                            </button>
                        )}
                    </div>
                </div>

                {/* View Mode Tabs */}
                <div className="mb-6">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        {[
                            { id: 'table', name: 'Payments Table', icon: DocumentTextIcon },
                            { id: 'stats', name: 'Statistics', icon: ChartBarIcon }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setViewMode(tab.id as ViewMode)}
                                className={`${viewMode === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                <tab.icon className="h-5 w-5 mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Statistics Cards */}
                {renderStatsCards()}

                {viewMode === 'table' && (
                    <>
                        {/* Filters */}
                        {renderFilters()}

                        {/* Payments Table */}
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <div className="px-4 py-3 border-b border-gray-200 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Payments ({pagination.totalPayments})
                                </h3>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-500">Loading payments...</p>
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Get started by creating a new payment.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Payment
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Recipient
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Method
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {payments.map((payment) => (
                                                <tr key={payment._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {payment.paymentNumber}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {typeof payment.demande === 'object' && payment.demande.title}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {typeof payment.recipient === 'object' && payment.recipient.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {typeof payment.recipient === 'object' && payment.recipient.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {paymentService.formatAmount(payment.amount)}
                                                        </div>
                                                        {payment.fees.totalFees > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                Fees: {paymentService.formatAmount(payment.fees.totalFees)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getMethodBadge(payment.paymentMethod)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(payment.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(payment.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleViewPayment(payment)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </button>

                                                            {canManagePayments && (
                                                                <>
                                                                    {paymentService.canProcess(payment) && (
                                                                        <button
                                                                            onClick={() => handleProcessPayment(payment)}
                                                                            className="text-green-600 hover:text-green-900"
                                                                            title="Process Payment"
                                                                        >
                                                                            <PlayIcon className="h-4 w-4" />
                                                                        </button>
                                                                    )}

                                                                    {paymentService.canCancel(payment) && (
                                                                        <button
                                                                            onClick={() => handleCancelPayment(payment)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                            title="Cancel Payment"
                                                                        >
                                                                            <StopIcon className="h-4 w-4" />
                                                                        </button>
                                                                    )}

                                                                    {paymentService.canRetry(payment) && (
                                                                        <button
                                                                            onClick={() => handleRetryPayment(payment)}
                                                                            className="text-blue-600 hover:text-blue-900"
                                                                            title="Retry Payment"
                                                                        >
                                                                            <ArrowPathIcon className="h-4 w-4" />
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => handleEditPayment(payment)}
                                                                        className="text-gray-600 hover:text-gray-900"
                                                                        title="Edit Payment"
                                                                    >
                                                                        <PencilIcon className="h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={!pagination.hasPrevPage}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                                                <span className="font-medium">{pagination.totalPages}</span>
                                                {' '}({pagination.totalPayments} total payments)
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                    disabled={!pagination.hasPrevPage}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                    disabled={!pagination.hasNextPage}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {viewMode === 'stats' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Payment Method Breakdown */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
                            <div className="space-y-3">
                                {stats?.methodBreakdown.map((method) => (
                                    <div key={method._id} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            {paymentService.getPaymentMethodName(method._id)}
                                        </span>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">{method.count}</div>
                                            <div className="text-xs text-gray-500">
                                                {paymentService.formatAmount(method.totalAmount)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Payments */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
                            <div className="space-y-3">
                                {stats?.recentPayments.slice(0, 5).map((payment) => (
                                    <div key={payment._id} className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {payment.recipient.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {payment.demande.title}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {paymentService.formatAmount(payment.amount)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals would go here */}
            {/* TODO: Add CreatePaymentModal, PaymentDetailModal, ProcessPaymentModal */}
        </MainLayout>
    );
};

export default PaymentManagementPage;