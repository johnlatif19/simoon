// ============================================
// Rating Validator
// رحلة في مصر - Journey in Egypt
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for creating a rating
 */
const validateCreateRating = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-]+$/)
    .withMessage('الاسم يحتوي على أحرف غير مسموحة'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('الدولة مطلوبة')
    .isLength({ min: 2, max: 50 })
    .withMessage('الدولة يجب أن تكون بين 2 و 50 حرف'),
  
  body('rating')
    .notEmpty()
    .withMessage('التقييم مطلوب')
    .isInt({ min: 1, max: 5 })
    .withMessage('التقييم يجب أن يكون بين 1 و 5 نجوم'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('الرسالة مطلوبة')
    .isLength({ min: 10, max: 1000 })
    .withMessage('الرسالة يجب أن تكون بين 10 و 1000 حرف'),
  
  body('tourId')
    .optional()
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
  body('bookingId')
    .optional()
    .isString()
    .withMessage('معرف الحجز غير صالح')
];

/**
 * Validation rules for getting rating by ID
 */
const validateGetRatingById = [
  param('id')
    .notEmpty()
    .withMessage('معرف التقييم مطلوب')
    .isString()
    .withMessage('معرف التقييم غير صالح')
];

/**
 * Validation rules for getting ratings by tour
 */
const validateGetRatingsByTour = [
  param('tourId')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('عدد العناصر غير صالح')
    .toInt(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة غير صالح')
    .toInt()
];

/**
 * Validation rules for getting all ratings (admin)
 */
const validateGetAllRatings = [
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('التقييم غير صالح')
    .toInt(),
  
  query('minRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('الحد الأدنى للتقييم غير صالح')
    .toInt(),
  
  query('maxRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('الحد الأقصى للتقييم غير صالح')
    .toInt(),
  
  query('tourId')
    .optional()
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
  query('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('الدولة غير صالحة'),
  
  query('isApproved')
    .optional()
    .isBoolean()
    .withMessage('حالة الموافقة يجب أن تكون true/false')
    .toBoolean(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر غير صالح')
    .toInt(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة غير صالح')
    .toInt()
];

/**
 * Validation rules for adding admin reply
 */
const validateAddAdminReply = [
  param('id')
    .notEmpty()
    .withMessage('معرف التقييم مطلوب')
    .isString()
    .withMessage('معرف التقييم غير صالح'),
  
  body('reply')
    .trim()
    .notEmpty()
    .withMessage('الرد مطلوب')
    .isLength({ min: 5, max: 1000 })
    .withMessage('الرد يجب أن يكون بين 5 و 1000 حرف')
];

/**
 * Validation rules for verifying rating
 */
const validateVerifyRating = [
  param('id')
    .notEmpty()
    .withMessage('معرف التقييم مطلوب')
    .isString()
    .withMessage('معرف التقييم غير صالح'),
  
  body('bookingId')
    .notEmpty()
    .withMessage('معرف الحجز مطلوب')
    .isString()
    .withMessage('معرف الحجز غير صالح')
];

/**
 * Validation rules for bulk delete ratings
 */
const validateBulkDeleteRatings = [
  body('ids')
    .notEmpty()
    .withMessage('قائمة المعرفات مطلوبة')
    .isArray()
    .withMessage('قائمة المعرفات يجب أن تكون مصفوفة')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('قائمة المعرفات لا يمكن أن تكون فارغة');
      }
      if (value.length > 100) {
        throw new Error('لا يمكن حذف أكثر من 100 تقييم في عملية واحدة');
      }
      return true;
    }),
  
  body('ids.*')
    .isString()
    .withMessage('كل معرف يجب أن يكون نصاً')
];

/**
 * Validation rules for search ratings
 */
const validateSearchRatings = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('مصطلح البحث مطلوب')
    .isLength({ min: 2, max: 100 })
    .withMessage('مصطلح البحث يجب أن يكون بين 2 و 100 حرف'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('عدد العناصر غير صالح')
    .toInt()
];

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

// Export all rating validators
module.exports = {
  // Main validations
  validateCreateRating,
  validateGetRatingById,
  validateGetRatingsByTour,
  validateGetAllRatings,
  
  // Admin operations
  validateAddAdminReply,
  validateVerifyRating,
  validateBulkDeleteRatings,
  validateSearchRatings,
  
  // Helpers
  getValidationErrors,
  validate
};