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
    TrashIcon,
    DocumentTextIcon,
    TagIcon,
    UserGroupIcon,
    SparklesIcon,
    BuildingOfficeIcon,
    GlobeAltIcon,
    ClockIcon,
    GiftIcon
} from '@heroicons/react/24/outline';

interface CreateAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (announcement: Announcement) => void;
    editingAnnouncement?: Announcement | null;
}

// Enhanced InputField component
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
    errors: Record<string, string>;
    icon?: React.ComponentType<any>;
    description?: string;
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
    min,
    errors,
    icon: Icon,
    description
}) => (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
                <div className="flex items-center space-x-2">
                    {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                    <span>{label}</span>
                    {required && <span className="text-red-500">*</span>}
                </div>
            </label>
            {description && (
                <p className="text-xs text-gray-600">{description}</p>
            )}
            {rows ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    maxLength={maxLength}
                    className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm ${errors[name]
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
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
                    className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm ${errors[name]
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                        }`}
                />
            )}
            {errors[name] && (
                <div className="flex items-center space-x-1 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{errors[name]}</span>
                </div>
            )}
            {maxLength && typeof value === 'string' && (
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Character count</span>
                    <span className={`font-medium ${value.length > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                        {value.length}/{maxLength}
                    </span>
                </div>
            )}
        </div>
    );

// Enhanced SelectField component
const SelectField: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
    errors: Record<string, string>;
    icon?: React.ComponentType<any>;
    description?: string;
}> = ({ label, name, value, onChange, options, required, errors, icon: Icon, description }) => (
    <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
            <div className="flex items-center space-x-2">
                {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                <span>{label}</span>
                {required && <span className="text-red-500">*</span>}
            </div>
        </label>
        {description && (
            <p className="text-xs text-gray-600">{description}</p>
        )}
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm ${errors[name]
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                }`}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        {errors[name] && (
            <div className="flex items-center space-x-1 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                <span>{errors[name]}</span>
            </div>
        )}
    </div>
);

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
    const [currentStep, setCurrentStep] = useState(1);

    const isEditing = !!editingAnnouncement;

    // Initialize form with editing data
    useEffect(() => {
        if (editingAnnouncement) {
            // Handle targetAudience conversion from complex object to simple string
            let targetAudienceValue: 'all' | 'students' | 'families' | 'elderly' | 'disabled' | 'unemployed' | 'specific' = 'all';

            if (typeof editingAnnouncement.targetAudience === 'string') {
                const validTargetAudiences = ['all', 'students', 'families', 'elderly', 'disabled', 'unemployed', 'specific'] as const;
                if (validTargetAudiences.includes(editingAnnouncement.targetAudience as any)) {
                    targetAudienceValue = editingAnnouncement.targetAudience as typeof targetAudienceValue;
                }
            } else if (editingAnnouncement.targetAudience && typeof editingAnnouncement.targetAudience === 'object') {
                const targetObj = editingAnnouncement.targetAudience;

                if (targetObj.userTypes && targetObj.userTypes.length > 0) {
                    const userType = targetObj.userTypes[0];
                    if (userType === 'all') targetAudienceValue = 'all';
                    else targetAudienceValue = 'specific';
                } else if (targetObj.eligibilityCategories && targetObj.eligibilityCategories.length > 0) {
                    const eligibility = targetObj.eligibilityCategories[0];
                    const eligibilityMap: Record<string, 'all' | 'students' | 'families' | 'elderly' | 'disabled' | 'unemployed' | 'specific'> = {
                        'low_income': 'families',
                        'large_family': 'families',
                        'disabled': 'disabled',
                        'elderly': 'elderly',
                        'unemployed': 'unemployed',
                        'student': 'students'
                    };
                    targetAudienceValue = eligibilityMap[eligibility] || 'specific';
                } else if (targetObj.categories && targetObj.categories.length > 0) {
                    targetAudienceValue = 'specific';
                }
            }

            setFormData({
                title: editingAnnouncement.title,
                description: editingAnnouncement.description,
                type: editingAnnouncement.type,
                targetAudience: targetAudienceValue,
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
            setCurrentStep(1);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 pt-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <MegaphoneIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
                                    </h3>
                                    <p className="text-gray-600 mt-1">
                                        {isEditing ? 'Update announcement details' : 'Fill in the details to create a new announcement'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Basic Information Section */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                            </div>

                            <InputField
                                label="Title"
                                name="title"
                                value={formData.title}
                                onChange={(value) => setFormData(prev => ({ ...prev, title: value as string }))}
                                placeholder="Enter announcement title"
                                required
                                maxLength={200}
                                errors={errors}
                                icon={TagIcon}
                                description="A clear, descriptive title for your announcement"
                            />

                            <InputField
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={(value) => setFormData(prev => ({ ...prev, description: value as string }))}
                                placeholder="Describe the announcement, event, or opportunity in detail"
                                required
                                rows={4}
                                maxLength={2000}
                                errors={errors}
                                icon={DocumentTextIcon}
                                description="Provide a comprehensive description of what this announcement is about"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                    errors={errors}
                                    icon={SparklesIcon}
                                    description="Select the type of announcement"
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
                                    errors={errors}
                                    icon={UserGroupIcon}
                                    description="Who is this announcement for?"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <InputField
                                    label="Maximum Participants"
                                    name="maxParticipants"
                                    type="number"
                                    value={formData.maxParticipants || ''}
                                    onChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        maxParticipants: value ? Number(value) : undefined
                                    }))}
                                    placeholder="Leave empty for unlimited"
                                    min={1}
                                    errors={errors}
                                    icon={UsersIcon}
                                    description="Maximum number of participants (optional)"
                                />

                                <InputField
                                    label="Application Deadline"
                                    name="applicationDeadline"
                                    type="datetime-local"
                                    value={formData.applicationDeadline || ''}
                                    onChange={(value) => setFormData(prev => ({ ...prev, applicationDeadline: value as string }))}
                                    errors={errors}
                                    icon={ClockIcon}
                                    description="When applications should close (optional)"
                                />
                            </div>
                        </div>

                        {/* Requirements and Benefits Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Requirements */}
                            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                                <div className="flex items-center space-x-2 mb-4">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                                    <h4 className="text-lg font-semibold text-gray-900">Requirements</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Add any requirements or prerequisites for participation
                                </p>

                                <div className="space-y-3">
                                    {formData.requirements?.map((requirement, index) => (
                                        <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-yellow-200">
                                            <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
                                            <span className="flex-1 text-sm text-gray-700">
                                                {requirement}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeRequirement(index)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newRequirement}
                                            onChange={(e) => setNewRequirement(e.target.value)}
                                            placeholder="Add a requirement"
                                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addRequirement}
                                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors flex items-center"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                                <div className="flex items-center space-x-2 mb-4">
                                    <GiftIcon className="h-5 w-5 text-green-600" />
                                    <h4 className="text-lg font-semibold text-gray-900">Benefits</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    List the benefits or advantages of participating
                                </p>

                                <div className="space-y-3">
                                    {formData.benefits?.map((benefit, index) => (
                                        <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-green-200">
                                            <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span className="flex-1 text-sm text-gray-700">
                                                {benefit}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeBenefit(index)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newBenefit}
                                            onChange={(e) => setNewBenefit(e.target.value)}
                                            placeholder="Add a benefit"
                                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addBenefit}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-center space-x-2 mb-4">
                                <MapPinIcon className="h-5 w-5 text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-900">Location Information</h4>
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.location?.isOnline || false}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            location: { ...prev.location, isOnline: e.target.checked }
                                        }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">This is an online event</span>
                                    </div>
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
                                    errors={errors}
                                    icon={LinkIcon}
                                    description="Provide the meeting link for online participants"
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <InputField
                                        label="Venue"
                                        name="venue"
                                        value={formData.location?.venue || ''}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            location: { ...prev.location, venue: value as string }
                                        }))}
                                        placeholder="Event venue or building name"
                                        errors={errors}
                                        icon={BuildingOfficeIcon}
                                        description="Name of the venue or building"
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
                                        errors={errors}
                                        icon={MapPinIcon}
                                        description="City where the event takes place"
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
                                            placeholder="Full address including street, number, etc."
                                            errors={errors}
                                            icon={MapPinIcon}
                                            description="Complete address for the physical location"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <span>All required fields must be completed</span>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <MegaphoneIcon className="h-4 w-4" />
                                            <span>{isEditing ? 'Update Announcement' : 'Create Announcement'}</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementModal;