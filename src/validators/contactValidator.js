// ============================================
// Contact Validator
// رحلة في مصر - Journey in Egypt
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for creating a contact message
 */
const validateCreateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 100 })
    .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-]+$/)
    .withMessage('الاسم يحتوي على أحرف غير مسموحة'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^(01)[0125][0-9]{8}$/)
    .withMessage('رقم الهاتف غير صالح (مثال: 01234567890)'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('الموضوع لا يمكن أن يتجاوز 200 حرف'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('الرسالة مطلوبة')
    .isLength({ min: 10, max: 2000 })
    .withMessage('الرسالة يجب أن تكون بين 10 و 2000 حرف')
];

/**
 * Validation rules for getting contact by ID
 */
const validateGetContactById = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرسالة مطلوب')
    .isString()
    .withMessage('معرف الرسالة غير صالح')
];

/**
 * Validation rules for getting all contacts (admin)
 */
const validateGetAllContacts = [
  query('status')
    .optional()
    .isIn(['unread', 'read', 'replied', 'archived'])
    .withMessage('حالة الرسالة غير صالحة'),
  
  query('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
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
    }),
  
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
 * Validation rules for replying to contact
 */
const validateReplyToContact = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرسالة مطلوب')
    .isString()
    .withMessage('معرف الرسالة غير صالح'),
  
  body('reply')
    .trim()
    .notEmpty()
    .withMessage('الرد مطلوب')
    .isLength({ min: 5, max: 2000 })
    .withMessage('الرد يجب أن يكون بين 5 و 2000 حرف')
];

/**
 * Validation rules for updating contact notes
 */
const validateUpdateContactNotes = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرسالة مطلوب')
    .isString()
    .withMessage('معرف الرسالة غير صالح'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('الملاحظات لا يمكن أن تتجاوز 500 حرف')
];

/**
 * Validation rules for bulk delete contacts
 */
const validateBulkDeleteContacts = [
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
        throw new Error('لا يمكن حذف أكثر من 100 رسالة في عملية واحدة');
      }
      return true;
    }),
  
  body('ids.*')
    .isString()
    .withMessage('كل معرف يجب أن يكون نصاً')
];

/**
 * Validation rules for bulk mark as read
 */
const validateBulkMarkAsRead = [
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
        throw new Error('لا يمكن تحديث أكثر من 100 رسالة في عملية واحدة');
      }
      return true;
    }),
  
  body('ids.*')
    .isString()
    .withMessage('كل معرف يجب أن يكون نصاً')
];

/**
 * Validation rules for search contacts
 */
const validateSearchContacts = [
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
 * Validation rules for getting contacts by email
 */
const validateGetContactsByEmail = [
  param('email')
    .trim()
    .notEmpty()
    .withMessage('البريد الإلكتروني مطلوب')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail()
];

/**
 * Validation rules for getting unread contacts
 */
const validateGetUnreadContacts = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
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

// Export all contact validators
module.exports = {
  // Main validations
  validateCreateContact,
  validateGetContactById,
  validateGetAllContacts,
  
  // Admin operations
  validateReplyToContact,
  validateUpdateContactNotes,
  validateBulkDeleteContacts,
  validateBulkMarkAsRead,
  validateSearchContacts,
  validateGetContactsByEmail,
  validateGetUnreadContacts,
  
  // Helpers
  getValidationErrors,
  validate
};