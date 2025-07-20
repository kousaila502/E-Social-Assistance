const { StatusCodes } = require('http-status-codes');
const Content = require('../models/content');
const User = require('../models/user');
const BudgetPool = require('../models/budgetPool');
const Demande = require('../models/demande');
const Notification = require('../models/notification');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

/**
 * Create Content
 * Create hierarchical content with comprehensive validation
 */
const createContent = async (req, res) => {
  const {
    name,
    title,
    description,
    text,
    contentType,
    parent,
    metadata = {},
    eligibilityRequirements = {},
    programConfig = {},
    seo = {},
    media = [],
    visibility = 'public',
    accessRoles = []
  } = req.body;

  // Only admin and case workers can create content
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and case workers can create content');
  }

  // Input validation
  if (!name || !contentType) {
    throw new CustomError.BadRequestError('Name and content type are required');
  }

  // Validate content type
  const validTypes = ['programme', 'chapitre', 'sous_chapitre', 'article'];
  if (!validTypes.includes(contentType)) {
    throw new CustomError.BadRequestError('Invalid content type');
  }

  // Validate hierarchy rules
  const hierarchyRules = {
    'programme': { allowedParents: [], allowedChildren: ['chapitre'] },
    'chapitre': { allowedParents: ['programme'], allowedChildren: ['sous_chapitre'] },
    'sous_chapitre': { allowedParents: ['chapitre'], allowedChildren: ['article'] },
    'article': { allowedParents: ['sous_chapitre'], allowedChildren: [] }
  };

  // Validate parent-child relationship
  if (parent) {
    const parentContent = await Content.findById(parent);
    if (!parentContent) {
      throw new CustomError.NotFoundError('Parent content not found');
    }

    if (!hierarchyRules[parentContent.contentType].allowedChildren.includes(contentType)) {
      throw new CustomError.BadRequestError(
        `${contentType} cannot be a child of ${parentContent.contentType}`
      );
    }

    // Check if parent allows new children
    if (parentContent.status !== 'active') {
      throw new CustomError.BadRequestError('Cannot add content to inactive parent');
    }
  } else if (contentType !== 'programme') {
    throw new CustomError.BadRequestError('Only programmes can be created without a parent');
  }

  // Validate eligibility requirements
  if (eligibilityRequirements.minAge && eligibilityRequirements.maxAge) {
    if (eligibilityRequirements.minAge > eligibilityRequirements.maxAge) {
      throw new CustomError.BadRequestError('Minimum age cannot be greater than maximum age');
    }
  }

  if (eligibilityRequirements.familySizeMin && eligibilityRequirements.familySizeMax) {
    if (eligibilityRequirements.familySizeMin > eligibilityRequirements.familySizeMax) {
      throw new CustomError.BadRequestError('Minimum family size cannot be greater than maximum family size');
    }
  }

  // Validate program configuration for eligible content types
  if (['programme', 'chapitre'].includes(contentType) && programConfig.maxBeneficiaries) {
    if (programConfig.maxBeneficiaries < 1) {
      throw new CustomError.BadRequestError('Maximum beneficiaries must be at least 1');
    }

    if (programConfig.programStartDate && programConfig.programEndDate) {
      const startDate = new Date(programConfig.programStartDate);
      const endDate = new Date(programConfig.programEndDate);
      
      if (endDate <= startDate) {
        throw new CustomError.BadRequestError('Program end date must be after start date');
      }
    }
  }

  // Check for duplicate names at the same level
  const duplicateFilter = {
    name: name.trim(),
    contentType,
    isDeleted: false
  };

  if (parent) {
    duplicateFilter.parent = parent;
  } else {
    duplicateFilter.parent = null;
  }

  const existingContent = await Content.findOne(duplicateFilter);
  if (existingContent) {
    throw new CustomError.BadRequestError('Content with this name already exists at this level');
  }

  // Calculate level and path
  let level = 0;
  let path = '';
  
  if (parent) {
    const parentContent = await Content.findById(parent);
    level = parentContent.level + 1;
    path = `${parentContent.path}/${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
  } else {
    path = name.trim().toLowerCase().replace(/\s+/g, '-');
  }

  // Generate SEO slug if not provided
  if (!seo.slug) {
    seo.slug = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Validate access roles
  if (accessRoles.length > 0) {
    const validRoles = ['admin', 'user', 'case_worker', 'finance_manager'];
    const invalidRoles = accessRoles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      throw new CustomError.BadRequestError(`Invalid access roles: ${invalidRoles.join(', ')}`);
    }
  }

  // Create content
  const contentData = {
    name: name.trim(),
    title: title?.trim(),
    description: description?.trim(),
    text: text?.trim(),
    contentType,
    parent: parent || null,
    level,
    path,
    status: 'draft',
    visibility,
    accessRoles,
    metadata: {
      ...metadata,
      tags: metadata.tags?.map(tag => tag.trim().toLowerCase()) || [],
      category: metadata.category || 'general',
      priority: metadata.priority || 'normal',
      language: metadata.language || 'ar'
    },
    eligibilityRequirements: {
      minAge: eligibilityRequirements.minAge || null,
      maxAge: eligibilityRequirements.maxAge || null,
      maxIncome: eligibilityRequirements.maxIncome || null,
      familySizeMin: eligibilityRequirements.familySizeMin || null,
      familySizeMax: eligibilityRequirements.familySizeMax || null,
      requiredDocuments: eligibilityRequirements.requiredDocuments || [],
      eligibilityScore: eligibilityRequirements.eligibilityScore || 50
    },
    programConfig: ['programme', 'chapitre'].includes(contentType) ? {
      maxBeneficiaries: programConfig.maxBeneficiaries || null,
      currentBeneficiaries: 0,
      applicationDeadline: programConfig.applicationDeadline ? new Date(programConfig.applicationDeadline) : null,
      programStartDate: programConfig.programStartDate ? new Date(programConfig.programStartDate) : null,
      programEndDate: programConfig.programEndDate ? new Date(programConfig.programEndDate) : null,
      renewalPeriod: programConfig.renewalPeriod || null,
      maxAmountPerBeneficiary: programConfig.maxAmountPerBeneficiary || null
    } : {},
    seo: {
      metaTitle: seo.metaTitle?.trim() || title?.trim() || name.trim(),
      metaDescription: seo.metaDescription?.trim() || description?.trim(),
      keywords: seo.keywords?.map(k => k.trim().toLowerCase()) || [],
      slug: seo.slug
    },
    media: media.map(m => ({
      ...m,
      uploadedAt: new Date(),
      uploadedBy: req.user.userId
    })),
    analytics: {
      viewCount: 0,
      requestCount: 0,
      popularityScore: 0
    },
    version: 1,
    createdBy: req.user.userId
  };

  const content = await Content.create(contentData);

  // Update parent's children array
  if (parent) {
    await Content.findByIdAndUpdate(parent, {
      $push: { children: content._id }
    });
  }

  const populatedContent = await Content.findById(content._id)
    .populate('parent', 'name contentType level')
    .populate('createdBy', 'name email role')
    .populate('budgetPool', 'name poolNumber totalAmount');

  res.status(StatusCodes.CREATED).json({
    message: 'Content created successfully',
    content: populatedContent
  });
};

/**
 * Get All Content
 * Hierarchical content listing with advanced filtering
 */
const getAllContent = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    contentType,
    status,
    parent,
    level,
    category,
    visibility,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeChildren = false,
    onlyRootLevel = false
  } = req.query;

  // Build filter object
  const filter = { isDeleted: false };

  // Content type filtering
  if (contentType) {
    filter.contentType = { $in: contentType.split(',') };
  }

  // Status filtering
  if (status) {
    filter.status = { $in: status.split(',') };
  }

  // Parent filtering
  if (parent) {
    filter.parent = parent;
  } else if (onlyRootLevel === 'true') {
    filter.parent = null;
  }

  // Level filtering
  if (level !== undefined) {
    filter.level = Number(level);
  }

  // Category filtering
  if (category) {
    filter['metadata.category'] = { $in: category.split(',') };
  }

  // Visibility filtering (respect user role)
  if (req.user.role === 'user') {
    filter.$or = [
      { visibility: 'public' },
      { 
        visibility: 'restricted', 
        accessRoles: { $in: [req.user.role] } 
      }
    ];
  } else if (visibility) {
    filter.visibility = { $in: visibility.split(',') };
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'metadata.tags': { $regex: search, $options: 'i' } },
      { 'seo.keywords': { $regex: search, $options: 'i' } }
    ];
  }

  // Sort configuration
  const sortConfig = {};
  sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // If including children, we need a different approach
  if (includeChildren === 'true') {
    // Get content with populated children recursively
    const pipeline = [
      { $match: filter },
      { $sort: sortConfig },
      {
        $graphLookup: {
          from: 'contents',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'descendants',
          maxDepth: 3 // Limit recursion depth
        }
      }
    ];

    const contentWithChildren = await Content.aggregate(pipeline);
    
    res.status(StatusCodes.OK).json({
      content: contentWithChildren,
      hierarchical: true
    });
  } else {
    // Standard pagination approach
    const skip = (Number(page) - 1) * Number(limit);

    const content = await Content.find(filter)
      .populate('parent', 'name contentType level')
      .populate('children', 'name contentType level status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .populate('budgetPool', 'name poolNumber totalAmount status')
      .sort(sortConfig)
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const totalContent = await Content.countDocuments(filter);
    const totalPages = Math.ceil(totalContent / Number(limit));

    // Calculate statistics
    const stats = await getContentStatistics(filter);

    res.status(StatusCodes.OK).json({
      content,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalContent,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      },
      statistics: stats
    });
  }
};

/**
 * Get Single Content
 * Detailed content view with hierarchy context
 */
const getSingleContent = async (req, res) => {
  const { id: contentId } = req.params;
  const { includeAncestors = false, includeDescendants = false } = req.query;

  const content = await Content.findById(contentId)
    .populate('parent', 'name contentType level path')
    .populate('children', 'name contentType level status sortOrder')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role')
    .populate('publishedBy', 'name email role')
    .populate('budgetPool', 'name poolNumber totalAmount spentAmount status');

  if (!content) {
    throw new CustomError.NotFoundError('Content not found');
  }

  // Check access permissions
  if (content.visibility === 'private' && req.user.role === 'user') {
    throw new CustomError.UnauthorizedError('You do not have permission to view this content');
  }

  if (content.visibility === 'restricted' && req.user.role === 'user') {
    if (!content.accessRoles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError('You do not have permission to view this content');
    }
  }

  let ancestors = [];
  let descendants = [];

  // Get ancestors (breadcrumb path)
  if (includeAncestors === 'true' && content.parent) {
    const ancestorPipeline = [
      { $match: { _id: content.parent } },
      {
        $graphLookup: {
          from: 'contents',
          startWith: '$parent',
          connectFromField: 'parent',
          connectToField: '_id',
          as: 'ancestors'
        }
      }
    ];

    const ancestorResult = await Content.aggregate(ancestorPipeline);
    if (ancestorResult.length > 0) {
      ancestors = [ancestorResult[0], ...ancestorResult[0].ancestors].reverse();
    }
  }

  // Get descendants (full subtree)
  if (includeDescendants === 'true') {
    const descendantPipeline = [
      { $match: { _id: content._id } },
      {
        $graphLookup: {
          from: 'contents',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'descendants',
          maxDepth: 3
        }
      }
    ];

    const descendantResult = await Content.aggregate(descendantPipeline);
    if (descendantResult.length > 0) {
      descendants = descendantResult[0].descendants;
    }
  }

  // Get related statistics if this is a program
  let programStats = {};
  if (['programme', 'chapitre'].includes(content.contentType)) {
    programStats = await getProgramStatistics(contentId);
  }

  // Increment view count
  await Content.findByIdAndUpdate(contentId, {
    $inc: { 'analytics.viewCount': 1 },
    'analytics.lastViewed': new Date()
  });

  res.status(StatusCodes.OK).json({
    content,
    ancestors,
    descendants,
    programStats
  });
};

/**
 * Update Content
 * Update content with validation and hierarchy management
 */
const updateContent = async (req, res) => {
  const { id: contentId } = req.params;
  const {
    name,
    title,
    description,
    text,
    parent,
    metadata,
    eligibilityRequirements,
    programConfig,
    seo,
    visibility,
    accessRoles,
    sortOrder
  } = req.body;

  // Only admin and case workers can update content
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and case workers can update content');
  }

  const content = await Content.findById(contentId);
  if (!content) {
    throw new CustomError.NotFoundError('Content not found');
  }

  // Check if content can be edited (not if it's published and has active programs)
  if (content.status === 'active' && content.programConfig?.currentBeneficiaries > 0) {
    throw new CustomError.BadRequestError('Cannot edit content with active beneficiaries');
  }

  // Validate parent change if provided
  if (parent !== undefined && parent !== content.parent?.toString()) {
    if (parent) {
      const newParent = await Content.findById(parent);
      if (!newParent) {
        throw new CustomError.NotFoundError('New parent content not found');
      }

      // Check hierarchy rules
      const hierarchyRules = {
        'programme': { allowedParents: [] },
        'chapitre': { allowedParents: ['programme'] },
        'sous_chapitre': { allowedParents: ['chapitre'] },
        'article': { allowedParents: ['sous_chapitre'] }
      };

      if (!hierarchyRules[content.contentType].allowedParents.includes(newParent.contentType)) {
        throw new CustomError.BadRequestError(
          `${content.contentType} cannot be moved under ${newParent.contentType}`
        );
      }

      // Check for circular reference
      if (await isCircularReference(contentId, parent)) {
        throw new CustomError.BadRequestError('Cannot create circular reference in content hierarchy');
      }
    }

    // Update hierarchy
    await updateContentHierarchy(content, parent);
  }

  // Check for duplicate names if name is being changed
  if (name && name.trim() !== content.name) {
    const duplicateFilter = {
      name: name.trim(),
      contentType: content.contentType,
      isDeleted: false,
      _id: { $ne: contentId }
    };

    if (content.parent) {
      duplicateFilter.parent = content.parent;
    } else {
      duplicateFilter.parent = null;
    }

    const existingContent = await Content.findOne(duplicateFilter);
    if (existingContent) {
      throw new CustomError.BadRequestError('Content with this name already exists at this level');
    }
  }

  // Update fields
  if (name) content.name = name.trim();
  if (title !== undefined) content.title = title?.trim();
  if (description !== undefined) content.description = description?.trim();
  if (text !== undefined) content.text = text?.trim();
  if (sortOrder !== undefined) content.sortOrder = sortOrder;
  if (visibility) content.visibility = visibility;
  if (accessRoles) content.accessRoles = accessRoles;

  // Update metadata
  if (metadata) {
    content.metadata = {
      ...content.metadata,
      ...metadata,
      tags: metadata.tags?.map(tag => tag.trim().toLowerCase()) || content.metadata.tags
    };
  }

  // Update eligibility requirements
  if (eligibilityRequirements) {
    content.eligibilityRequirements = {
      ...content.eligibilityRequirements,
      ...eligibilityRequirements
    };
  }

  // Update program configuration
  if (programConfig && ['programme', 'chapitre'].includes(content.contentType)) {
    content.programConfig = {
      ...content.programConfig,
      ...programConfig,
      applicationDeadline: programConfig.applicationDeadline ? new Date(programConfig.applicationDeadline) : content.programConfig.applicationDeadline,
      programStartDate: programConfig.programStartDate ? new Date(programConfig.programStartDate) : content.programConfig.programStartDate,
      programEndDate: programConfig.programEndDate ? new Date(programConfig.programEndDate) : content.programConfig.programEndDate
    };
  }

  // Update SEO
  if (seo) {
    content.seo = {
      ...content.seo,
      ...seo
    };

    // Regenerate slug if name changed
    if (name && !seo.slug) {
      content.seo.slug = name.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }
  }

  // Update version and audit fields
  content.version += 1;
  content.updatedBy = req.user.userId;

  await content.save();

  const updatedContent = await Content.findById(contentId)
    .populate('parent', 'name contentType level')
    .populate('children', 'name contentType level status')
    .populate('updatedBy', 'name email role');

  res.status(StatusCodes.OK).json({
    message: 'Content updated successfully',
    content: updatedContent
  });
};

/**
 * Publish Content
 * Content publishing workflow with validation
 */
const publishContent = async (req, res) => {
  const { id: contentId } = req.params;
  const { status, publishNotes } = req.body;

  // Only admin can publish content
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can publish content');
  }

  if (!status || !['active', 'inactive', 'archived'].includes(status)) {
    throw new CustomError.BadRequestError('Valid status (active/inactive/archived) is required');
  }

  const content = await Content.findById(contentId);
  if (!content) {
    throw new CustomError.NotFoundError('Content not found');
  }

  // Validate publishing requirements
  if (status === 'active') {
    // Check required fields
    if (!content.name || !content.description) {
      throw new CustomError.BadRequestError('Name and description are required for publishing');
    }

    // Check parent is active (if has parent)
    if (content.parent) {
      const parent = await Content.findById(content.parent);
      if (parent.status !== 'active') {
        throw new CustomError.BadRequestError('Parent content must be active before publishing child content');
      }
    }

    // For programs, validate program configuration
    if (['programme', 'chapitre'].includes(content.contentType)) {
      if (content.programConfig.programStartDate && content.programConfig.programEndDate) {
        if (content.programConfig.programEndDate <= content.programConfig.programStartDate) {
          throw new CustomError.BadRequestError('Program end date must be after start date');
        }
      }
    }
  }

  // Handle status transitions
  const oldStatus = content.status;
  content.status = status;

  if (status === 'active' && oldStatus !== 'active') {
    content.publishedAt = new Date();
    content.publishedBy = req.user.userId;
  }

  if (status === 'archived') {
    // Archive all children as well
    await Content.updateMany(
      { path: { $regex: `^${content.path}/` } },
      { 
        status: 'archived',
        updatedBy: req.user.userId 
      }
    );
  }

  content.updatedBy = req.user.userId;
  await content.save();

  // Create notifications for content managers
  const contentManagers = await User.find({
    role: { $in: ['admin', 'case_worker'] },
    isDeleted: false
  });

  for (const manager of contentManagers) {
    if (manager._id.toString() !== req.user.userId) {
      await createNotification({
        recipient: manager._id,
        type: 'system',
        title: 'Content Status Changed',
        message: `Content "${content.name}" status changed to ${status}.`,
        relatedEntities: { content: content._id },
        channels: { inApp: { enabled: true } }
      });
    }
  }

  const updatedContent = await Content.findById(contentId)
    .populate('publishedBy', 'name email role');

  res.status(StatusCodes.OK).json({
    message: `Content ${status === 'active' ? 'published' : status === 'inactive' ? 'unpublished' : 'archived'} successfully`,
    content: updatedContent
  });
};

/**
 * Manage Hierarchy
 * Move content within hierarchy and reorder
 */
const manageHierarchy = async (req, res) => {
  const { id: contentId } = req.params;
  const { newParentId, newPosition, operation = 'move' } = req.body;

  // Only admin and case workers can manage hierarchy
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only administrators and case workers can manage content hierarchy');
  }

  const content = await Content.findById(contentId);
  if (!content) {
    throw new CustomError.NotFoundError('Content not found');
  }

  switch (operation) {
    case 'move':
      await moveContentInHierarchy(content, newParentId);
      break;
    case 'reorder':
      await reorderContent(contentId, newPosition);
      break;
    default:
      throw new CustomError.BadRequestError('Invalid hierarchy operation');
  }

  const updatedContent = await Content.findById(contentId)
    .populate('parent', 'name contentType level')
    .populate('children', 'name contentType level status sortOrder');

  res.status(StatusCodes.OK).json({
    message: 'Content hierarchy updated successfully',
    content: updatedContent
  });
};

/**
 * Get Content Analytics
 * Usage and performance analytics
 */
const getContentAnalytics = async (req, res) => {
  const { 
    period = '30days',
    contentType,
    level
  } = req.query;

  // Only staff can view analytics
  if (!['admin', 'case_worker', 'finance_manager'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only staff members can view content analytics');
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
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const filter = { isDeleted: false };
  if (contentType) filter.contentType = contentType;
  if (level !== undefined) filter.level = Number(level);

  // Overall statistics
  const overallStats = await Content.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        activeContent: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        totalViews: { $sum: '$analytics.viewCount' },
        totalRequests: { $sum: '$analytics.requestCount' },
        avgPopularity: { $avg: '$analytics.popularityScore' }
      }
    }
  ]);

  // Content type breakdown
  const typeBreakdown = await Content.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$contentType',
        count: { $sum: 1 },
        activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        totalViews: { $sum: '$analytics.viewCount' },
        avgViews: { $avg: '$analytics.viewCount' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Most popular content
  const popularContent = await Content.find(filter)
    .sort({ 'analytics.viewCount': -1 })
    .limit(10)
    .select('name contentType analytics.viewCount analytics.requestCount status')
    .populate('parent', 'name contentType');

  // Recent activity
  const recentActivity = await Content.find({
    ...filter,
    updatedAt: { $gte: startDate }
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .select('name contentType status updatedAt')
    .populate('updatedBy', 'name email');

  const overall = overallStats[0] || {
    totalContent: 0,
    activeContent: 0,
    totalViews: 0,
    totalRequests: 0,
    avgPopularity: 0
  };

  res.status(StatusCodes.OK).json({
    period,
    analytics: {
      overall,
      typeBreakdown,
      popularContent,
      recentActivity
    }
  });
};

/**
 * Delete Content
 * Soft delete with hierarchy management
 */
const deleteContent = async (req, res) => {
  const { id: contentId } = req.params;
  const { deleteChildren = false } = req.body;

  // Only admin can delete content
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can delete content');
  }

  const content = await Content.findById(contentId)
    .populate('children', 'name contentType');

  if (!content) {
    throw new CustomError.NotFoundError('Content not found');
  }

  // Check if content has active programs or beneficiaries
  if (content.programConfig?.currentBeneficiaries > 0) {
    throw new CustomError.BadRequestError('Cannot delete content with active beneficiaries');
  }

  // Check if content has children
  if (content.children.length > 0 && !deleteChildren) {
    throw new CustomError.BadRequestError(
      `Content has ${content.children.length} children. Set deleteChildren=true to delete them as well.`
    );
  }

  // Check if content is referenced by demandes
  const referencedByDemandes = await Demande.countDocuments({
    'program.type': 'Content',
    'program.id': contentId,
    isDeleted: false
  });

  if (referencedByDemandes > 0) {
    throw new CustomError.BadRequestError(
      `Content is referenced by ${referencedByDemandes} requests and cannot be deleted`
    );
  }

  // Check if content has associated budget pool
  if (content.budgetPool) {
    const budgetPool = await BudgetPool.findById(content.budgetPool);
    if (budgetPool && budgetPool.spentAmount > 0) {
      throw new CustomError.BadRequestError(
        'Content has associated budget pool with spending history and cannot be deleted'
      );
    }
  }

  // Soft delete content
  content.isDeleted = true;
  content.deletedAt = new Date();
  content.deletedBy = req.user.userId;
  content.status = 'archived';

  await content.save();

  // Delete children if requested
  if (deleteChildren) {
    const deleteResult = await Content.updateMany(
      { path: { $regex: `^${content.path}/` } },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.userId,
        status: 'archived'
      }
    );

    // Remove from parent's children arrays
    await Content.updateMany(
      { children: { $in: [contentId, ...content.children.map(c => c._id)] } },
      { $pull: { children: { $in: [contentId, ...content.children.map(c => c._id)] } } }
    );

    res.status(StatusCodes.OK).json({
      message: `Content and ${deleteResult.modifiedCount} children deleted successfully`
    });
  } else {
    // Remove from parent's children array
    if (content.parent) {
      await Content.findByIdAndUpdate(content.parent, {
        $pull: { children: contentId }
      });
    }

    res.status(StatusCodes.OK).json({
      message: 'Content deleted successfully'
    });
  }
};

// Helper Functions

/**
 * Check for circular reference in hierarchy
 */
const isCircularReference = async (contentId, newParentId) => {
  if (contentId === newParentId) return true;

  let currentParent = newParentId;
  const visited = new Set();

  while (currentParent && !visited.has(currentParent)) {
    if (currentParent === contentId) return true;
    
    visited.add(currentParent);
    const parent = await Content.findById(currentParent).select('parent');
    currentParent = parent?.parent;
  }

  return false;
};

/**
 * Update content hierarchy
 */
const updateContentHierarchy = async (content, newParentId) => {
  const oldParentId = content.parent;

  // Remove from old parent's children
  if (oldParentId) {
    await Content.findByIdAndUpdate(oldParentId, {
      $pull: { children: content._id }
    });
  }

  // Add to new parent's children
  if (newParentId) {
    const newParent = await Content.findById(newParentId);
    content.parent = newParentId;
    content.level = newParent.level + 1;
    content.path = `${newParent.path}/${content.name.toLowerCase().replace(/\s+/g, '-')}`;

    await Content.findByIdAndUpdate(newParentId, {
      $push: { children: content._id }
    });
  } else {
    content.parent = null;
    content.level = 0;
    content.path = content.name.toLowerCase().replace(/\s+/g, '-');
  }

  // Update all descendants' paths and levels
  const descendants = await Content.find({
    path: { $regex: `^${content.path}/` }
  });

  for (const descendant of descendants) {
    const oldPath = descendant.path;
    const newPath = descendant.path.replace(
      new RegExp(`^${content.path.replace(/[.*+?^${}()|[\]\\]/g, '\\  // Check if content has children,
  if (content.children.length > 0 && !deleteChildren) {
    throw new CustomError.BadRequestError(')}`),
      content.path
    );
    
    descendant.path = newPath;
    descendant.level = newPath.split('/').length - 1;
    await descendant.save();
  }

  await content.save();
};

/**
 * Move content in hierarchy
 */
const moveContentInHierarchy = async (content, newParentId) => {
  if (newParentId) {
    const newParent = await Content.findById(newParentId);
    if (!newParent) {
      throw new CustomError.NotFoundError('New parent not found');
    }

    // Validate hierarchy rules
    const hierarchyRules = {
      'programme': { allowedParents: [] },
      'chapitre': { allowedParents: ['programme'] },
      'sous_chapitre': { allowedParents: ['chapitre'] },
      'article': { allowedParents: ['sous_chapitre'] }
    };

    if (!hierarchyRules[content.contentType].allowedParents.includes(newParent.contentType)) {
      throw new CustomError.BadRequestError(
        `${content.contentType} cannot be moved under ${newParent.contentType}`
      );
    }

    // Check for circular reference
    if (await isCircularReference(content._id.toString(), newParentId)) {
      throw new CustomError.BadRequestError('Cannot create circular reference');
    }
  }

  await updateContentHierarchy(content, newParentId);
};

/**
 * Reorder content at same level
 */
const reorderContent = async (contentId, newPosition) => {
  const content = await Content.findById(contentId);
  if (!content) {
    throw new CustomError.NotFoundError('Content not found');
  }

  // Get siblings
  const siblings = await Content.find({
    parent: content.parent,
    isDeleted: false
  }).sort('sortOrder');

  // Validate new position
  if (newPosition < 0 || newPosition >= siblings.length) {
    throw new CustomError.BadRequestError('Invalid position');
  }

  // Remove content from current position
  const currentIndex = siblings.findIndex(s => s._id.toString() === contentId);
  siblings.splice(currentIndex, 1);

  // Insert at new position
  siblings.splice(newPosition, 0, content);

  // Update sort orders
  for (let i = 0; i < siblings.length; i++) {
    siblings[i].sortOrder = i;
    await siblings[i].save();
  }
};

/**
 * Get content statistics
 */
const getContentStatistics = async (filter) => {
  const stats = await Content.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        activeContent: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        draftContent: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        totalViews: { $sum: '$analytics.viewCount' },
        totalRequests: { $sum: '$analytics.requestCount' },
        avgPopularity: { $avg: '$analytics.popularityScore' }
      }
    }
  ]);

  return stats[0] || {
    totalContent: 0,
    activeContent: 0,
    draftContent: 0,
    totalViews: 0,
    totalRequests: 0,
    avgPopularity: 0
  };
};

/**
 * Get program statistics
 */
const getProgramStatistics = async (contentId) => {
  // Get related demandes
  const requestStats = await Demande.aggregate([
    {
      $match: {
        'program.type': 'Content',
        'program.id': contentId,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        approvedRequests: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        paidRequests: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        totalRequested: { $sum: '$requestedAmount' },
        totalApproved: { $sum: '$approvedAmount' },
        totalPaid: { $sum: '$paidAmount' }
      }
    }
  ]);

  return requestStats[0] || {
    totalRequests: 0,
    approvedRequests: 0,
    paidRequests: 0,
    totalRequested: 0,
    totalApproved: 0,
    totalPaid: 0
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
  }
};

module.exports = {
  createContent,
  getAllContent,
  getSingleContent,
  updateContent,
  publishContent,
  manageHierarchy,
  getContentAnalytics,
  deleteContent
};