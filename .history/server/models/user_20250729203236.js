const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    }
  },
  
  phoneNumber: {
  type: String,
  required: [true, 'Phone number is required'],
  trim: true,
  validate: {
    validator: function(v) {
      // Remove spaces, dashes, and parentheses
      const cleaned = v.replace(/[\s-()]/g, '');
      
      // Check for Algerian local format: starts with 0 and has exactly 10 digits
      const localFormat = /^0\d{9}$/.test(cleaned);
      
      // Check for international format: +213 followed by exactly 9 digits (total 12 after +)
      const internationalFormat = /^\+213\d{9}$/.test(cleaned);
      
      return localFormat || internationalFormat;
    },
    message: 'Phone number must be either 10 digits starting with 0 (e.g., 0xxxxxxxxx) or international format +213xxxxxxxxx'
  }
},
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  role: {
    type: String,
    enum: ['admin', 'user', 'case_worker', 'finance_manager'],
    default: 'user'
  },
  
  // Personal Information
  personalInfo: {
    dateOfBirth: Date,
    nationalId: {
      type: String,
      sparse: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^\d{18}$/.test(v);
        },
        message: 'National ID must be 18 digits'
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    },
    address: {
      street: String,
      city: String,
      wilaya: String,
      postalCode: {
        type: String,
        validate: {
          validator: function(v) {
            if (!v) return true;
            return /^\d{5}$/.test(v);
          },
          message: 'Postal code must be 5 digits'
        }
      },
      country: { type: String, default: 'Algeria' }
    }
  },
  
  // Family & Economic Information
  economicInfo: {
    familySize: {
      type: Number,
      min: [1, 'Family size must be at least 1'],
      default: 1
    },
    dependents: {
      type: Number,
      min: [0, 'Dependents cannot be negative'],
      default: 0
    },
    monthlyIncome: {
      type: Number,
      min: [0, 'Income cannot be negative'],
      default: 0
    },
    employmentStatus: {
      type: String,
      enum: ['employed', 'unemployed', 'self_employed', 'retired', 'student', 'disabled'],
      default: 'unemployed'
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed'],
      default: 'single'
    }
  },
  
  // Eligibility Status
  eligibility: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'requires_update'],
      default: 'pending'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastVerificationDate: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    categories: [{
      type: String,
      enum: ['low_income', 'large_family', 'disabled', 'elderly', 'unemployed', 'student']
    }]
  },
  
  // Document Status
  documents: {
    nationalIdCard: {
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      fileUrl: String,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    incomeProof: {
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      fileUrl: String,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    familyComposition: {
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      fileUrl: String,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    residenceProof: {
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      fileUrl: String,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },

  // reset password Tokens
  resetPasswordToken: {
  type: String,
  select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['ar', 'fr', 'en'],
      default: 'ar'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  // Audit Fields
  lastLoginAt: Date,
  createdBy: {
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
UserSchema.index({ email: 1 });
UserSchema.index({ 'personalInfo.nationalId': 1 });
UserSchema.index({ role: 1, accountStatus: 1 });
UserSchema.index({ 'eligibility.status': 1 });
UserSchema.index({ isDeleted: 1 });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Basic methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 1000 * 60 * 10;

  return resetToken;
};

UserSchema.methods.calculateEligibilityScore = function() {
  let score = 0;
  
  // Income scoring
  if (this.economicInfo.monthlyIncome < 20000) score += 30;
  else if (this.economicInfo.monthlyIncome < 40000) score += 20;
  else if (this.economicInfo.monthlyIncome < 60000) score += 10;
  
  // Family size
  if (this.economicInfo.familySize >= 5) score += 20;
  else if (this.economicInfo.familySize >= 3) score += 10;
  
  // Employment status
  if (this.economicInfo.employmentStatus === 'unemployed') score += 25;
  else if (this.economicInfo.employmentStatus === 'disabled') score += 30;
  
  return Math.min(score, 100);
};

// Virtuals
UserSchema.virtual('age').get(function() {
  if (!this.personalInfo.dateOfBirth) return null;
  return Math.floor((Date.now() - this.personalInfo.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Exclude soft deleted
UserSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', UserSchema);