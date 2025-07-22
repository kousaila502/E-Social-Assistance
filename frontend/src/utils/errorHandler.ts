import { toast } from 'react-hot-toast';

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  type: 'client' | 'server' | 'network';
  stack?: string;
}

export class ErrorHandler {
  /**
   * Display error message to user using toast
   */
  static showError(error: ApiError | Error | string, context?: string) {
    let message: string;
    let duration = 4000;

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      // ApiError
      message = error.message;
      
      // Longer duration for server errors
      if (error.type === 'server') {
        duration = 6000;
      }

      // Show validation errors if present
      if (error.errors && error.errors.length > 0) {
        const validationErrors = error.errors
          .map(err => err.field ? `${err.field}: ${err.message}` : err.message)
          .join('\n');
        
        toast.error(`${message}\n\nDetails:\n${validationErrors}`, {
          duration: 6000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line'
          }
        });
        return;
      }
    }

    // Add context if provided
    if (context) {
      message = `${context}: ${message}`;
    }

    toast.error(message, { duration });
  }

  /**
   * Display success message
   */
  static showSuccess(message: string, duration = 3000) {
    toast.success(message, { duration });
  }

  /**
   * Display warning message
   */
  static showWarning(message: string, duration = 4000) {
    toast(message, {
      duration,
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B'
      }
    });
  }

  /**
   * Display info message
   */
  static showInfo(message: string, duration = 3000) {
    toast(message, {
      duration,
      icon: 'ℹ️',
      style: {
        background: '#DBEAFE',
        color: '#1E40AF',
        border: '1px solid #3B82F6'
      }
    });
  }

  /**
   * Get user-friendly error message based on status code
   */
  static getStatusMessage(statusCode: number): string {
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'You do not have permission for this action.',
      404: 'The requested resource was not found.',
      409: 'A conflict occurred. The resource may have been modified.',
      422: 'The data provided is invalid.',
      429: 'Too many requests. Please try again later.',
      500: 'Internal server error. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service maintenance in progress.',
      504: 'Request timeout. Please try again.'
    };

    return statusMessages[statusCode] || 'An unexpected error occurred.';
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: any): boolean {
    return !error.response && error.request;
  }

  /**
   * Extract meaningful message from various error formats
   */
  static extractMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.statusText) return error.response.statusText;
    return 'An unexpected error occurred';
  }
}

// Export common error patterns for reuse
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You need to log in to access this feature.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  TIMEOUT: 'The request timed out. Please try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.'
} as const;