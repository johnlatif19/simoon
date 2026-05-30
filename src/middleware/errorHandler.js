// ============================================
// Global Error Handler Middleware
// رحلة في مصر - Journey in Egypt
// ============================================

const { HTTP_STATUS, getMessage } = require('../config/constants');

/**
 * Custom error class for API errors
 * @extends Error
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create Bad Request error (400)
   * @param {string} message - Error message
   * @param {any} details - Additional details
   * @returns {ApiError}
   */
  static badRequest(message, details = null) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, details);
  }

  /**
   * Create Unauthorized error (401)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static unauthorized(message = 'غير مصرح بهذا الإجراء') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  /**
   * Create Forbidden error (403)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static forbidden(message = 'ليس لديك صلاحية للوصول') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  /**
   * Create Not Found error (404)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static notFound(message = 'العنصر غير موجود') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  /**
   * Create Conflict error (409)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static conflict(message = 'بيانات مكررة') {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  /**
   * Create Unprocessable Entity error (422)
   * @param {string} message - Error message
   * @param {any} details - Validation details
   * @returns {ApiError}
   */
  static unprocessable(message = 'بيانات غير صالحة', details = null) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, details);
  }

  /**
   * Create Too Many Requests error (429)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static tooManyRequests(message = 'تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً') {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message);
  }

  /**
   * Create Internal Server error (500)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static internal(message = 'حدث خطأ في الخادم') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
}

/**
 * Validation error class for request validation
 */
class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    this.errors = errors;
    this.isOperational = true;
  }

  /**
   * Create validation error from express-validator
   * @param {Array} validationErrors - Express validator errors
   * @returns {ValidationError}
   */
  static fromExpressValidator(validationErrors) {
    const formattedErrors = validationErrors.map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    return new ValidationError(formattedErrors);
  }
}

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {string} lang - Language ('ar' or 'en')
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, lang = 'ar') {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const response = {
    success: false,
    error: error.message || getMessage('SERVER_ERROR', lang),
    statusCode: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
  };

  // Add validation details if available
  if (error.errors) {
    response.validationErrors = error.errors;
  }

  // Add stack trace in development mode
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
    response.name = error.name;
  }

  // Add details if available
  if (error.details) {
    response.details = error.details;
  }

  return response;
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Get language from request
  const lang = req.headers['accept-language'] === 'en' ? 'en' : 'ar';
  
  // Log error
  console.error('========================================');
  console.error('🚨 Error occurred:');
  console.error('📌 Timestamp:', new Date().toISOString());
  console.error('📌 Path:', req.method, req.path);
  console.error('📌 Error name:', err.name);
  console.error('📌 Error message:', err.message);
  console.error('📌 Stack trace:', err.stack);
  if (req.user) {
    console.error('📌 User:', req.user);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.error('📌 Request body:', JSON.stringify(req.body, null, 2));
  }
  console.error('========================================');

  // Handle known operational errors
  if (err.isOperational) {
    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const response = formatErrorResponse(err, lang);
    return res.status(statusCode).json(response);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response = formatErrorResponse(
      ApiError.unauthorized('رمز المصادقة غير صالح'),
      lang
    );
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
  }

  if (err.name === 'TokenExpiredError') {
    const response = formatErrorResponse(
      ApiError.unauthorized('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'),
      lang
    );
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
  }

  // Handle Firebase errors
if (err.code && typeof err.code === 'string' && err.code.startsWith('firestore/')) {
    const response = formatErrorResponse(
      ApiError.internal('حدث خطأ في قاعدة البيانات'),
      lang
    );
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError' || err.errors) {
    const statusCode = err.statusCode || HTTP_STATUS.UNPROCESSABLE_ENTITY;
    const response = formatErrorResponse(err, lang);
    return res.status(statusCode).json(response);
  }

  // Handle rate limit errors
  if (err.name === 'RateLimitError') {
    const response = formatErrorResponse(
      ApiError.tooManyRequests('تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً'),
      lang
    );
    return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(response);
  }

  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    let message = 'خطأ في رفع الملف';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'حجم الملف كبير جداً';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'عدد الملفات كبير جداً';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'نوع الملف غير مدعوم';
    }
    const response = formatErrorResponse(ApiError.badRequest(message), lang);
    return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }

  // Handle MongoDB / Firestore duplicate key errors
  if (err.code === 11000) {
    const response = formatErrorResponse(
      ApiError.conflict('هذا العنصر موجود بالفعل'),
      lang
    );
    return res.status(HTTP_STATUS.CONFLICT).json(response);
  }

  // Default internal server error for unhandled errors
  const response = formatErrorResponse(
    ApiError.internal(getMessage('SERVER_ERROR', lang)),
    lang
  );
  
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    delete response.stack;
    delete response.name;
  }
  
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
}

/**
 * Not found handler middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const lang = req.headers['accept-language'] === 'en' ? 'en' : 'ar';
  
  // Handle API routes
  if (req.path.startsWith('/api/')) {
    const error = ApiError.notFound(`API endpoint not found: ${req.method} ${req.path}`);
    return errorHandler(error, req, res, next);
  }
  
  // For non-API routes, let the frontend handle routing
  next();
}

/**
 * Async handler wrapper to avoid try-catch in controllers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Export all error handling utilities
module.exports = {
  ApiError,
  ValidationError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  formatErrorResponse
};