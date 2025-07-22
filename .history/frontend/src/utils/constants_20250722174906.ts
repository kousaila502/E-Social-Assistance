// src/utils/constants.ts

// User Roles (matching your backend schema)
export const USER_ROLES = {
  ADMIN: 'admin',
  CASE_WORKER: 'case_worker',
  FINANCE_MANAGER: 'finance_manager',
  USER: 'user'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Request Statuses (from your Swagger schema - exact match)
export const REQUEST_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  PENDING_DOCS: 'pending_docs',
  APPROVED: 'approved',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export const REQUEST_CATEGORIES = {
  EMERGENCY_ASSISTANCE: 'emergency_assistance',
  EDUCATIONAL_SUPPORT: 'educational_support', 
  MEDICAL_ASSISTANCE: 'medical_assistance',
  HOUSING_SUPPORT: 'housing_support',
  FOOD_ASSISTANCE: 'food_assistance',
  EMPLOYMENT_SUPPORT: 'employment_support',
  ELDERLY_CARE: 'elderly_care',
  DISABILITY_SUPPORT: 'disability_support',
  OTHER: 'other'
} as const;

// Status Transition Rules - defines which statuses can transition to which
export const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [REQUEST_STATUS.DRAFT]: [REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.SUBMITTED]: [REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.PENDING_DOCS, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.UNDER_REVIEW]: [REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED, REQUEST_STATUS.PENDING_DOCS],
  [REQUEST_STATUS.PENDING_DOCS]: [REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.REJECTED, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.APPROVED]: [REQUEST_STATUS.PARTIALLY_PAID, REQUEST_STATUS.PAID, REQUEST_STATUS.REJECTED],
  [REQUEST_STATUS.PARTIALLY_PAID]: [REQUEST_STATUS.PAID],
  [REQUEST_STATUS.PAID]: [], // Terminal status
  [REQUEST_STATUS.REJECTED]: [], // Terminal status
  [REQUEST_STATUS.CANCELLED]: [] // Terminal status
};

// Workflow Step Definitions
export const WORKFLOW_STEPS = {
  SUBMISSION: 'submission',
  INITIAL_REVIEW: 'initial_review',
  DOCUMENT_VERIFICATION: 'document_verification',
  ELIGIBILITY_ASSESSMENT: 'eligibility_assessment',
  AMOUNT_DETERMINATION: 'amount_determination',
  SUPERVISOR_APPROVAL: 'supervisor_approval',
  PAYMENT_PROCESSING: 'payment_processing'
} as const;

export type WorkflowStep = typeof WORKFLOW_STEPS[keyof typeof WORKFLOW_STEPS];

// Workflow Step Configuration
export const WORKFLOW_STEP_CONFIG: Record<WorkflowStep, {
  title: string;
  description: string;
  requiredRole: UserRole[];
  estimatedDuration: string;
  dependencies: WorkflowStep[];
  associatedStatuses: RequestStatus[];
  required: boolean;
  canSkip: boolean;
}> = {
  [WORKFLOW_STEPS.SUBMISSION]: {
    title: 'Application Submitted',
    description: 'Request has been submitted by the applicant',
    requiredRole: [USER_ROLES.USER],
    estimatedDuration: '0 days',
    dependencies: [],
    associatedStatuses: [REQUEST_STATUS.DRAFT, REQUEST_STATUS.SUBMITTED],
    required: true,
    canSkip: false
  },
  [WORKFLOW_STEPS.INITIAL_REVIEW]: {
    title: 'Initial Review',
    description: 'Case worker performs initial assessment of eligibility',
    requiredRole: [USER_ROLES.CASE_WORKER, USER_ROLES.ADMIN],
    estimatedDuration: '1-2 days',
    dependencies: [WORKFLOW_STEPS.SUBMISSION],
    associatedStatuses: [REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.UNDER_REVIEW],
    required: true,
    canSkip: false
  },
  [WORKFLOW_STEPS.DOCUMENT_VERIFICATION]: {
    title: 'Document Verification',
    description: 'Verify all required supporting documents',
    requiredRole: [USER_ROLES.CASE_WORKER, USER_ROLES.ADMIN],
    estimatedDuration: '1-3 days',
    dependencies: [WORKFLOW_STEPS.INITIAL_REVIEW],
    associatedStatuses: [REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.PENDING_DOCS],
    required: true,
    canSkip: false
  },
  [WORKFLOW_STEPS.ELIGIBILITY_ASSESSMENT]: {
    title: 'Eligibility Assessment',
    description: 'Assess applicant eligibility using scoring system',
    requiredRole: [USER_ROLES.CASE_WORKER, USER_ROLES.ADMIN],
    estimatedDuration: '1 day',
    dependencies: [WORKFLOW_STEPS.DOCUMENT_VERIFICATION],
    associatedStatuses: [REQUEST_STATUS.UNDER_REVIEW],
    required: true,
    canSkip: false
  },
  [WORKFLOW_STEPS.AMOUNT_DETERMINATION]: {
    title: 'Amount Determination',
    description: 'Determine approved assistance amount',
    requiredRole: [USER_ROLES.CASE_WORKER, USER_ROLES.ADMIN],
    estimatedDuration: '1 day',
    dependencies: [WORKFLOW_STEPS.ELIGIBILITY_ASSESSMENT],
    associatedStatuses: [REQUEST_STATUS.UNDER_REVIEW],
    required: true,
    canSkip: false
  },
  [WORKFLOW_STEPS.SUPERVISOR_APPROVAL]: {
    title: 'Supervisor Approval',
    description: 'Final approval from administrator',
    requiredRole: [USER_ROLES.ADMIN],
    estimatedDuration: '1-2 days',
    dependencies: [WORKFLOW_STEPS.AMOUNT_DETERMINATION],
    associatedStatuses: [REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED],
    required: false, // Conditional based on amount
    canSkip: true
  },
  [WORKFLOW_STEPS.PAYMENT_PROCESSING]: {
    title: 'Payment Processing',
    description: 'Process approved payment to beneficiary',
    requiredRole: [USER_ROLES.FINANCE_MANAGER, USER_ROLES.ADMIN],
    estimatedDuration: '3-5 days',
    dependencies: [WORKFLOW_STEPS.SUPERVISOR_APPROVAL],
    associatedStatuses: [REQUEST_STATUS.APPROVED, REQUEST_STATUS.PARTIALLY_PAID, REQUEST_STATUS.PAID],
    required: true,
    canSkip: false
  }
};

// Role-Based Action Permissions
export const ACTION_PERMISSIONS: Record<string, {
  roles: UserRole[];
  requiredStatuses: RequestStatus[];
  description: string;
}> = {
  'submit_request': {
    roles: [USER_ROLES.USER],
    requiredStatuses: [REQUEST_STATUS.DRAFT],
    description: 'Submit request for review'
  },
  'assign_request': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER],
    requiredStatuses: [REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.UNDER_REVIEW],
    description: 'Assign request to case worker'
  },
  'review_request': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER],
    requiredStatuses: [REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.PENDING_DOCS],
    description: 'Review and approve/reject request'
  },
  'request_documents': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER],
    requiredStatuses: [REQUEST_STATUS.UNDER_REVIEW],
    description: 'Request additional documents'
  },
  'verify_documents': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER],
    requiredStatuses: [REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.PENDING_DOCS],
    description: 'Verify uploaded documents'
  },
  'approve_request': {
    roles: [USER_ROLES.ADMIN],
    requiredStatuses: [REQUEST_STATUS.UNDER_REVIEW],
    description: 'Final approval of request'
  },
  'process_payment': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_MANAGER],
    requiredStatuses: [REQUEST_STATUS.APPROVED, REQUEST_STATUS.PARTIALLY_PAID],
    description: 'Process payment to beneficiary'
  },
  'cancel_request': {
    roles: [USER_ROLES.USER, USER_ROLES.ADMIN],
    requiredStatuses: [REQUEST_STATUS.DRAFT, REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.PENDING_DOCS],
    description: 'Cancel the request'
  },
  'add_comment': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER, USER_ROLES.USER],
    requiredStatuses: [REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.PENDING_DOCS, REQUEST_STATUS.APPROVED],
    description: 'Add comment to request'
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

// Business Rules Configuration
export const BUSINESS_RULES = {
  // Amount thresholds
  SUPERVISOR_APPROVAL_THRESHOLD: 1000, // Requests over $1000 need supervisor approval
  MAX_REQUEST_AMOUNT: 10000, // Maximum amount per request
  MIN_REQUEST_AMOUNT: 1, // Minimum amount per request

  // Processing timeframes
  INITIAL_REVIEW_DEADLINE: 2, // Days
  DOCUMENT_REVIEW_DEADLINE: 3, // Days
  SUPERVISOR_APPROVAL_DEADLINE: 2, // Days
  PAYMENT_PROCESSING_DEADLINE: 5, // Days

  // Document requirements
  REQUIRED_DOCUMENTS_BY_CATEGORY: {
    [REQUEST_CATEGORIES.MEDICAL]: ['medical_records', 'doctor_referral', 'income_proof'],
    [REQUEST_CATEGORIES.EDUCATION]: ['enrollment_proof', 'fee_schedule', 'income_proof'],
    [REQUEST_CATEGORIES.HOUSING]: ['lease_agreement', 'utility_bills', 'income_proof'],
    [REQUEST_CATEGORIES.FOOD]: ['family_composition', 'income_proof'],
    [REQUEST_CATEGORIES.EMPLOYMENT]: ['unemployment_proof', 'training_enrollment'],
    [REQUEST_CATEGORIES.DISABILITY]: ['disability_certificate', 'medical_assessment'],
    [REQUEST_CATEGORIES.ELDERLY]: ['age_verification', 'care_assessment'],
    [REQUEST_CATEGORIES.CHILD_WELFARE]: ['birth_certificate', 'school_records', 'guardian_proof'],
    [REQUEST_CATEGORIES.OTHER]: ['supporting_documentation']
  } as Record<RequestCategory, string[]>,

  // Eligibility scoring
  MINIMUM_ELIGIBILITY_SCORE: 50,
  MAXIMUM_ELIGIBILITY_SCORE: 100,

  // Auto-assignment rules
  MAX_REQUESTS_PER_CASE_WORKER: 20,

  // Notification rules
  NOTIFY_APPLICANT_ON_STATUS_CHANGE: true,
  NOTIFY_SUPERVISOR_ON_HIGH_AMOUNT: true,
  REMINDER_INTERVAL_DAYS: 7
} as const;

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

// Urgency Levels (from your Swagger schema)
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];

// Urgency Level Configuration
export const URGENCY_LEVEL_CONFIG: Record<UrgencyLevel, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  priority: number;
  slaHours: number;
}> = {
  [URGENCY_LEVELS.LOW]: {
    label: 'Low',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    priority: 1,
    slaHours: 168 // 7 days
  },
  [URGENCY_LEVELS.MEDIUM]: {
    label: 'Medium',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    priority: 2,
    slaHours: 72 // 3 days
  },
  [URGENCY_LEVELS.HIGH]: {
    label: 'High',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    priority: 3,
    slaHours: 24 // 1 day
  },
  [URGENCY_LEVELS.CRITICAL]: {
    label: 'Critical',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    priority: 4,
    slaHours: 4 // 4 hours
  }
};

// Account Status (from your Swagger schema)
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification'
} as const;

export type AccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];

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
    CONTENT: '/admin/content',
    NOTIFICATIONS: '/admin/notifications'
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
  [ROUTES.ADMIN.ANNOUNCEMENTS]: [USER_ROLES.ADMIN],
  [ROUTES.ADMIN.CONTENT]: [USER_ROLES.ADMIN],
  [ROUTES.ADMIN.NOTIFICATIONS]: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER]
};

// Payment Status (from your Swagger schema)
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REVERSED: 'reversed'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Payment Methods (from your Swagger schema)
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
  CASH: 'cash',
  MOBILE_MONEY: 'mobile_money',
  CARD: 'card'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Budget Pool Status (from your Swagger schema)
export const BUDGET_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  FROZEN: 'frozen',
  DEPLETED: 'depleted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  TRANSFERRED: 'transferred'
} as const;

export type BudgetStatus = typeof BUDGET_STATUS[keyof typeof BUDGET_STATUS];

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
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
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

// Notification Types (from your Swagger schema)
export const NOTIFICATION_TYPES = {
  SYSTEM: 'system',
  ALERT: 'alert',
  REMINDER: 'reminder',
  ANNOUNCEMENT: 'announcement',
  REQUEST_STATUS: 'request_status',
  PAYMENT_STATUS: 'payment_status',
  APPROVAL_REQUIRED: 'approval_required',
  DOCUMENT_REQUIRED: 'document_required'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if a status transition is valid
 */
export const isValidStatusTransition = (fromStatus: RequestStatus, toStatus: RequestStatus): boolean => {
  return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

/**
 * Get next possible statuses for a given status
 */
export const getNextPossibleStatuses = (currentStatus: RequestStatus): RequestStatus[] => {
  return STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * Check if user has permission to perform an action
 */
export const hasActionPermission = (
  userRole: UserRole,
  action: string,
  requestStatus: RequestStatus
): boolean => {
  const permission = ACTION_PERMISSIONS[action];
  if (!permission) return false;

  return permission.roles.includes(userRole) &&
    permission.requiredStatuses.includes(requestStatus);
};

/**
 * Determine if supervisor approval is required
 */
export const requiresSupervisorApproval = (amount: number): boolean => {
  return amount > BUSINESS_RULES.SUPERVISOR_APPROVAL_THRESHOLD;
};

/**
 * Get required documents for a category
 */
export const getRequiredDocuments = (category: RequestCategory): string[] => {
  return BUSINESS_RULES.REQUIRED_DOCUMENTS_BY_CATEGORY[category] || [];
};

/**
 * Calculate SLA deadline based on urgency
 */
export const calculateSLADeadline = (
  submissionDate: string,
  urgencyLevel: UrgencyLevel
): Date => {
  const submission = new Date(submissionDate);
  const slaHours = URGENCY_LEVEL_CONFIG[urgencyLevel].slaHours;
  return new Date(submission.getTime() + (slaHours * 60 * 60 * 1000));
};

/**
 * Check if request is overdue
 */
export const isRequestOverdue = (
  submissionDate: string,
  urgencyLevel: UrgencyLevel,
  currentStatus: RequestStatus
): boolean => {
  if (REQUEST_STATUS_CONFIG[currentStatus].isTerminal) return false;

  const deadline = calculateSLADeadline(submissionDate, urgencyLevel);
  return new Date() > deadline;
};

/**
 * Get workflow progress percentage
 */
export const getWorkflowProgress = (currentStatus: RequestStatus): number => {
  const statusOrder: RequestStatus[] = [
    REQUEST_STATUS.DRAFT,
    REQUEST_STATUS.SUBMITTED,
    REQUEST_STATUS.UNDER_REVIEW,
    REQUEST_STATUS.APPROVED,
    REQUEST_STATUS.PAID
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
};

/**
 * Get estimated completion date
 */
export const getEstimatedCompletion = (
  submissionDate: string,
  urgencyLevel: UrgencyLevel
): Date => {
  const submission = new Date(submissionDate);
  const baseHours = URGENCY_LEVEL_CONFIG[urgencyLevel].slaHours;
  // Add buffer time based on urgency
  const bufferMultiplier = urgencyLevel === URGENCY_LEVELS.CRITICAL ? 1.2 : 1.5;
  const totalHours = baseHours * bufferMultiplier;

  return new Date(submission.getTime() + (totalHours * 60 * 60 * 1000));
};