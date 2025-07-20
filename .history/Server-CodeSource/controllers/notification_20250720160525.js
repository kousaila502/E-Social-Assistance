const { StatusCodes } = require('http-status-codes');
const Notification = require('../models/notification');
const User = require('../models/user');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

/**
 * Create Notification
 * Create single or batch notifications with multi-channel delivery
 */
const createNotification = async (req, res) => {
  const {
    title,
    message,
    type = 'system',
    category = 'info',
    priority = 'normal',
    recipients, // Array of user IDs or single ID
    channels = { inApp: { enabled: true } },
    relatedEntities = {},
    actionRequired = false,
    actionType = 'none',
    actionUrl,
    actionData,
    scheduledFor,
    expiresAt,
    template,
    metadata = {}
  } = req.body;

  // Only staff can create notifications (except auto-generated ones)
  if (!['admin', 'case_worker', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only staff members can create notifications');
  }

  // Input validation
  if (!title || !message) {
    throw new CustomError.BadRequestError('Title and message are required');
  }

  if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
    throw new CustomError.BadRequestError('At least one recipient is required');
  }

  // Validate notification type
  const validTypes = [
    'system', 'request_status', 'payment', 'announcement', 'reminder', 
    'alert', 'welcome', 'approval_required', 'document_required', 'deadline_approaching'
  ];
  if (!validTypes.includes(type)) {
    throw new CustomError.BadRequestError('Invalid notification type');
  }

  // Validate category
  const validCategories = ['info', 'success', 'warning', 'error', 'urgent'];
  if (!validCategories.includes(category)) {
    throw new CustomError.BadRequestError('Invalid notification category');
  }

  // Validate priority
  const validPriorities = ['low', 'normal', 'high', 'critical'];
  if (!validPriorities.includes(priority)) {
    throw new CustomError.BadRequestError('Invalid notification priority');
  }

  // Validate action type if action required
  if (actionRequired) {
    const validActionTypes = [
      'review_request', 'approve_payment', 'upload_document', 'update_profile',
      'respond_to_message', 'complete_application', 'view_announcement', 'none'
    ];
    if (!validActionTypes.includes(actionType)) {
      throw new CustomError.BadRequestError('Invalid action type');
    }
  }

  // Validate scheduled time
  if (scheduledFor && new Date(scheduledFor) <= new Date()) {
    throw new CustomError.BadRequestError('Scheduled time must be in the future');
  }

  // Validate expiration time
  if (expiresAt && scheduledFor && new Date(expiresAt) <= new Date(scheduledFor)) {
    throw new CustomError.BadRequestError('Expiration time must be after scheduled time');
  }

  // Normalize recipients to array
  const recipientIds = Array.isArray(recipients) ? recipients : [recipients];

  // Validate recipients exist and are active
  const validRecipients = await User.find({
    _id: { $in: recipientIds },
    isDeleted: false,
    accountStatus: { $in: ['active', 'pending_verification'] }
  }).select('_id preferences');

  if (validRecipients.length !== recipientIds.length) {
    const invalidIds = recipientIds.filter(id => 
      !validRecipients.some(user => user._id.toString() === id.toString())
    );
    throw new CustomError.BadRequestError(`Invalid or inactive recipients: ${invalidIds.join(', ')}`);
  }

  // Create notifications for each recipient
  const notifications = [];
  
  for (const recipient of validRecipients) {
    // Customize channels based on user preferences
    const userChannels = customizeChannelsForUser(channels, recipient.preferences);
    
    // Apply template if provided
    let finalTitle = title;
    let finalMessage = message;
    
    if (template && template.variables) {
      finalTitle = applyTemplate(title, template.variables);
      finalMessage = applyTemplate(message, template.variables);
    }

    const notificationData = {
      title: finalTitle,
      message: finalMessage,
      type,
      category,
      priority,
      isUrgent: priority === 'critical' || category === 'urgent',
      recipient: recipient._id,
      channels: userChannels,
      relatedEntities,
      actionRequired,
      actionType,
      actionUrl,
      actionData,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      template,
      metadata: {
        ...metadata,
        source: 'manual'
      },
      language: recipient.preferences?.language || 'ar',
      createdBy: req.user.userId
    };

    const notification = await Notification.create(notificationData);
    notifications.push(notification);

    // If not scheduled, process immediately
    if (!scheduledFor) {
      await processNotificationDelivery(notification);
    }
  }

  // Populate the created notifications
  const populatedNotifications = await Notification.find({
    _id: { $in: notifications.map(n => n._id) }
  })
    .populate('recipient', 'name email phoneNumber preferences')
    .populate('createdBy', 'name email role');

  res.status(StatusCodes.CREATED).json({
    message: `${notifications.length} notification(s) created successfully`,
    notifications: populatedNotifications,
    scheduled: !!scheduledFor
  });
};

/**
 * Get All Notifications
 * Admin/staff view with advanced filtering
 */
const getAllNotifications = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    priority,
    status,
    recipient,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    dateFrom,
    dateTo,
    isRead,
    actionRequired,
    deliveryStatus
  } = req.query;

  // Only staff can view all notifications
  if (!['admin', 'case_worker', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only staff members can view all notifications');
  }

  // Build filter object
  const filter = { isDeleted: false };

  // Type filtering
  if (type) {
    filter.type = { $in: type.split(',') };
  }

  // Category filtering
  if (category) {
    filter.category = { $in: category.split(',') };
  }

  // Priority filtering
  if (priority) {
    filter.priority = { $in: priority.split(',') };
  }

  // Status filtering
  if (status) {
    filter.status = { $in: status.split(',') };
  }

  // Recipient filtering
  if (recipient) {
    filter.recipient = recipient;
  }

  // Date range filtering
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Read status filtering
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }

  // Action required filtering
  if (actionRequired !== undefined) {
    filter.actionRequired = actionRequired === 'true';
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
      { notificationNumber: { $regex: search, $options: 'i' } }
    ];
  }

  // Delivery status filtering (complex aggregation needed)
  let pipeline = [{ $match: filter }];

  if (deliveryStatus) {
    pipeline.push({
      $addFields: {
        deliveryStatus: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $eq: ['$channels.inApp.enabled', true] },
                    { $eq: ['$channels.inApp.delivered', false] },
                    { $eq: ['$channels.email.enabled', true] },
                    { $eq: ['$channels.email.delivered', false] }
                  ]
                },
                then: 'not_delivered'
              },
              {
                case: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$channels.inApp.enabled', false] },
                        { $eq: ['$channels.inApp.delivered', true] }
                      ]
                    },
                    {
                      $or: [
                        { $eq: ['$channels.email.enabled', false] },
                        { $eq: ['$channels.email.delivered', true] }
                      ]
                    }
                  ]
                },
                then: 'fully_delivered'
              }
            ],
            default: 'partially_delivered'
          }
        }
      }
    });

    pipeline.push({
      $match: { deliveryStatus: deliveryStatus }
    });
  }

  // Sort configuration
  const sortConfig = {};
  sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;
  pipeline.push({ $sort: sortConfig });

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  pipeline.push({ $skip: skip }, { $limit: Number(limit) });

  // Population
  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'recipient',
        foreignField: '_id',
        as: 'recipient',
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
    { $unwind: { path: '$recipient', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } }
  );

  // Execute aggregation
  const notifications = await Notification.aggregate(pipeline);

  // Get total count
  const totalCountPipeline = [{ $match: filter }];
  if (deliveryStatus) {
    totalCountPipeline.push(
      {
        $addFields: {
          deliveryStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ['$channels.inApp.enabled', true] },
                      { $eq: ['$channels.inApp.delivered', false] },
                      { $eq: ['$channels.email.enabled', true] },
                      { $eq: ['$channels.email.delivered', false] }
                    ]
                  },
                  then: 'not_delivered'
                },
                {
                  case: {
                    $and: [
                      {
                        $or: [
                          { $eq: ['$channels.inApp.enabled', false] },
                          { $eq: ['$channels.inApp.delivered', true] }
                        ]
                      },
                      {
                        $or: [
                          { $eq: ['$channels.email.enabled', false] },
                          { $eq: ['$channels.email.delivered', true] }
                        ]
                      }
                    ]
                  },
                  then: 'fully_delivered'
                }
              ],
              default: 'partially_delivered'
            }
          }
        }
      },
      { $match: { deliveryStatus: deliveryStatus } }
    );
  }
  totalCountPipeline.push({ $count: 'total' });

  const totalResult = await Notification.aggregate(totalCountPipeline);
  const totalNotifications = totalResult[0]?.total || 0;
  const totalPages = Math.ceil(totalNotifications / Number(limit));

  // Calculate statistics
  const stats = await getNotificationStatistics(filter);

  res.status(StatusCodes.OK).json({
    notifications,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalNotifications,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    },
    statistics: stats
  });
};

/**
 * Get User Notifications
 * User's personal notification feed
 */
const getUserNotifications = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    isRead,
    actionRequired,
    dateFrom,
    dateTo
  } = req.query;

  // Build filter for user's notifications
  const filter = {
    recipient: req.user.userId,
    isDeleted: false
  };

  // Apply filters
  if (type) filter.type = { $in: type.split(',') };
  if (category) filter.category = { $in: category.split(',') };
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  if (actionRequired !== undefined) filter.actionRequired = actionRequired === 'true';

  // Date range filtering
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Check for expired notifications
  const now = new Date();
  filter.$or = [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gt: now } }
  ];

  // Sort and pagination
  const skip = (Number(page) - 1) * Number(limit);

  const notifications = await Notification.find(filter)
    .populate('createdBy', 'name email role')
    .populate('relatedEntities.demande', 'title requestNumber')
    .populate('relatedEntities.announcement', 'title')
    .populate('relatedEntities.budgetPool', 'name poolNumber')
    .populate('relatedEntities.payment', 'amount paymentNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Get total count
  const totalNotifications = await Notification.countDocuments(filter);
  const totalPages = Math.ceil(totalNotifications / Number(limit));

  // Get unread count
  const unreadCount = await Notification.countDocuments({
    ...filter,
    isRead: false
  });

  // Get action required count
  const actionRequiredCount = await Notification.countDocuments({
    ...filter,
    actionRequired: true,
    isRead: false
  });

  res.status(StatusCodes.OK).json({
    notifications,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalNotifications,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    },
    summary: {
      unreadCount,
      actionRequiredCount,
      totalCount: totalNotifications
    }
  });
};

/**
 * Mark As Read
 * Mark notification(s) as read
 */
const markAsRead = async (req, res) => {
  const { id: notificationId } = req.params;
  const { markAll = false } = req.body;

  if (markAll) {
    // Mark all notifications as read for user
    const result = await Notification.updateMany(
      {
        recipient: req.user.userId,
        isRead: false,
        isDeleted: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(StatusCodes.OK).json({
      message: `${result.modifiedCount} notifications marked as read`
    });
  } else {
    // Mark single notification as read
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new CustomError.NotFoundError('Notification not found');
    }

    // Check permissions
    if (notification.recipient.toString() !== req.user.userId) {
      throw new CustomError.UnauthorizedError('You can only mark your own notifications as read');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      notification.status = 'read';

      // Update analytics
      if (notification.sentAt) {
        notification.analytics.readTime = Date.now() - notification.sentAt.getTime();
      }

      await notification.save();
    }

    res.status(StatusCodes.OK).json({
      message: 'Notification marked as read',
      notification
    });
  }
};

/**
 * Mark As Clicked
 * Track notification click events
 */
const markAsClicked = async (req, res) => {
  const { id: notificationId } = req.params;
  const { deviceInfo, location } = req.body;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new CustomError.NotFoundError('Notification not found');
  }

  // Check permissions
  if (notification.recipient.toString() !== req.user.userId) {
    throw new CustomError.UnauthorizedError('You can only interact with your own notifications');
  }

  if (!notification.isClicked) {
    notification.isClicked = true;
    notification.clickedAt = new Date();
    notification.status = 'clicked';

    // Update analytics
    if (notification.readAt) {
      notification.analytics.clickTime = Date.now() - notification.readAt.getTime();
    }

    if (deviceInfo) {
      notification.analytics.deviceInfo = deviceInfo;
    }

    if (location) {
      notification.analytics.location = location;
    }

    await notification.save();
  }

  res.status(StatusCodes.OK).json({
    message: 'Notification click tracked',
    actionUrl: notification.actionUrl,
    actionData: notification.actionData
  });
};

/**
 * Send Bulk Notifications
 * Send notifications to multiple users based on criteria
 */
const sendBulkNotifications = async (req, res) => {
  const {
    title,
    message,
    type = 'system',
    category = 'info',
    priority = 'normal',
    targetCriteria = {},
    channels = { inApp: { enabled: true } },
    scheduledFor,
    template,
    metadata = {}
  } = req.body;

  // Only admin and case workers can send bulk notifications
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and case workers can send bulk notifications');
  }

  // Input validation
  if (!title || !message) {
    throw new CustomError.BadRequestError('Title and message are required');
  }

  // Build user filter based on target criteria
  const userFilter = {
    isDeleted: false,
    accountStatus: { $in: ['active', 'pending_verification'] }
  };

  // Apply targeting criteria
  if (targetCriteria.roles) {
    userFilter.role = { $in: targetCriteria.roles };
  }

  if (targetCriteria.departments) {
    userFilter['personalInfo.address.wilaya'] = { $in: targetCriteria.departments };
  }

  if (targetCriteria.eligibilityStatus) {
    userFilter['eligibility.status'] = { $in: targetCriteria.eligibilityStatus };
  }

  if (targetCriteria.categories) {
    userFilter['eligibility.categories'] = { $in: targetCriteria.categories };
  }

  if (targetCriteria.ageRange) {
    const now = new Date();
    if (targetCriteria.ageRange.min) {
      const maxBirthDate = new Date(now.getFullYear() - targetCriteria.ageRange.min, now.getMonth(), now.getDate());
      userFilter['personalInfo.dateOfBirth'] = { ...userFilter['personalInfo.dateOfBirth'], $lte: maxBirthDate };
    }
    if (targetCriteria.ageRange.max) {
      const minBirthDate = new Date(now.getFullYear() - targetCriteria.ageRange.max, now.getMonth(), now.getDate());
      userFilter['personalInfo.dateOfBirth'] = { ...userFilter['personalInfo.dateOfBirth'], $gte: minBirthDate };
    }
  }

  // Get target users
  const targetUsers = await User.find(userFilter).select('_id preferences');

  if (targetUsers.length === 0) {
    throw new CustomError.BadRequestError('No users match the specified criteria');
  }

  // Create batch notification record
  const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Create notifications for each user
  const notifications = [];
  const batchSize = 100; // Process in batches to avoid memory issues

  for (let i = 0; i < targetUsers.length; i += batchSize) {
    const batch = targetUsers.slice(i, i + batchSize);
    
    const batchNotifications = batch.map(user => {
      const userChannels = customizeChannelsForUser(channels, user.preferences);
      
      let finalTitle = title;
      let finalMessage = message;
      
      if (template && template.variables) {
        finalTitle = applyTemplate(title, template.variables);
        finalMessage = applyTemplate(message, template.variables);
      }

      return {
        title: finalTitle,
        message: finalMessage,
        type,
        category,
        priority,
        isUrgent: priority === 'critical' || category === 'urgent',
        recipient: user._id,
        channels: userChannels,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        template,
        batchId,
        metadata: {
          ...metadata,
          source: 'bulk',
          targetCriteria
        },
        language: user.preferences?.language || 'ar',
        createdBy: req.user.userId
      };
    });

    const createdNotifications = await Notification.insertMany(batchNotifications);
    notifications.push(...createdNotifications);

    // Process delivery for immediate notifications
    if (!scheduledFor) {
      for (const notification of createdNotifications) {
        await processNotificationDelivery(notification);
      }
    }
  }

  res.status(StatusCodes.OK).json({
    message: `Bulk notification sent to ${notifications.length} users`,
    batchId,
    recipientCount: notifications.length,
    scheduled: !!scheduledFor
  });
};

/**
 * Retry Failed Notifications
 * Retry notifications that failed delivery
 */
const retryFailedNotifications = async (req, res) => {
  const { batchId, maxRetries = 3 } = req.body;

  // Only admin can retry notifications
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can retry failed notifications');
  }

  // Build filter for failed notifications
  const filter = {
    status: 'failed',
    retryCount: { $lt: maxRetries },
    isDeleted: false
  };

  if (batchId) {
    filter.batchId = batchId;
  }

  // Add retry condition (not recently retried)
  filter.$or = [
    { retryAfter: { $exists: false } },
    { retryAfter: null },
    { retryAfter: { $lte: new Date() } }
  ];

  const failedNotifications = await Notification.find(filter);

  if (failedNotifications.length === 0) {
    return res.status(StatusCodes.OK).json({
      message: 'No notifications available for retry'
    });
  }

  let retryCount = 0;
  let successCount = 0;

  for (const notification of failedNotifications) {
    try {
      // Increment retry count
      notification.retryCount += 1;
      
      // Retry delivery
      const success = await processNotificationDelivery(notification);
      
      if (success) {
        successCount++;
      } else {
        // Set next retry time with exponential backoff
        const backoffMinutes = Math.pow(2, notification.retryCount);
        notification.retryAfter = new Date(Date.now() + backoffMinutes * 60 * 1000);
      }

      await notification.save();
      retryCount++;
    } catch (error) {
      console.error(`Failed to retry notification ${notification._id}:`, error);
    }
  }

  res.status(StatusCodes.OK).json({
    message: `Retry completed for ${retryCount} notifications`,
    retriedCount: retryCount,
    successCount,
    failedCount: retryCount - successCount
  });
};

/**
 * Get Notification Statistics
 * Delivery and engagement analytics
 */
const getNotificationStats = async (req, res) => {
  const { 
    period = '30days',
    groupBy = 'day'
  } = req.query;

  // Only staff can view statistics
  if (!['admin', 'case_worker', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only staff members can view notification statistics');
  }

  // Calculate date range
  let startDate;
  switch (period) {
    case '7days':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90days':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1year':
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const stats = await getNotificationStatistics({ 
    createdAt: { $gte: startDate },
    isDeleted: false 
  });

  // Engagement trends
  const engagementTrends = await getEngagementTrends(startDate, groupBy);

  // Channel performance
  const channelPerformance = await getChannelPerformance(startDate);

  // Type breakdown
  const typeBreakdown = await Notification.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        readRate: {
          $avg: { $cond: ['$isRead', 1, 0] }
        },
        clickRate: {
          $avg: { $cond: ['$isClicked', 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(StatusCodes.OK).json({
    period,
    statistics: stats,
    trends: engagementTrends,
    channelPerformance,
    typeBreakdown
  });
};

/**
 * Manage Templates
 * Template management for notification system
 */
const manageTemplates = async (req, res) => {
  const { action, templateId, templateData } = req.body;

  // Only admin can manage templates
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can manage notification templates');
  }

  switch (action) {
    case 'create':
      // Create new template (stored in database or cache)
      // Implementation depends on your template storage strategy
      res.status(StatusCodes.CREATED).json({
        message: 'Template created successfully',
        templateId: `TPL-${Date.now()}`
      });
      break;

    case 'update':
      // Update existing template
      res.status(StatusCodes.OK).json({
        message: 'Template updated successfully'
      });
      break;

    case 'delete':
      // Delete template
      res.status(StatusCodes.OK).json({
        message: 'Template deleted successfully'
      });
      break;

    case 'list':
      // List all templates
      res.status(StatusCodes.OK).json({
        templates: [] // Return template list
      });
      break;

    default:
      throw new CustomError.BadRequestError('Invalid template action');
  }
};

// Helper Functions

/**
 * Customize channels based on user preferences
 */
const customizeChannelsForUser = (channels, userPreferences) => {
  const customChannels = JSON.parse(JSON.stringify(channels)); // Deep clone

  if (userPreferences?.notifications) {
    // Apply user email preference
    if (customChannels.email && userPreferences.notifications.email === false) {
      customChannels.email.enabled = false;
    }

    // Apply user SMS preference
    if (customChannels.sms && userPreferences.notifications.sms === false) {
      customChannels.sms.enabled = false;
    }
  }

  return customChannels;
};

/**
 * Apply template variables to text
 */
const applyTemplate = (text, variables) => {
  let result = text;
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
  });

  return result;
};

/**
 * Process notification delivery across all channels
 */
const processNotificationDelivery = async (notification) => {
  try {
    let deliverySuccess = false;

    // In-app notification (always succeeds if enabled)
    if (notification.channels.inApp?.enabled) {
      notification.channels.inApp.delivered = true;
      notification.channels.inApp.deliveredAt = new Date();
      deliverySuccess = true;
    }

    // Email delivery (simulate)
    if (notification.channels.email?.enabled) {
      try {
        // Here you would integrate with actual email service (Nodemailer, SendGrid, etc.)
        // For now, we'll simulate success/failure
        const emailSuccess = Math.random() > 0.1; // 90% success rate
        
        if (emailSuccess) {
          notification.channels.email.delivered = true;
          notification.channels.email.deliveredAt = new Date();
          deliverySuccess = true;
        } else {
          notification.channels.email.attempts += 1;
          notification.channels.email.lastAttempt = new Date();
          notification.channels.email.errorMessage = 'Email delivery failed';
        }
      } catch (error) {
        notification.channels.email.attempts += 1;
        notification.channels.email.lastAttempt = new Date();
        notification.channels.email.errorMessage = error.message;
      }
    }

    // SMS delivery (simulate)
    if (notification.channels.sms?.enabled) {
      try {
        const smsSuccess = Math.random() > 0.15; // 85% success rate
        
        if (smsSuccess) {
          notification.channels.sms.delivered = true;
          notification.channels.sms.deliveredAt = new Date();
          deliverySuccess = true;
        } else {
          notification.channels.sms.attempts += 1;
          notification.channels.sms.lastAttempt = new Date();
          notification.channels.sms.errorMessage = 'SMS delivery failed';
        }
      } catch (error) {
        notification.channels.sms.attempts += 1;
        notification.channels.sms.lastAttempt = new Date();
        notification.channels.sms.errorMessage = error.message;
      }
    }

    // Push notification delivery (simulate)
    if (notification.channels.push?.enabled) {
      try {
        const pushSuccess = Math.random() > 0.2; // 80% success rate
        
        if (pushSuccess) {
          notification.channels.push.delivered = true;
          notification.channels.push.deliveredAt = new Date();
          deliverySuccess = true;
        } else {
          notification.channels.push.attempts += 1;
          notification.channels.push.lastAttempt = new Date();
          notification.channels.push.errorMessage = 'Push notification delivery failed';
        }
      } catch (error) {
        notification.channels.push.attempts += 1;
        notification.channels.push.lastAttempt = new Date();
        notification.channels.push.errorMessage = error.message;
      }
    }

    // Update notification status
    if (deliverySuccess) {
      notification.status = 'sent';
      notification.sentAt = new Date();
    } else {
      notification.status = 'failed';
    }

    await notification.save();
    return deliverySuccess;
  } catch (error) {
    console.error('Notification delivery error:', error);
    notification.status = 'failed';
    await notification.save();
    return false;
  }
};

/**
 * Get notification statistics
 */
const getNotificationStatistics = async (filter) => {
  const stats = await Notification.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalNotifications: { $sum: 1 },
        sentNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        deliveredNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        readNotifications: {
          $sum: { $cond: ['$isRead', 1, 0] }
        },
        clickedNotifications: {
          $sum: { $cond: ['$isClicked', 1, 0] }
        },
        failedNotifications: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        urgentNotifications: {
          $sum: { $cond: ['$isUrgent', 1, 0] }
        },
        actionRequiredNotifications: {
          $sum: { $cond: ['$actionRequired', 1, 0] }
        },
        avgDeliveryTime: {
          $avg: {
            $cond: [
              { $and: ['$sentAt', '$analytics.deliveryTime'] },
              '$analytics.deliveryTime',
              null
            ]
          }
        },
        avgReadTime: {
          $avg: {
            $cond: [
              { $and: ['$readAt', '$analytics.readTime'] },
              '$analytics.readTime',
              null
            ]
          }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalNotifications: 0,
    sentNotifications: 0,
    deliveredNotifications: 0,
    readNotifications: 0,
    clickedNotifications: 0,
    failedNotifications: 0,
    urgentNotifications: 0,
    actionRequiredNotifications: 0,
    avgDeliveryTime: 0,
    avgReadTime: 0
  };

  // Calculate rates
  const deliveryRate = result.totalNotifications > 0 
    ? (result.sentNotifications / result.totalNotifications) * 100 
    : 0;
  
  const readRate = result.sentNotifications > 0 
    ? (result.readNotifications / result.sentNotifications) * 100 
    : 0;
    
  const clickRate = result.readNotifications > 0 
    ? (result.clickedNotifications / result.readNotifications) * 100 
    : 0;

  const failureRate = result.totalNotifications > 0 
    ? (result.failedNotifications / result.totalNotifications) * 100 
    : 0;

  return {
    ...result,
    deliveryRate: parseFloat(deliveryRate.toFixed(2)),
    readRate: parseFloat(readRate.toFixed(2)),
    clickRate: parseFloat(clickRate.toFixed(2)),
    failureRate: parseFloat(failureRate.toFixed(2))
  };
};

/**
 * Get engagement trends over time
 */
const getEngagementTrends = async (startDate, groupBy) => {
  const groupStage = groupBy === 'hour' 
    ? {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        hour: { $hour: '$createdAt' }
      }
    : groupBy === 'day'
    ? {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      }
    : {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };

  return await Notification.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: groupStage,
        totalSent: { $sum: 1 },
        totalRead: { $sum: { $cond: ['$isRead', 1, 0] } },
        totalClicked: { $sum: { $cond: ['$isClicked', 1, 0] } },
        totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
      }
    },
    {
      $addFields: {
        readRate: {
          $cond: [
            { $gt: ['$totalSent', 0] },
            { $multiply: [{ $divide: ['$totalRead', '$totalSent'] }, 100] },
            0
          ]
        },
        clickRate: {
          $cond: [
            { $gt: ['$totalRead', 0] },
            { $multiply: [{ $divide: ['$totalClicked', '$totalRead'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ]);
};

/**
 * Get channel performance statistics
 */
const getChannelPerformance = async (startDate) => {
  return await Notification.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isDeleted: false
      }
    },
    {
      $project: {
        inAppEnabled: '$channels.inApp.enabled',
        inAppDelivered: '$channels.inApp.delivered',
        emailEnabled: '$channels.email.enabled',
        emailDelivered: '$channels.email.delivered',
        smsEnabled: '$channels.sms.enabled',
        smsDelivered: '$channels.sms.delivered',
        pushEnabled: '$channels.push.enabled',
        pushDelivered: '$channels.push.delivered'
      }
    },
    {
      $group: {
        _id: null,
        inApp: {
          enabled: { $sum: { $cond: ['$inAppEnabled', 1, 0] } },
          delivered: { $sum: { $cond: [{ $and: ['$inAppEnabled', '$inAppDelivered'] }, 1, 0] } }
        },
        email: {
          enabled: { $sum: { $cond: ['$emailEnabled', 1, 0] } },
          delivered: { $sum: { $cond: [{ $and: ['$emailEnabled', '$emailDelivered'] }, 1, 0] } }
        },
        sms: {
          enabled: { $sum: { $cond: ['$smsEnabled', 1, 0] } },
          delivered: { $sum: { $cond: [{ $and: ['$smsEnabled', '$smsDelivered'] }, 1, 0] } }
        },
        push: {
          enabled: { $sum: { $cond: ['$pushEnabled', 1, 0] } },
          delivered: { $sum: { $cond: [{ $and: ['$pushEnabled', '$pushDelivered'] }, 1, 0] } }
        }
      }
    },
    {
      $project: {
        inApp: {
          enabled: '$inApp.enabled',
          delivered: '$inApp.delivered',
          deliveryRate: {
            $cond: [
              { $gt: ['$inApp.enabled', 0] },
              { $multiply: [{ $divide: ['$inApp.delivered', '$inApp.enabled'] }, 100] },
              0
            ]
          }
        },
        email: {
          enabled: '$email.enabled',
          delivered: '$email.delivered',
          deliveryRate: {
            $cond: [
              { $gt: ['$email.enabled', 0] },
              { $multiply: [{ $divide: ['$email.delivered', '$email.enabled'] }, 100] },
              0
            ]
          }
        },
        sms: {
          enabled: '$sms.enabled',
          delivered: '$sms.delivered',
          deliveryRate: {
            $cond: [
              { $gt: ['$sms.enabled', 0] },
              { $multiply: [{ $divide: ['$sms.delivered', '$sms.enabled'] }, 100] },
              0
            ]
          }
        },
        push: {
          enabled: '$push.enabled',
          delivered: '$push.delivered',
          deliveryRate: {
            $cond: [
              { $gt: ['$push.enabled', 0] },
              { $multiply: [{ $divide: ['$push.delivered', '$push.enabled'] }, 100] },
              0
            ]
          }
        }
      }
    }
  ]);
};

/**
 * Process Scheduled Notifications
 * Background job to process scheduled notifications
 */
const processScheduledNotifications = async (req, res) => {
  // Only system/admin can trigger this
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can process scheduled notifications');
  }

  const now = new Date();
  
  // Find notifications that should be sent now
  const scheduledNotifications = await Notification.find({
    status: 'pending',
    scheduledFor: { $lte: now },
    isDeleted: false
  }).limit(100); // Process in batches

  let processedCount = 0;
  let successCount = 0;

  for (const notification of scheduledNotifications) {
    try {
      const success = await processNotificationDelivery(notification);
      if (success) successCount++;
      processedCount++;
    } catch (error) {
      console.error(`Failed to process scheduled notification ${notification._id}:`, error);
    }
  }

  res.status(StatusCodes.OK).json({
    message: `Processed ${processedCount} scheduled notifications`,
    processedCount,
    successCount,
    failedCount: processedCount - successCount
  });
};

/**
 * Clean Expired Notifications
 * Remove expired notifications to maintain database performance
 */
const cleanExpiredNotifications = async (req, res) => {
  // Only admin can trigger cleanup
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can clean expired notifications');
  }

  const now = new Date();
  
  // Soft delete expired notifications
  const result = await Notification.updateMany(
    {
      expiresAt: { $lt: now },
      isDeleted: false
    },
    {
      isDeleted: true,
      deletedAt: now
    }
  );

  res.status(StatusCodes.OK).json({
    message: `Cleaned ${result.modifiedCount} expired notifications`,
    cleanedCount: result.modifiedCount
  });
};

module.exports = {
  createNotification,
  getAllNotifications,
  getUserNotifications,
  markAsRead,
  markAsClicked,
  sendBulkNotifications,
  retryFailedNotifications,
  getNotificationStats,
  manageTemplates,
  processScheduledNotifications,
  cleanExpiredNotifications
};