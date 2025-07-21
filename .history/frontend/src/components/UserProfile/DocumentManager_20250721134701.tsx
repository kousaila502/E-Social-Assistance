// src/components/UserProfile/DocumentManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface UserDocument {
  _id: string;
  name: string;
  type: 'nationalIdCard' | 'incomeProof' | 'familyComposition' | 'residenceProof' | 'medicalReport' | 'other';
  url: string;
  uploadedAt: string;
  size: number;
  mimeType: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface DocumentManagerProps {
  userId: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ userId }) => {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<UserDocument['type']>('nationalIdCard');
  const [previewDocument, setPreviewDocument] = useState<UserDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documentTypes = [
    { value: 'nationalIdCard', label: 'National ID Card', required: true },
    { value: 'incomeProof', label: 'Income Proof', required: true },
    { value: 'familyComposition', label: 'Family Composition', required: true },
    { value: 'residenceProof', label: 'Residence Proof', required: true },
    { value: 'medicalReport', label: 'Medical Report', required: false },
    { value: 'other', label: 'Other Documents', required: false },
  ] as const;

  const acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const mockDocuments: UserDocument[] = [
        {
          _id: '1',
          name: 'national_id.pdf',
          type: 'nationalIdCard',
          url: '/api/documents/1',
          uploadedAt: '2024-01-15T10:30:00Z',
          size: 1024000,
          mimeType: 'application/pdf',
          isVerified: true,
          verificationStatus: 'verified',
          verificationNotes: 'Document is clear and valid',
          verifiedBy: 'John Admin',
          verifiedAt: '2024-01-16T09:00:00Z'
        },
        {
          _id: '2',
          name: 'income_statement.pdf',
          type: 'incomeProof',
          url: '/api/documents/2',
          uploadedAt: '2024-01-20T14:15:00Z',
          size: 512000,
          mimeType: 'application/pdf',
          isVerified: false,
          verificationStatus: 'pending',
        },
        {
          _id: '3',
          name: 'utility_bill.jpg',
          type: 'residenceProof',
          url: '/api/documents/3',
          uploadedAt: '2024-01-18T11:45:00Z',
          size: 2048000,
          mimeType: 'image/jpeg',
          isVerified: false,
          verificationStatus: 'rejected',
          verificationNotes: 'Image quality is too low, please upload a clearer version'
        }
      ];

      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      Array.from(selectedFiles).forEach((file) => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFileTypes.includes(fileExtension)) {
          throw new Error(`File type ${fileExtension} is not supported`);
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB`);
        }

        formData.append('documents', file);
      });

      formData.append('documentType', selectedDocumentType);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const newDocument: UserDocument = {
        _id: Date.now().toString(),
        name: selectedFiles[0].name,
        type: selectedDocumentType,
        url: '/api/documents/' + Date.now(),
        uploadedAt: new Date().toISOString(),
        size: selectedFiles[0].size,
        mimeType: selectedFiles[0].type,
        isVerified: false,
        verificationStatus: 'pending'
      };

      setDocuments(prev => [...prev, newDocument]);
      setSelectedFiles(null);

      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
    } catch (error) {
      console.error('Failed to delete document:', error);
      setError('Failed to delete document');
    }
  };

  const handlePreview = (document: UserDocument) => {
    setPreviewDocument(document);
  };

  const handleDownload = (doc: UserDocument) => {
    const link = window.document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    link.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const getVerificationIcon = (status: UserDocument['verificationStatus']) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVerificationBadge = (status: UserDocument['verificationStatus']) => {
    const base = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'verified': return `${base} bg-green-100 text-green-800`;
      case 'rejected': return `${base} bg-red-100 text-red-800`;
      case 'pending': return `${base} bg-yellow-100 text-yellow-800`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  };

  const getMissingRequiredDocuments = () => {
    const uploadedTypes = documents.map(doc => doc.type);
    return documentTypes.filter(type => type.required && !uploadedTypes.includes(type.value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Missing Required Documents Alert */}
      {getMissingRequiredDocuments().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Missing Required Documents</h3>
              <p className="mt-2 text-sm text-yellow-700">
                Please upload the following required documents:
              </p>
              <ul className="list-disc list-inside text-sm mt-1">
                {getMissingRequiredDocuments().map(doc => (
                  <li key={doc.value}>{doc.label}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value as UserDocument['type'])}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Files</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium">
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept={acceptedFileTypes.join(',')} onChange={handleFileSelect} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 10MB each</p>
              </div>
            </div>
          </div>

          {selectedFiles && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Selected Files:</p>
              {Array.from(selectedFiles).map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{file.name}</span>
                    <span className="ml-2 text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleUpload} disabled={!selectedFiles || uploading} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </>
            )}
          </button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Uploaded Documents</h3>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading your first document.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getDocumentIcon(doc.mimeType)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <span className={getVerificationBadge(doc.verificationStatus)}>{doc.verificationStatus.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-gray-500">{documentTypes.find(t => t.value === doc.type)?.label}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(doc.size)} - Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    {doc.verificationNotes && (
                      <p className="text-xs text-gray-600 mt-1"><strong>Note:</strong> {doc.verificationNotes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getVerificationIcon(doc.verificationStatus)}
                  <button onClick={() => handlePreview(doc)} className="p-2 text-gray-400 hover:text-gray-600" title="Preview">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDownload(doc)} className="p-2 text-gray-400 hover:text-gray-600" title="Download">
                    <Download className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(doc._id)} className="p-2 text-gray-400 hover:text-red-600" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{previewDocument.name}</h3>
              <button onClick={() => setPreviewDocument(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 text-sm text-gray-600 space-x-4">
              <span>Type: {documentTypes.find(t => t.value === previewDocument.type)?.label}</span>
              <span>Size: {formatFileSize(previewDocument.size)}</span>
              <span className={getVerificationBadge(previewDocument.verificationStatus)}>
                {previewDocument.verificationStatus.toUpperCase()}
              </span>
            </div>

            <div className="text-center py-8">
              {previewDocument.mimeType.startsWith('image/') ? (
                <img src={previewDocument.url} alt={previewDocument.name} className="max-w-full max-h-96 mx-auto" />
              ) : (
                <div className="space-y-4">
                  {getDocumentIcon(previewDocument.mimeType)}
                  <p className="text-sm text-gray-500">Preview not available. You can download the file instead.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => handleDownload(previewDocument)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                <Download className="h-4 w-4 mr-1 inline" /> Download
              </button>
              <button onClick={() => setPreviewDocument(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
