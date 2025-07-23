import { NavigateFunction } from 'react-router-dom';
import { Announcement } from '../services/announcementService';

export const navigateToAnnouncementApplication = (
  navigate: NavigateFunction, 
  announcement: Announcement
) => {
  // Map announcement type to application category
  const getServiceCategory = (type: string) => {
    switch (type) {
      case 'scholarship':
        return 'educational_support';
      case 'job_opportunity':
        return 'employment_support';
      case 'training':
        return 'educational_support';
      case 'housing_assistance':
        return 'housing_support';
      case 'medical_aid':
        return 'medical_assistance';
      case 'emergency_relief':
        return 'emergency_assistance';
      default:
        return 'other';
    }
  };

  navigate('/apply', {
    state: {
      serviceCategory: getServiceCategory(announcement.type),
      programType: 'Announcement' as const,
      programId: announcement._id,
      serviceName: announcement.title,
      maxAmount: announcement.budget || 10000,
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
};

export const navigateToServiceApplication = (
  navigate: NavigateFunction,
  serviceCategory: string,
  serviceName: string,
  maxAmount: number = 5000
) => {
  navigate('/apply', {
    state: {
      serviceCategory,
      programType: 'Content' as const,
      programId: `${serviceCategory}_content_program`,
      serviceName,
      maxAmount
    }
  });
};