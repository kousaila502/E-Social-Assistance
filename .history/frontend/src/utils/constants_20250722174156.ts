// src/utils/constants.ts

// User Roles (matching your backend schema)
export const USER_ROLES = {
  ADMIN: 'admin',
  CASE_WORKER: 'case_worker',
  FINANCE_MANAGER: 'finance_manager',
  USER: 'user'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// 🔥 UPDATED: Request Statuses (EXACT BACKEND MATCH from demande.js)
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

// 🔥 UPDATED: Request Categories (EXACT BACKEND MATCH from demande.js)
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

export type RequestCategory = typeof REQUEST_CATEGORIES[keyof typeof REQUEST_CATEGORIES];

// 🔥 UPDATED: Priority Levels (EXACT BACKEND MATCH from demande.js)
export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

// 🔥 UPDATED: Urgency Levels (EXACT BACKEND MATCH from demande.js)
export const URGENCY_LEVELS = {
  ROUTINE: 'routine',
  IMPORTANT: 'important',
  URGENT: 'urgent',
  CRITICAL: 'critical'
} as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];

// 🔥 UPDATED: Rejection Categories (EXACT BACKEND MATCH from demande.js)
export const REJECTION_CATEGORIES = {
  INSUFFICIENT_DOCUMENTS: 'insufficient_documents',
  NOT_ELIGIBLE: 'not_eligible',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  DUPLICATE_REQUEST: 'duplicate_request',
  POLICY_VIOLATION: 'policy_violation',
  OTHER: 'other'
} as const;

export type RejectionCategory = typeof REJECTION_CATEGORIES[keyof typeof REJECTION_CATEGORIES];

// Request Status Configuration (updated with new EXPIRED status)
export const REQUEST_STATUS_CONFIG: Record<RequestStatus, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  description: string;
  estimatedDuration?: string;
  isTerminal: boolean;
  canEdit: boolean;
}> = {
  [REQUEST_STATUS.DRAFT]: {
    label: 'Draft',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: 'DocumentTextIcon',
    description: 'Request is being prepared by the applicant',
    estimatedDuration: '0 days',
    isTerminal: false,
    canEdit: true
  },
  [REQUEST_STATUS.SUBMITTED]: {
    label: 'Submitted',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: 'DocumentTextIcon',
    description: 'Request has been submitted and awaiting assignment',
    estimatedDuration: '1-2 days',
    isTerminal: false,
    canEdit: false
  },
  [REQUEST_STATUS.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: 'ClockIcon',
    description: 'Case worker is reviewing the request',
    estimatedDuration: '3-5 days',
    isTerminal: false,
    canEdit: false
  },
  [REQUEST_STATUS.PENDING_DOCS]: {
    label: 'Pending Documents',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    icon: 'PaperClipIcon',
    description: 'Additional documentation has been requested',
    estimatedDuration: '2-7 days',
    isTerminal: false,
    canEdit: true
  },
  [REQUEST_STATUS.APPROVED]: {
    label: 'Approved',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: 'CheckCircleIcon',
    description: 'Request has been approved and pending payment',
    estimatedDuration: '3-5 days',
    isTerminal: false,
    canEdit: false
  },
  [REQUEST_STATUS.PARTIALLY_PAID]: {
    label: 'Partially Paid',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    icon: 'BanknotesIcon',
    description: 'Partial payment has been processed',
    estimatedDuration: '1-3 days',
    isTerminal: false,
    canEdit: false
  },
  [REQUEST_STATUS.PAID]: {
    label: 'Paid',
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    icon: 'CheckCircleIcon',
    description: 'Full payment has been completed',
    isTerminal: true,
    canEdit: false
  },
  [REQUEST_STATUS.REJECTED]: {
    label: 'Rejected',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: 'XCircleIcon',
    description: 'Request has been rejected',
    isTerminal: true,
    canEdit: false
  },
  [REQUEST_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: 'XCircleIcon',
    description: 'Request was cancelled by the applicant',
    isTerminal: true,
    canEdit: false
  },
  [REQUEST_STATUS.EXPIRED]: {
    label: 'Expired',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: 'ClockIcon',
    description: 'Request has expired due to missed deadlines',
    isTerminal: true,
    canEdit: false
  }
};

// 🔥 UPDATED: Request Category Labels (EXACT BACKEND MATCH)
export const REQUEST_CATEGORY_LABELS: Record<RequestCategory, string> = {
  [REQUEST_CATEGORIES.EMERGENCY_ASSISTANCE]: 'Emergency Assistance',
  [REQUEST_CATEGORIES.EDUCATIONAL_SUPPORT]: 'Educational Support',
  [REQUEST_CATEGORIES.MEDICAL_ASSISTANCE]: 'Medical Assistance',
  [REQUEST_CATEGORIES.HOUSING_SUPPORT]: 'Housing Support',
  [REQUEST_CATEGORIES.FOOD_ASSISTANCE]: 'Food Assistance',
  [REQUEST_CATEGORIES.EMPLOYMENT_SUPPORT]: 'Employment Support',
  [REQUEST_CATEGORIES.ELDERLY_CARE]: 'Elderly Care',
  [REQUEST_CATEGORIES.DISABILITY_SUPPORT]: 'Disability Support',
  [REQUEST_CATEGORIES.OTHER]: 'Other'
};

// 🔥 NEW: Request Category Configuration
export const REQUEST_CATEGORY_CONFIG: Record<RequestCategory, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
  maxAmount: number;
  requiredDocuments: string[];
  urgencyMultiplier: number;
}> = {
  [REQUEST_CATEGORIES.EMERGENCY_ASSISTANCE]: {
    label: 'Emergency Assistance',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'ExclamationTriangleIcon',
    description: 'Urgent financial assistance for emergencies',
    maxAmount: 50000,
    requiredDocuments: ['emergency_proof', 'income_proof', 'id_document'],
    urgencyMultiplier: 2.0
  },
  [REQUEST_CATEGORIES.EDUCATIONAL_SUPPORT]: {
    label: 'Educational Support',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: 'AcademicCapIcon',
    description: 'Support for educational expenses and fees',
    maxAmount: 30000,
    requiredDocuments: ['enrollment_proof', 'fee_schedule', 'income_proof', 'academic_records'],
    urgencyMultiplier: 1.2
  },
  [REQUEST_CATEGORIES.MEDICAL_ASSISTANCE]: {
    label: 'Medical Assistance',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: 'HeartIcon',
    description: 'Assistance for medical treatments and healthcare',
    maxAmount: 100000,
    requiredDocuments: ['medical_records', 'doctor_referral', 'treatment_plan', 'income_proof'],
    urgencyMultiplier: 1.8
  },
  [REQUEST_CATEGORIES.HOUSING_SUPPORT]: {
    label: 'Housing Support',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    icon: 'HomeIcon',
    description: 'Support for housing and accommodation needs',
    maxAmount: 80000,
    requiredDocuments: ['lease_agreement', 'utility_bills', 'income_proof', 'family_composition'],
    urgencyMultiplier: 1.5
  },
  [REQUEST_CATEGORIES.FOOD_ASSISTANCE]: {
    label: 'Food Assistance',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: 'ShoppingCartIcon',
    description: 'Support for food and basic nutrition needs',
    maxAmount: 15000,
    requiredDocuments: ['family_composition', 'income_proof', 'nutritional_assessment'],
    urgencyMultiplier: 1.3
  },
  [REQUEST_CATEGORIES.EMPLOYMENT_SUPPORT]: {
    label: 'Employment Support',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: 'BriefcaseIcon',
    description: 'Support for job training and employment programs',
    maxAmount: 25000,
    requiredDocuments: ['unemployment_proof', 'training_enrollment', 'skills_assessment'],
    urgencyMultiplier: 1.0
  },
  [REQUEST_CATEGORIES.ELDERLY_CARE]: {
    label: 'Elderly Care',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: 'UserGroupIcon',
    description: 'Support for elderly care and services',
    maxAmount: 40000,
    requiredDocuments: ['age_verification', 'care_assessment', 'medical_records'],
    urgencyMultiplier: 1.4
  },
  [REQUEST_CATEGORIES.DISABILITY_SUPPORT]: {
    label: 'Disability Support',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    icon: 'HeartIcon',
    description: 'Support for disability-related needs and accommodations',
    maxAmount: 60000,
    requiredDocuments: ['disability_certificate', 'medical_assessment', 'care_plan'],
    urgencyMultiplier: 1.6
  },
  [REQUEST_CATEGORIES.OTHER]: {
    label: 'Other',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: 'DocumentTextIcon',
    description: 'Other types of social assistance',
    maxAmount: 20000,
    requiredDocuments: ['supporting_documentation', 'justification_letter'],
    urgencyMultiplier: 1.0
  }
};

// 🔥 UPDATED: Priority Level Configuration (EXACT BACKEND MATCH)
export const PRIORITY_LEVEL_CONFIG: Record<PriorityLevel, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  priority: number;
  slaHours: number;
}> = {
  [PRIORITY_LEVELS.LOW]: {
    label: 'Low',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    priority: 1,
    slaHours: 240 // 10 days
  },
  [PRIORITY_LEVELS.NORMAL]: {
    label: 'Normal',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    priority: 2,
    slaHours: 120 // 5 days
  },
  [PRIORITY_LEVELS.HIGH]: {
    label: 'High',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    priority: 3,
    slaHours: 48 // 2 days
  },
  [PRIORITY_LEVELS.URGENT]: {
    label: 'Urgent',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    priority: 4,
    slaHours: 24 // 1 day
  }
};

// 🔥 UPDATED: Urgency Level Configuration (EXACT BACKEND MATCH)
export const URGENCY_LEVEL_CONFIG: Record<UrgencyLevel, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  priority: number;
  slaHours: number;
  description: string;
}> = {
  [URGENCY_LEVELS.ROUTINE]: {
    label: 'Routine',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    priority: 1,
    slaHours: 168, // 7 days
    description: 'Standard processing timeline'
  },
  [URGENCY_LEVELS.IMPORTANT]: {
    label: 'Important',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    priority: 2,
    slaHours: 72, // 3 days
    description: 'Requires expedited processing'
  },
  [URGENCY_LEVELS.URGENT]: {
    label: 'Urgent',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    priority: 3,
    slaHours: 24, // 1 day
    description: 'Requires immediate attention'
  },
  [URGENCY_LEVELS.CRITICAL]: {
    label: 'Critical',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    priority: 4,
    slaHours: 4, // 4 hours
    description: 'Emergency situation requiring immediate action'
  }
};

// 🔥 NEW: Rejection Category Configuration
export const REJECTION_CATEGORY_CONFIG: Record<RejectionCategory, {
  label: string;
  description: string;
  color: string;
  canAppeal: boolean;
  appealDeadlineDays: number;
}> = {
  [REJECTION_CATEGORIES.INSUFFICIENT_DOCUMENTS]: {
    label: 'Insufficient Documents',
    description: 'Required documentation is missing or incomplete',
    color: 'orange',
    canAppeal: true,
    appealDeadlineDays: 30
  },
  [REJECTION_CATEGORIES.NOT_ELIGIBLE]: {
    label: 'Not Eligible',
    description: 'Applicant does not meet eligibility criteria',
    color: 'red',
    canAppeal: true,
    appealDeadlineDays: 30
  },
  [REJECTION_CATEGORIES.INSUFFICIENT_FUNDS]: {
    label: 'Insufficient Funds',
    description: 'Budget allocation is insufficient for this request',
    color: 'yellow',
    canAppeal: false,
    appealDeadlineDays: 0
  },
  [REJECTION_CATEGORIES.DUPLICATE_REQUEST]: {
    label: 'Duplicate Request',
    description: 'Similar request already exists or was recently processed',
    color: 'purple',
    canAppeal: true,
    appealDeadlineDays: 15
  },
  [REJECTION_CATEGORIES.POLICY_VIOLATION]: {
    label: 'Policy Violation',
    description: 'Request violates program policies or guidelines',
    color: 'red',
    canAppeal: true,
    appealDeadlineDays: 30
  },
  [REJECTION_CATEGORIES.OTHER]: {
    label: 'Other',
    description: 'Other reasons for rejection',
    color: 'gray',
    canAppeal: true,
    appealDeadlineDays: 30
  }
};

// Status Transition Rules - Updated with EXPIRED status
export const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [REQUEST_STATUS.DRAFT]: [REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.SUBMITTED]: [REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.PENDING_DOCS, REQUEST_STATUS.CANCELLED, REQUEST_STATUS.EXPIRED],
  [REQUEST_STATUS.UNDER_REVIEW]: [REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED, REQUEST_STATUS.PENDING_DOCS, REQUEST_STATUS.EXPIRED],
  [REQUEST_STATUS.PENDING_DOCS]: [REQUEST_STATUS.UNDER_REVIEW, REQUEST_STATUS.REJECTED, REQUEST_STATUS.CANCELLED, REQUEST_STATUS.EXPIRED],
  [REQUEST_STATUS.APPROVED]: [REQUEST_STATUS.PARTIALLY_PAID, REQUEST_STATUS.PAID, REQUEST_STATUS.REJECTED, REQUEST_STATUS.EXPIRED],
  [REQUEST_STATUS.PARTIALLY_PAID]: [REQUEST_STATUS.PAID],
  [REQUEST_STATUS.PAID]: [], // Terminal status
  [REQUEST_STATUS.REJECTED]: [], // Terminal status
  [REQUEST_STATUS.CANCELLED]: [], // Terminal status
  [REQUEST_STATUS.EXPIRED]: [] // Terminal status
};

// 🔥 UPDATED: Business Rules Configuration (based on backend calculations)
export const BUSINESS_RULES = {
  // Amount thresholds (based on backend max amounts)
  SUPERVISOR_APPROVAL_THRESHOLD: 50000, // DZD - Large amounts need supervisor approval
  MAX_REQUEST_AMOUNT: 1000000, // DZD - From backend validation
  MIN_REQUEST_AMOUNT: 1, // DZD - From backend validation
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB - From backend validation

  // User limits (from backend logic)
  MAX_ACTIVE_REQUESTS_PER_USER: 5, // From backend createDemande logic
  DUPLICATE_REQUEST_WINDOW_DAYS: 30, // From backend createDemande logic

  // Processing timeframes (in days)
  INITIAL_REVIEW_DEADLINE: 2,
  DOCUMENT_REVIEW_DEADLINE: 3,
  SUPERVISOR_APPROVAL_DEADLINE: 2,
  PAYMENT_PROCESSING_DEADLINE: 5,
  SUBMISSION_DEADLINE_DAYS: 7, // From backend logic
  REVIEW_DEADLINE_DAYS: 14, // From backend logic
  PAYMENT_DEADLINE_DAYS: 30, // From backend logic

  // Eligibility scoring (from backend calculateRequestEligibility)
  MINIMUM_ELIGIBILITY_SCORE: 50,
  MAXIMUM_ELIGIBILITY_SCORE: 100,
  CATEGORY_BONUS: {
    [REQUEST_CATEGORIES.EMERGENCY_ASSISTANCE]: 15,
    [REQUEST_CATEGORIES.MEDICAL_ASSISTANCE]: 12,
    [REQUEST_CATEGORIES.FOOD_ASSISTANCE]: 10,
    [REQUEST_CATEGORIES.HOUSING_SUPPORT]: 8,
    [REQUEST_CATEGORIES.EDUCATIONAL_SUPPORT]: 5

    [REQUEST_CATEGORIES.EMPLOYMENT_SUPPORT]: 3,
    [REQUEST_CATEGORIES.ELDERLY_CARE]: 6,
    [REQUEST_CATEGORIES.DISABILITY_SUPPORT]: 8,
    [REQUEST_CATEGORIES.OTHER]: 0
  },
  URGENCY_BONUS: {
    [URGENCY_LEVELS.CRITICAL]: 10,
    [URGENCY_LEVELS.URGENT]: 5,
    [URGENCY_LEVELS.IMPORTANT]: 2,
    [URGENCY_LEVELS.ROUTINE]: 0
  },
  AMOUNT_BONUS: {
    UNDER_5000: 5,
    UNDER_10000: 2,
    OVER_10000: 0
  },

  // Auto-assignment rules
  MAX_REQUESTS_PER_CASE_WORKER: 20,

  // Notification rules
  NOTIFY_APPLICANT_ON_STATUS_CHANGE: true,
  NOTIFY_SUPERVISOR_ON_HIGH_AMOUNT: true,
  REMINDER_INTERVAL_DAYS: 7
} as const;

// 🔥 UPDATED: Role-Based Action Permissions (aligned with backend middleware)
export const ACTION_PERMISSIONS: Record<string, {
  roles: UserRole[];
  requiredStatuses: RequestStatus[];
  description: string;
}> = {
  'create_request': {
    roles: [USER_ROLES.USER],
    requiredStatuses: [],
    description: 'Create new request'
  },
  'submit_request': {
    roles: [USER_ROLES.USER],
    requiredStatuses: [REQUEST_STATUS.DRAFT],
    description: 'Submit request for review'
  },
  'view_own_requests': {
    roles: [USER_ROLES.USER],
    requiredStatuses: [],
    description: 'View own requests'
  },
  'view_all_requests': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER],
    requiredStatuses: [],
    description: 'View all requests in system'
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
  },
  'upload_documents': {
    roles: [USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER],
    requiredStatuses: [REQUEST_STATUS.DRAFT, REQUEST_STATUS.PENDING_DOCS],
    description: 'Upload supporting documents'
  },
  'view_dashboard_stats': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER],
    requiredStatuses: [],
    description: 'View dashboard statistics'
  },
  'export_requests': {
    roles: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER],
    requiredStatuses: [],
    description: 'Export requests data'
  }
};

// 🔥 UPDATED: Allowed File Types (EXACT BACKEND MATCH from demande.js)
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB - From backend validation
  ACCEPTED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
} as const;

// Account Status (from your backend User schema)
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification'
} as const;

export type AccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];

// Navigation Routes (using 'demandes' to match your backend routes)
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
  REQUEST_MANAGEMENT: '/demandes',

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
  [ROUTES.REQUEST_MANAGEMENT]: [USER_ROLES.ADMIN, USER_ROLES.CASE_WORKER, USER_ROLES.FINANCE_MANAGER],
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

// Payment Status (from your backend Payment schema)
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REVERSED: 'reversed'
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Payment Methods (from your backend Payment schema)
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
  CASH: 'cash',
  MOBILE_MONEY: 'mobile_money',
  CARD: 'card'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Budget Pool Status (from your backend BudgetPool schema)
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

// Notification Types (from your backend Notification schema)
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
  requestStatus?: RequestStatus
): boolean => {
  const permission = ACTION_PERMISSIONS[action];
  if (!permission) return false;

  const hasRole = permission.roles.includes(userRole);
  if (!requestStatus) return hasRole;

  return hasRole && permission.requiredStatuses.includes(requestStatus);
};

/**
 * Determine if supervisor approval is required (based on backend logic)
 */
export const requiresSupervisorApproval = (amount: number): boolean => {
  return amount > BUSINESS_RULES.SUPERVISOR_APPROVAL_THRESHOLD;
};

/**
 * Get required documents for a category
 */
export const getRequiredDocuments = (category: RequestCategory): string[] => {
  return REQUEST_CATEGORY_CONFIG[category]?.requiredDocuments || [];
};

/**
 * Calculate eligibility score (based on backend calculateRequestEligibility)
 */
export const calculateRequestEligibility = (
  userScore: number = 0,
  category: RequestCategory,
  urgencyLevel: UrgencyLevel,
  requestedAmount: number
): number => {
  let score = userScore;

  // Category bonus
  score += BUSINESS_RULES.CATEGORY_BONUS[category] || 0;

  // Urgency bonus
  score += BUSINESS_RULES.URGENCY_BONUS[urgencyLevel] || 0;

  // Amount adjustments
  if (requestedAmount < 5000) score += BUSINESS_RULES.AMOUNT_BONUS.UNDER_5000;
  else if (requestedAmount < 10000) score += BUSINESS_RULES.AMOUNT_BONUS.UNDER_10000;

  return Math.min(Math.max(score, 0), BUSINESS_RULES.MAXIMUM_ELIGIBILITY_SCORE);
};

/**
 * Calculate SLA deadline based on urgency and priority
 */
export const calculateSLADeadline = (
  submissionDate: string,
  urgencyLevel: UrgencyLevel,
  priority: PriorityLevel = PRIORITY_LEVELS.NORMAL
): Date => {
  const submission = new Date(submissionDate);
  const urgencyHours = URGENCY_LEVEL_CONFIG[urgencyLevel].slaHours;
  const priorityHours = PRIORITY_LEVEL_CONFIG[priority].slaHours;

  // Use the more stringent SLA
  const slaHours = Math.min(urgencyHours, priorityHours);
  return new Date(submission.getTime() + (slaHours * 60 * 60 * 1000));
};

/**
 * Check if request is overdue
 */
export const isRequestOverdue = (
  submissionDate: string,
  urgencyLevel: UrgencyLevel,
  currentStatus: RequestStatus,
  priority: PriorityLevel = PRIORITY_LEVELS.NORMAL
): boolean => {
  if (REQUEST_STATUS_CONFIG[currentStatus].isTerminal) return false;

  const deadline = calculateSLADeadline(submissionDate, urgencyLevel, priority);
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
  urgencyLevel: UrgencyLevel,
  priority: PriorityLevel = PRIORITY_LEVELS.NORMAL
): Date => {
  const submission = new Date(submissionDate);
  const urgencyHours = URGENCY_LEVEL_CONFIG[urgencyLevel].slaHours;
  const priorityHours = PRIORITY_LEVEL_CONFIG[priority].slaHours;

  // Use average of urgency and priority with buffer
  const baseHours = (urgencyHours + priorityHours) / 2;
  const bufferMultiplier = urgencyLevel === URGENCY_LEVELS.CRITICAL ? 1.2 : 1.5;
  const totalHours = baseHours * bufferMultiplier;

  return new Date(submission.getTime() + (totalHours * 60 * 60 * 1000));
};

/**
 * Check if user can edit request based on status and role
 */
export const canEditRequest = (
  userRole: UserRole,
  requestStatus: RequestStatus,
  isOwner: boolean = false
): boolean => {
  // Users can only edit their own draft or pending docs requests
  if (userRole === USER_ROLES.USER) {
    return isOwner && (requestStatus === REQUEST_STATUS.DRAFT || requestStatus === REQUEST_STATUS.PENDING_DOCS);
  }
  
  // Staff can edit non-terminal requests
  return !REQUEST_STATUS_CONFIG[requestStatus].isTerminal;
};

/**
 * Get maximum amount for category
 */
export const getMaxAmountForCategory = (category: RequestCategory): number => {
  return REQUEST_CATEGORY_CONFIG[category]?.maxAmount || BUSINESS_RULES.MAX_REQUEST_AMOUNT;
};

/**
 * Check if request amount is valid for category
 */
export const isValidAmountForCategory = (amount: number, category: RequestCategory): boolean => {
  const maxAmount = getMaxAmountForCategory(category);
  return amount >= BUSINESS_RULES.MIN_REQUEST_AMOUNT && amount <= maxAmount;
};

/**
 * Format currency amount (DZD)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const target = new Date(date);
  const diffInMs = now.getTime() - target.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};