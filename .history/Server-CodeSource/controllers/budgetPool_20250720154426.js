const { StatusCodes } = require('http-status-codes');
const BudgetPool = require('../models/budgetPool');
const User = require('../models/user');
const Demande = require('../models/demande');
const Payment = require('../models/payment');
const Content = require('../models/content');
const Announcement = require('../models/announcement');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

// Generate unique pool number
const generatePoolNumber = (year, department) => {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const deptCode = department.substring(0, 3).toUpperCase();
  return `BP-${year}-${deptCode}-${randomNum}`;
};

// Validate fiscal year
const validateFiscalYear = (year) => {
  const currentYear = new Date().getFullYear();
  return year >= 2020 && year <= 2100 && year >= currentYear - 5;
};

// Calculate pool statistics
const calculatePoolStats = (pool) => {
  const totalAmount = pool.totalAmount || 0;
  const allocatedAmount = pool.allocatedAmount || 0;
  const reservedAmount = pool.reservedAmount || 0;
  const spentAmount = pool.spentAmount || 0;
  
  const remainingAmount = totalAmount - spentAmount;
  const availableAmount = totalAmount - allocatedAmount - reservedAmount;
  const utilizationRate = totalAmount > 0 ? ((spentAmount / totalAmount) * 100).toFixed(2) : 0;
  
  return {
    remainingAmount,
    availableAmount,
    utilizationRate: parseFloat(utilizationRate)
  };
};

const createBudgetPool = async (req, res) => {
  const { role } = req.user;
  
  // Check permissions - only admin and finance_manager can create
  if (role !== 'admin' && role !== 'finance_manager') {
    throw new CustomError.UnauthorizedError('Not authorized to create budget pools');
  }

  const {
    name,
    description,
    totalAmount,
    fiscalYear,
    budgetPeriod,
    program,
    department,
    fundingSource
  } = req.body;

  // Validate required fields
  if (!name || !description || !totalAmount || !fiscalYear || !budgetPeriod || !department) {
    throw new CustomError.BadRequestError('Missing required fields');
  }

  // Validate fiscal year
  if (!validateFiscalYear(fiscalYear)) {
    throw new CustomError.BadRequestError('Invalid fiscal year');
  }

  // Validate budget period dates
  const startDate = new Date(budgetPeriod.startDate);
  const endDate = new Date(budgetPeriod.endDate);
  if (endDate <= startDate) {
    throw new CustomError.BadRequestError('End date must be after start date');
  }

  // Validate amount
  if (totalAmount <= 0) {
    throw new CustomError.BadRequestError('Total amount must be greater than 0');
  }

  // Generate pool number
  const poolNumber = generatePoolNumber(fiscalYear, department);

  // Validate program if provided
  if (program && program.type && program.id) {
    let programExists = false;
    if (program.type === 'Content') {
      programExists = await Content.findById(program.id);
    } else if (program.type === 'Announcement') {
      programExists = await Announcement.findById(program.id);
    }
    
    if (!programExists) {
      throw new CustomError.BadRequestError('Invalid program reference');
    }
  }

  const budgetPool = await BudgetPool.create({
    poolNumber,
    name,
    description,
    totalAmount,
    fiscalYear,
    budgetPeriod: {
      startDate,
      endDate
    },
    program,
    department,
    fundingSource,
    status: 'draft',
    managedBy: req.user.userId,
    createdBy: req.user.userId,
    allocatedAmount: 0,
    reservedAmount: 0,
    spentAmount: 0,
    allocations: [],
    transfers: [],
    statusHistory: [{
      status: 'draft',
      changedBy: req.user.userId,
      changedAt: new Date(),
      reason: 'Initial creation'
    }]
  });

  const populatedPool = await BudgetPool.findById(budgetPool._id)
    .populate('managedBy', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email');

  res.status(StatusCodes.CREATED).json({
    message: 'Budget pool created successfully',
    budgetPool: populatedPool
  });
};

const getAllBudgetPools = async (req, res) => {
  const { role, userId } = req.user;
  
  // Build filter object
  let filter = { isDeleted: { $ne: true } };
  
  // Role-based access
  if (role === 'finance_manager') {
    filter.managedBy = userId;
  }
  
  // Apply filters
  const {
    status,
    fiscalYear,
    department,
    managedBy,
    programType,
    minAmount,
    maxAmount,
    search
  } = req.query;

  if (status) filter.status = status;
  if (fiscalYear) filter.fiscalYear = parseInt(fiscalYear);
  if (department) filter.department = new RegExp(department, 'i');
  if (managedBy && role === 'admin') filter.managedBy = managedBy;
  if (programType) filter['program.type'] = programType;
  
  if (minAmount || maxAmount) {
    filter.totalAmount = {};
    if (minAmount) filter.totalAmount.$gte = parseFloat(minAmount);
    if (maxAmount) filter.totalAmount.$lte = parseFloat(maxAmount);
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { poolNumber: new RegExp(search, 'i') }
    ];
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const budgetPools = await BudgetPool.find(filter)
    .populate('managedBy', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await BudgetPool.countDocuments(filter);

  // Calculate statistics
  const stats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalBudgets: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalAllocated: { $sum: '$allocatedAmount' },
        totalSpent: { $sum: '$spentAmount' },
        avgUtilization: { $avg: { $divide: ['$spentAmount', '$totalAmount'] } }
      }
    }
  ]);

  const statistics = stats[0] || {
    totalBudgets: 0,
    totalAmount: 0,
    totalAllocated: 0,
    totalSpent: 0,
    avgUtilization: 0
  };

  res.status(StatusCodes.OK).json({
    message: 'Budget pools retrieved successfully',
    budgetPools,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    statistics
  });
};

const getSingleBudgetPool = async (req, res) => {
  const { id: poolId } = req.params;
  const { role, userId } = req.user;

  const budgetPool = await BudgetPool.findById(poolId)
    .populate('managedBy', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('allocations.demande')
    .populate('allocations.allocatedBy', 'firstName lastName email')
    .populate('transfers.fromPool', 'name poolNumber')
    .populate('transfers.toPool', 'name poolNumber')
    .populate('transfers.transferredBy', 'firstName lastName email');

  if (!budgetPool) {
    throw new CustomError.NotFoundError(`No budget pool with id: ${poolId}`);
  }

  // Check permissions
  if (role === 'finance_manager' && budgetPool.managedBy._id.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to view this budget pool');
  }

  // Calculate real-time statistics
  const statistics = calculatePoolStats(budgetPool);

  // Get related demandes and payments
  const relatedDemandes = await Demande.find({
    'budgetAllocation.budgetPool': poolId
  }).populate('user', 'firstName lastName email');

  const relatedPayments = await Payment.find({
    budgetPool: poolId
  }).populate('demande');

  res.status(StatusCodes.OK).json({
    message: 'Budget pool retrieved successfully',
    budgetPool: {
      ...budgetPool.toObject(),
      statistics
    },
    relatedDemandes,
    relatedPayments
  });
};

const updateBudgetPool = async (req, res) => {
  const { id: poolId } = req.params;
  const { role, userId } = req.user;

  // Check permissions
  if (role !== 'admin' && role !== 'finance_manager') {
    throw new CustomError.UnauthorizedError('Not authorized to update budget pools');
  }

  const existingPool = await BudgetPool.findById(poolId);
  if (!existingPool) {
    throw new CustomError.NotFoundError(`No budget pool with id: ${poolId}`);
  }

  // Finance manager can only update their own pools
  if (role === 'finance_manager' && existingPool.managedBy.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to update this budget pool');
  }

  const { name, description, totalAmount, status, allocationRules } = req.body;

  // Validate total amount reduction
  if (totalAmount !== undefined && totalAmount < existingPool.allocatedAmount) {
    throw new CustomError.BadRequestError('Cannot reduce total amount below allocated amount');
  }

  const updateData = {
    ...(name && { name }),
    ...(description && { description }),
    ...(totalAmount && { totalAmount }),
    ...(status && { status }),
    ...(allocationRules && { allocationRules }),
    updatedBy: userId,
    updatedAt: new Date()
  };

  // Add status history if status changed
  if (status && status !== existingPool.status) {
    updateData.$push = {
      statusHistory: {
        status,
        changedBy: userId,
        changedAt: new Date(),
        reason: req.body.statusReason || 'Status updated'
      }
    };
  }

  const budgetPool = await BudgetPool.findByIdAndUpdate(
    poolId,
    updateData,
    { new: true, runValidators: true }
  ).populate('managedBy', 'firstName lastName email')
   .populate('updatedBy', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: 'Budget pool updated successfully',
    budgetPool
  });
};

const activateBudgetPool = async (req, res) => {
  const { id: poolId } = req.params;
  const { role, userId } = req.user;

  // Only admin can activate
  if (role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only admin can activate budget pools');
  }

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError(`No budget pool with id: ${poolId}`);
  }

  // Validate activation requirements
  if (budgetPool.status !== 'draft') {
    throw new CustomError.BadRequestError('Only draft budget pools can be activated');
  }

  if (budgetPool.totalAmount <= 0) {
    throw new CustomError.BadRequestError('Budget pool must have a total amount greater than 0');
  }

  if (!budgetPool.budgetPeriod.startDate || !budgetPool.budgetPeriod.endDate) {
    throw new CustomError.BadRequestError('Budget pool must have valid period dates');
  }

  const updatedPool = await BudgetPool.findByIdAndUpdate(
    poolId,
    {
      status: 'active',
      activatedBy: userId,
      activatedAt: new Date(),
      $push: {
        statusHistory: {
          status: 'active',
          changedBy: userId,
          changedAt: new Date(),
          reason: 'Budget pool activated'
        }
      }
    },
    { new: true, runValidators: true }
  ).populate('managedBy', 'firstName lastName email')
   .populate('activatedBy', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: 'Budget pool activated successfully',
    budgetPool: updatedPool
  });
};

const allocateFunds = async (req, res) => {
  const { id: poolId } = req.params;
  const { demandeId, amount, notes } = req.body;
  const { role, userId } = req.user;

  // Check permissions
  if (role !== 'admin' && role !== 'finance_manager') {
    throw new CustomError.UnauthorizedError('Not authorized to allocate funds');
  }

  // Validate required fields
  if (!demandeId || !amount || amount <= 0) {
    throw new CustomError.BadRequestError('Valid demande ID and amount are required');
  }

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError(`No budget pool with id: ${poolId}`);
  }

  // Check pool status
  if (budgetPool.status !== 'active') {
    throw new CustomError.BadRequestError('Can only allocate from active budget pools');
  }

  // Verify demande exists and is approved
  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError(`No demande with id: ${demandeId}`);
  }

  if (demande.status !== 'approved') {
    throw new CustomError.BadRequestError('Can only allocate to approved demandes');
  }

  // Check available funds
  const statistics = calculatePoolStats(budgetPool);
  if (amount > statistics.availableAmount) {
    throw new CustomError.BadRequestError('Insufficient available funds in budget pool');
  }

  // Create allocation record
  const allocation = {
    demande: demandeId,
    amount,
    allocatedBy: userId,
    allocatedAt: new Date(),
    status: 'reserved',
    notes: notes || ''
  };

  const updatedPool = await BudgetPool.findByIdAndUpdate(
    poolId,
    {
      $push: { allocations: allocation },
      $inc: { 
        allocatedAmount: amount,
        reservedAmount: amount 
      }
    },
    { new: true, runValidators: true }
  ).populate('managedBy', 'firstName lastName email');

  // Update demande with budget allocation
  await Demande.findByIdAndUpdate(demandeId, {
    'budgetAllocation.budgetPool': poolId,
    'budgetAllocation.allocatedAmount': amount,
    'budgetAllocation.allocatedAt': new Date(),
    'budgetAllocation.allocatedBy': userId
  });

  res.status(StatusCodes.OK).json({
    message: 'Funds allocated successfully',
    budgetPool: updatedPool,
    allocation
  });
};

const transferFunds = async (req, res) => {
  const { id: sourcePoolId } = req.params;
  const { targetPoolId, amount, reason } = req.body;
  const { role, userId } = req.user;

  // Check permissions
  if (role !== 'admin' && role !== 'finance_manager') {
    throw new CustomError.UnauthorizedError('Not authorized to transfer funds');
  }

  // Validate required fields
  if (!targetPoolId || !amount || amount <= 0 || !reason) {
    throw new CustomError.BadRequestError('Target pool, amount, and reason are required');
  }

  const sourcePool = await BudgetPool.findById(sourcePoolId);
  const targetPool = await BudgetPool.findById(targetPoolId);

  if (!sourcePool) {
    throw new CustomError.NotFoundError(`No source budget pool with id: ${sourcePoolId}`);
  }

  if (!targetPool) {
    throw new CustomError.NotFoundError(`No target budget pool with id: ${targetPoolId}`);
  }

  // Check pool statuses
  if (sourcePool.status !== 'active' || targetPool.status !== 'active') {
    throw new CustomError.BadRequestError('Both pools must be active for transfers');
  }

  // Check available funds in source pool
  const sourceStats = calculatePoolStats(sourcePool);
  if (amount > sourceStats.availableAmount) {
    throw new CustomError.BadRequestError('Insufficient available funds in source pool');
  }

  // Determine approval requirement (admin approval for transfers > 10000)
  const requiresApproval = amount > 10000 && role !== 'admin';
  const transferStatus = requiresApproval ? 'pending' : 'approved';

  const transferRecord = {
    type: 'outgoing',
    amount,
    fromPool: sourcePoolId,
    toPool: targetPoolId,
    transferredBy: userId,
    transferredAt: new Date(),
    reason,
    status: transferStatus
  };

  const incomingTransferRecord = {
    type: 'incoming',
    amount,
    fromPool: sourcePoolId,
    toPool: targetPoolId,
    transferredBy: userId,
    transferredAt: new Date(),
    reason,
    status: transferStatus
  };

  if (transferStatus === 'approved') {
    // Execute transfer immediately
    await BudgetPool.findByIdAndUpdate(sourcePoolId, {
      $push: { transfers: transferRecord },
      $inc: { totalAmount: -amount }
    });

    await BudgetPool.findByIdAndUpdate(targetPoolId, {
      $push: { transfers: incomingTransferRecord },
      $inc: { totalAmount: amount }
    });

    res.status(StatusCodes.OK).json({
      message: 'Funds transferred successfully',
      transfer: transferRecord
    });
  } else {
    // Add pending transfer records
    await BudgetPool.findByIdAndUpdate(sourcePoolId, {
      $push: { transfers: transferRecord }
    });

    await BudgetPool.findByIdAndUpdate(targetPoolId, {
      $push: { transfers: incomingTransferRecord }
    });

    res.status(StatusCodes.OK).json({
      message: 'Transfer submitted for approval',
      transfer: transferRecord
    });
  }
};

const getDashboardStats = async (req, res) => {
  const { role, userId } = req.user;
  
  // Build filter based on role
  let filter = { isDeleted: { $ne: true } };
  if (role === 'finance_manager') {
    filter.managedBy = userId;
  }

  // Overall statistics
  const overallStats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalPools: { $sum: 1 },
        totalBudget: { $sum: '$totalAmount' },
        totalAllocated: { $sum: '$allocatedAmount' },
        totalSpent: { $sum: '$spentAmount' },
        totalReserved: { $sum: '$reservedAmount' }
      }
    }
  ]);

  // Statistics by department
  const departmentStats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$department',
        poolCount: { $sum: 1 },
        totalBudget: { $sum: '$totalAmount' },
        totalSpent: { $sum: '$spentAmount' },
        avgUtilization: { $avg: { $divide: ['$spentAmount', '$totalAmount'] } }
      }
    },
    { $sort: { totalBudget: -1 } }
  ]);

  // Statistics by fiscal year
  const yearlyStats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$fiscalYear',
        poolCount: { $sum: 1 },
        totalBudget: { $sum: '$totalAmount' },
        totalSpent: { $sum: '$spentAmount' },
        utilizationRate: { $avg: { $divide: ['$spentAmount', '$totalAmount'] } }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  // Status distribution
  const statusStats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const overall = overallStats[0] || {
    totalPools: 0,
    totalBudget: 0,
    totalAllocated: 0,
    totalSpent: 0,
    totalReserved: 0
  };

  const remainingBudget = overall.totalBudget - overall.totalSpent;
  const utilizationRate = overall.totalBudget > 0 ? 
    ((overall.totalSpent / overall.totalBudget) * 100).toFixed(2) : 0;

  res.status(StatusCodes.OK).json({
    message: 'Dashboard statistics retrieved successfully',
    statistics: {
      overall: {
        ...overall,
        remainingBudget,
        utilizationRate: parseFloat(utilizationRate)
      },
      byDepartment: departmentStats,
      byYear: yearlyStats,
      byStatus: statusStats
    }
  });
};

const getPoolAnalytics = async (req, res) => {
  const { id: poolId } = req.params;
  const { role, userId } = req.user;

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError(`No budget pool with id: ${poolId}`);
  }

  // Check permissions
  if (role === 'finance_manager' && budgetPool.managedBy.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to view analytics for this pool');
  }

  // Calculate detailed analytics
  const statistics = calculatePoolStats(budgetPool);

  // Allocation patterns
  const allocationAnalytics = budgetPool.allocations.map(allocation => ({
    month: allocation.allocatedAt.getMonth() + 1,
    year: allocation.allocatedAt.getFullYear(),
    amount: allocation.amount,
    status: allocation.status
  }));

  // Monthly spending trend (from payments)
  const spendingTrend = await Payment.aggregate([
    { $match: { budgetPool: budgetPool._id } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalSpent: { $sum: '$amount' },
        paymentCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Performance metrics
  const totalDays = Math.ceil((budgetPool.budgetPeriod.endDate - budgetPool.budgetPeriod.startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((new Date() - budgetPool.budgetPeriod.startDate) / (1000 * 60 * 60 * 24));
  const timeProgress = Math.min((elapsedDays / totalDays) * 100, 100);
  
  const budgetBurnRate = statistics.utilizationRate;
  const projectedCompletion = budgetBurnRate > 0 ? (100 / (budgetBurnRate / timeProgress)) * timeProgress : null;

  res.status(StatusCodes.OK).json({
    message: 'Pool analytics retrieved successfully',
    analytics: {
      basicStats: statistics,
      allocationPatterns: allocationAnalytics,
      spendingTrend,
      performance: {
        timeProgress: parseFloat(timeProgress.toFixed(2)),
        budgetProgress: statistics.utilizationRate,
        projectedCompletion,
        efficiency: timeProgress > 0 ? (statistics.utilizationRate / timeProgress).toFixed(2) : 0
      }
    }
  });
};

const deleteBudgetPool = async (req, res) => {
  const { id: poolId } = req.params;
  const { role, userId } = req.user;

  // Only admin can delete
  if (role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only admin can delete budget pools');
  }

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError(`No budget pool with id: ${poolId}`);
  }

  // Check for active allocations
  const activeAllocations = budgetPool.allocations.filter(allocation => 
    allocation.status === 'reserved' || allocation.status === 'active'
  );

  if (activeAllocations.length > 0) {
    throw new CustomError.BadRequestError('Cannot delete pool with active allocations');
  }

  // Check for pending transfers
  const pendingTransfers = budgetPool.transfers.filter(transfer => 
    transfer.status === 'pending'
  );

  if (pendingTransfers.length > 0) {
    throw new CustomError.BadRequestError('Cannot delete pool with pending transfers');
  }

  // Soft delete
  await BudgetPool.findByIdAndUpdate(poolId, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
    status: 'cancelled'
  });

  res.status(StatusCodes.OK).json({
    message: 'Budget pool deleted successfully'
  });
};

module.exports = {
  createBudgetPool,
  getAllBudgetPools,
  getSingleBudgetPool,
  updateBudgetPool,
  activateBudgetPool,
  allocateFunds,
  transferFunds,
  getDashboardStats,
  getPoolAnalytics,
  deleteBudgetPool,
  
  // Legacy functions for backward compatibility
  getBudget: getAllBudgetPools,
  pushBudget: allocateFunds,
  popBudget: (req, res) => {
    throw new CustomError.BadRequestError('Please use allocateFunds endpoint for fund allocation');
  },
  createBudget: createBudgetPool
};
