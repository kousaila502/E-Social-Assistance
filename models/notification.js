const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Notification Identification
  notificationNumber: {
    type: String,
    unique: true
  },
  
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Notification Type & Category
  type: {
    type: String,
    enum: [
      'system',
      'request_status',
      'payment',
      'announcement',
      'reminder',
      'alert',
      'welcome',
      'approval_required',
      'document_required',
      'deadline_approaching'
    ],
    required: [true, 'Notification type is required']
  },
  
  category: {
    type: String,
    enum: [
      'info',
      'success',
      'warning',
      'error',
      'urgent'
    ],
    default: 'info'
  },
  
  // Priority & Urgency
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal'
  },
  
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  // Recipient Information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification recipient is required']
  },
  
  // Delivery Channels
  channels: {
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date
    },
    
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      emailAddress: String,
      emailSubject: String,
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date,
      errorMessage: String
    },
    
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      phoneNumber: String,
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date,
      errorMessage: String
    },
    
    push: {
      enabled: {
        type: Boolean,
        default: false
      },
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      deviceTokens: [String],
      attempts: {
        type: Number,
        default: 0
      },
      lastAttempt: Date,
      errorMessage: String
    }
  },
  
  // Related Entities
  relatedEntities: {
    demande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Demande'
    },
    
    announcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement'
    },
    
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    
    budgetPool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BudgetPool'
    },
    
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Action & Interaction
  actionRequired: {
    type: Boolean,
    default: false
  },
  
  actionType: {
    type: String,
    enum: [
      'review_request',
      'approve_payment',
      'upload_document',
      'update_profile',
      'respond_to_message',
      'complete_application',
      'view_announcement',
      'none'
    ],
    default: 'none'
  },
  
  actionUrl: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  actionData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Status & Tracking
  status: {
    type: String,
    enum: [
      'pending',
      'sent',
      'delivered',
      'read',
      'clicked',
      'failed',
      'cancelled'
    ],
    default: 'pending'
  },
  
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: Date,
  
  isClicked: {
    type: Boolean,
    default: false
  },
  
  clickedAt: Date,
  
  // Scheduling
  scheduledFor: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return v >= new Date();
      },
      message: 'Scheduled time cannot be in the past'
    }
  },
  
  sentAt: Date,
  
  expiresAt: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return !this.scheduledFor || v > this.scheduledFor;
      },
      message: 'Expiration time must be after scheduled time'
    }
  },
  
  // Retry Logic
  maxRetries: {
    type: Number,
    default: 3,
    min: [0, 'Max retries cannot be negative'],
    max: [10, 'Max retries cannot exceed 10']
  },
  
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative']
  },
  
  retryAfter: Date,
  
  // Template & Personalization
  template: {
    templateId: String,
    templateName: String,
    variables: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  
  // Localization
  language: {
    type: String,
    enum: ['ar', 'fr', 'en'],
    default: 'ar'
  },
  
  // Batch Information
  batchId: {
    type: String,
    index: true
  },
  
  campaignId: {
    type: String,
    index: true
  },
  
  // Analytics & Tracking
  analytics: {
    deliveryTime: Number, // milliseconds
    readTime: Number, // milliseconds after delivery
    clickTime: Number, // milliseconds after read
    deviceInfo: {
      platform: String,
      browser: String,
      version: String
    },
    location: {
      ip: String,
      country: String,
      city: String
    }
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['system', 'admin', 'automatic', 'scheduled', 'trigger'],
      default: 'system'
    },
    
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    
    customData: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  
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
NotificationSchema.index({ notificationNumber: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ priority: 1, isRead: 1 });
NotificationSchema.index({ scheduledFor: 1, status: 1 });
NotificationSchema.index({ expiresAt: 1, status: 1 });
NotificationSchema.index({ batchId: 1 });
NotificationSchema.index({ campaignId: 1 });
NotificationSchema.index({ 'relatedEntities.demande': 1 });
NotificationSchema.index({ 'relatedEntities.announcement': 1 });
NotificationSchema.index({ isDeleted: 1 });

// Compound indexes
NotificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1
});

NotificationSchema.index({
  type: 1,
  category: 1,
  priority: 1
});

NotificationSchema.index({
  status: 1,
  scheduledFor: 1,
  retryAfter: 1
});

// Generate notification number
NotificationSchema.pre('save', function(next) {
  if (this.isNew && !this.notificationNumber) {
    const typePrefix = this.type.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.notificationNumber = `NOT-${typePrefix}-${year}${month}-${random}`;
  }
  
  // Update delivery tracking
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  if (this.isModified('isClicked') && this.isClicked && !this.clickedAt) {
    this.clickedAt = new Date();
  }
  
  next();
});

// Virtuals
NotificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

NotificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledFor && this.scheduledFor > new Date();
});

NotificationSchema.virtual('shouldRetry').get(function() {
  return this.status === 'failed' && 
         this.retryCount < this.maxRetries && 
         (!this.retryAfter || this.retryAfter <= new Date());
});

NotificationSchema.virtual('deliveryStatus').get(function() {
  const channels = this.channels;
  let delivered = 0;
  let total = 0;
  
  if (channels.inApp.enabled) {
    total++;
    if (channels.inApp.delivered) delivered++;
  }
  if (channels.email.enabled) {
    total++;
    if (channels.email.delivered) delivered++;
  }
  if (channels.sms.enabled) {
    total++;
    if (channels.sms.delivered) delivered++;
  }
  if (channels.push.enabled) {
    total++;
    if (channels.push.delivered) delivered++;
  }
  
  if (total === 0) return 'no_channels';
  if (delivered === 0) return 'not_delivered';
  if (delivered === total) return 'fully_delivered';
  return 'partially_delivered';
});

NotificationSchema.virtual('timeToRead').get(function() {
  if (!this.sentAt || !this.readAt) return null;
  return this.readAt.getTime() - this.sentAt.getTime();
});

NotificationSchema.virtual('timeToClick').get(function() {
  if (!this.readAt || !this.clickedAt) return null;
  return this.clickedAt.getTime() - this.readAt.getTime();
});

// Instance Methods
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

NotificationSchema.methods.markAsClicked = function() {
  this.isClicked = true;
  this.clickedAt = new Date();
  this.status = 'clicked';
  return this.save();
};

NotificationSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  if (this.retryCount >= this.maxRetries) {
    this.status = 'failed';
  } else {
    // Exponential backoff: 2^retryCount minutes
    const backoffMinutes = Math.pow(2, this.retryCount);
    this.retryAfter = new Date(Date.now() + backoffMinutes * 60 * 1000);
  }
  return this.save();
};

// Exclude soft deleted
NotificationSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);