// ============================================
// Booking Validator
// رحلة في مصر - Journey in Egypt
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for creating a new booking
 */
const validateCreateBooking = [
  body('tourId')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة يجب أن يكون نصاً'),
  
  body('customer.name')
    .trim()
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-]+$/)
    .withMessage('الاسم يحتوي على أحرف غير مسموحة'),
  
  body('customer.email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  body('customer.phone')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .matches(/^(01)[0125][0-9]{8}$/)
    .withMessage('رقم الهاتف غير صالح (مثال: 01234567890)'),
  
  body('customer.nationality')
    .notEmpty()
    .withMessage('الجنسية مطلوبة')
    .isIn(['egyptian', 'foreign'])
    .withMessage('الجنسية يجب أن تكون egyptian أو foreign'),
  
  body('details.persons')
    .notEmpty()
    .withMessage('عدد الأفراد مطلوب')
    .isInt({ min: 1, max: 50 })
    .withMessage('عدد الأفراد يجب أن يكون بين 1 و 50'),
  
  body('details.date')
    .notEmpty()
    .withMessage('تاريخ الرحلة مطلوب')
    .isISO8601()
    .withMessage('التاريخ غير صالح')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('لا يمكن حجز رحلة في تاريخ ماضٍ');
      }
      return true;
    }),
  
  body('details.message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('الملاحظات لا يمكن أن تتجاوز 500 حرف')
];

/**
 * Validation rules for updating booking status
 */
const validateUpdateBookingStatus = [
  param('id')
    .notEmpty()
    .withMessage('معرف الحجز مطلوب')
    .isString()
    .withMessage('معرف الحجز غير صالح'),
  
  body('paymentStatus')
    .notEmpty()
    .withMessage('حالة الدفع مطلوبة')
    .isIn(['pending', 'confirmed', 'cancelled', 'refunded'])
    .withMessage('حالة الدفع غير صالحة'),
  
  body('paymentMethod')
    .optional()
    .isIn(['orange-cash', 'vodafone-cash', 'instapay', 'bank-transfer'])
    .withMessage('طريقة الدفع غير صالحة')
];

/**
 * Validation rules for confirming payment
 */
const validateConfirmPayment = [
  body('bookingId')
    .notEmpty()
    .withMessage('معرف الحجز مطلوب')
    .isString()
    .withMessage('معرف الحجز غير صالح'),
  
  body('transferNumber')
    .trim()
    .notEmpty()
    .withMessage('رقم التحويل مطلوب')
    .isLength({ min: 8, max: 50 })
    .withMessage('رقم التحويل يجب أن يكون بين 8 و 50 حرف')
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage('رقم التحويل يحتوي على أحرف غير مسموحة'),
  
  body('paymentMethod')
    .optional()
    .isIn(['orange-cash', 'vodafone-cash', 'instapay', 'bank-transfer'])
    .withMessage('طريقة الدفع غير صالحة'),
  
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('المبلغ غير صالح'),
  
  body('currency')
    .optional()
    .isIn(['EGP', 'USD'])
    .withMessage('العملة غير صالحة')
];

/**
 * Validation rules for calculating price
 */
const validateCalculatePrice = [
  body('tourId')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
  body('nationality')
    .notEmpty()
    .withMessage('الجنسية مطلوبة')
    .isIn(['egyptian', 'foreign'])
    .withMessage('الجنسية غير صالحة'),
  
  body('persons')
    .notEmpty()
    .withMessage('عدد الأفراد مطلوب')
    .isInt({ min: 1, max: 50 })
    .withMessage('عدد الأفراد غير صالح'),
  
  body('couponCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('رمز الخصم غير صالح')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('رمز الخصم يحتوي على أحرف غير مسموحة')
];

/**
 * Validation rules for getting booking by ID
 */
const validateGetBookingById = [
  param('id')
    .notEmpty()
    .withMessage('معرف الحجز مطلوب')
    .isString()
    .withMessage('معرف الحجز غير صالح')
];

/**
 * Validation rules for getting bookings with filters
 */
const validateGetBookings = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة غير صالح')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر غير صالح')
    .toInt(),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'all'])
    .withMessage('حالة الحجز غير صالحة'),
  
  query('nationality')
    .optional()
    .isIn(['egyptian', 'foreign', 'all'])
    .withMessage('الجنسية غير صالحة'),
  
  query('tourId')
    .optional()
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
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

/**
 * Validation rules for deleting booking
 */
const validateDeleteBooking = [
  param('id')
    .notEmpty()
    .withMessage('معرف الحجز مطلوب')
    .isString()
    .withMessage('معرف الحجز غير صالح')
];

/**
 * Validation rules for user's own bookings
 */
const validateGetUserBookings = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة غير صالح')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('عدد العناصر غير صالح')
    .toInt()
];

/**
 * Validation rules for booking cancellation
 */
const validateCancelBooking = [
  param('id')
    .notEmpty()
    .withMessage('معرف الحجز مطلوب')
    .isString()
    .withMessage('معرف الحجز غير صالح'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('سبب الإلغاء يجب أن يكون بين 5 و 500 حرف')
];

/**
 * Validation rules for booking reschedule
 */
const validateRescheduleBooking = [
  param('id')
    .notEmpty()
    .withMessage('معرف الحجز مطلوب')
    .isString()
    .withMessage('معرف الحجز غير صالح'),
  
  body('newDate')
    .notEmpty()
    .withMessage('التاريخ الجديد مطلوب')
    .isISO8601()
    .withMessage('التاريخ الجديد غير صالح')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('لا يمكن إعادة الجدولة إلى تاريخ ماضٍ');
      }
      return true;
    })
];

/**
 * Validation rules for booking statistics
 */
const validateBookingStats = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year', 'all'])
    .withMessage('الفترة غير صالحة'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية غير صالح'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية غير صالح')
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

// Export all booking validators
module.exports = {
  // Main CRUD validations
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateConfirmPayment,
  validateGetBookingById,
  validateGetBookings,
  validateDeleteBooking,
  
  // User operations
  validateGetUserBookings,
  validateCancelBooking,
  validateRescheduleBooking,
  
  // Utilities
  validateCalculatePrice,
  validateBookingStats,
  
  // Helpers
  getValidationErrors,
  validate
};