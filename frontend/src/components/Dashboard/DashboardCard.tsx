// src/components/Dashboard/DashboardCard.tsx
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface DashboardCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  link?: string;
  buttonText?: string;
  buttonColor?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo' | 'gray';
  badge?: string;
  className?: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  children,
  icon: Icon,
  link,
  buttonText,
  buttonColor = 'blue',
  badge,
  className = '',
  onClick
}) => {
  const getButtonColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
      gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      yellow: 'text-yellow-600',
      indigo: 'text-indigo-600',
      gray: 'text-gray-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const cardContent = (
    <div className={`bg-white overflow-hidden shadow rounded-lg transition-shadow duration-200 hover:shadow-md ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {Icon && (
              <div className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-100">
                <Icon className={`h-6 w-6 ${getIconColorClasses(buttonColor)}`} />
              </div>
            )}
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {badge && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>

        {/* Content */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}

        {/* Action Button */}
        {(buttonText || link) && (
          <div className="mt-6">
            {link ? (
              <Link
                to={link}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${getButtonColorClasses(buttonColor)} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
              >
                {buttonText || 'View More'}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={onClick}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${getButtonColorClasses(buttonColor)} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
              >
                {buttonText || 'Action'}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional footer */}
      {link && !buttonText && (
        <div className="bg-gray-50 px-6 py-3">
          <div className="text-sm">
            <Link
              to={link}
              className={`font-medium ${getIconColorClasses(buttonColor)} hover:opacity-80 transition-opacity duration-200`}
            >
              View details
              <span className="sr-only"> for {title}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  // If it's a clickable card without a button, wrap the whole card
  if (onClick && !buttonText && !link) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
      >
        {cardContent}
      </button>
    );
  }

  // If it's a link card without a button, wrap the whole card
  if (link && !buttonText) {
    return (
      <Link
        to={link}
        className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default DashboardCard;