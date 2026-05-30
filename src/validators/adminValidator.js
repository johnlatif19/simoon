// ============================================
// Admin Validator
// رحلة في مصر - Journey in Egypt
// ============================================

const { body, param, query, validationResult } = require('express-validator');

// ============================================
// User Management Validators
// ============================================

/**
 * Validation rules for creating a new admin/user
 */
const validateCreateAdmin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('اسم المستخدم مطلوب')
    .isLength({ min: 3, max: 50 })
    .withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('اسم المستخدم يمكن أن يحتوي فقط على حروف وأرقام وشرطة سفلية'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6, max: 100 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل'),
  
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('الدور غير صالح. الأدوار المتاحة: admin, editor, viewer'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^(01)[0125][0-9]{8}$/)
    .withMessage('رقم الهاتف غير صالح')
];

/**
 * Validation rules for updating user
 */
const validateUpdateUser = [
  param('id')
    .notEmpty()
    .withMessage('معرف المستخدم مطلوب')
    .isString()
    .withMessage('معرف المستخدم غير صالح'),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('اسم المستخدم يمكن أن يحتوي فقط على حروف وأرقام وشرطة سفلية'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('الدور غير صالح'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('الحالة غير صالحة'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^(01)[0125][0-9]{8}$/)
    .withMessage('رقم الهاتف غير صالح'),
  
  body('password')
    .optional()
    .isLength({ min: 6, max: 100 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
];

/**
 * Validation rules for getting user by ID
 */
const validateGetUserById = [
  param('id')
    .notEmpty()
    .withMessage('معرف المستخدم مطلوب')
    .isString()
    .withMessage('معرف المستخدم غير صالح')
];

/**
 * Validation rules for getting all users
 */
const validateGetAllUsers = [
  query('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer', 'user'])
    .withMessage('الدور غير صالح'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('الحالة غير صالحة'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر غير صالح')
    .toInt(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة غير صالح')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'username', 'email', 'role', 'lastLoginAt'])
    .withMessage('حقل الترتيب غير صالح'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('اتجاه الترتيب غير صالح')
];

// ============================================
// Email Validators
// ============================================

/**
 * Validation rules for sending email
 */
const validateSendEmail = [
  body('to')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني المستلم مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني المستلم غير صالح')
    .normalizeEmail(),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('الموضوع مطلوب')
    .isLength({ min: 3, max: 200 })
    .withMessage('الموضوع يجب أن يكون بين 3 و 200 حرف'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('الرسالة مطلوبة')
    .isLength({ min: 10, max: 5000 })
    .withMessage('الرسالة يجب أن تكون بين 10 و 5000 حرف'),
  
  body('html')
    .optional()
    .isBoolean()
    .withMessage('html يجب أن يكون true/false')
];

// ============================================
// System Logs Validators
// ============================================

/**
 * Validation rules for getting system logs
 */
const validateGetLogs = [
  query('type')
    .optional()
    .isIn(['combined', 'error'])
    .withMessage('نوع السجل غير صالح'),
  
  query('lines')
    .optional()
    .isInt({ min: 10, max: 1000 })
    .withMessage('عدد الأسطر يجب أن يكون بين 10 و 1000')
    .toInt(),
  
  query('level')
    .optional()
    .isIn(['ERROR', 'WARN', 'INFO', 'DEBUG'])
    .withMessage('مستوى السجل غير صالح')
];

// ============================================
// Dashboard Statistics Validators
// ============================================

/**
 * Validation rules for dashboard stats
 */
const validateDashboardStats = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year', 'all'])
    .withMessage('الفترة غير صالحة'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية غير صالح'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية غير صالح')
    .custom((value, { req }) => {
      if (req.query.startDate && value < req.query.startDate) {
        throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      }
      return true;
    })
];

// ============================================
// Helper Functions
// ============================================

/**
 * Validation error formatter
 * @param {Object} req - Express request
 * @returns {Object|null} Formatted errors
 */
function getValidationErrors(req) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  
  return {
    success: false,
    errors: errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }))
  };
}

/**
 * Middleware wrapper for validation
 * @param {Array} validations - Validation rules
 * @returns {Array} Middleware array
 */
function validate(validations) {
  return [
    ...validations,
    (req, res, next) => {
      const errors = getValidationErrors(req);
      if (errors) {
        return res.status(400).json(errors);
      }
      next();
    }
  ];
}

// Export all admin validators
module.exports = {
  // User management
  validateCreateAdmin,
  validateUpdateUser,
  validateGetUserById,
  validateGetAllUsers,
  
  // Email
  validateSendEmail,
  
  // System
  validateGetLogs,
  
  // Dashboard
  validateDashboardStats,
  
  // Helpers
  getValidationErrors,
  validate
};