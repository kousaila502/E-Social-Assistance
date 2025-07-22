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
    ExclamationTriangleIcon
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
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'archived':
                return 'bg-yellow-100 text-yellow-800';
            case 'expired':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const isExpired = announcement.applicationDeadline 
        ? new Date(announcement.applicationDeadline) < new Date() 
        : false;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <MegaphoneIcon className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {announcement.title}
                                    </h2>
                                    <div className="flex items-center mt-2 space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(announcement.status)}`}>
                                            {announcementService.formatAnnouncementStatus(announcement.status)}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {announcementService.formatAnnouncementType(announcement.type)}
                                        </span>
                                        {isExpired && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <ClockIcon className="h-3 w-3 mr-1" />
                                                Expired
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {canManage && (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <PencilIcon className="h-4 w-4 mr-1" />
                                            Edit
                                        </button>
                                        
                                        {announcement.status === 'draft' && (
                                            <button
                                                onClick={handlePublish}
                                                disabled={actionLoading === 'publish'}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                            >
                                                {actionLoading === 'publish' ? (
                                                    <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                )}
                                                Publish
                                            </button>
                                        )}
                                        
                                        {announcement.status === 'published' && (
                                            <button
                                                onClick={handleArchive}
                                                disabled={actionLoading === 'archive'}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                                            >
                                                {actionLoading === 'archive' ? (
                                                    <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                                )}
                                                Archive
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={handleDelete}
                                            disabled={actionLoading === 'delete'}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                        >
                                            {actionLoading === 'delete' ? (
                                                <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <TrashIcon className="h-4 w-4 mr-1" />
                                            )}
                                            Delete
                                        </button>
                                    </>
                                )}
                                
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                                        Description
                                    </h3>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {announcement.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Requirements */}
                                {announcement.requirements && announcement.requirements.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                                            Requirements
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-2">
                                            {announcement.requirements.map((requirement, index) => (
                                                <li key={index} className="text-gray-700">
                                                    {requirement}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Benefits */}
                                {announcement.benefits && announcement.benefits.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                            <GiftIcon className="h-5 w-5 mr-2 text-green-600" />
                                            Benefits
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-2">
                                            {announcement.benefits.map((benefit, index) => (
                                                <li key={index} className="text-gray-700">
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Location */}
                                {announcement.location && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                            <MapPinIcon className="h-5 w-5 mr-2 text-gray-600" />
                                            Location
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            {announcement.location.isOnline ? (
                                                <div className="flex items-center">
                                                    <LinkIcon className="h-5 w-5 mr-2 text-blue-600" />
                                                    <span className="text-gray-700">Online Event</span>
                                                    {announcement.location.onlineLink && (
                                                        <a
                                                            href={announcement.location.onlineLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                                        >
                                                            Join Link
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {announcement.location.venue && (
                                                        <p className="text-gray-700 font-medium">
                                                            {announcement.location.venue}
                                                        </p>
                                                    )}
                                                    {announcement.location.address && (
                                                        <p className="text-gray-600">
                                                            {announcement.location.address}
                                                        </p>
                                                    )}
                                                    {announcement.location.city && (
                                                        <p className="text-gray-600">
                                                            {announcement.location.city}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Key Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Key Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <TagIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <span className="text-sm text-gray-600">Type:</span>
                                            <span className="ml-auto text-sm font-medium text-gray-900">
                                                {announcementService.formatAnnouncementType(announcement.type)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center">
                                            <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <span className="text-sm text-gray-600">Target:</span>
                                            <span className="ml-auto text-sm font-medium text-gray-900">
                                                {announcementService.formatTargetAudience(announcement.targetAudience)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center">
                                            <UsersIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <span className="text-sm text-gray-600">Participants:</span>
                                            <span className="ml-auto text-sm font-medium text-gray-900">
                                                {announcement.currentParticipants}
                                                {announcement.maxParticipants && ` / ${announcement.maxParticipants}`}
                                            </span>
                                        </div>

                                        {announcement.applicationDeadline && (
                                            <div className="flex items-center">
                                                <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                                                <span className="text-sm text-gray-600">Deadline:</span>
                                                <span className={`ml-auto text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {new Date(announcement.applicationDeadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center">
                                            <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                                            <span className="text-sm text-gray-600">Created:</span>
                                            <span className="ml-auto text-sm font-medium text-gray-900">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Creator Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Created By
                                    </h3>
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-medium">
                                                {announcement.createdBy.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {announcement.createdBy.name || 'Unknown User'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {announcement.createdBy.role || 'User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Participants */}
                                {announcement.participants && announcement.participants.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Recent Participants
                                        </h3>
                                        <div className="space-y-2">
                                            {announcement.participants.slice(0, 5).map((participant, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <span className="text-xs text-gray-600">
                                                                {participant.user.name?.charAt(0).toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <span className="ml-2 text-sm text-gray-700">
                                                            {participant.user.name || 'Anonymous'}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${announcementService.getApplicationStatusColor(participant.status)}`}>
                                                        {participant.status}
                                                    </span>
                                                </div>
                                            ))}
                                            {announcement.participants.length > 5 && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    +{announcement.participants.length - 5} more participants
                                                </p>
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