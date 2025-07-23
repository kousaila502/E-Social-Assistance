// src/components/UserProfile/ProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, MapPin, Briefcase, Users, DollarSign, Calendar, User, Phone, Mail } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  accountStatus: string;
  isEmailVerified: boolean;
  personalInfo?: {
    nationalId?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'prefer_not_to_say';  // ADD this
    address?: {
      wilaya?: string;     // CHANGE from state
      city?: string;
      address?: string;    // CHANGE from street
      country?: string;
      // REMOVE postalCode
    };
    // REMOVE emergencyContact completely
  };
  economicInfo?: {
    familySize?: number;
    dependents?: number;        // ADD this
    monthlyIncome?: number;
    employmentStatus?: string;
    maritalStatus?: string;     // ADD this
    // REMOVE occupation and bankAccount
  };
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      inApp?: boolean;
    };
  };
}

interface ProfileFormProps {
  user: User;
  isEditing: boolean;
  onSave: (data: any) => Promise<void>;
  loading: boolean;
}

interface ProfileFormData {
  name: string;
  phoneNumber: string;
  personalInfo: {
    nationalId?: string;     // Make optional to match API
    dateOfBirth?: string;    // Make optional to match API
    gender?: 'male' | 'female' | 'prefer_not_to_say';  // Make optional to match API
    address?: {
      wilaya?: string;       // Make optional to match API
      city?: string;         // Make optional to match API
      address?: string;      // Make optional to match API
      country?: string;      // Make optional to match API
    };
  };
  economicInfo?: {           // Make optional to match API
    familySize?: number;     // Make optional to match API
    dependents?: number;     // Make optional to match API
    monthlyIncome?: number;  // Make optional to match API
    employmentStatus?: string; // Make optional to match API
    maritalStatus?: string;  // Make optional to match API
  };
  preferences?: {            // Make optional to match API
    language?: string;       // Make optional to match API
    timezone?: string;
    notifications?: {        // Make optional to match API
      email?: boolean;       // Make optional to match API
      sms?: boolean;         // Make optional to match API
      inApp?: boolean;
    };
  };
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  user,
  isEditing,
  onSave,
  loading,
}) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormData>();
  const [activeSection, setActiveSection] = useState<'basic' | 'personal' | 'economic' | 'preferences'>('basic');

  useEffect(() => {
    reset({
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      personalInfo: {
        nationalId: user.personalInfo?.nationalId || '',
        dateOfBirth: user.personalInfo?.dateOfBirth || '',
        gender: user.personalInfo?.gender || 'prefer_not_to_say',  // ADD this
        address: {
          wilaya: user.personalInfo?.address?.wilaya || '',
          city: user.personalInfo?.address?.city || '',
          address: user.personalInfo?.address?.address || '',
          country: user.personalInfo?.address?.country || '',
        },
      },
      economicInfo: {
        familySize: user.economicInfo?.familySize || 1,
        dependents: user.economicInfo?.dependents || 0,        // ADD this
        monthlyIncome: user.economicInfo?.monthlyIncome || 0,
        employmentStatus: user.economicInfo?.employmentStatus || '',
        maritalStatus: user.economicInfo?.maritalStatus || '',     // ADD this
      },
      preferences: {
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'UTC',
        notifications: {
          email: user.preferences?.notifications?.email ?? true,
          sms: user.preferences?.notifications?.sms ?? false,
          inApp: user.preferences?.notifications?.inApp ?? true,
        },
      },
    });
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    await onSave(data);
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'personal', label: 'Personal Details', icon: MapPin },
    { id: 'economic', label: 'Economic Info', icon: DollarSign },
    { id: 'preferences', label: 'Preferences', icon: Users },
  ] as const;

  const employmentOptions = [
    'employed',
    'unemployed',
    'self_employed',
    'retired',
    'student',
    'disabled'
  ];

  const relationshipOptions = [
    'spouse',
    'parent',
    'child',
    'sibling',
    'relative',
    'friend',
    'other'
  ];

  if (!isEditing) {
    return (
      <div className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 w-20">Name:</span>
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 w-20">Email:</span>
                <span className="text-sm font-medium text-gray-900">{user.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 w-20">Phone:</span>
                <span className="text-sm font-medium text-gray-900">{user.phoneNumber || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Personal Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-24">National ID:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.personalInfo?.nationalId || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 w-20">Birth Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.personalInfo?.dateOfBirth ?
                    new Date(user.personalInfo.dateOfBirth).toLocaleDateString() :
                    'Not provided'
                  }
                </span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                <span className="text-sm text-gray-600 w-20">Address:</span>
                <div className="text-sm font-medium text-gray-900">
                  {user.personalInfo?.address?.address && (
                    <div>{user.personalInfo.address.address}</div>
                  )}
                  {(user.personalInfo?.address?.city || user.personalInfo?.address?.wilaya) && (
                    <div>
                      {user.personalInfo.address.city}, {user.personalInfo.address.wilaya}
                    </div>
                  )}
                  {!user.personalInfo?.address?.address && 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Economic Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Economic Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 w-24">Family Size:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.economicInfo?.familySize || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 w-24">Monthly Income:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.economicInfo?.monthlyIncome ?
                    `$${user.economicInfo.monthlyIncome.toLocaleString()}` :
                    'Not provided'
                  }
                </span>
              </div>
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600 w-24">Employment:</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.economicInfo?.employmentStatus?.replace('_', ' ').toUpperCase() || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
      {/* Section Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center space-x-2 ${activeSection === section.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Basic Information */}
      {activeSection === 'basic' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                {...register('phoneNumber')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Address</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed from this form</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information */}
      {activeSection === 'personal' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Personal Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">National ID</label>
              <input
                type="text"
                {...register('personalInfo.nationalId')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                {...register('personalInfo.dateOfBirth')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Gender field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                {...register('personalInfo.gender')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>  {/* FIXED: matches API interface */}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Address Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Wilaya</label>
                <input
                  type="text"
                  {...register('personalInfo.address.wilaya')}    // FIXED: using wilaya instead of state
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter wilaya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  {...register('personalInfo.address.city')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter city"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  {...register('personalInfo.address.address')}    // FIXED: using address instead of street
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  {...register('personalInfo.address.country')}
                  defaultValue="Algeria"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Economic Information */}
      {activeSection === 'economic' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Economic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Family Size</label>
              <input
                type="number"
                min="1"
                {...register('economicInfo.familySize', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Dependents</label>
              <input
                type="number"
                min="0"
                {...register('economicInfo.dependents', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Income (DZD)</label>
              <input
                type="number"
                min="0"
                {...register('economicInfo.monthlyIncome', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Employment Status</label>
              <select
                {...register('economicInfo.employmentStatus')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Status</option>
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="self_employed">Self Employed</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
              </select>
            </div>

            {/* Marital Status field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Marital Status</label>
              <select
                {...register('economicInfo.maritalStatus')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      {activeSection === 'preferences' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Preferences</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select
                {...register('preferences.language')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select
                {...register('preferences.timezone')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Africa/Algiers">Algiers</option>
              </select>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Notification Preferences</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('preferences.notifications.email')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm text-gray-700">
                  Email notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('preferences.notifications.sms')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm text-gray-700">
                  SMS notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('preferences.notifications.inApp')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm text-gray-700">
                  In-app notifications
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="mt-8 flex justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;