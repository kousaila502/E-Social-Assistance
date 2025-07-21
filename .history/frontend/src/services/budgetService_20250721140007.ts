// src/services/budgetService.ts
import api, { API_CONFIG } from '../config/apiConfig';

// Budget Pool interfaces based on backend API schema
export interface BudgetPool {
  _id: string;
  name: string;
  description: string;
  totalAmount: number;
  allocatedAmount: number;
  reservedAmount: number;
  spentAmount: number;
  availableAmount: number;
  utilizationRate: number;
  status: 'draft' | 'active' | 'frozen' | 'depleted' | 'expired' | 'cancelled' | 'transferred';
  fiscalYear: number;
  department: string;
  fundingSource: string;
  managedBy: {
    _id: string;
    name: string;
    email: string;
  };
  budgetPeriod: {
    startDate: string;
    endDate: string;
  };
  program?: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  allocationRules?: {
    maxAmountPerRequest?: number;
    maxRequestsPerUser?: number;
    allowedCategories?: string[];
    eligibilityThreshold?: number;
  };
  alertThresholds?: {
    lowBalanceWarning?: number;
    criticalBalanceAlert?: number;
    expirationWarning?: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBudgetPoolData {
  name: string;
  description: string;
  totalAmount: number;
  fiscalYear: number;
  budgetPeriod: {
    startDate: string;
    endDate: string;
  };
  department: string;
  fundingSource: 'government' | 'donations' | 'grants' | 'internal' | 'international' | 'other';
  program?: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  allocationRules?: {
    maxAmountPerRequest?: number;
    maxRequestsPerUser?: number;
    allowedCategories?: string[];
    eligibilityThreshold?: number;
  };
  alertThresholds?: {
    lowBalanceWarning?: number;
    criticalBalanceAlert?: number;
    expirationWarning?: number;
  };
}

export interface UpdateBudgetPoolData {
  name?: string;
  description?: string;
  totalAmount?: number;
  status?: BudgetPool['status'];
  allocationRules?: {
    maxAmountPerRequest?: number;
    maxRequestsPerUser?: number;
    allowedCategories?: string[];
    eligibilityThreshold?: number;
  };
  alertThresholds?: {
    lowBalanceWarning?: number;
    criticalBalanceAlert?: number;
    expirationWarning?: number;
  };
}

export interface AllocateFundsData {
  demandeId: string;
  amount: number;
  notes?: string;
}

export interface TransferFundsData {
  targetPoolId: string;
  amount: number;
  reason: string;
}

export interface BudgetPoolsResponse {
  budgetPools: BudgetPool[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BudgetPoolResponse {
  budgetPool: BudgetPool;
  analytics?: any;
  alerts?: any[];
}

export interface BudgetDashboardStats {
  statistics: {
    totalBudgetPools: number;
    activePools: number;
    totalAllocated: number;
    totalSpent: number;
    averageUtilization: number;
    poolsNearDepletion: number;
    poolsExpiring: number;
    departmentBreakdown: {
      department: string;
      totalAmount: number;
      spentAmount: number;
      utilizationRate: number;
    }[];
    monthlySpending: {
      month: string;
      amount: number;
    }[];
  };
  recentActivity: {
    type: string;
    poolName: string;
    amount: number;
    timestamp: string;
  }[];
}

export interface BudgetPoolAnalytics {
  utilizationTrend: {
    date: string;
    utilization: number;
  }[];
  spendingByCategory: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  requestsProcessed: {
    approved: number;
    rejected: number;
    pending: number;
  };
  averageRequestAmount: number;
  topBeneficiaries: {
    name: string;
    amount: number;
    requestCount: number;
  }[];
}

export interface BudgetPoolFilters {
  page?: number;
  limit?: number;
  status?: BudgetPool['status'];
  fiscalYear?: number;
  department?: string;
  search?: string;
}

const budgetService = {
  // Get all budget pools with filters
  getBudgetPools: async (filters: BudgetPoolFilters = {}): Promise<BudgetPoolsResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear.toString());
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.BUDGET_POOLS}?${params.toString()}`
      );
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Get single budget pool by ID
  getBudgetPool: async (id: string): Promise<BudgetPoolResponse> => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${id}`);
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Create new budget pool
  createBudgetPool: async (data: CreateBudgetPoolData): Promise<{ message: string; budgetPool: BudgetPool }> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.BUDGET_POOLS, data);
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Update budget pool
  updateBudgetPool: async (id: string, data: UpdateBudgetPoolData): Promise<{ message: string; budgetPool: BudgetPool }> => {
    try {
      const response = await api.patch(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${id}`, data);
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Delete budget pool
  deleteBudgetPool: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${id}`);
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Allocate funds from budget pool to a request
  allocateFunds: async (poolId: string, data: AllocateFundsData): Promise<{ message: string }> => {
    try {
      const response = await api.post(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${poolId}/allocate`, data);
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Transfer funds between budget pools
  transferFunds: async (poolId: string, data: TransferFundsData): Promise<{ message: string }> => {
    try {
      const response = await api.post(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${poolId}/transfer`, data);
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Get budget dashboard statistics
  getDashboardStats: async (): Promise<BudgetDashboardStats> => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/dashboard-stats`);
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Get budget pool analytics
  getPoolAnalytics: async (
    poolId: string, 
    period: '3months' | '6months' | '1year' = '6months'
  ): Promise<BudgetPoolAnalytics> => {
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${poolId}/analytics?period=${period}`
      );
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Activate budget pool
  activatePool: async (poolId: string): Promise<{ message: string }> => {
    try {
      const response = await api.patch(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${poolId}`, {
        status: 'active'
      });
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Freeze budget pool
  freezePool: async (poolId: string): Promise<{ message: string }> => {
    try {
      const response = await api.patch(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${poolId}`, {
        status: 'frozen'
      });
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Cancel budget pool
  cancelPool: async (poolId: string): Promise<{ message: string }> => {
    try {
      const response = await api.patch(`${API_CONFIG.ENDPOINTS.BUDGET_POOLS}/${poolId}`, {
        status: 'cancelled'
      });
      return response; // API interceptor handles response.data
    } catch (error: any) {
      throw error;
    }
  },

  // Get budget pools by department
  getPoolsByDepartment: async (department: string): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getBudgetPools({ department });
      return response.budgetPools;
    } catch (error: any) {
      throw error;
    }
  },

  // Get budget pools by fiscal year
  getPoolsByFiscalYear: async (fiscalYear: number): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getBudgetPools({ fiscalYear });
      return response.budgetPools;
    } catch (error: any) {
      throw error;
    }
  },

  // Get active budget pools only
  getActivePools: async (): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getBudgetPools({ status: 'active' });
      return response.budgetPools;
    } catch (error: any) {
      throw error;
    }
  },

  // Check if pool has sufficient funds for allocation
  checkPoolBalance: async (poolId: string, amount: number): Promise<{ canAllocate: boolean; availableAmount: number }> => {
    try {
      const poolData = await budgetService.getBudgetPool(poolId);
      const availableAmount = poolData.budgetPool.availableAmount;
      
      return {
        canAllocate: availableAmount >= amount,
        availableAmount: availableAmount
      };
    } catch (error: any) {
      throw error;
    }
  },

  // Get pools nearing expiration (within specified days)
  getPoolsNearExpiration: async (days: number = 30): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getBudgetPools();
      const currentDate = new Date();
      const thresholdDate = new Date(currentDate.getTime() + (days * 24 * 60 * 60 * 1000));
      
      return response.budgetPools.filter(pool => {
        const endDate = new Date(pool.budgetPeriod.endDate);
        return endDate <= thresholdDate && endDate > currentDate && pool.status === 'active';
      });
    } catch (error: any) {
      throw error;
    }
  },

  // Get pools with low balance (below threshold percentage)
  getPoolsWithLowBalance: async (thresholdPercentage: number = 20): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getBudgetPools({ status: 'active' });
      
      return response.budgetPools.filter(pool => {
        const balancePercentage = (pool.availableAmount / pool.totalAmount) * 100;
        return balancePercentage <= thresholdPercentage;
      });
    } catch (error: any) {
      throw error;
    }
  }
};

export default budgetService;