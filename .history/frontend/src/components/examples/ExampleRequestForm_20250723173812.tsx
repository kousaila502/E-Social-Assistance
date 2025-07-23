import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { ErrorHandler } from '../../utils/errorHandler';
import requestService from '../../services/requestService';
import FormErrorDisplay from '../shared/FormErrorDisplay';

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

export default ExampleRequestForm;