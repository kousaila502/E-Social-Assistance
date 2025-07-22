import { AxiosResponse } from 'axios';

  // 🔥 ADD COMMENT - EXACT BACKEND ALIGNMENT
  addComment: async (id: string, commentData: AddCommentData): Promise<MessageResponse> => {
    try {
      const response: AxiosResponse<MessageResponse> = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.ADD_COMMENT(id),
        commentData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  },

  // 🔥 UPLOAD DOCUMENTS - EXACT BACKEND ALIGNMENT
  uploadDocuments: async (id: string, files: File[]): Promise<MessageResponse> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const response: AxiosResponse<MessageResponse> = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.UPLOAD_DOCUMENTS(id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload documents');
    }
  },

  // 🔥 VERIFY DOCUMENT - EXACT BACKEND ALIGNMENT (Admin/Case Worker only)
  verifyDocument: async (
    requestId: string,
    documentId: string,
    verificationData: VerifyDocumentData
  ): Promise<MessageResponse> => {
    try {
      const response: AxiosResponse<MessageResponse> = await api.patch(
        API_CONFIG.ENDPOINTS.DEMANDES.VERIFY_DOCUMENT(requestId, documentId),
        verificationData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to verify document');
    }
  },

  // 🔥 REQUEST ADDITIONAL DOCUMENTS - EXACT BACKEND ALIGNMENT (Admin/Case Worker only)
  requestDocuments: async (
    id: string,
    documentsData: RequestDocumentsData
  ): Promise<MessageResponse> => {
    try {
      const response: AxiosResponse<MessageResponse> = await api.post(
        API_CONFIG.ENDPOINTS.DEMANDES.REQUEST_DOCUMENTS(id),
        documentsData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to request additional documents');
    }
  },

  // 🔥 EXPORT REQUESTS - EXACT BACKEND ALIGNMENT (Admin/Case Worker only)
  export: async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    try {
      const response: AxiosResponse<Blob> = await api.get(
        `${API_CONFIG.ENDPOINTS.DEMANDES.EXPORT}?format=${format}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export requests');
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