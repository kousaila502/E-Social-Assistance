// Format numbers as currency
const formatCurrency = (amount, currency = 'DA', locale = 'fr-DZ') => {
  try {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 DA';
    }
    
    const numAmount = parseFloat(amount);
    
    // For Algerian Dinar (DA)
    if (currency === 'DA') {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(numAmount) + ' DA';
    }
    
    // For other currencies
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numAmount);
  } catch (error) {
    return `${amount || 0} ${currency}`;
  }
};

// Format dates for API responses
const formatDate = (date, options = {}) => {
  try {
    if (!date) return null;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    
    const {
      format = 'iso', // 'iso', 'locale', 'short', 'long', 'relative'
      locale = 'fr-DZ',
      timezone = 'Africa/Algiers'
    } = options;
    
    switch (format) {
      case 'iso':
        return dateObj.toISOString();
      
      case 'locale':
        return dateObj.toLocaleDateString(locale, { timeZone: timezone });
      
      case 'short':
        return dateObj.toLocaleDateString(locale, {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      
      case 'long':
        return dateObj.toLocaleDateString(locale, {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'datetime':
        return dateObj.toLocaleString(locale, {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      
      case 'relative':
        const now = new Date();
        const diffInSeconds = Math.floor((now - dateObj) / 1000);
        
        if (diffInSeconds < 60) return 'Il y a quelques secondes';
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} minutes`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} heures`;
        if (diffInSeconds < 2592000) return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
        return dateObj.toLocaleDateString(locale);
      
      default:
        return dateObj.toISOString();
    }
  } catch (error) {
    return null;
  }
};

// Standardize phone number format
const formatPhoneNumber = (phoneNumber, countryCode = '+213') => {
  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return null;
    }
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Algerian phone numbers
    if (countryCode === '+213') {
      // Remove country code if present
      if (cleaned.startsWith('213')) {
        cleaned = cleaned.substring(3);
      }
      
      // Add leading zero if missing
      if (!cleaned.startsWith('0') && cleaned.length === 9) {
        cleaned = '0' + cleaned;
      }
      
      // Validate length (should be 10 digits with leading 0)
      if (cleaned.length === 10 && cleaned.startsWith('0')) {
        // Format as: 0X XX XX XX XX
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
      }
    }
    
    // Return original if can't format
    return phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
};

// Format decimals as percentages
const formatPercentage = (decimal, precision = 1) => {
  try {
    if (decimal === null || decimal === undefined || isNaN(decimal)) {
      return '0%';
    }
    
    const percentage = parseFloat(decimal) * 100;
    return `${percentage.toFixed(precision)}%`;
  } catch (error) {
    return '0%';
  }
};

// Convert bytes to human readable format
const formatFileSize = (bytes, precision = 1) => {
  try {
    if (!bytes || bytes === 0) {
      return '0 B';
    }
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(precision)} ${sizes[i]}`;
  } catch (error) {
    return '0 B';
  }
};

// Clean and trim text inputs
const sanitizeText = (text, options = {}) => {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const {
      trim = true,
      removeExtraSpaces = true,
      removeSpecialChars = false,
      maxLength = null
    } = options;
    
    let sanitized = text;
    
    if (trim) {
      sanitized = sanitized.trim();
    }
    
    if (removeExtraSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }
    
    if (removeSpecialChars) {
      sanitized = sanitized.replace(/[<>{}[\]\\\/]/g, '');
    }
    
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  } catch (error) {
    return text || '';
  }
};

// Create URL-friendly slugs from text
const generateSlug = (text, options = {}) => {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const { maxLength = 50, separator = '-' } = options;
    
    let slug = text
      .toLowerCase()
      .trim()
      // Replace accented characters
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Replace spaces and special characters with separator
      .replace(/[^a-z0-9]+/g, separator)
      // Remove leading/trailing separators
      .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '')
      // Replace multiple separators with single
      .replace(new RegExp(`${separator}+`, 'g'), separator);
    
    if (maxLength && slug.length > maxLength) {
      slug = slug.substring(0, maxLength).replace(new RegExp(`${separator}[^${separator}]*$`), '');
    }
    
    return slug;
  } catch (error) {
    return '';
  }
};

// Format Joi/validation errors for API responses
const formatValidationErrors = (errors) => {
  try {
    if (!errors) return [];
    
    // Handle Joi validation errors
    if (errors.details && Array.isArray(errors.details)) {
      return errors.details.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        value: error.context?.value
      }));
    }
    
    // Handle custom validation errors
    if (Array.isArray(errors)) {
      return errors.map(error => ({
        field: error.field || 'unknown',
        message: error.message || 'Validation error',
        value: error.value
      }));
    }
    
    // Handle single error object
    if (typeof errors === 'object') {
      return [{
        field: errors.field || 'unknown',
        message: errors.message || 'Validation error',
        value: errors.value
      }];
    }
    
    // Handle string errors
    return [{
      field: 'general',
      message: errors.toString(),
      value: null
    }];
  } catch (error) {
    return [{
      field: 'general',
      message: 'Error formatting validation errors',
      value: null
    }];
  }
};

// Standard success response format
const formatSuccessResponse = (data, message = 'Success', metadata = {}) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
  
  // Add data if provided
  if (data !== undefined) {
    response.data = data;
  }
  
  // Add metadata if provided
  if (metadata && Object.keys(metadata).length > 0) {
    response.metadata = metadata;
  }
  
  return response;
};

// Standard error response format
const formatErrorResponse = (message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = formatValidationErrors(errors);
  }
  
  return response;
};

// Pagination metadata format
const formatPaginationResponse = (data, pagination) => {
  const {
    page = 1,
    limit = 20,
    total = 0,
    pages = Math.ceil(total / limit)
  } = pagination;
  
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      pages: parseInt(pages),
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
      nextPage: page < pages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

// Remove sensitive user data for responses
const formatUserResponse = (user, includeEmail = false) => {
  try {
    if (!user) return null;
    
    const userObj = user.toObject ? user.toObject() : user;
    
    const safeUser = {
      _id: userObj._id,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      role: userObj.role,
      isActive: userObj.isActive,
      isEmailVerified: userObj.isEmailVerified,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt
    };
    
    if (includeEmail) {
      safeUser.email = userObj.email;
    }
    
    // Remove sensitive fields
    delete userObj.password;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    delete userObj.emailVerificationToken;
    delete userObj.__v;
    
    return safeUser;
  } catch (error) {
    return null;
  }
};

// Remove empty fields from objects
const removeEmptyFields = (obj, options = {}) => {
  try {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const { removeNull = true, removeUndefined = true, removeEmptyStrings = true } = options;
    
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
      let shouldRemove = false;
      
      if (removeNull && value === null) shouldRemove = true;
      if (removeUndefined && value === undefined) shouldRemove = true;
      if (removeEmptyStrings && value === '') shouldRemove = true;
      
      if (!shouldRemove) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          cleaned[key] = removeEmptyFields(value, options);
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  } catch (error) {
    return obj;
  }
};

// Proper case formatting
const capitalizeWords = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch (error) {
    return text || '';
  }
};

// Truncate long text with ellipsis
const truncateText = (text, maxLength = 100, suffix = '...') => {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  } catch (error) {
    return text || '';
  }
};

// Format status with color coding
const formatStatus = (status) => {
  const statusMap = {
    // Request statuses
    'pending': { label: 'En Attente', color: 'orange', priority: 1 },
    'under_review': { label: 'En Révision', color: 'blue', priority: 2 },
    'approved': { label: 'Approuvé', color: 'green', priority: 3 },
    'rejected': { label: 'Rejeté', color: 'red', priority: 4 },
    'completed': { label: 'Terminé', color: 'purple', priority: 5 },
    
    // Budget statuses
    'draft': { label: 'Brouillon', color: 'gray', priority: 1 },
    'active': { label: 'Actif', color: 'green', priority: 2 },
    'frozen': { label: 'Gelé', color: 'blue', priority: 3 },
    'depleted': { label: 'Épuisé', color: 'orange', priority: 4 },
    'expired': { label: 'Expiré', color: 'red', priority: 5 },
    
    // Payment statuses
    'scheduled': { label: 'Programmé', color: 'blue', priority: 1 },
    'processing': { label: 'En Cours', color: 'orange', priority: 2 },
    'paid': { label: 'Payé', color: 'green', priority: 3 },
    'failed': { label: 'Échoué', color: 'red', priority: 4 },
    'cancelled': { label: 'Annulé', color: 'gray', priority: 5 }
  };
  
  return statusMap[status] || { label: status, color: 'gray', priority: 0 };
};

module.exports = {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  formatPercentage,
  formatFileSize,
  sanitizeText,
  generateSlug,
  formatValidationErrors,
  formatSuccessResponse,
  formatErrorResponse,
  formatPaginationResponse,
  formatUserResponse,
  removeEmptyFields,
  capitalizeWords,
  truncateText,
  formatStatus
};
