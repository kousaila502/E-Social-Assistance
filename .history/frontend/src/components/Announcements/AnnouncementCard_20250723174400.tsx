import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  UsersIcon, 
  ClockIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { Announcement } from '../../services/announcementService';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ 
  announcement, 
  onClick 
}) => {
  const navigate = useNavigate();

  // Determine card color based on announcement type
  const getColorConfig = (type: string) => {
    switch (type) {
      case 'scholarship':
        return {
          bgColor: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          hoverBorder: 'hover:border-blue-300',
          hoverBg: 'hover:bg-blue-100',
          textColor: 'text-blue-600',
          popularBg: 'bg-blue-600'
        };
      case 'job_opportunity':
        return {
          bgColor: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          hoverBorder: 'hover:border-green-300',
          hoverBg: 'hover:bg-green-100',
          textColor: 'text-green-600',
          popularBg: 'bg-green-600'
        };
      case 'training':
        return {
          bgColor: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          borderColor: 'border-purple-200',
          hoverBorder: 'hover:border-purple-300',
          hoverBg: 'hover:bg-purple-100',
          textColor: 'text-purple-600',
          popularBg: 'bg-purple-600'
        };
      case 'event':
        return {
          bgColor: 'bg-orange-50',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          hoverBorder: 'hover:border-orange-300',
          hoverBg: 'hover:bg-orange-100',
          textColor: 'text-orange-600',
          popularBg: 'bg-orange-600'
        };
      default:
        return {
          bgColor: 'bg-indigo-50',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          borderColor: 'border-indigo-200',
          hoverBorder: 'hover:border-indigo-300',
          hoverBg: 'hover:bg-indigo-100',
          textColor: 'text-indigo-600',
          popularBg: 'bg-indigo-600'
        };
    }
  };

  const config = getColorConfig(announcement.type);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to apply page with announcement context
      navigate('/apply', {
        state: {
          serviceCategory: announcement.type, // This will map to the appropriate category
          programType: 'Announcement' as const,
          programId: announcement._id,
          serviceName: announcement.title,
          maxAmount: announcement.budget || 10000, // Use announcement budget or default
          announcementData: {
            title: announcement.title,
            description: announcement.description,
            deadline: announcement.deadline,
            requirements: announcement.requirements,
            type: announcement.type,
            budget: announcement.budget
          }
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

  // Format deadline
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString();
  };

  // Check if it's a new announcement (within last 7 days)
  const isNew = () => {
    const createdDate = new Date(announcement.createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  return (
    <div
      className={`
        relative group
        ${config.bgColor} 
        ${config.borderColor} 
        ${config.hoverBorder} ${config.hoverBg} cursor-pointer
        border-2 rounded-2xl p-6 
        transition-all duration-300 transform 
        hover:scale-105 hover:shadow-lg
        focus:outline-none focus:ring-4 focus:ring-blue-200
      `}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`View announcement: ${announcement.title}`}
    >
      {/* New Badge */}
      {isNew() && (
        <div className={`absolute -top-2 -right-2 ${config.popularBg} text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg`}>
          New
        </div>
      )}

      {/* Icon Section */}
      <div className="flex items-center justify-between mb-4">
        <div className={`${config.iconBg} p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110`}>
          <CalendarIcon className={`h-8 w-8 ${config.iconColor}`} />
        </div>
        {announcement.applicationDeadline && (
          <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
            {formatDeadline(announcement.applicationDeadline)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
            {announcement.title}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full bg-white ${config.textColor} border ml-2 flex-shrink-0`}>
            {announcement.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        
        <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">
          {announcement.description}
        </p>

        {/* Participants Info */}
        <div className="flex items-center text-sm text-gray-500">
          <UsersIcon className="h-4 w-4 mr-1" />
          <span>
            {announcement.maxParticipants ?
              `${announcement.currentParticipants || 0}/${announcement.maxParticipants} participants` :
              `${announcement.currentParticipants || 0} participants`
            }
          </span>
        </div>

        {/* Benefits or Tags */}
        {announcement.benefits && announcement.benefits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Benefits:
            </p>
            <div className="flex flex-wrap gap-1">
              {announcement.benefits.slice(0, 3).map((benefit, index) => (
                <span
                  key={index}
                  className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border"
                >
                  {benefit}
                </span>
              ))}
              {announcement.benefits.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{announcement.benefits.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="mt-6 flex items-center justify-between">
        <span className={`inline-flex items-center text-sm font-semibold ${config.textColor} transition-transform duration-200 group-hover:translate-x-1`}>
          Learn More
          <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
        
        {announcement.applicationDeadline && (
          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>Apply by {new Date(announcement.applicationDeadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-transparent via-current to-transparent"></div>
      </div>
    </div>
  );
};

export default AnnouncementCard;