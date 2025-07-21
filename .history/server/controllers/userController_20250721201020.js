const { StatusCodes } = require('http-status-codes');
const User = require('../models/user');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils/checkPermissions');

/**
 * Get All Users
 * Admin/Case Worker can view all users with filtering and pagination
 */
const getAllUsers = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role,
    accountStatus,
    eligibilityStatus,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    department,
    minAge,
    maxAge,
    employmentStatus,
    isEmailVerified,
    minIncome,
    maxIncome
  } = req.query;

  // Build filter object
  const filter = { isDeleted: false };

  // Role-based filtering
  if (role && ['admin', 'user', 'case_worker', 'finance_manager'].includes(role)) {
    filter.role = role;
  }

  // Account status filtering
  if (accountStatus && ['active', 'inactive', 'suspended', 'pending_verification'].includes(accountStatus)) {
    filter.accountStatus = accountStatus;
  }

  // Eligibility status filtering
  if (eligibilityStatus && ['pending', 'verified', 'rejected', 'requires_update'].includes(eligibilityStatus)) {
    filter['eligibility.status'] = eligibilityStatus;
  }

  // Email verification filtering
  if (isEmailVerified !== undefined) {
    filter.isEmailVerified = isEmailVerified === 'true';
  }

  // Employment status filtering
  if (employmentStatus && ['employed', 'unemployed', 'self_employed', 'retired', 'student', 'disabled'].includes(employmentStatus)) {
    filter['economicInfo.employmentStatus'] = employmentStatus;
  }

  // Income range filtering
  if (minIncome) {
    filter['economicInfo.monthlyIncome'] = { ...filter['economicInfo.monthlyIncome'], $gte: Number(minIncome) };
  }
  if (maxIncome) {
    filter['economicInfo.monthlyIncome'] = { ...filter['economicInfo.monthlyIncome'], $lte: Number(maxIncome) };
  }

  // Search functionality
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { 'personalInfo.nationalId': { $regex: search, $options: 'i' } }
    ];
  }

  // Age filtering (calculated from dateOfBirth)
  if (minAge || maxAge) {
    const currentDate = new Date();
    if (maxAge) {
      const minBirthDate = new Date(currentDate.getFullYear() - maxAge, currentDate.getMonth(), currentDate.getDate());
      filter['personalInfo.dateOfBirth'] = { ...filter['personalInfo.dateOfBirth'], $gte: minBirthDate };
    }
    if (minAge) {
      const maxBirthDate = new Date(currentDate.getFullYear() - minAge, currentDate.getMonth(), currentDate.getDate());
      filter['personalInfo.dateOfBirth'] = { ...filter['personalInfo.dateOfBirth'], $lte: maxBirthDate };
    }
  }

  // Sort configuration
  const sortConfig = {};
  sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query with population
  const users = await User.find(filter)
    .select('-password')
    .populate('createdBy', 'name email')
    .populate('eligibility.verifiedBy', 'name email')
    .sort(sortConfig)
    .skip(skip)
    .limit(Number(limit));

  // Get total count for pagination
  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / Number(limit));

  // Calculate statistics
  const stats = await User.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        verifiedUsers: { $sum: { $cond: [{ $eq: ['$eligibility.status', 'verified'] }, 1, 0] } },
        activeUsers: { $sum: { $cond: [{ $eq: ['$accountStatus', 'active'] }, 1, 0] } },
        avgEligibilityScore: { $avg: '$eligibility.score' },
        avgMonthlyIncome: { $avg: '$economicInfo.monthlyIncome' }
      }
    }
  ]);

  res.status(StatusCodes.OK).json({
    users,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalUsers,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    },
    stats: stats[0] || {
      totalUsers: 0,
      verifiedUsers: 0,
      activeUsers: 0,
      avgEligibilityScore: 0,
      avgMonthlyIncome: 0
    }
  });
};

/**
 * Get Single User
 * Get detailed user information by ID
 */
const getSingleUser = async (req, res) => {
  const { id: userId } = req.params;

  // Check permissions - users can only view their own profile, staff can view any
  if (req.user.role === 'user') {
    checkPermissions(req.user, userId);
  }

  const user = await User.findById(userId)
    .select('-password')
    .populate('createdBy', 'name email role')
    .populate('eligibility.verifiedBy', 'name email role');

  if (!user) {
    throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
  }

  // Get user statistics (requests, payments, etc.)
  const userStats = await getUserStatistics(userId);

  res.status(StatusCodes.OK).json({
    user,
    statistics: userStats
  });
};

/**
 * Update User
 * Admin/Case Worker can update user information
 */
const updateUser = async (req, res) => {
  const { id: userId } = req.params;
  const {
    name,
    phoneNumber,
    role,
    accountStatus,
    personalInfo,
    economicInfo,
    preferences,
    eligibility
  } = req.body;

  // Check permissions
  if (req.user.role === 'user') {
    checkPermissions(req.user, userId);
    // Users can't change their own role or account status
    if (role || accountStatus) {
      throw new CustomError.UnauthorizedError('You cannot modify role or account status');
    }
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
  }

  // Check for duplicate phone number
  if (phoneNumber && phoneNumber !== user.phoneNumber) {
    const phoneExists = await User.findOne({ 
      phoneNumber: phoneNumber.trim(),
      _id: { $ne: userId }
    });
    if (phoneExists) {
      throw new CustomError.BadRequestError('Phone number already in use');
    }
  }

  // Check for duplicate national ID
  if (personalInfo?.nationalId && personalInfo.nationalId !== user.personalInfo?.nationalId) {
    const nationalIdExists = await User.findOne({ 
      'personalInfo.nationalId': personalInfo.nationalId,
      _id: { $ne: userId }
    });
    if (nationalIdExists) {
      throw new CustomError.BadRequestError('National ID already registered');
    }
  }

  // Update basic fields
  if (name) user.name = name.trim();
  if (phoneNumber) user.phoneNumber = phoneNumber.trim();
  
  // Role and status updates (admin/case_worker only)
  if (req.user.role === 'admin' || req.user.role === 'case_worker') {
    if (role && ['admin', 'user', 'case_worker', 'finance_manager'].includes(role)) {
      user.role = role;
    }
    if (accountStatus && ['active', 'inactive', 'suspended', 'pending_verification'].includes(accountStatus)) {
      user.accountStatus = accountStatus;
    }
  }

  // Update nested objects
  if (personalInfo) {
    user.personalInfo = { ...user.personalInfo, ...personalInfo };
  }
  if (economicInfo) {
    user.economicInfo = { ...user.economicInfo, ...economicInfo };
    // Recalculate eligibility score if economic info changes
    user.eligibility.score = user.calculateEligibilityScore();
  }
  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
  }

  // Eligibility updates (case_worker/admin only)
  if (eligibility && (req.user.role === 'admin' || req.user.role === 'case_worker')) {
    if (eligibility.status && ['pending', 'verified', 'rejected', 'requires_update'].includes(eligibility.status)) {
      user.eligibility.status = eligibility.status;
      user.eligibility.lastVerificationDate = new Date();
      user.eligibility.verifiedBy = req.user.userId;
    }
    if (eligibility.categories) {
      user.eligibility.categories = eligibility.categories;
    }
    if (eligibility.verificationNotes) {
      user.eligibility.verificationNotes = eligibility.verificationNotes;
    }
  }

  await user.save();

  const updatedUser = await User.findById(userId)
    .select('-password');

  res.status(StatusCodes.OK).json({
    message: 'User updated successfully',
    user: updatedUser
  });
};

/**
 * Delete User (Soft Delete)
 * Admin can soft delete users
 */
const deleteUser = async (req, res) => {
  const { id: userId } = req.params;

  // Only admin can delete users
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can delete users');
  }

  // Prevent self-deletion
  if (req.user.userId === userId) {
    throw new CustomError.BadRequestError('You cannot delete your own account');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
  }

  // Soft delete
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletedBy = req.user.userId;
  user.accountStatus = 'inactive';

  await user.save();

  res.status(StatusCodes.OK).json({
    message: 'User deleted successfully'
  });
};

/**
 * Restore User
 * Admin can restore soft-deleted users
 */


const restoreUser = async (req, res) => {
  const { id: userId } = req.params;

  // DEBUG: Check database connection
  console.log('Connected to database:', mongoose.connection.db.databaseName);
  console.log('Collection name:', User.collection.name);
  
  // Count all users in the collection
  const totalUsers = await User.countDocuments({});
  console.log('Total users in collection:', totalUsers);
  
  // List all user IDs
  const allUsers = await User.find({}, '_id name email').limit(5);
  console.log('Sample user IDs:', allUsers.map(u => u._id.toString()));
  
  // Only admin can restore users
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can restore users');
  }
  
  // Find user by ID first
  const user = await User.findById(userId);
  console.log('Found user:', user ? 'YES' : 'NO');
  console.log('User isDeleted:', user?.isDeleted);
  console.log('User name:', user?.name);
  console.log('User email:', user?.email);
  
  if (!user) {
    throw new CustomError.NotFoundError(`User not found with id: ${userId}`);
  }
  
  if (!user.isDeleted) {
    throw new CustomError.BadRequestError(`User with id: ${userId} is not deleted`);
  }
  
  // Restore user
  user.isDeleted = false;
  user.deletedAt = undefined;
  user.deletedBy = undefined;
  user.accountStatus = 'active';
  
  await user.save();
  
  res.status(StatusCodes.OK).json({
    message: 'User restored successfully',
    user: await User.findById(userId).select('-password')
  });
};

/**
 * Verify User Documents
 * Case Worker/Admin can verify user documents
 */
const verifyDocuments = async (req, res) => {
  const { id: userId } = req.params;
  const { documentType, status, rejectionReason } = req.body;

  // Only case workers and admins can verify documents
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only case workers and administrators can verify documents');
  }

  if (!documentType || !status) {
    throw new CustomError.BadRequestError('Please provide document type and status');
  }

  const validDocuments = ['nationalIdCard', 'incomeProof', 'familyComposition', 'residenceProof'];
  if (!validDocuments.includes(documentType)) {
    throw new CustomError.BadRequestError('Invalid document type');
  }

  if (!['pending', 'verified', 'rejected'].includes(status)) {
    throw new CustomError.BadRequestError('Invalid verification status');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
  }

  // Update document verification status
  if (!user.documents[documentType]) {
    user.documents[documentType] = {};
  }

  user.documents[documentType].status = status;
  user.documents[documentType].verifiedBy = req.user.userId;
  user.documents[documentType].verifiedAt = new Date();

  if (status === 'rejected' && rejectionReason) {
    user.documents[documentType].rejectionReason = rejectionReason;
  }

  // Check if all required documents are verified
  const requiredDocs = ['nationalIdCard', 'incomeProof', 'familyComposition', 'residenceProof'];
  const allVerified = requiredDocs.every(doc => 
    user.documents[doc]?.status === 'verified'
  );

  // Update overall eligibility status if all documents verified
  if (allVerified && user.eligibility.status === 'pending') {
    user.eligibility.status = 'verified';
    user.eligibility.lastVerificationDate = new Date();
    user.eligibility.verifiedBy = req.user.userId;
  }

  await user.save();

  res.status(StatusCodes.OK).json({
    message: 'Document verification updated successfully',
    documentStatus: user.documents[documentType],
    overallEligibility: user.eligibility
  });
};

/**
 * Calculate User Eligibility
 * Recalculates and updates user eligibility score
 */
const calculateEligibility = async (req, res) => {
  const { id: userId } = req.params;

  // Only case workers and admins can calculate eligibility
  if (!['admin', 'case_worker'].includes(req.user.role)) {
    throw new CustomError.UnauthorizedError('Only case workers and administrators can calculate eligibility');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
  }

  // Calculate new eligibility score
  const newScore = user.calculateEligibilityScore();
  
  // Update eligibility information
  user.eligibility.score = newScore;
  user.eligibility.lastVerificationDate = new Date();
  user.eligibility.verifiedBy = req.user.userId;

  // Auto-assign categories based on score and profile
  const categories = [];
  if (user.economicInfo.monthlyIncome < 20000) categories.push('low_income');
  if (user.economicInfo.familySize >= 5) categories.push('large_family');
  if (user.economicInfo.employmentStatus === 'disabled') categories.push('disabled');
  if (user.age >= 65) categories.push('elderly');
  if (user.economicInfo.employmentStatus === 'unemployed') categories.push('unemployed');
  if (user.economicInfo.employmentStatus === 'student') categories.push('student');

  user.eligibility.categories = categories;

  await user.save();

  res.status(StatusCodes.OK).json({
    message: 'Eligibility calculated successfully',
    eligibility: user.eligibility,
    recommendedCategories: categories
  });
};

/**
 * Get User Statistics
 * Helper function to get user-related statistics
 */
const getUserStatistics = async (userId) => {
  // This would typically involve queries to other collections
  // For now, return a placeholder structure
  return {
    totalRequests: 0,
    approvedRequests: 0,
    totalAmountReceived: 0,
    averageProcessingTime: 0,
    documentsVerified: 0,
    lastActivity: new Date()
  };
};

/**
 * Bulk User Operations
 * Admin can perform bulk operations on users
 */
const bulkUpdateUsers = async (req, res) => {
  const { userIds, action, data } = req.body;

  // Only admin can perform bulk operations
  if (req.user.role !== 'admin') {
    throw new CustomError.UnauthorizedError('Only administrators can perform bulk operations');
  }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new CustomError.BadRequestError('Please provide valid user IDs');
  }

  if (!action || !['updateStatus', 'updateRole', 'delete', 'restore'].includes(action)) {
    throw new CustomError.BadRequestError('Invalid bulk action');
  }

  const updateData = {};
  let result;

  switch (action) {
    case 'updateStatus':
      if (!data.accountStatus || !['active', 'inactive', 'suspended'].includes(data.accountStatus)) {
        throw new CustomError.BadRequestError('Invalid account status');
      }
      updateData.accountStatus = data.accountStatus;
      result = await User.updateMany(
        { _id: { $in: userIds }, isDeleted: false },
        updateData
      );
      break;

    case 'updateRole':
      if (!data.role || !['admin', 'user', 'case_worker', 'finance_manager'].includes(data.role)) {
        throw new CustomError.BadRequestError('Invalid role');
      }
      updateData.role = data.role;
      result = await User.updateMany(
        { _id: { $in: userIds }, isDeleted: false },
        updateData
      );
      break;

    case 'delete':
      updateData.isDeleted = true;
      updateData.deletedAt = new Date();
      updateData.deletedBy = req.user.userId;
      updateData.accountStatus = 'inactive';
      result = await User.updateMany(
        { _id: { $in: userIds }, isDeleted: false },
        updateData
      );
      break;

    case 'restore':
      result = await User.updateMany(
        { _id: { $in: userIds }, isDeleted: true },
        {
          $unset: { deletedAt: 1, deletedBy: 1 },
          $set: { isDeleted: false, accountStatus: 'active' }
        }
      );
      break;
  }

  res.status(StatusCodes.OK).json({
    message: `Bulk ${action} completed successfully`,
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  restoreUser,
  verifyDocuments,
  calculateEligibility,
  bulkUpdateUsers
};