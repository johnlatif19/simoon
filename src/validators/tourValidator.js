// ============================================
// Tour Validator
// رحلة في مصر - Journey in Egypt
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation rules for creating a new tour
 */
const validateCreateTour = [
  body('nameAr')
    .trim()
    .notEmpty()
    .withMessage('الاسم بالعربية مطلوب')
    .isLength({ min: 3, max: 100 })
    .withMessage('الاسم بالعربية يجب أن يكون بين 3 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s\-0-9]+$/)
    .withMessage('الاسم بالعربية يحتوي على أحرف غير مسموحة'),
  
  body('nameEn')
    .trim()
    .notEmpty()
    .withMessage('الاسم بالإنجليزية مطلوب')
    .isLength({ min: 3, max: 100 })
    .withMessage('الاسم بالإنجليزية يجب أن يكون بين 3 و 100 حرف')
    .matches(/^[a-zA-Z\s\-0-9]+$/)
    .withMessage('الاسم بالإنجليزية يجب أن يحتوي على أحرف إنجليزية فقط'),
  
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('الـ slug غير صالح يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط')
    .isLength({ max: 100 })
    .withMessage('الـ slug لا يمكن أن يتجاوز 100 حرف'),
  
  body('shortDescriptionAr')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('الوصف المختصر بالعربية لا يمكن أن يتجاوز 200 حرف'),
  
  body('shortDescriptionEn')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('الوصف المختصر بالإنجليزية لا يمكن أن يتجاوز 200 حرف'),
  
  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('الوصف بالعربية يجب أن يكون بين 20 و 5000 حرف'),
  
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('الوصف بالإنجليزية يجب أن يكون بين 20 و 5000 حرف'),
  
  body('duration')
    .trim()
    .notEmpty()
    .withMessage('المدة مطلوبة')
    .isLength({ min: 2, max: 50 })
    .withMessage('المدة يجب أن تكون بين 2 و 50 حرف'),
  
  body('priceEgyptian')
    .notEmpty()
    .withMessage('السعر للمصريين مطلوب')
    .isInt({ min: 100, max: 50000 })
    .withMessage('السعر للمصريين يجب أن يكون بين 100 و 50000 جنيه'),
  
  body('priceForeign')
    .notEmpty()
    .withMessage('السعر للأجانب مطلوب')
    .isInt({ min: 10, max: 5000 })
    .withMessage('السعر للأجانب يجب أن يكون بين 10 و 5000 دولار'),
  
  body('maxPersons')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('الحد الأقصى للأفراد يجب أن يكون بين 1 و 100'),
  
  body('startLocation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('مكان الانطلاق لا يمكن أن يتجاوز 100 حرف'),
  
  body('pickupTime')
    .optional()
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('وقت الانطلاق غير صالح (مثال: 08:00)'),
  
  body('mainImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('رابط الصورة الرئيسية غير صالح'),
  
  body('galleryImages')
    .optional()
    .isArray()
    .withMessage('معرض الصور يجب أن يكون مصفوفة')
    .custom((value) => {
      if (value && value.length > 20) {
        throw new Error('لا يمكن إضافة أكثر من 20 صورة');
      }
      return true;
    }),
  
  body('itineraryAr')
    .optional()
    .isArray()
    .withMessage('برنامج الرحلة بالعربية يجب أن يكون مصفوفة'),
  
  body('itineraryEn')
    .optional()
    .isArray()
    .withMessage('برنامج الرحلة بالإنجليزية يجب أن يكون مصفوفة'),
  
  body('includedAr')
    .optional()
    .isArray()
    .withMessage('المشمول بالعربية يجب أن يكون مصفوفة'),
  
  body('includedEn')
    .optional()
    .isArray()
    .withMessage('المشمول بالإنجليزية يجب أن يكون مصفوفة'),
  
  body('excludedAr')
    .optional()
    .isArray()
    .withMessage('غير المشمول بالعربية يجب أن يكون مصفوفة'),
  
  body('excludedEn')
    .optional()
    .isArray()
    .withMessage('غير المشمول بالإنجليزية يجب أن يكون مصفوفة'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive يجب أن يكون true/false'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured يجب أن يكون true/false')
];

/**
 * Validation rules for updating a tour
 */
const validateUpdateTour = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
  body('nameAr')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('الاسم بالعربية يجب أن يكون بين 3 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s\-0-9]+$/)
    .withMessage('الاسم بالعربية يحتوي على أحرف غير مسموحة'),
  
  body('nameEn')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('الاسم بالإنجليزية يجب أن يكون بين 3 و 100 حرف')
    .matches(/^[a-zA-Z\s\-0-9]+$/)
    .withMessage('الاسم بالإنجليزية يجب أن يحتوي على أحرف إنجليزية فقط'),
  
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('الـ slug غير صالح'),
  
  body('priceEgyptian')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('السعر للمصريين يجب أن يكون بين 100 و 50000 جنيه'),
  
  body('priceForeign')
    .optional()
    .isInt({ min: 10, max: 5000 })
    .withMessage('السعر للأجانب يجب أن يكون بين 10 و 5000 دولار'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive يجب أن يكون true/false'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured يجب أن يكون true/false')
];

/**
 * Validation rules for getting tour by ID
 */
const validateGetTourById = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة غير صالح')
];

/**
 * Validation rules for getting tour by slug
 */
const validateGetTourBySlug = [
  param('slug')
    .notEmpty()
    .withMessage('الـ slug مطلوب')
    .isString()
    .withMessage('الـ slug غير صالح')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('الـ slug غير صالح')
];

/**
 * Validation rules for getting tours with filters
 */
const validateGetTours = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة غير صالح')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('عدد العناصر غير صالح')
    .toInt(),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('مميز يجب أن يكون true/false')
    .toBoolean(),
  
  query('active')
    .optional()
    .isBoolean()
    .withMessage('نشط يجب أن يكون true/false')
    .toBoolean(),
  
  query('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('الحد الأدنى للسعر غير صالح')
    .toInt(),
  
  query('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('الحد الأقصى للسعر غير صالح')
    .toInt(),
  
  query('duration')
    .optional()
    .isString()
    .withMessage('المدة غير صالحة'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('البحث يجب أن يكون بين 2 و 50 حرف'),
  
  query('sortBy')
    .optional()
    .isIn(['price', 'rating', 'createdAt', 'name'])
    .withMessage('ترتيب غير صالح'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('اتجاه الترتيب غير صالح')
];

/**
 * Validation rules for deleting tour
 */
const validateDeleteTour = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة غير صالح')
];

/**
 * Validation rules for tour ratings
 */
const validateGetTourRatings = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
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
 * Validation rules for tour availability check
 */
const validateCheckAvailability = [
  param('id')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب')
    .isString()
    .withMessage('معرف الرحلة غير صالح'),
  
  query('date')
    .notEmpty()
    .withMessage('التاريخ مطلوب')
    .isISO8601()
    .withMessage('التاريخ غير صالح'),
  
  query('persons')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('عدد الأفراد غير صالح')
    .toInt()
];

/**
 * Validation rules for bulk update tours (admin)
 */
const validateBulkUpdateTours = [
  body('tours')
    .notEmpty()
    .withMessage('قائمة الرحلات مطلوبة')
    .isArray()
    .withMessage('قائمة الرحلات يجب أن تكون مصفوفة')
    .custom((value) => {
      if (value.length > 100) {
        throw new Error('لا يمكن تحديث أكثر من 100 رحلة في عملية واحدة');
      }
      return true;
    }),
  
  body('tours.*.id')
    .notEmpty()
    .withMessage('معرف الرحلة مطلوب لجميع الرحلات'),
  
  body('tours.*.isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive يجب أن يكون true/false'),
  
  body('tours.*.featured')
    .optional()
    .isBoolean()
    .withMessage('featured يجب أن يكون true/false')
];

/**
 * Validation rules for tour statistics
 */
const validateTourStats = [
  query('period')
    .optional()
    .isIn(['week', 'month', 'year', 'all'])
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

// Export all tour validators
module.exports = {
  // Main CRUD validations
  validateCreateTour,
  validateUpdateTour,
  validateGetTourById,
  validateGetTourBySlug,
  validateGetTours,
  validateDeleteTour,
  
  // Additional operations
  validateGetTourRatings,
  validateCheckAvailability,
  validateBulkUpdateTours,
  validateTourStats,
  
  // Helpers
  getValidationErrors,
  validate
};