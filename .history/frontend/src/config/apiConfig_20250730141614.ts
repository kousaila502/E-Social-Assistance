// src/config/apiConfig.ts - MODULAR STRUCTURE: LEGACY PRESERVED + REQUEST INTEGRATION

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// =====================================================
// API CONFIGURATION (UNCHANGED)
// =====================================================

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: 10000,

  ENDPOINTS: {
    // Health Check (LEGACY)
    HEALTH: '/health',

    // =====================================================
    // AUTHENTICATION ENDPOINTS (LEGACY - UNCHANGED)
    // =====================================================
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      VERIFY_EMAIL: '/auth/verify-email',
      RESEND_VERIFICATION: '/auth/resend-verification',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      CHANGE_PASSWORD: '/auth/change-password',
      ME: '/auth/me',
      PROFILE: '/auth/profile'
    },

    // =====================================================
    // USER MANAGEMENT ENDPOINTS (LEGACY - UNCHANGED)
    // =====================================================
    USERS: {
      GET_ALL: '/users',
      CREATE: '/users',
      DASHBOARD_STATS: '/users/dashboard-stats',
      GET_BY_ID: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
      DELETE: (id: string) => `/users/${id}`,
      RESTORE: (id: string) => `/users/${id}/restore`,
      VERIFY_DOCUMENTS: (id: string) => `/users/${id}/verify-documents`,
      CALCULATE_ELIGIBILITY: (id: string) => `/users/${id}/calculate-eligibility`,
      BULK_UPDATE: '/users/bulk-update',

      // ADD these document management endpoints:
      UPLOAD_DOCUMENT: (id: string) => `/users/${id}/documents/upload`,
      GET_DOCUMENTS: (id: string) => `/users/${id}/documents`,
      DELETE_DOCUMENT: (id: string, docType: string) => `/users/${id}/documents/${docType}`,
      DOWNLOAD_DOCUMENT: (id: string, docType: string) => `/users/${id}/documents/${docType}/download`,

      GET_STATS: (id: string) => `/users/${id}/stats`,
    },

    // =====================================================
    // REQUEST MANAGEMENT ENDPOINTS (NEW - BACKEND ALIGNED)
    // =====================================================
    DEMANDES: {
      // Core CRUD operations
      GET_ALL: '/demandes',
      CREATE: '/demandes',
      GET_BY_ID: (id: string) => `/demandes/${id}`,
      UPDATE: (id: string) => `/demandes/${id}`,

      // Status management
      SUBMIT: (id: string) => `/demandes/${id}/submit`,
      REVIEW: (id: string) => `/demandes/${id}/review`,
      ASSIGN: (id: string) => `/demandes/${id}/assign`,
      CANCEL: (id: string) => `/demandes/${id}/cancel`,

      // Document management
      UPLOAD_DOCUMENTS: (id: string) => `/demandes/${id}/documents`,
      VERIFY_DOCUMENT: (id: string, docId: string) => `/demandes/${id}/documents/${docId}`,
      REQUEST_DOCUMENTS: (id: string) => `/demandes/${id}/request-documents`,

      // Communication
      ADD_COMMENT: (id: string) => `/demandes/${id}/comments`,

      // Data retrieval and analytics
      DASHBOARD_STATS: '/demandes/dashboard-stats',
      BY_STATUS: (status: string) => `/demandes/status/${status}`,
      EXPORT: '/demandes/export'
    },

    // =====================================================
    // BUDGET POOL ENDPOINTS (LEGACY - UNCHANGED)
    // =====================================================
    BUDGET_POOLS: {
      // Core CRUD operations
      GET_ALL: '/budget-pools',
      CREATE: '/budget-pools',
      GET_BY_ID: (id: string) => `/budget-pools/${id}`,
      UPDATE: (id: string) => `/budget-pools/${id}`,
      DELETE: (id: string) => `/budget-pools/${id}`,

      // Statistics and analytics
      DASHBOARD_STATS: '/budget-pools/dashboard-stats',
      ANALYTICS: (id: string) => `/budget-pools/${id}/analytics`,

      // Fund operations
      ALLOCATE: (id: string) => `/budget-pools/${id}/allocate`,
      TRANSFER: (id: string) => `/budget-pools/${id}/transfer`,
      CONFIRM_ALLOCATION: (id: string, allocationId: string) => `/budget-pools/${id}/allocations/${allocationId}/confirm`
    },

    // =====================================================
    // NOTIFICATION ENDPOINTS (LEGACY - UNCHANGED)
    // =====================================================
    NOTIFICATIONS: {
      GET_ALL: '/notifications',
      CREATE: '/notifications',
      USER_NOTIFICATIONS: '/notifications/user-notifications',
      MARK_READ: (id: string) => `/notifications/${id}/read`,
      MARK_CLICKED: (id: string) => `/notifications/${id}/click`,
      BULK_SEND: '/notifications/bulk',
      RETRY_FAILED: '/notifications/retry-failed',
      STATS: '/notifications/stats',
      CREATE_TEMPLATE: '/notifications/templates',
      PROCESS_SCHEDULED: '/notifications/process-scheduled',
      CLEAN_EXPIRED: '/notifications/clean-expired'
    },

    // =====================================================
    // CONTENT MANAGEMENT ENDPOINTS (LEGACY - UNCHANGED)
    // =====================================================
    CONTENT: {
      GET_ALL: '/content',
      CREATE: '/content',
      ANALYTICS: '/content/analytics',
      GET_BY_ID: (id: string) => `/content/${id}`,
      UPDATE: (id: string) => `/content/${id}`,
      DELETE: (id: string) => `/content/${id}`,
      PUBLISH: (id: string) => `/content/${id}/publish`,
      MANAGE_HIERARCHY: (id: string) => `/content/${id}/hierarchy`
    },

    // =====================================================
    // ANNOUNCEMENT ENDPOINTS (LEGACY - PRESERVE AS-IS)
    // =====================================================
    ANNOUNCEMENTS: {
      GET_ALL: '/announcements',
      CREATE: '/announcements',
      STATS: '/announcements/stats',
      GET_BY_ID: (id: string) => `/announcements/${id}`,
      UPDATE: (id: string) => `/announcements/${id}`,
      PUBLISH: (id: string) => `/announcements/${id}/publish`,
      APPLY: (id: string) => `/announcements/${id}/apply`,
      REVIEW_PARTICIPANT: (id: string, userId: string) => `/announcements/${id}/participants/${userId}/review`
    },


    // =====================================================
    // PAYMENT ENDPOINTS (UPDATED TO MATCH BACKEND)
    // =====================================================
    PAYMENTS: {
      // Core CRUD operations
      GET_ALL: '/payments',
      CREATE: '/payments',
      GET_BY_ID: (id: string) => `/payments/${id}`,
      UPDATE: (id: string) => `/payments/${id}`,

      // Statistics and analytics
      DASHBOARD_STATS: '/payments/dashboard-stats',

      // Payment workflow actions
      PROCESS: (id: string) => `/payments/${id}/process`,
      CANCEL: (id: string) => `/payments/${id}/cancel`,
      RETRY: (id: string) => `/payments/${id}/retry`
    },

  }
};



// =====================================================
// CORE INTERFACES (LEGACY - PRESERVE AS-IS)
// =====================================================

// User interface (LEGACY - UNCHANGED) - Export directly with interface declaration
export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'user' | 'case_worker' | 'finance_manager';
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  isEmailVerified: boolean;
  eligibility: {
    status: 'pending' | 'verified' | 'rejected' | 'requires_update';
    score?: number;
    categories?: string[];
    lastVerificationDate?: string;
    lastAssessment?: string;
  };
  personalInfo?: {
    nationalId?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'prefer_not_to_say';  // FIXED: changed 'other' to 'prefer_not_to_say'
    address?: {
      wilaya?: string;
      city?: string;
      address?: string;
      country?: string;  // ADDED: missing country field
    };
  };
  economicInfo?: {
    familySize?: number;
    dependents?: number;  // ADDED: missing dependents field
    monthlyIncome?: number;
    employmentStatus?: 'employed' | 'unemployed' | 'self_employed' | 'retired' | 'student' | 'disabled';
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';  // ADDED: missing maritalStatus field
  };
  preferences?: {
    language?: 'en' | 'ar' | 'fr';
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
  statistics?: {
    totalRequests?: number;
    approvedRequests?: number;
    totalAmountReceived?: number;
    lastActivity?: string;
  };
  documents?: Array<{
    _id: string;
    filename: string;
    originalName: string;
    documentType: string;
    isVerified: boolean;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Authentication response (LEGACY) - Export directly
export interface AuthResponse {
  message: string;
  user: User;
}

// API Error interface (LEGACY) - Export directly
export interface ApiError {
  success: false;
  error: {
    type: string;
    message: string;
    statusCode: number;
    details?: Array<{
      field: string;
      message: string;
      value?: any;
      location?: string;
    }>;
    timestamp: string;
  };
}

// Enhanced API Error interface
export interface EnhancedApiError {
  message: string;
  statusCode: number;
  errors: string[];
  code?: string;
  response: {
    data: any;
    status: number;
  };
  type: 'client' | 'server' | 'network';
  details?: Array<{
    field: string;
    message: string;
    value?: any;
    location?: string;
  }>;
}

// Pagination interface (LEGACY) - Export directly
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Generic API response (LEGACY) - Export directly
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: string;
}

// Standard success response interface
export interface StandardSuccessResponse<T = any> {
  success: true;
  message: string;
  statusCode: number;
  data?: T;
  timestamp: string;
}

// =====================================================
// ANNOUNCEMENT INTERFACES (LEGACY - PRESERVE AS-IS)
// =====================================================

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'general' | 'emergency' | 'policy_update' | 'system_maintenance' | 'deadline_reminder' | 'event' | 'training' | 'holiday';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'scheduled' | 'expired' | 'cancelled' | 'archived';
  isUrgent: boolean;
  publishedAt?: string;
  scheduledPublishAt?: string;
  expiresAt?: string;
  targetAudience: {
    userTypes: string[];
    categories: string[];
    eligibilityCategories: string[];
    locations: string[];
    minAge?: number;
    maxAge?: number;
  };
  applicationConfig?: {
    allowsApplications: boolean;
    applicationDeadline?: string;
    maxApplicants?: number;
    currentApplicants: number;
    requiresDocuments: boolean;
    requiredDocuments: string[];
  };
  createdBy: string | User;
  updatedBy?: string | User;
  createdAt: string;
  updatedAt: string;
}



// =====================================================
// REQUEST MANAGEMENT INTERFACES (NEW - BACKEND ALIGNED)
// =====================================================

// Request-specific interfaces (NEW) - Export directly
export interface RequestDocument {
  _id?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface RequestComment {
  _id?: string;
  author: string | User;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface StatusHistoryEntry {
  _id?: string;
  status: string;
  changedAt: string;
  changedBy: string | User;
  reason?: string;
}

// Main Demande interface (UPDATED - EXACT BACKEND MATCH) - Export directly
export interface Demande {
  _id: string;
  requestNumber?: string;
  title: string;
  description: string;
  program: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  requestedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  status: 'draft' | 'submitted' | 'under_review' | 'pending_docs' | 'approved' | 'partially_paid' | 'paid' | 'rejected' | 'cancelled' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other';
  urgencyLevel: 'routine' | 'important' | 'urgent' | 'critical';
  applicant: string | User;
  assignedTo?: string | User;
  documents?: Array<RequestDocument>;
  reviewDetails?: {
    reviewedBy?: string | User;
    reviewedAt?: string;
    reviewNotes?: string;
    eligibilityScore?: number;
  };
  rejectionReason?: {
    category: 'insufficient_documents' | 'not_eligible' | 'insufficient_funds' | 'duplicate_request' | 'policy_violation' | 'other';
    description: string;
  };
  comments?: Array<RequestComment>;
  statusHistory?: Array<StatusHistoryEntry>;
  tags?: string[];
  createdBy?: string | User;
  updatedBy?: string | User;
  createdAt: string;
  updatedAt: string;
}

// Request service interfaces (NEW) - Export directly
export interface CreateDemandeData {
  title: string;
  description: string;
  program: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  requestedAmount: number;
  category?: 'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other';
  urgencyLevel?: 'routine' | 'important' | 'urgent' | 'critical';
  tags?: string[];
}

export interface UpdateDemandeData {
  title?: string;
  description?: string;
  requestedAmount?: number;
  category?: 'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other';
  urgencyLevel?: 'routine' | 'important' | 'urgent' | 'critical';
  tags?: string[];
  stat
}

export interface ReviewDemandeData {
  decision: 'approved' | 'rejected';
  approvedAmount?: number;
  reviewNotes?: string;
  rejectionCategory?: 'insufficient_documents' | 'not_eligible' | 'insufficient_funds' | 'duplicate_request' | 'policy_violation' | 'other';
  rejectionDescription?: string;
  budgetPoolId?: string;
}

export interface AssignDemandeData {
  assignedTo: string;
  assignmentNotes?: string;
}

export interface CancelDemandeData {
  reason?: string;
}

export interface AddCommentData {
  content: string;
  isInternal?: boolean;
}

export interface RequestDocumentsData {
  requestMessage: string;
  requiredDocuments: string[];
}

export interface VerifyDocumentData {
  isVerified: boolean;
  verificationNotes?: string;
}

// Budget Pool Allocation interface
export interface BudgetAllocation {
  _id?: string;
  demande: string | Demande;
  amount: number;
  allocatedAt: string;
  allocatedBy: string | User;
  status: 'reserved' | 'confirmed' | 'paid' | 'cancelled' | 'refunded';
  notes?: string;
}

// Budget Pool Transfer interface
export interface BudgetTransfer {
  _id?: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  fromPool?: string | BudgetPool;
  toPool?: string | BudgetPool;
  transferredAt: string;
  transferredBy: string | User;
  reason: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
}

// Budget Pool Alert Thresholds interface
export interface BudgetAlertThresholds {
  lowBalanceWarning: number;
  criticalBalanceAlert: number;
  expirationWarning: number;
}

// Budget Pool Allocation Rules interface
export interface BudgetAllocationRules {
  maxAmountPerRequest?: number;
  maxRequestsPerUser?: number;
  allowedCategories?: Array<'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other'>;
  eligibilityThreshold?: number;
  requiresApproval?: boolean;
  autoApprovalLimit?: number;
}

// Budget Pool Period interface
export interface BudgetPeriod {
  startDate: string;
  endDate: string;
}

// Budget Pool Program interface
export interface BudgetProgram {
  type: 'Content' | 'Announcement';
  id: string;
}

// Main Budget Pool interface
export interface BudgetPool {
  _id: string;
  poolNumber?: string;
  name: string;
  description: string;

  // Financial Information
  totalAmount: number;
  allocatedAmount: number;
  reservedAmount: number;
  spentAmount: number;

  // Virtual fields (calculated by backend)
  remainingAmount?: number;
  availableAmount?: number;
  utilizationRate?: number;

  // Program Association
  program: BudgetProgram;

  // Budget Period
  fiscalYear: number;
  budgetPeriod: BudgetPeriod;

  // Status Management
  status: 'draft' | 'active' | 'frozen' | 'depleted' | 'expired' | 'cancelled' | 'transferred';

  // Rules and Configuration
  allocationRules?: BudgetAllocationRules;
  alertThresholds?: BudgetAlertThresholds;

  // Allocation and Transfer Tracking
  allocations: BudgetAllocation[];
  transfers: BudgetTransfer[];

  // Administrative Information
  managedBy: string | User;
  department: string;
  fundingSource: 'government' | 'donations' | 'grants' | 'internal' | 'international' | 'other';
  externalReference?: string;

  // Virtual fields for expiration
  isExpired?: boolean;
  daysUntilExpiration?: number;

  // Audit Fields
  createdBy: string | User;
  updatedBy?: string | User;

  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Create Budget Pool Data interface
export interface CreateBudgetPoolData {
  name: string;
  description: string;
  totalAmount: number;
  fiscalYear: number;
  budgetPeriod: BudgetPeriod;
  program: BudgetProgram;
  department: string;
  fundingSource: 'government' | 'donations' | 'grants' | 'internal' | 'international' | 'other';
  managedBy?: string;
  allocationRules?: BudgetAllocationRules;
  alertThresholds?: BudgetAlertThresholds;
  externalReference?: string;
}

// Update Budget Pool Data interface
export interface UpdateBudgetPoolData {
  name?: string;
  description?: string;
  totalAmount?: number;
  status?: BudgetPool['status'];
  allocationRules?: BudgetAllocationRules;
  alertThresholds?: BudgetAlertThresholds;
  externalReference?: string;
}

// Allocate Funds Data interface
export interface AllocateFundsData {
  demandeId: string;
  amount: number;
  notes?: string;
}

// Transfer Funds Data interface
export interface TransferFundsData {
  targetPoolId: string;
  amount: number;
  reason: string;
}

// Budget Pool Filters interface
export interface BudgetPoolFilters {
  page?: number;
  limit?: number;
  status?: BudgetPool['status'] | '';
  fiscalYear?: number | '';
  department?: string;
  managedBy?: string;
  programType?: 'Content' | 'Announcement' | '';
  fundingSource?: BudgetPool['fundingSource'] | '';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'totalAmount' | 'utilizationRate';
  sortOrder?: 'asc' | 'desc';
  minAmount?: number;
  maxAmount?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  utilizationMin?: number;
  utilizationMax?: number;
}

// Budget Pool Statistics Response interface
export interface BudgetPoolStatsResponse {
  statistics: {
    overall: {
      totalPools: number;
      totalBudget: number;
      totalAllocated: number;
      totalReserved: number;
      totalSpent: number;
      remainingBudget: number;
      availableBudget: number;
      avgUtilization: number;
    };
    alerts: {
      lowBalancePools: number;
      criticalBalancePools: number;
      expiringPools: number;
    };
    byStatus: Array<{ _id: string; count: number; totalAmount: number }>;
    byDepartment: Array<{ _id: string; count: number; totalAmount: number }>;
    byFundingSource: Array<{ _id: string; count: number; totalAmount: number }>;
    recentActivity: BudgetPool[];
  };
}

// Budget Pool Response interface
export interface BudgetPoolResponse {
  message: string;
  budgetPool: BudgetPool;
}

// Budget Pools List Response interface
export interface BudgetPoolsResponse {
  budgetPools: BudgetPool[];
  pagination: PaginationInfo;
  statistics: BudgetPoolStatsResponse['statistics'];
}

// Budget Pool Analytics Response interface
export interface BudgetPoolAnalyticsResponse {
  analytics: {
    summary: {
      timeProgress: number;
      utilizationRate: number;
      burnRate: number;
      projectedCompletion: number | null;
      avgProcessingDays: number;
    };
    trends: {
      allocations: Array<{ date: string; amount: number; count: number }>;
      spending: Array<{ date: string; amount: number }>;
    };
    breakdowns: {
      categories: Array<{ _id: string; totalAllocated: number; requestCount: number; avgAmount: number }>;
    };
  };
}

export interface DemandeQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  urgencyLevel?: string;
  assignedTo?: string;
  applicant?: string;
  programType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
}

// Response interfaces (NEW) - Export directly
export interface DemandeResponse {
  message: string;
  demande: Demande;
}

export interface DemandesResponse {
  demandes: Demande[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDemandes: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  statistics?: any; // Optional backend stats
}

export interface DashboardStatsResponse {
  statistics: {
    totalRequests: number;
    totalRequested: number;
    totalApproved: number;
    totalPaid: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      count: number;
    }>;
  };
  recentActivity: Array<{
    _id: string;
    title: string;
    status: string;
    updatedAt: string;
    applicant: {
      name: string;
      email: string;
    };
    assignedTo?: {
      name: string;
      email: string;
    };
    requestedAmount: number;
  }>;
}

export interface MessageResponse {
  message: string;
}

// =====================================================
// API CLIENT CONFIGURATION (UPDATED - COOKIE BASED)
// =====================================================

// API client instance (UPDATED for cookie-based auth)
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Backend uses HTTP-only cookies
});

// Request interceptor (UPDATED - Cookie-based auth)
api.interceptors.request.use(
  (config) => {
    // Backend uses HTTP-only cookies for authentication
    // No need to add Authorization header - cookies are automatically sent
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor (UPDATED - Backend response format)
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return response.data since backend returns structured responses
    return response.data;
  },
  (error: AxiosError) => {
    // Extract error details from backend response
    const errorData = error.response?.data as any;
    const status = error.response?.status;

    // Create structured error object that preserves original error
    const apiError = {
      message: errorData?.message || error.message || 'An unexpected error occurred',
      statusCode: status || 500,
      errors: errorData?.errors || [],
      code: errorData?.code,
      response: {
        data: errorData,
        status: status
      },
      type: getErrorType(status || 500)
    };

    // Handle specific error cases WITHOUT automatic redirects
    if (status === 401) {
      // Don't automatically redirect - let components handle it
      apiError.message = errorData?.message || 'Authentication failed';
    }

    if (status === 403) {
      apiError.message = errorData?.message || 'You do not have permission to perform this action.';
    }

    if (status === 404) {
      apiError.message = errorData?.message || 'The requested resource was not found.';
    }

    if (status === 409) {
      apiError.message = errorData?.message || 'A conflict occurred with the current state.';
    }

    return Promise.reject(apiError);
  }
);

// Helper function to categorize errors
function getErrorType(statusCode: number): 'client' | 'server' | 'network' {
  if (statusCode >= 400 && statusCode < 500) return 'client';
  if (statusCode >= 500) return 'server';
  return 'network';
}

// =====================================================
// TYPED API WRAPPER (ENHANCED)
// =====================================================

export const apiClient = {
  get: <T = any>(url: string, config?: any): Promise<T> => api.get(url, config),
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.post(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.put(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.patch(url, data, config),
  delete: <T = any>(url: string, config?: any): Promise<T> => api.delete(url, config),
};

export default api;