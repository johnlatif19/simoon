// ============================================
// Authentication Middleware
// رحلة في مصر - Journey in Egypt
// ============================================

const { verifyToken, extractTokenFromHeader } = require('../config/auth');
const { ApiError } = require('./errorHandler');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Verify JWT token and attach user to request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'No token provided',
      message: 'الرجاء تسجيل الدخول أولاً'
    });
  }

  const decoded = verifyToken(token);

  if (!decoded || decoded.error) {
    let message = 'Invalid token';
    let userMessage = 'رمز المصادقة غير صالح';
    
    if (decoded?.error === 'TokenExpiredError') {
      message = 'Token expired';
      userMessage = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
    }
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: message,
      message: userMessage,
      code: decoded?.error
    });
  }

  // Attach user info to request
  req.user = {
    id: decoded.id || decoded.userId,
    username: decoded.username,
    email: decoded.email,
    role: decoded.role || 'user',
    iat: decoded.iat,
    exp: decoded.exp
  };

  next();
}

/**
 * Optional authentication - doesn't fail if no token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && !decoded.error) {
      req.user = {
        id: decoded.id || decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role || 'user',
        iat: decoded.iat,
        exp: decoded.exp
      };
    }
  }

  next();
}

/**
 * Authorize - check if user has required role
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Unauthorized',
        message: 'الرجاء تسجيل الدخول أولاً'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Forbidden',
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Admin only middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Unauthorized',
      message: 'الرجاء تسجيل الدخول أولاً'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'Forbidden',
      message: 'هذه الصفحة مخصصة للمديرين فقط'
    });
  }

  next();
}

/**
 * Check if user owns a resource (e.g., own booking)
 * @param {Function} getResourceOwnerId - Function to get owner ID from resource
 * @returns {Function} Express middleware
 */
function ownsResource(getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Unauthorized',
        message: 'الرجاء تسجيل الدخول أولاً'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id && ownerId !== req.user.username) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Forbidden',
          message: 'لا يمكنك الوصول إلى بيانات مستخدم آخر'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user is the same as requested user ID
 * @param {string} paramName - Parameter name containing user ID
 * @returns {Function} Express middleware
 */
function isSameUser(paramName = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Unauthorized',
        message: 'الرجاء تسجيل الدخول أولاً'
      });
    }

    // Admin can access any user
    if (req.user.role === 'admin') {
      return next();
    }

    const requestedUserId = req.params[paramName] || req.body[paramName];
    
    if (requestedUserId !== req.user.id && requestedUserId !== req.user.username) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'Forbidden',
        message: 'لا يمكنك الوصول إلى بيانات مستخدم آخر'
      });
    }

    next();
  };
}

/**
 * Check if user is admin or owns the resource
 * @param {Function} getResourceOwnerId - Function to get owner ID from resource
 * @returns {Function} Express middleware
 */
function adminOrOwner(getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Unauthorized',
        message: 'الرجاء تسجيل الدخول أولاً'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id && ownerId !== req.user.username) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: 'Forbidden',
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Rate limit for authenticated users (higher limit)
 * This is a decorator that should be used with rate limiter
 */
function authenticatedRateLimit(rateLimiterMiddleware) {
  return (req, res, next) => {
    // Skip rate limiting for admin users
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    // Apply rate limiter for normal authenticated users
    return rateLimiterMiddleware(req, res, next);
  };
}

/**
 * Extract user from token without failing (for optional auth)
 */
function extractUserIfExists(req) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded || decoded.error) return null;
  
  return {
    id: decoded.id || decoded.userId,
    username: decoded.username,
    email: decoded.email,
    role: decoded.role || 'user'
  };
}

/**
 * Create auth middleware with custom options
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function createAuthMiddleware(options = {}) {
  const {
    required = true,
    roles = null,
    optional = false
  } = options;

  if (optional) {
    return optionalAuthenticate;
  }

  if (roles && roles.length > 0) {
    return [authenticate, authorize(...roles)];
  }

  return authenticate;
}

// Export all auth middleware
module.exports = {
  // Main auth middleware
  authenticate,
  optionalAuthenticate,
  authorize,
  adminOnly,
  
  // Resource ownership middleware
  ownsResource,
  isSameUser,
  adminOrOwner,
  
  // Utility middleware
  authenticatedRateLimit,
  extractUserIfExists,
  createAuthMiddleware,
  
  // Re-export status code for convenience
  HTTP_STATUS
};