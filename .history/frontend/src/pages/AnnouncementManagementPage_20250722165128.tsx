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
    SpeakerWaveIcon
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

    const StatCard: React.FC<{
        title: string;
        value: number;
        icon: React.ComponentType<any>;
        color: string;
        trend?: string;
    }> = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd className="text-lg font-medium text-gray-900">{value.toLocaleString()}</dd>
                        </dl>
                    </div>
                </div>
                {trend && (
                    <div className="mt-3">
                        <div className="text-sm text-gray-600">{trend}</div>
                    </div>
                )}
            </div>
        </div>
    );

    const QuickActionButton: React.FC<{
        onClick: () => void;
        icon: React.ComponentType<any>;
        label: string;
        color?: string;
    }> = ({ onClick, icon: Icon, label, color = "bg-blue-600 hover:bg-blue-700" }) => (
        <button
            onClick={onClick}
            className={`${color} text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors`}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </button>
    );

    const FilterSelect: React.FC<{
        value: string;
        onChange: (value: string) => void;
        options: { value: string; label: string }[];
        placeholder: string;
    }> = ({ value, onChange, options, placeholder }) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );

    if (loading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-64">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Announcement Management
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage announcements, events, and opportunities for citizens
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                        <QuickActionButton
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            icon={ArrowPathIcon}
                            label="Refresh"
                            color="bg-gray-600 hover:bg-gray-700"
                        />
                        {canManageAnnouncements && (
                            <QuickActionButton
                                onClick={handleCreateAnnouncement}
                                icon={PlusIcon}
                                label="Create Announcement"
                            />
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {statsLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                                <div className="p-5 h-24"></div>
                            </div>
                        ))
                    ) : stats ? (
                        <>
                            <StatCard
                                title="Total Announcements"
                                value={stats.totalAnnouncements}
                                icon={MegaphoneIcon}
                                color="text-blue-600"
                            />
                            <StatCard
                                title="Published"
                                value={stats.publishedAnnouncements}
                                icon={CheckCircleIcon}
                                color="text-green-600"
                            />
                            <StatCard
                                title="Drafts"
                                value={stats.draftAnnouncements}
                                icon={ExclamationTriangleIcon}
                                color="text-yellow-600"
                            />
                            <StatCard
                                title="Total Applications"
                                value={stats.totalApplications}
                                icon={SpeakerWaveIcon}
                                color="text-purple-600"
                            />
                        </>
                    ) : null}
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <FilterSelect
                            value={filters.status || ''}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                            options={[
                                { value: 'draft', label: 'Draft' },
                                { value: 'published', label: 'Published' },
                                { value: 'archived', label: 'Archived' },
                                { value: 'expired', label: 'Expired' }
                            ]}
                            placeholder="All Statuses"
                        />
                        <FilterSelect
                            value={filters.type || ''}
                            onChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
                            options={[
                                { value: 'event', label: 'Event' },
                                { value: 'program', label: 'Program' },
                                { value: 'service', label: 'Service' },
                                { value: 'opportunity', label: 'Opportunity' },
                                { value: 'notice', label: 'Notice' }
                            ]}
                            placeholder="All Types"
                        />
                        <FilterSelect
                            value={filters.targetAudience || ''}
                            onChange={(value) => setFilters(prev => ({ ...prev, targetAudience: value as any }))}
                            options={[
                                { value: 'all', label: 'All Citizens' },
                                { value: 'students', label: 'Students' },
                                { value: 'families', label: 'Families' },
                                { value: 'elderly', label: 'Elderly' },
                                { value: 'disabled', label: 'Disabled' },
                                { value: 'unemployed', label: 'Unemployed' }
                            ]}
                            placeholder="All Audiences"
                        />
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search announcements..."
                                value={filters.search || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Announcements Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Announcements</h3>

                        {announcements.length === 0 ? (
                            <div className="text-center py-12">
                                <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new announcement.</p>
                                {canManageAnnouncements && (
                                    <div className="mt-6">
                                        <QuickActionButton
                                            onClick={handleCreateAnnouncement}
                                            icon={PlusIcon}
                                            label="Create Announcement"
                                        />
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
                                            <tr key={announcement._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {announcement.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {announcement.description}
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {announcement.currentParticipants}
                                                    {announcement.maxParticipants && ` / ${announcement.maxParticipants}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(announcement.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(announcement)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="View details"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </button>
                                                        {canManageAnnouncements && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditAnnouncement(announcement)}
                                                                    className="text-yellow-600 hover:text-yellow-900"
                                                                    title="Edit"
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </button>
                                                                {announcement.status === 'draft' && (
                                                                    <button
                                                                        onClick={() => handlePublishAnnouncement(announcement._id)}
                                                                        className="text-green-600 hover:text-green-900"
                                                                        title="Publish"
                                                                    >
                                                                        <CheckCircleIcon className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                {announcement.status === 'published' && (
                                                                    <button
                                                                        onClick={() => handleArchiveAnnouncement(announcement._id)}
                                                                        className="text-orange-600 hover:text-orange-900"
                                                                        title="Archive"
                                                                    >
                                                                        <XCircleIcon className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteAnnouncement(announcement._id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title="Delete"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreateAnnouncementModal
                isOpen={showCreateModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                editingAnnouncement={editingAnnouncement}
            />
        </MainLayout>
    );
};

export default AnnouncementManagementPage;