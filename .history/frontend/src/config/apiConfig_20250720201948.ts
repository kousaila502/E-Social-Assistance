// src/config/apiConfig.ts
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
      GET_BY_ID: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
      DELETE: (id: string) => `/users/${id}`,
      RESTORE: (id: string) => `/users/${id}/restore`,
      VERIFY_DOCUMENTS: (id: string) => `/users/${id}/verify-documents`,
      CALCULATE_ELIGIBILITY: (id: string) => `/users/${id}/calculate-eligibility`,
      BULK_UPDATE: '/users/bulk-update'
    },
    
    // Demandes (Requests) endpoints
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
    score: number;
    categories: string[];
    lastVerificationDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Demande {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'pending_docs' | 'approved' | 'partially_paid' | 'paid' | 'rejected' | 'cancelled';
  requestedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  category: 'medical' | 'education' | 'housing' | 'food' | 'employment' | 'disability' | 'elderly' | 'child_welfare' | 'other';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
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

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based auth
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    // Handle common error responses
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      console.error('Access denied');
    }
    
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error occurred');
    }
    
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;