// src/pages/AnnouncementManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import CreateAnnouncementModal from '../components/Announcements/AnnouncementModal';
import AnnouncementDetailModal from '../components/Announcements/AnnouncementDetailModal';

import announcementService, {
    Announcement,
    AnnouncementStatsResponse,
    AnnouncementFilters
} from '../services/announcementService';
import {
    MegaphoneIcon,
    PlusIcon,
    ChartBarIcon,
    CogIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    FunnelIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    SpeakerWaveIcon,
    CalendarIcon,
    UserGroupIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'details' | 'stats';

interface AnnouncementStats {
    totalAnnouncements: number;
    publishedAnnouncements: number;
    draftAnnouncements: number;
    expiredAnnouncements: number;
    totalApplications: number;
    pendingApplications: number;
    announcementsByType: Record<string, number>;
}

const AnnouncementManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const { hasRole, user: currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // State management
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [stats, setStats] = useState<AnnouncementStats | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filters from URL params
    const [filters, setFilters] = useState<AnnouncementFilters>({
        status: (searchParams.get('status') as any) || '',
        type: (searchParams.get('type') as any) || '',
        targetAudience: (searchParams.get('targetAudience') as any) || '',
        search: searchParams.get('search') || '',
        page: 1,
        limit: 20
    });

    // Check permissions
    const isAdmin = hasRole('admin');
    const isCaseWorker = hasRole('case_worker');
    const canManageAnnouncements = isAdmin || isCaseWorker;

    useEffect(() => {
        if (!canManageAnnouncements) {
            navigate('/dashboard');
            toast.error('Access denied. You do not have permission to manage announcements.');
            return;
        }

        fetchStats();
        fetchAnnouncements();
        setLoading(false);
    }, [canManageAnnouncements, navigate]);

    // Sync filters with URL params
    useEffect(() => {
        const urlStatus = searchParams.get('status');
        const urlType = searchParams.get('type');
        const urlTargetAudience = searchParams.get('targetAudience');
        const urlSearch = searchParams.get('search');

        const newFilters = {
            ...filters,
            status: (urlStatus as any) || '',
            type: (urlType as any) || '',
            targetAudience: (urlTargetAudience as any) || '',
            search: urlSearch || ''
        };

        if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
            setFilters(newFilters);
            setRefreshTrigger(prev => prev + 1);
        }
    }, [searchParams]);

    // Update URL params when filters change
    useEffect(() => {
        const newParams = new URLSearchParams();
        if (filters.status) newParams.set('status', filters.status);
        if (filters.type) newParams.set('type', filters.type);
        if (filters.targetAudience) newParams.set('targetAudience', filters.targetAudience);
        if (filters.search) newParams.set('search', filters.search);

        const newUrl = newParams.toString() ? `?${newParams.toString()}` : '';
        if (newUrl !== window.location.search) {
            setSearchParams(newParams);
        }
    }, [filters.status, filters.type, filters.targetAudience, filters.search, setSearchParams]);

    const fetchStats = async () => {
        if (!canManageAnnouncements) return;

        try {
            setStatsLoading(true);
            const response = await announcementService.getStats();

            // Handle the actual backend response structure
            const backendStats = response.statistics || {};

            // Parse overall stats
            const overall = backendStats.overall || {};

            // Parse status stats
            const statusMap: Record<string, number> = {};
            if (backendStats.byStatus && Array.isArray(backendStats.byStatus)) {
                backendStats.byStatus.forEach((item: { _id: string; count: number }) => {
                    statusMap[item._id] = item.count;
                });
            }

            // Parse type stats
            const announcementsByType: Record<string, number> = {};
            if (backendStats.byType && Array.isArray(backendStats.byType)) {
                backendStats.byType.forEach((item: { _id: string; count: number }) => {
                    announcementsByType[item._id] = item.count;
                });
            }

            // Parse application stats
            const applicationMap: Record<string, number> = {};
            if (backendStats.applications && Array.isArray(backendStats.applications)) {
                backendStats.applications.forEach((item: { _id: string; count: number }) => {
                    applicationMap[item._id] = item.count;
                });
            }

            setStats({
                totalAnnouncements: overall.totalAnnouncements || 0,
                publishedAnnouncements: statusMap.published || 0,
                draftAnnouncements: statusMap.draft || 0,
                expiredAnnouncements: statusMap.expired || 0,
                totalApplications: overall.totalApplications || 0,
                pendingApplications: applicationMap.pending || 0,
                announcementsByType
            });
        } catch (error: any) {
            console.error('Error fetching announcement stats:', error);
            toast.error('Failed to load announcement statistics');

            // Set default stats on error
            setStats({
                totalAnnouncements: 0,
                publishedAnnouncements: 0,
                draftAnnouncements: 0,
                expiredAnnouncements: 0,
                totalApplications: 0,
                pendingApplications: 0,
                announcementsByType: {}
            });
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        if (!canManageAnnouncements) return;

        try {
            const response = await announcementService.getAll(filters);
            setAnnouncements(response.announcements);
        } catch (error: any) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to load announcements');
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [refreshTrigger, filters]);

    const handleCreateAnnouncement = () => {
        setShowCreateModal(true);
    };

    const handleEditAnnouncement = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setShowCreateModal(true);
        setShowDetailModal(false); // Close detail modal when editing
    };

    const handleViewDetails = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setShowDetailModal(true);
    };

    const handlePublishAnnouncement = async (id: string) => {
        try {
            await announcementService.publish(id);
            toast.success('Announcement published successfully');
            setRefreshTrigger(prev => prev + 1);
            fetchStats();
        } catch (error: any) {
            toast.error(error.message || 'Failed to publish announcement');
        }
    };

    const handleArchiveAnnouncement = async (id: string) => {
        try {
            await announcementService.archive(id);
            toast.success('Announcement archived successfully');
            setRefreshTrigger(prev => prev + 1);
            fetchStats();
        } catch (error: any) {
            toast.error(error.message || 'Failed to archive announcement');
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await announcementService.delete(id);
            toast.success('Announcement deleted successfully');
            setRefreshTrigger(prev => prev + 1);
            fetchStats();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete announcement');
        }
    };

    const handleModalSuccess = (announcement: Announcement) => {
        // Refresh the announcements list
        setRefreshTrigger(prev => prev + 1);

        // Close modal and reset editing state
        setShowCreateModal(false);
        setEditingAnnouncement(null);

        // Show success message is already handled by the modal
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setEditingAnnouncement(null);
    };

    const refreshData = () => {
        setRefreshTrigger(prev => prev + 1);
        fetchStats();
        toast.success('Data refreshed');
    };

    // Dropdown Menu Component
    const DropdownMenu: React.FC<{ announcement: Announcement }> = ({ announcement }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="More actions"
                >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isOpen && (
                    <>
                        {/* Backdrop to close dropdown */}
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsOpen(false)}
                        ></div>
                        
                        <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <div className="py-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(announcement);
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <EyeIcon className="h-4 w-4 mr-2" />
                                    View Details
                                </button>
                                
                                {canManageAnnouncements && announcement.status === 'published' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchiveAnnouncement(announcement._id);
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        <XCircleIcon className="h-4 w-4 mr-2" />
                                        Archive
                                    </button>
                                )}
                                
                                {canManageAnnouncements && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAnnouncement(announcement._id);
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const getTypeDisplayName = (type: string): string => {
        const typeNames = {
            event: 'Events',
            program: 'Programs',
            service: 'Services',
            opportunity: 'Opportunities',
            notice: 'Notices'
        };
        return typeNames[type as keyof typeof typeNames] || type;
    };

    if (!canManageAnnouncements) {
        return null; // Will redirect in useEffect
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading announcement management...</span>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <MegaphoneIcon className="h-8 w-8 mr-3 text-blue-600" />
                            Announcement Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage announcements, events, and opportunities for citizens
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={refreshData}
                            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={statsLoading}
                        >
                            <ArrowPathIcon className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        {canManageAnnouncements && (
                            <button
                                onClick={handleCreateAnnouncement}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create Announcement
                            </button>
                        )}
                    </div>
                </div>

                {/* Announcement Statistics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Total Announcements */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <MegaphoneIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Announcements</p>
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats?.totalAnnouncements?.toLocaleString() || '0'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-blue-600 font-medium">
                                All announcements
                            </span>
                        </div>
                    </div>

                    {/* Published Announcements */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Published</p>
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats?.publishedAnnouncements?.toLocaleString() || '0'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-green-600 font-medium">
                                {stats && stats.totalAnnouncements > 0
                                    ? Math.round((stats.publishedAnnouncements / stats.totalAnnouncements) * 100)
                                    : 0}% of total
                            </span>
                        </div>
                    </div>

                    {/* Draft Announcements */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Drafts</p>
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats?.draftAnnouncements?.toLocaleString() || '0'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setFilters({ ...filters, status: 'draft' });
                                    const newParams = new URLSearchParams();
                                    newParams.set('status', 'draft');
                                    setSearchParams(newParams);
                                    setRefreshTrigger(prev => prev + 1);
                                }}
                                className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                            >
                                Review drafts →
                            </button>
                        </div>
                    </div>

                    {/* Expired Announcements */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Expired</p>
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats?.expiredAnnouncements?.toLocaleString() || '0'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setFilters({ ...filters, status: 'expired' });
                                    const newParams = new URLSearchParams();
                                    newParams.set('status', 'expired');
                                    setSearchParams(newParams);
                                    setRefreshTrigger(prev => prev + 1);
                                }}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Review expired →
                            </button>
                        </div>
                    </div>

                    {/* Total Applications */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserGroupIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats?.totalApplications?.toLocaleString() || '0'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-purple-600 font-medium">
                                {stats?.pendingApplications || 0} pending
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Type Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Quick Filters</h3>
                        <button
                            onClick={() => setFilters({ status: '' as any, type: '' as any, targetAudience: '' as any, search: '', page: 1, limit: 20 })}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear all filters
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {Object.entries({
                            event: 'Events',
                            program: 'Programs', 
                            service: 'Services',
                            opportunity: 'Opportunities',
                            notice: 'Notices'
                        }).map(([type, label]) => (
                            <button
                                key={type}
                                onClick={() => setFilters({ ...filters, type: type as any })}
                                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    filters.type === type
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                            >
                                {label}
                                {stats && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                                        {stats.announcementsByType[type] || 0}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enhanced Filters Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FunnelIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Advanced Filters
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={filters.type || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">All Types</option>
                                <option value="event">Event</option>
                                <option value="program">Program</option>
                                <option value="service">Service</option>
                                <option value="opportunity">Opportunity</option>
                                <option value="notice">Notice</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                            <select
                                value={filters.targetAudience || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">All Audiences</option>
                                <option value="all">All Citizens</option>
                                <option value="students">Students</option>
                                <option value="families">Families</option>
                                <option value="elderly">Elderly</option>
                                <option value="disabled">Disabled</option>
                                <option value="unemployed">Unemployed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Search announcements..."
                                value={filters.search || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Announcements Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Announcements</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {announcements.length === 0 ? (
                        <div className="text-center py-12">
                            <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new announcement.</p>
                            {canManageAnnouncements && (
                                <div className="mt-6">
                                    <button
                                        onClick={handleCreateAnnouncement}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        Create Announcement
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Target Audience
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Applications
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {announcements.map((announcement) => (
                                        <tr key={announcement._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div 
                                                    className="flex items-center cursor-pointer"
                                                    onClick={() => handleViewDetails(announcement)}
                                                >
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <MegaphoneIcon className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                                            {announcement.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {announcement.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {announcementService.formatAnnouncementType(announcement.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${announcementService.getAnnouncementStatusColor(announcement.status)}`}>
                                                    {announcementService.formatAnnouncementStatus(announcement.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {announcementService.formatTargetAudience(announcement.targetAudience)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1" />
                                                    <span className="text-sm text-gray-900">
                                                        {announcement.currentParticipants}
                                                        {announcement.maxParticipants && ` / ${announcement.maxParticipants}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end items-center space-x-2">
                                                    {/* Primary Actions - More Prominent */}
                                                    {canManageAnnouncements && announcement.status === 'draft' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePublishAnnouncement(announcement._id);
                                                            }}
                                                            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                                            title="Publish announcement"
                                                        >
                                                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                            Publish
                                                        </button>
                                                    )}
                                                    
                                                    {canManageAnnouncements && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditAnnouncement(announcement);
                                                            }}
                                                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                            title="Edit announcement"
                                                        >
                                                            <PencilIcon className="h-3 w-3 mr-1" />
                                                            Edit
                                                        </button>
                                                    )}

                                                    {/* Secondary Actions - Dropdown Menu */}
                                                    <div className="relative group">
                                                        <button 
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="More actions"
                                                        >
                                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                            </svg>
                                                        </button>
                                                        
                                                        {/* Dropdown Menu */}
                                                        <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleViewDetails(announcement);
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <EyeIcon className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </button>
                                                                
                                                                {canManageAnnouncements && announcement.status === 'published' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleArchiveAnnouncement(announcement._id);
                                                                        }}
                                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                    >
                                                                        <XCircleIcon className="h-4 w-4 mr-2" />
                                                                        Archive
                                                                    </button>
                                                                )}
                                                                
                                                                {canManageAnnouncements && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteAnnouncement(announcement._id);
                                                                        }}
                                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4 mr-2" />
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* System Performance Overview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Announcement Performance Overview
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View detailed analytics →
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {stats && stats.totalAnnouncements > 0
                                    ? Math.round((stats.publishedAnnouncements / stats.totalAnnouncements) * 100)
                                    : 0}%
                            </div>
                            <div className="text-sm text-gray-600">Publication Rate</div>
                            <div className="text-xs text-green-600 mt-1">↑ 5% from last month</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {stats ? Math.round((stats.totalApplications / Math.max(stats.publishedAnnouncements, 1)) * 10) / 10 : '0'}
                            </div>
                            <div className="text-sm text-gray-600">Avg. Applications per Post</div>
                            <div className="text-xs text-green-600 mt-1">↑ 12% engagement boost</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">1.2 days</div>
                            <div className="text-sm text-gray-600">Avg. Response Time</div>
                            <div className="text-xs text-green-600 mt-1">↓ 0.3 days improvement</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {stats ? stats.draftAnnouncements : 0}
                            </div>
                            <div className="text-sm text-gray-600">Pending Review</div>
                            <div className="text-xs text-yellow-600 mt-1">Requires attention</div>
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-4">Announcement Management Guide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Announcement Types</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• <strong>Events:</strong> Community gatherings and activities</li>
                                <li>• <strong>Programs:</strong> Government assistance programs</li>
                                <li>• <strong>Services:</strong> Available public services</li>
                                <li>• <strong>Opportunities:</strong> Job openings and training</li>
                                <li>• <strong>Notices:</strong> Important announcements and alerts</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Best Practices</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Review and publish draft announcements regularly</li>
                                <li>• Set appropriate target audiences for better reach</li>
                                <li>• Monitor application numbers and engagement</li>
                                <li>• Archive expired announcements to keep listings current</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <CreateAnnouncementModal
                isOpen={showCreateModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                editingAnnouncement={editingAnnouncement}
            />

            <AnnouncementDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                announcement={selectedAnnouncement}
                onEdit={handleEditAnnouncement}
                onUpdate={() => {
                    setRefreshTrigger(prev => prev + 1);
                    fetchStats();
                }}
                canManage={canManageAnnouncements}
            />
        </MainLayout>
    );
};

export default AnnouncementManagementPage;