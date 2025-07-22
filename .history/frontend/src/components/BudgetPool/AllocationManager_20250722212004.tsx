// src/components/BudgetPool/AllocationManager.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import budgetService from '../../services/budgetService';
import { BudgetPool } from '../../config/apiConfig';
import requestService from '../../services/requestService';
import { Demande } from '../../config/apiConfig';
import { 
  DollarSign, 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  Users,
  Calendar
} from 'lucide-react';

interface AllocationFormData {
  demandeId: string;
  budgetPoolId: string;
  amount: number;
  notes: string;
}

const AllocationManager: React.FC = () => {
  const { user, hasAnyRole } = useAuth();
  const [approvedRequests, setApprovedRequests] = useState<Demande[]>([]);
  const [budgetPools, setBudgetPools] = useState<BudgetPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [selectedRequest, setSelectedRequest] = useState<Demande | null>(null);
  const [allocationForm, setAllocationForm] = useState<AllocationFormData>({
    demandeId: '',
    budgetPoolId: '',
    amount: 0,
    notes: ''
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Check permissions
  const canAllocateFunds = hasAnyRole(['admin', 'finance_manager']);

  useEffect(() => {
    if (!canAllocateFunds) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [requestsData, poolsData] = await Promise.all([
          requestService.getByStatus('approved'),
          budgetService.getActivePools()
        ]);

        setApprovedRequests(requestsData.demandes || []);
        setBudgetPools(poolsData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canAllocateFunds]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle request selection
  const handleSelectRequest = (request: Demande) => {
    setSelectedRequest(request);
    setAllocationForm({
      demandeId: request._id,
      budgetPoolId: '',
      amount: request.approvedAmount || request.requestedAmount,
      notes: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Handle form changes
  const handleFormChange = (field: keyof AllocationFormData, value: string | number) => {
    setAllocationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle allocation submission
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allocationForm.demandeId || !allocationForm.budgetPoolId || allocationForm.amount <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setAllocating(true);
      setError(null);

      await budgetService.allocateFunds(allocationForm.budgetPoolId, {
        demandeId: allocationForm.demandeId,
        amount: allocationForm.amount,
        notes: allocationForm.notes
      });

      setSuccess('Funds allocated successfully');
      
      // Reset form and refresh data
      setSelectedRequest(null);
      setAllocationForm({
        demandeId: '',
        budgetPoolId: '',
        amount: 0,
        notes: ''
      });

      // Refresh data
      const [requestsData, poolsData] = await Promise.all([
        requestService.getByStatus('approved'),
        budgetService.getActivePools()
      ]);

      setApprovedRequests(requestsData.demandes || []);
      setBudgetPools(poolsData);

    } catch (err: any) {
      console.error('Error allocating funds:', err);
      setError(err?.message || 'Failed to allocate funds');
    } finally {
      setAllocating(false);
    }
  };

  // Filter requests
  const filteredRequests = approvedRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.applicant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || request.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get selected budget pool
  const selectedBudgetPool = budgetPools.find(pool => pool._id === allocationForm.budgetPoolId);

  if (!canAllocateFunds) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            You don't have permission to allocate budget funds.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading allocation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Allocation Manager</h1>
            <p className="text-gray-600 mt-1">
              Allocate funds from budget pools to approved requests
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Approved Requests ({filteredRequests.length})
            </h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="housing">Housing</option>
                <option value="food">Food</option>
                <option value="employment">Employment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600">No approved requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request._id}
                  onClick={() => handleSelectRequest(request)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRequest?._id === request._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{request.title}</h4>
                      <p className="text-sm text-gray-600">
                        by {request.applicant.name}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {request.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(request.approvedAmount || request.requestedAmount)}
                      </p>
                      {request.urgencyLevel && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          request.urgencyLevel === 'critical' 
                            ? 'bg-red-100 text-red-800'
                            : request.urgencyLevel === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.urgencyLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Allocation Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocate Funds</h3>

          {!selectedRequest ? (
            <div className="text-center py-12">
              <ArrowRight className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600">Select a request to allocate funds</p>
            </div>
          ) : (
            <form onSubmit={handleAllocate} className="space-y-4">
              {/* Selected Request Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Selected Request</h4>
                <p className="text-sm text-gray-600">{selectedRequest.title}</p>
                <p className="text-sm text-gray-500">
                  Requested: {formatCurrency(selectedRequest.requestedAmount)}
                  {selectedRequest.approvedAmount && (
                    <span className="ml-2">
                      | Approved: {formatCurrency(selectedRequest.approvedAmount)}
                    </span>
                  )}
                </p>
              </div>

              {/* Budget Pool Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Budget Pool *
                </label>
                <select
                  value={allocationForm.budgetPoolId}
                  onChange={(e) => handleFormChange('budgetPoolId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose budget pool...</option>
                  {budgetPools.map((pool) => (
                    <option key={pool._id} value={pool._id}>
                      {pool.name} - Available: {formatCurrency(pool.availableAmount)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocation Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={allocationForm.amount}
                    onChange={(e) => handleFormChange('amount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {selectedBudgetPool && allocationForm.amount > selectedBudgetPool.availableAmount && (
                  <p className="mt-1 text-sm text-red-600">
                    Amount exceeds available budget ({formatCurrency(selectedBudgetPool.availableAmount)})
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocation Notes
                </label>
                <textarea
                  value={allocationForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional notes about this allocation..."
                />
              </div>

              {/* Budget Pool Info */}
              {selectedBudgetPool && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Budget Pool Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Total:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedBudgetPool.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Available:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedBudgetPool.availableAmount)}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Allocated:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedBudgetPool.allocatedAmount)}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Utilization:</span>
                      <span className="ml-2 font-medium">{selectedBudgetPool.utilizationRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={allocating || !selectedBudgetPool || allocationForm.amount > selectedBudgetPool.availableAmount}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {allocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Allocating...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Allocate Funds
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllocationManager;