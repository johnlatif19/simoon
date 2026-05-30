// ============================================
// Rate Limiter Middleware
// رحلة في مصر - Journey in Egypt
// ============================================

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT, HTTP_STATUS } = require('../config/constants');

/**
 * In-memory store for rate limiting (simple implementation)
 * For production, consider using Redis store
 */
class MemoryStore {
  constructor() {
    this.windowMs = RATE_LIMIT.WINDOW_MS;
    this.maxRequests = RATE_LIMIT.MAX_REQUESTS;
    this.store = new Map();
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get current count for a key
   * @param {string} key - Request identifier (IP or user ID)
   * @returns {Object} { count, resetTime }
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return { count: 0, resetTime: Date.now() + this.windowMs };
    }
    
    // Check if entry is expired
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return { count: 0, resetTime: Date.now() + this.windowMs };
    }
    
    return { count: entry.count, resetTime: entry.resetTime };
  }

  /**
   * Increment count for a key
   * @param {string} key - Request identifier
   * @returns {Object} { count, resetTime }
   */
  increment(key) {
    const current = this.get(key);
    const resetTime = current.resetTime;
    const newCount = current.count + 1;
    
    this.store.set(key, {
      count: newCount,
      resetTime: resetTime
    });
    
    return { count: newCount, resetTime };
  }

  /**
   * Reset count for a key
   * @param {string} key - Request identifier
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get store statistics
   * @returns {Object} Store stats
   */
  getStats() {
    return {
      size: this.store.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    };
  }
}

// Create memory store instance
const memoryStore = new MemoryStore();

/**
 * Get client identifier (IP or user ID if logged in)
 * @param {Object} req - Express request
 * @returns {string} Client identifier
 */
function getClientIdentifier(req) {
  // If user is logged in, use their ID (prevents IP-based blocking for logged-in users)
  if (req.user && req.user.id) {
    return `user_${req.user.id}`;
  }
  
  // Otherwise use IP address
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             'unknown';
  
  // Handle multiple IPs in x-forwarded-for
  const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0];
  
  return `ip_${clientIp}`;
}

/**
 * Standard rate limiter for general API endpoints
 * Limits based on IP address or user ID
 */
const standardRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: 'تم تجاوز عدد المحاولات المسموحة، يرجى المحاولة لاحقاً',
    retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 1000)
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: getClientIdentifier,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      error: options.message.error,
      retryAfter: options.message.retryAfter,
      limit: options.max,
      remaining: 0
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Lower limits to prevent brute force attacks
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: 'محاولات تسجيل دخول كثيرة، يرجى المحاولة بعد 15 دقيقة',
    retryAfter: 900
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: getClientIdentifier,
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Strict rate limiter for booking creation
 * Prevents spam bookings
 */
const bookingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bookings per hour per IP
  message: {
    success: false,
    error: 'لقد قمت بعدة حجوزات خلال ساعة، يرجى المحاولة لاحقاً',
    retryAfter: 3600
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: getClientIdentifier
});

/**
 * Strict rate limiter for contact form submissions
 * Prevents spam messages
 */
const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 messages per hour per IP
  message: {
    success: false,
    error: 'لقد أرسلت عدة رسائل خلال ساعة، يرجى المحاولة لاحقاً',
    retryAfter: 3600
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: getClientIdentifier
});

/**
 * Strict rate limiter for rating submissions
 * Prevents spam ratings
 */
const ratingRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 ratings per day per IP
  message: {
    success: false,
    error: 'لقد قمت بإضافة عدة تقييمات خلال 24 ساعة، يمكنك إضافة تقييم واحد فقط كل 24 ساعة',
    retryAfter: 86400
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: getClientIdentifier
});

/**
 * Admin API rate limiter (higher limits for admin)
 */
const adminRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS * 2, // Double the limit for admin
  message: {
    success: false,
    error: 'تم تجاوز عدد المحاولات المسموحة للمدير، يرجى المحاولة لاحقاً',
    retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 1000)
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: getClientIdentifier,
  skip: (req) => {
    // Only apply to admin users
    return !req.user || req.user.role !== 'admin';
  }
});

/**
 * Custom rate limiter factory
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = RATE_LIMIT.WINDOW_MS,
    max = RATE_LIMIT.MAX_REQUESTS,
    message = 'تم تجاوز عدد المحاولات المسموحة',
    keyGenerator = getClientIdentifier,
    skip = null
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    headers: true,
    keyGenerator,
    skip,
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({
        success: false,
        error: options.message.error,
        retryAfter: options.message.retryAfter,
        limit: options.max,
        remaining: 0
      });
    }
  });
}

/**
 * Reset rate limit for a specific identifier
 * @param {string} identifier - Client identifier
 * @returns {boolean} Success status
 */
function resetRateLimit(identifier) {
  if (memoryStore && identifier) {
    memoryStore.reset(identifier);
    return true;
  }
  return false;
}

/**
 * Get rate limit status for an identifier
 * @param {Object} req - Express request
 * @returns {Object} Rate limit status
 */
function getRateLimitStatus(req) {
  const identifier = getClientIdentifier(req);
  const { count, resetTime } = memoryStore.get(identifier);
  const remaining = Math.max(0, RATE_LIMIT.MAX_REQUESTS - count);
  const resetInSeconds = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
  
  return {
    limit: RATE_LIMIT.MAX_REQUESTS,
    remaining,
    reset: resetInSeconds,
    used: count
  };
}

// Export all rate limiters
module.exports = {
  // Pre-configured limiters
  standardRateLimiter,
  authRateLimiter,
  bookingRateLimiter,
  contactRateLimiter,
  ratingRateLimiter,
  adminRateLimiter,
  
  // Factory and utilities
  createRateLimiter,
  getClientIdentifier,
  resetRateLimit,
  getRateLimitStatus,
  memoryStore
};