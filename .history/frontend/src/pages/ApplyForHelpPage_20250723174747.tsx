// src/pages/ApplyForHelpPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import requestService, { CreateDemandeData } from '../services/requestService';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CloudArrowUpIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface StepProps {
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  stepNumber: number;
}

interface ServiceContext {
  serviceCategory?: string;
  programType?: 'Content' | 'Announcement';
  programId?: string;
  serviceName?: string;
  maxAmount?: number;
  announcementData?: {
    title: string;
    description: string;
    deadline?: string;
    requirements?: string[];
    type: string;
    budget?: number;
  };
}

interface ApplicationData {
  title: string;
  description: string;
  requestedAmount: number;
  category: 'emergency_assistance' | 'educational_support' | 'medical_assistance' | 'housing_support' | 'food_assistance' | 'employment_support' | 'elderly_care' | 'disability_support' | 'other';
  urgencyLevel: 'routine' | 'important' | 'urgent' | 'critical';
  program: {
    type: 'Content' | 'Announcement';
    id: string;
  };
  documents: File[];
  tags?: string[];
}

const ApplyForHelpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceContext] = useState<ServiceContext>(location.state || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Enhanced initialization for announcements
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    title: serviceContext.announcementData?.title ?
      `Application for: ${serviceContext.announcementData.title}` : '',
    description: '',
    requestedAmount: 0,
    category: getAnnouncementCategory(serviceContext.serviceCategory || serviceContext.announcementData?.type) || 'other',
    urgencyLevel: 'routine',
    program: {
      type: serviceContext.programType || 'Content',
      id: serviceContext.programId || ''
    },
    documents: [],
    tags: serviceContext.announcementData ? [serviceContext.announcementData.type] : []
  });

  // Helper function to map announcement types to categories
  function getAnnouncementCategory(announcementType?: string): ApplicationData['category'] {
    switch (announcementType) {
      case 'scholarship':
        return 'educational_support';
      case 'job_opportunity':
        return 'employment_support';
      case 'training':
        return 'educational_support';
      case 'housing_assistance':
        return 'housing_support';
      case 'medical_aid':
        return 'medical_assistance';
      case 'emergency_relief':
        return 'emergency_assistance';
      default:
        return 'other';
    }
  }

  const steps = [
    { title: 'Service Selection', description: 'Choose the type of assistance you need' },
    { title: 'Application Details', description: 'Tell us about your situation' },
    { title: 'Upload Documents', description: 'Provide supporting documents' },
    { title: 'Review & Submit', description: 'Review your application before submitting' }
  ];

  // Redirect if no service context and not on step 1
  useEffect(() => {
    if (!serviceContext.serviceCategory && currentStep > 1) {
      navigate('/services');
    }
  }, [serviceContext, currentStep, navigate]);

  // Category options for step 1
  const categoryOptions = [
    {
      value: 'emergency_assistance',
      label: 'Emergency Assistance',
      description: 'Urgent financial help for unexpected situations',
      maxAmount: 3000,
      urgentByDefault: true
    },
    {
      value: 'housing_support',
      label: 'Housing Support',
      description: 'Help with rent, utilities, or housing costs',
      maxAmount: 2000
    },
    {
      value: 'medical_assistance',
      label: 'Medical Assistance',
      description: 'Support for medical bills and healthcare costs',
      maxAmount: 1500
    },
    {
      value: 'educational_support',
      label: 'Educational Support',
      description: 'Assistance with school fees and educational expenses',
      maxAmount: 1000
    },
    {
      value: 'food_assistance',
      label: 'Food Assistance',
      description: 'Help with food and nutrition needs',
      maxAmount: 500
    },
    {
      value: 'employment_support',
      label: 'Employment Support',
      description: 'Job training and unemployment assistance',
      maxAmount: 1200
    },
    {
      value: 'elderly_care',
      label: 'Elderly Care',
      description: 'Support services for senior citizens',
      maxAmount: 800
    },
    {
      value: 'disability_support',
      label: 'Disability Support',
      description: 'Assistance for individuals with disabilities',
      maxAmount: 2500
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Other types of social assistance',
      maxAmount: 1000
    }
  ];

  const urgencyOptions = [
    { value: 'routine', label: 'Routine', description: 'Standard processing time' },
    { value: 'important', label: 'Important', description: 'Needs attention but not urgent' },
    { value: 'urgent', label: 'Urgent', description: 'Time-sensitive situation' },
    { value: 'critical', label: 'Critical', description: 'Emergency requiring immediate attention' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!applicationData.category) {
          newErrors.category = 'Please select a service category';
        }
        break;
      case 2:
        if (!applicationData.title.trim()) {
          newErrors.title = 'Please provide a title for your application';
        }
        if (!applicationData.description.trim()) {
          newErrors.description = 'Please describe your situation';
        }
        if (applicationData.requestedAmount <= 0) {
          newErrors.requestedAmount = 'Please enter a valid amount';
        }
        const selectedCategory = categoryOptions.find(cat => cat.value === applicationData.category);
        if (selectedCategory && applicationData.requestedAmount > selectedCategory.maxAmount) {
          newErrors.requestedAmount = `Amount cannot exceed ${selectedCategory.maxAmount.toLocaleString()} DA for this category`;
        }
        break;
      case 3:
        // Documents are optional, but we can add validation if needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCategoryChange = (category: string) => {
    const selectedOption = categoryOptions.find(opt => opt.value === category);
    setApplicationData(prev => ({
      ...prev,
      category: category as any,
      urgencyLevel: selectedOption?.urgentByDefault ? 'urgent' : 'routine',
      requestedAmount: 0 // Reset amount when category changes
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    setApplicationData(prev => ({
      ...prev,
      documents: [...prev.documents, ...validFiles]
    }));
  };

  const removeDocument = (index: number) => {
    setApplicationData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const submitData: CreateDemandeData = {
        title: applicationData.title,
        description: applicationData.description,
        requestedAmount: applicationData.requestedAmount,
        category: applicationData.category,
        urgencyLevel: applicationData.urgencyLevel,
        program: applicationData.program,
        tags: applicationData.tags
      };

      const response = await requestService.create(submitData);

      // If documents were uploaded, handle them separately
      if (applicationData.documents.length > 0) {
        // This would need the request ID from the response
        // await requestService.uploadDocuments(requestId, applicationData.documents);
      }

      // Navigate to success page or applications list
      navigate('/my-applications', {
        state: {
          message: 'Your application has been submitted successfully!',
          requestId: response.message // Adjust based on your API response
        }
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${isCompleted
                ? 'bg-green-600 border-green-600 text-white'
                : isCurrent
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
                }`}>
                {isCompleted ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{stepNumber}</span>
                )}
              </div>

              {index < steps.length - 1 && (
                <div className={`w-full h-1 mx-4 transition-all duration-200 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep - 1].title}</h2>
        <p className="text-gray-600">{steps[currentStep - 1].description}</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          What type of assistance do you need?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryOptions.map((option) => (
            <div
              key={option.value}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${applicationData.category === option.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => handleCategoryChange(option.value)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{option.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  <p className="text-xs text-green-600 font-medium mt-2">
                    Max: {option.maxAmount.toLocaleString()} DA
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${applicationData.category === option.value
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
                  }`}>
                  {applicationData.category === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {errors.category && (
          <p className="text-red-600 text-sm mt-2">{errors.category}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const selectedCategory = categoryOptions.find(cat => cat.value === applicationData.category);

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Title *
          </label>
          <input
            type="text"
            value={applicationData.title}
            onChange={(e) => setApplicationData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Brief title describing your need"
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe Your Situation *
          </label>
          <textarea
            value={applicationData.description}
            onChange={(e) => setApplicationData(prev => ({ ...prev, description: e.target.value }))}
            rows={5}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            placeholder="Please provide details about your situation and why you need assistance..."
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requested Amount (DA) *
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={selectedCategory?.maxAmount}
              value={applicationData.requestedAmount || ''}
              onChange={(e) => setApplicationData(prev => ({
                ...prev,
                requestedAmount: parseFloat(e.target.value) || 0
              }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.requestedAmount ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Enter amount needed"
            />
            {selectedCategory && (
              <p className="text-sm text-gray-500 mt-1">
                Maximum for {selectedCategory.label}: {selectedCategory.maxAmount.toLocaleString()} DA
              </p>
            )}
          </div>
          {errors.requestedAmount && (
            <p className="text-red-600 text-sm mt-1">{errors.requestedAmount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgencyOptions.map((option) => (
              <div
                key={option.value}
                className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${applicationData.urgencyLevel === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setApplicationData(prev => ({
                  ...prev,
                  urgencyLevel: option.value as any
                }))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{option.label}</h4>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${applicationData.urgencyLevel === option.value
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-300'
                    }`}>
                    {applicationData.urgencyLevel === option.value && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Supporting Documents
        </h3>
        <p className="text-gray-600 mb-4">
          Upload any documents that support your application. Accepted formats: PDF, JPG, PNG (Max 5MB each)
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Click to upload files
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-gray-500 text-sm">or drag and drop</p>
          </div>
        </div>

        {applicationData.documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Uploaded Documents:</h4>
            {applicationData.documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <DocumentPlusIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Document Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Include proof of identity (ID card, passport)</li>
              <li>Provide proof of income or financial situation</li>
              <li>Add any receipts or bills related to your request</li>
              <li>Ensure all documents are clear and readable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const selectedCategory = categoryOptions.find(cat => cat.value === applicationData.category);
    const selectedUrgency = urgencyOptions.find(opt => opt.value === applicationData.urgencyLevel);

    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Application</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Service Category</label>
              <p className="text-gray-900">{selectedCategory?.label}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-gray-900">{applicationData.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900 whitespace-pre-wrap">{applicationData.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Requested Amount</label>
              <p className="text-gray-900">{applicationData.requestedAmount.toLocaleString()} DA</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Urgency Level</label>
              <p className="text-gray-900">{selectedUrgency?.label} - {selectedUrgency?.description}</p>
            </div>

            {applicationData.documents.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Uploaded Documents</label>
                <div className="space-y-2">
                  {applicationData.documents.map((file, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
                      <DocumentPlusIcon className="h-4 w-4 mr-2" />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Before Submitting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Double-check all information is accurate</li>
                <li>Ensure all required documents are uploaded</li>
                <li>You will receive email updates about your application status</li>
                <li>Processing time varies by service type and urgency</li>
              </ul>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errors.submit}</p>
          </div>
        )}
      </div>
    );
  };

  const renderAnnouncementInfo = () => {
    if (!serviceContext.announcementData) return null;

    const { announcementData } = serviceContext;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Applying for: {announcementData.title}
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              {announcementData.description}
            </p>

            {announcementData.deadline && (
              <div className="flex items-center text-sm text-blue-600 mb-2">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>Deadline: {new Date(announcementData.deadline).toLocaleDateString()}</span>
              </div>
            )}

            {announcementData.budget && (
              <div className="flex items-center text-sm text-blue-600 mb-2">
                <span>Maximum Amount: {announcementData.budget.toLocaleString()} DA</span>
              </div>
            )}

            {announcementData.requirements && announcementData.requirements.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Requirements:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {announcementData.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {serviceContext.announcementData ? 'Apply for Opportunity' : 'Apply for Assistance'}
          </h1>
          <p className="text-gray-600">
            {serviceContext.announcementData
              ? 'Submit your application for this opportunity'
              : 'Submit your request for assistance through our social services program'
            }
          </p>
        </div>

        {/* Announcement Info (if applicable) */}
        {renderAnnouncementInfo()}

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <CheckCircleIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ApplyForHelpPage;