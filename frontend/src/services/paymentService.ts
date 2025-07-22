import api, { API_CONFIG, User, PaginationInfo, Demande } from '../config/apiConfig';

// =====================================================
// PAYMENT INTERFACES (BASED ON BACKEND SCHEMA)
// =====================================================

// Bank Details interface
export interface BankDetails {
  accountNumber: string;
  bankName: string;
  branchCode?: string;
  routingNumber?: string;
  accountHolderName: string;
}

// Check Details interface
export interface CheckDetails {
  checkNumber: string;
  issuedDate?: string;
  bankName?: string;
  memo?: string;
}

// Payment Document interface
export interface PaymentDocument {
  _id?: string;
  filename: string;
  originalName: string;
  documentType: 'receipt' | 'invoice' | 'bank_statement' | 'check_copy' | 'proof_of_payment' | 'other';
  uploadedAt: string;
  uploadedBy: string | User;
}

// Error Details interface
export interface ErrorDetails {
  errorCode?: string;
  errorMessage?: string;
  errorDate?: string;
  retryCount: number;
}

// Approval interface
export interface Approval {
  _id?: string;
  approver: string | User;
  decision: 'approved' | 'rejected';
  approvedAt: string;
  comments?: string;
}

// Refund Details interface
export interface RefundDetails {
  refundAmount: number;
  refundReason: string;
  refundedAt?: string;
  refundedBy?: string | User;
  refundMethod?: 'bank_transfer' | 'check' | 'cash' | 'original_method';
}

// Payment Fees interface
export interface PaymentFees {
  processingFee: number;
  bankFee: number;
  totalFees: number;
}

// Budget Pool interface (minimal for payment context)
export interface BudgetPool {
  _id: string;
  name: string;
  poolNumber?: string;
  department: string;
  totalAmount: number;
  remainingAmount?: number;
}

// Main Payment interface
export interface Payment {
  _id: string;
  paymentNumber: string;
  amount: number;
  currency: 'DZD' | 'USD' | 'EUR';
  paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'mobile_payment' | 'card' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'on_hold';
  demande: string | Demande;
  budgetPool: string | BudgetPool;
  recipient: string | User;
  processedBy?: string | User;
  processedAt?: string;
  scheduledDate?: string;
  completedAt?: string;
  bankDetails?: BankDetails;
  checkDetails?: CheckDetails;
  transactionId?: string;
  externalReference?: string;
  documents?: PaymentDocument[];
  errorDetails?: ErrorDetails;
  approvals?: Approval[];
  isFullyApproved: boolean;
  internalNotes?: string;
  recipientNotes?: string;
  refundDetails?: RefundDetails;
  fees: PaymentFees;
  createdBy: string | User;
  updatedBy?: string | User;
  createdAt: string;
  updatedAt: string;
  
  // Virtual fields
  netAmount?: number;
  isOverdue?: boolean;
  daysSinceScheduled?: number;
  processingTime?: number;
}

// =====================================================
// CREATE/UPDATE INTERFACES
// =====================================================

// Create Payment Data interface
export interface CreatePaymentData {
  demandeId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'check' | 'cash' | 'mobile_payment' | 'card' | 'other';
  budgetPoolId?: string;
  bankDetails?: BankDetails;
  checkDetails?: CheckDetails;
  scheduledDate?: string;
  internalNotes?: string;
  recipientNotes?: string;
}

// Update Payment Data interface
export interface UpdatePaymentData {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'on_hold';
  scheduledDate?: string;
  bankDetails?: BankDetails;
  checkDetails?: CheckDetails;
  internalNotes?: string;
  recipientNotes?: string;
  transactionId?: string;
  externalReference?: string;
  errorCode?: string;
  errorMessage?: string;
}

// Process Payment Data interface
export interface ProcessPaymentData {
  transactionId?: string;
  completionNotes?: string;
}

// Cancel Payment Data interface
export interface CancelPaymentData {
  reason: string;
}

// =====================================================
// FILTER AND RESPONSE INTERFACES
// =====================================================

// Payment Filters interface
export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string; // comma-separated values
  paymentMethod?: string; // comma-separated values
  recipient?: string;
  budgetPool?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount' | 'scheduledDate' | 'paymentNumber';
  sortOrder?: 'asc' | 'desc';
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

// Payment Statistics interface
export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  totalFees: number;
  avgAmount: number;
  completedPayments: number;
  failedPayments: number;
  pendingPayments: number;
}

// Method Breakdown interface
export interface MethodBreakdown {
  _id: string;
  count: number;
  totalAmount: number;
}

// Recent Payment interface (for dashboard)
export interface RecentPayment {
  _id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  recipient: {
    name: string;
    email: string;
  };
  demande: {
    title: string;
    requestNumber?: string;
  };
}

// Response interfaces
export interface PaymentResponse {
  message: string;
  payment: Payment;
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: PaginationInfo;
  statistics: PaymentStatistics;
}

export interface PaymentStatsResponse {
  statistics: PaymentStatistics;
  methodBreakdown: MethodBreakdown[];
  recentPayments: RecentPayment[];
}

// =====================================================
// PAYMENT SERVICE
// =====================================================

const paymentService = {
  // Get all payments with pagination and filters
  getAll: async (filters: PaymentFilters = {}): Promise<PaymentsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.recipient) queryParams.append('recipient', filters.recipient);
      if (filters.budgetPool) queryParams.append('budgetPool', filters.budgetPool);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString());
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.scheduledFrom) queryParams.append('scheduledFrom', filters.scheduledFrom);
      if (filters.scheduledTo) queryParams.append('scheduledTo', filters.scheduledTo);

      const url = `${API_CONFIG.ENDPOINTS.PAYMENTS.GET_ALL}?${queryParams.toString()}`;
      const response: PaymentsResponse = await api.get(url);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get payment statistics for dashboard
  getStats: async (): Promise<PaymentStatsResponse> => {
    try {
      const response: PaymentStatsResponse = await api.get(API_CONFIG.ENDPOINTS.PAYMENTS.DASHBOARD_STATS);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get single payment by ID
  getById: async (id: string): Promise<PaymentResponse> => {
    try {
      const response: PaymentResponse = await api.get(API_CONFIG.ENDPOINTS.PAYMENTS.GET_BY_ID(id));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Create new payment
  create: async (data: CreatePaymentData): Promise<PaymentResponse> => {
    try {
      const response: PaymentResponse = await api.post(API_CONFIG.ENDPOINTS.PAYMENTS.CREATE, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Update payment
  update: async (id: string, data: UpdatePaymentData): Promise<PaymentResponse> => {
    try {
      const response: PaymentResponse = await api.patch(API_CONFIG.ENDPOINTS.PAYMENTS.UPDATE(id), data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Process payment (mark as completed)
  process: async (id: string, data: ProcessPaymentData): Promise<PaymentResponse> => {
    try {
      const response: PaymentResponse = await api.post(API_CONFIG.ENDPOINTS.PAYMENTS.PROCESS(id), data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Cancel payment
  cancel: async (id: string, data: CancelPaymentData): Promise<PaymentResponse> => {
    try {
      const response: PaymentResponse = await api.post(API_CONFIG.ENDPOINTS.PAYMENTS.CANCEL(id), data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Retry failed payment
  retry: async (id: string): Promise<PaymentResponse> => {
    try {
      const response: PaymentResponse = await api.post(API_CONFIG.ENDPOINTS.PAYMENTS.RETRY(id));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  // Calculate processing fee based on backend logic
  calculateProcessingFee: (amount: number, paymentMethod: string): number => {
    const feeRates: Record<string, number> = {
      'bank_transfer': 0.005, // 0.5%
      'check': 0,
      'cash': 0,
      'mobile_payment': 0.01, // 1%
      'card': 0.025, // 2.5%
      'other': 0
    };

    const rate = feeRates[paymentMethod] || 0;
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  },

  // Calculate bank fee based on backend logic
  calculateBankFee: (amount: number, paymentMethod: string): number => {
    const fixedFees: Record<string, number> = {
      'bank_transfer': amount > 10000 ? 50 : 25,
      'check': 0,
      'cash': 0,
      'mobile_payment': 10,
      'card': 15,
      'other': 0
    };

    return fixedFees[paymentMethod] || 0;
  },

  // Calculate total fees
  calculateTotalFees: (amount: number, paymentMethod: string): PaymentFees => {
    const processingFee = paymentService.calculateProcessingFee(amount, paymentMethod);
    const bankFee = paymentService.calculateBankFee(amount, paymentMethod);
    
    return {
      processingFee,
      bankFee,
      totalFees: processingFee + bankFee
    };
  },

  // Format payment amount with currency
  formatAmount: (amount: number, currency: string = 'DZD'): string => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  },

  // Get payment status color for UI
  getStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      'pending': 'yellow',
      'processing': 'blue',
      'completed': 'green',
      'failed': 'red',
      'cancelled': 'gray',
      'refunded': 'purple',
      'on_hold': 'orange'
    };

    return colors[status] || 'gray';
  },

  // Get payment method display name
  getPaymentMethodName: (method: string): string => {
    const names: Record<string, string> = {
      'bank_transfer': 'Bank Transfer',
      'check': 'Check',
      'cash': 'Cash',
      'mobile_payment': 'Mobile Payment',
      'card': 'Card Payment',
      'other': 'Other'
    };

    return names[method] || method;
  },

  // Validate payment data before submission
  validatePaymentData: (data: CreatePaymentData): string[] => {
    const errors: string[] = [];

    if (!data.demandeId) {
      errors.push('Request ID is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Payment amount must be greater than zero');
    }

    if (!data.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (data.paymentMethod === 'bank_transfer') {
      if (!data.bankDetails?.accountNumber) {
        errors.push('Account number is required for bank transfer');
      }
      if (!data.bankDetails?.bankName) {
        errors.push('Bank name is required for bank transfer');
      }
      if (!data.bankDetails?.accountHolderName) {
        errors.push('Account holder name is required for bank transfer');
      }
    }

    if (data.paymentMethod === 'check') {
      if (!data.checkDetails?.checkNumber) {
        errors.push('Check number is required for check payment');
      }
    }

    if (data.scheduledDate) {
      const scheduledDate = new Date(data.scheduledDate);
      if (scheduledDate < new Date()) {
        errors.push('Scheduled date cannot be in the past');
      }
    }

    return errors;
  },

  // Check if payment can be processed
  canProcess: (payment: Payment): boolean => {
    return payment.status === 'processing';
  },

  // Check if payment can be cancelled
  canCancel: (payment: Payment): boolean => {
    return ['pending', 'processing', 'on_hold'].includes(payment.status);
  },

  // Check if payment can be retried
  canRetry: (payment: Payment): boolean => {
    return payment.status === 'failed' && 
           (payment.errorDetails?.retryCount || 0) < 5;
  },

  // Get net amount (amount - fees)
  getNetAmount: (payment: Payment): number => {
    return payment.amount - (payment.fees?.totalFees || 0);
  },

  // Check if payment is overdue
  isOverdue: (payment: Payment): boolean => {
    if (!payment.scheduledDate) return false;
    const scheduledDate = new Date(payment.scheduledDate);
    const now = new Date();
    const completedStatuses = ['completed', 'cancelled', 'failed'];
    
    return scheduledDate < now && !completedStatuses.includes(payment.status);
  },

  // Calculate days since scheduled
  getDaysSinceScheduled: (payment: Payment): number => {
    if (!payment.scheduledDate) return 0;
    const scheduledDate = new Date(payment.scheduledDate);
    const now = new Date();
    const diffTime = now.getTime() - scheduledDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
};

export default paymentService;