import axios, { AxiosResponse } from 'axios';
import { api } from '../utils/apiConfig';
import { Demande } from './types';

export interface Program {
  type: 'Content' | 'Announcement';
  id: string;
}

export interface CreateDemandeData {
  title: string;
  description: string;
  requestedAmount: number;
  program: Program;
  category?: string;
  urgencyLevel?: string;
}

export interface DemandeResponse {
  message: string;
  demande: Demande;
}

export interface DemandesResponse {
  demandes: Demande[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DashboardStats {
  statistics: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    averageProcessingTime: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
  }>;
}

const requestService = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response: AxiosResponse<DashboardStats> = await api.get('/demandes/dashboard-stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
  }): Promise<DemandesResponse> {
    try {
      const response: AxiosResponse<DemandesResponse> = await api.get('/demandes', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch requests');
    }
  },

  async getById(id: string): Promise<DemandeResponse> {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.get(`/demandes/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch request details');
    }
  },

  async create(data: CreateDemandeData): Promise<DemandeResponse> {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.post('/demandes', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create request');
    }
  },

  async update(id: string, data: Partial<CreateDemandeData>): Promise<DemandeResponse> {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.patch(`/demandes/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update request');
    }
  },

  async assign(id: string, assignedTo: string): Promise<DemandeResponse> {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.patch(`/demandes/${id}/assign`, { assignedTo });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to assign request');
    }
  },

  async cancel(id: string, reason?: string): Promise<DemandeResponse> {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.patch(`/demandes/${id}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel request');
    }
  },

  async submit(id: string): Promise<DemandeResponse> {
    try {
      const response: AxiosResponse<DemandeResponse> = await api.post(`/demandes/${id}/submit`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit request for review');
    }
  },

  async uploadDocuments(id: string, documents: File[]): Promise<{ message: string }> {
    try {
      const formData = new FormData();
      documents.forEach((doc, index) => {
        formData.append('documents', doc, doc.name);
      });
      const response: AxiosResponse<{ message: string }> = await api.post(`/demandes/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload documents');
    }
  },
};

export default requestService;