// src/components/forms/DocumentUpload.tsx
import React, { useState, useRef, useCallback } from 'react';
import { FILE_UPLOAD } from '../../utils/constants';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface DocumentUploadProps {
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizePerFile?: number;
  acceptedTypes?: string[];
  existingFiles?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onFilesChange,
  disabled = false,
  maxFiles = 5,
  maxSizePerFile = FILE_UPLOAD.MAX_SIZE,
  acceptedTypes = FILE_UPLOAD.ACCEPTED_EXTENSIONS,
  existingFiles = []
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizePerFile) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSizePerFile)}.`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypesLower = acceptedTypes.map(type => type.toLowerCase());
    
    if (!acceptedTypesLower.includes(fileExtension)) {
      return `File "${file.name}" has an unsupported format. Accepted formats: ${acceptedTypes.join(', ')}.`;
    }

    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "h-8 w-8";
    
    switch (extension) {
      case 'pdf':
        return <DocumentIcon className={`${iconClass} text-red-600`} />;
      case 'doc':
      case 'docx':
        return <DocumentIcon className={`${iconClass} text-blue-600`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <DocumentIcon className={`${iconClass} text-green-600`} />;
      default:
        return <DocumentIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  const processFiles = useCallback((fileList: FileList) => {
    const newErrors: string[] = [];
    const validFiles: FileWithPreview[] = [];

    // Check total files limit
    if (files.length + fileList.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed. Please remove some files first.`);
      setErrors(newErrors);
      return;
    }

    Array.from(fileList).forEach((file) => {
      // Check for duplicate files
      const isDuplicate = files.some(f => 
        f.name === file.name && f.size === file.size
      );
      
      if (isDuplicate) {
        newErrors.push(`File "${file.name}" is already uploaded.`);
        return;
      }

      // Validate file
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
        return;
      }

      // Add unique ID to file
      const fileWithId = Object.assign(file, {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }) as FileWithPreview;

      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithId.preview = URL.createObjectURL(file);
      }

      validFiles.push(fileWithId);
    });

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }

    setErrors(newErrors);
  }, [files, maxFiles, onFilesChange]);

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => {
      if (file.id === fileId) {
        // Revoke object URL to prevent memory leaks
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
        return false;
      }
      return true;
    });
    
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    
    // Clear errors if files are removed
    if (updatedFiles.length < maxFiles) {
      setErrors(prev => prev.filter(error => 
        !error.includes('Maximum') && !error.includes('already uploaded')
      ));
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles, disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = '';
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="text-center">
          <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${
            disabled ? 'text-gray-300' : 'text-gray-400'
          }`} />
          <div className="mt-4">
            <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className={`text-xs mt-1 ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {acceptedTypes.join(', ').toUpperCase()} up to {formatFileSize(maxSizePerFile)}
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Limits Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Maximum {maxFiles} files allowed</p>
        <p>• Maximum {formatFileSize(maxSizePerFile)} per file</p>
        <p>• Supported formats: {acceptedTypes.join(', ')}</p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Previously Uploaded:</h4>
          {existingFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • Uploaded {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Previously'}
                  </p>
                </div>
              </div>
              {file.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Ready to Upload ({files.length}/{maxFiles}):
          </h4>
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  getFileIcon(file.name)
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove file"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {(files.length > 0 || existingFiles.length > 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <DocumentIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {existingFiles.length + files.length} total file(s)
              </p>
              <p className="text-xs text-blue-700">
                {existingFiles.length} already uploaded, {files.length} ready to upload
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;