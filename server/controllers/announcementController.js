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
    targetAudience,
    eligibilityCriteria,
    applicationDeadline,
    maxParticipants,
    requirements,
    benefits,
    location,
    contactInfo
  } = req.body;

  // Validate required fields
  if (!title || !description || !type || !targetAudience) {
    throw new CustomError.BadRequestError('Title, description, type, and target audience are required');
  }

  // Validate type
  const validTypes = ['event', 'program', 'service', 'opportunity', 'notice'];
  if (!validTypes.includes(type)) {
    throw new CustomError.BadRequestError('Invalid announcement type');
  }

  // Validate target audience
  const validAudiences = ['all', 'students', 'families', 'elderly', 'disabled', 'unemployed', 'specific'];
  if (!validAudiences.includes(targetAudience)) {
    throw new CustomError.BadRequestError('Invalid target audience');
  }

  // Validate application deadline if provided
  if (applicationDeadline) {
    const deadline = new Date(applicationDeadline);
    if (deadline <= new Date()) {
      throw new CustomError.BadRequestError('Application deadline must be in the future');
    }
  }

  // Validate max participants
  if (maxParticipants !== undefined && (maxParticipants < 0 || maxParticipants > 10000)) {
    throw new CustomError.BadRequestError('Max participants must be between 0 and 10000');
  }

  const announcement = await Announcement.create({
    title,
    description,
    type,
    targetAudience,
    eligibilityCriteria: eligibilityCriteria || [],
    applicationDeadline,
    maxParticipants,
    requirements: requirements || [],
    benefits: benefits || [],
    location,
    contactInfo,
    status: 'draft',
    createdBy: req.user.userId,
    participants: [],
    applications: [],
    views: 0,
    isActive: true
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
  let filter = { isActive: true };
  
  // Non-admin users only see published announcements
  if (role !== 'admin' && role !== 'case_worker') {
    filter.status = 'published';
  }
  
  // Apply filters
  const {
    status,
    type,
    targetAudience,
    dateFrom,
    dateTo,
    createdBy,
    hasDeadline,
    isExpired,
    search
  } = req.query;

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (targetAudience) filter.targetAudience = targetAudience;
  if (createdBy && (role === 'admin' || role === 'case_worker')) filter.createdBy = createdBy;

  // Date range filtering
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Deadline filtering
  if (hasDeadline === 'true') {
    filter.applicationDeadline = { $exists: true, $ne: null };
  } else if (hasDeadline === 'false') {
    filter.$or = [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: null }
    ];
  }

  // Expired announcements filtering
  if (isExpired === 'true') {
    filter.applicationDeadline = { $lt: new Date() };
  } else if (isExpired === 'false') {
    filter.$or = [
      { applicationDeadline: { $gte: new Date() } },
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: null }
    ];
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { type: new RegExp(search, 'i') },
      { targetAudience: new RegExp(search, 'i') }
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

  const announcements = await Announcement.find(filter)
    .populate('createdBy', 'firstName lastName email role')
    .populate('applications.user', 'firstName lastName email')
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
        totalViews: { $sum: '$views' },
        totalApplications: { $sum: { $size: '$applications' } },
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
    .populate('participants', 'firstName lastName email')
    .populate('applications.user', 'firstName lastName email')
    .populate('applications.reviewedBy', 'firstName lastName email');

  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID: ${id}`);
  }

  // Check if user can view this announcement
  if (!announcement.isActive) {
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
    await Announcement.findByIdAndUpdate(id, { $inc: { views: 1 } });
    announcement.views += 1;
  }

  // Check if current user has applied
  const userApplication = announcement.applications.find(
    app => app.user._id.toString() === userId
  );

  // Check if deadline has passed
  const isExpired = announcement.applicationDeadline && 
                   new Date(announcement.applicationDeadline) < new Date();

  res.status(StatusCodes.OK).json({
    message: 'Announcement retrieved successfully',
    announcement: {
      ...announcement.toObject(),
      userApplication: userApplication || null,
      isExpired,
      canApply: !userApplication && !isExpired && announcement.status === 'published'
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
    targetAudience,
    eligibilityCriteria,
    applicationDeadline,
    maxParticipants,
    requirements,
    benefits,
    location,
    contactInfo
  } = req.body;

  // Validate application deadline if provided
  if (applicationDeadline) {
    const deadline = new Date(applicationDeadline);
    if (deadline <= new Date() && announcement.status === 'draft') {
      throw new CustomError.BadRequestError('Application deadline must be in the future');
    }
  }

  // Validate max participants reduction
  if (maxParticipants !== undefined && 
      maxParticipants < announcement.participants.length) {
    throw new CustomError.BadRequestError('Cannot reduce max participants below current participant count');
  }

  const updateData = {
    ...(title && { title }),
    ...(description && { description }),
    ...(type && { type }),
    ...(targetAudience && { targetAudience }),
    ...(eligibilityCriteria && { eligibilityCriteria }),
    ...(applicationDeadline !== undefined && { applicationDeadline }),
    ...(maxParticipants !== undefined && { maxParticipants }),
    ...(requirements && { requirements }),
    ...(benefits && { benefits }),
    ...(location && { location }),
    ...(contactInfo && { contactInfo }),
    updatedBy: userId,
    updatedAt: new Date()
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
  const validStatuses = ['draft', 'published', 'unpublished', 'archived'];
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
    if (announcement.applicationDeadline && 
        new Date(announcement.applicationDeadline) <= new Date()) {
      throw new CustomError.BadRequestError('Cannot publish announcement with past deadline');
    }
  }

  const previousStatus = announcement.status;
  announcement.status = status;
  
  // Add status history
  if (!announcement.statusHistory) {
    announcement.statusHistory = [];
  }
  
  announcement.statusHistory.push({
    status,
    changedBy: userId,
    changedAt: new Date(),
    reason: publishReason || `Status changed from ${previousStatus} to ${status}`
  });

  if (status === 'published' && previousStatus !== 'published') {
    announcement.publishedAt = new Date();
    announcement.publishedBy = userId;
  }

  await announcement.save();

  const populatedAnnouncement = await Announcement.findById(id)
    .populate('createdBy', 'firstName lastName email role')
    .populate('publishedBy', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: `Announcement ${status} successfully`,
    announcement: populatedAnnouncement
  });
};

// @desc Apply to announcement
const applyToAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { applicationData, motivation } = req.body;
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

  // Check deadline
  if (announcement.applicationDeadline && 
      new Date(announcement.applicationDeadline) < new Date()) {
    throw new CustomError.BadRequestError('Application deadline has passed');
  }

  // Check if user already applied
  const existingApplication = announcement.applications.find(
    app => app.user.toString() === userId
  );

  if (existingApplication) {
    throw new CustomError.BadRequestError('You have already applied to this announcement');
  }

  // Check max participants limit
  if (announcement.maxParticipants && 
      announcement.applications.length >= announcement.maxParticipants) {
    throw new CustomError.BadRequestError('Maximum number of applications reached');
  }

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  // Create application
  const application = {
    user: userId,
    applicationData: applicationData || {},
    motivation: motivation || '',
    appliedAt: new Date(),
    status: 'pending'
  };

  announcement.applications.push(application);
  await announcement.save();

  const updatedAnnouncement = await Announcement.findById(id)
    .populate('applications.user', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: 'Application submitted successfully',
    announcement: updatedAnnouncement,
    application
  });
};

// @desc Review participant applications
const reviewApplication = async (req, res) => {
  const { id } = req.params;
  const { userId: applicantId, status, reviewNotes } = req.body;
  const { role, userId: reviewerId } = req.user;

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected'];
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

  // Find the application
  const applicationIndex = announcement.applications.findIndex(
    app => app.user.toString() === applicantId
  );

  if (applicationIndex === -1) {
    throw new CustomError.NotFoundError('Application not found');
  }

  const application = announcement.applications[applicationIndex];

  // Update application status
  application.status = status;
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  application.reviewNotes = reviewNotes || '';

  // If approved, add to participants
  if (status === 'approved' && !announcement.participants.includes(applicantId)) {
    announcement.participants.push(applicantId);
  }

  // If rejected, remove from participants if they were there
  if (status === 'rejected') {
    announcement.participants = announcement.participants.filter(
      participantId => participantId.toString() !== applicantId
    );
  }

  await announcement.save();

  const populatedAnnouncement = await Announcement.findById(id)
    .populate('applications.user', 'firstName lastName email')
    .populate('applications.reviewedBy', 'firstName lastName email')
    .populate('participants', 'firstName lastName email');

  res.status(StatusCodes.OK).json({
    message: `Application ${status} successfully`,
    announcement: populatedAnnouncement
  });
};

// @desc Get announcement statistics
const getAnnouncementStats = async (req, res) => {
  const { role, userId } = req.user;
  
  // Build filter based on role
  let filter = { isActive: true };
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
        totalViews: { $sum: '$views' },
        totalApplications: { $sum: { $size: '$applications' } },
        totalParticipants: { $sum: { $size: '$participants' } },
        avgApplicationsPerAnnouncement: { $avg: { $size: '$applications' } }
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
        totalViews: { $sum: '$views' },
        totalApplications: { $sum: { $size: '$applications' } }
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
        totalViews: { $sum: '$views' }
      }
    }
  ]);

  // Application status distribution
  const applicationStats = await Announcement.aggregate([
    { $match: filter },
    { $unwind: '$applications' },
    {
      $group: {
        _id: '$applications.status',
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
        totalViews: { $sum: '$views' }
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
  getAnnouncementStats,
  
  // Legacy function names for backward compatibility
  manageParticipants: (req, res) => {
    throw new CustomError.BadRequestError('Please use applyToAnnouncement and reviewApplication endpoints');
  },
  reviewApplications: reviewApplication
};
