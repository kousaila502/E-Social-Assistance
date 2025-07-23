import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

export default FormErrorDisplay;