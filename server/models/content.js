const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  // Content Identification
  contentNumber: {
    type: String,
    unique: true
  },
  
  name: {
    type: String,
    required: [true, 'Content name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  
  title: {
    type: String,
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  text: {
    type: String,
    trim: true,
    maxlength: [10000, 'Text content cannot exceed 10000 characters']
  },
  
  // Content Type & Hierarchy
  contentType: {
    type: String,
    enum: ['programme', 'chapitre', 'sous_chapitre', 'article'],
    required: [true, 'Content type is required']
  },
  
  // Hierarchical Structure
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    validate: {
      validator: function(v) {
        // Validation logic will be handled in controllers
        return true;
      }
    }
  },
  
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  
  // Hierarchy Path (for easier querying)
  path: {
    type: String,
    index: true
  },
  
  level: {
    type: Number,
    min: [0, 'Level cannot be negative'],
    max: [10, 'Level cannot exceed 10'],
    default: 0
  },
  
  // Content Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived', 'deleted'],
    default: 'draft'
  },
  
  // Visibility & Access
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  
  accessRoles: [{
    type: String,
    enum: ['admin', 'user', 'case_worker', 'finance_manager']
  }],
  
  // Content Metadata
  metadata: {
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    
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
        'general',
        'administrative'
      ],
      default: 'general'
    },
    
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    
    language: {
      type: String,
      enum: ['ar', 'fr', 'en'],
      default: 'ar'
    }
  },
  
  // Associated Budget Pool
  budgetPool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BudgetPool'
  },
  
  // Eligibility & Requirements
  eligibilityRequirements: {
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
    
    maxIncome: {
      type: Number,
      min: [0, 'Maximum income cannot be negative']
    },
    
    familySizeMin: {
      type: Number,
      min: [1, 'Minimum family size must be at least 1']
    },
    
    familySizeMax: {
      type: Number,
      min: [1, 'Maximum family size must be at least 1']
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
        'other'
      ]
    }],
    
    eligibilityScore: {
      type: Number,
      min: [0, 'Eligibility score cannot be negative'],
      max: [100, 'Eligibility score cannot exceed 100'],
      default: 50
    }
  },
  
  // Program-specific Configuration
  programConfig: {
    maxBeneficiaries: {
      type: Number,
      min: [1, 'Max beneficiaries must be at least 1']
    },
    
    currentBeneficiaries: {
      type: Number,
      default: 0,
      min: [0, 'Current beneficiaries cannot be negative']
    },
    
    applicationDeadline: Date,
    
    programStartDate: Date,
    
    programEndDate: Date,
    
    renewalPeriod: {
      type: Number, // days
      min: [1, 'Renewal period must be at least 1 day']
    },
    
    maxAmountPerBeneficiary: {
      type: Number,
      min: [0, 'Max amount per beneficiary cannot be negative']
    }
  },
  
  // Content Order & Display
  sortOrder: {
    type: Number,
    default: 0
  },
  
  isPromoted: {
    type: Boolean,
    default: false
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
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
  
  // Analytics
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    requestCount: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    popularityScore: {
      type: Number,
      default: 0
    }
  },
  
  // Publishing Information
  publishedAt: Date,
  
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
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
ContentSchema.index({ contentNumber: 1 });
ContentSchema.index({ contentType: 1, status: 1 });
ContentSchema.index({ parent: 1, sortOrder: 1 });
ContentSchema.index({ path: 1 });
ContentSchema.index({ 'metadata.category': 1, status: 1 });
ContentSchema.index({ 'seo.slug': 1 });
ContentSchema.index({ level: 1, displayOrder: 1 });
ContentSchema.index({ publishedAt: -1, status: 1 });
ContentSchema.index({ isDeleted: 1 });

// Text search index
ContentSchema.index({
  name: 'text',
  title: 'text',
  description: 'text',
  text: 'text',
  'seo.keywords': 'text'
});

// Compound indexes
ContentSchema.index({
  contentType: 1,
  'metadata.category': 1,
  status: 1
});

ContentSchema.index({
  parent: 1,
  level: 1,
  sortOrder: 1
});

// Generate content number and slug
ContentSchema.pre('save', function(next) {
  // Generate content number
  if (this.isNew && !this.contentNumber) {
    const typePrefix = this.contentType.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.contentNumber = `${typePrefix}-${year}-${random}`;
  }
  
  // Generate slug if not provided
  if (!this.seo.slug && this.name) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Update path for hierarchy
  if (this.isModified('parent') || this.isNew) {
    this.updatePath();
  }
  
  next();
});

// Instance Methods
ContentSchema.methods.updatePath = function() {
  if (this.parent) {
    // Path will be updated by controller logic
    this.level = (this.parent.level || 0) + 1;
  } else {
    this.path = this._id.toString();
    this.level = 0;
  }
};

// Virtuals
ContentSchema.virtual('isPublished').get(function() {
  return this.status === 'active' && this.publishedAt && this.publishedAt <= new Date();
});

ContentSchema.virtual('hasChildren').get(function() {
  return this.children && this.children.length > 0;
});

ContentSchema.virtual('canHaveChildren').get(function() {
  return ['programme', 'chapitre', 'sous_chapitre'].includes(this.contentType);
});

ContentSchema.virtual('isProgramActive').get(function() {
  if (!this.programConfig.programStartDate || !this.programConfig.programEndDate) {
    return true; // No date restrictions
  }
  
  const now = new Date();
  return now >= this.programConfig.programStartDate && now <= this.programConfig.programEndDate;
});

ContentSchema.virtual('spotsRemaining').get(function() {
  if (!this.programConfig.maxBeneficiaries) return null;
  return this.programConfig.maxBeneficiaries - (this.programConfig.currentBeneficiaries || 0);
});

ContentSchema.virtual('fullPath').get(function() {
  // This will be populated by controller when needed
  return this.path;
});

// Exclude soft deleted
ContentSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Content', ContentSchema);