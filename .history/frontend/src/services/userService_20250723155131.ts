// src/services/userService.ts
import api, { API_CONFIG, User, PaginationInfo } from '../config/apiConfig';

// User creation interface (for admin creating new users)
export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'case_worker' | 'finance_manager';
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
  accountStatus?: 'active' | 'pending_verification' | 'inactive' | 'suspended';
}

// User update interface
export interface UpdateUserData {
  name?: string;
  phoneNumber?: string;
  role?: 'user' | 'admin' | 'case_worker' | 'finance_manager';
  accountStatus?: 'active' | 'pending_verification' | 'inactive' | 'suspended';
  isEmailVerified?: boolean;
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
}

// API response interfaces
export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
  summary?: {
    totalUsers: number;
    activeUsers: number;
    pendingVerification: number;
    suspendedUsers: number;
    roleDistribution: {
      admin: number;
      case_worker: number;
      finance_manager: number;
      user: number;
    };
  };
}

export interface UserResponse {
  message: string;
  user: User;
}

export interface UserDashboardStats {
  statistics: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsers: number;
    verifiedUsers: number;
    pendingVerification: number;
    suspendedUsers: number;
    averageEligibilityScore: number;
    roleDistribution: {
      role: string;
      count: number;
      percentage: number;
    }[];
    monthlyRegistrations: {
      month: string;
      count: number;
    }[];
    topWilayas: {
      wilaya: string;
      userCount: number;
    }[];
  };
  recentActivity: {
    type: 'registration' | 'verification' | 'status_change' | 'role_change';
    userName: string;
    action: string;
    timestamp: string;
  }[];
}

export interface BulkActionData {
  userIds: string[];
  action: 'activate' | 'suspend' | 'verify' | 'delete';
  reason?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: 'user' | 'admin' | 'case_worker' | 'finance_manager';
  accountStatus?: 'active' | 'pending_verification' | 'inactive' | 'suspended';
  eligibilityStatus?: 'pending' | 'verified' | 'rejected';
  wilaya?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastActivity' | 'eligibilityScore' | 'role' | 'accountStatus'; // ← Add missing sort options
  sortOrder?: 'asc' | 'desc';
}

// ADD document management interfaces:
export interface UserDocumentUpload {
  documentType: 'nationalIdCard' | 'incomeProof' | 'familyComposition' | 'residenceProof';
  file: File;
}

export interface UserDocumentResponse {
  message: string;
  document: {
    type: string;
    status: 'pending' | 'verified' | 'rejected';
    fileUrl: string;
    uploadedAt: string;
  };
}

const userService = {
  // Get all users with pagination and filters
  getAll: async (filters: UserFilters = {}): Promise<UsersResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.accountStatus) queryParams.append('accountStatus', filters.accountStatus);
      if (filters.eligibilityStatus) queryParams.append('eligibilityStatus', filters.eligibilityStatus);
      if (filters.wilaya) queryParams.append('wilaya', filters.wilaya);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const url = `${API_CONFIG.ENDPOINTS.USERS.GET_ALL}?${queryParams.toString()}`;
      const response: UsersResponse = await api.get(url);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<UserDashboardStats> => {
    try {
      const response: UserDashboardStats = await api.get(API_CONFIG.ENDPOINTS.USERS.DASHBOARD_STATS);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get users by role
  getByRole: async (role: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<UsersResponse> => {
    try {
      const filters: UserFilters = { role: role as any, ...params };
      return await userService.getAll(filters);
    } catch (error: any) {
      throw error;
    }
  },

  // Get users by status
  getByStatus: async (status: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> => {
    try {
      const filters: UserFilters = { accountStatus: status as any, ...params };
      return await userService.getAll(filters);
    } catch (error: any) {
      throw error;
    }
  },

  // Create new user (admin only)
  create: async (userData: CreateUserData): Promise<UserResponse> => {
    try {
      const response: UserResponse = await api.post(API_CONFIG.ENDPOINTS.USERS.CREATE, userData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get single user by ID
  getById: async (id: string): Promise<UserResponse> => {
    try {
      const response: UserResponse = await api.get(API_CONFIG.ENDPOINTS.USERS.GET_BY_ID(id));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Update user
  update: async (id: string, updateData: UpdateUserData): Promise<UserResponse> => {
    try {
      const response: UserResponse = await api.patch(API_CONFIG.ENDPOINTS.USERS.UPDATE(id), updateData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Delete user (admin only)
  delete: async (id: string): Promise<{ message: string }> => {
    try {
      const response: { message: string } = await api.delete(API_CONFIG.ENDPOINTS.USERS.DELETE(id));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Activate user account
  activate: async (id: string): Promise<{ message: string }> => {
    try {
      const response: { message: string } = await api.patch(API_CONFIG.ENDPOINTS.USERS.UPDATE(id), {
        accountStatus: 'active'
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Suspend user account
  suspend: async (id: string, reason?: string): Promise<{ message: string }> => {
    try {
      const response: { message: string } = await api.patch(API_CONFIG.ENDPOINTS.USERS.UPDATE(id), {
        accountStatus: 'suspended'
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Verify user eligibility
  verifyEligibility: async (id: string, verificationData: {
    status: 'verified' | 'rejected';
    score?: number;
    notes?: string;
  }): Promise<{ message: string }> => {
    try {
      const response: { message: string } = await api.patch(`${API_CONFIG.ENDPOINTS.USERS.UPDATE(id)}/eligibility`, verificationData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Change user role (admin only)
  changeRole: async (id: string, newRole: UpdateUserData['role']): Promise<{ message: string }> => {
    try {
      const response: { message: string } = await api.patch(API_CONFIG.ENDPOINTS.USERS.UPDATE(id), {
        role: newRole
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Bulk actions on multiple users
  bulkAction: async (data: BulkActionData): Promise<{ message: string; results: any[] }> => {
    try {
      const response: { message: string; results: any[] } = await api.post(`${API_CONFIG.ENDPOINTS.USERS.GET_ALL}/bulk-action`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Search users
  search: async (query: string, filters?: Partial<UserFilters>): Promise<UsersResponse> => {
    try {
      const searchFilters: UserFilters = { search: query, ...filters };
      return await userService.getAll(searchFilters);
    } catch (error: any) {
      throw error;
    }
  },

  // Get users requiring verification
  getPendingVerification: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> => {
    try {
      const filters: UserFilters = {
        eligibilityStatus: 'pending',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        ...params
      };
      return await userService.getAll(filters);
    } catch (error: any) {
      throw error;
    }
  },

  // Get recently registered users
  getRecentRegistrations: async (days: number = 7): Promise<User[]> => {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const filters: UserFilters = {
        dateFrom: dateFrom.toISOString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50
      };

      const response = await userService.getAll(filters);
      return response.users;
    } catch (error: any) {
      throw error;
    }
  },

  // Get active staff members (case workers, finance managers, admins)
  getStaffMembers: async (): Promise<User[]> => {
    try {
      const [admins, caseWorkers, financeManagers] = await Promise.all([
        userService.getByRole('admin'),
        userService.getByRole('case_worker'),
        userService.getByRole('finance_manager')
      ]);

      return [
        ...admins.users,
        ...caseWorkers.users,
        ...financeManagers.users
      ].filter(user => user.accountStatus === 'active');
    } catch (error: any) {
      throw error;
    }
  },

  // Export users data
  export: async (format: 'csv' | 'json' = 'csv', filters?: UserFilters): Promise<Blob> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response: Blob = await api.get(`${API_CONFIG.ENDPOINTS.USERS.GET_ALL}/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // User document management
  uploadDocument: async (userId: string, data: UserDocumentUpload): Promise<UserDocumentResponse> => {
    try {
      const formData = new FormData();
      formData.append('document', data.file);
      formData.append('documentType', data.documentType);

      const response: UserDocumentResponse = await api.post(
        API_CONFIG.ENDPOINTS.USERS.UPLOAD_DOCUMENT(userId),
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getUserDocuments: async (userId: string): Promise<{ documents: any }> => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.USERS.GET_DOCUMENTS(userId));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  deleteDocument: async (userId: string, documentType: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.USERS.DELETE_DOCUMENT(userId, documentType));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  downloadDocument: async (userId: string, documentType: string): Promise<Blob> => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.USERS.DOWNLOAD_DOCUMENT(userId, documentType), {
        responseType: 'blob'
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Helper function to get role label
  getRoleLabel: (role: string): string => {
    const roleLabels: Record<string, string> = {
      'admin': 'Administrator',
      'case_worker': 'Case Worker',
      'finance_manager': 'Finance Manager',
      'user': 'User'
    };
    return roleLabels[role] || role;
  },

  // Helper function to get status label
  getStatusLabel: (status: string): string => {
    const statusLabels: Record<string, string> = {
      'active': 'Active',
      'pending_verification': 'Pending Verification',
      'inactive': 'Inactive',
      'suspended': 'Suspended'
    };
    return statusLabels[status] || status;
  },

  // Helper function to get eligibility status label
  getEligibilityLabel: (status: string): string => {
    const eligibilityLabels: Record<string, string> = {
      'pending': 'Pending Assessment',
      'verified': 'Verified',
      'rejected': 'Not Eligible'
    };
    return eligibilityLabels[status] || status;
  },

  // Helper function to get employment status label
  getEmploymentLabel: (status: string): string => {
    const employmentLabels: Record<string, string> = {
      'employed': 'Employed',
      'unemployed': 'Unemployed',
      'self_employed': 'Self Employed',
      'retired': 'Retired',
      'student': 'Student',
      'disabled': 'Disabled'
    };
    return employmentLabels[status] || status;
  },

  // Helper function to format user display name
  getUserDisplayName: (user: User): string => {
    return user.name || user.email || 'Unknown User';
  },

  // Helper function to check if user can be edited by current user
  canEdit: (user: User, currentUserRole: string): boolean => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'case_worker' && user.role === 'user') return true;
    return false;
  },

  // Helper function to check if user can be deleted by current user
  canDelete: (user: User, currentUserRole: string): boolean => {
    if (currentUserRole === 'admin' && user.role !== 'admin') return true;
    return false;
  },

  // Helper function to get user statistics summary
  getUserStatsSummary: (user: User): string => {
    const stats = user.statistics;
    if (!stats) return 'No activity data';

    const parts = [];
    if (stats.totalRequests) parts.push(`${stats.totalRequests} requests`);
    if (stats.approvedRequests) parts.push(`${stats.approvedRequests} approved`);
    if (stats.totalAmountReceived) {
      parts.push(`${stats.totalAmountReceived.toLocaleString()} DA received`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No activity';
  }
};

export default userService;