// ============================================
// Sanitize Middleware
// رحلة في مصر - Journey in Egypt
// ============================================

const xss = require('xss');

// Configure XSS filter
const xssFilter = new xss.FilterXSS({
  whiteList: {}, // Allow no HTML tags
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  allowCommentTag: false
});

/**
 * Sanitize a single string
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and escape special characters
  let sanitized = xssFilter.process(input);
  
  // Additional cleaning
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove any remaining < >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
  
  return sanitized;
}

/**
 * Sanitize an object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Array} skipFields - Fields to skip sanitization
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj, skipFields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip sanitization for certain fields
    if (skipFields.includes(key)) {
      result[key] = value;
      continue;
    }
    
    // Skip password fields
    if (key.toLowerCase().includes('password')) {
      result[key] = value;
      continue;
    }
    
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value, skipFields);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Sanitize request body middleware
 * @param {Array} skipFields - Fields to skip sanitization
 * @returns {Function} Express middleware
 */
function sanitizeBody(skipFields = []) {
  return (req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeObject(req.body, skipFields);
    }
    next();
  };
}

/**
 * Sanitize request query middleware
 * @returns {Function} Express middleware
 */
function sanitizeQuery(req, res, next) {
  if (req.query && Object.keys(req.query).length > 0) {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Sanitize request params middleware
 * @returns {Function} Express middleware
 */
function sanitizeParams(req, res, next) {
  if (req.params && Object.keys(req.params).length > 0) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Sanitize headers middleware (remove dangerous headers)
 * @returns {Function} Express middleware
 */
function sanitizeHeaders(req, res, next) {
  // Remove dangerous headers from request
  const dangerousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-original-url'];
  dangerousHeaders.forEach(header => {
    delete req.headers[header];
  });
  next();
}

/**
 * Escape HTML special characters
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escape JSON for safe embedding
 * @param {any} data - Data to escape
 * @returns {string} Escaped JSON string
 */
function escapeJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate and sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  
  // Remove any non-digit characters except +
  return phone
    .trim()
    .replace(/[^\d+]/g, '')
    .substring(0, 20);
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  
  // Only allow http/https URLs
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/[<>"'`]/g, '');
  }
  return '';
}

/**
 * Full sanitization middleware (body + query + params)
 * @param {Array} skipFields - Fields to skip in body
 * @returns {Function} Express middleware
 */
function fullSanitize(skipFields = []) {
  return [
    sanitizeHeaders,
    sanitizeQuery,
    sanitizeParams,
    sanitizeBody(skipFields)
  ];
}

/**
 * Sanitize for database input (more aggressive)
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
function sanitizeForDb(input) {
  if (typeof input === 'string') {
    // Remove potential SQL injection patterns (NoSQL injection prevention)
    return input
      .replace(/\$/g, '') // Remove $ operators for MongoDB
      .replace(/\./g, '') // Remove dots for MongoDB
      .replace(/[{}]/g, ''); // Remove braces
  }
  
  if (typeof input === 'object' && input !== null) {
    const result = Array.isArray(input) ? [] : {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize keys
      const safeKey = String(key).replace(/[$.]/g, '');
      result[safeKey] = sanitizeForDb(value);
    }
    return result;
  }
  
  return input;
}

/**
 * Prepare data for database insertion
 * @param {Object} data - Data to prepare
 * @returns {Object} Prepared data
 */
function prepareForDb(data) {
  const sanitized = sanitizeForDb(data);
  return sanitizeObject(sanitized);
}

// Export all sanitization utilities
module.exports = {
  // Main sanitization functions
  sanitizeString,
  sanitizeObject,
  
  // Field-specific sanitization
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  
  // HTML escaping
  escapeHtml,
  escapeJson,
  
  // Database sanitization
  sanitizeForDb,
  prepareForDb,
  
  // Express middleware
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeHeaders,
  fullSanitize,
  
  // XSS filter instance
  xssFilter
};