const mongoose = require('mongoose');

const BudgetPoolSchema = new mongoose.Schema({
  // Pool Identification
  poolNumber: {
    type: String,
    unique: true
  },
  
  name: {
    type: String,
    required: [true, 'Budget pool name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Budget pool description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Financial Information
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
    max: [100000000, 'Total amount cannot exceed 100,000,000 DA']
  },
  
  allocatedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Allocated amount cannot be negative']
  },
  
  reservedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Reserved amount cannot be negative']
  },
  
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  
  // Program Association
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
  
  // Budget Period
  fiscalYear: {
    type: Number,
    required: [true, 'Fiscal year is required'],
    min: [2020, 'Fiscal year must be 2020 or later'],
    max: [2100, 'Fiscal year cannot exceed 2100']
  },
  
  budgetPeriod: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(v) {
          return !this.budgetPeriod.startDate || v > this.budgetPeriod.startDate;
        },
        message: 'End date must be after start date'
      }
    }
  },
  
  // Status Management
  status: {
    type: String,
    enum: [
      'draft',
      'active',
      'frozen',
      'depleted',
      'expired',
      'cancelled',
      'transferred'
    ],
    default: 'draft'
  },
  
  // Allocation Rules
  allocationRules: {
    maxAmountPerRequest: {
      type: Number,
      min: [0, 'Max amount per request cannot be negative']
    },
    
    maxRequestsPerUser: {
      type: Number,
      min: [1, 'Max requests per user must be at least 1'],
      max: [1000, 'Max requests per user cannot exceed 1000']
    },
    
    allowedCategories: [{
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
      ]
    }],
    
    eligibilityThreshold: {
      type: Number,
      min: [0, 'Eligibility threshold cannot be negative'],
      max: [100, 'Eligibility threshold cannot exceed 100'],
      default: 50
    },
    
    requiresApproval: {
      type: Boolean,
      default: true
    },
    
    autoApprovalLimit: {
      type: Number,
      min: [0, 'Auto approval limit cannot be negative'],
      default: 0
    }
  },
  
  // Allocation Tracking
  allocations: [{
    demande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Demande',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Allocation amount cannot be negative']
    },
    allocatedAt: {
      type: Date,
      default: Date.now
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['reserved', 'confirmed', 'paid', 'cancelled', 'refunded'],
      default: 'reserved'
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }],
  
  // Fund Transfers
  transfers: [{
    type: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Transfer amount cannot be negative']
    },
    fromPool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BudgetPool'
    },
    toPool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BudgetPool'
    },
    transferredAt: {
      type: Date,
      default: Date.now
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected'],
      default: 'pending'
    }
  }],
  
  // Alert Thresholds
  alertThresholds: {
    lowBalanceWarning: {
      type: Number,
      min: [0, 'Low balance warning cannot be negative'],
      max: [100, 'Low balance warning cannot exceed 100%'],
      default: 20
    },
    
    criticalBalanceAlert: {
      type: Number,
      min: [0, 'Critical balance alert cannot be negative'],
      max: [100, 'Critical balance alert cannot exceed 100%'],
      default: 5
    },
    
    expirationWarning: {
      type: Number,
      min: [1, 'Expiration warning must be at least 1 day'],
      max: [365, 'Expiration warning cannot exceed 365 days'],
      default: 30
    }
  },
  
  // Administrative Information
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Budget manager is required']
  },
  
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  
  fundingSource: {
    type: String,
    enum: ['government', 'donations', 'grants', 'internal', 'international', 'other'],
    required: [true, 'Funding source is required']
  },
  
  externalReference: {
    type: String,
    trim: true,
    maxlength: 100
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
BudgetPoolSchema.index({ poolNumber: 1 });
BudgetPoolSchema.index({ status: 1, fiscalYear: 1 });
BudgetPoolSchema.index({ managedBy: 1, status: 1 });
BudgetPoolSchema.index({ 'program.type': 1, 'program.id': 1 });
BudgetPoolSchema.index({ fiscalYear: 1, department: 1 });
BudgetPoolSchema.index({ 'budgetPeriod.endDate': 1, status: 1 });
BudgetPoolSchema.index({ isDeleted: 1 });

// Generate pool number
BudgetPoolSchema.pre('save', function(next) {
  if (this.isNew && !this.poolNumber) {
    const year = this.fiscalYear || new Date().getFullYear();
    const dept = this.department?.substring(0, 3).toUpperCase() || 'GEN';
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.poolNumber = `BP-${year}-${dept}-${random}`;
  }
  next();
});

// Instance method to process payment
BudgetPoolSchema.methods.processPayment = function(demandeId, amount, userId) {
  // Find the allocation
  const allocation = this.allocations.find(
    alloc => alloc.demande.toString() === demandeId.toString()
  );
  
  if (allocation) {
    allocation.status = 'paid';
  }
  
  // Update amounts
  this.spentAmount += amount;
  this.reservedAmount = Math.max(0, this.reservedAmount - amount);
  this.updatedBy = userId;
  
  return this.save();
};




// Virtuals
BudgetPoolSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.allocatedAmount - this.reservedAmount;
});

BudgetPoolSchema.virtual('availableAmount').get(function() {
  return this.totalAmount - this.spentAmount - this.reservedAmount;
});

BudgetPoolSchema.virtual('utilizationRate').get(function() {
  if (this.totalAmount === 0) return 0;
  return (this.spentAmount / this.totalAmount) * 100;
});

BudgetPoolSchema.virtual('isExpired').get(function() {
  return this.budgetPeriod.endDate < new Date();
});

BudgetPoolSchema.virtual('daysUntilExpiration').get(function() {
  if (this.isExpired) return 0;
  const diffTime = this.budgetPeriod.endDate.getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Exclude soft deleted
BudgetPoolSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('BudgetPool', BudgetPoolSchema);