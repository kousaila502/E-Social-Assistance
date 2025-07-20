const mongoose = require('mongoose');

const DemandeSchema = new mongoose.Schema({
  // Request Identification
  requestNumber: {
    type: String,
    unique: true
  },
  
  title: {
    type: String,
    required: [true, 'Request title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Request description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Program Reference
  program: {
    type: {
      type: String,
      enum: ['Content', 'Announcement'],
      required: [true, 'Program type is required']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Program ID is required'],
      refPath: 'program.type'
    }
  },
  
  // Financial Information
  requestedAmount: {
    type: Number,
    required: [true, 'Requested amount is required'],
    min: [1, 'Requested amount must be greater than 0'],
    max: [1000000, 'Requested amount cannot exceed 1,000,000 DA']
  },
  
  approvedAmount: {
    type: Number,
    min: [0, 'Approved amount cannot be negative'],
    max: [1000000, 'Approved amount cannot exceed 1,000,000 DA']
  },
  
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  
  // Status Management
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under_review',
      'pending_docs',
      'approved',
      'partially_paid',
      'paid',
      'rejected',
      'cancelled',
      'expired'
    ],
    default: 'draft'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  category: {
    type: String,
    enum: [
      'emergency_assistance',
      'educational_support',
      'medical_assistance',
      'housing_support',
      'food_assistance',
      'employment_support',
      'elderly_care',
      'disability_support',
      'other'
    ],
    default: 'other'
  },
  
  // User & Assignment
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant is required']
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Documents
  documents: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          return allowedTypes.includes(v);
        },
        message: 'File type not allowed'
      }
    },
    size: {
      type: Number,
      max: [10 * 1024 * 1024, 'File size cannot exceed 10MB']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  }],
  
  // Review Information
  reviewDetails: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: {
      type: String,
      maxlength: 2000
    },
    eligibilityScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // Rejection Information
  rejectionReason: {
    category: {
      type: String,
      enum: [
        'insufficient_documents',
        'not_eligible',
        'insufficient_funds',
        'duplicate_request',
        'policy_violation',
        'other'
      ]
    },
    description: {
      type: String,
      maxlength: 1000
    }
  },
  
  // Payment Reference
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // Deadlines
  submissionDeadline: Date,
  reviewDeadline: Date,
  paymentDeadline: Date,
  
  // Communication
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status History
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      maxlength: 500
    }
  }],
  
  // Additional Fields
  urgencyLevel: {
    type: String,
    enum: ['routine', 'important', 'urgent', 'critical'],
    default: 'routine'
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
DemandeSchema.index({ requestNumber: 1 });
DemandeSchema.index({ applicant: 1, createdAt: -1 });
DemandeSchema.index({ status: 1, priority: 1 });
DemandeSchema.index({ assignedTo: 1, status: 1 });
DemandeSchema.index({ category: 1, status: 1 });
DemandeSchema.index({ 'program.type': 1, 'program.id': 1 });
DemandeSchema.index({ isDeleted: 1 });

// Generate request number
DemandeSchema.pre('save', function(next) {
  if (this.isNew && !this.requestNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.requestNumber = `REQ-${year}${month}-${random}`;
  }
  next();
});

// Virtuals
DemandeSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  
  if (this.status === 'draft' && this.submissionDeadline && this.submissionDeadline < now) {
    return true;
  }
  
  if (['submitted', 'under_review'].includes(this.status) && this.reviewDeadline && this.reviewDeadline < now) {
    return true;
  }
  
  if (this.status === 'approved' && this.paymentDeadline && this.paymentDeadline < now) {
    return true;
  }
  
  return false;
});

DemandeSchema.virtual('completionRate').get(function() {
  if (this.status === 'paid') return 100;
  if (this.status === 'partially_paid' && this.approvedAmount > 0) {
    return (this.paidAmount / this.approvedAmount) * 100;
  }
  return 0;
});

// Exclude soft deleted
DemandeSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Demande', DemandeSchema);