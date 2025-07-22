import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CreateDemandeData, Program } from '../../services/requestService';

interface RequestFormProps {
  onSubmit: (formData: CreateDemandeData) => Promise<void>;
  onSaveDraft: (formData: Partial<CreateDemandeData>) => Promise<void>;
  isSubmitting: boolean;
  disabled: boolean;
  user: any; // Replace with proper User type from auth context
  onDocumentChange: (files: File[]) => void; // Added to fix TypeScript error
}

const RequestForm: React.FC<RequestFormProps> = ({
  onSubmit,
  onSaveDraft,
  isSubmitting,
  disabled,
  user,
  onDocumentChange,
}) => {
  const [formData, setFormData] = useState<Partial<CreateDemandeData>>({
    title: '',
    description: '',
    requestedAmount: 0,
    program: { type: 'Content', id: '' },
    category: 'other',
    urgencyLevel: 'medium',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [type, id] = e.target.value.split(':');
    setFormData((prev) => ({
      ...prev,
      program: { type: type as Program['type'], id },
    }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onDocumentChange(files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.requestedAmount || !formData.program?.id) {
      toast.error('Please fill in all required fields.');
      return;
    }
    onSubmit({
      ...formData,
      requestedAmount: Number(formData.requestedAmount),
      program: formData.program as Program,
      category: formData.category || 'other',
      urgencyLevel: formData.urgencyLevel || 'medium',
    } as CreateDemandeData);
  };

  const handleSaveDraft = () => {
    onSaveDraft(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Request Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={disabled || isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={4}
          disabled={disabled || isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="requestedAmount" className="block text-sm font-medium text-gray-700">
          Requested Amount
        </label>
        <input
          type="number"
          name="requestedAmount"
          id="requestedAmount"
          value={formData.requestedAmount}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={disabled || isSubmitting}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label htmlFor="program" className="block text-sm font-medium text-gray-700">
          Program
        </label>
        <select
          name="program"
          id="program"
          value={`${formData.program?.type}:${formData.program?.id}`}
          onChange={handleProgramChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={disabled || isSubmitting}
          required
        >
          <option value="">Select a program</option>
          <option value="Content:program1">Medical Assistance Program</option>
          <option value="Announcement:announcement1">Job Training Announcement</option>
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          name="category"
          id="category"
          value={formData.category}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={disabled || isSubmitting}
        >
          <option value="medical">Medical</option>
          <option value="education">Education</option>
          <option value="housing">Housing</option>
          <option value="food">Food</option>
          <option value="employment">Employment</option>
          <option value="disability">Disability</option>
          <option value="elderly">Elderly</option>
          <option value="child_welfare">Child Welfare</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="urgencyLevel" className="block text-sm font-medium text-gray-700">
          Urgency Level
        </label>
        <select
          name="urgencyLevel"
          id="urgencyLevel"
          value={formData.urgencyLevel}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={disabled || isSubmitting}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <label htmlFor="documents" className="block text-sm font-medium text-gray-700">
          Supporting Documents
        </label>
        <input
          type="file"
          name="documents"
          id="documents"
          multiple
          onChange={handleDocumentChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={disabled || isSubmitting}
        />
        <p className="mt-2 text-sm text-gray-500">
          Upload relevant documents (e.g., ID, income proof, medical records). Max 5 files.
        </p>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={disabled || isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
};

export default RequestForm;