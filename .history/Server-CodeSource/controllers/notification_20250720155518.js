const { StatusCodes } = require('http-status-codes');
const Notification = require('../models/notification');
const CustomError = require('../errors');
const checkPermissions = require('../utils/checkPermissions');

// @desc Create a new notification
const createNotification = async (req, res) => {
  const { title, message, channels, recipients, template } = req.body;

  if (!title || !message || !channels || !recipients || recipients.length === 0) {
    throw new CustomError.BadRequestError('Missing required notification fields.');
  }

  const notification = await Notification.create({
    title,
    message,
    channels,
    recipients,
    template,
    createdBy: req.user.userId,
  });

  res.status(StatusCodes.CREATED).json({ notification });
};

// @desc Get all notifications for admin/staff with filters
const getAllNotifications = async (req, res) => {
  const { status, channel, search } = req.query;
  const queryObject = {};

  if (status) queryObject.status = status;
  if (channel) queryObject.channels = channel;
  if (search) queryObject.title = { $regex: search, $options: 'i' };

  const notifications = await Notification.find(queryObject)
    .sort('-createdAt')
    .populate('recipients', 'name email');

  res.status(StatusCodes.OK).json({ count: notifications.length, notifications });
};

// @desc Get user-specific notifications (in-app)
const getUserNotifications = async (req, res) => {
  const notifications = await Notification.find({
    recipients: req.user.userId,
    channels: { $in: ['in_app'] },
  }).sort('-createdAt');

  res.status(StatusCodes.OK).json({ count: notifications.length, notifications });
};

// @desc Mark a notification as read
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findById(id);
  if (!notification) {
    throw new CustomError.NotFoundError(`Notification with ID ${id} not found`);
  }

  if (!notification.readBy.includes(req.user.userId)) {
    notification.readBy.push(req.user.userId);
    await notification.save();
  }

  res.status(StatusCodes.OK).json({ message: 'Notification marked as read' });
};

// @desc Mark a notification as clicked
const markAsClicked = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findById(id);
  if (!notification) {
    throw new CustomError.NotFoundError(`Notification with ID ${id} not found`);
  }

  if (!notification.clickedBy.includes(req.user.userId)) {
    notification.clickedBy.push(req.user.userId);
    await notification.save();
  }

  res.status(StatusCodes.OK).json({ message: 'Notification marked as clicked' });
};

// @desc Send bulk notifications
const sendBulkNotifications = async (req, res) => {
  const { title, message, channels, recipients } = req.body;

  if (!title || !message || !recipients || recipients.length === 0) {
    throw new CustomError.BadRequestError('Missing required fields for bulk notification');
  }

  const notifications = await Promise.all(
    recipients.map((recipientId) =>
      Notification.create({
        title,
        message,
        channels,
        recipients: [recipientId],
        createdBy: req.user.userId,
      })
    )
  );

  res.status(StatusCodes.CREATED).json({ count: notifications.length });
};

// @desc Retry failed notifications
const retryFailedNotifications = async (req, res) => {
  const failedNotifications = await Notification.find({ status: 'failed' });

  // Simulate retry logic
  for (let notification of failedNotifications) {
    // Replace with actual retry service call
    notification.status = 'sent';
    await notification.save();
  }

  res.status(StatusCodes.OK).json({ retried: failedNotifications.length });
};

// @desc Manage templates (CREATE/UPDATE/DELETE)
const manageTemplates = async (req, res) => {
  // You can adapt this to your template model structure if you separate it
  res
    .status(StatusCodes.NOT_IMPLEMENTED)
    .json({ message: 'Template management is handled in a separate module.' });
};

// @desc Get notification delivery statistics
const getNotificationStats = async (req, res) => {
  const stats = await Notification.aggregate([
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
  createNotification,
  getAllNotifications,
  getUserNotifications,
  markAsRead,
  markAsClicked,
  sendBulkNotifications,
  retryFailedNotifications,
  manageTemplates,
  getNotificationStats,
};
