import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface WilayaData {
  name: string;
  users: number;
  requests: number;
  totalAmount: number;
}

interface GeographicInsightsProps {
  wilayas: WilayaData[];
}

const GeographicInsights: React.FC<GeographicInsightsProps> = ({ wilayas }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const maxUsers = Math.max(...wilayas.map(w => w.users));
  const maxRequests = Math.max(...wilayas.map(w => w.requests));
  const maxAmount = Math.max(...wilayas.map(w => w.totalAmount));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
          Geographic Distribution
        </h3>
      </div>

      <div className="space-y-4">
        {wilayas.slice(0, 10).map((wilaya, index) => (
          <div key={wilaya.name} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </div>
                <h4 className="font-medium text-gray-900">{wilaya.name}</h4>
              </div>
              <div className="text-sm text-gray-500">
                {formatCurrency(wilaya.totalAmount)}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Users */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Users</span>
                  <span className="font-medium">{wilaya.users}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(wilaya.users / maxUsers) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Requests */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Requests</span>
                  <span className="font-medium">{wilaya.requests}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(wilaya.requests / maxRequests) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Amount */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">
                    {(wilaya.totalAmount / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(wilaya.totalAmount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {wilayas.length > 10 && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Wilayas ({wilayas.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default GeographicInsights;