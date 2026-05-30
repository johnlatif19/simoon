// ============================================
// Validators Utility
// رحلة في مصر - Journey in Egypt
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Egyptian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidEgyptianPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Egyptian phone patterns:
  // 01[0125]XXXXXXXX (11 digits)
  // 20 1[0125]XXXXXXXX (12-13 digits with country code)
  const patterns = [
    /^01[0125][0-9]{8}$/,           // 01234567890
    /^201[0125][0-9]{8}$/,          // 201234567890
    /^\+201[0125][0-9]{8}$/,        // +201234567890
    /^00201[0125][0-9]{8}$/         // 00201234567890
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone) || pattern.test(phone));
}

/**
 * Validate international phone number (basic)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Basic international phone pattern (5-15 digits, optional +)
  const phoneRegex = /^\+?[0-9]{5,15}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date to validate
 * @returns {boolean} True if valid
 */
function isValidDate(date) {
  if (!date || typeof date !== 'string') return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Check if date is in the future
 * @param {string} date - Date to check (YYYY-MM-DD)
 * @returns {boolean} True if date is in the future
 */
function isFutureDate(date) {
  if (!isValidDate(date)) return false;
  
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return inputDate >= today;
}

/**
 * Check if date is in the past
 * @param {string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
function isPastDate(date) {
  if (!isValidDate(date)) return false;
  
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return inputDate < today;
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate image URL (specific for images)
 * @param {string} url - Image URL to validate
 * @returns {boolean} True if valid image URL
 */
function isValidImageUrl(url) {
  if (!isValidUrl(url)) return false;
  
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
  return imageExtensions.test(url);
}

/**
 * Validate name (no special characters, reasonable length)
 * @param {string} name - Name to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid
 */
function isValidName(name, options = {}) {
  const { minLength = 2, maxLength = 100, allowArabic = true, allowEnglish = true } = options;
  
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) return false;
  
  if (allowArabic && allowEnglish) {
    const nameRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-]+$/;
    return nameRegex.test(trimmed);
  }
  
  if (allowArabic) {
    const arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s\-]+$/;
    return arabicRegex.test(trimmed);
  }
  
  if (allowEnglish) {
    const englishRegex = /^[a-zA-Z\s\-]+$/;
    return englishRegex.test(trimmed);
  }
  
  return false;
}

/**
 * Validate number within range
 * @param {number} num - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
function isNumberInRange(num, min, max) {
  if (typeof num !== 'number' || isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate positive integer
 * @param {number} num - Number to validate
 * @returns {boolean} True if positive integer
 */
function isPositiveInteger(num) {
  return Number.isInteger(num) && num > 0;
}

/**
 * Validate rating (1-5)
 * @param {number} rating - Rating to validate
 * @returns {boolean} True if valid rating
 */
function isValidRating(rating) {
  return isNumberInRange(rating, 1, 5);
}

/**
 * Validate price
 * @param {number} price - Price to validate
 * @param {string} currency - Currency code
 * @returns {boolean} True if valid price
 */
function isValidPrice(price, currency = 'EGP') {
  if (typeof price !== 'number' || isNaN(price)) return false;
  
  if (currency === 'EGP') {
    return price >= 1 && price <= 100000;
  }
  
  return price >= 1 && price <= 10000;
}

/**
 * Validate number of persons
 * @param {number} persons - Number of persons
 * @param {number} maxPersons - Maximum allowed
 * @returns {boolean} True if valid
 */
function isValidPersons(persons, maxPersons = 50) {
  return isPositiveInteger(persons) && persons <= maxPersons;
}

/**
 * Validate nationality
 * @param {string} nationality - Nationality to validate
 * @returns {boolean} True if valid
 */
function isValidNationality(nationality) {
  const validNationalities = ['egyptian', 'foreign'];
  return validNationalities.includes(nationality);
}

/**
 * Validate payment status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidPaymentStatus(status) {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'refunded'];
  return validStatuses.includes(status);
}

/**
 * Validate contact status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidContactStatus(status) {
  const validStatuses = ['unread', 'read', 'replied'];
  return validStatuses.includes(status);
}

/**
 * Validate slug
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid slug
 */
function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 100;
}

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
}

/**
 * Validate that required fields are present
 * @param {Object} data - Data object
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} { valid, missingFields }
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if valid
 */
function isValidLength(str, min = 0, max = Infinity) {
  if (typeof str !== 'string') return false;
  const length = str.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate that string contains only allowed characters
 * @param {string} str - String to validate
 * @param {RegExp} pattern - Allowed pattern
 * @returns {boolean} True if valid
 */
function matchesPattern(str, pattern) {
  if (typeof str !== 'string') return false;
  return pattern.test(str);
}

/**
 * Sanitize and validate tour data
 * @param {Object} tourData - Tour data to validate
 * @returns {Object} { valid, errors }
 */
function validateTourData(tourData) {
  const errors = [];
  
  if (!isValidName(tourData.nameAr, { minLength: 3, maxLength: 100 })) {
    errors.push('الاسم بالعربية يجب أن يكون بين 3 و 100 حرف');
  }
  
  if (!isValidName(tourData.nameEn, { minLength: 3, maxLength: 100, allowArabic: false })) {
    errors.push('الاسم بالإنجليزية يجب أن يكون بين 3 و 100 حرف');
  }
  
  if (!isValidPrice(tourData.priceEgyptian, 'EGP')) {
    errors.push('السعر للمصريين غير صالح');
  }
  
  if (!isValidPrice(tourData.priceForeign, 'USD')) {
    errors.push('السعر للأجانب غير صالح');
  }
  
  if (tourData.maxPersons && !isValidPersons(tourData.maxPersons, 100)) {
    errors.push('الحد الأقصى للأفراد غير صالح');
  }
  
  if (tourData.mainImage && !isValidImageUrl(tourData.mainImage)) {
    errors.push('رابط الصورة الرئيسية غير صالح');
  }
  
  if (tourData.slug && !isValidSlug(tourData.slug)) {
    errors.push('الـ slug غير صالح');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and validate booking data
 * @param {Object} bookingData - Booking data to validate
 * @returns {Object} { valid, errors }
 */
function validateBookingData(bookingData) {
  const errors = [];
  
  const { customer, details } = bookingData;
  
  if (!customer) {
    errors.push('بيانات العميل مطلوبة');
    return { valid: false, errors };
  }
  
  if (!isValidName(customer.name)) {
    errors.push('الاسم غير صالح');
  }
  
  if (!isValidEmail(customer.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }
  
  if (!isValidEgyptianPhone(customer.phone)) {
    errors.push('رقم الهاتف غير صالح');
  }
  
  if (!isValidNationality(customer.nationality)) {
    errors.push('الجنسية غير صالحة');
  }
  
  if (details) {
    if (!isValidPersons(details.persons, 50)) {
      errors.push('عدد الأفراد غير صالح');
    }
    
    if (details.date && !isFutureDate(details.date)) {
      errors.push('تاريخ الرحلة يجب أن يكون في المستقبل');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and validate rating data
 * @param {Object} ratingData - Rating data to validate
 * @returns {Object} { valid, errors }
 */
function validateRatingData(ratingData) {
  const errors = [];
  
  if (!isValidName(ratingData.name)) {
    errors.push('الاسم غير صالح');
  }
  
  if (!isValidName(ratingData.country, { minLength: 2, maxLength: 50 })) {
    errors.push('الدولة غير صالحة');
  }
  
  if (!isValidRating(ratingData.rating)) {
    errors.push('التقييم يجب أن يكون بين 1 و 5 نجوم');
  }
  
  if (!isValidLength(ratingData.message, 10, 1000)) {
    errors.push('الرسالة يجب أن تكون بين 10 و 1000 حرف');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and validate contact data
 * @param {Object} contactData - Contact data to validate
 * @returns {Object} { valid, errors }
 */
function validateContactData(contactData) {
  const errors = [];
  
  if (!isValidName(contactData.name)) {
    errors.push('الاسم غير صالح');
  }
  
  if (!isValidEmail(contactData.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }
  
  if (contactData.phone && !isValidEgyptianPhone(contactData.phone)) {
    errors.push('رقم الهاتف غير صالح');
  }
  
  if (!isValidLength(contactData.message, 10, 2000)) {
    errors.push('الرسالة يجب أن تكون بين 10 و 2000 حرف');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export all validators
module.exports = {
  // Email & Phone
  isValidEmail,
  isValidPhone,
  isValidEgyptianPhone,
  
  // Date
  isValidDate,
  isFutureDate,
  isPastDate,
  
  // URL & Image
  isValidUrl,
  isValidImageUrl,
  
  // Name
  isValidName,
  
  // Numbers
  isNumberInRange,
  isPositiveInteger,
  isValidRating,
  isValidPrice,
  isValidPersons,
  
  // Status
  isValidNationality,
  isValidPaymentStatus,
  isValidContactStatus,
  
  // IDs & Slugs
  isValidObjectId,
  isValidSlug,
  
  // General
  isValidLength,
  matchesPattern,
  validateRequiredFields,
  
  // Data validators
  validateTourData,
  validateBookingData,
  validateRatingData,
  validateContactData
};