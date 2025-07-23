import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ErrorSummaryProps {
  errors: Record<string, any>;
  onFieldClick?: (fieldName: string) => void;
  onDismiss?: () => void;
  title?: string;
}

const ErrorSummary: React.FC<ErrorSummaryProps> = ({ 
  errors, 
  onFieldClick, 
  onDismiss,
  title = "Please fix the following errors:" 
}) => {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error?.message);
  
  if (errorEntries.length === 0) return null;

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      name: 'Full Name',
      email: 'Email Address',
      phoneNumber: 'Phone Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      terms: 'Terms and Conditions',
      'personalInfo.nationalId': 'National ID',
      'personalInfo.dateOfBirth': 'Date of Birth',
      'economicInfo.familySize': 'Family Size',
      'economicInfo.monthlyIncome': 'Monthly Income',
      'economicInfo.employmentStatus': 'Employment Status'
    };
    return labels[fieldName] || fieldName;
  };

  const handleFieldClick = (fieldName: string) => {
    if (onFieldClick) {
      onFieldClick(fieldName);
    } else {
      // Default behavior: scroll to field
      const element = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  };

  return (
    <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6 animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            {title}
          </h3>
          <div className="text-sm text-red-700">
            <ul className="space-y-1">
              {errorEntries.map(([fieldName, error]) => (
                <li key={fieldName}>
                  <button
                    type="button"
                    onClick={() => handleFieldClick(fieldName)}
                    className="text-left hover:text-red-900 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                  >
                    <span className="font-medium">{getFieldLabel(fieldName)}:</span> {error.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto flex-shrink-0">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorSummary;