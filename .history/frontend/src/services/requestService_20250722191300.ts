import { AxiosResponse } from 'axios';


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