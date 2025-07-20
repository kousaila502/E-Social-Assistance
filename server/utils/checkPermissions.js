const CustomError = require('../errors');

// Basic permission check - verify user can access resource
const checkPermissions = (requestUser, resourceUserId) => {
  // Admin has access to everything
  if (requestUser.role === 'admin') return;
  
  // Check if user is accessing their own resource
  if (requestUser.userId === resourceUserId.toString()) return;
  
  throw new CustomError.UnauthorizedError('Not authorized to access this resource');
};

// Check resource ownership with role-based overrides
const checkResourceOwnership = (requestUser, resource, resourceUserField = 'user') => {
  // Admin has full access
  if (requestUser.role === 'admin') return;
  
  // Get resource user ID
  let resourceUserId;
  if (typeof resource === 'string') {
    resourceUserId = resource;
  } else if (resource && resource[resourceUserField]) {
    resourceUserId = resource[resourceUserField].toString();
  } else if (resource && resource._id) {
    resourceUserId = resource._id.toString();
  }
  
  if (!resourceUserId) {
    throw new CustomError.UnauthorizedError('Unable to determine resource ownership');
  }
  
  // Case workers can access user resources for management
  if (requestUser.role === 'case_worker' && resourceUserField === 'user') {
    return;
  }
  
  // Finance managers can access payment-related resources
  if (requestUser.role === 'finance_manager' && 
      (resourceUserField === 'processedBy' || resourceUserField === 'createdBy')) {
    return;
  }
  
  // Check if user owns the resource
  if (requestUser.userId === resourceUserId) return;
  
  throw new CustomError.UnauthorizedError(`Not authorized to access this resource. Required: resource ownership or appropriate role`);
};

// Check if user has required role(s)
const checkRolePermissions = (requestUser, requiredRoles, operation = 'perform this action') => {
  if (!requiredRoles || requiredRoles.length === 0) return;
  
  // Ensure requiredRoles is an array
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  // Check if user has any of the required roles
  if (roles.includes(requestUser.role)) return;
  
  throw new CustomError.UnauthorizedError(
    `Access denied. Required roles: ${roles.join(', ')} to ${operation}. Your role: ${requestUser.role}`
  );
};

// Check budget pool access permissions
const checkBudgetPoolAccess = (requestUser, budgetPool, operation = 'access') => {
  // Admin has full access
  if (requestUser.role === 'admin') return;
  
  // Only finance managers and admins can access budget pools
  if (requestUser.role !== 'finance_manager') {
    throw new CustomError.UnauthorizedError('Only finance managers and administrators can access budget pools');
  }
  
  // Finance managers can only access pools they manage
  const managedBy = budgetPool.managedBy ? budgetPool.managedBy.toString() : null;
  if (managedBy && managedBy !== requestUser.userId) {
    throw new CustomError.UnauthorizedError(`Not authorized to ${operation} this budget pool. You can only manage assigned pools.`);
  }
  
  return;
};

// Check content access permissions
const checkContentAccess = (requestUser, content, operation = 'access') => {
  // Admin has full access
  if (requestUser.role === 'admin') return;
  
  // For viewing content
  if (operation === 'view' || operation === 'access') {
    // Published content is accessible to all authenticated users
    if (content.status === 'published' && content.isActive) return;
    
    // Unpublished content only accessible to staff
    if (['case_worker', 'finance_manager'].includes(requestUser.role)) return;
    
    // Content creators can view their own content
    if (content.createdBy && content.createdBy.toString() === requestUser.userId) return;
    
    throw new CustomError.UnauthorizedError('Not authorized to view this content');
  }
  
  // For creating/editing content
  if (['create', 'edit', 'update', 'delete'].includes(operation)) {
    // Only case workers and admins can manage content
    if (!['admin', 'case_worker'].includes(requestUser.role)) {
      throw new CustomError.UnauthorizedError('Only case workers and administrators can manage content');
    }
    
    // Case workers can only edit their own content (unless admin)
    if (requestUser.role === 'case_worker' && 
        content.createdBy && 
        content.createdBy.toString() !== requestUser.userId) {
      throw new CustomError.UnauthorizedError('You can only edit content you created');
    }
  }
  
  return;
};

// Check demande access permissions
const checkDemandeAccess = (requestUser, demande, operation = 'access') => {
  // Admin has full access
  if (requestUser.role === 'admin') return;
  
  // Case workers can access all demandes for management
  if (requestUser.role === 'case_worker') return;
  
  // Finance managers can view demandes for budget allocation
  if (requestUser.role === 'finance_manager' && 
      ['view', 'access', 'allocate'].includes(operation)) {
    return;
  }
  
  // Users can only access their own demandes
  const demandeUserId = demande.user ? demande.user.toString() : demande.userId?.toString();
  if (demandeUserId === requestUser.userId) return;
  
  throw new CustomError.UnauthorizedError(`Not authorized to ${operation} this assistance request`);
};

// Check payment access permissions
const checkPaymentAccess = (requestUser, payment, operation = 'access') => {
  // Admin has full access
  if (requestUser.role === 'admin') return;
  
  // Finance managers can manage all payments
  if (requestUser.role === 'finance_manager') return;
  
  // Case workers can view payments for their managed demandes
  if (requestUser.role === 'case_worker' && 
      ['view', 'access'].includes(operation)) {
    return;
  }
  
  // Users can view their own payments
  if (operation === 'view' || operation === 'access') {
    const paymentUserId = payment.user ? payment.user.toString() : 
                         payment.demande?.user?.toString();
    if (paymentUserId === requestUser.userId) return;
  }
  
  throw new CustomError.UnauthorizedError(`Not authorized to ${operation} payment information`);
};

// Check announcement access permissions
const checkAnnouncementAccess = (requestUser, announcement, operation = 'access') => {
  // Admin has full access
  if (requestUser.role === 'admin') return;
  
  // For viewing announcements
  if (operation === 'view' || operation === 'access') {
    // Published announcements are accessible to all authenticated users
    if (announcement.status === 'published' && announcement.isActive) return;
    
    // Unpublished announcements only accessible to staff
    if (['case_worker', 'finance_manager'].includes(requestUser.role)) return;
    
    // Creators can view their own announcements
    if (announcement.createdBy && announcement.createdBy.toString() === requestUser.userId) return;
    
    throw new CustomError.UnauthorizedError('Not authorized to view this announcement');
  }
  
  // For managing announcements
  if (['create', 'edit', 'update', 'delete', 'publish'].includes(operation)) {
    // Only case workers and admins can manage announcements
    if (!['admin', 'case_worker'].includes(requestUser.role)) {
      throw new CustomError.UnauthorizedError('Only case workers and administrators can manage announcements');
    }
    
    // Case workers can only edit their own announcements (unless admin)
    if (requestUser.role === 'case_worker' && 
        announcement.createdBy && 
        announcement.createdBy.toString() !== requestUser.userId) {
      throw new CustomError.UnauthorizedError('You can only edit announcements you created');
    }
  }
  
  return;
};

// Check user management permissions
const checkUserManagementAccess = (requestUser, targetUser, operation = 'access') => {
  // Admin has full access
  if (requestUser.role === 'admin') return;
  
  // Users can access their own profile
  if (targetUser && targetUser._id && targetUser._id.toString() === requestUser.userId) {
    // Users can view/update their own profile but not delete or change roles
    if (['view', 'access', 'update'].includes(operation)) return;
  }
  
  // Case workers can manage regular users (not other staff)
  if (requestUser.role === 'case_worker') {
    if (targetUser && targetUser.role === 'user') return;
    
    throw new CustomError.UnauthorizedError('Case workers can only manage regular user accounts');
  }
  
  throw new CustomError.UnauthorizedError(`Not authorized to ${operation} user accounts`);
};

// Comprehensive permission checker that determines the right check to use
const checkPermissionsByType = (requestUser, resource, resourceType, operation = 'access') => {
  switch (resourceType) {
    case 'demande':
      return checkDemandeAccess(requestUser, resource, operation);
    case 'payment':
      return checkPaymentAccess(requestUser, resource, operation);
    case 'budgetPool':
      return checkBudgetPoolAccess(requestUser, resource, operation);
    case 'content':
      return checkContentAccess(requestUser, resource, operation);
    case 'announcement':
      return checkAnnouncementAccess(requestUser, resource, operation);
    case 'user':
      return checkUserManagementAccess(requestUser, resource, operation);
    default:
      return checkResourceOwnership(requestUser, resource);
  }
};

module.exports = {
  checkPermissions,
  checkResourceOwnership,
  checkRolePermissions,
  checkBudgetPoolAccess,
  checkContentAccess,
  checkDemandeAccess,
  checkPaymentAccess,
  checkAnnouncementAccess,
  checkUserManagementAccess,
  checkPermissionsByType
};
