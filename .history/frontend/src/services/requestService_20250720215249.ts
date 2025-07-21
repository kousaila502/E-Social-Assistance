// src/services/requestService.ts
import api, { API_CONFIG, Demande, PaginationInfo } from '../config/apiConfig';

// Request creation interface (what we send to create a request)
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

// Update request interface
export interface UpdateDemandeData {
  title?: string;
  description?: string;
  requestedAmount?: number;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

// Review request interface (for staff)
export interface ReviewDemandeData {
  decision: 'approved' | 'rejected';
  approvedAmount?: number;
  reviewNotes?: string;
  rejectionCategory?: string;
  rejectionDescription?: string;
  budgetPoolId?: string;
}

// Comment interface
export interface AddCommentData {
  content: string;
  isInternal?: boolean;
}

// Request documents interface
export interface RequestDocumentsData {
  requestMessage: string;
  requiredDocuments: string[];
}

// Document verification interface
export interface VerifyDocumentData {
  isVerified: boolean;
  verificationNotes?: string;
}

// API response interfaces
export interface DemandesResponse {
  demandes: Demande[];
  pagination: PaginationInfo;
}

export interface DemandeResponse {
  demande: Demande;
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

const requestService = {
  // Get all requests with pagination and filters
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
  }): Promise<DemandesResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
      if (params?.search) queryParams.append('search', params.search);

      const url = `${API_CONFIG.ENDPOINTS.DEMANDES.GET_ALL}?${queryParams.toString()}`;
      const response = await api.get(url);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.DEMANDES.DASHBOARD_STATS);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get requests by status
  getByStatus: async (status: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<DemandesResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${API_CONFIG.ENDPOINTS.DEMANDES.BY_STATUS(status)}?${queryParams.toString()}`;
      const response = await api.get(url);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Create new request
  create: async (requestData: CreateDemandeData): Promise<DemandeResponse> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.DEMANDES.CREATE, requestData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get single request by ID
  getById: async (id: string): Promise<DemandeResponse> => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.DEMANDES.GET_BY_ID(id));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Update request
  update: async (id: string, updateData: UpdateDemandeData): Promise<DemandeResponse> => {
    try {
      const response = await api.patch(API_CONFIG.ENDPOINTS.DEMANDES.UPDATE(id), updateData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Submit request for review
  submit: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.DEMANDES.SUBMIT(id));
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Review request (Admin/Case Worker only)
  review: async (id: string, reviewData: ReviewDemandeData): Promise<{ message: string }> => {
    try {
      const response = await api.patch(API_CONFIG.ENDPOINTS.DEMANDES.REVIEW(id), reviewData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Assign request to case worker
  assign: async (id: string, assignedTo: string): Promise<{ message: string }> => {
    try {
      const response = await api.patch(API_CONFIG.ENDPOINTS.DEMANDES.ASSIGN(id), {
        assignedTo
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Cancel request
  cancel: async (id: string, reason?: string): Promise<{ message: string }> => {
    try {
      const response = await api.patch(API_CONFIG.ENDPOINTS.DEMANDES.CANCEL(id), {
        reason
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Add comment to request
  addComment: async (id: string, commentData: AddCommentData): Promise<{ message: string }> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.DEMANDES.ADD_COMMENT(id), commentData);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Upload documents for request
  uploadDocuments: async (id: string, files: File[]): Promise<{ message: string; documents: any[] }> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await api.post(API_CONFIG.ENDPOINTS.DEMANDES.UPLOAD_DOCUMENTS(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Verify document (Admin/Case Worker only)
  verifyDocument: async (
    requestId: string, 
    documentId: string, 
    verificationData: VerifyDocumentData
  ): Promise<{ message: string }> => {
    try {
      const response = await api.patch(
        API_CONFIG.ENDPOINTS.DEMANDES.VERIFY_DOCUMENT(requestId, documentId), 
        verificationData
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Request additional documents (Admin/Case Worker only)
  requestDocuments: async (
    id: string, 
    documentsData: RequestDocumentsData
  ): Promise<{ message: string }> => {
    try {
      const response = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.REQUEST_DOCUMENTS(id), 
        documentsData
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Export requests data
  export: async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.DEMANDES.EXPORT}?format=${format}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Helper function to get user's own requests
  getMyRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<DemandesResponse> => {
    try {
      // This will automatically filter by current user on the backend
      return await requestService.getAll(params);
    } catch (error: any) {
      throw error;
    }
  },

  // Helper function to get request status label
  getStatusLabel: (status: string): string => {
    const statusLabels: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'pending_docs': 'Pending Documents',
      'approved': 'Approved',
      'partially_paid': 'Partially Paid',
      'paid': 'Paid',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
  },

  // Helper function to get category label
  getCategoryLabel: (category: string): string => {
    const categoryLabels: Record<string, string> = {
      'medical': 'Medical',
      'education': 'Education',
      'housing': 'Housing',
      'food': 'Food Assistance',
      'employment': 'Employment',
      'disability': 'Disability Support',
      'elderly': 'Elderly Care',
      'child_welfare': 'Child Welfare',
      'other': 'Other'
    };
    return categoryLabels[category] || category;
  },

  // Helper function to get urgency level label
  getUrgencyLabel: (urgency: string): string => {
    const urgencyLabels: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };
    return urgencyLabels[urgency] || urgency;
  }
};

export default requestService;