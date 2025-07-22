import axios, { AxiosResponse } from 'axios';
import { api, Demande, PaginationInfo } from '../config/apiConfig';

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

// API response interfaces (matching your backend Swagger schema)
export interface DemandesResponse {
  demandes: Demande[];
  pagination: PaginationInfo;
}

export interface DemandeResponse {
  message: string;
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
      const response: AxiosResponse<DemandesResponse> = await api.get('/demandes', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch requests');
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    try {
      const response: AxiosResponse<DashboardStatsResponse> = await api.get('/demandes/dashboard-stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
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

      const response: AxiosResponse<DemandesResponse> = await api.get(`/demandes/status/${status}?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch requests by status');
    }
  },

  // Create new request
  create: async (requestData: CreateDemandeData): Promise<DemandeResponse> => {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.post('/demandes', requestData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create request');
    }
  },

  // Get single request by ID
  getById: async (id: string): Promise<DemandeResponse> => {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.get(`/demandes/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch request details');
    }
  },

  // Update request
  update: async (id: string, updateData: UpdateDemandeData): Promise<DemandeResponse> => {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.patch(`/demandes/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update request');
    }
  },

  // Submit request for review
  submit: async (id: string): Promise<DemandeResponse> => {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.post(`/demandes/${id}/submit`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit request for review');
    }
  },

  // Review request (Admin/Case Worker only)
  review: async (id: string, reviewData: ReviewDemandeData): Promise<DemandeResponse> => {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.patch(`/demandes/${id}/review`, reviewData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to review request');
    }
  },

  // Assign request to case worker
  assign: async (id: string, assignedTo: string): Promise<DemandeResponse> => {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.patch(`/demandes/${id}/assign`, { assignedTo });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to assign request');
    }
  },

  // Cancel request
  cancel: async (id: string, reason?: string): Promise<DemandeResponse> => {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.patch(`/demandes/${id}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel request');
    }
  },

  // Add comment to request
  addComment: async (id: string, commentData: AddCommentData): Promise<{ message: string }> => {
    try {
      const response: AxiosResponse<{ message: string }> = await api.post(`/demandes/${id}/comments`, commentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  },

  // Upload documents for request
  uploadDocuments: async (id: string, files: File[]): Promise<{ message: string }> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const response: AxiosResponse<{ message: string }> = await api.post(`/demandes/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload documents');
    }
  },

  // Verify document (Admin/Case Worker only)
  verifyDocument: async (
    requestId: string, 
    documentId: string, 
    verificationData: VerifyDocumentData
  ): Promise<{ message: string }> => {
    try {
      const response: AxiosResponse<{ message: string }> = await api.patch(
        `/demandes/${requestId}/documents/${documentId}`, 
        verificationData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify document');
    }
  },

  // Request additional documents (Admin/Case Worker only)
  requestDocuments: async (
    id: string, 
    documentsData: RequestDocumentsData
  ): Promise<{ message: string }> => {
    try {
      const response: AxiosResponse<{ message: string }> = await api.post(
        `/demandes/${id}/request-documents`, 
        documentsData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request documents');
    }
  },

  // Export requests data
  export: async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    try {
      const response: AxiosResponse<Blob> = await api.get(`/demandes/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export requests');
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
      throw new Error(error.response?.data?.message || 'Failed to fetch my requests');
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