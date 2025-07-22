import { API_CONFIG } from '../config/apiConfig';

export interface SystemOverview {
  totalUsers: number;
  totalRequests: number;
  totalPayments: number;
  totalBudget: number;
  activeAnnouncements: number;
  monthlyGrowth: {
    users: number;
    requests: number;
    payments: number;
  };
}

export interface TrendData {
  period: string;
  users: number;
  requests: number;
  payments: number;
  budget: number;
  [key: string]: string | number; // Add index signature
}

export interface CategoryInsights {
  requestCategories: Array<{
    category: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
  userRoles: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
}

export interface PerformanceMetrics {
  requestProcessingTime: {
    average: number;
    median: number;
    fastest: number;
    slowest: number;
  };
  paymentSuccessRate: {
    rate: number;
    totalProcessed: number;
    successful: number;
    failed: number;
  };
  budgetUtilization: {
    rate: number;
    allocated: number;
    spent: number;
    remaining: number;
  };
}

export interface GeographicData {
  wilayas: Array<{
    name: string;
    users: number;
    requests: number;
    totalAmount: number;
  }>;
}

export interface AnalyticsDashboard {
  overview: SystemOverview;
  trends: TrendData[];
  categories: CategoryInsights;
  performance: PerformanceMetrics;
  geographic: GeographicData;
  lastUpdated: string;
}

class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics(): Promise<AnalyticsDashboard> {
    // Fetch data from all modules in parallel
    const [
      userStats,
      requestStats,
      paymentStats,
      budgetStats,
      announcementStats
    ] = await Promise.all([
      this.getUserAnalytics(),
      this.getRequestAnalytics(),
      this.getPaymentAnalytics(),
      this.getBudgetAnalytics(),
      this.getAnnouncementAnalytics()
    ]);

    // Combine and process data
    return this.combineAnalytics({
      userStats,
      requestStats,
      paymentStats,
      budgetStats,
      announcementStats
    });
  }

  /**
   * Get user analytics
   */
  private async getUserAnalytics() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.DASHBOARD_STATS}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user analytics');
    }
    
    return response.json();
  }

  /**
   * Get request analytics
   */
  private async getRequestAnalytics() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEMANDES.DASHBOARD_STATS}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch request analytics');
    }
    
    return response.json();
  }

  /**
   * Get payment analytics
   */
  private async getPaymentAnalytics() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENTS.DASHBOARD_STATS}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment analytics');
    }
    
    return response.json();
  }

  /**
   * Get budget analytics
   */
  private async getBudgetAnalytics() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BUDGET_POOLS.DASHBOARD_STATS}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch budget analytics');
    }
    
    return response.json();
  }

  /**
   * Get announcement analytics
   */
  private async getAnnouncementAnalytics() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.STATS}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch announcement analytics');
    }
    
    return response.json();
  }

  /**
   * Combine analytics from all modules
   */
  private combineAnalytics(data: any): AnalyticsDashboard {
    const { userStats, requestStats, paymentStats, budgetStats, announcementStats } = data;

    // System Overview
    const overview: SystemOverview = {
      totalUsers: userStats.statistics?.totalUsers || 0,
      totalRequests: requestStats.statistics?.totalRequests || 0,
      totalPayments: paymentStats.statistics?.totalPayments || 0,
      totalBudget: budgetStats.statistics?.totalBudget || 0,
      activeAnnouncements: announcementStats.statistics?.overall?.totalAnnouncements || 0,
      monthlyGrowth: {
        users: userStats.statistics?.newUsersThisMonth || 0,
        requests: this.calculateMonthlyGrowth(requestStats.monthlyStats),
        payments: this.calculateMonthlyGrowth(paymentStats.monthlyStats)
      }
    };

    // Trends (mock data for last 12 months)
    const trends: TrendData[] = this.generateTrendData(data);

    // Category Insights
    const categories: CategoryInsights = {
      requestCategories: requestStats.categoryBreakdown || [],
      paymentMethods: paymentStats.methodBreakdown || [],
      userRoles: userStats.statistics?.roleDistribution || []
    };

    // Performance Metrics
    const performance: PerformanceMetrics = {
      requestProcessingTime: {
        average: 3.2, // Could be calculated from backend
        median: 2.8,
        fastest: 0.5,
        slowest: 14.2
      },
      paymentSuccessRate: {
        rate: this.calculateSuccessRate(paymentStats.statistics),
        totalProcessed: paymentStats.statistics?.totalPayments || 0,
        successful: paymentStats.statistics?.completedPayments || 0,
        failed: paymentStats.statistics?.failedPayments || 0
      },
      budgetUtilization: {
        rate: budgetStats.statistics?.avgUtilization * 100 || 0, // Convert to percentage
        allocated: budgetStats.statistics?.totalAllocated || 0,
        spent: budgetStats.statistics?.totalSpent || 0,
        remaining: budgetStats.statistics?.remainingBudget || 0
      }
    };

    // Geographic Data
    const geographic: GeographicData = {
      wilayas: userStats.statistics?.topWilayas || []
    };

    return {
      overview,
      trends,
      categories,
      performance,
      geographic,
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateMonthlyGrowth(monthlyStats: any[]): number {
    if (!monthlyStats || monthlyStats.length < 2) return 0;
    
    const current = monthlyStats[0]?.count || 0;
    const previous = monthlyStats[1]?.count || 0;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    
    return Math.round(((current - previous) / previous) * 100);
  }

  private calculateSuccessRate(paymentStats: any): number {
    const total = paymentStats?.totalPayments || 0;
    const successful = paymentStats?.completedPayments || 0;
    
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
  }

  private generateTrendData(data: any): TrendData[] {
    // Generate 12 months of trend data
    const trends: TrendData[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      trends.push({
        period,
        users: Math.floor(Math.random() * 100) + 50, // Mock data
        requests: Math.floor(Math.random() * 200) + 100,
        payments: Math.floor(Math.random() * 150) + 75,
        budget: Math.floor(Math.random() * 500000) + 250000
      });
    }
    
    return trends;
  }

  /**
   * Format currency amounts
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Format large numbers
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

export default new AnalyticsService();