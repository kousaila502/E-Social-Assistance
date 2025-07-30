import { AxiosResponse } from 'axios';
import api, {
  Demande,
  DemandeResponse,
  DemandesResponse,
  DashboardStatsResponse,
  MessageResponse,
  CreateDemandeData,
  UpdateDemandeData,
  ReviewDemandeData,
  AddCommentData,
  AssignDemandeData,
  CancelDemandeData,
  VerifyDocumentData,
  RequestDocumentsData,
  DemandeQueryParams,
  API_CONFIG,
  RequestDocument,
  RequestComment,
  StatusHistoryEntry
} from '../config/apiConfig';

const requestService = {
  // 🔥 GET ALL REQUESTS - FIXED: No .data access since interceptor handles it
  getAll: async (params?: DemandeQueryParams): Promise<DemandesResponse> => {
    try {
      const response: DemandesResponse = await api.get(
        API_CONFIG.ENDPOINTS.DEMANDES.GET_ALL,
        { params }
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch requests');
    }
  },

  // 🔥 GET DASHBOARD STATS - FIXED: No .data access since interceptor handles it
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    try {
      const response: DashboardStatsResponse = await api.get(
        API_CONFIG.ENDPOINTS.DEMANDES.DASHBOARD_STATS
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch dashboard statistics');
    }
  },

  // 🔥 GET REQUESTS BY STATUS - FIXED: No .data access since interceptor handles it
  getByStatus: async (status: string, params?: { page?: number; limit?: number }): Promise<DemandesResponse> => {
    try {
      const response: DemandesResponse = await api.get(
        API_CONFIG.ENDPOINTS.DEMANDES.BY_STATUS(status),
        { params }
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch requests by status');
    }
  },

  // 🔥 CREATE REQUEST - ENHANCED ERROR HANDLING
  create: async (requestData: CreateDemandeData): Promise<DemandeResponse | MessageResponse> => {
    try {
      const response = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.CREATE,
        requestData
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // 🔥 GET SINGLE REQUEST - FIXED: No .data access since interceptor handles it
  getById: async (id: string): Promise<DemandeResponse> => {
    try {
      const response: DemandeResponse = await api.get(
        API_CONFIG.ENDPOINTS.DEMANDES.GET_BY_ID(id)
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch request');
    }
  },

  // 🔥 UPDATE REQUEST - FIXED: No .data access since interceptor handles it
  update: async (id: string, updateData: UpdateDemandeData): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.patch(
        API_CONFIG.ENDPOINTS.DEMANDES.UPDATE(id),
        updateData
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update request');
    }
  },



  // 🔥 SUBMIT REQUEST - FIXED: No .data access since interceptor handles it
  submit: async (id: string): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.SUBMIT(id)
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to submit request');
    }
  },

  // 🔥 REVIEW REQUEST - FIXED: No .data access since interceptor handles it
  review: async (id: string, reviewData: ReviewDemandeData): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.patch(
        API_CONFIG.ENDPOINTS.DEMANDES.REVIEW(id),
        reviewData
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to review request');
    }
  },

  // 🔥 ASSIGN REQUEST - FIXED: No .data access since interceptor handles it
  assign: async (id: string, assignData: AssignDemandeData): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.patch(
        API_CONFIG.ENDPOINTS.DEMANDES.ASSIGN(id),
        assignData
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to assign request');
    }
  },

  // 🔥 CANCEL REQUEST - FIXED: No .data access since interceptor handles it
  cancel: async (id: string, cancelData?: CancelDemandeData): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.patch(
        API_CONFIG.ENDPOINTS.DEMANDES.CANCEL(id),
        cancelData || {}
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to cancel request');
    }
  },

  // 🔥 ADD COMMENT - FIXED: No .data access since interceptor handles it
  addComment: async (id: string, commentData: AddCommentData): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.ADD_COMMENT(id),
        commentData
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to add comment');
    }
  },

  // 🔥 UPLOAD DOCUMENTS - FIXED: No .data access since interceptor handles it
  uploadDocuments: async (id: string, files: File[]): Promise<MessageResponse> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const response: MessageResponse = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.UPLOAD_DOCUMENTS(id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to upload documents');
    }
  },

  // 🔥 VERIFY DOCUMENT - FIXED: No .data access since interceptor handles it
  verifyDocument: async (
    requestId: string,
    documentId: string,
    verificationData: VerifyDocumentData
  ): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.patch(
        API_CONFIG.ENDPOINTS.DEMANDES.VERIFY_DOCUMENT(requestId, documentId),
        verificationData
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to verify document');
    }
  },

  // 🔥 REQUEST ADDITIONAL DOCUMENTS - FIXED: No .data access since interceptor handles it
  requestDocuments: async (
    id: string,
    documentsData: RequestDocumentsData
  ): Promise<MessageResponse> => {
    try {
      const response: MessageResponse = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.REQUEST_DOCUMENTS(id),
        documentsData
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to request additional documents');
    }
  },

  // 🔥 EXPORT REQUESTS - SPECIAL CASE: Keep AxiosResponse for Blob handling
  export: async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    try {
      // For blob responses, the interceptor still returns the blob directly
      const response: Blob = await api.get(
        `${API_CONFIG.ENDPOINTS.DEMANDES.EXPORT}?format=${format}`,
        { responseType: 'blob' }
      );
      return response;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to export requests');
    }
  },

  // 🔥 HELPER FUNCTIONS - STATUS/CATEGORY/PRIORITY LABELS (matching backend enums)

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
      'cancelled': 'Cancelled',
      'expired': 'Expired'
    };
    return statusLabels[status] || status;
  },

  getCategoryLabel: (category: string): string => {
    const categoryLabels: Record<string, string> = {
      'emergency_assistance': 'Emergency Assistance',
      'educational_support': 'Educational Support',
      'medical_assistance': 'Medical Assistance',
      'housing_support': 'Housing Support',
      'food_assistance': 'Food Assistance',
      'employment_support': 'Employment Support',
      'elderly_care': 'Elderly Care',
      'disability_support': 'Disability Support',
      'other': 'Other'
    };
    return categoryLabels[category] || category;
  },

  getPriorityLabel: (priority: string): string => {
    const priorityLabels: Record<string, string> = {
      'low': 'Low',
      'normal': 'Normal',
      'high': 'High',
      'urgent': 'Urgent'
    };
    return priorityLabels[priority] || priority;
  },

  getUrgencyLabel: (urgency: string): string => {
    const urgencyLabels: Record<string, string> = {
      'routine': 'Routine',
      'important': 'Important',
      'urgent': 'Urgent',
      'critical': 'Critical'
    };
    return urgencyLabels[urgency] || urgency;
  },

  // Status color helpers for UI
  getStatusColor: (status: string): string => {
    const statusColors: Record<string, string> = {
      'draft': 'gray',
      'submitted': 'blue',
      'under_review': 'yellow',
      'pending_docs': 'orange',
      'approved': 'green',
      'partially_paid': 'indigo',
      'paid': 'emerald',
      'rejected': 'red',
      'cancelled': 'gray',
      'expired': 'red'
    };
    return statusColors[status] || 'gray';
  },

  getPriorityColor: (priority: string): string => {
    const priorityColors: Record<string, string> = {
      'low': 'green',
      'normal': 'blue',
      'high': 'yellow',
      'urgent': 'red'
    };
    return priorityColors[priority] || 'gray';
  },

  getUrgencyColor: (urgency: string): string => {
    const urgencyColors: Record<string, string> = {
      'routine': 'green',
      'important': 'blue',
      'urgent': 'orange',
      'critical': 'red'
    };
    return urgencyColors[urgency] || 'gray';
  }
};

export default requestService;

// Export types for use in components
export type {
  Demande,
  CreateDemandeData,
  UpdateDemandeData,
  ReviewDemandeData,
  AddCommentData,
  AssignDemandeData,
  CancelDemandeData,
  VerifyDocumentData,
  RequestDocumentsData,
  DemandeQueryParams,
  DemandeResponse,
  DemandesResponse,
  DashboardStatsResponse,
  MessageResponse,
  RequestDocument,
  RequestComment,
  StatusHistoryEntry
};