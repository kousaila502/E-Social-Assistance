const { StatusCodes } = require('http-status-codes');

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array} errors - Array of detailed error objects
 * @param {string} type - Error type for categorization
 * @returns {Object} Standardized error response object
 */
const createErrorResponse = (message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, errors = [], type = 'error') => {
    return {
        success: false,
        error: {
            type,
            message,
            statusCode,
            ...(errors.length > 0 && { details: errors }),
            timestamp: new Date().toISOString()
        }
    };
};

/**
 * Create a standardized success response
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Standardized success response object
 */
const createSuccessResponse = (message, data = null, statusCode = StatusCodes.OK) => {
    return {
        success: true,
        message,
        statusCode,
        ...(data && { data }),
        timestamp: new Date().toISOString()
    };
};

/**
 * Extract validation errors from express-validator
 * @param {Object} validationResult - Result from express-validator
 * @returns {Array} Array of formatted error objects
 */
const formatValidationErrors = (validationResult) => {
    return validationResult.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
        location: error.location
    }));
};

module.exports = {
    createErrorResponse,
    createSuccessResponse,
    formatValidationErrors
};