const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const CustomError = require('../errors');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Generate unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(6).toString('hex');
  const extension = path.extname(originalname);
  const baseName = path.basename(originalname, extension);
  
  // Sanitize filename
  const sanitizedBaseName = baseName
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 50);
  
  return `${timestamp}_${randomBytes}_${sanitizedBaseName}${extension}`;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on file type
    let subDir = 'others';
    
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.includes('pdf') || 
               file.mimetype.includes('document') || 
               file.mimetype.includes('word')) {
      subDir = 'documents';
    }
    
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  }
});

// Document file filter
const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new CustomError.BadRequestError(
      'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, and CSV files are allowed.'
    ), false);
  }
};

// Image file filter
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new CustomError.BadRequestError(
      'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.'
    ), false);
  }
};

// Media file filter (documents + images)
const mediaFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'
  ];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new CustomError.BadRequestError(
      'Invalid file type. Only images (JPG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, XLS, XLSX, TXT, CSV) are allowed.'
    ), false);
  }
};

// Error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        throw new CustomError.BadRequestError('File size too large. Please upload a smaller file.');
      case 'LIMIT_FILE_COUNT':
        throw new CustomError.BadRequestError('Too many files. Maximum file limit exceeded.');
      case 'LIMIT_UNEXPECTED_FILE':
        throw new CustomError.BadRequestError('Unexpected file field. Please check your form configuration.');
      case 'LIMIT_PART_COUNT':
        throw new CustomError.BadRequestError('Too many form parts.');
      case 'LIMIT_FIELD_KEY':
        throw new CustomError.BadRequestError('Field name too long.');
      case 'LIMIT_FIELD_VALUE':
        throw new CustomError.BadRequestError('Field value too long.');
      case 'LIMIT_FIELD_COUNT':
        throw new CustomError.BadRequestError('Too many fields.');
      default:
        throw new CustomError.BadRequestError(`File upload error: ${error.message}`);
    }
  }
  
  if (error instanceof CustomError.BadRequestError) {
    throw error;
  }
  
  throw new CustomError.BadRequestError('File upload failed. Please try again.');
};

// Document upload configuration
const documentUpload = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Maximum 5 files
    fields: 10, // Maximum 10 non-file fields
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024, // Maximum field value size (1MB)
    parts: 20 // Maximum number of parts
  }
}).array('documents', 5);

// Image upload configuration
const imageUpload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 3, // Maximum 3 files
    fields: 10,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    parts: 15
  }
}).array('images', 3);

// Media upload configuration (documents + images)
const mediaUpload = multer({
  storage: storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // Maximum 10 files
    fields: 15,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    parts: 30
  }
}).array('media', 10);

// Single file upload configurations
const singleDocumentUpload = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
    fields: 10,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    parts: 10
  }
}).single('document');

const singleImageUpload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
    fields: 10,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    parts: 10
  }
}).single('image');

// Profile picture upload (smaller size)
const profilePictureUpload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
    files: 1,
    fields: 5,
    fieldNameSize: 50,
    fieldSize: 1024 * 100, // 100KB
    parts: 5
  }
}).single('profilePicture');

// Wrapper functions to handle errors properly
const wrapUploadMiddleware = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (error) => {
      if (error) {
        return handleMulterError(error, req, res, next);
      }
      
      // Add file information to request for logging
      if (req.files && req.files.length > 0) {
        req.uploadedFiles = req.files.map(file => ({
          originalName: file.originalname,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path
        }));
      } else if (req.file) {
        req.uploadedFile = {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path
        };
      }
      
      next();
    });
  };
};

// File cleanup utility
const cleanupFiles = (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log(`Cleaned up file: ${file.path}`);
      } catch (error) {
        console.error(`Failed to cleanup file ${file.path}:`, error.message);
      }
    }
  });
};

// Add specific configuration for user documents if needed
const uploadUserDocument = upload.single('document');

module.exports = {
  documentUpload: wrapUploadMiddleware(documentUpload),
  imageUpload: wrapUploadMiddleware(imageUpload),
  mediaUpload: wrapUploadMiddleware(mediaUpload),
  singleDocumentUpload: wrapUploadMiddleware(singleDocumentUpload),
  singleImageUpload: wrapUploadMiddleware(singleImageUpload),
  profilePictureUpload: wrapUploadMiddleware(profilePictureUpload),
  cleanupFiles,
  handleMulterError,
  uploadUserDocument
};
