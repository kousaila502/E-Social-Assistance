// src/utils/constants.ts

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CASE_WORKER: 'case_worker',
  FINANCE_MANAGER: 'finance_manager',
  USER: 'user'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Request Statuses (from your Swagger schema)
export const REQUEST_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  PENDING_DOCS: 'pending_docs',
  APPROVED: 'approved',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

// Request Status Configuration
export const REQUEST_STATUS_CONFIG: Record<RequestStatus, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  [REQUEST_STATUS.PENDING]: {
    label: 'Pending Review',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200'
  },
  [REQUEST_STATUS.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200'
  },
  [REQUEST_STATUS.DOCUMENTS_REQUIRED]: {
    label: 'Documents Required',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200'
  },
  [REQUEST_STATUS.APPROVED]: {
    label: 'Approved',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  },
  [REQUEST_STATUS.REJECTED]: {
    label: 'Rejected',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200'
  },
  [REQUEST_STATUS.PAYMENT_PROCESSING]: {
    label: 'Payment Processing',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200'
  },
  [REQUEST_STATUS.COMPLETED]: {
    label: 'Completed',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  },
  [REQUEST_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200'
  },
  [REQUEST_STATUS.ON_HOLD]: {
    label: 'On Hold',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200'
  },
  [REQUEST_STATUS.RESUBMITTED]: {
    label: 'Resubmitted',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200'
  }
};

// Request Categories (from your Swagger schema)
export const REQUEST_CATEGORIES = {
  MEDICAL: 'medical',
  EDUCATION: 'education',
  HOUSING: 'housing',
  FOOD: 'food',
  EMPLOYMENT: 'employment',
  DISABILITY: 'disability',
  ELDERLY: 'elderly',
  CHILD_WELFARE: 'child_welfare',
  OTHER: 'other'
} as const;

export type RequestCategory = typeof REQUEST_CATEGORIES[keyof typeof REQUEST_CATEGORIES];

// Request Category Labels (matching your backend)
export const REQUEST_CATEGORY_LABELS: Record<RequestCategory, string> = {
  [REQUEST_CATEGORIES.MEDICAL]: 'Medical',
  [REQUEST_CATEGORIES.EDUCATION]: 'Education',
  [REQUEST_CATEGORIES.HOUSING]: 'Housing',
  [REQUEST_CATEGORIES.FOOD]: 'Food Assistance',
  [REQUEST_CATEGORIES.EMPLOYMENT]: 'Employment',
  [REQUEST_CATEGORIES.DISABILITY]: 'Disability Support',
  [REQUEST_CATEGORIES.ELDERLY]: 'Elderly Care',
  [REQUEST_CATEGORIES.CHILD_WELFARE]: 'Child Welfare',
  [REQUEST_CATEGORIES.OTHER]: 'Other'
};

// Navigation Routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // User routes (using 'demandes' from your backend)
  SUBMIT_REQUEST: '/demandes/submit',
  MY_REQUESTS: '/demandes/my-requests',
  REQUEST_DETAILS: '/demandes/:id',

  // Admin routes (using your backend endpoints)
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    REQUESTS: '/admin/demandes',
    BUDGET: '/admin/budget-pools',
    PAYMENTS: '/admin/payments',
    ANALYTICS: '/admin/analytics',
    ANNOUNCEMENTS: '/admin/announcements',
    CONTENT: '/admin/content'
  }
} as const;

// Role-based route permissions
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  [ROUTES.DASHBOARD]: [USER_ROLES.USER, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER, USER_ROLES.ADMIN],
  [ROUTES.SUBMIT_REQUEST]: [USER_ROLES.USER],
  [ROUTES.MY_REQUESTS]: [USER_ROLES.USER],
  [ROUTES.ADMIN.DASHBOARD]: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER],
  [ROUTES.ADMIN.USERS]: [USER_ROLES.ADMIN],
  [ROUTES.ADMIN.REQUESTS]: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER],
  [ROUTES.ADMIN.BUDGET]: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_MANAGER],
  [ROUTES.ADMIN.PAYMENTS]: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_MANAGER],
  [ROUTES.ADMIN.ANALYTICS]: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER],
  [ROUTES.ADMIN.ANNOUNCEMENTS]: [USER_ROLES.ADMIN]
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',
  VERIFY_DOCUMENTS: '/users/:id/verify-documents',

  // Requests
  REQUESTS: '/requests',
  REQUEST_COMMENTS: '/requests/:id/comments',
  UPDATE_REQUEST_STATUS: '/requests/:id/status',

  // Budget
  BUDGET_POOLS: '/budget-pools',

  // Payments
  PAYMENTS: '/payments',

  // Notifications
  NOTIFICATIONS: '/notifications',
  MARK_NOTIFICATION_READ: '/notifications/:id/read'
} as const;

// File upload settings
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
} as const;

// Pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

// Application settings
export const APP_CONFIG = {
  NAME: 'E-Social Assistance',
  VERSION: '1.0.0',
  DESCRIPTION: 'Social Assistance Management Platform',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_THEME: 'light'
} as const;

// Dashboard refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  DASHBOARD_STATS: 5 * 60 * 1000, // 5 minutes
  NOTIFICATIONS: 30 * 1000, // 30 seconds
  REQUEST_STATUS: 2 * 60 * 1000 // 2 minutes
} as const;