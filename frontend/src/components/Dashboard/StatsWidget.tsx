// src/components/Dashboard/StatsWidget.tsx
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatsWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo' | 'gray';
  urgent?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType,
  icon: Icon,
  color = 'blue',
  urgent = false,
  loading = false,
  onClick,
  className = ''
}) => {
  const getColorClasses = (colorName: string, isUrgent: boolean) => {
    if (isUrgent) {
      return {
        bg: 'bg-red-50',
        icon: 'bg-red-100 text-red-600',
        border: 'border-red-200'
      };
    }

    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'bg-blue-100 text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'bg-green-100 text-green-600',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'bg-purple-100 text-purple-600',
        border: 'border-purple-200'
      },
      red: {
        bg: 'bg-red-50',
        icon: 'bg-red-100 text-red-600',
        border: 'border-red-200'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'bg-yellow-100 text-yellow-600',
        border: 'border-yellow-200'
      },
      indigo: {
        bg: 'bg-indigo-50',
        icon: 'bg-indigo-100 text-indigo-600',
        border: 'border-indigo-200'
      },
      gray: {
        bg: 'bg-gray-50',
        icon: 'bg-gray-100 text-gray-600',
        border: 'border-gray-200'
      }
    };

    return colorMap[colorName as keyof typeof colorMap] || colorMap.blue;
  };

  const getChangeClasses = (type?: 'increase' | 'decrease') => {
    if (type === 'increase') {
      return 'text-green-600';
    } else if (type === 'decrease') {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const detectChangeType = (changeStr: string): 'increase' | 'decrease' | undefined => {
    if (changeStr.startsWith('+')) return 'increase';
    if (changeStr.startsWith('-')) return 'decrease';
    return changeType;
  };

  const colors = getColorClasses(color, urgent);
  const detectedChangeType = change ? detectChangeType(change) : changeType;

  const content = (
    <div className={`relative bg-white overflow-hidden shadow rounded-lg border ${colors.border} ${className}`}>
      {/* Urgent indicator */}
      {urgent && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
      )}

      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {Icon && (
              <div className={`inline-flex items-center justify-center p-3 rounded-md ${colors.icon}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
            )}
          </div>
          
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
                {urgent && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Urgent
                  </span>
                )}
              </dt>
              
              <dd className="flex items-baseline">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-semibold text-gray-900">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    
                    {change && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeClasses(detectedChangeType)}`}>
                        {detectedChangeType === 'increase' && (
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                        )}
                        {detectedChangeType === 'decrease' && (
                          <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                        )}
                        <span className="sr-only">
                          {detectedChangeType === 'increase' ? 'Increased' : 'Decreased'} by
                        </span>
                        {change}
                      </div>
                    )}
                  </>
                )}
              </dd>

              {subtitle && (
                <dd className="mt-1 text-sm text-gray-500 truncate">
                  {subtitle}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Hover effect for clickable widgets */}
      {onClick && (
        <div className="absolute inset-0 bg-gray-100 opacity-0 hover:opacity-10 transition-opacity duration-200"></div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg transition-transform duration-200 hover:scale-105"
      >
        {content}
      </button>
    );
  }

  return content;
};

export default StatsWidget;