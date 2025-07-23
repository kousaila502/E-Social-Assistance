const { StatusCodes } = require('http-status-codes');
const Demande = require('../models/demande');
const User = require('../models/user');
const BudgetPool = require('../models/budgetPool');
const Content = require('../models/content');
const Announcement = require('../models/announcement');
const Notification = require('../models/notification');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

/**
 * Create New Request (Demande)
 * Users can submit new assistance requests
 */
const createDemande = async (req, res) => {
  const {
    title,
    description,
    program,
    requestedAmount,
    category = 'other',
    urgencyLevel = 'routine',
    tags = []
  } = req.body;

  // Input validation
  if (!title || !description || !program || !requestedAmount) {
    throw new CustomError.BadRequestError(
      'Please provide title, description, program, and requested amount'
    );
  }

  // Verify user eligibility
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  // Check if user account is active and verified
  if (user.accountStatus === 'suspended') {
    throw new CustomError.UnauthorizedError('Account is suspended');
  }

  // Allow both active and pending_verification accounts
  if (!['active', 'pending_verification'].includes(user.accountStatus)) {
    throw new CustomError.UnauthorizedError('Account status does not allow request submission');
  }

  if (user.eligibility && user.eligibility.status === 'rejected') {
    throw new CustomError.UnauthorizedError('You are not eligible to submit requests');
  }

  // Don't block pending eligibility - let users submit requests
  // if (user.eligibility.status === 'pending') {
  //   throw new CustomError.BadRequestError('Please complete your eligibility verification first');
  // }

  // Verify program exists and is active
  let programEntity;
  if (program.type === 'Content') {
    programEntity = await Content.findById(program.id);
  } else if (program.type === 'Announcement') {
    programEntity = await Announcement.findById(program.id);
  }

  if (!programEntity) {
    throw new CustomError.NotFoundError('Program not found');
  }

  // Check if program is active/available
  if (program.type === 'Content' && programEntity.status !== 'active') {
    throw new CustomError.BadRequestError('Program is not currently active');
  }

  if (program.type === 'Announcement' && !programEntity.canApply) {
    throw new CustomError.BadRequestError('Program is not accepting applications');
  }

  // Check if user has exceeded request limits
  const userActiveRequests = await Demande.countDocuments({
    applicant: req.user.userId,
    status: { $in: ['draft', 'submitted', 'under_review', 'pending_docs', 'approved'] }
  });

  const maxActiveRequests = 5; // Configure as needed
  if (userActiveRequests >= maxActiveRequests) {
    throw new CustomError.BadRequestError(
      `You cannot have more than ${maxActiveRequests} active requests`
    );
  }

  // Check for duplicate recent requests for same program
  const recentDuplicate = await Demande.findOne({
    applicant: req.user.userId,
    'program.type': program.type,
    'program.id': program.id,
    status: { $in: ['submitted', 'under_review', 'approved', 'paid'] },
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });

  if (recentDuplicate) {
    throw new CustomError.BadRequestError(
      'You have already submitted a request for this program recently'
    );
  }

  // Calculate eligibility score for this request
  const eligibilityScore = calculateRequestEligibility(user, category, urgencyLevel, requestedAmount);

  // Set deadlines
  const submissionDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const reviewDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  // Create the request
  const demande = await Demande.create({
    title: title.trim(),
    description: description.trim(),
    program,
    requestedAmount,
    category,
    urgencyLevel,
    tags: tags.map(tag => tag.trim().toLowerCase()),
    applicant: req.user.userId,
    submissionDeadline,
    reviewDeadline,
    reviewDetails: {
      eligibilityScore
    },
    createdBy: req.user.userId,
    statusHistory: [{
      status: 'draft',
      changedBy: req.user.userId,
      reason: 'Initial creation'
    }]
  });

  // Create notification for user
  await createNotification({
    recipient: req.user.userId,
    type: 'request_status',
    title: 'Request Created',
    message: `Your request "${title}" has been created successfully.`,
    relatedEntities: { demande: demande._id },
    channels: { inApp: { enabled: true }, email: { enabled: true } }
  });

  const populatedDemande = await Demande.findById(demande._id)
    .populate('applicant', 'name email eligibility')
    .populate('program.id', 'name title description');

  res.status(StatusCodes.CREATED).json({
    message: 'Request created successfully',
    demande: populatedDemande
  });
};

/**
 * Submit Request
 * Move request from draft to submitted status
 */
const submitDemande = async (req, res) => {
  const { id: demandeId } = req.params;

  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check permissions - only applicant can submit their own request
  checkPermissions(req.user, demande.applicant.toString());

  // Verify request is in draft status
  if (demande.status !== 'draft') {
    throw new CustomError.BadRequestError('Only draft requests can be submitted');
  }

  // Verify minimum requirements are met
  if (!demande.title || !demande.description || !demande.requestedAmount) {
    throw new CustomError.BadRequestError('Please complete all required fields before submitting');
  }

  // Check if submission deadline hasn't passed
  if (demande.submissionDeadline && demande.submissionDeadline < new Date()) {
    throw new CustomError.BadRequestError('Submission deadline has passed');
  }

  // Update status and add history
  demande.status = 'submitted';
  demande.statusHistory.push({
    status: 'submitted',
    changedBy: req.user.userId,
    reason: 'Request submitted by applicant'
  });
  demande.updatedBy = req.user.userId;

  await demande.save();

  // Notify case workers for review
  await notifyCaseWorkers(demande, 'new_request_submitted');

  // Create notification for user
  await createNotification({
    recipient: req.user.userId,
    type: 'request_status',
    title: 'Request Submitted',
    message: `Your request "${demande.title}" has been submitted for review.`,
    relatedEntities: { demande: demande._id },
    channels: { inApp: { enabled: true }, email: { enabled: true } }
  });

  res.status(StatusCodes.OK).json({
    message: 'Request submitted successfully',
    demande
  });
};

/**
 * Get All Requests
 * Get requests with filtering and pagination
 */
const getAllDemandes = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    priority,
    urgencyLevel,
    assignedTo,
    applicant,
    programType,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minAmount,
    maxAmount,
    dateFrom,
    dateTo
  } = req.query;

  // Build filter object based on user role
  const filter = { isDeleted: false };

  // Role-based filtering
  if (req.user.role === 'user') {
    // Users can only see their own requests
    filter.applicant = req.user.userId;
  }

  // Status filtering
  if (status) {
    filter.status = { $in: status.split(',') };
  }

  // Category filtering
  if (category) {
    filter.category = { $in: category.split(',') };
  }

  // Priority filtering
  if (priority) {
    filter.priority = { $in: priority.split(',') };
  }

  // Urgency level filtering
  if (urgencyLevel) {
    filter.urgencyLevel = { $in: urgencyLevel.split(',') };
  }

  // Assignment filtering
  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  // Applicant filtering (staff only)
  if (applicant && req.user.role !== 'user') {
    filter.applicant = applicant;
  }

  // Program type filtering
  if (programType) {
    filter['program.type'] = programType;
  }

  // Amount range filtering
  if (minAmount) {
    filter.requestedAmount = { ...filter.requestedAmount, $gte: Number(minAmount) };
  }
  if (maxAmount) {
    filter.requestedAmount = { ...filter.requestedAmount, $lte: Number(maxAmount) };
  }

  // Date range filtering
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { requestNumber: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Sort configuration
  const sortConfig = {};
  sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query
  const demandes = await Demande.find(filter)
    .populate('applicant', 'name email eligibility accountStatus')
    .populate('assignedTo', 'name email role')
    .populate('program.id', 'name title description')
    .populate('payment', 'amount status paymentMethod')
    .sort(sortConfig)
    .skip(skip)
    .limit(Number(limit));

  // Get total count
  const totalDemandes = await Demande.countDocuments(filter);
  const totalPages = Math.ceil(totalDemandes / Number(limit));

  // Calculate statistics
  const stats = await getDemandeStatistics(filter);

  res.status(StatusCodes.OK).json({
    demandes,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalDemandes,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    },
    statistics: stats
  });
};

/**
 * Get Single Request
 * Get detailed request information
 */
const getSingleDemande = async (req, res) => {
  const { id: demandeId } = req.params;

  const demande = await Demande.findById(demandeId)
    .populate('applicant', 'name email phoneNumber eligibility personalInfo economicInfo')
    .populate('assignedTo', 'name email role')
    .populate('program.id', 'name title description budgetPool')
    .populate('payment', 'amount status paymentMethod processedAt')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('statusHistory.changedBy', 'name email role')
    .populate('comments.author', 'name email role')
    .populate('reviewDetails.reviewedBy', 'name email role');

  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    checkPermissions(req.user, demande.applicant._id.toString());
  }

  // Get related budget pool if exists
  let budgetPool = null;
  if (demande.program.id.budgetPool) {
    budgetPool = await BudgetPool.findById(demande.program.id.budgetPool);
  }

  res.status(StatusCodes.OK).json({
    demande,
    budgetPool
  });
};

/**
 * Update Request
 * Update request information (limited based on status and role)
 */
const updateDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  const updates = req.body;

  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    checkPermissions(req.user, demande.applicant.toString());
    
    // Users can only edit draft requests
    if (demande.status !== 'draft') {
      throw new CustomError.UnauthorizedError('You can only edit draft requests');
    }
    
    // Users can only update certain fields
    const allowedFields = ['title', 'description', 'requestedAmount', 'urgencyLevel', 'tags'];
    const updateFields = Object.keys(updates);
    const isValidUpdate = updateFields.every(field => allowedFields.includes(field));
    
    if (!isValidUpdate) {
      throw new CustomError.UnauthorizedError('You can only update title, description, amount, urgency, and tags');
    }
  }

  // Apply updates based on role
  if (req.user.role === 'user') {
    // User updates
    if (updates.title) demande.title = updates.title.trim();
    if (updates.description) demande.description = updates.description.trim();
    if (updates.requestedAmount) demande.requestedAmount = updates.requestedAmount;
    if (updates.urgencyLevel) demande.urgencyLevel = updates.urgencyLevel;
    if (updates.tags) demande.tags = updates.tags.map(tag => tag.trim().toLowerCase());
  } else {
    // Staff updates (case workers, admins)
    if (updates.assignedTo) demande.assignedTo = updates.assignedTo;
    if (updates.priority) demande.priority = updates.priority;
    if (updates.category) demande.category = updates.category;
    if (updates.reviewDeadline) demande.reviewDeadline = new Date(updates.reviewDeadline);
    if (updates.paymentDeadline) demande.paymentDeadline = new Date(updates.paymentDeadline);
  }

  demande.updatedBy = req.user.userId;
  await demande.save();

  const updatedDemande = await Demande.findById(demandeId)
    .populate('applicant', 'name email')
    .populate('assignedTo', 'name email role');

  res.status(StatusCodes.OK).json({
    message: 'Request updated successfully',
    demande: updatedDemande
  });
};

/**
 * Review Request
 * Case worker/admin can review and approve/reject requests
 */
const reviewDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  const { 
    decision, 
    approvedAmount, 
    reviewNotes, 
    rejectionCategory, 
    rejectionDescription,
    budgetPoolId 
  } = req.body;

  // Only case workers and admins can review
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only case workers and administrators can review requests');
  }

  if (!decision || !['approved', 'rejected'].includes(decision)) {
    throw new CustomError.BadRequestError('Please provide valid decision (approved/rejected)');
  }

  const demande = await Demande.findById(demandeId)
    .populate('applicant', 'name email eligibility');

  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check if request is in reviewable status
  if (!['submitted', 'under_review', 'pending_docs'].includes(demande.status)) {
    throw new CustomError.BadRequestError('Request is not in a reviewable status');
  }

  if (decision === 'approved') {
    // Approval logic
    if (!approvedAmount || approvedAmount <= 0) {
      throw new CustomError.BadRequestError('Please provide valid approved amount');
    }

    if (approvedAmount > demande.requestedAmount) {
      throw new CustomError.BadRequestError('Approved amount cannot exceed requested amount');
    }

    // Check budget availability
    let budgetPool;
    if (budgetPoolId) {
      budgetPool = await BudgetPool.findById(budgetPoolId);
      if (!budgetPool) {
        throw new CustomError.NotFoundError('Budget pool not found');
      }

      if (!budgetPool.canAllocate(approvedAmount)) {
        throw new CustomError.BadRequestError('Insufficient budget available');
      }

      // Reserve funds
      await budgetPool.reserveAmount(approvedAmount, demandeId, req.user.userId, 'Request approval');
    }

    // Update request
    demande.status = 'approved';
    demande.approvedAmount = approvedAmount;
    demande.paymentDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  } else {
    // Rejection logic
    if (!rejectionCategory || !rejectionDescription) {
      throw new CustomError.BadRequestError('Please provide rejection category and description');
    }

    demande.status = 'rejected';
    demande.rejectionReason = {
      category: rejectionCategory,
      description: rejectionDescription
    };
  }

  // Update review details
  demande.reviewDetails = {
    reviewedBy: req.user.userId,
    reviewedAt: new Date(),
    reviewNotes: reviewNotes || '',
    eligibilityScore: demande.reviewDetails.eligibilityScore
  };

  // Add status history
  demande.statusHistory.push({
    status: demande.status,
    changedBy: req.user.userId,
    reason: decision === 'approved' ? 'Request approved' : 'Request rejected',
    notes: reviewNotes
  });

  demande.updatedBy = req.user.userId;
  await demande.save();

  // Create notification for applicant
  await createNotification({
    recipient: demande.applicant._id,
    type: 'request_status',
    title: `Request ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
    message: decision === 'approved' 
      ? `Your request "${demande.title}" has been approved for ${approvedAmount} DA.`
      : `Your request "${demande.title}" has been rejected. Reason: ${rejectionDescription}`,
    relatedEntities: { demande: demande._id },
    channels: { inApp: { enabled: true }, email: { enabled: true } }
  });

  res.status(StatusCodes.OK).json({
    message: `Request ${decision} successfully`,
    demande
  });
};

/**
 * Assign Request
 * Assign request to case worker
 */
const assignDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  const { assignedTo } = req.body;

  // Only admins and case workers can assign
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and case workers can assign requests');
  }

  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Verify assignee exists and has appropriate role
  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      throw new CustomError.NotFoundError('Assignee not found');
    }
    
    if (!['admin', 'case_worker'].includes(assignee.role)) {
      throw new CustomError.BadRequestError('Can only assign to administrators or case workers');
    }
  }

  const oldAssignee = demande.assignedTo;
  demande.assignedTo = assignedTo || null;
  demande.updatedBy = req.user.userId;

  // Update status if moving from submitted to under review
  if (demande.status === 'submitted' && assignedTo) {
    demande.status = 'under_review';
    demande.statusHistory.push({
      status: 'under_review',
      changedBy: req.user.userId,
      reason: 'Request assigned for review'
    });
  }

  await demande.save();

  // Notify new assignee
  if (assignedTo) {
    await createNotification({
      recipient: assignedTo,
      type: 'approval_required',
      title: 'Request Assigned',
      message: `Request "${demande.title}" has been assigned to you for review.`,
      relatedEntities: { demande: demande._id },
      channels: { inApp: { enabled: true }, email: { enabled: true } }
    });
  }

  res.status(StatusCodes.OK).json({
    message: assignedTo ? 'Request assigned successfully' : 'Request unassigned successfully',
    demande
  });
};

/**
 * Add Comment to Request
 * Add comment or note to request
 */
const addComment = async (req, res) => {
  const { id: demandeId } = req.params;
  const { content, isInternal = false } = req.body;

  if (!content || content.trim().length === 0) {
    throw new CustomError.BadRequestError('Please provide comment content');
  }

  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    checkPermissions(req.user, demande.applicant.toString());
    // Users cannot add internal comments
    if (isInternal) {
      throw new CustomError.UnauthorizedError('Users cannot add internal comments');
    }
  }

  // Add comment
  demande.comments.push({
    author: req.user.userId,
    content: content.trim(),
    isInternal,
    createdAt: new Date()
  });

  demande.updatedBy = req.user.userId;
  await demande.save();

  // Notify relevant parties
  if (!isInternal) {
    // Notify applicant if comment is from staff
    if (req.user.role !== 'user' && demande.applicant.toString() !== req.user.userId) {
      await createNotification({
        recipient: demande.applicant,
        type: 'request_status',
        title: 'New Comment on Request',
        message: `A new comment has been added to your request "${demande.title}".`,
        relatedEntities: { demande: demande._id },
        channels: { inApp: { enabled: true } }
      });
    }

    // Notify assigned case worker if comment is from applicant
    if (req.user.role === 'user' && demande.assignedTo) {
      await createNotification({
        recipient: demande.assignedTo,
        type: 'request_status',
        title: 'New Comment on Assigned Request',
        message: `The applicant has added a comment to request "${demande.title}".`,
        relatedEntities: { demande: demande._id },
        channels: { inApp: { enabled: true } }
      });
    }
  }

  const updatedDemande = await Demande.findById(demandeId)
    .populate('comments.author', 'name email role');

  res.status(StatusCodes.OK).json({
    message: 'Comment added successfully',
    comment: updatedDemande.comments[updatedDemande.comments.length - 1]
  });
};

/**
 * Cancel Request
 * User or admin can cancel a request
 */
const cancelDemande = async (req, res) => {
  const { id: demandeId } = req.params;
  const { reason } = req.body;

  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    checkPermissions(req.user, demande.applicant.toString());
  }

  // Check if request can be cancelled
  if (['paid', 'cancelled', 'rejected'].includes(demande.status)) {
    throw new CustomError.BadRequestError('Request cannot be cancelled in current status');
  }

  // If request is approved and has reserved budget, release it
  if (demande.status === 'approved' && demande.approvedAmount) {
    // Find and release budget allocation
    const budgetPools = await BudgetPool.find({
      'allocations.demande': demandeId,
      'allocations.status': { $in: ['reserved', 'confirmed'] }
    });

    for (const pool of budgetPools) {
      await pool.cancelAllocation(demandeId, req.user.userId, reason || 'Request cancelled');
    }
  }

  // Update request status
  demande.status = 'cancelled';
  demande.statusHistory.push({
    status: 'cancelled',
    changedBy: req.user.userId,
    reason: reason || 'Request cancelled',
    notes: reason
  });
  demande.updatedBy = req.user.userId;

  await demande.save();

  // Notify relevant parties
  if (req.user.role !== 'user') {
    // Admin/staff cancelled - notify applicant
    await createNotification({
      recipient: demande.applicant,
      type: 'request_status',
      title: 'Request Cancelled',
      message: `Your request "${demande.title}" has been cancelled. ${reason ? 'Reason: ' + reason : ''}`,
      relatedEntities: { demande: demande._id },
      channels: { inApp: { enabled: true }, email: { enabled: true } }
    });
  }

  res.status(StatusCodes.OK).json({
    message: 'Request cancelled successfully',
    demande
  });
};

/**
 * Get Dashboard Statistics
 * Get overview statistics for dashboard
 */
const getDashboardStats = async (req, res) => {
  let filter = { isDeleted: false };

  // Users only see their own stats
  if (req.user.role === 'user') {
    filter.applicant = req.user.userId;
  }

  const stats = await Demande.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalRequested: { $sum: '$requestedAmount' },
        totalApproved: { $sum: '$approvedAmount' },
        totalPaid: { $sum: '$paidAmount' },
        statusBreakdown: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        categoryBreakdown: {
          $push: {
            category: '$category',
            count: 1
          }
        }
      }
    }
  ]);

  // Get recent activity
  const recentActivity = await Demande.find(filter)
    .populate('applicant', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title status updatedAt applicant assignedTo requestedAmount');

  res.status(StatusCodes.OK).json({
    statistics: stats[0] || {
      totalRequests: 0,
      totalRequested: 0,
      totalApproved: 0,
      totalPaid: 0,
      statusBreakdown: [],
      categoryBreakdown: []
    },
    recentActivity
  });
};

// Helper Functions

/**
 * Calculate request eligibility score
 */
const calculateRequestEligibility = (user, category, urgencyLevel, requestedAmount) => {
  let score = user.eligibility.score || 0;

  // Category adjustments
  const categoryBonus = {
    'emergency_assistance': 15,
    'medical_assistance': 12,
    'food_assistance': 10,
    'housing_support': 8,
    'educational_support': 5
  };
  score += categoryBonus[category] || 0;

  // Urgency adjustments
  const urgencyBonus = {
    'critical': 10,
    'urgent': 5,
    'important': 2,
    'routine': 0
  };
  score += urgencyBonus[urgencyLevel] || 0;

  // Amount adjustments (lower amounts get slight bonus)
  if (requestedAmount < 5000) score += 5;
  else if (requestedAmount < 10000) score += 2;

  return Math.min(score, 100);
};

/**
 * Get demande statistics
 */
const getDemandeStatistics = async (filter) => {
  const stats = await Demande.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalRequested: { $sum: '$requestedAmount' },
        totalApproved: { $sum: '$approvedAmount' },
        totalPaid: { $sum: '$paidAmount' },
        avgRequestAmount: { $avg: '$requestedAmount' },
        avgApprovedAmount: { $avg: '$approvedAmount' }
      }
    }
  ]);

  return stats[0] || {
    totalRequests: 0,
    totalRequested: 0,
    totalApproved: 0,
    totalPaid: 0,
    avgRequestAmount: 0,
    avgApprovedAmount: 0
  };
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
      createdBy: notificationData.createdBy || null
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw error - notification failure shouldn't break main operation
  }
};

/**
 * Notify case workers helper
 */
const notifyCaseWorkers = async (demande, eventType) => {
  try {
    const caseWorkers = await User.find({
      role: { $in: ['admin', 'case_worker'] },
      accountStatus: 'active',
      isDeleted: false
    });

    const notifications = caseWorkers.map(worker => ({
      recipient: worker._id,
      type: 'approval_required',
      title: 'New Request for Review',
      message: `New request "${demande.title}" submitted by ${demande.applicant.name} requires review.`,
      relatedEntities: { demande: demande._id },
      channels: { inApp: { enabled: true }, email: { enabled: true } }
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Failed to notify case workers:', error);
  }
};

/**
 * Upload Documents
 * Upload supporting documents for request
 */
const uploadDocuments = async (req, res) => {
  const { id: demandeId } = req.params;
  
  if (!req.files || req.files.length === 0) {
    throw new CustomError.BadRequestError('No files uploaded');
  }

  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    checkPermissions(req.user, demande.applicant.toString());
  }

  // Process uploaded files
  const uploadedDocuments = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: req.user.userId,
    uploadedAt: new Date()
  }));

  // Add documents to request
  demande.documents.push(...uploadedDocuments);
  demande.updatedBy = req.user.userId;

  await demande.save();

  res.status(StatusCodes.OK).json({
    message: 'Documents uploaded successfully',
    documents: uploadedDocuments
  });
};

/**
 * Verify Document
 * Case worker/admin can verify uploaded documents
 */
const verifyDocument = async (req, res) => {
  const { id: demandeId, documentId } = req.params;
  const { isVerified, verificationNotes } = req.body;

  // Only case workers and admins can verify documents
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only case workers and administrators can verify documents');
  }

  const demande = await Demande.findById(demandeId);
  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  const document = demande.documents.id(documentId);
  if (!document) {
    throw new CustomError.NotFoundError('Document not found');
  }

  // Update document verification
  document.isVerified = isVerified;
  document.verifiedBy = req.user.userId;
  document.verifiedAt = new Date();
  document.verificationNotes = verificationNotes || '';

  demande.updatedBy = req.user.userId;
  await demande.save();

  // If all documents are verified and request is pending docs, move to under review
  const allDocumentsVerified = demande.documents.every(doc => doc.isVerified);
  if (allDocumentsVerified && demande.status === 'pending_docs') {
    demande.status = 'under_review';
    demande.statusHistory.push({
      status: 'under_review',
      changedBy: req.user.userId,
      reason: 'All documents verified'
    });
    await demande.save();

    // Notify applicant
    await createNotification({
      recipient: demande.applicant,
      type: 'request_status',
      title: 'Documents Verified',
      message: `All documents for your request "${demande.title}" have been verified and it's now under review.`,
      relatedEntities: { demande: demande._id },
      channels: { inApp: { enabled: true }, email: { enabled: true } }
    });
  }

  res.status(StatusCodes.OK).json({
    message: 'Document verification updated successfully',
    document
  });
};

/**
 * Request Additional Documents
 * Case worker can request additional documents from applicant
 */
const requestAdditionalDocuments = async (req, res) => {
  const { id: demandeId } = req.params;
  const { requestMessage, requiredDocuments } = req.body;

  // Only case workers and admins can request documents
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only case workers and administrators can request additional documents');
  }

  if (!requestMessage || !requiredDocuments || requiredDocuments.length === 0) {
    throw new CustomError.BadRequestError('Please provide request message and required documents list');
  }

  const demande = await Demande.findById(demandeId)
    .populate('applicant', 'name email');

  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check if request is in appropriate status
  if (!['submitted', 'under_review'].includes(demande.status)) {
    throw new CustomError.BadRequestError('Cannot request documents for request in current status');
  }

  // Update request status
  demande.status = 'pending_docs';
  demande.statusHistory.push({
    status: 'pending_docs',
    changedBy: req.user.userId,
    reason: 'Additional documents requested',
    notes: requestMessage
  });

  // Add comment about document request
  demande.comments.push({
    author: req.user.userId,
    content: `Additional documents requested: ${requiredDocuments.join(', ')}. ${requestMessage}`,
    isInternal: false,
    createdAt: new Date()
  });

  demande.updatedBy = req.user.userId;
  await demande.save();

  // Notify applicant
  await createNotification({
    recipient: demande.applicant._id,
    type: 'document_required',
    title: 'Additional Documents Required',
    message: `Additional documents are required for your request "${demande.title}". Please check the request details.`,
    relatedEntities: { demande: demande._id },
    actionRequired: true,
    actionType: 'upload_document',
    channels: { inApp: { enabled: true }, email: { enabled: true } }
  });

  res.status(StatusCodes.OK).json({
    message: 'Document request sent successfully',
    demande
  });
};

/**
 * Get Requests by Status
 * Get filtered requests by specific status (helper endpoint)
 */
const getDemandesByStatus = async (req, res) => {
  const { status } = req.params;
  const { 
    page = 1, 
    limit = 20, 
    assignedToMe = false 
  } = req.query;

  // Validate status
  const validStatuses = [
    'draft', 'submitted', 'under_review', 'pending_docs', 
    'approved', 'partially_paid', 'paid', 'rejected', 'cancelled'
  ];
  
  if (!validStatuses.includes(status)) {
    throw new CustomError.BadRequestError('Invalid status provided');
  }

  const filter = { 
    status, 
    isDeleted: false 
  };

  // Role-based filtering
  if (req.user.role === 'user') {
    filter.applicant = req.user.userId;
  } else if (assignedToMe === 'true') {
    filter.assignedTo = req.user.userId;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const demandes = await Demande.find(filter)
    .populate('applicant', 'name email eligibility')
    .populate('assignedTo', 'name email role')
    .populate('program.id', 'name title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const totalCount = await Demande.countDocuments(filter);

  res.status(StatusCodes.OK).json({
    demandes,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalCount,
      hasNextPage: Number(page) < Math.ceil(totalCount / Number(limit)),
      hasPrevPage: Number(page) > 1
    }
  });
};

/**
 * Export Requests
 * Export requests data to CSV/Excel
 */
const exportDemandes = async (req, res) => {
  const { 
    format = 'csv',
    status,
    dateFrom,
    dateTo,
    category
  } = req.query;

  // Only staff can export data
  if (req.user.role === 'user') {
    throw new CustomError.UnauthorizedError('Only staff members can export data');
  }

  const filter = { isDeleted: false };

  // Apply filters
  if (status) filter.status = { $in: status.split(',') };
  if (category) filter.category = { $in: category.split(',') };
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const demandes = await Demande.find(filter)
    .populate('applicant', 'name email phoneNumber eligibility')
    .populate('assignedTo', 'name email')
    .populate('program.id', 'name title')
    .sort({ createdAt: -1 });

  // Prepare data for export
  const exportData = demandes.map(demande => ({
    'Request Number': demande.requestNumber,
    'Title': demande.title,
    'Applicant Name': demande.applicant.name,
    'Applicant Email': demande.applicant.email,
    'Status': demande.status,
    'Category': demande.category,
    'Priority': demande.priority,
    'Requested Amount': demande.requestedAmount,
    'Approved Amount': demande.approvedAmount || 0,
    'Paid Amount': demande.paidAmount || 0,
    'Program': demande.program.id?.name || 'N/A',
    'Assigned To': demande.assignedTo?.name || 'Unassigned',
    'Created Date': demande.createdAt.toISOString().split('T')[0],
    'Updated Date': demande.updatedAt.toISOString().split('T')[0],
    'Eligibility Score': demande.reviewDetails?.eligibilityScore || 0
  }));

  // Set response headers for file download
  const filename = `demandes_export_${new Date().toISOString().split('T')[0]}.${format}`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    // Convert to CSV format (you'd use a CSV library like 'csv-writer')
    const csvData = convertToCSV(exportData);
    res.send(csvData);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  }
};

/**
 * Helper function to convert data to CSV
 */
const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => `"${row[header]}"`).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

module.exports = {
  createDemande,
  submitDemande,
  getAllDemandes,
  getSingleDemande,
  updateDemande,
  reviewDemande,
  assignDemande,
  addComment,
  cancelDemande,
  getDashboardStats,
  uploadDocuments,
  verifyDocument,
  requestAdditionalDocuments,
  getDemandesByStatus,
  exportDemandes
};