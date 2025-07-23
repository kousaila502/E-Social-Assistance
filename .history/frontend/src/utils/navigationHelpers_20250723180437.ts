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

    // Map announcement type to default max amount
    const getDefaultAmount = (type: string) => {
        switch (type) {
            case 'scholarship':
                return 5000;
            case 'job_opportunity':
                return 3000;
            case 'training':
                return 2000;
            case 'housing_assistance':
                return 8000;
            case 'medical_aid':
                return 6000;
            case 'emergency_relief':
                return 10000;
            default:
                return 5000;
        }
    };

    navigate('/apply', {
        state: {
            serviceCategory: getServiceCategory(announcement.type),
            programType: 'Announcement' as const,
            programId: announcement._id,
            serviceName: announcement.title,
            maxAmount: getDefaultAmount(announcement.type),
            announcementData: {
                title: announcement.title,
                description: announcement.description,
                deadline: announcement.applicationDeadline,
                requirements: announcement.requirements,
                type: announcement.type
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