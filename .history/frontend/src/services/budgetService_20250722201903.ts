// src/services/budgetService.ts - UPDATED TO MATCH BACKEND API
import api, { 
  API_CONFIG,
  BudgetPool,
  CreateBudgetPoolData,
  UpdateBudgetPoolData,
  AllocateFundsData,
  TransferFundsData,
  BudgetPoolFilters,
  BudgetPoolsResponse,
  BudgetPoolResponse,
  BudgetPoolStatsResponse,
  BudgetPoolAnalyticsResponse,
  PaginationInfo
} from '../config/apiConfig';

// =====================================================
// BUDGET SERVICE - FULL BACKEND INTEGRATION
// =====================================================

const budgetService = {
  // =====================================================
  // CORE CRUD OPERATIONS
  // =====================================================

  /**
   * Get all budget pools with advanced filtering, pagination, and search
   */
  getAll: async (filters: BudgetPoolFilters = {}): Promise<BudgetPoolsResponse> => {
    try {
      const params = new URLSearchParams();
      
      // Pagination
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      // Status and basic filters
      if (filters.status) params.append('status', filters.status);
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear.toString());
      if (filters.department) params.append('department', filters.department);
      if (filters.managedBy) params.append('managedBy', filters.managedBy);
      if (filters.programType) params.append('programType', filters.programType);
      if (filters.fundingSource) params.append('fundingSource', filters.fundingSource);
      if (filters.search) params.append('search', filters.search);
      
      // Sorting
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      // Amount filters
      if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
      
      // Date filters
      if (filters.startDateFrom) params.append('startDateFrom', filters.startDateFrom);
      if (filters.startDateTo) params.append('startDateTo', filters.startDateTo);
      if (filters.endDateFrom) params.append('endDateFrom', filters.endDateFrom);
      if (filters.endDateTo) params.append('endDateTo', filters.endDateTo);
      
      // Utilization filters
      if (filters.utilizationMin) params.append('utilizationMin', filters.utilizationMin.toString());
      if (filters.utilizationMax) params.append('utilizationMax', filters.utilizationMax.toString());

      const response: BudgetPoolsResponse = await api.get(
        `${API_CONFIG.ENDPOINTS.BUDGET_POOLS.GET_ALL}?${params.toString()}`
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching budget pools:', error);
      throw error;
    }
  },

  /**
   * Get single budget pool by ID with detailed information
   */
  getById: async (id: string): Promise<BudgetPoolResponse> => {
    try {
      const response: BudgetPoolResponse = await api.get(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.GET_BY_ID(id)
      );
      return response;
    } catch (error: any) {
      console.error(`Error fetching budget pool ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new budget pool
   */
  create: async (data: CreateBudgetPoolData): Promise<BudgetPoolResponse> => {
    try {
      const response: BudgetPoolResponse = await api.post(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.CREATE,
        data
      );
      return response;
    } catch (error: any) {
      console.error('Error creating budget pool:', error);
      throw error;
    }
  },

  /**
   * Update existing budget pool
   */
  update: async (id: string, data: UpdateBudgetPoolData): Promise<BudgetPoolResponse> => {
    try {
      const response: BudgetPoolResponse = await api.patch(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.UPDATE(id),
        data
      );
      return response;
    } catch (error: any) {
      console.error(`Error updating budget pool ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete budget pool (soft delete)
   */
  delete: async (id: string): Promise<{ message: string }> => {
    try {
      const response: { message: string } = await api.delete(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.DELETE(id)
      );
      return response;
    } catch (error: any) {
      console.error(`Error deleting budget pool ${id}:`, error);
      throw error;
    }
  },

  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================

  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats: async (): Promise<BudgetPoolStatsResponse> => {
    try {
      const response: BudgetPoolStatsResponse = await api.get(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.DASHBOARD_STATS
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching budget dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Get detailed analytics for a specific budget pool
   */
  getAnalytics: async (poolId: string): Promise<BudgetPoolAnalyticsResponse> => {
    try {
      const response: BudgetPoolAnalyticsResponse = await api.get(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.ANALYTICS(poolId)
      );
      return response;
    } catch (error: any) {
      console.error(`Error fetching analytics for pool ${poolId}:`, error);
      throw error;
    }
  },

  // =====================================================
  // FUND OPERATIONS
  // =====================================================

  /**
   * Allocate funds from budget pool to a request
   */
  allocateFunds: async (poolId: string, data: AllocateFundsData): Promise<{ message: string; allocation: any }> => {
    try {
      const response: { message: string; allocation: any } = await api.post(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.ALLOCATE(poolId),
        data
      );
      return response;
    } catch (error: any) {
      console.error(`Error allocating funds from pool ${poolId}:`, error);
      throw error;
    }
  },

  /**
   * Transfer funds between budget pools
   */
  transferFunds: async (poolId: string, data: TransferFundsData): Promise<{ message: string; transfer: any }> => {
    try {
      const response: { message: string; transfer: any } = await api.post(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.TRANSFER(poolId),
        data
      );
      return response;
    } catch (error: any) {
      console.error(`Error transferring funds from pool ${poolId}:`, error);
      throw error;
    }
  },

  /**
   * Confirm allocation (if supported by backend)
   */
  confirmAllocation: async (poolId: string, allocationId: string): Promise<{ message: string }> => {
    try {
      const response: { message: string } = await api.patch(
        API_CONFIG.ENDPOINTS.BUDGET_POOLS.CONFIRM_ALLOCATION(poolId, allocationId)
      );
      return response;
    } catch (error: any) {
      console.error(`Error confirming allocation ${allocationId} for pool ${poolId}:`, error);
      throw error;
    }
  },

  // =====================================================
  // STATUS MANAGEMENT OPERATIONS
  // =====================================================

  /**
   * Activate budget pool
   */
  activate: async (poolId: string): Promise<BudgetPoolResponse> => {
    try {
      const response = await budgetService.update(poolId, { status: 'active' });
      return response;
    } catch (error: any) {
      console.error(`Error activating pool ${poolId}:`, error);
      throw error;
    }
  },

  /**
   * Freeze budget pool
   */
  freeze: async (poolId: string): Promise<BudgetPoolResponse> => {
    try {
      const response = await budgetService.update(poolId, { status: 'frozen' });
      return response;
    } catch (error: any) {
      console.error(`Error freezing pool ${poolId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel budget pool
   */
  cancel: async (poolId: string): Promise<BudgetPoolResponse> => {
    try {
      const response = await budgetService.update(poolId, { status: 'cancelled' });
      return response;
    } catch (error: any) {
      console.error(`Error cancelling pool ${poolId}:`, error);
      throw error;
    }
  },

  // =====================================================
  // UTILITY AND HELPER FUNCTIONS
  // =====================================================

  /**
   * Get budget pools by department
   */
  getByDepartment: async (department: string): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getAll({ department, limit: 100 });
      return response.budgetPools;
    } catch (error: any) {
      console.error(`Error fetching pools for department ${department}:`, error);
      throw error;
    }
  },

  /**
   * Get budget pools by fiscal year
   */
  getByFiscalYear: async (fiscalYear: number): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getAll({ fiscalYear, limit: 100 });
      return response.budgetPools;
    } catch (error: any) {
      console.error(`Error fetching pools for fiscal year ${fiscalYear}:`, error);
      throw error;
    }
  },

  /**
   * Get active budget pools only
   */
  getActive: async (): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getAll({ status: 'active', limit: 100 });
      return response.budgetPools;
    } catch (error: any) {
      console.error('Error fetching active pools:', error);
      throw error;
    }
  },

  /**
   * Get pools by funding source
   */
  getByFundingSource: async (fundingSource: BudgetPool['fundingSource']): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getAll({ fundingSource, limit: 100 });
      return response.budgetPools;
    } catch (error: any) {
      console.error(`Error fetching pools for funding source ${fundingSource}:`, error);
      throw error;
    }
  },

  /**
   * Check if pool has sufficient funds for allocation
   */
  checkAvailableFunds: async (poolId: string, amount: number): Promise<{ 
    canAllocate: boolean; 
    availableAmount: number;
    pool: BudgetPool;
  }> => {
    try {
      const poolResponse = await budgetService.getById(poolId);
      const pool = poolResponse.budgetPool;
      const availableAmount = pool.availableAmount || 0;
      
      return {
        canAllocate: availableAmount >= amount,
        availableAmount,
        pool
      };
    } catch (error: any) {
      console.error(`Error checking funds for pool ${poolId}:`, error);
      throw error;
    }
  },

  /**
   * Get pools nearing expiration (within specified days)
   */
  getExpiringPools: async (days: number = 30): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getAll({ status: 'active', limit: 100 });
      const currentDate = new Date();
      const thresholdDate = new Date(currentDate.getTime() + (days * 24 * 60 * 60 * 1000));
      
      return response.budgetPools.filter(pool => {
        const endDate = new Date(pool.budgetPeriod.endDate);
        return endDate <= thresholdDate && endDate > currentDate;
      });
    } catch (error: any) {
      console.error('Error fetching expiring pools:', error);
      throw error;
    }
  },

  /**
   * Get pools with low balance (below threshold percentage)
   */
  getLowBalancePools: async (thresholdPercentage: number = 20): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getAll({ status: 'active', limit: 100 });
      
      return response.budgetPools.filter(pool => {
        const availableAmount = pool.availableAmount || 0;
        const balancePercentage = (availableAmount / pool.totalAmount) * 100;
        return balancePercentage <= thresholdPercentage;
      });
    } catch (error: any) {
      console.error('Error fetching low balance pools:', error);
      throw error;
    }
  },

  /**
   * Get pools with critical balance (below critical threshold)
   */
  getCriticalBalancePools: async (thresholdPercentage: number = 5): Promise<BudgetPool[]> => {
    try {
      const response = await budgetService.getAll({ status: 'active', limit: 100 });
      
      return response.budgetPools.filter(pool => {
        const availableAmount = pool.availableAmount || 0;
        const balancePercentage = (availableAmount / pool.totalAmount) * 100;
        return balancePercentage <= thresholdPercentage;
      });
    } catch (error: any) {
      console.error('Error fetching critical balance pools:', error);
      throw error;
    }
  },

  // =====================================================
  // FORMATTING AND DISPLAY HELPERS
  // =====================================================

  /**
   * Format budget pool status for display
   */
  formatStatus: (status: BudgetPool['status']): string => {
    const statusLabels = {
      draft: 'Draft',
      active: 'Active',
      frozen: 'Frozen',
      depleted: 'Depleted',
      expired: 'Expired',
      cancelled: 'Cancelled',
      transferred: 'Transferred'
    };
    return statusLabels[status] || status;
  },

  /**
   * Get status color for UI
   */
  getStatusColor: (status: BudgetPool['status']): string => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      frozen: 'bg-blue-100 text-blue-800',
      depleted: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      transferred: 'bg-purple-100 text-purple-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  /**
   * Format funding source for display
   */
  formatFundingSource: (source: BudgetPool['fundingSource']): string => {
    const sourceLabels = {
      government: 'Government',
      donations: 'Donations',
      grants: 'Grants',
      internal: 'Internal',
      international: 'International',
      other: 'Other'
    };
    return sourceLabels[source] || source;
  },

  /**
   * Calculate utilization percentage
   */
  calculateUtilization: (pool: BudgetPool): number => {
    if (!pool.totalAmount || pool.totalAmount === 0) return 0;
    return Math.round((pool.spentAmount / pool.totalAmount) * 100);
  },

  /**
   * Get utilization status color
   */
  getUtilizationColor: (utilizationRate: number): string => {
    if (utilizationRate <= 50) return 'text-green-600';
    if (utilizationRate <= 80) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Format currency amount
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Calculate days until expiration
   */
  getDaysUntilExpiration: (pool: BudgetPool): number => {
    const endDate = new Date(pool.budgetPeriod.endDate);
    const currentDate = new Date();
    const diffTime = endDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },

  /**
   * Check if pool is expired
   */
  isExpired: (pool: BudgetPool): boolean => {
    const endDate = new Date(pool.budgetPeriod.endDate);
    return endDate < new Date();
  },

  /**
   * Get allocation status color
   */
  getAllocationStatusColor: (status: string): string => {
    const statusColors: Record<string, string> = {
      reserved: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

export default budgetService;