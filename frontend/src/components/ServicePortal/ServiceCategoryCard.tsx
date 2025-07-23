// src/components/ServicePortal/ServiceCategoryCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ServiceCategoryCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'red' | 'purple' | 'green' | 'orange' | 'yellow' | 'indigo' | 'teal';
  category: 'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other';
  programType: 'Content' | 'Announcement';
  programId: string;
  isPopular?: boolean;
  estimatedTime?: string;
  examples?: string[];
  disabled?: boolean;
  maxAmount?: number;
  avgProcessingDays?: number;
}

const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  id,
  title,
  description,
  icon: Icon,
  color,
  category,
  programType,
  programId,
  isPopular = false,
  estimatedTime,
  examples = [],
  disabled = false,
  maxAmount,
  avgProcessingDays
}) => {
  const navigate = useNavigate();

  const colorConfig = {
    blue: {
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-300',
      hoverBg: 'hover:bg-blue-100',
      textColor: 'text-blue-600',
      popularBg: 'bg-blue-600'
    },
    red: {
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      hoverBorder: 'hover:border-red-300',
      hoverBg: 'hover:bg-red-100',
      textColor: 'text-red-600',
      popularBg: 'bg-red-600'
    },
    purple: {
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-300',
      hoverBg: 'hover:bg-purple-100',
      textColor: 'text-purple-600',
      popularBg: 'bg-purple-600'
    },
    green: {
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBorder: 'hover:border-green-300',
      hoverBg: 'hover:bg-green-100',
      textColor: 'text-green-600',
      popularBg: 'bg-green-600'
    },
    orange: {
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-300',
      hoverBg: 'hover:bg-orange-100',
      textColor: 'text-orange-600',
      popularBg: 'bg-orange-600'
    },
    yellow: {
      bgColor: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      hoverBorder: 'hover:border-yellow-300',
      hoverBg: 'hover:bg-yellow-100',
      textColor: 'text-yellow-600',
      popularBg: 'bg-yellow-600'
    },
    indigo: {
      bgColor: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      hoverBorder: 'hover:border-indigo-300',
      hoverBg: 'hover:bg-indigo-100',
      textColor: 'text-indigo-600',
      popularBg: 'bg-indigo-600'
    },
    teal: {
      bgColor: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      hoverBorder: 'hover:border-teal-300',
      hoverBg: 'hover:bg-teal-100',
      textColor: 'text-teal-600',
      popularBg: 'bg-teal-600'
    }
  };

  const config = colorConfig[color];

  const handleClick = () => {
    if (!disabled) {
      // Navigate to application page with service context
      navigate('/apply', {
        state: {
          serviceCategory: category,
          programType: programType,
          programId: programId,
          serviceName: title,
          maxAmount: maxAmount
        }
      });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  // Format processing time display
  const getProcessingTimeDisplay = () => {
    if (estimatedTime) return estimatedTime;
    if (avgProcessingDays) {
      if (avgProcessingDays === 1) return "~1 day";
      if (avgProcessingDays < 7) return `~${avgProcessingDays} days`;
      const weeks = Math.round(avgProcessingDays / 7);
      return weeks === 1 ? "~1 week" : `~${weeks} weeks`;
    }
    return null;
  };

  const processingTime = getProcessingTimeDisplay();

  return (
    <div
      className={`
        relative group
        ${config.bgColor} 
        ${config.borderColor} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : `${config.hoverBorder} ${config.hoverBg} cursor-pointer`}
        border-2 rounded-2xl p-6 
        transition-all duration-300 transform 
        ${disabled ? '' : 'hover:scale-105 hover:shadow-lg'}
        focus:outline-none focus:ring-4 focus:ring-blue-200
      `}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Apply for ${title}`}
      aria-disabled={disabled}
    >
      {/* Popular Badge */}
      {isPopular && !disabled && (
        <div className={`absolute -top-2 -right-2 ${config.popularBg} text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg`}>
          Popular
        </div>
      )}

      {/* Icon Section */}
      <div className="flex items-center justify-between mb-4">
        <div className={`${config.iconBg} p-4 rounded-2xl transition-transform duration-300 ${disabled ? '' : 'group-hover:scale-110'}`}>
          <Icon className={`h-8 w-8 ${config.iconColor}`} />
        </div>
        {processingTime && (
          <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
            {processingTime}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900 leading-tight">
          {title}
        </h3>
        
        <p className="text-gray-600 leading-relaxed text-sm">
          {description}
        </p>

        {/* Maximum Amount Display */}
        {maxAmount && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Max assistance:</span>
            <span className="ml-2 text-gray-700 font-semibold">
              ${maxAmount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Examples */}
        {examples.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Examples:
            </p>
            <div className="flex flex-wrap gap-1">
              {examples.slice(0, 3).map((example, index) => (
                <span
                  key={index}
                  className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border"
                >
                  {example}
                </span>
              ))}
              {examples.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{examples.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="mt-6 flex items-center justify-between">
        <span className={`inline-flex items-center text-sm font-semibold ${config.textColor} transition-transform duration-200 ${disabled ? '' : 'group-hover:translate-x-1'}`}>
          {disabled ? 'Coming Soon' : 'Apply Now'}
          {!disabled && (
            <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </span>
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-transparent via-current to-transparent"></div>
      </div>
    </div>
  );
};

export default ServiceCategoryCard;