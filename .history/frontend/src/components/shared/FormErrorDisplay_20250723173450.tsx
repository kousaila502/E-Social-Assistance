import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';
import { ErrorHandler } from '../utils/errorHandler';
import requestService from '../services/requestService';

interface FormErrorDisplayProps {
    title?: string;
    message: string;
    details?: string[];
    className?: string;
}

const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
    title = "Validation Error",
    message,
    details = [],
    className = ""
}) => {
    return (
        <div className={`rounded-md bg-red-50 border border-red-200 p-4 ${className}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                        {title}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                        <p>{message}</p>
                        {details.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {details.map((detail, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExampleRequestForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<ReturnType<typeof ErrorHandler.formatError> | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError } = useToast();

  const handleSubmitRequest = async (formData: any) => {
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await requestService.create(formData);
      
      showSuccess(
        'Request Created!',
        'Your assistance request has been submitted successfully.'
      );
      
      // Handle success (redirect, reset form, etc.)
      
    } catch (error) {
      console.error('Request submission error:', error);
      
      const formattedError = ErrorHandler.formatError(error);
      
      if (formattedError.type === 'validation') {
        // Show validation errors inline
        setFormError(formattedError);
        setFieldErrors(ErrorHandler.extractValidationErrors(error));
      } else {
        // Show other errors as toast
        showError(
          'Request Failed',
          formattedError.message,
          formattedError.details
        );
      }
      
      // Handle logout for auth errors
      if (ErrorHandler.shouldLogout(error)) {
        // logout logic here
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Form Error Display */}
      {formError && (
        <FormErrorDisplay
          title="Please fix the following errors:"
          message={formError.message}
          details={formError.details}
          className="mb-4"
        />
      )}

      {/* Your form fields with field-level errors */}
      <div>
        <input 
          type="text" 
          name="title"
          className={fieldErrors.title ? 'border-red-500' : ''} 
        />
        {fieldErrors.title && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
        )}
      </div>

      {/* Submit button */}
      <button 
        onClick={handleSubmitRequest}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </div>
  );
};

export default FormErrorDisplay;