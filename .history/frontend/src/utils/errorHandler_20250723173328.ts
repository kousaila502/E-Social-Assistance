import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

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

export interface FormattedError {
  message: string;
  details: string[];
  type: 'validation' | 'authentication' | 'authorization' | 'network' | 'server' | 'business';
  statusCode: number;
  isUserFriendly: boolean;
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
   * Format API errors for display to users
   */
  static formatError(error: any): FormattedError {
    console.error('Error details:', error);

    // Handle network errors
    if (!error.response) {
      return {
        message: 'Network error. Please check your internet connection and try again.',
        details: ['Unable to connect to the server'],
        type: 'network',
        statusCode: 0,
        isUserFriendly: true
      };
    }

    const { status, data } = error.response;
    
    // Handle enhanced backend error format
    if (data?.error) {
      const backendError = data.error;
      return {
        message: backendError.message,
        details: backendError.details?.map((d: any) => `${d.field}: ${d.message}`) || [],
        type: ErrorHandler.categorizeError(status, backendError.type),
        statusCode: status,
        isUserFriendly: true
      };
    }

    // Handle legacy error format
    if (data?.message) {
      return {
        message: data.message,
        details: data.errors || [],
        type: ErrorHandler.categorizeError(status),
        statusCode: status,
        isUserFriendly: true
      };
    }

    // Fallback for unknown error format
    return {
      message: ErrorHandler.getDefaultMessage(status),
      details: [error.message || 'An unexpected error occurred'],
      type: ErrorHandler.categorizeError(status),
      statusCode: status,
      isUserFriendly: false
    };
  }

  /**
   * Categorize errors by type for better handling
   */
  private static categorizeError(statusCode: number, backendType?: string): FormattedError['type'] {
    if (backendType === 'validation') return 'validation';
    
    switch (statusCode) {
      case 400:
        return 'validation';
      case 401:
        return 'authentication';
      case 403:
        return 'authorization';
      case 404:
      case 409:
        return 'business';
      case 422:
        return 'validation';
      case 500:
      case 502:
      case 503:
        return 'server';
      default:
        return statusCode >= 400 && statusCode < 500 ? 'business' : 'server';
    }
  }

  /**
   * Get user-friendly default messages
   */
  private static getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This operation conflicts with existing data.';
      case 422:
        return 'Please correct the validation errors and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Extract validation errors for form handling
   */
  static extractValidationErrors(error: any): Record<string, string> {
    const formattedError = ErrorHandler.formatError(error);
    const validationErrors: Record<string, string> = {};

    if (formattedError.type === 'validation' && error.response?.data?.error?.details) {
      error.response.data.error.details.forEach((detail: any) => {
        if (detail.field) {
          validationErrors[detail.field] = detail.message;
        }
      });
    }

    return validationErrors;
  }

  /**
   * Check if error should trigger logout
   */
  static shouldLogout(error: any): boolean {
    const statusCode = error.response?.status;
    return statusCode === 401 && 
           (error.response?.data?.message?.includes('token') || 
            error.response?.data?.message?.includes('authentication'));
  }

  /**
   * Get appropriate toast notification type
   */
  static getToastType(error: FormattedError): 'error' | 'warning' | 'info' {
    switch (error.type) {
      case 'validation':
        return 'warning';
      case 'network':
      case 'server':
        return 'error';
      default:
        return 'error';
    }
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