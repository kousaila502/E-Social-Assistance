// src/components/UserProfile/CreateUserModal.tsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { User } from '../../config/apiConfig';
import { USER_ROLES } from '../../utils/constants';
import userService, { CreateUserData } from '../../services/userService';
import {
    XMarkIcon,
    UserPlusIcon,
    EyeIcon,
    EyeSlashIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated?: (user: User) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
    isOpen,
    onClose,
    onUserCreated
}) => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        phoneNumber: '',
        role: 'user' as 'user' | 'admin' | 'case_worker' | 'finance_manager',
        accountStatus: 'active' as 'active' | 'pending_verification' | 'inactive' | 'suspended',
        personalInfo: {
            nationalId: '',
            dateOfBirth: '',
            gender: 'male' as 'male' | 'female' | 'other'
        },
        economicInfo: {
            familySize: 1,
            monthlyIncome: 0,
            employmentStatus: 'unemployed' as 'employed' | 'unemployed' | 'self_employed' | 'retired' | 'student' | 'disabled'
        }
    });

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields validation
        if (!formData.name?.trim()) newErrors.name = 'Name is required';
        if (!formData.email?.trim()) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (!confirmPassword) newErrors.confirmPassword = 'Please confirm password';
        if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }

        if (formData.password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Phone validation
        const phoneRegex = /^\+?[\d\s\-()]+$/;
        if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form submitted with data:', formData); // ← Add this debug

        if (!validateForm()) {
            console.log('Form validation failed:', errors); // ← Add this debug
            return;
        }

        setLoading(true);
        try {
            console.log('Calling userService.create with:', formData); // ← Add this debug
            const result = await userService.create(formData);
            console.log('User created successfully:', result); // ← Add this debug

            toast.success('User created successfully!');

            if (onUserCreated) {
                onUserCreated(result.user);
            }

            handleClose();

        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            email: '',
            name: '',
            password: '',
            phoneNumber: '',
            role: 'user' as const,
            accountStatus: 'active' as const,
            personalInfo: {
                nationalId: '',
                dateOfBirth: '',
                gender: 'male' as const
            },
            economicInfo: {
                familySize: 1,
                monthlyIncome: 0,
                employmentStatus: 'unemployed' as const
            }
        });
        setConfirmPassword('');
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    const handleInputChange = (field: string, value: any) => {
        if (field === 'personalInfo.nationalId') {
            setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, nationalId: value }
            }));
        } else if (field === 'personalInfo.dateOfBirth') {
            setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, dateOfBirth: value }
            }));
        } else if (field === 'personalInfo.gender') {
            setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, gender: value }
            }));
        } else if (field === 'economicInfo.familySize') {
            setFormData(prev => ({
                ...prev,
                economicInfo: { ...prev.economicInfo, familySize: value }
            }));
        } else if (field === 'economicInfo.monthlyIncome') {
            setFormData(prev => ({
                ...prev,
                economicInfo: { ...prev.economicInfo, monthlyIncome: value }
            }));
        } else if (field === 'economicInfo.employmentStatus') {
            setFormData(prev => ({
                ...prev,
                economicInfo: { ...prev.economicInfo, employmentStatus: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center">
                            <UserPlusIcon className="h-6 w-6 text-blue-600 mr-3" />
                            <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter full name"
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="user@example.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="+213 123 456 789"
                                    />
                                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        User Role *
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={USER_ROLES.USER}>Beneficiary</option>
                                        <option value={USER_ROLES.CASE_WORKER}>Case Worker</option>
                                        <option value={USER_ROLES.FINANCE_MANAGER}>Finance Manager</option>
                                        <option value={USER_ROLES.ADMIN}>Administrator</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter secure password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Confirm password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Status
                                    </label>
                                    <select
                                        value={formData.accountStatus}
                                        onChange={(e) => handleInputChange('accountStatus', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending_verification">Pending Verification</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information (Optional for Beneficiaries) */}
                        {formData.role === USER_ROLES.USER && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            National ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.personalInfo?.nationalId || ''}
                                            onChange={(e) => handleInputChange('personalInfo.nationalId', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="National ID number"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.personalInfo?.dateOfBirth || ''}
                                            onChange={(e) => handleInputChange('personalInfo.dateOfBirth', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Gender
                                        </label>
                                        <select
                                            value={formData.personalInfo?.gender || 'male'}
                                            onChange={(e) => handleInputChange('personalInfo.gender', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Family Size
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.economicInfo?.familySize || 1}
                                            onChange={(e) => handleInputChange('economicInfo.familySize', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Number of family members"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Monthly Income (DA)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.economicInfo?.monthlyIncome || 0}
                                            onChange={(e) => handleInputChange('economicInfo.monthlyIncome', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Monthly family income"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Employment Status
                                        </label>
                                        <select
                                            value={formData.economicInfo?.employmentStatus || 'unemployed'}
                                            onChange={(e) => handleInputChange('economicInfo.employmentStatus', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="employed">Employed</option>
                                            <option value="unemployed">Unemployed</option>
                                            <option value="self_employed">Self Employed</option>
                                            <option value="retired">Retired</option>
                                            <option value="student">Student</option>
                                            <option value="disabled">Disabled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning for Admin role */}
                        {formData.role === USER_ROLES.ADMIN && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                                    <div>
                                        <h4 className="font-medium text-yellow-800">Administrator Role</h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            This user will have full administrative access to the system, including user management,
                                            system settings, and all sensitive operations. Please ensure this is intended.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlusIcon className="h-4 w-4 mr-2" />
                                        Create User
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;