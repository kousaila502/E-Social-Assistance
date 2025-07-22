{/* Location Section */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <MapPinIcon className="h-5 w-5 text-purple-600" />
                                    <h4 className="text-lg font-semibold text-gray-900">Location & Venue</h4>
                                </div>
                                <div className="text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                                    {formData.location?.isOnline ? 'Online Event' : 'Physical Location'}
                                </div>
                            </div>

                            {/* Online/Offline Toggle */}
                            <div className="mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`relative flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        !formData.location?.isOnline 
                                            ? 'border-purple-500 bg-purple-100' 
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="locationType"
                                            checked={!formData.location?.isOnline}
                                            onChange={() => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, isOnline: false }
                                            }))}
                                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                        />
                                        <div className="flex items-center space-x-2">
                                            <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Physical Location</span>
                                                <p className="text-xs text-gray-500">In-person event or meeting</p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className={`relative flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        formData.location?.isOnline 
                                            ? 'border-purple-500 bg-purple-100' 
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="locationType"
                                            checked={formData.location?.isOnline || false}
                                            onChange={() => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, isOnline: true }
                                            }))}
                                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                        />
                                        <div className="flex items-center space-x-2">
                                            <GlobeAltIcon className="h-5 w-5 text-purple-600" />
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Online Event</span>
                                                <p className="text-xs text-gray-500">Virtual meeting or webinar</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Conditional Location Fields */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                {formData.location?.isOnline ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <GlobeAltIcon className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium text-gray-700">Online Meeting Details</span>
                                        </div>
                                        <InputField
                                            label="Meeting Link"
                                            name="onlineLink"
                                            value={formData.location?.onlineLink || ''}
                                            onChange={(value) => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, onlineLink: value as string }
                                            }))}
                                            placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                                            errors={errors}
                                            icon={LinkIcon}
                                            description="Provide the direct link where participants can join"
                                        />
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-start space-x-2">
                                                <div className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full mt-0.5"></div>
                                                <div className="text-sm text-blue-700">
                                                    <strong>Tip:</strong> Make sure your meeting link is accessible to all participants. 
                                                    Consider providing backup contact information.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium text-gray-700">Physical Location Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InputField
                                                label="Venue Name"
                                                name="venue"
                                                value={formData.location?.venue || ''}
                                                onChange={(value) => setFormData(prev => ({
                                                    ...prev,
                                                    location: { ...prev.location, venue: value as string }
                                                }))}
                                                placeholder="Community Center, City Hall, etc."
                                                errors={errors}
                                                icon={BuildingOfficeIcon}
                                                description="Name of the building or venue"
                                            />

                                            <InputField
                                                label="City"
                                                name="city"
                                                value={formData.location?.city || ''}
                                                onChange={(value) => setFormData(prev => ({
                                                    ...prev,
                                                    location: { ...prev.location, city: value as string }
                                                }))}
                                                placeholder="Enter city name"
                                                errors={errors}
                                                icon={MapPinIcon}
                                                description="City where the event takes place"
                                            />
                                        </div>

                                        <InputField
                                            label="Complete Address"
                                            name="address"
                                            value={formData.location?.address || ''}
                                            onChange={(value) => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, address: value as string }
                                            }))}
                                            placeholder="123 Main Street, Building A, Room 101"
                                            errors={errors}
                                            icon={MapPinIcon}
                                            description="Full street address including building and room details"
                                        />

                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-start space-x-2">
                                                <div className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full mt-0.5"></div>
                                                <div className="text-sm text-green-700">
                                                    <strong>Accessibility:</strong> Ensure your venue is accessible to all participants. 
                                                    Consider parking, public transport, and accessibility features.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span>Required fields</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span>Optional fields</span>
                                </div>
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onclose}
                                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                                >
                                    <div className="flex items-center space-x-2">
                                        <XMarkIcon className="h-4 w-4" />
                                        <span>Cancel</span>
                                    </div>
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {loading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Processing...</span>
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

export default CreateAnnouncementModal;// src/components/Announcements/CreateAnnouncementModal.tsx
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
                className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm ${
                    errors[name] 
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
                className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm ${
                    errors[name] 
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
                <span className={`font-medium ${
                    value.length > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'
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
            className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:text-sm ${
                errors[name] 
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

                    {/* Progress Steps */}
                    <div className="px-6 py-4 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-8">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">1</div>
                                    <span className="font-medium text-blue-600">Basic Details</span>
                                </div>
                                <div className="w-16 h-0.5 bg-gray-300"></div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-medium">2</div>
                                    <span className="text-gray-500">Requirements & Benefits</span>
                                </div>
                                <div className="w-16 h-0.5 bg-gray-300"></div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-medium">3</div>
                                    <span className="text-gray-500">Location & Settings</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                Step 1 of 3
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Basic Information Section */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-6 border border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                                    <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                                </div>
                                <div className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                                    Required Fields
                                </div>
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
                                <div className="relative">
                                    <SelectField
                                        label="Announcement Type"
                                        name="type"
                                        value={formData.type}
                                        onChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                                        options={[
                                            { value: 'event', label: '📅 Event - Gatherings and activities' },
                                            { value: 'program', label: '✨ Program - Government assistance' },
                                            { value: 'service', label: '🏢 Service - Public services' },
                                            { value: 'opportunity', label: '💼 Opportunity - Jobs and training' },
                                            { value: 'notice', label: '📢 Notice - Important announcements' }
                                        ]}
                                        required
                                        errors={errors}
                                        icon={SparklesIcon}
                                        description="Choose the category that best describes your announcement"
                                    />
                                    {/* Contextual help tooltip */}
                                    <div className="absolute top-0 right-0 mt-1 mr-1">
                                        <div className="group relative">
                                            <div className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs cursor-help">?</div>
                                            <div className="absolute top-6 right-0 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                <div className="space-y-1">
                                                    <p><strong>Event:</strong> Conferences, workshops, community gatherings</p>
                                                    <p><strong>Program:</strong> Social assistance, health programs</p>
                                                    <p><strong>Service:</strong> New public services, facility openings</p>
                                                    <p><strong>Opportunity:</strong> Job openings, training programs</p>
                                                    <p><strong>Notice:</strong> Policy changes, important updates</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SelectField
                                    label="Target Audience"
                                    name="targetAudience"
                                    value={formData.targetAudience}
                                    onChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value as any }))}
                                    options={[
                                        { value: 'all', label: '👥 All Citizens' },
                                        { value: 'students', label: '🎓 Students' },
                                        { value: 'families', label: '👨‍👩‍👧‍👦 Families' },
                                        { value: 'elderly', label: '👴 Elderly (65+)' },
                                        { value: 'disabled', label: '♿ Disabled Individuals' },
                                        { value: 'unemployed', label: '💼 Unemployed' },
                                        { value: 'specific', label: '🎯 Specific Group' }
                                    ]}
                                    required
                                    errors={errors}
                                    icon={UserGroupIcon}
                                    description="Select who this announcement is intended for"
                                />
                            </div>

                            {/* Conditional fields based on announcement type */}
                            {(formData.type === 'event' || formData.type === 'program') && (
                                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Event & Program Settings</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                            description="How many people can participate?"
                                        />

                                        <InputField
                                            label="Application Deadline"
                                            name="applicationDeadline"
                                            type="datetime-local"
                                            value={formData.applicationDeadline || ''}
                                            onChange={(value) => setFormData(prev => ({ ...prev, applicationDeadline: value as string }))}
                                            errors={errors}
                                            icon={ClockIcon}
                                            description="When should applications close?"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Show only for notices and services */}
                            {(formData.type === 'notice' || formData.type === 'service') && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm font-medium text-yellow-800">Information Notice</span>
                                    </div>
                                    <p className="text-sm text-yellow-700">
                                        {formData.type === 'notice' 
                                            ? 'This announcement will be displayed as an important notice to users.'
                                            : 'This service announcement will be added to the available services directory.'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Requirements and Benefits Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                    <span>Additional Details</span>
                                </h4>
                                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    Optional but Recommended
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Requirements */}
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-2">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                                            <h5 className="font-semibold text-gray-900">Requirements</h5>
                                        </div>
                                        <div className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                            {formData.requirements?.length || 0} items
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        What do participants need to qualify or bring?
                                    </p>
                                    
                                    <div className="space-y-3 max-h-40 overflow-y-auto">
                                        {formData.requirements?.length === 0 && (
                                            <div className="text-center py-4 text-gray-400 text-sm">
                                                <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                No requirements added yet
                                            </div>
                                        )}
                                        {formData.requirements?.map((requirement, index) => (
                                            <div key={index} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-yellow-200 shadow-sm">
                                                <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                                                <span className="flex-1 text-sm text-gray-700 leading-relaxed">
                                                    {requirement}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRequirement(index)}
                                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove requirement"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex space-x-2 mt-4">
                                        <input
                                            type="text"
                                            value={newRequirement}
                                            onChange={(e) => setNewRequirement(e.target.value)}
                                            placeholder="e.g., Must be 18+ years old"
                                            className="flex-1 px-4 py-2 border-2 border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addRequirement}
                                            disabled={!newRequirement.trim()}
                                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Add requirement"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Benefits */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-2">
                                            <GiftIcon className="h-5 w-5 text-green-600" />
                                            <h5 className="font-semibold text-gray-900">Benefits</h5>
                                        </div>
                                        <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                            {formData.benefits?.length || 0} items
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        What will participants gain or receive?
                                    </p>
                                    
                                    <div className="space-y-3 max-h-40 overflow-y-auto">
                                        {formData.benefits?.length === 0 && (
                                            <div className="text-center py-4 text-gray-400 text-sm">
                                                <GiftIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                No benefits added yet
                                            </div>
                                        )}
                                        {formData.benefits?.map((benefit, index) => (
                                            <div key={index} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                                                <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                                                <span className="flex-1 text-sm text-gray-700 leading-relaxed">
                                                    {benefit}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeBenefit(index)}
                                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove benefit"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex space-x-2 mt-4">
                                        <input
                                            type="text"
                                            value={newBenefit}
                                            onChange={(e) => setNewBenefit(e.target.value)}
                                            placeholder="e.g., Free training certificate"
                                            className="flex-1 px-4 py-2 border-2 border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addBenefit}
                                            disabled={!newBenefit.trim()}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Add benefit"
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