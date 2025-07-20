const { StatusCodes } = require('http-status-codes');
const Content = require('../models/content');
const CustomError = require('../errors');
const checkPermissions = require('../utils/checkPermissions');

// @desc Create content item (Program / Chapter / Article etc.)
const createContent = async (req, res) => {
  const { title, type, parent } = req.body;

  if (!title || !type) {
    throw new CustomError.BadRequestError('Title and type are required');
  }

  const content = await Content.create({
    ...req.body,
    createdBy: req.user.userId,
  });

  res.status(StatusCodes.CREATED).json({ content });
};

// @desc Get all content items with hierarchy support
const getAllContent = async (req, res) => {
  const { type, status, parent, search } = req.query;
  const queryObject = {};

  if (type) queryObject.type = type;
  if (status) queryObject.status = status;
  if (parent) queryObject.parent = parent;
  if (search) queryObject.title = { $regex: search, $options: 'i' };

  const content = await Content.find(queryObject).sort('order').populate('parent');

  res.status(StatusCodes.OK).json({ count: content.length, content });
};

// @desc Get a single content item by ID
const getSingleContent = async (req, res) => {
  const content = await Content.findById(req.params.id).populate('parent');

  if (!content) {
    throw new CustomError.NotFoundError(`No content found with ID ${req.params.id}`);
  }

  res.status(StatusCodes.OK).json({ content });
};

// @desc Update content item
const updateContent = async (req, res) => {
  const { id } = req.params;
  const content = await Content.findById(id);

  if (!content) {
    throw new CustomError.NotFoundError(`No content found with ID ${id}`);
  }

  checkPermissions(req.user, content.createdBy);

  const updated = await Content.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ content: updated });
};

// @desc Publish / Unpublish content
const publishContent = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['published', 'unpublished'].includes(status)) {
    throw new CustomError.BadRequestError('Status must be published or unpublished');
  }

  const content = await Content.findById(id);
  if (!content) {
    throw new CustomError.NotFoundError(`No content found with ID ${id}`);
  }

  checkPermissions(req.user, content.createdBy);

  content.status = status;
  await content.save();

  res.status(StatusCodes.OK).json({ content });
};

// @desc Manage content hierarchy (change parent)
const manageHierarchy = async (req, res) => {
  const { id } = req.params;
  const { newParentId } = req.body;

  const content = await Content.findById(id);
  if (!content) {
    throw new CustomError.NotFoundError(`No content found with ID ${id}`);
  }

  checkPermissions(req.user, content.createdBy);

  content.parent = newParentId;
  await content.save();

  res.status(StatusCodes.OK).json({ content });
};

// @desc Get analytics for content usage
const getContentAnalytics = async (req, res) => {
  const stats = await Content.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  res.status(StatusCodes.OK).json({ stats });
};

// @desc Soft delete content (and optionally its children)
const deleteContent = async (req, res) => {
  const { id } = req.params;
  const content = await Content.findById(id);

  if (!content) {
    throw new CustomError.NotFoundError(`No content found with ID ${id}`);
  }

  checkPermissions(req.user, content.createdBy);

  content.isDeleted = true;
  await content.save();

  // Optional: soft delete children as well
  await Content.updateMany({ parent: id }, { isDeleted: true });

  res.status(StatusCodes.OK).json({ message: 'Content and sub-content marked as deleted' });
};

module.exports = {
  createContent,
  getAllContent,
  getSingleContent,
  updateContent,
  publishContent,
  manageHierarchy,
  getContentAnalytics,
  deleteContent,
};
