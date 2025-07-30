// src/pages/RequestSubmissionPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import RequestForm from '../components/forms/RequestForm';
import { useAuth } from '../hooks/useAuth';
import requestService, { CreateDemandeData } from '../services/requestService';
import { ROUTES } from '../utils/constants';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const RequestSubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  // Check if user can submit requests
  const canSubmitRequest = user?.accountStatus === 'active' && user?.isEmailVerified;

  const handleSubmit = async (formData: CreateDemandeData) => {
    if (!canSubmitRequest) {
      toast.error('Please verify your email and ensure your account is active before submitting requests.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestService.create(formData);

      if ('demande' in response && response.demande && response.demande._id) {
        toast.success('Request submitted successfully! You will receive updates via email.');
        navigate(`${ROUTES.REQUEST_DETAILS.replace(':id', response.demande._id)}`);
      } else {
        toast.success(response.message || 'Request submitted successfully!');
        navigate(ROUTES.MY_REQUESTS);
      }
    } catch (error: any) {
      console.error('Request submission error:', error);

      const errorMessage = error?.message ||
        error?.data?.message ||
        'Failed to submit request. Please try again.';

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formData: Partial<CreateDemandeData>) => {
    if (!formData.title || !formData.description) {
      toast.error('Please provide at least a title and description to save as draft.');
      return;
    }

    setIsSubmitting(true);

    try {
      const draftData: CreateDemandeData = {
        title: formData.title,
        description: formData.description,
        requestedAmount: formData.requestedAmount || 0,
        program: formData.program || { type: 'Content', id: '' },
        category: formData.category,
        urgencyLevel: formData.urgencyLevel || 'routine'
      };

      const response = await requestService.create(draftData);

      if ('demande' in response && response.demande && response.demande._id) {
        toast.success('Draft saved successfully!');
        navigate(ROUTES.MY_REQUESTS);
      } else {
        toast.success(response.message || 'Draft saved successfully!');
        navigate(ROUTES.MY_REQUESTS);
      }
    } catch (error: any) {
      console.error('Draft save error:', error);

      const errorMessage = error?.message ||
        error?.data?.message ||
        'Failed to save draft. Please try again.';

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Submit New Request
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Apply for social assistance services. Fill out the form below with accurate information to ensure faster processing.
          </p>
        </div>

        {/* Account Status Warnings */}
        {!user?.isEmailVerified && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Email Verification Required
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please verify your email address before submitting requests. Check your inbox for the verification email.
                </p>
              </div>
            </div>
          </div>
        )}

        {user?.accountStatus !== 'active' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Account Not Active
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Your account status is "{user?.accountStatus}". Please contact support to activate your account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Status */}
        {user?.eligibility && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Eligibility Status: {user.eligibility.status.charAt(0).toUpperCase() + user.eligibility.status.slice(1)}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Eligibility Score: {user.eligibility.score}/100
                  {user.eligibility.status === 'verified' && (
                    <span className="ml-2 text-green-600 font-medium">✓ Verified</span>
                  )}
                </p>
                {user.eligibility.categories?.length > 0 && (
                  <p className="text-sm text-blue-700 mt-1">
                    Eligible Categories: {user.eligibility.categories?.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Before You Submit
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="font-medium text-blue-600 mr-2">1.</span>
              Ensure all information is accurate and complete
            </li>
            <li className="flex items-start">
              <span className="font-medium text-blue-600 mr-2">2.</span>
              Select the appropriate program or service category
            </li>
            <li className="flex items-start">
              <span className="font-medium text-blue-600 mr-2">3.</span>
              Provide a clear description of your situation and needs
            </li>
            <li className="flex items-start">
              <span className="font-medium text-blue-600 mr-2">4.</span>
              Upload any required supporting documents
            </li>
            <li className="flex items-start">
              <span className="font-medium text-blue-600 mr-2">5.</span>
              Review everything before final submission
            </li>
          </ul>
        </div>

        {/* Request Form */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <RequestForm
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
            disabled={!canSubmitRequest}
            user={user}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Need Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Processing Time
              </h3>
              <p className="text-sm text-gray-600">
                Most requests are reviewed within 3-5 business days. Urgent requests are prioritized and may be processed faster.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Required Documents
              </h3>
              <p className="text-sm text-gray-600">
                Common documents include ID verification, income proof, and relevant medical or educational records.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Contact Support
              </h3>
              <p className="text-sm text-gray-600">
                If you need assistance filling out this form, contact our support team at support@socialassistance.com
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Application Status
              </h3>
              <p className="text-sm text-gray-600">
                You can track your application status and receive updates in your dashboard after submission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RequestSubmissionPage;