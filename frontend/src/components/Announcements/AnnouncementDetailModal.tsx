import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import announcementService, { Announcement } from '../../services/announcementService';
import {
    XMarkIcon,
    MegaphoneIcon,
    CalendarIcon,
    UsersIcon,
    MapPinIcon,
    LinkIcon,
    CheckCircleIcon,
    XCircleIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ClockIcon,
    TagIcon,
    UserGroupIcon,
    DocumentTextIcon,
    GiftIcon,
    ExclamationTriangleIcon,
    SparklesIcon,
    BuildingOfficeIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';

interface AnnouncementDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    announcement: Announcement | null;
    onEdit?: (announcement: Announcement) => void;
    onUpdate?: () => void;
    canManage?: boolean;
}

const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
    isOpen,
    onClose,
    announcement,
    onEdit,
    onUpdate,
    canManage = false
}) => {
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    if (!isOpen || !announcement) return null;

    const handlePublish = async () => {
        if (!canManage) return;
        
        setActionLoading('publish');
        try {
            await announcementService.publish(announcement._id);
            toast.success('Announcement published successfully');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to publish announcement');
        } finally {
            setActionLoading(null);
        }
    };

    const handleArchive = async () => {
        if (!canManage) return;
        
        setActionLoading('archive');
        try {
            await announcementService.archive(announcement._id);
            toast.success('Announcement archived successfully');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to archive announcement');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!canManage) return;
        
        if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            return;
        }

        setActionLoading('delete');
        try {
            await announcementService.delete(announcement._id);
            toast.success('Announcement deleted successfully');
            onUpdate?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete announcement');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = () => {
        onEdit?.(announcement);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'archived':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'expired':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'event':
                return CalendarIcon;
            case 'program':
                return SparklesIcon;
            case 'service':
                return BuildingOfficeIcon;
            case 'opportunity':
                return UserGroupIcon;
            case 'notice':
                return DocumentTextIcon;
            default:
                return MegaphoneIcon;
        }
    };

    const isExpired = announcement.applicationDeadline 
        ? new Date(announcement.applicationDeadline) < new Date() 
        : false;

    const TypeIcon = getTypeIcon(announcement.type);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 pt-6 pb-4 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <TypeIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {announcement.title}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(announcement.status)}`}>
                                            <div className={`w-2 h-2 rounded-full mr-1.5 ${
                                                announcement.status === 'published' ? 'bg-green-400' :
                                                announcement.status === 'draft' ? 'bg-gray-400' :
                                                announcement.status === 'archived' ? 'bg-yellow-400' :
                                                'bg-red-400'
                                            }`}></div>
                                            {announcementService.formatAnnouncementStatus(announcement.status)}
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                            <TypeIcon className="h-3 w-3 mr-1" />
                                            {announcementService.formatAnnouncementType(announcement.type)}
                                        </span>
                                        {isExpired && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                <ClockIcon className="h-3 w-3 mr-1" />
                                                Expired
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        Created on {new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                                {canManage && (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                        >
                                            <PencilIcon className="h-4 w-4 mr-1.5" />
                                            Edit
                                        </button>
                                        
                                        {announcement.status === 'draft' && (
                                            <button
                                                onClick={handlePublish}
                                                disabled={actionLoading === 'publish'}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {actionLoading === 'publish' ? (
                                                    <ClockIcon className="h-4 w-4 mr-1.5 animate-spin" />
                                                ) : (
                                                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                                )}
                                                Publish
                                            </button>
                                        )}
                                        
                                        {announcement.status === 'published' && (
                                            <button
                                                onClick={handleArchive}
                                                disabled={actionLoading === 'archive'}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {actionLoading === 'archive' ? (
                                                    <ClockIcon className="h-4 w-4 mr-1.5 animate-spin" />
                                                ) : (
                                                    <XCircleIcon className="h-4 w-4 mr-1.5" />
                                                )}
                                                Archive
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={handleDelete}
                                            disabled={actionLoading === 'delete'}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {actionLoading === 'delete' ? (
                                                <ClockIcon className="h-4 w-4 mr-1.5 animate-spin" />
                                            ) : (
                                                <TrashIcon className="h-4 w-4 mr-1.5" />
                                            )}
                                            Delete
                                        </button>
                                    </>
                                )}
                                
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Description */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                                        Description
                                    </h3>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {announcement.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Requirements */}
                                {announcement.requirements && announcement.requirements.length > 0 && (
                                    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                                            Requirements
                                        </h3>
                                        <ul className="space-y-3">
                                            {announcement.requirements.map((requirement, index) => (
                                                <li key={index} className="flex items-start">
                                                    <div className="flex-shrink-0 h-2 w-2 bg-yellow-400 rounded-full mt-2 mr-3"></div>
                                                    <span className="text-gray-700 leading-relaxed">
                                                        {requirement}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Benefits */}
                                {announcement.benefits && announcement.benefits.length > 0 && (
                                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <GiftIcon className="h-5 w-5 mr-2 text-green-600" />
                                            Benefits
                                        </h3>
                                        <ul className="space-y-3">
                                            {announcement.benefits.map((benefit, index) => (
                                                <li key={index} className="flex items-start">
                                                    <div className="flex-shrink-0 h-2 w-2 bg-green-400 rounded-full mt-2 mr-3"></div>
                                                    <span className="text-gray-700 leading-relaxed">
                                                        {benefit}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Location */}
                                {announcement.location && (
                                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                                            Location Details
                                        </h3>
                                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                                            {announcement.location.isOnline ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                            <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">Online Event</p>
                                                            <p className="text-sm text-gray-600">Virtual participation</p>
                                                        </div>
                                                    </div>
                                                    {announcement.location.onlineLink && (
                                                        <a
                                                            href={announcement.location.onlineLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            <LinkIcon className="h-4 w-4 mr-1.5" />
                                                            Join Event
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-start">
                                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                                                        <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        {announcement.location.venue && (
                                                            <p className="font-medium text-gray-900 mb-1">
                                                                {announcement.location.venue}
                                                            </p>
                                                        )}
                                                        {announcement.location.address && (
                                                            <p className="text-gray-600 mb-1">
                                                                {announcement.location.address}
                                                            </p>
                                                        )}
                                                        {announcement.location.city && (
                                                            <p className="text-gray-600">
                                                                {announcement.location.city}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Key Information */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <TagIcon className="h-5 w-5 mr-2 text-gray-600" />
                                        Key Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-600">Type</span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {announcementService.formatAnnouncementType(announcement.type)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <UserGroupIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-600">Target Audience</span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {announcementService.formatTargetAudience(announcement.targetAudience)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center">
                                                <UsersIcon className="h-4 w-4 mr-2 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-700">Participants</span>
                                            </div>
                                            <span className="text-sm font-bold text-blue-900">
                                                {announcement.currentParticipants}
                                                {announcement.maxParticipants && ` / ${announcement.maxParticipants}`}
                                            </span>
                                        </div>

                                        {announcement.applicationDeadline && (
                                            <div className={`flex items-center justify-between p-3 rounded-lg ${
                                                isExpired ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                                            }`}>
                                                <div className="flex items-center">
                                                    <CalendarIcon className={`h-4 w-4 mr-2 ${isExpired ? 'text-red-600' : 'text-gray-500'}`} />
                                                    <span className={`text-sm font-medium ${isExpired ? 'text-red-700' : 'text-gray-600'}`}>
                                                        Application Deadline
                                                    </span>
                                                </div>
                                                <span className={`text-sm font-semibold ${isExpired ? 'text-red-900' : 'text-gray-900'}`}>
                                                    {new Date(announcement.applicationDeadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-600">Created</span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Creator Information */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Created By
                                    </h3>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                            <span className="text-white font-semibold text-lg">
                                                {announcement.createdBy.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {announcement.createdBy.name || 'Unknown User'}
                                            </p>
                                            <p className="text-xs text-gray-600 capitalize">
                                                {announcement.createdBy.role?.replace('_', ' ') || 'User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Participants */}
                                {announcement.participants && announcement.participants.length > 0 && (
                                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                                            <span>Recent Participants</span>
                                            <span className="text-sm font-normal text-gray-500">
                                                {announcement.participants.length} total
                                            </span>
                                        </h3>
                                        <div className="space-y-3">
                                            {announcement.participants.slice(0, 5).map((participant, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                                                            <span className="text-white font-medium text-sm">
                                                                {participant.user.name?.charAt(0).toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <span className="ml-3 text-sm font-medium text-gray-900">
                                                            {participant.user.name || 'Anonymous'}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${announcementService.getApplicationStatusColor(participant.status)}`}>
                                                        {participant.status}
                                                    </span>
                                                </div>
                                            ))}
                                            {announcement.participants.length > 5 && (
                                                <div className="text-center pt-2">
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                        +{announcement.participants.length - 5} more participants
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementDetailModal;