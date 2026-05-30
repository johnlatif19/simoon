// ============================================
// Validation Middleware
// رحلة في مصر - Journey in Egypt
// ============================================

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Check for validation errors and return formatted response
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationError = ValidationError.fromExpressValidator(errors.array());
    return next(validationError);
  }
  
  next();
}

// ============================================
// Common Validation Rules
// ============================================

/**
 * Validation rules for MongoDB/ObjectId
 */
const idValidation = {
  paramId: param('id')
    .isMongoId().withMessage('معرف غير صالح')
    .notEmpty().withMessage('المعرف مطلوب'),
  
  tourId: param('tourId')
    .isMongoId().withMessage('معرف الرحلة غير صالح'),
  
  bookingId: param('bookingId')
    .isMongoId().withMessage('معرف الحجز غير صالح'),
  
  ratingId: param('ratingId')
    .isMongoId().withMessage('معرف التقييم غير صالح'),
  
  contactId: param('contactId')
    .isMongoId().withMessage('معرف الرسالة غير صالح'),
};

/**
 * Validation rules for Name
 */
const nameValidation = {
  name: body('name')
    .trim()
    .notEmpty().withMessage('الاسم مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-]+$/).withMessage('الاسم يحتوي على أحرف غير مسموحة'),
  
  nameAr: body('nameAr')
    .trim()
    .notEmpty().withMessage('الاسم بالعربية مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('الاسم بالعربية يجب أن يكون بين 2 و 100 حرف'),
  
  nameEn: body('nameEn')
    .trim()
    .notEmpty().withMessage('الاسم بالإنجليزية مطلوب')
    .isLength({ min: 2, max: 100 }).withMessage('الاسم بالإنجليزية يجب أن يكون بين 2 و 100 حرف')
    .matches(/^[a-zA-Z\s\-]+$/).withMessage('الاسم بالإنجليزية يجب أن يحتوي على أحرف إنجليزية فقط'),
};

/**
 * Validation rules for Email
 */
const emailValidation = {
  email: body('email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('البريد الإلكتروني طويل جداً'),
  
  customerEmail: body('customer.email')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  
  toEmail: body('to')
    .trim()
    .notEmpty().withMessage('البريد الإلكتروني المستلم مطلوب')
    .isEmail().withMessage('البريد الإلكتروني غير صالح'),
};

/**
 * Validation rules for Phone
 */
const phoneValidation = {
  phone: body('phone')
    .trim()
    .notEmpty().withMessage('رقم الهاتف مطلوب')
    .matches(/^(01)[0125][0-9]{8}$/).withMessage('رقم الهاتف غير صالح (مثال: 01234567890)'),
  
  customerPhone: body('customer.phone')
    .trim()
    .notEmpty().withMessage('رقم الهاتف مطلوب')
    .matches(/^(01)[0125][0-9]{8}$/).withMessage('رقم الهاتف غير صالح'),
  
  optionalPhone: body('phone')
    .optional()
    .trim()
    .matches(/^(01)[0125][0-9]{8}$/).withMessage('رقم الهاتف غير صالح'),
};

/**
 * Validation rules for Tour
 */
const tourValidation = {
  // Tour creation validation
  create: [
    body('nameAr')
      .trim()
      .notEmpty().withMessage('الاسم بالعربية مطلوب')
      .isLength({ min: 3, max: 100 }).withMessage('الاسم بالعربية يجب أن يكون بين 3 و 100 حرف'),
    
    body('nameEn')
      .trim()
      .notEmpty().withMessage('الاسم بالإنجليزية مطلوب')
      .isLength({ min: 3, max: 100 }).withMessage('الاسم بالإنجليزية يجب أن يكون بين 3 و 100 حرف'),
    
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9-]+$/).withMessage('Slug غير صالح'),
    
    body('priceEgyptian')
      .notEmpty().withMessage('السعر للمصريين مطلوب')
      .isInt({ min: 100, max: 50000 }).withMessage('السعر للمصريين يجب أن يكون بين 100 و 50000 جنيه'),
    
    body('priceForeign')
      .notEmpty().withMessage('السعر للأجانب مطلوب')
      .isInt({ min: 10, max: 5000 }).withMessage('السعر للأجانب يجب أن يكون بين 10 و 5000 دولار'),
    
    body('duration')
      .trim()
      .notEmpty().withMessage('المدة مطلوبة')
      .isLength({ min: 2, max: 50 }).withMessage('المدة يجب أن تكون بين 2 و 50 حرف'),
    
    body('maxPersons')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('عدد الأفراد يجب أن يكون بين 1 و 100'),
    
    body('startLocation')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('مكان الانطلاق طويل جداً'),
    
    body('mainImage')
      .optional()
      .trim()
      .isURL().withMessage('رابط الصورة الرئيسية غير صالح'),
    
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive يجب أن يكون true/false'),
    
    body('featured')
      .optional()
      .isBoolean().withMessage('featured يجب أن يكون true/false'),
  ],
  
  // Tour update validation
  update: [
    body('nameAr')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('الاسم بالعربية يجب أن يكون بين 3 و 100 حرف'),
    
    body('nameEn')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('الاسم بالإنجليزية يجب أن يكون بين 3 و 100 حرف'),
    
    body('priceEgyptian')
      .optional()
      .isInt({ min: 100, max: 50000 }).withMessage('السعر للمصريين غير صالح'),
    
    body('priceForeign')
      .optional()
      .isInt({ min: 10, max: 5000 }).withMessage('السعر للأجانب غير صالح'),
  ],
};

/**
 * Validation rules for Booking
 */
const bookingValidation = {
  // Booking creation
  create: [
    body('tourId')
      .notEmpty().withMessage('معرف الرحلة مطلوب'),
    
    body('customer.name')
      .trim()
      .notEmpty().withMessage('الاسم مطلوب')
      .isLength({ min: 2, max: 100 }).withMessage('الاسم يجب أن يكون بين 2 و 100 حرف'),
    
    body('customer.email')
      .trim()
      .notEmpty().withMessage('البريد الإلكتروني مطلوب')
      .isEmail().withMessage('البريد الإلكتروني غير صالح'),
    
    body('customer.phone')
      .trim()
      .notEmpty().withMessage('رقم الهاتف مطلوب')
      .matches(/^(01)[0125][0-9]{8}$/).withMessage('رقم الهاتف غير صالح'),
    
    body('customer.nationality')
      .notEmpty().withMessage('الجنسية مطلوبة')
      .isIn(['egyptian', 'foreign']).withMessage('الجنسية يجب أن تكون egyptian أو foreign'),
    
    body('details.persons')
      .notEmpty().withMessage('عدد الأفراد مطلوب')
      .isInt({ min: 1, max: 50 }).withMessage('عدد الأفراد يجب أن يكون بين 1 و 50'),
    
    body('details.date')
      .notEmpty().withMessage('تاريخ الرحلة مطلوب')
      .isISO8601().withMessage('التاريخ غير صالح')
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
      .isLength({ max: 500 }).withMessage('الملاحظات لا يمكن أن تتجاوز 500 حرف'),
  ],
  
  // Booking status update
  updateStatus: [
    body('paymentStatus')
      .notEmpty().withMessage('حالة الدفع مطلوبة')
      .isIn(['pending', 'confirmed', 'cancelled']).withMessage('حالة الدفع غير صالحة'),
  ],
  
  // Payment confirmation
  confirmPayment: [
    body('transferNumber')
      .trim()
      .notEmpty().withMessage('رقم التحويل مطلوب')
      .isLength({ min: 8, max: 50 }).withMessage('رقم التحويل يجب أن يكون بين 8 و 50 حرف'),
    
    body('bookingId')
      .notEmpty().withMessage('معرف الحجز مطلوب'),
  ],
  
  // Price calculation
  calculatePrice: [
    body('tourId')
      .notEmpty().withMessage('معرف الرحلة مطلوب'),
    
    body('nationality')
      .notEmpty().withMessage('الجنسية مطلوبة')
      .isIn(['egyptian', 'foreign']).withMessage('الجنسية غير صالحة'),
    
    body('persons')
      .notEmpty().withMessage('عدد الأفراد مطلوب')
      .isInt({ min: 1, max: 50 }).withMessage('عدد الأفراد غير صالح'),
  ],
};

/**
 * Validation rules for Rating
 */
const ratingValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('الاسم مطلوب')
      .isLength({ min: 2, max: 100 }).withMessage('الاسم يجب أن يكون بين 2 و 100 حرف'),
    
    body('country')
      .trim()
      .notEmpty().withMessage('الدولة مطلوبة')
      .isLength({ min: 2, max: 50 }).withMessage('الدولة يجب أن تكون بين 2 و 50 حرف'),
    
    body('rating')
      .notEmpty().withMessage('التقييم مطلوب')
      .isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5 نجوم'),
    
    body('message')
      .trim()
      .notEmpty().withMessage('الرسالة مطلوبة')
      .isLength({ min: 10, max: 1000 }).withMessage('الرسالة يجب أن تكون بين 10 و 1000 حرف'),
  ],
};

/**
 * Validation rules for Contact
 */
const contactValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('الاسم مطلوب')
      .isLength({ min: 2, max: 100 }).withMessage('الاسم يجب أن يكون بين 2 و 100 حرف'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('البريد الإلكتروني مطلوب')
      .isEmail().withMessage('البريد الإلكتروني غير صالح'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^(01)[0125][0-9]{8}$/).withMessage('رقم الهاتف غير صالح'),
    
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('الموضوع طويل جداً'),
    
    body('message')
      .trim()
      .notEmpty().withMessage('الرسالة مطلوبة')
      .isLength({ min: 10, max: 2000 }).withMessage('الرسالة يجب أن تكون بين 10 و 2000 حرف'),
  ],
  
  updateStatus: [
    body('status')
      .notEmpty().withMessage('الحالة مطلوبة')
      .isIn(['unread', 'read', 'replied']).withMessage('الحالة غير صالحة'),
  ],
};

/**
 * Validation rules for Auth
 */
const authValidation = {
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('اسم المستخدم مطلوب')
      .isLength({ min: 3, max: 50 }).withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف'),
    
    body('password')
      .trim()
      .notEmpty().withMessage('كلمة المرور مطلوبة')
      .isLength({ min: 4, max: 100 }).withMessage('كلمة المرور يجب أن تكون بين 4 و 100 حرف'),
  ],
  
  changePassword: [
    body('currentPassword')
      .trim()
      .notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
    
    body('newPassword')
      .trim()
      .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
      .isLength({ min: 6, max: 100 }).withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
  ],
};

/**
 * Validation rules for Email sending
 */
const emailValidationRules = {
  sendEmail: [
    body('to')
      .trim()
      .notEmpty().withMessage('البريد الإلكتروني المستلم مطلوب')
      .isEmail().withMessage('البريد الإلكتروني غير صالح'),
    
    body('subject')
      .trim()
      .notEmpty().withMessage('الموضوع مطلوب')
      .isLength({ min: 3, max: 200 }).withMessage('الموضوع يجب أن يكون بين 3 و 200 حرف'),
    
    body('message')
      .trim()
      .notEmpty().withMessage('الرسالة مطلوبة')
      .isLength({ min: 10, max: 5000 }).withMessage('الرسالة يجب أن تكون بين 10 و 5000 حرف'),
  ],
};

/**
 * Pagination validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('رقم الصفحة غير صالح')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('عدد العناصر غير صالح')
    .toInt(),
];

// Export all validation rules and middleware
module.exports = {
  // Main validation checker
  validateRequest,
  
  // Individual validation sets
  idValidation,
  nameValidation,
  emailValidation,
  phoneValidation,
  
  // Feature validations
  tourValidation,
  bookingValidation,
  ratingValidation,
  contactValidation,
  authValidation,
  emailValidationRules,
  
  // Common validations
  paginationValidation,
};