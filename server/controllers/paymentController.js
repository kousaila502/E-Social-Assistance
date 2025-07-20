const { StatusCodes } = require('http-status-codes');
const Payment = require('../models/payment');
const Demande = require('../models/demande');
const BudgetPool = require('../models/budgetPool');
const User = require('../models/user');
const Notification = require('../models/notification');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

/**
 * Create Payment
 * Process payment for approved request
 */
const createPayment = async (req, res) => {
  const {
    demandeId,
    amount,
    paymentMethod,
    budgetPoolId,
    bankDetails,
    checkDetails,
    scheduledDate,
    internalNotes,
    recipientNotes
  } = req.body;

  // Only finance managers and admins can create payments
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only finance managers and administrators can process payments');
  }

  // Input validation
  if (!demandeId || !amount || !paymentMethod) {
    throw new CustomError.BadRequestError('Please provide demande ID, amount, and payment method');
  }

  if (amount <= 0) {
    throw new CustomError.BadRequestError('Payment amount must be greater than zero');
  }

  // Validate payment method
  const validMethods = ['bank_transfer', 'check', 'cash', 'mobile_payment', 'card', 'other'];
  if (!validMethods.includes(paymentMethod)) {
    throw new CustomError.BadRequestError('Invalid payment method');
  }

  // Get and validate demande
  const demande = await Demande.findById(demandeId)
    .populate('applicant', 'name email phoneNumber bankDetails');

  if (!demande) {
    throw new CustomError.NotFoundError('Request not found');
  }

  // Check if demande is approved
  if (demande.status !== 'approved') {
    throw new CustomError.BadRequestError('Payment can only be processed for approved requests');
  }

  // Validate payment amount doesn't exceed approved amount
  if (amount > demande.approvedAmount) {
    throw new CustomError.BadRequestError('Payment amount cannot exceed approved amount');
  }

  // Check if there are existing payments
  const existingPayments = await Payment.find({ 
    demande: demandeId, 
    status: { $in: ['pending', 'processing', 'completed'] } 
  });

  const totalPaidAmount = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = demande.approvedAmount - totalPaidAmount;

  if (amount > remainingAmount) {
    throw new CustomError.BadRequestError(
      `Payment amount exceeds remaining balance. Remaining: ${remainingAmount} DA`
    );
  }

  // Get and validate budget pool
  let budgetPool;
  if (budgetPoolId) {
    budgetPool = await BudgetPool.findById(budgetPoolId);
    if (!budgetPool) {
      throw new CustomError.NotFoundError('Budget pool not found');
    }

    // Check if budget pool has confirmed allocation for this demande
    const allocation = budgetPool.allocations.find(
      alloc => alloc.demande.toString() === demandeId && alloc.status === 'confirmed'
    );

    if (!allocation) {
      throw new CustomError.BadRequestError('No confirmed allocation found for this request in the specified budget pool');
    }

    if (allocation.amount < amount) {
      throw new CustomError.BadRequestError('Payment amount exceeds allocated amount');
    }
  }

  // Validate scheduled date
  if (scheduledDate && new Date(scheduledDate) < new Date()) {
    throw new CustomError.BadRequestError('Scheduled date cannot be in the past');
  }

  // Validate bank details for bank transfer
  if (paymentMethod === 'bank_transfer') {
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankName) {
      throw new CustomError.BadRequestError('Bank details are required for bank transfer');
    }
  }

  // Validate check details for check payment
  if (paymentMethod === 'check') {
    if (!checkDetails || !checkDetails.checkNumber) {
      throw new CustomError.BadRequestError('Check number is required for check payment');
    }
  }

  // Calculate fees (if any)
  const processingFee = calculateProcessingFee(amount, paymentMethod);
  const bankFee = calculateBankFee(amount, paymentMethod);

  // Create payment record
  const paymentData = {
    demande: demandeId,
    budgetPool: budgetPoolId,
    recipient: demande.applicant._id,
    amount,
    paymentMethod,
    status: scheduledDate ? 'pending' : 'processing',
    scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
    bankDetails: paymentMethod === 'bank_transfer' ? bankDetails : undefined,
    checkDetails: paymentMethod === 'check' ? checkDetails : undefined,
    internalNotes,
    recipientNotes,
    fees: {
      processingFee,
      bankFee,
      totalFees: processingFee + bankFee
    },
    createdBy: req.user.userId
  };

  const payment = await Payment.create(paymentData);

  // Update budget pool allocation status
  if (budgetPool) {
    await budgetPool.processPayment(demandeId, amount, req.user.userId);
  }

  // Update demande payment tracking
  demande.paidAmount = (demande.paidAmount || 0) + amount;
  
  // Update demande status
  if (demande.paidAmount >= demande.approvedAmount) {
    demande.status = 'paid';
  } else {
    demande.status = 'partially_paid';
  }

  // Add payment reference to demande
  if (!demande.payment) {
    demande.payment = payment._id;
  }

  // Add status history
  demande.statusHistory.push({
    status: demande.status,
    changedBy: req.user.userId,
    reason: `Payment of ${amount} DA processed`,
    notes: `Payment method: ${paymentMethod}`
  });

  demande.updatedBy = req.user.userId;
  await demande.save();

  // Create notifications
  await createPaymentNotifications(payment, demande, 'payment_created');

  const populatedPayment = await Payment.findById(payment._id)
    .populate('demande', 'title requestNumber')
    .populate('recipient', 'name email phoneNumber')
    .populate('budgetPool', 'name poolNumber')
    .populate('createdBy', 'name email');

  res.status(StatusCodes.CREATED).json({
    message: 'Payment created successfully',
    payment: populatedPayment
  });
};

/**
 * Get All Payments
 * Retrieve payments with filtering and pagination
 */
const getAllPayments = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentMethod,
    recipient,
    budgetPool,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minAmount,
    maxAmount,
    dateFrom,
    dateTo,
    scheduledFrom,
    scheduledTo
  } = req.query;

  // Build filter object
  const filter = { isDeleted: false };

  // Role-based filtering
  if (req.user.role === 'user') {
    filter.recipient = req.user.userId;
  }

  // Status filtering
  if (status) {
    filter.status = { $in: status.split(',') };
  }

  // Payment method filtering
  if (paymentMethod) {
    filter.paymentMethod = { $in: paymentMethod.split(',') };
  }

  // Recipient filtering (staff only)
  if (recipient && req.user.role !== 'user') {
    filter.recipient = recipient;
  }

  // Budget pool filtering
  if (budgetPool) {
    filter.budgetPool = budgetPool;
  }

  // Amount range filtering
  if (minAmount) {
    filter.amount = { ...filter.amount, $gte: Number(minAmount) };
  }
  if (maxAmount) {
    filter.amount = { ...filter.amount, $lte: Number(maxAmount) };
  }

  // Date range filtering
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Scheduled date filtering
  if (scheduledFrom || scheduledTo) {
    filter.scheduledDate = {};
    if (scheduledFrom) filter.scheduledDate.$gte = new Date(scheduledFrom);
    if (scheduledTo) filter.scheduledDate.$lte = new Date(scheduledTo);
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { paymentNumber: { $regex: search, $options: 'i' } },
      { transactionId: { $regex: search, $options: 'i' } },
      { externalReference: { $regex: search, $options: 'i' } }
    ];
  }

  // Sort configuration
  const sortConfig = {};
  sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query
  const payments = await Payment.find(filter)
    .populate('demande', 'title requestNumber status')
    .populate('recipient', 'name email phoneNumber')
    .populate('budgetPool', 'name poolNumber department')
    .populate('processedBy', 'name email role')
    .populate('createdBy', 'name email role')
    .sort(sortConfig)
    .skip(skip)
    .limit(Number(limit));

  // Get total count
  const totalPayments = await Payment.countDocuments(filter);
  const totalPages = Math.ceil(totalPayments / Number(limit));

  // Calculate statistics
  const stats = await getPaymentStatistics(filter);

  res.status(StatusCodes.OK).json({
    payments,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalPayments,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    },
    statistics: stats
  });
};

/**
 * Get Single Payment
 * Get detailed payment information
 */
const getSinglePayment = async (req, res) => {
  const { id: paymentId } = req.params;

  const payment = await Payment.findById(paymentId)
    .populate('demande', 'title requestNumber status applicant')
    .populate('recipient', 'name email phoneNumber personalInfo')
    .populate('budgetPool', 'name poolNumber department totalAmount')
    .populate('processedBy', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role');

  if (!payment) {
    throw new CustomError.NotFoundError('Payment not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    checkPermissions(req.user, payment.recipient._id.toString());
  }

  res.status(StatusCodes.OK).json({
    payment
  });
};

/**
 * Update Payment
 * Update payment information
 */
const updatePayment = async (req, res) => {
  const { id: paymentId } = req.params;
  const {
    status,
    scheduledDate,
    bankDetails,
    checkDetails,
    internalNotes,
    recipientNotes,
    transactionId,
    externalReference
  } = req.body;

  // Only finance managers and admins can update payments
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only finance managers and administrators can update payments');
  }

  const payment = await Payment.findById(paymentId)
    .populate('demande', 'title status');

  if (!payment) {
    throw new CustomError.NotFoundError('Payment not found');
  }

  // Validate status transitions
  if (status) {
    const validTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['completed', 'failed', 'on_hold'],
      'completed': ['refunded'],
      'failed': ['processing', 'cancelled'],
      'on_hold': ['processing', 'cancelled'],
      'cancelled': [],
      'refunded': []
    };

    if (!validTransitions[payment.status]?.includes(status)) {
      throw new CustomError.BadRequestError(`Cannot change status from ${payment.status} to ${status}`);
    }
  }

  // Update allowed fields
  if (status) payment.status = status;
  if (scheduledDate) {
    if (new Date(scheduledDate) < new Date() && status === 'pending') {
      throw new CustomError.BadRequestError('Scheduled date cannot be in the past for pending payments');
    }
    payment.scheduledDate = new Date(scheduledDate);
  }
  if (bankDetails) payment.bankDetails = { ...payment.bankDetails, ...bankDetails };
  if (checkDetails) payment.checkDetails = { ...payment.checkDetails, ...checkDetails };
  if (internalNotes) payment.internalNotes = internalNotes;
  if (recipientNotes) payment.recipientNotes = recipientNotes;
  if (transactionId) payment.transactionId = transactionId;
  if (externalReference) payment.externalReference = externalReference;

  // Handle status-specific updates
  if (status === 'processing' && !payment.processedBy) {
    payment.processedBy = req.user.userId;
    payment.processedAt = new Date();
  }

  if (status === 'completed' && !payment.completedAt) {
    payment.completedAt = new Date();
  }

  // Handle failed payments
  if (status === 'failed') {
    payment.errorDetails = {
      errorCode: req.body.errorCode || 'PAYMENT_FAILED',
      errorMessage: req.body.errorMessage || 'Payment processing failed',
      errorDate: new Date(),
      retryCount: payment.errorDetails?.retryCount || 0
    };
  }

  payment.updatedBy = req.user.userId;
  await payment.save();

  // Update related demande status if payment completed
  if (status === 'completed') {
    const demande = await Demande.findById(payment.demande._id);
    if (demande) {
      // Check if all payments for this demande are completed
      const allPayments = await Payment.find({ demande: demande._id });
      const totalPaid = allPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      demande.paidAmount = totalPaid;

      if (totalPaid >= demande.approvedAmount) {
        demande.status = 'paid';
      } else {
        demande.status = 'partially_paid';
      }

      demande.statusHistory.push({
        status: demande.status,
        changedBy: req.user.userId,
        reason: `Payment completed: ${payment.amount} DA`
      });

      await demande.save();
    }
  }

  // Create notifications for status changes
  await createPaymentNotifications(payment, payment.demande, 'payment_updated');

  const updatedPayment = await Payment.findById(paymentId)
    .populate('demande', 'title requestNumber')
    .populate('recipient', 'name email')
    .populate('processedBy', 'name email');

  res.status(StatusCodes.OK).json({
    message: 'Payment updated successfully',
    payment: updatedPayment
  });
};

/**
 * Process Payment
 * Mark payment as completed and finalize transaction
 */
const processPayment = async (req, res) => {
  const { id: paymentId } = req.params;
  const { transactionId, completionNotes } = req.body;

  // Only finance managers and admins can process payments
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only finance managers and administrators can process payments');
  }

  const payment = await Payment.findById(paymentId)
    .populate('demande', 'title applicant')
    .populate('recipient', 'name email');

  if (!payment) {
    throw new CustomError.NotFoundError('Payment not found');
  }

  if (payment.status !== 'processing') {
    throw new CustomError.BadRequestError('Only processing payments can be completed');
  }

  // Update payment to completed
  payment.status = 'completed';
  payment.completedAt = new Date();
  payment.processedBy = req.user.userId;
  if (transactionId) payment.transactionId = transactionId;
  if (completionNotes) payment.internalNotes = completionNotes;
  payment.updatedBy = req.user.userId;

  await payment.save();

  // Update demande status
  const demande = await Demande.findById(payment.demande._id);
  const allPayments = await Payment.find({ 
    demande: demande._id, 
    status: 'completed' 
  });

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  demande.paidAmount = totalPaid;

  if (totalPaid >= demande.approvedAmount) {
    demande.status = 'paid';
  } else {
    demande.status = 'partially_paid';
  }

  demande.statusHistory.push({
    status: demande.status,
    changedBy: req.user.userId,
    reason: `Payment processed: ${payment.amount} DA`,
    notes: completionNotes
  });

  await demande.save();

  // Create completion notification
  await createNotification({
    recipient: payment.recipient._id,
    type: 'payment',
    title: 'Payment Processed',
    message: `Your payment of ${payment.amount} DA has been processed successfully.`,
    relatedEntities: { payment: payment._id, demande: demande._id },
    channels: { inApp: { enabled: true }, email: { enabled: true } }
  });

  res.status(StatusCodes.OK).json({
    message: 'Payment processed successfully',
    payment
  });
};

/**
 * Cancel Payment
 * Cancel pending or processing payment
 */
const cancelPayment = async (req, res) => {
  const { id: paymentId } = req.params;
  const { reason } = req.body;

  // Only finance managers and admins can cancel payments
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only finance managers and administrators can cancel payments');
  }

  if (!reason) {
    throw new CustomError.BadRequestError('Please provide cancellation reason');
  }

  const payment = await Payment.findById(paymentId)
    .populate('demande', 'title')
    .populate('budgetPool');

  if (!payment) {
    throw new CustomError.NotFoundError('Payment not found');
  }

  if (!['pending', 'processing', 'on_hold'].includes(payment.status)) {
    throw new CustomError.BadRequestError('Only pending, processing, or on-hold payments can be cancelled');
  }

  // Release budget allocation if exists
  if (payment.budgetPool) {
    const budgetPool = await BudgetPool.findById(payment.budgetPool._id);
    if (budgetPool) {
      await budgetPool.cancelAllocation(payment.demande._id, req.user.userId, reason);
    }
  }

  // Update payment status
  payment.status = 'cancelled';
  payment.internalNotes = `Cancelled: ${reason}`;
  payment.updatedBy = req.user.userId;

  await payment.save();

  // Update demande status back to approved
  const demande = await Demande.findById(payment.demande._id);
  if (demande && demande.status === 'partially_paid') {
    // Recalculate paid amount excluding cancelled payment
    const remainingPayments = await Payment.find({ 
      demande: demande._id, 
      status: 'completed' 
    });
    
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
    demande.paidAmount = totalPaid;
    
    if (totalPaid === 0) {
      demande.status = 'approved';
    }

    demande.statusHistory.push({
      status: demande.status,
      changedBy: req.user.userId,
      reason: `Payment cancelled: ${reason}`
    });

    await demande.save();
  }

  // Notify recipient
  await createNotification({
    recipient: payment.recipient,
    type: 'payment',
    title: 'Payment Cancelled',
    message: `Your payment of ${payment.amount} DA has been cancelled. Reason: ${reason}`,
    relatedEntities: { payment: payment._id },
    channels: { inApp: { enabled: true }, email: { enabled: true } }
  });

  res.status(StatusCodes.OK).json({
    message: 'Payment cancelled successfully',
    payment
  });
};

/**
 * Retry Failed Payment
 * Retry a failed payment
 */
const retryPayment = async (req, res) => {
  const { id: paymentId } = req.params;

  // Only finance managers and admins can retry payments
  if (!['admin', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only finance managers and administrators can retry payments');
  }

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new CustomError.NotFoundError('Payment not found');
  }

  if (payment.status !== 'failed') {
    throw new CustomError.BadRequestError('Only failed payments can be retried');
  }

  if (payment.errorDetails?.retryCount >= 5) {
    throw new CustomError.BadRequestError('Maximum retry attempts reached');
  }

  // Update payment for retry
  payment.status = 'processing';
  payment.errorDetails.retryCount = (payment.errorDetails.retryCount || 0) + 1;
  payment.processedBy = req.user.userId;
  payment.processedAt = new Date();
  payment.updatedBy = req.user.userId;

  await payment.save();

  res.status(StatusCodes.OK).json({
    message: 'Payment retry initiated',
    payment
  });
};

/**
 * Get Payment Statistics
 * Get payment analytics and statistics
 */
const getPaymentStatistics = async (filter = {}) => {
  const stats = await Payment.aggregate([
    { $match: { ...filter, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.totalFees' },
        avgAmount: { $avg: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    totalFees: 0,
    avgAmount: 0,
    completedPayments: 0,
    failedPayments: 0,
    pendingPayments: 0
  };
};

/**
 * Get Dashboard Statistics
 * Get payment dashboard data
 */
const getDashboardStats = async (req, res) => {
  let filter = { isDeleted: false };

  // Users only see their own payment stats
  if (req.user.role === 'user') {
    filter.recipient = req.user.userId;
  }

  const stats = await getPaymentStatistics(filter);

  // Get payment method breakdown
  const methodBreakdown = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Get recent payments
  const recentPayments = await Payment.find(filter)
    .populate('recipient', 'name email')
    .populate('demande', 'title requestNumber')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('amount status paymentMethod createdAt recipient demande');

  res.status(StatusCodes.OK).json({
    statistics: stats,
    methodBreakdown,
    recentPayments
  });
};

// Helper Functions

/**
 * Calculate processing fee
 */
const calculateProcessingFee = (amount, paymentMethod) => {
  const feeRates = {
    'bank_transfer': 0.005, // 0.5%
    'check': 0,
    'cash': 0,
    'mobile_payment': 0.01, // 1%
    'card': 0.025, // 2.5%
    'other': 0
  };

  const rate = feeRates[paymentMethod] || 0;
  return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate bank fee
 */
const calculateBankFee = (amount, paymentMethod) => {
  const fixedFees = {
    'bank_transfer': amount > 10000 ? 50 : 25,
    'check': 0,
    'cash': 0,
    'mobile_payment': 10,
    'card': 15,
    'other': 0
  };

  return fixedFees[paymentMethod] || 0;
};

/**
 * Create payment notifications
 */
const createPaymentNotifications = async (payment, demande, eventType) => {
  try {
    let title, message;

    switch (eventType) {
      case 'payment_created':
        title = 'Payment Initiated';
        message = `Payment of ${payment.amount} DA has been initiated for your request "${demande.title}".`;
        break;
      case 'payment_updated':
        title = 'Payment Status Updated';
        message = `Payment status for your request "${demande.title}" has been updated to ${payment.status}.`;
        break;
      default:
        title = 'Payment Notification';
        message = `Payment update for your request "${demande.title}".`;
    }

    await createNotification({
      recipient: payment.recipient,
      type: 'payment',
      title,
      message,
      relatedEntities: { 
        payment: payment._id, 
        demande: demande._id 
      },
      channels: { 
        inApp: { enabled: true }, 
        email: { enabled: true } 
      }
    });
  } catch (error) {
    console.error('Failed to create payment notification:', error);
  }
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
  createPayment,
  getAllPayments,
  getSinglePayment,
  updatePayment,
  processPayment,
  cancelPayment,
  retryPayment,
  getDashboardStats
};