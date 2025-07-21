const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  // Payment Identification
  paymentNumber: {
    type: String,
    unique: true
  },
  
  // Financial Information
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0'],
    max: [1000000, 'Payment amount cannot exceed 1,000,000 DA']
  },
  
  currency: {
    type: String,
    default: 'DZD',
    enum: ['DZD', 'USD', 'EUR']
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: [
      'bank_transfer',
      'check',
      'cash',
      'mobile_payment',
      'card',
      'other'
    ],
    required: [true, 'Payment method is required']
  },
  
  // Related Entities
  demande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Demande',
    required: [true, 'Related request is required']
  },
  
  budgetPool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BudgetPool',
    required: [true, 'Budget pool is required']
  },
  
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payment recipient is required']
  },
  
  // Payment Status
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'on_hold'
    ],
    default: 'pending'
  },
  
  // Processing Information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  processedAt: Date,
  
  scheduledDate: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return v >= new Date();
      },
      message: 'Scheduled date cannot be in the past'
    }
  },
  
  completedAt: Date,
  
  // Bank/Financial Details
  bankDetails: {
    accountNumber: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^\d{10,20}$/.test(v);
        },
        message: 'Account number must be 10-20 digits'
      }
    },
    
    bankName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    
    branchCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    
    routingNumber: {
      type: String,
      trim: true,
      maxlength: 20
    },
    
    accountHolderName: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  
  // Check Details (if payment method is check)
  checkDetails: {
    checkNumber: {
      type: String,
      trim: true,
      maxlength: 50
    },
    
    issuedDate: Date,
    
    bankName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    
    memo: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  
  // Transaction References
  transactionId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  externalReference: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Documents & Proof
  documents: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    documentType: {
      type: String,
      enum: [
        'receipt',
        'invoice',
        'bank_statement',
        'check_copy',
        'proof_of_payment',
        'other'
      ],
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Error Handling
  errorDetails: {
    errorCode: String,
    errorMessage: String,
    errorDate: Date,
    retryCount: {
      type: Number,
      default: 0,
      max: 5
    }
  },
  
  // Approval Workflow
  approvals: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    decision: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true
    },
    approvedAt: {
      type: Date,
      default: Date.now
    },
    comments: {
      type: String,
      maxlength: 500
    }
  }],
  
  isFullyApproved: {
    type: Boolean,
    default: false
  },
  
  // Notes & Communication
  internalNotes: {
    type: String,
    maxlength: 1000
  },
  
  recipientNotes: {
    type: String,
    maxlength: 500
  },
  
  // Refund Information
  refundDetails: {
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    refundReason: {
      type: String,
      maxlength: 500
    },
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundMethod: {
      type: String,
      enum: ['bank_transfer', 'check', 'cash', 'original_method']
    }
  },
  
  // Taxes & Fees
  fees: {
    processingFee: {
      type: Number,
      default: 0,
      min: [0, 'Processing fee cannot be negative']
    },
    
    bankFee: {
      type: Number,
      default: 0,
      min: [0, 'Bank fee cannot be negative']
    },
    
    totalFees: {
      type: Number,
      default: 0,
      min: [0, 'Total fees cannot be negative']
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
PaymentSchema.index({ paymentNumber: 1 });
PaymentSchema.index({ demande: 1 });
PaymentSchema.index({ recipient: 1, createdAt: -1 });
PaymentSchema.index({ budgetPool: 1, status: 1 });
PaymentSchema.index({ status: 1, scheduledDate: 1 });
PaymentSchema.index({ paymentMethod: 1, status: 1 });
PaymentSchema.index({ processedAt: 1 });
PaymentSchema.index({ isDeleted: 1 });

// Generate payment number
PaymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.paymentNumber = `PAY-${year}${month}-${random}`;
  }
  
  // Calculate total fees
  if (this.isModified('fees.processingFee') || this.isModified('fees.bankFee')) {
    this.fees.totalFees = (this.fees.processingFee || 0) + (this.fees.bankFee || 0);
  }
  
  next();
});

// Virtuals
PaymentSchema.virtual('netAmount').get(function() {
  return this.amount - (this.fees.totalFees || 0);
});

PaymentSchema.virtual('isOverdue').get(function() {
  if (!this.scheduledDate) return false;
  return this.scheduledDate < new Date() && !['completed', 'cancelled', 'failed'].includes(this.status);
});

PaymentSchema.virtual('daysSinceScheduled').get(function() {
  if (!this.scheduledDate) return 0;
  const diffTime = Date.now() - this.scheduledDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

PaymentSchema.virtual('processingTime').get(function() {
  if (!this.processedAt || !this.createdAt) return null;
  return this.processedAt.getTime() - this.createdAt.getTime();
});


// Exclude soft deleted
PaymentSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);