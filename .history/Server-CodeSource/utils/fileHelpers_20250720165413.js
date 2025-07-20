const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

// File type configurations
const fileTypes = {
  documents: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  media: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp']
};

const mimeTypes = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

// Base upload directory
const uploadBasePath = path.join(__dirname, '../uploads');

// Generate unique filename with timestamp and crypto
const generateUniqueFilename = (originalName, prefix = '') => {
  try {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const extension = getFileExtension(originalName);
    const baseName = path.basename(originalName, extension);
    
    // Sanitize the base name
    const sanitizedBaseName = sanitizeFileName(baseName).substring(0, 50);
    
    const prefixPart = prefix ? `${prefix}_` : '';
    return `${prefixPart}${timestamp}_${randomBytes}_${sanitizedBaseName}${extension}`;
  } catch (error) {
    console.error('Error generating unique filename:', error);
    // Fallback to simple timestamp
    const timestamp = Date.now();
    const extension = getFileExtension(originalName);
    return `${timestamp}_file${extension}`;
  }
};

// Validate file type against allowed types
const validateFileType = (filename, mimetype, uploadType = 'media') => {
  try {
    const extension = getFileExtension(filename).toLowerCase().substring(1); // Remove the dot
    const allowedExtensions = fileTypes[uploadType] || fileTypes.media;
    const allowedMimes = [
      ...(mimeTypes.documents || []),
      ...(mimeTypes.images || [])
    ];

    // Check extension
    const isValidExtension = allowedExtensions.includes(extension);
    
    // Check MIME type
    const isValidMimeType = allowedMimes.includes(mimetype);
    
    if (!isValidExtension) {
      return {
        isValid: false,
        error: `File extension '${extension}' not allowed. Allowed types: ${allowedExtensions.join(', ')}`
      };
    }
    
    if (!isValidMimeType) {
      return {
        isValid: false,
        error: `MIME type '${mimetype}' not allowed`
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Error validating file type'
    };
  }
};

// Safely extract file extension
const getFileExtension = (filename) => {
  try {
    if (!filename || typeof filename !== 'string') {
      return '';
    }
    
    const ext = path.extname(filename);
    return ext.toLowerCase();
  } catch (error) {
    console.error('Error getting file extension:', error);
    return '';
  }
};

// Create upload directories if they don't exist
const createUploadDirectory = async (subPath = '') => {
  try {
    const fullPath = subPath ? path.join(uploadBasePath, subPath) : uploadBasePath;
    
    // Check if directory exists
    try {
      await fs.access(fullPath);
      return { success: true, path: fullPath };
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
      return { success: true, path: fullPath };
    }
  } catch (error) {
    console.error(`Error creating directory ${subPath}:`, error);
    return {
      success: false,
      error: `Failed to create upload directory: ${error.message}`
    };
  }
};

// Safely delete file with error handling
const deleteFile = async (filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path' };
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return { success: true, message: 'File does not exist (already deleted)' };
    }
    
    // Delete the file
    await fs.unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return {
      success: false,
      error: `Failed to delete file: ${error.message}`
    };
  }
};

// Get file size in human-readable format
const getFileSize = (sizeInBytes) => {
  try {
    if (!sizeInBytes || sizeInBytes === 0) {
      return { bytes: 0, readable: '0 B' };
    }
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    const size = sizeInBytes / Math.pow(1024, i);
    
    return {
      bytes: sizeInBytes,
      readable: `${Math.round(size * 100) / 100} ${sizes[i]}`
    };
  } catch (error) {
    return { bytes: 0, readable: 'Unknown' };
  }
};

// Sanitize filename by removing dangerous characters
const sanitizeFileName = (filename) => {
  try {
    if (!filename || typeof filename !== 'string') {
      return 'file';
    }
    
    // Remove or replace dangerous characters
    let sanitized = filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous chars with underscore
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .trim();
    
    // Ensure filename is not empty and not too long
    if (!sanitized || sanitized.length === 0) {
      sanitized = 'file';
    }
    
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }
    
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing filename:', error);
    return 'file';
  }
};

// Move file from one location to another
const moveFile = async (sourcePath, destinationPath) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destinationPath);
    await createUploadDirectory(path.relative(uploadBasePath, destDir));
    
    // Check if source file exists
    await fs.access(sourcePath);
    
    // Move the file
    await fs.rename(sourcePath, destinationPath);
    
    console.log(`Moved file from ${sourcePath} to ${destinationPath}`);
    return { success: true, newPath: destinationPath };
  } catch (error) {
    console.error(`Error moving file from ${sourcePath} to ${destinationPath}:`, error);
    return {
      success: false,
      error: `Failed to move file: ${error.message}`
    };
  }
};

// Clean up temporary files older than specified minutes
const cleanupTempFiles = async (tempDir = 'temp', olderThanMinutes = 60) => {
  try {
    const tempPath = path.join(uploadBasePath, tempDir);
    
    // Check if temp directory exists
    try {
      await fs.access(tempPath);
    } catch (error) {
      return { success: true, message: 'Temp directory does not exist' };
    }
    
    const files = await fs.readdir(tempPath);
    const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(tempPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        await deleteFile(filePath);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      message: `Cleaned up ${deletedCount} temporary files`
    };
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    return {
      success: false,
      error: `Failed to cleanup temp files: ${error.message}`
    };
  }
};

// Validate file integrity (basic checks)
const validateFileIntegrity = async (filePath) => {
  try {
    // Check if file exists and is readable
    const stats = await fs.stat(filePath);
    
    if (!stats.isFile()) {
      return { isValid: false, error: 'Path is not a file' };
    }
    
    if (stats.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }
    
    // Check if file is readable
    await fs.access(filePath, fsSync.constants.R_OK);
    
    return {
      isValid: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      isValid: false,
      error: `File integrity check failed: ${error.message}`
    };
  }
};

// Get file information
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const extension = getFileExtension(filePath);
    const size = getFileSize(stats.size);
    
    return {
      success: true,
      info: {
        name: path.basename(filePath),
        extension: extension.substring(1), // Remove dot
        size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get file info: ${error.message}`
    };
  }
};

// Initialize upload directories
const initializeUploadDirectories = async () => {
  const directories = ['documents', 'images', 'temp', 'profiles'];
  
  try {
    for (const dir of directories) {
      await createUploadDirectory(dir);
    }
    
    console.log('Upload directories initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing upload directories:', error);
    return {
      success: false,
      error: 'Failed to initialize upload directories'
    };
  }
};

module.exports = {
  generateUniqueFilename,
  validateFileType,
  getFileExtension,
  createUploadDirectory,
  deleteFile,
  getFileSize,
  sanitizeFileName,
  moveFile,
  cleanupTempFiles,
  validateFileIntegrity,
  getFileInfo,
  initializeUploadDirectories,
  fileTypes,
  mimeTypes,
  uploadBasePath
};
