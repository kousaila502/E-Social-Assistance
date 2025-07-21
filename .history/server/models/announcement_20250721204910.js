const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  // Announcement Identification
  announcementNumber: {
    type: String,
    unique: true
  },
  
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Announcement description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // Announcement Type
  type: {
  type: String,
  required: true,
  enum: ['event', 'program', 'service', 'opportunity', 'notice']
}
  
  // Priority & Urgency
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'expired', 'cancelled', 'archived'],
    default: 'draft'
  },
  
  // Publishing & Scheduling
  publishedAt: Date,
  
  scheduledPublishAt: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return v > new Date();
      },
      message: 'Scheduled publish date must be in the future'
    }
  },
  
  expiresAt: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return !this.publishedAt || v > this.publishedAt;
      },
      message: 'Expiration date must be after publish date'
    }
  },
  
  // Target Audience
  targetAudience: {
    userTypes: [{
      type: String,
      enum: ['all', 'admin', 'user', 'case_worker', 'finance_manager']
    }],
    
    categories: [{
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
        'all'
      ]
    }],
    
    eligibilityCategories: [{
      type: String,
      enum: ['low_income', 'large_family', 'disabled', 'elderly', 'unemployed', 'student']
    }],
    
    minAge: {
      type: Number,
      min: [0, 'Minimum age cannot be negative'],
      max: [120, 'Minimum age cannot exceed 120']
    },
    
    maxAge: {
      type: Number,
      min: [0, 'Maximum age cannot be negative'],
      max: [120, 'Maximum age cannot exceed 120']
    },
    
    locations: [{
      wilaya: String,
      city: String
    }]
  },
  
  // Application/Registration System
  applicationConfig: {
    allowsApplications: {
      type: Boolean,
      default: false
    },
    
    applicationDeadline: {
      type: Date,
      validate: {
        validator: function(v) {
          if (!v || !this.applicationConfig.allowsApplications) return true;
          return v > new Date();
        },
        message: 'Application deadline must be in the future'
      }
    },
    
    maxApplicants: {
      type: Number,
      min: [1, 'Max applicants must be at least 1']
    },
    
    currentApplicants: {
      type: Number,
      default: 0,
      min: [0, 'Current applicants cannot be negative']
    },
    
    requiresDocuments: {
      type: Boolean,
      default: false
    },
    
    requiredDocuments: [{
      type: String,
      enum: [
        'national_id',
        'income_proof',
        'family_composition',
        'residence_proof',
        'medical_certificate',
        'employment_certificate',
        'cv',
        'diploma',
        'other'
      ]
    }],
    
    autoAcceptance: {
      type: Boolean,
      default: false
    },
    
    selectionCriteria: {
      type: String,
      maxlength: 1000
    }
  },
  
  // Participants Management
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    status: {
      type: String,
      enum: ['applied', 'pending', 'accepted', 'rejected', 'withdrawn', 'completed'],
      default: 'applied'
    },
    
    appliedAt: {
      type: Date,
      default: Date.now
    },
    
    reviewedAt: Date,
    
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    reviewNotes: {
      type: String,
      maxlength: 500
    },
    
    documents: [{
      filename: String,
      originalName: String,
      documentType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    eligibilityScore: {
      type: Number,
      min: [0, 'Eligibility score cannot be negative'],
      max: [100, 'Eligibility score cannot exceed 100']
    },
    
    rejectionReason: {
      type: String,
      maxlength: 500
    }
  }],
  
  // Media & Attachments
  media: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'document', 'video', 'audio'],
      required: true
    },
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Contact Information
  contactInfo: {
    contactPerson: {
      type: String,
      trim: true,
      maxlength: 100
    },
    
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    
    phone: {
      type: String,
      trim: true
    },
    
    office: {
      type: String,
      trim: true,
      maxlength: 200
    },
    
    workingHours: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  
  // Notification Settings
  notificationSettings: {
    sendEmailNotification: {
      type: Boolean,
      default: true
    },
    
    sendSMSNotification: {
      type: Boolean,
      default: false
    },
    
    sendPushNotification: {
      type: Boolean,
      default: true
    },
    
    notifyOnApplication: {
      type: Boolean,
      default: true
    },
    
    reminderDays: {
      type: Number,
      min: [1, 'Reminder days must be at least 1'],
      max: [30, 'Reminder days cannot exceed 30']
    }
  },
  
  // Analytics & Engagement
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    
    applicationCount: {
      type: Number,
      default: 0
    },
    
    acceptanceRate: {
      type: Number,
      default: 0,
      min: [0, 'Acceptance rate cannot be negative'],
      max: [100, 'Acceptance rate cannot exceed 100']
    },
    
    averageProcessingDays: {
      type: Number,
      default: 0
    },
    
    lastViewed: Date,
    
    popularityScore: {
      type: Number,
      default: 0
    }
  },
  
  // Tags & Categories
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  category: {
    type: String,
    enum: [
      'employment',
      'benefits',
      'programs',
      'events',
      'deadlines',
      'system',
      'general'
    ],
    default: 'general'
  },
  
  // SEO & Search
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    }
  },
  
  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
AnnouncementSchema.index({ announcementNumber: 1 });
AnnouncementSchema.index({ status: 1, priority: 1 });
AnnouncementSchema.index({ announcementType: 1, status: 1 });
AnnouncementSchema.index({ publishedAt: -1, status: 1 });
AnnouncementSchema.index({ expiresAt: 1, status: 1 });
AnnouncementSchema.index({ scheduledPublishAt: 1, status: 1 });
AnnouncementSchema.index({ 'applicationConfig.applicationDeadline': 1 });
AnnouncementSchema.index({ 'participants.user': 1, 'participants.status': 1 });
AnnouncementSchema.index({ category: 1, isUrgent: 1 });
AnnouncementSchema.index({ isDeleted: 1 });

// Text search index
AnnouncementSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'seo.keywords': 'text'
});

// Generate announcement number and slug
AnnouncementSchema.pre('save', function(next) {
  // Generate announcement number
  if (this.isNew && !this.announcementNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.announcementNumber = `ANN-${year}${month}-${random}`;
  }
  
  // Generate slug if not provided
  if (!this.seo.slug && this.title) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Update analytics
  if (this.isModified('participants')) {
    this.updateAnalytics();
  }
  
  next();
});

// Instance Methods
AnnouncementSchema.methods.updateAnalytics = function() {
  if (this.participants && this.participants.length > 0) {
    this.analytics.applicationCount = this.participants.length;
    
    const acceptedCount = this.participants.filter(p => p.status === 'accepted').length;
    if (this.analytics.applicationCount > 0) {
      this.analytics.acceptanceRate = (acceptedCount / this.analytics.applicationCount) * 100;
    }
  }
};

// Virtuals
AnnouncementSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         (!this.expiresAt || this.expiresAt > now);
});

AnnouncementSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

AnnouncementSchema.virtual('daysUntilExpiration').get(function() {
  if (!this.expiresAt || this.isExpired) return 0;
  const diffTime = this.expiresAt.getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

AnnouncementSchema.virtual('applicationSpotsRemaining').get(function() {
  if (!this.applicationConfig.maxApplicants) return null;
  return this.applicationConfig.maxApplicants - (this.applicationConfig.currentApplicants || 0);
});

AnnouncementSchema.virtual('applicationDeadlinePassed').get(function() {
  return this.applicationConfig.applicationDeadline && 
         this.applicationConfig.applicationDeadline < new Date();
});

AnnouncementSchema.virtual('canApply').get(function() {
  return this.applicationConfig.allowsApplications &&
         !this.applicationDeadlinePassed &&
         this.isActive &&
         (!this.applicationConfig.maxApplicants || this.applicationSpotsRemaining > 0);
});

// Exclude soft deleted
AnnouncementSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);