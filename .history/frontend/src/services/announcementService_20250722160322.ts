// src/services/announcementService.ts
import api, { API_CONFIG, User, PaginationInfo } from '../config/apiConfig';

// Announcement interfaces based on Swagger schema
export interface Announcement {
    _id: string;
    title: string;
    description: string;
    type: 'event' | 'program' | 'service' | 'opportunity' | 'notice';
    targetAudience: string | {
        userTypes?: string[];
        categories?: string[];
        eligibilityCategories?: string[];
        minAge?: number;
        maxAge?: number;
        locations?: Array<{
            wilaya?: string;
            city?: string;
        }>;
    };
    status: 'draft' | 'published' | 'archived' | 'expired';
    maxParticipants?: number;
    currentParticipants: number;
    applicationDeadline?: string;
    requirements?: string[];
    benefits?: string[];
    location?: {
        address?: string;
        city?: string;
        venue?: string;
        isOnline?: boolean;
        onlineLink?: string;
    };
    createdBy: User;
    participants?: Array<{
        user: User;
        appliedAt: string;
        status: 'pending' | 'accepted' | 'rejected' | 'waitlisted';
        reviewNotes?: string;
        reviewedAt?: string;
        reviewedBy?: User;
    }>;
    createdAt: string;
    updatedAt: string;
}

// Create announcement interface
export interface CreateAnnouncementData {
    title: string;
    description: string;
    type: 'event' | 'program' | 'service' | 'opportunity' | 'notice';
    targetAudience: 'all' | 'students' | 'families' | 'elderly' | 'disabled' | 'unemployed' | 'specific';
    maxParticipants?: number;
    applicationDeadline?: string;
    requirements?: string[];
    benefits?: string[];
    location?: {
        address?: string;
        city?: string;
        venue?: string;
        isOnline?: boolean;
        onlineLink?: string;
    };
}

// Update announcement interface
export interface UpdateAnnouncementData {
    title?: string;
    description?: string;
    status?: 'draft' | 'published' | 'archived' | 'expired';
    maxParticipants?: number;
    applicationDeadline?: string;
    requirements?: string[];
    benefits?: string[];
    location?: {
        address?: string;
        city?: string;
        venue?: string;
        isOnline?: boolean;
        onlineLink?: string;
    };
}

// Application data interface
export interface ApplicationData {
    additionalInfo?: string;
    attachments?: Array<{
        filename: string;
        originalName: string;
        documentType: string;
    }>;
}

// Review application interface
export interface ReviewApplicationData {
    decision: 'accepted' | 'rejected' | 'waitlisted';
    reviewNotes?: string;
}

// Response interfaces
export interface AnnouncementResponse {
    message: string;
    announcement: Announcement;
}

export interface AnnouncementsResponse {
    announcements: Announcement[];
    pagination: PaginationInfo;
}

export interface AnnouncementStatsResponse {
    statistics: {
        totalAnnouncements: number;
        publishedAnnouncements: number;
        draftAnnouncements: number;
        expiredAnnouncements: number;
        totalApplications: number;
        pendingApplications: number;
        acceptedApplications: number;
        rejectedApplications: number;
        announcementsByType: Array<{
            type: string;
            count: number;
        }>;
        announcementsByAudience: Array<{
            audience: string;
            count: number;
        }>;
        averageApplicationsPerAnnouncement: number;
        mostPopularAnnouncements: Array<{
            _id: string;
            title: string;
            applicationCount: number;
        }>;
    };
    recentActivity: Array<{
        type: 'created' | 'published' | 'applied' | 'reviewed';
        announcementTitle: string;
        userName?: string;
        action: string;
        timestamp: string;
    }>;
}

// Filter interface
export interface AnnouncementFilters {
    page?: number;
    limit?: number;
    status?: 'draft' | 'published' | 'archived' | 'expired';
    type?: 'event' | 'program' | 'service' | 'opportunity' | 'notice';
    targetAudience?: 'all' | 'students' | 'families' | 'elderly' | 'disabled' | 'unemployed' | 'specific';
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'title' | 'createdAt' | 'applicationDeadline' | 'currentParticipants';
    sortOrder?: 'asc' | 'desc';
}

const announcementService = {
    // Get all announcements with pagination and filters
    getAll: async (filters: AnnouncementFilters = {}): Promise<AnnouncementsResponse> => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.page) queryParams.append('page', filters.page.toString());
            if (filters.limit) queryParams.append('limit', filters.limit.toString());
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.targetAudience) queryParams.append('targetAudience', filters.targetAudience);
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
            if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
            if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

            const url = `${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.GET_ALL}?${queryParams.toString()}`;
            const response: AnnouncementsResponse = await api.get(url);
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Get announcement statistics
    getStats: async (): Promise<AnnouncementStatsResponse> => {
        try {
            const response: AnnouncementStatsResponse = await api.get(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.STATS);
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Get announcements by status
    getByStatus: async (status: string, params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<AnnouncementsResponse> => {
        try {
            const filters: AnnouncementFilters = { status: status as any, ...params };
            return await announcementService.getAll(filters);
        } catch (error: any) {
            throw error;
        }
    },

    // Get announcements by type
    getByType: async (type: string, params?: {
        page?: number;
        limit?: number;
    }): Promise<AnnouncementsResponse> => {
        try {
            const filters: AnnouncementFilters = { type: type as any, ...params };
            return await announcementService.getAll(filters);
        } catch (error: any) {
            throw error;
        }
    },

    // Create new announcement
    create: async (announcementData: CreateAnnouncementData): Promise<AnnouncementResponse> => {
        try {
            const response: AnnouncementResponse = await api.post(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.CREATE, announcementData);
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Get single announcement by ID
    getById: async (id: string): Promise<AnnouncementResponse> => {
        try {
            const response: AnnouncementResponse = await api.get(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.GET_BY_ID(id));
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Update announcement
    update: async (id: string, updateData: UpdateAnnouncementData): Promise<AnnouncementResponse> => {
        try {
            const response: AnnouncementResponse = await api.patch(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), updateData);
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Publish announcement
    publish: async (id: string): Promise<AnnouncementResponse> => {
        try {
            const response: AnnouncementResponse = await api.patch(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.PUBLISH(id));
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Apply to announcement
    apply: async (id: string, applicationData?: ApplicationData): Promise<{ message: string }> => {
        try {
            const response: { message: string } = await api.post(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.APPLY(id), applicationData);
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Review participant application
    reviewApplication: async (id: string, userId: string, reviewData: ReviewApplicationData): Promise<{ message: string }> => {
        try {
            const response: { message: string } = await api.patch(
                API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.REVIEW_PARTICIPANT(id, userId),
                reviewData
            );
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Archive announcement
    archive: async (id: string): Promise<AnnouncementResponse> => {
        try {
            const response: AnnouncementResponse = await api.patch(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), {
                status: 'archived'
            });
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Delete announcement (admin only)
    delete: async (id: string): Promise<{ message: string }> => {
        try {
            const response: { message: string } = await api.delete(API_CONFIG.ENDPOINTS.ANNOUNCEMENTS.UPDATE(id));
            return response;
        } catch (error: any) {
            throw error;
        }
    },

    // Helper functions for formatting and validation
    formatAnnouncementType: (type: string): string => {
        const typeLabels: Record<string, string> = {
            'event': 'Event',
            'program': 'Program',
            'service': 'Service',
            'opportunity': 'Opportunity',
            'notice': 'Notice'
        };
        return typeLabels[type] || type;
    },

    formatTargetAudience: (targetAudience: any): string => {
        // Handle string format (simple)
        if (typeof targetAudience === 'string') {
            const audienceMap: Record<string, string> = {
                'all': 'All Citizens',
                'students': 'Students',
                'families': 'Families',
                'elderly': 'Elderly',
                'disabled': 'Disabled',
                'unemployed': 'Unemployed',
                'specific': 'Specific Group'
            };
            return audienceMap[targetAudience] || targetAudience;
        }

        // Handle complex object format from server
        if (targetAudience && typeof targetAudience === 'object') {
            // Priority order: userTypes -> categories -> eligibilityCategories
            if (targetAudience.userTypes?.length > 0) {
                const userType = targetAudience.userTypes[0];
                return userType === 'all' ? 'All Users' : userType.replace('_', ' ').toUpperCase();
            }

            if (targetAudience.categories?.length > 0) {
                const category = targetAudience.categories[0];
                return category.replace('_', ' ').toUpperCase();
            }

            if (targetAudience.eligibilityCategories?.length > 0) {
                const eligibility = targetAudience.eligibilityCategories[0];
                return eligibility.replace('_', ' ').toUpperCase();
            }

            // If age range is specified
            if (targetAudience.minAge || targetAudience.maxAge) {
                const ageRange = [];
                if (targetAudience.minAge) ageRange.push(`${targetAudience.minAge}+`);
                if (targetAudience.maxAge) ageRange.push(`under ${targetAudience.maxAge}`);
                return `Ages ${ageRange.join(' to ')}`;
            }

            // If locations specified
            if (targetAudience.locations?.length > 0) {
                const location = targetAudience.locations[0];
                return location.city || location.wilaya || 'Specific Location';
            }
        }

        // Fallback
        return 'All Citizens';
    },

    formatAnnouncementStatus: (status: string): string => {
        const statusLabels: Record<string, string> = {
            'draft': 'Draft',
            'published': 'Published',
            'archived': 'Archived',
            'expired': 'Expired'
        };
        return statusLabels[status] || status;
    },

    isAnnouncementExpired: (announcement: Announcement): boolean => {
        if (!announcement.applicationDeadline) return false;
        return new Date(announcement.applicationDeadline) < new Date();
    },

    getAnnouncementStatusColor: (status: string): string => {
        const colors: Record<string, string> = {
            'draft': 'bg-gray-100 text-gray-800',
            'published': 'bg-green-100 text-green-800',
            'archived': 'bg-yellow-100 text-yellow-800',
            'expired': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    },

    getApplicationStatusColor: (status: string): string => {
        const colors: Record<string, string> = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'accepted': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'waitlisted': 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    },

    // Client-side helper to check if user can apply
    canUserApply: (announcement: Announcement, currentUserId?: string): {
        canApply: boolean;
        reason?: string;
    } => {
        // Check if announcement is published
        if (announcement.status !== 'published') {
            return {
                canApply: false,
                reason: 'Announcement is not published'
            };
        }

        // Check if deadline has passed
        if (announcement.applicationDeadline && new Date(announcement.applicationDeadline) < new Date()) {
            return {
                canApply: false,
                reason: 'Application deadline has passed'
            };
        }

        // Check if max participants reached
        if (announcement.maxParticipants && announcement.currentParticipants >= announcement.maxParticipants) {
            return {
                canApply: false,
                reason: 'Maximum participants reached'
            };
        }

        // Check if user already applied
        if (currentUserId && announcement.participants) {
            const hasApplied = announcement.participants.some(p => p.user._id === currentUserId);
            if (hasApplied) {
                return {
                    canApply: false,
                    reason: 'You have already applied to this announcement'
                };
            }
        }

        return {
            canApply: true
        };
    }
};

export default announcementService;