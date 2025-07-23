const { body, validationResult } = require('express-validator');
const CustomError = require('../errors');

// Validation rules for creating a demande
const validateCreateDemande = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .escape(),

  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters')
    .escape(),

  body('requestedAmount')
    .isFloat({ min: 1, max: 1000000 })
    .withMessage('Requested amount must be between 1 and 1,000,000 DA'),

  body('category')
    .optional()
    .isIn([
      'emergency_assistance', 'educational_support', 'medical_assistance',
      'housing_support', 'food_assistance', 'employment_support',
      'elderly_care', 'disability_support', 'other'
    ])
    .withMessage('Invalid category provided'),

  body('urgencyLevel')
    .optional()
    .isIn(['routine', 'important', 'urgent', 'critical'])
    .withMessage('Invalid urgency level provided'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .escape(),

  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error =>
        `${error.param}: ${error.msg}`
      );
      throw new CustomError.BadRequestError(
        `Validation failed: ${errorMessages.join('; ')}`
      );
    }
    next();
  }
];

// User Registration Validation
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters and spaces'
      }),

    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters and spaces'
      }),

    email: Joi.string()
      .trim()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),

    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),

    phoneNumber: Joi.string()
      .trim()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),

    dateOfBirth: Joi.date()
      .max('now')
      .min('1900-01-01')
      .messages({
        'date.max': 'Date of birth cannot be in the future',
        'date.min': 'Please provide a valid date of birth'
      }),

    address: Joi.object({
      street: Joi.string().trim().max(100),
      city: Joi.string().trim().max(50),
      state: Joi.string().trim().max(50),
      zipCode: Joi.string().trim().max(20),
      country: Joi.string().trim().max(50)
    }),

    role: Joi.string()
      .valid('user', 'case_worker', 'finance_manager', 'admin')
      .default('user')
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) handleValidationError(error);

  req.body = sanitizeInput(value);
  next();
};

// User Login Validation
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .trim()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),

    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) handleValidationError(error);

  req.body = sanitizeInput(value);
  next();
};

// Budget Pool Validation
const validateBudgetPool = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Budget pool name must be at least 3 characters',
        'string.max': 'Budget pool name cannot exceed 100 characters'
      }),

    description: Joi.string()
      .trim()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 1000 characters'
      }),

    totalAmount: Joi.number()
      .positive()
      .max(10000000)
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Total amount must be greater than 0',
        'number.max': 'Total amount cannot exceed 10,000,000'
      }),

    fiscalYear: Joi.number()
      .integer()
      .min(2020)
      .max(2100)
      .required()
      .messages({
        'number.min': 'Fiscal year must be 2020 or later',
        'number.max': 'Fiscal year cannot exceed 2100'
      }),

    budgetPeriod: Joi.object({
      startDate: Joi.date()
        .required()
        .messages({
          'any.required': 'Budget start date is required'
        }),
      endDate: Joi.date()
        .greater(Joi.ref('startDate'))
        .required()
        .messages({
          'date.greater': 'End date must be after start date',
          'any.required': 'Budget end date is required'
        })
    }).required(),

    department: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Department must be at least 2 characters',
        'string.max': 'Department cannot exceed 100 characters'
      }),

    fundingSource: Joi.string()
      .trim()
      .max(200)
      .messages({
        'string.max': 'Funding source cannot exceed 200 characters'
      }),

    program: Joi.object({
      type: Joi.string()
        .valid('Content', 'Announcement'),
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid program ID format'
        })
    }),

    allocationRules: Joi.object({
      maxAmountPerDemande: Joi.number().positive(),
      requiresApproval: Joi.boolean(),
      eligibilityCriteria: Joi.array().items(Joi.string())
    })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) handleValidationError(error);

  req.body = sanitizeInput(value);
  next();
};

// Payment Validation
const validatePayment = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number()
      .positive()
      .max(1000000)
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Payment amount must be greater than 0',
        'number.max': 'Payment amount cannot exceed 1,000,000'
      }),

    paymentMethod: Joi.string()
      .valid('bank_transfer', 'check', 'cash', 'mobile_money', 'card')
      .required()
      .messages({
        'any.only': 'Payment method must be one of: bank_transfer, check, cash, mobile_money, card'
      }),

    demandeId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid demande ID format'
      }),

    budgetPool: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Invalid budget pool ID format'
      }),

    recipient: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      accountNumber: Joi.string().trim().when('..paymentMethod', {
        is: 'bank_transfer',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      bankName: Joi.string().trim().when('..paymentMethod', {
        is: 'bank_transfer',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      phoneNumber: Joi.string().trim().when('..paymentMethod', {
        is: 'mobile_money',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    }).required(),

    scheduledDate: Joi.date()
      .min('now')
      .messages({
        'date.min': 'Scheduled date cannot be in the past'
      }),

    description: Joi.string()
      .trim()
      .max(500)
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),

    reference: Joi.string()
      .trim()
      .max(100)
      .messages({
        'string.max': 'Reference cannot exceed 100 characters'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) handleValidationError(error);

  req.body = sanitizeInput(value);
  next();
};

// Content Validation
const validateContent = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .trim()
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.min': 'Content name must be at least 3 characters',
        'string.max': 'Content name cannot exceed 200 characters'
      }),

    description: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 2000 characters'
      }),

    contentType: Joi.string()
      .valid('program', 'service', 'benefit', 'assistance', 'training', 'other')
      .required()
      .messages({
        'any.only': 'Content type must be one of: program, service, benefit, assistance, training, other'
      }),

    category: Joi.string()
      .valid('medical', 'education', 'housing', 'food', 'employment', 'disability', 'elderly', 'child_welfare', 'other')
      .required(),

    eligibilityRequirements: Joi.array().items(
      Joi.object({
        requirement: Joi.string().trim().min(3).max(200).required(),
        type: Joi.string().valid('income', 'age', 'family_size', 'employment', 'disability', 'other').required(),
        value: Joi.alternatives().try(
          Joi.string().trim(),
          Joi.number(),
          Joi.boolean()
        ),
        operator: Joi.string().valid('equals', 'greater_than', 'less_than', 'between', 'contains').default('equals')
      })
    ).required(),

    benefitAmount: Joi.object({
      type: Joi.string().valid('fixed', 'percentage', 'range', 'calculated').required(),
      value: Joi.number().positive().when('type', {
        is: Joi.valid('fixed', 'percentage'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      minValue: Joi.number().positive().when('type', {
        is: 'range',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      maxValue: Joi.number().positive().when('type', {
        is: 'range',
        then: Joi.required().greater(Joi.ref('minValue')),
        otherwise: Joi.optional()
      })
    }),

    applicationPeriod: Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().greater(Joi.ref('startDate')).required(),
      isOpenEnded: Joi.boolean().default(false)
    }),

    requiredDocuments: Joi.array().items(
      Joi.string().trim().min(2).max(100)
    ),

    processingTime: Joi.object({
      estimated: Joi.number().integer().positive().required(),
      unit: Joi.string().valid('days', 'weeks', 'months').default('days')
    }),

    contactInfo: Joi.object({
      department: Joi.string().trim().max(100),
      email: Joi.string().email(),
      phone: Joi.string().trim(),
      office: Joi.string().trim().max(200)
    }),

    tags: Joi.array().items(
      Joi.string().trim().min(2).max(50)
    ).max(10),

    priority: Joi.number().integer().min(1).max(10).default(5),

    isActive: Joi.boolean().default(true)
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) handleValidationError(error);

  req.body = sanitizeInput(value);
  next();
};

// Announcement Validation
const validateAnnouncement = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string()
      .trim()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Title must be at least 5 characters',
        'string.max': 'Title cannot exceed 200 characters'
      }),

    description: Joi.string()
      .trim()
      .min(20)
      .max(2000)
      .required()
      .messages({
        'string.min': 'Description must be at least 20 characters',
        'string.max': 'Description cannot exceed 2000 characters'
      }),

    type: Joi.string()
      .valid('event', 'program', 'service', 'opportunity', 'notice')
      .required(),

    targetAudience: Joi.string()
      .valid('all', 'students', 'families', 'elderly', 'disabled', 'unemployed', 'specific')
      .required(),

    eligibilityCriteria: Joi.array().items(
      Joi.string().trim().min(3).max(200)
    ),

    applicationDeadline: Joi.date()
      .greater('now')
      .messages({
        'date.greater': 'Application deadline must be in the future'
      }),

    maxParticipants: Joi.number()
      .integer()
      .min(1)
      .max(10000)
      .messages({
        'number.min': 'Maximum participants must be at least 1',
        'number.max': 'Maximum participants cannot exceed 10,000'
      }),

    requirements: Joi.array().items(
      Joi.string().trim().min(3).max(200)
    ),

    benefits: Joi.array().items(
      Joi.string().trim().min(3).max(200)
    ),

    location: Joi.object({
      address: Joi.string().trim().max(200),
      city: Joi.string().trim().max(50),
      venue: Joi.string().trim().max(100),
      isOnline: Joi.boolean().default(false),
      onlineLink: Joi.string().uri().when('isOnline', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    }),

    contactInfo: Joi.object({
      email: Joi.string().email(),
      phone: Joi.string().trim(),
      department: Joi.string().trim().max(100),
      contactPerson: Joi.string().trim().max(100)
    })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) handleValidationError(error);

  req.body = sanitizeInput(value);
  next();
};

module.exports = {
  validateCreateDemande,
  validateRegister,
  validateLogin,
  validateBudgetPool,
  validatePayment,
  validateContent,
  validateAnnouncement
};
