const Notification = require('../models/notifiacation');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');


const getAllNotification = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 40;
  const skip = (page - 1) * limit;

  const result = await Notification.find({}).skip(skip).limit(limit);

  res.status(StatusCodes.OK).json({ result, count: result.length });
};
const getSingleNotification = async (req, res) => {
  const { id: notificationId } = req.params;

  const notification = await Notification.findOneAndUpdate({ _id: notificationId }, {seen: true} , {
    new: true,
    runValidators: true,
  }).populate('user', 'demande', 'anounce');

  if (!notification) {
    throw new CustomError.NotFoundError(`No notification with id : ${notificationId}`);
  }

  res.status(StatusCodes.OK).json({ notification });
};

const updateNotificationStatus = async (req, res) => {
    const { id: notificationId } = req.params;
  
    const notification = await Notification.findOneAndUpdate({ _id: notificationId }, {seen: true} , {
      new: true,
      runValidators: true,
    });
  
    if (!notification) {
      throw new CustomError.NotFoundError(`No notification with id : ${notificationId}`);
    }
  
    res.status(StatusCodes.OK).json({ notification });
  };


module.exports = {
    getAllNotification,
    getSingleNotification,
    updateNotificationStatus
};
