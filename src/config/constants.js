// ============================================
// Application Constants
// رحلة في مصر - Journey in Egypt
// ============================================

// ============================================
// API Configuration
// ============================================
const API_CONFIG = {
  VERSION: 'v1',
  PREFIX: '/api/v1',
  HEALTH_CHECK_PATH: '/api/health',
};

// ============================================
// HTTP Status Codes
// ============================================
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================
// Response Messages (Arabic)
// ============================================
const MESSAGES_AR = {
  // Success messages
  SUCCESS: 'تمت العملية بنجاح',
  CREATED: 'تم الإنشاء بنجاح',
  UPDATED: 'تم التحديث بنجاح',
  DELETED: 'تم الحذف بنجاح',
  
  // Auth messages
  LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
  LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
  INVALID_CREDENTIALS: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  UNAUTHORIZED: 'غير مصرح بهذا الإجراء',
  TOKEN_EXPIRED: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
  TOKEN_INVALID: 'رمز المصادقة غير صالح',
  
  // Booking messages
  BOOKING_CREATED: 'تم إرسال طلب الحجز بنجاح',
  BOOKING_CONFIRMED: 'تم تأكيد الحجز بنجاح',
  BOOKING_CANCELLED: 'تم إلغاء الحجز',
  PAYMENT_CONFIRMED: 'تم تأكيد الدفع بنجاح',
  
  // Tour messages
  TOUR_NOT_FOUND: 'الرحلة غير موجودة',
  TOUR_CREATED: 'تم إضافة الرحلة بنجاح',
  TOUR_UPDATED: 'تم تحديث الرحلة بنجاح',
  TOUR_DELETED: 'تم حذف الرحلة بنجاح',
  
  // Rating messages
  RATING_ADDED: 'تم إضافة تقييمك بنجاح، شكراً لك',
  RATING_DELETED: 'تم حذف التقييم',
  
  // Contact messages
  CONTACT_SENT: 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً',
  
  // Validation messages
  REQUIRED_FIELD: 'هذا الحقل مطلوب',
  INVALID_EMAIL: 'البريد الإلكتروني غير صحيح',
  INVALID_PHONE: 'رقم الهاتف غير صحيح',
  INVALID_DATE: 'التاريخ غير صحيح',
  MIN_PERSONS: 'يجب أن يكون عدد الأفراد 1 على الأقل',
  MAX_PERSONS: 'عدد الأفراد أكبر من الحد المسموح',
  
  // Error messages
  SERVER_ERROR: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى',
  NOT_FOUND: 'العنصر غير موجود',
  DUPLICATE: 'العنصر موجود بالفعل',
  RATE_LIMIT: 'تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً',
};

// ============================================
// Response Messages (English)
// ============================================
const MESSAGES_EN = {
  // Success messages
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  
  // Auth messages
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  INVALID_CREDENTIALS: 'Invalid username or password',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Session expired, please login again',
  TOKEN_INVALID: 'Invalid authentication token',
  
  // Booking messages
  BOOKING_CREATED: 'Booking request sent successfully',
  BOOKING_CONFIRMED: 'Booking confirmed successfully',
  BOOKING_CANCELLED: 'Booking cancelled',
  PAYMENT_CONFIRMED: 'Payment confirmed successfully',
  
  // Tour messages
  TOUR_NOT_FOUND: 'Tour not found',
  TOUR_CREATED: 'Tour added successfully',
  TOUR_UPDATED: 'Tour updated successfully',
  TOUR_DELETED: 'Tour deleted successfully',
  
  // Rating messages
  RATING_ADDED: 'Thank you for your review',
  RATING_DELETED: 'Review deleted',
  
  // Contact messages
  CONTACT_SENT: 'Message sent successfully, we will contact you soon',
  
  // Validation messages
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_DATE: 'Invalid date',
  MIN_PERSONS: 'Minimum 1 person required',
  MAX_PERSONS: 'Number of persons exceeds maximum limit',
  
  // Error messages
  SERVER_ERROR: 'Server error, please try again',
  NOT_FOUND: 'Item not found',
  DUPLICATE: 'Item already exists',
  RATE_LIMIT: 'Too many requests, please try again later',
};

// ============================================
// Tour Default Values
// ============================================
const TOUR_DEFAULTS = {
  MAX_PERSONS: 20,
  DURATION: '4 ساعات',
  START_LOCATION: 'القاهرة',
  PICKUP_TIME: '08:00',
  IS_ACTIVE: true,
  FEATURED: false,
  RATING: 0,
  TOTAL_RATINGS: 0,
  TOTAL_BOOKINGS: 0,
};

// ============================================
// Booking Default Values
// ============================================
const BOOKING_DEFAULTS = {
  PAYMENT_METHOD: 'orange-cash',
  PAYMENT_STATUS: 'pending',
  CURRENCY: 'EGP',
};

// ============================================
// Payment Status
// ============================================
const PAYMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// ============================================
// Contact Status
// ============================================
const CONTACT_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  REPLIED: 'replied',
};

// ============================================
// Nationality Types
// ============================================
const NATIONALITY_TYPES = {
  EGYPTIAN: 'egyptian',
  FOREIGN: 'foreign',
};

// ============================================
// Currency Settings
// ============================================
const CURRENCY = {
  EGP: { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' },
  USD: { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
};

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'EGP';

// ============================================
// Price Limits
// ============================================
const PRICE_LIMITS = {
  MIN_EGP: 100,
  MAX_EGP: 10000,
  MIN_USD: 10,
  MAX_USD: 1000,
};

// ============================================
// Pagination Defaults
// ============================================
const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  DEFAULT_PAGE: 1,
};

// ============================================
// Rate Limiting
// ============================================
const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// ============================================
// Image Settings
// ============================================
const IMAGE_SETTINGS = {
  MAX_SIZE_MB: parseInt(process.env.MAX_IMAGE_SIZE_MB) || 5,
  ALLOWED_TYPES: (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp').split(','),
  DEFAULT_IMAGE: '/assets/images/default-tour.jpg',
};

// ============================================
// Cache Settings
// ============================================
const CACHE_SETTINGS = {
  TTL: 60 * 60, // 1 hour in seconds
  MAX_ITEMS: 100,
};

// ============================================
// WhatsApp Configuration
// ============================================
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '201026517329';

// ============================================
// Site Configuration
// ============================================
const SITE_CONFIG = {
  NAME_AR: 'رحلة في مصر',
  NAME_EN: 'Journey in Egypt',
  SITE_URL: process.env.SITE_URL || 'https://simoon-issac.vercel.app',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'johnlatif37@gmail.com',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'johnlatif37@gmail.com',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get message in specific language
 * @param {string} key - Message key
 * @param {string} lang - Language code ('ar' or 'en')
 * @returns {string} Localized message
 */
function getMessage(key, lang = 'ar') {
  const messages = lang === 'ar' ? MESSAGES_AR : MESSAGES_EN;
  return messages[key] || (lang === 'ar' ? 'حدث خطأ' : 'An error occurred');
}

/**
 * Format price with currency symbol
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code ('EGP' or 'USD')
 * @returns {string} Formatted price
 */
function formatPrice(amount, currency = 'EGP') {
  const curr = currency === 'EGP' ? CURRENCY.EGP : CURRENCY.USD;
  return `${amount.toLocaleString()} ${curr.symbol}`;
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
function getCurrencySymbol(currency) {
  return currency === 'EGP' ? CURRENCY.EGP.symbol : CURRENCY.USD.symbol;
}

// Export all constants
module.exports = {
  // API
  API_CONFIG,
  HTTP_STATUS,
  
  // Messages
  MESSAGES_AR,
  MESSAGES_EN,
  getMessage,
  
  // Defaults
  TOUR_DEFAULTS,
  BOOKING_DEFAULTS,
  
  // Status enums
  PAYMENT_STATUS,
  CONTACT_STATUS,
  NATIONALITY_TYPES,
  
  // Currency
  CURRENCY,
  DEFAULT_CURRENCY,
  formatPrice,
  getCurrencySymbol,
  
  // Limits
  PRICE_LIMITS,
  PAGINATION,
  RATE_LIMIT,
  IMAGE_SETTINGS,
  CACHE_SETTINGS,
  
  // Contact
  WHATSAPP_NUMBER,
  
  // Site
  SITE_CONFIG,
};