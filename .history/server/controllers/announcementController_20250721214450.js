const { StatusCodes } = require('http-status-codes');
const Announcement = require('../models/announcement');
const User = require('../models/user');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

// @desc Create a new announcement
const createAnnouncement = async (req, res) => {
  const { role } = req.user;
  
  // Check permissions - only admin and case_worker can create
  if (role !== 'admin' && role !== 'case_worker') {
    throw new CustomError.UnauthorizedError('Not authorized to create announcements');
  }

  const {
    title,
    description,
    type,
    priority,
    targetAudience,
    applicationConfig,
    contactInfo,
    scheduledPublishAt,
    expiresAt,
    tags,
    category
  } = req.body;

  // Validate required fields
  if (!title || !description || !type) {
    throw new CustomError.BadRequestError('Title, description, and type are required');
  }

  // Validate type
  const validTypes = ['event', 'program', 'service', 'opportunity', 'notice'];
  if (!validTypes.includes(type)) {
    throw new CustomError.BadRequestError('Invalid announcement type');
  }

  // Validate priority if provided
  if (priority && !['low', 'normal', 'high', 'urgent'].includes(priority)) {
    throw new CustomError.BadRequestError('Invalid priority level');
  }

  // Validate application deadline if provided
  if (applicationConfig?.applicationDeadline) {
    const deadline = new Date(applicationConfig.applicationDeadline);
    if (deadline <= new Date()) {
      throw new CustomError.BadRequestError('Application deadline must be in the future');
    }
  }

  // Validate scheduled publish date
  if (scheduledPublishAt) {
    const scheduledDate = new Date(scheduledPublishAt);
    if (scheduledDate <= new Date()) {
      throw new CustomError.BadRequestError('Scheduled publish date must be in the future');
    }
  }

  // Validate expiration date
  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    if (expirationDate <= new Date()) {
      throw new CustomError.BadRequestError('Expiration date must be in the future');
    }
  }

  const announcement = await Announcement.create({
    title,
    description,
    type,
    priority: priority || 'normal',
    targetAudience: targetAudience || {},
    applicationConfig: applicationConfig || { allowsApplications: false },
    contactInfo: contactInfo || {},
    scheduledPublishAt,
    expiresAt,
    tags: tags || [],
    category: category || 'general',
    status: 'draft',
    createdBy: req.user.userId
  });

  const populatedAnnouncement = await Announcement.findById(announcement._id)
    .populate('createdBy', 'firstName lastName email role');

  res.status(StatusCodes.CREATED).json({
    message: 'Announcement created successfully',
    announcement: populatedAnnouncement
  });
};

// @desc Get all announcements with filters and pagination
const getAllAnnouncements = async (req, res) => {
  const { role } = req.user;
  
  // Build filter object
  let filter = { isDeleted: false };
  
  // Non-admin users only see published announcements
  if (role !== 'admin' && role !== 'case_worker') {
    filter.status = 'published';
    filter.isActive = true;
  }
  
  // Apply filters
  const {
    status,
    type,
    priority,
    category,
    dateFrom,
    dateTo,
    createdBy,
    hasDeadline,
    isExpired,
    search,
    isUrgent
  } = req.query;

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (isUrgent === 'true') filter.isUrgent = true;
  if (createdBy && (role === 'admin' || role === 'case_worker')) filter.createdBy = createdBy;

  // Date range filtering
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Deadline filtering
  if (hasDeadline === 'true') {
    filter['applicationConfig.applicationDeadline'] = { $exists: true, $ne: null };
  } else if (hasDeadline === 'false') {
    filter.$or = [
      { 'applicationConfig.applicationDeadline': { $exists: false } },
      { 'applicationConfig.applicationDeadline': null }
    ];
  }

  // Expired announcements filtering
  if (isExpired === 'true') {
    filter['applicationConfig.applicationDeadline'] = { $lt: new Date() };
  } else if (isExpired === 'false') {
    filter.$or = [
      { 'applicationConfig.applicationDeadline': { $gte: new Date() } },
      { 'applicationConfig.applicationDeadline': { $exists: false } },
      { 'applicationConfig.applicationDeadline': null }
    ];
  }

  // Search functionality using text index
  if (search) {
    filter.$text = { $search: search };
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const announcements = await Announcement.find(filter)
    .populate('createdBy', 'firstName lastName email role')
    .populate('participants.user', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Announcement.countDocuments(filter);

  // Calculate statistics
  const stats = await Announcement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAnnouncements: { $sum: 1 },
        totalViews: { $sum: '$analytics.viewCount' },
        totalApplications: { $sum: '$analytics.applicationCount' },
        avgParticipants: { $avg: { $size: '$participants' } }
      }
    }
  ]);

  const statistics = stats[0] || {
    totalAnnouncements: 0,
    totalViews: 0,
    totalApplications: 0,
    avgParticipants: 0
  };

  res.status(StatusCodes.OK).json({
    message: 'Announcements retrieved successfully',
    announcements,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    statistics
  });
};

// @desc Get single announcement by ID
const getSingleAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { role, userId } = req.user;

  const announcement = await Announcement.findById(id)
    .populate('createdBy', 'firstName lastName email role')
    .populate('participants.user', 'firstName lastName email')
    .populate('participants.reviewedBy', 'firstName lastName email');

  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID: ${id}`);
  }

  // Check if user can view this announcement
  if (announcement.isDeleted) {
    throw new CustomError.NotFoundError(`Announcement not available`);
  }

  // Non-admin users can only see published announcements unless they created it
  if (role !== 'admin' && role !== 'case_worker' && 
      announcement.status !== 'published' && 
      announcement.createdBy._id.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to view this announcement');
  }

  // Increment view count (but not for the creator)
  if (announcement.createdBy._id.toString() !== userId) {
    await Announcement.findByIdAndUpdate(id, { 
      $inc: { 'analytics.viewCount': 1 },
      'analytics.lastViewed': new Date()
    });
    announcement.analytics.viewCount += 1;
  }

  // Check if current user has applied
  const userApplication = announcement.participants.find(
    participant => participant.user._id.toString() === userId
  );

  // Check if deadline has passed
  const isExpired = announcement.applicationConfig?.applicationDeadline && 
                   new Date(announcement.applicationConfig.applicationDeadline) < new Date();

  res.status(StatusCodes.OK).json({
    message: 'Announcement retrieved successfully',
    announcement: {
      ...announcement.toObject(),
      userApplication: userApplication || null,
      isExpired,
      canApply: !userApplication && !isExpired && announcement.status === 'published' && 
                announcement.applicationConfig?.allowsApplications
    }
  });
};

// @desc Update announcement
const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { role, userId } = req.user;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID: ${id}`);
  }

  // Check permissions
  if (role !== 'admin' && announcement.createdBy.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to update this announcement');
  }

  const {
    title,
    description,
    type,
    priority,
    targetAudience,
    applicationConfig,
    contactInfo,
    scheduledPublishAt,
    expiresAt,
    tags,
    category
  } = req.body;

  // Validate application deadline if provided
  if (applicationConfig?.applicationDeadline) {
    const deadline = new Date(applicationConfig.applicationDeadline);
    if (deadline <= new Date() && announcement.status === 'draft') {
      throw new CustomError.BadRequestError('Application deadline must be in the future');
    }
  }

  // Validate max participants reduction
  if (applicationConfig?.maxApplicants !== undefined && 
      applicationConfig.maxApplicants < announcement.participants.length) {
    throw new CustomError.BadRequestError('Cannot reduce max participants below current participant count');
  }

  const updateData = {
    ...(title && { title }),
    ...(description && { description }),
    ...(type && { type }),
    ...(priority && { priority }),
    ...(targetAudience && { targetAudience }),
    ...(applicationConfig && { applicationConfig: { ...announcement.applicationConfig, ...applicationConfig } }),
    ...(contactInfo && { contactInfo }),
    ...(scheduledPublishAt !== undefined && { scheduledPublishAt }),
    ...(expiresAt !== undefined && { expiresAt }),
    ...(tags && { tags }),
    ...(category && { category }),
    updatedBy: userId
  };

  const updatedAnnouncement = await Announcement.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName email role')
   .populate('updatedBy', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: 'Announcement updated successfully',
    announcement: updatedAnnouncement
  });
};

// @desc Publish or unpublish an announcement
const publishAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { status, publishReason } = req.body;
  const { role, userId } = req.user;

  // Validate status
  const validStatuses = ['draft', 'published', 'scheduled', 'expired', 'cancelled', 'archived'];
  if (!validStatuses.includes(status)) {
    throw new CustomError.BadRequestError('Invalid status value');
  }

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID: ${id}`);
  }

  // Check permissions
  if (role !== 'admin' && announcement.createdBy.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to change announcement status');
  }

  // Validate status transitions
  if (status === 'published') {
    // Validate required fields for publishing
    if (!announcement.title || !announcement.description || !announcement.type) {
      throw new CustomError.BadRequestError('Cannot publish incomplete announcement');
    }

    // Check if deadline is still valid
    if (announcement.applicationConfig?.applicationDeadline && 
        new Date(announcement.applicationConfig.applicationDeadline) <= new Date()) {
      throw new CustomError.BadRequestError('Cannot publish announcement with past deadline');
    }
  }

  const previousStatus = announcement.status;
  announcement.status = status;

  if (status === 'published' && previousStatus !== 'published') {
    announcement.publishedAt = new Date();
  }

  await announcement.save();

  const populatedAnnouncement = await Announcement.findById(id)
    .populate('createdBy', 'firstName lastName email role');

  res.status(StatusCodes.OK).json({
    message: `Announcement ${status} successfully`,
    announcement: populatedAnnouncement
  });
};

// @desc Apply to announcement
const applyToAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { applicationData, documents } = req.body;
  const { userId } = req.user;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID: ${id}`);
  }

  // Validate announcement is available for applications
  if (announcement.status !== 'published') {
    throw new CustomError.BadRequestError('Cannot apply to unpublished announcement');
  }

  if (!announcement.isActive) {
    throw new CustomError.BadRequestError('Announcement is no longer active');
  }

  if (!announcement.applicationConfig?.allowsApplications) {
    throw new CustomError.BadRequestError('This announcement does not accept applications');
  }

  // Check deadline
  if (announcement.applicationConfig?.applicationDeadline && 
      new Date(announcement.applicationConfig.applicationDeadline) < new Date()) {
    throw new CustomError.BadRequestError('Application deadline has passed');
  }

  // Check if user already applied
  const existingApplication = announcement.participants.find(
    participant => participant.user.toString() === userId
  );

  if (existingApplication) {
    throw new CustomError.BadRequestError('You have already applied to this announcement');
  }

  // Check max participants limit
  if (announcement.applicationConfig?.maxApplicants && 
      announcement.participants.length >= announcement.applicationConfig.maxApplicants) {
    throw new CustomError.BadRequestError('Maximum number of applications reached');
  }

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  // Create participant entry
  const participant = {
    user: userId,
    status: announcement.applicationConfig?.autoAcceptance ? 'accepted' : 'applied',
    appliedAt: new Date(),
    documents: documents || []
  };

  announcement.participants.push(participant);
  
  // Update analytics
  announcement.analytics.applicationCount = announcement.participants.length;
  
  await announcement.save();

  const updatedAnnouncement = await Announcement.findById(id)
    .populate('participants.user', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: 'Application submitted successfully',
    announcement: updatedAnnouncement,
    participant
  });
};

// @desc Review participant applications
const reviewApplication = async (req, res) => {
  const { id } = req.params;
  const { userId: applicantId } = req.params;
  const { status, reviewNotes, rejectionReason } = req.body;
  const { role, userId: reviewerId } = req.user;

  // Validate status
  const validStatuses = ['applied', 'pending', 'accepted', 'rejected', 'withdrawn', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new CustomError.BadRequestError('Invalid application status');
  }

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID: ${id}`);
  }

  // Check permissions
  if (role !== 'admin' && announcement.createdBy.toString() !== reviewerId) {
    throw new CustomError.UnauthorizedError('Not authorized to review applications for this announcement');
  }

  // Find the participant
  const participantIndex = announcement.participants.findIndex(
    participant => participant.user.toString() === applicantId
  );

  if (participantIndex === -1) {
    throw new CustomError.NotFoundError('Application not found');
  }

  const participant = announcement.participants[participantIndex];

  // Update participant status
  participant.status = status;
  participant.reviewedBy = reviewerId;
  participant.reviewedAt = new Date();
  participant.reviewNotes = reviewNotes || '';
  if (status === 'rejected') {
    participant.rejectionReason = rejectionReason || '';
  }

  await announcement.save();

  const populatedAnnouncement = await Announcement.findById(id)
    .populate('participants.user', 'firstName lastName email')
    .populate('participants.reviewedBy', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: `Application ${status} successfully`,
    announcement: populatedAnnouncement
  });
};

// @desc Get announcement statistics
const getAnnouncementStats = async (req, res) => {
  const { role, userId } = req.user;
  
  // Build filter based on role
  let filter = { isDeleted: false };
  if (role === 'case_worker') {
    filter.createdBy = userId;
  }

  // Overall statistics
  const overallStats = await Announcement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAnnouncements: { $sum: 1 },
        totalViews: { $sum: '$analytics.viewCount' },
        totalApplications: { $sum: '$analytics.applicationCount' },
        totalParticipants: { $sum: { $size: '$participants' } },
        avgApplicationsPerAnnouncement: { $avg: '$analytics.applicationCount' }
      }
    }
  ]);

  // Statistics by status
  const statusStats = await Announcement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$analytics.viewCount' },
        totalApplications: { $sum: '$analytics.applicationCount' }
      }
    }
  ]);

  // Statistics by type
  const typeStats = await Announcement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgParticipants: { $avg: { $size: '$participants' } },
        totalViews: { $sum: '$analytics.viewCount' }
      }
    }
  ]);

  // Application status distribution
  const applicationStats = await Announcement.aggregate([
    { $match: filter },
    { $unwind: '$participants' },
    {
      $group: {
        _id: '$participants.status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Monthly creation trends
  const monthlyStats = await Announcement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        totalViews: { $sum: '$analytics.viewCount' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  const overall = overallStats[0] || {
    totalAnnouncements: 0,
    totalViews: 0,
    totalApplications: 0,
    totalParticipants: 0,
    avgApplicationsPerAnnouncement: 0
  };

  res.status(StatusCodes.OK).json({
    message: 'Announcement statistics retrieved successfully',
    statistics: {
      overall,
      byStatus: statusStats,
      byType: typeStats,
      applications: applicationStats,
      monthlyTrends: monthlyStats
    }
  });
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getSingleAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  applyToAnnouncement,
  reviewApplication,
  getAnnouncementStats
};