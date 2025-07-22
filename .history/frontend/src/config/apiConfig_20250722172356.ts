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
    
    // 🔥 FIXED: Demandes (Requests) endpoints - EXACT BACKEND ALIGNMENT
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
    
    // ... other endpoints (payments, budget pools, etc.)
    // [Keep existing endpoints as they are]
  }
};

// 🔥 EXACT BACKEND SCHEMA TYPES

// User interface (from your backend User model)
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

// Document interface (from your backend schema)
export interface RequestDocument {
  _id?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string | User;
  isVerified: boolean;
  verifiedBy?: string | User;
  verifiedAt?: string;
}

// Comment interface (from your backend schema)
export interface RequestComment {
  _id?: string;
  author: string | User;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

// Status history interface (from your backend schema)
export interface StatusHistoryEntry {
  _id?: string;
  status: string;
  changedAt: string;
  changedBy: string | User;
  reason?: string;
}

// 🔥 EXACT BACKEND DEMANDE SCHEMA
export interface Demande {
  _id: string;
  requestNumber: string;
  title: string;
  description: string;
  
  // Program reference (exactly as in backend)
  program: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  
  // Financial info (exactly as in backend)
  requestedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  
  // Status management (EXACT backend enum values)
  status: 'draft' | 'submitted' | 'under_review' | 'pending_docs' | 'approved' | 'partially_paid' | 'paid' | 'rejected' | 'cancelled' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other';
  
  // User & assignment
  applicant: string | User;
  assignedTo?: string | User;
  
  // Documents array
  documents: RequestDocument[];
  
  // Review details (exactly as in backend)
  reviewDetails?: {
    reviewedBy?: string | User;
    reviewedAt?: string;
    reviewNotes?: string;
    eligibilityScore?: number;
  };
  
  // Rejection reason (exactly as in backend)
  rejectionReason?: {
    category: 'insufficient_documents' | 'not_eligible' | 'insufficient_funds' | 'duplicate_request' | 'policy_violation' | 'other';
    description: string;
  };
  
  // Payment reference
  payment?: string;
  
  // Deadlines (exactly as in backend)
  submissionDeadline?: string;
  reviewDeadline?: string;
  paymentDeadline?: string;
  
  // Communication
  comments: RequestComment[];
  
  // Status history
  statusHistory: StatusHistoryEntry[];
  
  // Additional fields (exactly as in backend)
  urgencyLevel: 'routine' | 'important' | 'urgent' | 'critical';
  tags: string[];
  
  // Audit fields
  createdBy?: string | User;
  updatedBy?: string | User;
  
  // Soft delete
  isDeleted?: boolean;
  deletedAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Virtual fields (computed by backend)
  isOverdue?: boolean;
  completionRate?: number;
}

// 🔥 REQUEST SERVICE INTERFACES (matching backend exactly)

// Create request interface (for POST /demandes)
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

// Update request interface (for PATCH /demandes/:id)
export interface UpdateDemandeData {
  title?: string;
  description?: string;
  requestedAmount?: number;
  category?: 'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other';
  urgencyLevel?: 'routine' | 'important' | 'urgent' | 'critical';
  tags?: string[];
}

// Review request interface (for PATCH /demandes/:id/review)
export interface ReviewDemandeData {
  decision: 'approved' | 'rejected';
  approvedAmount?: number;
  reviewNotes?: string;
  rejectionCategory?: 'insufficient_documents' | 'not_eligible' | 'insufficient_funds' | 'duplicate_request' | 'policy_violation' | 'other';
  rejectionDescription?: string;
  budgetPoolId?: string;
}

// Add comment interface (for POST /demandes/:id/comments)
export interface AddCommentData {
  content: string;
  isInternal?: boolean;
}

// Assignment interface (for PATCH /demandes/:id/assign)
export interface AssignDemandeData {
  assignedTo?: string;
}

// Cancel request interface (for PATCH /demandes/:id/cancel)
export interface CancelDemandeData {
  reason?: string;
}

// Document verification interface (for PATCH /demandes/:id/documents/:docId)
export interface VerifyDocumentData {
  isVerified: boolean;
  verificationNotes?: string;
}

// Request additional documents interface (for POST /demandes/:id/request-documents)
export interface RequestDocumentsData {
  requestMessage: string;
  requiredDocuments: string[];
}

// 🔥 API RESPONSE INTERFACES (matching backend controller responses)

// Single request response (from getSingleDemande)
export interface DemandeResponse {
  demande: Demande;
  budgetPool?: any;
}

// Multiple requests response (from getAllDemandes)
export interface DemandesResponse {
  demandes: Demande[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDemandes: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  statistics: {
    totalRequests: number;
    totalRequested: number;
    totalApproved: number;
    totalPaid: number;
    statusBreakdown: Array<{ status: string; count: number }>;
    categoryBreakdown: Array<{ category: string; count: number }>;
  };
}

// Dashboard stats response (from getDashboardStats)
export interface DashboardStatsResponse {
  statistics: {
    totalRequests: number;
    totalRequested: number;
    totalApproved: number;
    totalPaid: number;
    statusBreakdown: Array<{ status: string; count: number }>;
    categoryBreakdown: Array<{ category: string; count: number }>;
  };
  recentActivity: Array<{
    _id: string;
    title: string;
    status: string;
    updatedAt: string;
    applicant: { name: string; email: string };
    assignedTo?: { name: string; email: string };
    requestedAmount: number;
  }>;
}

// Simple message response (for create, update, delete operations)
export interface MessageResponse {
  message: string;
  demande?: Demande;
}

// Query parameters interface (for getAllDemandes)
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

// Pagination info interface
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalDemandes: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Create axios instance with configuration
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;