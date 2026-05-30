// ============================================
// Auth Validator
// رحلة في مصر - Journey in Egypt
// ============================================

const { body, validationResult } = require('express-validator');

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('اسم المستخدم مطلوب')
    .isLength({ min: 3, max: 50 })
    .withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('اسم المستخدم يمكن أن يحتوي فقط على حروف وأرقام وشرطة سفلية'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 4, max: 100 })
    .withMessage('كلمة المرور يجب أن تكون بين 4 و 100 حرف')
];

/**
 * Validation rules for token refresh
 */
const validateRefreshToken = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('Refresh token مطلوب')
];

/**
 * Validation rules for change password
 */
const validateChangePassword = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('كلمة المرور الحالية مطلوبة'),
  
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('كلمة المرور الجديدة مطلوبة')
    .isLength({ min: 6, max: 100 })
    .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم على الأقل'),
  
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('تأكيد كلمة المرور مطلوب')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('كلمة المرور الجديدة وتأكيدها غير متطابقين')
];

/**
 * Validation rules for forgot password (request reset)
 */
const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail()
];

/**
 * Validation rules for reset password
 */
const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('رمز إعادة التعيين مطلوب'),
  
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('كلمة المرور الجديدة مطلوبة')
    .isLength({ min: 6, max: 100 })
    .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
  
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('تأكيد كلمة المرور مطلوب')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('كلمة المرور الجديدة وتأكيدها غير متطابقين')
];

/**
 * Validation rules for admin creation (super admin only)
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
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('الدور غير صالح')
];

/**
 * Validation rules for update profile
 */
const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^(01)[0125][0-9]{8}$/)
    .withMessage('رقم الهاتف غير صالح')
];

/**
 * Validation rules for send email (admin)
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
    .withMessage('الرسالة يجب أن تكون بين 10 و 5000 حرف')
];

/**
 * Validation rules for verify token
 */
const validateVerifyToken = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Token مطلوب')
];

/**
 * Custom validation error formatter
 * @param {Object} req - Express request
 * @returns {Object|null} Formatted errors or null
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
 * @param {Array} validations - Array of validation rules
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

// Export all auth validators
module.exports = {
  // Validation rule sets
  validateLogin,
  validateRefreshToken,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateCreateAdmin,
  validateUpdateProfile,
  validateSendEmail,
  validateVerifyToken,
  
  // Utilities
  getValidationErrors,
  validate
};