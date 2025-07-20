const { StatusCodes } = require('http-status-codes');
const Announcement = require('../models/announcement');
const CustomError = require('../errors');
const checkPermissions = require('../utils/checkPermissions');

// @desc Create a new announcement
const createAnnouncement = async (req, res) => {
  const { title, description, targetAudience } = req.body;
  if (!title || !description || !targetAudience) {
    throw new CustomError.BadRequestError('Title, description, and target audience are required.');
  }

  const announcement = await Announcement.create({
    ...req.body,
    createdBy: req.user.userId,
  });

  res.status(StatusCodes.CREATED).json({ announcement });
};

// @desc Get all announcements with filters and pagination
const getAllAnnouncements = async (req, res) => {
  const { status, target, search } = req.query;
  const queryObject = {};

  if (status) queryObject.status = status;
  if (target) queryObject.targetAudience = target;
  if (search) queryObject.title = { $regex: search, $options: 'i' };

  const announcements = await Announcement.find(queryObject).sort('-createdAt');

  res.status(StatusCodes.OK).json({ count: announcements.length, announcements });
};

// @desc Get single announcement by ID
const getSingleAnnouncement = async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID ${id}`);
  }

  res.status(StatusCodes.OK).json({ announcement });
};

// @desc Update announcement
const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID ${id}`);
  }

  checkPermissions(req.user, announcement.createdBy);

  const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ announcement: updatedAnnouncement });
};

// @desc Publish or unpublish an announcement
const publishAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['published', 'unpublished'].includes(status)) {
    throw new CustomError.BadRequestError('Invalid status value');
  }

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID ${id}`);
  }

  checkPermissions(req.user, announcement.createdBy);

  announcement.status = status;
  await announcement.save();

  res.status(StatusCodes.OK).json({ announcement });
};

// @desc Manage participants (add or remove)
const manageParticipants = async (req, res) => {
  const { id } = req.params;
  const { userId, action } = req.body;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID ${id}`);
  }

  checkPermissions(req.user, announcement.createdBy);

  if (action === 'add') {
    if (!announcement.participants.includes(userId)) {
      announcement.participants.push(userId);
    }
  } else if (action === 'remove') {
    announcement.participants = announcement.participants.filter((uid) => uid !== userId);
  } else {
    throw new CustomError.BadRequestError('Invalid action');
  }

  await announcement.save();
  res.status(StatusCodes.OK).json({ announcement });
};

// @desc Review participant applications
const reviewApplications = async (req, res) => {
  const { id } = req.params;
  const { userId, status } = req.body;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new CustomError.NotFoundError(`No announcement found with ID ${id}`);
  }

  checkPermissions(req.user, announcement.createdBy);

  const participant = announcement.applications.find((app) => app.user.toString() === userId);
  if (!participant) {
    throw new CustomError.NotFoundError('Participant not found in applications');
  }

  participant.status = status;
  await announcement.save();

  res.status(StatusCodes.OK).json({ announcement });
};

// @desc Get announcement statistics
const getAnnouncementStats = async (req, res) => {
  const stats = await Announcement.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(StatusCodes.OK).json({ stats });
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getSingleAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  manageParticipants,
  reviewApplications,
  getAnnouncementStats,
};
