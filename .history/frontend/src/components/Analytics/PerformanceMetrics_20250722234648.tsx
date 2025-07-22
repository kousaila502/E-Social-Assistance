import React from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetricsProps {
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

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  requestProcessingTime,
  paymentSuccessRate,
  budgetUtilization
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDays = (days: number) => {
    if (days < 1) {
      return `${Math.round(days * 24)}h`;
    }
    return `${days.toFixed(1)}d`;
  };

  return (
    <div className="space-y-6">
      {/* Request Processing Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
            Request Processing Time
          </h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatDays(requestProcessingTime.average)}
            </div>
            <div className="text-sm text-gray-600">Average</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatDays(requestProcessingTime.median)}
            </div>
            <div className="text-sm text-gray-600">Median</div>
          </div>
          
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">
              {formatDays(requestProcessingTime.fastest)}
            </div>
            <div className="text-sm text-gray-600">Fastest</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {formatDays(requestProcessingTime.slowest)}
            </div>
            <div className="text-sm text-gray-600">Slowest</div>
          </div>
        </div>
      </div>

      {/* Payment Success Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            Payment Success Rate
          </h3>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={paymentSuccessRate.rate >= 90 ? "#10b981" : paymentSuccessRate.rate >= 75 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${(paymentSuccessRate.rate / 100) * 351.86} 351.86`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {paymentSuccessRate.rate}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {paymentSuccessRate.totalProcessed}
            </div>
            <div className="text-sm text-gray-600">Total Processed</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-green-600">
              {paymentSuccessRate.successful}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          
          <div>
            <div className="text-lg font-semibold text-red-600">
              {paymentSuccessRate.failed}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            Budget Utilization
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            {budgetUtilization.rate > 75 ? (
              <TrendingUpIcon className="h-4 w-4 mr-1 text-orange-500" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 mr-1 text-green-500" />
            )}
            {budgetUtilization.rate.toFixed(1)}% Utilized
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Budget Utilization</span>
            <span>{budgetUtilization.rate.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                budgetUtilization.rate > 90 ? 'bg-red-500' : 
                budgetUtilization.rate > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization.rate, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(budgetUtilization.allocated)}
            </div>
            <div className="text-sm text-gray-600">Allocated</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {formatCurrency(budgetUtilization.spent)}
            </div>
            <div className="text-sm text-gray-600">Spent</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(budgetUtilization.remaining)}
            </div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;