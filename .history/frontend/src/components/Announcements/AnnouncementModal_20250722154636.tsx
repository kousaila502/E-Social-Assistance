// src/components/Announcements/CreateAnnouncementModal.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import announcementService, {
    Announcement,
    CreateAnnouncementData,
    UpdateAnnouncementData
} from '../../services/announcementService';
import {
    XMarkIcon,
    MegaphoneIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    UsersIcon,
    MapPinIcon,
    LinkIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface CreateAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (announcement: Announcement) => void;
    editingAnnouncement?: Announcement | null;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingAnnouncement
}) => {
    const [formData, setFormData] = useState<CreateAnnouncementData>({
        title: '',
        description: '',
        type: 'event',
        targetAudience: 'all',
        maxParticipants: undefined,
        applicationDeadline: '',
        requirements: [],
        benefits: [],
        location: {
            address: '',
            city: '',
            venue: '',
            isOnline: false,
            onlineLink: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newRequirement, setNewRequirement] = useState('');
    const [newBenefit, setNewBenefit] = useState('');

    const isEditing = !!editingAnnouncement;

    // Initialize form with editing data
    useEffect(() => {
        if (editingAnnouncement) {
            setFormData({
                title: editingAnnouncement.title,
                description: editingAnnouncement.description,
                type: editingAnnouncement.type,
                targetAudience: editingAnnouncement.targetAudience,
                maxParticipants: editingAnnouncement.maxParticipants,
                applicationDeadline: editingAnnouncement.applicationDeadline
                    ? new Date(editingAnnouncement.applicationDeadline).toISOString().slice(0, 16)
                    : '',
                requirements: editingAnnouncement.requirements || [],
                benefits: editingAnnouncement.benefits || [],
                location: editingAnnouncement.location || {
                    address: '',
                    city: '',
                    venue: '',
                    isOnline: false,
                    onlineLink: ''
                }
            });
        }
    }, [editingAnnouncement]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                title: '',
                description: '',
                type: 'event',
                targetAudience: 'all',
                maxParticipants: undefined,
                applicationDeadline: '',
                requirements: [],
                benefits: [],
                location: {
                    address: '',
                    city: '',
                    venue: '',
                    isOnline: false,
                    onlineLink: ''
                }
            });
            setErrors({});
            setNewRequirement('');
            setNewBenefit('');
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        if (!formData.description?.trim()) newErrors.description = 'Description is required';
        if (!formData.type) newErrors.type = 'Type is required';
        if (!formData.targetAudience) newErrors.targetAudience = 'Target audience is required';

        // Title length validation
        if (formData.title && formData.title.length < 5) {
            newErrors.title = 'Title must be at least 5 characters long';
        }
        if (formData.title && formData.title.length > 200) {
            newErrors.title = 'Title must be less than 200 characters';
        }

        // Description length validation
        if (formData.description && formData.description.length < 20) {
            newErrors.description = 'Description must be at least 20 characters long';
        }
        if (formData.description && formData.description.length > 2000) {
            newErrors.description = 'Description must be less than 2000 characters';
        }

        // Max participants validation
        if (formData.maxParticipants && formData.maxParticipants < 1) {
            newErrors.maxParticipants = 'Max participants must be at least 1';
        }

        // Deadline validation
        if (formData.applicationDeadline) {
            const deadline = new Date(formData.applicationDeadline);
            const now = new Date();
            if (deadline <= now) {
                newErrors.applicationDeadline = 'Application deadline must be in the future';
            }
        }

        // Location validation
        if (formData.location?.isOnline && !formData.location?.onlineLink?.trim()) {
            newErrors.onlineLink = 'Online link is required for online events';
        }

        if (formData.location?.onlineLink && !isValidUrl(formData.location.onlineLink)) {
            newErrors.onlineLink = 'Please enter a valid URL';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            // Prepare form data
            const submitData: CreateAnnouncementData | UpdateAnnouncementData = {
                ...formData,
                applicationDeadline: formData.applicationDeadline
                    ? new Date(formData.applicationDeadline).toISOString()
                    : undefined,
                maxParticipants: formData.maxParticipants || undefined
            };

            let result;
            if (isEditing) {
                result = await announcementService.update(editingAnnouncement!._id, submitData);
            } else {
                result = await announcementService.create(submitData as CreateAnnouncementData);
            }

            toast.success(
                isEditing
                    ? 'Announcement updated successfully'
                    : 'Announcement created successfully'
            );

            onSuccess?.(result.announcement);
            onClose();
        } catch (error: any) {
            console.error('Error saving announcement:', error);
            toast.error(error.message || 'Failed to save announcement');
        } finally {
            setLoading(false);
        }
    };

    const addRequirement = () => {
        if (newRequirement.trim() && !formData.requirements?.includes(newRequirement.trim())) {
            setFormData(prev => ({
                ...prev,
                requirements: [...(prev.requirements || []), newRequirement.trim()]
            }));
            setNewRequirement('');
        }
    };

    const removeRequirement = (index: number) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements?.filter((_, i) => i !== index) || []
        }));
    };

    const addBenefit = () => {
        if (newBenefit.trim() && !formData.benefits?.includes(newBenefit.trim())) {
            setFormData(prev => ({
                ...prev,
                benefits: [...(prev.benefits || []), newBenefit.trim()]
            }));
            setNewBenefit('');
        }
    };

    const removeBenefit = (index: number) => {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits?.filter((_, i) => i !== index) || []
        }));
    };

    const InputField: React.FC<{
        label: string;
        name: string;
        type?: string;
        value: string | number;
        onChange: (value: string | number) => void;
        placeholder?: string;
        required?: boolean;
        rows?: number;
        maxLength?: number;
        min?: number;
    }> = ({
        label,
        name,
        type = 'text',
        value,
        onChange,
        placeholder,
        required,
        rows,
        maxLength,
        min
    }) => (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {rows ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        maxLength={maxLength}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors[name] ? 'border-red-300' : 'border-gray-300'
                            }`}
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                        placeholder={placeholder}
                        min={min}
                        maxLength={maxLength}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors[name] ? 'border-red-300' : 'border-gray-300'
                            }`}
                    />
                )}
                {errors[name] && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {errors[name]}
                    </div>
                )}
                {maxLength && typeof value === 'string' && (
                    <div className="mt-1 text-xs text-gray-500 text-right">
                        {value.length}/{maxLength}
                    </div>
                )}
            </div>
        );

    const SelectField: React.FC<{
        label: string;
        name: string;
        value: string;
        onChange: (value: string) => void;
        options: { value: string; label: string }[];
        required?: boolean;
    }> = ({ label, name, value, onChange, options, required }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors[name] ? 'border-red-300' : 'border-gray-300'
                    }`}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {errors[name] && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors[name]}
                </div>
            )}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <MegaphoneIcon className="h-6 w-6 text-blue-600 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 gap-6">
                                <InputField
                                    label="Title"
                                    name="title"
                                    value={formData.title}
                                    onChange={(value) => setFormData(prev => ({ ...prev, title: value as string }))}
                                    placeholder="Enter announcement title"
                                    required
                                    maxLength={200}
                                />

                                <InputField
                                    label="Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={(value) => setFormData(prev => ({ ...prev, description: value as string }))}
                                    placeholder="Describe the announcement, event, or opportunity"
                                    required
                                    rows={4}
                                    maxLength={2000}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <SelectField
                                        label="Type"
                                        name="type"
                                        value={formData.type}
                                        onChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                                        options={[
                                            { value: 'event', label: 'Event' },
                                            { value: 'program', label: 'Program' },
                                            { value: 'service', label: 'Service' },
                                            { value: 'opportunity', label: 'Opportunity' },
                                            { value: 'notice', label: 'Notice' }
                                        ]}
                                        required
                                    />

                                    <SelectField
                                        label="Target Audience"
                                        name="targetAudience"
                                        value={formData.targetAudience}
                                        onChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value as any }))}
                                        options={[
                                            { value: 'all', label: 'All Citizens' },
                                            { value: 'students', label: 'Students' },
                                            { value: 'families', label: 'Families' },
                                            { value: 'elderly', label: 'Elderly' },
                                            { value: 'disabled', label: 'Disabled' },
                                            { value: 'unemployed', label: 'Unemployed' },
                                            { value: 'specific', label: 'Specific Group' }
                                        ]}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField
                                        label="Maximum Participants"
                                        name="maxParticipants"
                                        type="number"
                                        value={formData.maxParticipants || 0}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            maxParticipants: value ? Number(value) : undefined
                                        }))}
                                        placeholder="Leave empty for unlimited"
                                        min={1}
                                    />

                                    <InputField
                                        label="Application Deadline"
                                        name="applicationDeadline"
                                        type="datetime-local"
                                        value={formData.applicationDeadline}
                                        onChange={(value) => setFormData(prev => ({ ...prev, applicationDeadline: value as string }))}
                                    />
                                </div>
                            </div>

                            {/* Requirements Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Requirements
                                </label>
                                <div className="space-y-2">
                                    {formData.requirements?.map((requirement, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <span className="flex-1 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                                                {requirement}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeRequirement(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={newRequirement}
                                            onChange={(e) => setNewRequirement(e.target.value)}
                                            placeholder="Add a requirement"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addRequirement}
                                            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Benefits
                                </label>
                                <div className="space-y-2">
                                    {formData.benefits?.map((benefit, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <span className="flex-1 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                                                {benefit}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeBenefit(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={newBenefit}
                                            onChange={(e) => setNewBenefit(e.target.value)}
                                            placeholder="Add a benefit"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addBenefit}
                                            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Location Information
                                </label>

                                <div className="mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.location?.isOnline || false}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, isOnline: e.target.checked }
                                            }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700">This is an online event</span>
                                    </label>
                                </div>

                                {formData.location?.isOnline ? (
                                    <InputField
                                        label="Online Link"
                                        name="onlineLink"
                                        value={formData.location?.onlineLink || ''}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            location: { ...prev.location, onlineLink: value as string }
                                        }))}
                                        placeholder="https://example.com/meeting"
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField
                                            label="Venue"
                                            name="venue"
                                            value={formData.location?.venue || ''}
                                            onChange={(value) => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, venue: value as string }
                                            }))}
                                            placeholder="Event venue or building name"
                                        />

                                        <InputField
                                            label="City"
                                            name="city"
                                            value={formData.location?.city || ''}
                                            onChange={(value) => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, city: value as string }
                                            }))}
                                            placeholder="City name"
                                        />

                                        <div className="sm:col-span-2">
                                            <InputField
                                                label="Address"
                                                name="address"
                                                value={formData.location?.address || ''}
                                                onChange={(value) => setFormData(prev => ({
                                                    ...prev,
                                                    location: { ...prev.location, address: value as string }
                                                }))}
                                                placeholder="Full address"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving...' : isEditing ? 'Update Announcement' : 'Create Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementModal;