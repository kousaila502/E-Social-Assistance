const { StatusCodes } = require('http-status-codes');
const BudgetPool = require('../models/budgetPool');
const User = require('../models/user');
const Demande = require('../models/demande');
const Payment = require('../models/payment');
const Content = require('../models/content');
const Announcement = require('../models/announcement');
const Notification = require('../models/notification');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

/**
 * Create Budget Pool
 * Create new budget pool with comprehensive validation
 */
const createBudgetPool = async (req, res) => {
  const {
    name,
    description,
    totalAmount,
    fiscalYear,
    budgetPeriod,
    program,
    department,
    fundingSource,
    managedBy,
    allocationRules = {},
    alertThresholds = {},
    externalReference
  } = req.body;

  // Only admin and finance_manager can create budget pools
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and finance managers can create budget pools');
  }

  // Input validation
  if (!name || !description || !totalAmount || !fiscalYear || !budgetPeriod || !department || !fundingSource) {
    throw new CustomError.BadRequestError(
      'Please provide name, description, total amount, fiscal year, budget period, department, and funding source'
    );
  }

  // Validate fiscal year
  const currentYear = new Date().getFullYear();
  if (fiscalYear < 2020 || fiscalYear > 2100 || fiscalYear < currentYear - 5) {
    throw new CustomError.BadRequestError('Invalid fiscal year. Must be between 2020-2100 and not more than 5 years in the past');
  }

  // Validate total amount
  if (totalAmount <= 0 || totalAmount > 100000000) {
    throw new CustomError.BadRequestError('Total amount must be between 1 and 100,000,000 DA');
  }

  // Validate budget period dates
  const startDate = new Date(budgetPeriod.startDate);
  const endDate = new Date(budgetPeriod.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new CustomError.BadRequestError('Invalid budget period dates');
  }

  if (endDate <= startDate) {
    throw new CustomError.BadRequestError('End date must be after start date');
  }

  // Validate budget period duration (not more than 5 years)
  const durationYears = (endDate - startDate) / (365.25 * 24 * 60 * 60 * 1000);
  if (durationYears > 5) {
    throw new CustomError.BadRequestError('Budget period cannot exceed 5 years');
  }

  // Validate program reference if provided
  if (program && program.type && program.id) {
    let programEntity;
    if (program.type === 'Content') {
      programEntity = await Content.findById(program.id);
    } else if (program.type === 'Announcement') {
      programEntity = await Announcement.findById(program.id);
    }

    if (!programEntity) {
      throw new CustomError.BadRequestError('Invalid program reference');
    }
  }

  // Validate manager exists and has appropriate role
  let poolManager = req.user.userId;
  if (managedBy && req.user.role === 'admin') {
    const manager = await User.findById(managedBy);
    if (!manager) {
      throw new CustomError.NotFoundError('Specified manager not found');
    }
    if (!['admin', 'finance_manager'].includes(manager.role)) {
      throw new CustomError.BadRequestError('Manager must be admin or finance manager');
    }
    poolManager = managedBy;
  }

  // Validate funding source
  const validSources = ['government', 'donations', 'grants', 'internal', 'international', 'other'];
  if (!validSources.includes(fundingSource)) {
    throw new CustomError.BadRequestError('Invalid funding source');
  }

  // Check for duplicate pool names in same fiscal year and department
  const existingPool = await BudgetPool.findOne({
    name: name.trim(),
    fiscalYear,
    department: department.trim(),
    isDeleted: false
  });

  if (existingPool) {
    throw new CustomError.BadRequestError('A budget pool with this name already exists for this fiscal year and department');
  }

  // Create budget pool
  const budgetPoolData = {
    name: name.trim(),
    description: description.trim(),
    totalAmount,
    fiscalYear,
    budgetPeriod: { startDate, endDate },
    program,
    department: department.trim(),
    fundingSource,
    managedBy: poolManager,
    allocationRules: {
      maxAmountPerRequest: allocationRules.maxAmountPerRequest || null,
      maxRequestsPerUser: allocationRules.maxRequestsPerUser || null,
      allowedCategories: allocationRules.allowedCategories || [],
      eligibilityThreshold: allocationRules.eligibilityThreshold || 50,
      requiresApproval: allocationRules.requiresApproval !== false,
      autoApprovalLimit: allocationRules.autoApprovalLimit || 0
    },
    alertThresholds: {
      lowBalanceWarning: alertThresholds.lowBalanceWarning || 20,
      criticalBalanceAlert: alertThresholds.criticalBalanceAlert || 5,
      expirationWarning: alertThresholds.expirationWarning || 30
    },
    externalReference: externalReference?.trim(),
    status: 'draft',
    createdBy: req.user.userId
  };

  const budgetPool = await BudgetPool.create(budgetPoolData);

  // Create notification for manager if different from creator
  if (poolManager !== req.user.userId) {
    await createNotification({
      recipient: poolManager,
      type: 'system',
      title: 'Budget Pool Assignment',
      message: `You have been assigned as manager for budget pool "${name}".`,
      relatedEntities: { budgetPool: budgetPool._id },
      channels: { inApp: { enabled: true }, email: { enabled: true } }
    });
  }

  const populatedPool = await BudgetPool.findById(budgetPool._id)
    .populate('managedBy', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('program.id', 'name title description');

  res.status(StatusCodes.CREATED).json({
    message: 'Budget pool created successfully',
    budgetPool: populatedPool
  });
};

/**
 * Confirm Allocation
 * Change allocation status from reserved to confirmed
 */
const confirmAllocation = async (req, res) => {
  const { id: poolId, allocationId } = req.params;
  const { status, notes } = req.body;

  // Only admin and finance_manager can confirm allocations
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and finance managers can confirm allocations');
  }

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError('Budget pool not found');
  }

  // Find the allocation
  const allocation = budgetPool.allocations.id(allocationId);
  if (!allocation) {
    throw new CustomError.NotFoundError('Allocation not found');
  }

  // Validate status
  const validStatuses = ['reserved', 'confirmed', 'paid', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new CustomError.BadRequestError('Invalid allocation status');
  }

  // Update allocation
  allocation.status = status;
  if (notes) allocation.notes = notes;
  
  budgetPool.updatedBy = req.user.userId;
  await budgetPool.save();

  res.status(StatusCodes.OK).json({
    message: 'Allocation status updated successfully',
    allocation
  });
};



/**
 * Get All Budget Pools
 * Advanced filtering, pagination, and search
 */
const getAllBudgetPools = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    fiscalYear,
    department,
    managedBy,
    programType,
    fundingSource,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minAmount,
    maxAmount,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    utilizationMin,
    utilizationMax
  } = req.query;

  // Build filter object
  const filter = { isDeleted: false };

  // Role-based access control
  if (req.user.role === 'finance_manager') {
    filter.managedBy = req.user.userId;
  }

  // Status filtering
  if (status) {
    filter.status = { $in: status.split(',') };
  }

  // Fiscal year filtering
  if (fiscalYear) {
    filter.fiscalYear = Number(fiscalYear);
  }

  // Department filtering
  if (department) {
    filter.department = new RegExp(department, 'i');
  }

  // Manager filtering (admin only)
  if (managedBy && req.user.role === 'admin') {
    filter.managedBy = managedBy;
  }

  // Program type filtering
  if (programType) {
    filter['program.type'] = programType;
  }

  // Funding source filtering
  if (fundingSource) {
    filter.fundingSource = { $in: fundingSource.split(',') };
  }

  // Amount range filtering
  if (minAmount || maxAmount) {
    filter.totalAmount = {};
    if (minAmount) filter.totalAmount.$gte = Number(minAmount);
    if (maxAmount) filter.totalAmount.$lte = Number(maxAmount);
  }

  // Budget period filtering
  if (startDateFrom || startDateTo) {
    filter['budgetPeriod.startDate'] = {};
    if (startDateFrom) filter['budgetPeriod.startDate'].$gte = new Date(startDateFrom);
    if (startDateTo) filter['budgetPeriod.startDate'].$lte = new Date(startDateTo);
  }

  if (endDateFrom || endDateTo) {
    filter['budgetPeriod.endDate'] = {};
    if (endDateFrom) filter['budgetPeriod.endDate'].$gte = new Date(endDateFrom);
    if (endDateTo) filter['budgetPeriod.endDate'].$lte = new Date(endDateTo);
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { poolNumber: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { externalReference: { $regex: search, $options: 'i' } }
    ];
  }

  // Sort configuration
  const sortConfig = {};
  sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Build aggregation pipeline for advanced filtering
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        utilizationRate: {
          $cond: {
            if: { $gt: ['$totalAmount', 0] },
            then: { $multiply: [{ $divide: ['$spentAmount', '$totalAmount'] }, 100] },
            else: 0
          }
        }
      }
    }
  ];

  // Utilization rate filtering
  if (utilizationMin || utilizationMax) {
    const utilizationFilter = {};
    if (utilizationMin) utilizationFilter.$gte = Number(utilizationMin);
    if (utilizationMax) utilizationFilter.$lte = Number(utilizationMax);
    pipeline.push({ $match: { utilizationRate: utilizationFilter } });
  }

  // Add sorting, pagination, and population
  pipeline.push(
    { $sort: sortConfig },
    { $skip: skip },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'users',
        localField: 'managedBy',
        foreignField: '_id',
        as: 'managedBy',
        pipeline: [{ $project: { name: 1, email: 1, role: 1 } }]
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy',
        pipeline: [{ $project: { name: 1, email: 1, role: 1 } }]
      }
    },
    { $unwind: { path: '$managedBy', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } }
  );

  // Execute aggregation
  const budgetPools = await BudgetPool.aggregate(pipeline);

  // Get total count for pagination
  const totalCountPipeline = [
    { $match: filter },
    {
      $addFields: {
        utilizationRate: {
          $cond: {
            if: { $gt: ['$totalAmount', 0] },
            then: { $multiply: [{ $divide: ['$spentAmount', '$totalAmount'] }, 100] },
            else: 0
          }
        }
      }
    }
  ];

  if (utilizationMin || utilizationMax) {
    const utilizationFilter = {};
    if (utilizationMin) utilizationFilter.$gte = Number(utilizationMin);
    if (utilizationMax) utilizationFilter.$lte = Number(utilizationMax);
    totalCountPipeline.push({ $match: { utilizationRate: utilizationFilter } });
  }

  totalCountPipeline.push({ $count: 'total' });
  const totalResult = await BudgetPool.aggregate(totalCountPipeline);
  const totalBudgetPools = totalResult[0]?.total || 0;
  const totalPages = Math.ceil(totalBudgetPools / Number(limit));

  // Calculate aggregate statistics
  const stats = await getBudgetPoolStatistics(filter);

  res.status(StatusCodes.OK).json({
    budgetPools,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalBudgetPools,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    },
    statistics: stats
  });
};

/**
 * Get Single Budget Pool
 * Detailed budget pool information with analytics
 */
const getSingleBudgetPool = async (req, res) => {
  const { id: poolId } = req.params;

  const budgetPool = await BudgetPool.findById(poolId)
    .populate('managedBy', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role')
    .populate('program.id', 'name title description budgetPool')
    .populate('allocations.demande', 'title requestNumber status applicant')
    .populate('allocations.allocatedBy', 'name email role')
    .populate('transfers.fromPool', 'name poolNumber')
    .populate('transfers.toPool', 'name poolNumber')
    .populate('transfers.transferredBy', 'name email role');

  if (!budgetPool) {
    throw new CustomError.NotFoundError('Budget pool not found');
  }

  // Check permissions
  if (req.user.role === 'finance_manager') {
    checkPermissions(req.user, budgetPool.managedBy._id.toString());
  }

  // Get related demandes that used this budget pool
  const relatedDemandes = await Demande.find({
    'allocations.demande': { $in: budgetPool.allocations.map(a => a.demande) }
  })
    .populate('applicant', 'name email')
    .populate('assignedTo', 'name email')
    .select('title requestNumber status requestedAmount approvedAmount paidAmount createdAt');

  // Get related payments
  const relatedPayments = await Payment.find({
    budgetPool: poolId
  })
    .populate('demande', 'title requestNumber')
    .populate('recipient', 'name email')
    .select('amount status paymentMethod createdAt processedAt');

  // Calculate detailed analytics
  const analytics = calculateDetailedAnalytics(budgetPool);

  // Check for alerts
  const alerts = checkBudgetAlerts(budgetPool);

  res.status(StatusCodes.OK).json({
    budgetPool,
    relatedDemandes,
    relatedPayments,
    analytics,
    alerts
  });
};

/**
 * Update Budget Pool
 * Update pool information with business rule validation
 */
const updateBudgetPool = async (req, res) => {
  const { id: poolId } = req.params;
  const {
    name,
    description,
    totalAmount,
    status,
    allocationRules,
    alertThresholds,
    externalReference
  } = req.body;

  // Only admin and finance_manager can update
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and finance managers can update budget pools');
  }

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError('Budget pool not found');
  }

  // Check permissions
  if (req.user.role === 'finance_manager') {
    checkPermissions(req.user, budgetPool.managedBy.toString());
  }

  // Validate total amount changes
  if (totalAmount !== undefined) {
    if (totalAmount < 0) {
      throw new CustomError.BadRequestError('Total amount cannot be negative');
    }

    if (totalAmount < budgetPool.spentAmount) {
      throw new CustomError.BadRequestError('Cannot reduce total amount below spent amount');
    }

    if (totalAmount < (budgetPool.allocatedAmount + budgetPool.reservedAmount)) {
      throw new CustomError.BadRequestError('Cannot reduce total amount below allocated and reserved amounts');
    }
  }

  // Validate status transitions
  if (status && status !== budgetPool.status) {
    const validTransitions = {
      'draft': ['active', 'cancelled'],
      'active': ['frozen', 'depleted', 'expired', 'cancelled'],
      'frozen': ['active', 'cancelled'],
      'depleted': ['active'], // If more funds added
      'expired': [], // Cannot change from expired
      'cancelled': [], // Cannot change from cancelled
      'transferred': [] // Cannot change from transferred
    };

    if (!validTransitions[budgetPool.status]?.includes(status)) {
      throw new CustomError.BadRequestError(`Cannot change status from ${budgetPool.status} to ${status}`);
    }

    // Special validation for activation
    if (status === 'active' && budgetPool.status === 'draft') {
      if (budgetPool.totalAmount <= 0) {
        throw new CustomError.BadRequestError('Cannot activate budget pool with zero total amount');
      }

      if (new Date() > budgetPool.budgetPeriod.endDate) {
        throw new CustomError.BadRequestError('Cannot activate budget pool past its end date');
      }
    }
  }

  // Check for duplicate names if name is being changed
  if (name && name !== budgetPool.name) {
    const existingPool = await BudgetPool.findOne({
      name: name.trim(),
      fiscalYear: budgetPool.fiscalYear,
      department: budgetPool.department,
      isDeleted: false,
      _id: { $ne: poolId }
    });

    if (existingPool) {
      throw new CustomError.BadRequestError('A budget pool with this name already exists for this fiscal year and department');
    }
  }

  // Update fields
  if (name) budgetPool.name = name.trim();
  if (description) budgetPool.description = description.trim();
  if (totalAmount !== undefined) budgetPool.totalAmount = totalAmount;
  if (externalReference !== undefined) budgetPool.externalReference = externalReference?.trim();

  if (allocationRules) {
    budgetPool.allocationRules = {
      ...budgetPool.allocationRules,
      ...allocationRules
    };
  }

  if (alertThresholds) {
    budgetPool.alertThresholds = {
      ...budgetPool.alertThresholds,
      ...alertThresholds
    };
  }

  if (status && status !== budgetPool.status) {
    budgetPool.status = status;
    
    // Add status history
    if (!budgetPool.statusHistory) budgetPool.statusHistory = [];
    budgetPool.statusHistory.push({
      status,
      changedBy: req.user.userId,
      changedAt: new Date(),
      reason: req.body.statusReason || `Status changed to ${status}`
    });

    // Create notification for manager if status changed
    if (budgetPool.managedBy.toString() !== req.user.userId) {
      await createNotification({
        recipient: budgetPool.managedBy,
        type: 'alert',
        title: 'Budget Pool Status Changed',
        message: `Budget pool "${budgetPool.name}" status changed to ${status}.`,
        relatedEntities: { budgetPool: budgetPool._id },
        channels: { inApp: { enabled: true }, email: { enabled: true } }
      });
    }
  }

  budgetPool.updatedBy = req.user.userId;
  await budgetPool.save();

  const updatedPool = await BudgetPool.findById(poolId)
    .populate('managedBy', 'name email role')
    .populate('updatedBy', 'name email role');

  res.status(StatusCodes.OK).json({
    message: 'Budget pool updated successfully',
    budgetPool: updatedPool
  });
};

/**
 * Allocate Funds
 * Reserve funds for approved demande
 */
const allocateFunds = async (req, res) => {
  const { id: poolId } = req.params;
  const { demandeId, amount, notes } = req.body;

  // Only admin and finance_manager can allocate funds
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and finance managers can allocate funds');
  }

  // Input validation
  if (!demandeId || !amount || amount <= 0) {
    throw new CustomError.BadRequestError('Please provide valid demande ID and amount');
  }

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError('Budget pool not found');
  }

  // Check permissions
  if (req.user.role === 'finance_manager') {
    checkPermissions(req.user, budgetPool.managedBy.toString());
  }

  // Check pool status
  if (budgetPool.status !== 'active') {
    throw new CustomError.BadRequestError('Can only allocate funds from active budget pools');
  }

  // Verify demande exists and is approved
  const demande = await Demande.findById(demandeId)
    .populate('applicant', 'name email eligibility');

  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  if (demande.status !== 'approved') {
    throw new CustomError.BadRequestError('Can only allocate funds to approved requests');
  }

  // Check if allocation already exists
  const existingAllocation = budgetPool.allocations.find(
    alloc => alloc.demande.toString() === demandeId && alloc.status !== 'cancelled'
  );

  if (existingAllocation) {
    throw new CustomError.BadRequestError('Funds already allocated for this request');
  }

  // Validate amount doesn't exceed approved amount
  if (amount > demande.approvedAmount) {
    throw new CustomError.BadRequestError('Allocation amount cannot exceed approved amount');
  }

  // Check available funds
  const availableAmount = budgetPool.availableAmount;
  if (amount > availableAmount) {
    throw new CustomError.BadRequestError(
      `Insufficient funds. Available: ${availableAmount} DA, Requested: ${amount} DA`
    );
  }

  // Check allocation rules
  if (budgetPool.allocationRules.maxAmountPerRequest && amount > budgetPool.allocationRules.maxAmountPerRequest) {
    throw new CustomError.BadRequestError(
      `Amount exceeds maximum per request limit of ${budgetPool.allocationRules.maxAmountPerRequest} DA`
    );
  }

  // Check category restrictions
  if (budgetPool.allocationRules.allowedCategories?.length > 0) {
    if (!budgetPool.allocationRules.allowedCategories.includes(demande.category)) {
      throw new CustomError.BadRequestError(
        `This budget pool does not allow ${demande.category} category requests`
      );
    }
  }

  // Check eligibility threshold
  if (demande.applicant.eligibility.score < budgetPool.allocationRules.eligibilityThreshold) {
    throw new CustomError.BadRequestError(
      `Applicant eligibility score (${demande.applicant.eligibility.score}) below threshold (${budgetPool.allocationRules.eligibilityThreshold})`
    );
  }

  // Create allocation
  const allocation = {
    demande: demandeId,
    amount,
    allocatedBy: req.user.userId,
    allocatedAt: new Date(),
    status: 'reserved',
    notes: notes || ''
  };

  budgetPool.allocations.push(allocation);
  budgetPool.reservedAmount += amount;
  budgetPool.updatedBy = req.user.userId;

  await budgetPool.save();

  // Update demande with allocation reference
  demande.budgetAllocation = {
    budgetPool: poolId,
    allocatedAmount: amount,
    allocatedAt: new Date(),
    allocatedBy: req.user.userId
  };
  await demande.save();

  // Create notifications
  await createNotification({
    recipient: demande.applicant._id,
    type: 'request_status',
    title: 'Funds Allocated',
    message: `Funds of ${amount} DA have been allocated for your request "${demande.title}".`,
    relatedEntities: { demande: demande._id, budgetPool: budgetPool._id },
    channels: { inApp: { enabled: true }, email: { enabled: true } }
  });

  res.status(StatusCodes.OK).json({
    message: 'Funds allocated successfully',
    allocation: budgetPool.allocations[budgetPool.allocations.length - 1]
  });
};

/**
 * Transfer Funds
 * Transfer funds between budget pools
 */
const transferFunds = async (req, res) => {
  const { id: sourcePoolId } = req.params;
  const { targetPoolId, amount, reason } = req.body;

  // Only admin and finance_manager can transfer funds
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and finance managers can transfer funds');
  }

  // Input validation
  if (!targetPoolId || !amount || amount <= 0 || !reason) {
    throw new CustomError.BadRequestError('Please provide target pool ID, amount, and reason');
  }

  if (sourcePoolId === targetPoolId) {
    throw new CustomError.BadRequestError('Cannot transfer funds to the same pool');
  }

  const sourcePool = await BudgetPool.findById(sourcePoolId);
  const targetPool = await BudgetPool.findById(targetPoolId);

  if (!sourcePool) {
    throw new CustomError.NotFoundError('Source budget pool not found');
  }

  if (!targetPool) {
    throw new CustomError.NotFoundError('Target budget pool not found');
  }

  // Check permissions
  if (req.user.role === 'finance_manager') {
    // Finance manager must manage both pools or have admin approval
    const managesBoth = sourcePool.managedBy.toString() === req.user.userId && 
                       targetPool.managedBy.toString() === req.user.userId;
    
    if (!managesBoth) {
      throw new CustomError.UnauthorizedError('Finance managers can only transfer between pools they manage');
    }
  }

  // Check pool statuses
  if (sourcePool.status !== 'active') {
    throw new CustomError.BadRequestError('Source pool must be active');
  }

  if (targetPool.status !== 'active') {
    throw new CustomError.BadRequestError('Target pool must be active');
  }

  // Check available funds
  const availableAmount = sourcePool.availableAmount;
  if (amount > availableAmount) {
    throw new CustomError.BadRequestError(
      `Insufficient available funds in source pool. Available: ${availableAmount} DA`
    );
  }

  // Determine if approval is needed (transfers > 50,000 DA or between different departments)
  const needsApproval = amount > 50000 || 
                        sourcePool.department !== targetPool.department || 
                        req.user.role !== 'admin';

  const transferStatus = needsApproval ? 'pending' : 'approved';

  // Create transfer records
  const outgoingTransfer = {
    type: 'outgoing',
    amount,
    fromPool: sourcePoolId,
    toPool: targetPoolId,
    transferredBy: req.user.userId,
    transferredAt: new Date(),
    reason,
    status: transferStatus
  };

  const incomingTransfer = {
    type: 'incoming',
    amount,
    fromPool: sourcePoolId,
    toPool: targetPoolId,
    transferredBy: req.user.userId,
    transferredAt: new Date(),
    reason,
    status: transferStatus
  };

  if (transferStatus === 'approved') {
    // Execute transfer immediately
    sourcePool.transfers.push(outgoingTransfer);
    sourcePool.totalAmount -= amount;
    sourcePool.updatedBy = req.user.userId;

    targetPool.transfers.push(incomingTransfer);
    targetPool.totalAmount += amount;
    targetPool.updatedBy = req.user.userId;

    await sourcePool.save();
    await targetPool.save();

    // Create notifications
    await createNotification({
      recipient: sourcePool.managedBy,
      type: 'system',
      title: 'Fund Transfer Completed',
      message: `${amount} DA has been transferred from "${sourcePool.name}" to "${targetPool.name}".`,
      relatedEntities: { budgetPool: sourcePool._id },
      channels: { inApp: { enabled: true }, email: { enabled: true } }
    });

    if (targetPool.managedBy.toString() !== sourcePool.managedBy.toString()) {
      await createNotification({
        recipient: targetPool.managedBy,
        type: 'system',
        title: 'Fund Transfer Received',
        message: `${amount} DA has been received in "${targetPool.name}" from "${sourcePool.name}".`,
        relatedEntities: { budgetPool: targetPool._id },
        channels: { inApp: { enabled: true }, email: { enabled: true } }
      });
    }

    res.status(StatusCodes.OK).json({
      message: 'Fund transfer completed successfully',
      transfer: outgoingTransfer
    });
  } else {
    // Add pending transfer records
    sourcePool.transfers.push(outgoingTransfer);
    targetPool.transfers.push(incomingTransfer);

    await sourcePool.save();
    await targetPool.save();

    // Notify admins for approval
    const admins = await User.find({ role: 'admin', isDeleted: false });
    for (const admin of admins) {
      await createNotification({
        recipient: admin._id,
        type: 'approval_required',
        title: 'Fund Transfer Requires Approval',
        message: `Transfer of ${amount} DA from "${sourcePool.name}" to "${targetPool.name}" requires approval.`,
        relatedEntities: { budgetPool: sourcePool._id },
        actionRequired: true,
        actionType: 'approve_transfer',
        channels: { inApp: { enabled: true }, email: { enabled: true } }
      });
    }

    res.status(StatusCodes.OK).json({
      message: 'Fund transfer submitted for approval',
      transfer: outgoingTransfer
    });
  }
};

/**
 * Get Dashboard Statistics
 * Comprehensive budget analytics for dashboard
 */
const getDashboardStats = async (req, res) => {
  let filter = { isDeleted: false };

  // Role-based filtering
  if (req.user.role === 'finance_manager') {
    filter.managedBy = req.user.userId;
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
        totalReserved: { $sum: '$reservedAmount' },
        totalSpent: { $sum: '$spentAmount' },
        avgUtilization: { 
          $avg: {
            $cond: {
              if: { $gt: ['$totalAmount', 0] },
              then: { $divide: ['$spentAmount', '$totalAmount'] },
              else: 0
            }
          }
        }
      }
    }
  ]);

  // Status distribution
  const statusDistribution = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalSpent: { $sum: '$spentAmount' }
      }
    }
  ]);

  // Department breakdown
  const departmentStats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$department',
        poolCount: { $sum: 1 },
        totalBudget: { $sum: '$totalAmount' },
        totalSpent: { $sum: '$spentAmount' },
        utilizationRate: {
          $avg: {
            $cond: {
              if: { $gt: ['$totalAmount', 0] },
              then: { $multiply: [{ $divide: ['$spentAmount', '$totalAmount'] }, 100] },
              else: 0
            }
          }
        }
      }
    },
    { $sort: { totalBudget: -1 } },
    { $limit: 10 }
  ]);

  // Fiscal year trends
  const yearlyTrends = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$fiscalYear',
        poolCount: { $sum: 1 },
        totalBudget: { $sum: '$totalAmount' },
        totalSpent: { $sum: '$spentAmount' },
        avgUtilization: {
          $avg: {
            $cond: {
              if: { $gt: ['$totalAmount', 0] },
              then: { $multiply: [{ $divide: ['$spentAmount', '$totalAmount'] }, 100] },
              else: 0
            }
          }
        }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 5 }
  ]);

  // Funding source analysis
  const fundingSourceStats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$fundingSource',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        avgPoolSize: { $avg: '$totalAmount' }
      }
    }
  ]);

  // Alert analysis
  const alertAnalysis = await BudgetPool.aggregate([
    { $match: { ...filter, status: 'active' } },
    {
      $addFields: {
        utilizationRate: {
          $cond: {
            if: { $gt: ['$totalAmount', 0] },
            then: { $multiply: [{ $divide: ['$spentAmount', '$totalAmount'] }, 100] },
            else: 0
          }
        },
        daysUntilExpiry: {
          $divide: [
            { $subtract: ['$budgetPeriod.endDate', new Date()] },
            86400000 // milliseconds in a day
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        lowBalancePools: {
          $sum: {
            $cond: [
              { $gte: ['$utilizationRate', '$alertThresholds.lowBalanceWarning'] },
              1,
              0
            ]
          }
        },
        criticalBalancePools: {
          $sum: {
            $cond: [
              { $gte: ['$utilizationRate', '$alertThresholds.criticalBalanceAlert'] },
              1,
              0
            ]
          }
        },
        expiringPools: {
          $sum: {
            $cond: [
              { $lte: ['$daysUntilExpiry', '$alertThresholds.expirationWarning'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Recent activity
  const recentActivity = await BudgetPool.find(filter)
    .populate('managedBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('name poolNumber status totalAmount spentAmount updatedAt managedBy updatedBy');

  const overall = overallStats[0] || {
    totalPools: 0,
    totalBudget: 0,
    totalAllocated: 0,
    totalReserved: 0,
    totalSpent: 0,
    avgUtilization: 0
  };

  const alerts = alertAnalysis[0] || {
    lowBalancePools: 0,
    criticalBalancePools: 0,
    expiringPools: 0
  };

  res.status(StatusCodes.OK).json({
    statistics: {
      overall: {
        ...overall,
        remainingBudget: overall.totalBudget - overall.totalSpent,
        availableBudget: overall.totalBudget - overall.totalAllocated - overall.totalReserved,
        utilizationRate: (overall.avgUtilization * 100).toFixed(2)
      },
      statusDistribution,
      departmentBreakdown: departmentStats,
      yearlyTrends,
      fundingSourceStats,
      alerts
    },
    recentActivity
  });
};

/**
 * Get Pool Analytics
 * Detailed analytics for specific pool
 */
const getPoolAnalytics = async (req, res) => {
  const { id: poolId } = req.params;
  const { period = '6months' } = req.query;

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError('Budget pool not found');
  }

  // Check permissions
  if (req.user.role === 'finance_manager') {
    checkPermissions(req.user, budgetPool.managedBy.toString());
  }

  // Calculate time-based period
  let startDate;
  switch (period) {
    case '3months':
      startDate = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000);
      break;
    case '6months':
      startDate = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      break;
    case '1year':
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = budgetPool.budgetPeriod.startDate;
  }

  // Allocation trends
  const allocationTrends = await Demande.aggregate([
    {
      $match: {
        'budgetAllocation.budgetPool': budgetPool._id,
        'budgetAllocation.allocatedAt': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$budgetAllocation.allocatedAt' },
          month: { $month: '$budgetAllocation.allocatedAt' }
        },
        totalAllocated: { $sum: '$budgetAllocation.allocatedAmount' },
        requestCount: { $sum: 1 },
        avgAmount: { $avg: '$budgetAllocation.allocatedAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Spending patterns
  const spendingPatterns = await Payment.aggregate([
    {
      $match: {
        budgetPool: budgetPool._id,
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalSpent: { $sum: '$amount' },
        paymentCount: { $sum: 1 },
        avgPayment: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Category analysis
  const categoryAnalysis = await Demande.aggregate([
    {
      $match: {
        'budgetAllocation.budgetPool': budgetPool._id,
        'budgetAllocation.allocatedAt': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAllocated: { $sum: '$budgetAllocation.allocatedAmount' },
        requestCount: { $sum: 1 },
        avgAmount: { $avg: '$budgetAllocation.allocatedAmount' }
      }
    },
    { $sort: { totalAllocated: -1 } }
  ]);

  // Performance metrics
  const totalDays = Math.ceil((budgetPool.budgetPeriod.endDate - budgetPool.budgetPeriod.startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((new Date() - budgetPool.budgetPeriod.startDate) / (1000 * 60 * 60 * 24));
  const timeProgress = Math.min((elapsedDays / totalDays) * 100, 100);
  
  const utilizationRate = budgetPool.utilizationRate;
  const burnRate = utilizationRate / Math.max(timeProgress, 1);
  const projectedCompletion = burnRate > 0 ? (100 / burnRate) : null;

  // Efficiency metrics
  const avgProcessingTime = await Demande.aggregate([
    {
      $match: {
        'budgetAllocation.budgetPool': budgetPool._id,
        status: { $in: ['approved', 'paid'] }
      }
    },
    {
      $addFields: {
        processingTime: {
          $subtract: ['$budgetAllocation.allocatedAt', '$createdAt']
        }
      }
    },
    {
      $group: {
        _id: null,
        avgProcessingDays: {
          $avg: { $divide: ['$processingTime', 86400000] }
        }
      }
    }
  ]);

  res.status(StatusCodes.OK).json({
    analytics: {
      summary: {
        timeProgress: parseFloat(timeProgress.toFixed(2)),
        utilizationRate: budgetPool.utilizationRate,
        burnRate: parseFloat(burnRate.toFixed(2)),
        projectedCompletion: projectedCompletion ? parseFloat(projectedCompletion.toFixed(2)) : null,
        avgProcessingDays: avgProcessingTime[0]?.avgProcessingDays || 0
      },
      trends: {
        allocations: allocationTrends,
        spending: spendingPatterns
      },
      breakdowns: {
        categories: categoryAnalysis
      },
      performance: {
        totalRequests: budgetPool.allocations.length,
        approvedRequests: budgetPool.allocations.filter(a => a.status !== 'cancelled').length,
        avgAllocationAmount: budgetPool.allocations.length > 0 
          ? budgetPool.allocations.reduce((sum, a) => sum + a.amount, 0) / budgetPool.allocations.length
          : 0
      }
    }
  });
};

/**
 * Delete Budget Pool
 * Soft delete with comprehensive validation
 */
const deleteBudgetPool = async (req, res) => {
  const { id: poolId } = req.params;

  // Only admin can delete budget pools
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can delete budget pools');
  }

  const budgetPool = await BudgetPool.findById(poolId);
  if (!budgetPool) {
    throw new CustomError.NotFoundError('Budget pool not found');
  }

  // Check for active allocations
  const activeAllocations = budgetPool.allocations.filter(allocation => 
    ['reserved', 'confirmed'].includes(allocation.status)
  );

  if (activeAllocations.length > 0) {
    throw new CustomError.BadRequestError(
      `Cannot delete budget pool with ${activeAllocations.length} active allocations`
    );
  }

  // Check for pending transfers
  const pendingTransfers = budgetPool.transfers.filter(transfer => 
    transfer.status === 'pending'
  );

  if (pendingTransfers.length > 0) {
    throw new CustomError.BadRequestError(
      `Cannot delete budget pool with ${pendingTransfers.length} pending transfers`
    );
  }

  // Check if pool has been used (has spent amount)
  if (budgetPool.spentAmount > 0) {
    throw new CustomError.BadRequestError(
      'Cannot delete budget pool that has processed payments'
    );
  }

  // Soft delete
  budgetPool.isDeleted = true;
  budgetPool.deletedAt = new Date();
  budgetPool.deletedBy = req.user.userId;
  budgetPool.status = 'cancelled';
  budgetPool.updatedBy = req.user.userId;

  await budgetPool.save();

  // Notify manager
  if (budgetPool.managedBy.toString() !== req.user.userId) {
    await createNotification({
      recipient: budgetPool.managedBy,
      type: 'alert',
      title: 'Budget Pool Deleted',
      message: `Budget pool "${budgetPool.name}" has been deleted by administrator.`,
      relatedEntities: { budgetPool: budgetPool._id },
      channels: { inApp: { enabled: true }, email: { enabled: true } }
    });
  }

  res.status(StatusCodes.OK).json({
    message: 'Budget pool deleted successfully'
  });
};

// Helper Functions

/**
 * Get budget pool statistics
 */
const getBudgetPoolStatistics = async (filter) => {
  const stats = await BudgetPool.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalPools: { $sum: 1 },
        totalBudget: { $sum: '$totalAmount' },
        totalAllocated: { $sum: '$allocatedAmount' },
        totalReserved: { $sum: '$reservedAmount' },
        totalSpent: { $sum: '$spentAmount' },
        avgPoolSize: { $avg: '$totalAmount' },
        avgUtilization: {
          $avg: {
            $cond: {
              if: { $gt: ['$totalAmount', 0] },
              then: { $divide: ['$spentAmount', '$totalAmount'] },
              else: 0
            }
          }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalPools: 0,
    totalBudget: 0,
    totalAllocated: 0,
    totalReserved: 0,
    totalSpent: 0,
    avgPoolSize: 0,
    avgUtilization: 0
  };

  return {
    ...result,
    remainingBudget: result.totalBudget - result.totalSpent,
    availableBudget: result.totalBudget - result.totalAllocated - result.totalReserved,
    utilizationRate: (result.avgUtilization * 100).toFixed(2)
  };
};

/**
 * Calculate detailed analytics for a pool
 */
const calculateDetailedAnalytics = (budgetPool) => {
  const totalAmount = budgetPool.totalAmount || 0;
  const allocatedAmount = budgetPool.allocatedAmount || 0;
  const reservedAmount = budgetPool.reservedAmount || 0;
  const spentAmount = budgetPool.spentAmount || 0;

  const remainingAmount = totalAmount - spentAmount;
  const availableAmount = totalAmount - allocatedAmount - reservedAmount;
  const utilizationRate = totalAmount > 0 ? ((spentAmount / totalAmount) * 100) : 0;

  // Time-based calculations
  const now = new Date();
  const startDate = budgetPool.budgetPeriod.startDate;
  const endDate = budgetPool.budgetPeriod.endDate;
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  
  const timeProgress = totalDays > 0 ? Math.min((elapsedDays / totalDays) * 100, 100) : 0;
  const burnRate = timeProgress > 0 ? utilizationRate / timeProgress : 0;

  // Allocation analytics
  const totalAllocations = budgetPool.allocations.length;
  const activeAllocations = budgetPool.allocations.filter(a => a.status !== 'cancelled').length;
  const avgAllocationAmount = totalAllocations > 0 
    ? budgetPool.allocations.reduce((sum, a) => sum + a.amount, 0) / totalAllocations
    : 0;

  return {
    financial: {
      totalAmount,
      allocatedAmount,
      reservedAmount,
      spentAmount,
      remainingAmount,
      availableAmount,
      utilizationRate: parseFloat(utilizationRate.toFixed(2))
    },
    timeline: {
      totalDays,
      elapsedDays,
      remainingDays,
      timeProgress: parseFloat(timeProgress.toFixed(2)),
      burnRate: parseFloat(burnRate.toFixed(2))
    },
    allocations: {
      totalAllocations,
      activeAllocations,
      cancelledAllocations: totalAllocations - activeAllocations,
      avgAllocationAmount: parseFloat(avgAllocationAmount.toFixed(2))
    }
  };
};

/**
 * Check for budget alerts
 */
const checkBudgetAlerts = (budgetPool) => {
  const alerts = [];
  const analytics = calculateDetailedAnalytics(budgetPool);

  // Low balance warning
  if (analytics.financial.utilizationRate >= budgetPool.alertThresholds.lowBalanceWarning) {
    alerts.push({
      type: 'low_balance',
      severity: analytics.financial.utilizationRate >= budgetPool.alertThresholds.criticalBalanceAlert ? 'critical' : 'warning',
      message: `Budget utilization is at ${analytics.financial.utilizationRate}%`,
      threshold: budgetPool.alertThresholds.lowBalanceWarning
    });
  }

  // Expiration warning
  if (analytics.timeline.remainingDays <= budgetPool.alertThresholds.expirationWarning) {
    alerts.push({
      type: 'expiration_warning',
      severity: analytics.timeline.remainingDays <= 7 ? 'critical' : 'warning',
      message: `Budget pool expires in ${analytics.timeline.remainingDays} days`,
      threshold: budgetPool.alertThresholds.expirationWarning
    });
  }

  // High burn rate
  if (analytics.timeline.burnRate > 1.5) {
    alerts.push({
      type: 'high_burn_rate',
      severity: 'warning',
      message: `Budget is being spent ${analytics.timeline.burnRate.toFixed(1)}x faster than expected`,
      burnRate: analytics.timeline.burnRate
    });
  }

  return alerts;
};

/**
 * Create notification helper
 */
const createNotification = async (notificationData) => {
  try {
    await Notification.create({
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      recipient: notificationData.recipient,
      relatedEntities: notificationData.relatedEntities,
      channels: notificationData.channels,
      actionRequired: notificationData.actionRequired || false,
      actionType: notificationData.actionType || 'none',
      createdBy: notificationData.createdBy || null
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  createBudgetPool,
  getAllBudgetPools,
  getSingleBudgetPool,
  updateBudgetPool,
  allocateFunds,
  transferFunds,
  getDashboardStats,
  getPoolAnalytics,
  deleteBudgetPool,
  
};