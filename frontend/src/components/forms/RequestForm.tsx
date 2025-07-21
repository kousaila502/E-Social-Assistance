// src/components/forms/RequestForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { CreateDemandeData } from '../../services/requestService';
import DocumentUpload from './DocumentUpload';
import { User } from '../../config/apiConfig';
import { REQUEST_CATEGORIES, REQUEST_CATEGORY_LABELS, URGENCY_LEVELS } from '../../utils/constants';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface RequestFormProps {
  onSubmit: (data: CreateDemandeData) => Promise<void>;
  onSaveDraft?: (data: Partial<CreateDemandeData>) => Promise<void>;
  isSubmitting: boolean;
  disabled?: boolean;
  user: User | null;
  initialData?: Partial<CreateDemandeData>;
}

interface FormData extends CreateDemandeData {
  documents?: File[];
}

// Mock programs data - in real app, this would come from API
const mockPrograms = [
  {
    id: '1',
    type: 'Content' as const,
    name: 'Emergency Medical Assistance',
    description: 'Financial support for urgent medical treatments',
    category: 'medical',
    maxAmount: 5000
  },
  {
    id: '2',
    type: 'Content' as const,
    name: 'Education Support Program',
    description: 'Assistance with school fees and educational materials',
    category: 'education',
    maxAmount: 2000
  },
  {
    id: '3',
    type: 'Content' as const,
    name: 'Housing Assistance',
    description: 'Support with rent and housing-related expenses',
    category: 'housing',
    maxAmount: 3000
  },
  {
    id: '4',
    type: 'Announcement' as const,
    name: 'Job Training Workshop',
    description: 'Skills development and employment training',
    category: 'employment',
    maxAmount: 1000
  }
];

const RequestForm: React.FC<RequestFormProps> = ({
  onSubmit,
  onSaveDraft,
  isSubmitting,
  disabled = false,
  user,
  initialData
}) => {
  const [selectedProgram, setSelectedProgram] = useState<typeof mockPrograms[0] | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
    setValue,
    reset
  } = useForm<FormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      requestedAmount: initialData?.requestedAmount || 0,
      category: initialData?.category || undefined,
      urgencyLevel: initialData?.urgencyLevel || 'medium',
      program: initialData?.program || { type: 'Content', id: '' },
      documents: []
    }
  });

  const watchProgram = watch('program');
  const watchCategory = watch('category');
  const watchAmount = watch('requestedAmount');

  // Update selected program when program changes
  useEffect(() => {
    if (watchProgram?.id) {
      const program = mockPrograms.find(p => p.id === watchProgram.id);
      setSelectedProgram(program || null);
      
      // Auto-set category if program has one
      if (program?.category) {
        setValue('category', program.category as any);
      }
    }
  }, [watchProgram?.id, setValue]);

  // Filter programs by selected category
  const filteredPrograms = watchCategory 
    ? mockPrograms.filter(p => p.category === watchCategory)
    : mockPrograms;

  const onFormSubmit = async (data: FormData) => {
    if (!data.program.id) {
      return;
    }

    const submitData: CreateDemandeData = {
      title: data.title,
      description: data.description,
      requestedAmount: data.requestedAmount,
      program: data.program,
      category: data.category,
      urgencyLevel: data.urgencyLevel
    };

    await onSubmit(submitData);
  };

  const handleSaveDraft = async () => {
    const formData = watch();
    if (onSaveDraft) {
      await onSaveDraft(formData);
    }
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
    setValue('documents', files);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-8">
      {/* Basic Information Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
          Basic Information
        </h2>
        
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Request Title *
            </label>
            <input
              {...register('title', {
                required: 'Request title is required',
                minLength: {
                  value: 5,
                  message: 'Title must be at least 5 characters'
                },
                maxLength: {
                  value: 100,
                  message: 'Title must not exceed 100 characters'
                }
              })}
              type="text"
              disabled={disabled || isSubmitting}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Brief summary of your request"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: {
                  value: 20,
                  message: 'Description must be at least 20 characters'
                },
                maxLength: {
                  value: 1000,
                  message: 'Description must not exceed 1000 characters'
                }
              })}
              rows={4}
              disabled={disabled || isSubmitting}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Explain your situation and why you need assistance. Be specific about your circumstances."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Category and Program Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <TagIcon className="h-5 w-5 mr-2 text-blue-600" />
          Category & Program
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register('category', {
                required: 'Please select a category'
              })}
              disabled={disabled || isSubmitting}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Select a category</option>
              {Object.entries(REQUEST_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Program */}
          <div>
            <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-2">
              Program/Service *
            </label>
            <Controller
              name="program.id"
              control={control}
              rules={{ required: 'Please select a program' }}
              render={({ field }) => (
                <select
                  {...field}
                  disabled={disabled || isSubmitting}
                  className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.program?.id ? 'border-red-300' : 'border-gray-300'
                  } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    const program = mockPrograms.find(p => p.id === e.target.value);
                    if (program) {
                      setValue('program.type', program.type);
                    }
                  }}
                >
                  <option value="">Select a program</option>
                  {filteredPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.type})
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.program?.id && (
              <p className="mt-1 text-sm text-red-600">{errors.program.id.message}</p>
            )}
            
            {selectedProgram && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{selectedProgram.description}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Maximum amount: ${selectedProgram.maxAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amount and Urgency */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Amount & Priority
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requested Amount */}
          <div>
            <label htmlFor="requestedAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Requested Amount ($) *
            </label>
            <input
              {...register('requestedAmount', {
                required: 'Requested amount is required',
                min: {
                  value: 1,
                  message: 'Amount must be greater than 0'
                },
                max: {
                  value: selectedProgram?.maxAmount || 10000,
                  message: `Amount cannot exceed $${(selectedProgram?.maxAmount || 10000).toLocaleString()}`
                }
              })}
              type="number"
              min="1"
              step="0.01"
              disabled={disabled || isSubmitting}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.requestedAmount ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="0.00"
            />
            {errors.requestedAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.requestedAmount.message}</p>
            )}
            
            {watchAmount > 0 && selectedProgram && watchAmount > selectedProgram.maxAmount && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mt-0.5 mr-2" />
                <p className="text-xs text-yellow-700">
                  Requested amount exceeds program maximum. Your request may require special approval.
                </p>
              </div>
            )}
          </div>

          {/* Urgency Level */}
          <div>
            <label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <select
              {...register('urgencyLevel')}
              disabled={disabled || isSubmitting}
              className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                disabled ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
            >
              {Object.entries(URGENCY_LEVELS).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Critical and high urgency requests are prioritized for faster processing.
            </p>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
          Supporting Documents
        </h2>
        
        <DocumentUpload
          onFilesChange={handleFilesChange}
          disabled={disabled || isSubmitting}
          maxFiles={5}
          acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
        />
        
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recommended Documents:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Government-issued ID or passport</li>
            <li>• Proof of income or unemployment status</li>
            <li>• Medical records (for medical assistance)</li>
            <li>• School enrollment proof (for education assistance)</li>
            <li>• Lease agreement or utility bills (for housing assistance)</li>
          </ul>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        {onSaveDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={disabled || isSubmitting || !isDirty}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
        )}
        
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="flex-1 sm:flex-none px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </button>
      </div>
    </form>
  );
};

export default RequestForm;