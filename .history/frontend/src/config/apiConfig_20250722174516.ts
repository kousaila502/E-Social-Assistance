// src/config/apiConfig.ts - REQUEST SECTION UPDATED TO MATCH BACKEND
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: 10000,

  ENDPOINTS: {
    // Health Check
    HEALTH: '/health',

    // Authentication endpoints
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

    // User Management endpoints
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
      BULK_UPDATE: '/users/bulk-update'
    },

    // 🔥 UPDATED: Demandes (Requests) endpoints - ALIGNED WITH BACKEND SPEC
    DEMANDES: {
      GET_ALL: '/demandes',
      CREATE: '/demandes',
      DASHBOARD_STATS: '/demandes/dashboard-stats',
      BY_STATUS: (status: string) => `/demandes/status/${status}`,
      EXPORT: '/demandes/export',
      GET_BY_ID: (id: string) => `/demandes/${id}`,
      UPDATE: (id: string) => `/demandes/${id}`,
      SUBMIT: (id: string) => `/demandes/${id}/submit`,
      REVIEW: (id: string) => `/demandes/${id}/review`,
      ASSIGN: (id: string) => `/demandes/${id}/assign`,
      CANCEL: (id: string) => `/demandes/${id}/cancel`,
      ADD_COMMENT: (id: string) => `/demandes/${id}/comments`,
      UPLOAD_DOCUMENTS: (id: string) => `/demandes/${id}/documents`,
      VERIFY_DOCUMENT: (id: string, docId: string) => `/demandes/${id}/documents/${docId}`,
      REQUEST_DOCUMENTS: (id: string) => `/demandes/${id}/request-documents`
    },

    // Payment endpoints
    PAYMENTS: {
      GET_ALL: '/payments',
      CREATE: '/payments',
      DASHBOARD_STATS: '/payments/dashboard-stats',
      GET_BY_ID: (id: string) => `/payments/${id}`,
      UPDATE: (id: string) => `/payments/${id}`,
      PROCESS: (id: string) => `/payments/${id}/process`,
      CANCEL: (id: string) => `/payments/${id}/cancel`,
      RETRY: (id: string) => `/payments/${id}/retry`
    },

    // Budget Pool endpoints
    BUDGET_POOLS: {
      GET_ALL: '/budget-pools',
      CREATE: '/budget-pools',
      DASHBOARD_STATS: '/budget-pools/dashboard-stats',
      GET_BY_ID: (id: string) => `/budget-pools/${id}`,
      UPDATE: (id: string) => `/budget-pools/${id}`,
      DELETE: (id: string) => `/budget-pools/${id}`,
      ALLOCATE: (id: string) => `/budget-pools/${id}/allocate`,
      TRANSFER: (id: string) => `/budget-pools/${id}/transfer`,
      ANALYTICS: (id: string) => `/budget-pools/${id}/analytics`
    },

    // Notification endpoints
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

    // Content Management endpoints
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

    // Announcement endpoints
    ANNOUNCEMENTS: {
      GET_ALL: '/announcements',
      CREATE: '/announcements',
      STATS: '/announcements/stats',
      GET_BY_ID: (id: string) => `/announcements/${id}`,
      UPDATE: (id: string) => `/announcements/${id}`,
      PUBLISH: (id: string) => `/announcements/${id}/publish`,
      APPLY: (id: string) => `/announcements/${id}/apply`,
      REVIEW_PARTICIPANT: (id: string, userId: string) => `/announcements/${id}/participants/${userId}/review`
    }
  }
};

// Types based on your Swagger schema
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
    gender?: 'male' | 'female' | 'other';
    address?: {
      wilaya?: string;
      city?: string;
      address?: string;
    };
  };
  economicInfo?: {
    familySize?: number;
    monthlyIncome?: number;
    employmentStatus?: 'employed' | 'unemployed' | 'self_employed' | 'retired' | 'student' | 'disabled';
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

// 🔥 UPDATED: Demande interface to match EXACT backend schema
export interface Demande {
  _id: string;
  title: string;
  description: string;
  // ✅ FIXED: Status values from backend OpenAPI spec
  status: 'draft' | 'submitted' | 'under_review' | 'pending_docs' | 'approved' | 'partially_paid' | 'paid' | 'rejected' | 'cancelled';
  requestedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  // ✅ FIXED: Category values from backend OpenAPI spec  
  category: 'medical' | 'education' | 'housing' | 'food' | 'employment' | 'disability' | 'elderly' | 'child_welfare' | 'other';
  // ✅ FIXED: UrgencyLevel values from backend OpenAPI spec
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  // ✅ FIXED: Priority values from backend OpenAPI spec
  priority: 'low' | 'medium' | 'high' | 'critical';
  applicant: User;
  assignedTo?: User;
  program: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 🔥 NEW: Request-specific response types matching backend
export interface DemandeResponse {
  message: string;
  demande: Demande;
}

export interface DemandesResponse {
  demandes: Demande[];
  pagination: PaginationInfo;
}

export interface DashboardStatsResponse {
  statistics: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalAmount: number;
    approvedAmount: number;
    paidAmount: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    status: string;
  }>;
}

// 🔥 NEW: Request creation/update interfaces matching backend
export interface CreateDemandeData {
  title: string;
  description: string;
  requestedAmount: number;
  program: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  category?: 'medical' | 'education' | 'housing' | 'food' | 'employment' | 'disability' | 'elderly' | 'child_welfare' | 'other';
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface UpdateDemandeData {
  title?: string;
  description?: string;
  requestedAmount?: number;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReviewDemandeData {
  decision: 'approved' | 'rejected';
  approvedAmount?: number;
  reviewNotes?: string;
  rejectionCategory?: string;
  rejectionDescription?: string;
  budgetPoolId?: string;
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

// Keep existing types unchanged
export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: string[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: string;
}

// 🔥 UPDATED: API client for cookie-based auth (backend uses cookies)
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Backend uses cookie-based auth
});

// 🔥 UPDATED: Remove localStorage token logic since backend uses cookies
api.interceptors.request.use(
  (config) => {
    // Backend uses HTTP-only cookies, no need to add Authorization header
    // The cookies are automatically sent with withCredentials: true
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 🔥 UPDATED: Handle responses according to backend format
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // ✅ Return response.data since backend returns structured responses like { message, demande }
    return response.data;
  },
  (error: AxiosError) => {
    // Handle common error responses
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login (no localStorage to clear since we use cookies)
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      console.error('Access denied');
    }

    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error occurred');
    }

    // ✅ Return backend error format: { message, statusCode, errors }
    return Promise.reject(error.response?.data || { message: error.message, statusCode: 500 });
  }
);

// Typed API wrapper functions
export const apiClient = {
  get: <T = any>(url: string, config?: any): Promise<T> => api.get(url, config),
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.post(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.put(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.patch(url, data, config),
  delete: <T = any>(url: string, config?: any): Promise<T> => api.delete(url, config),
};

export default api;