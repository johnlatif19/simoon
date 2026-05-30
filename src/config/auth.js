// ============================================
// JWT Authentication Configuration
// رحلة في مصر - Journey in Egypt
// ============================================

const jwt = require('jsonwebtoken');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h'; // Token expires in 24 hours
const JWT_REFRESH_EXPIRES_IN = '7d'; // Refresh token expires in 7 days

/**
 * Generate JWT token for authenticated user
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode in token
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: 'TokenExpiredError', message: 'Token has expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { error: 'JsonWebTokenError', message: 'Invalid token' };
    }
    return null;
  }
}

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if expired
 */
function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Get remaining time for token in seconds
 * @param {string} token - JWT token
 * @returns {number} Remaining seconds, 0 if expired
 */
function getTokenRemainingTime(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
}

/**
 * Generate admin token using credentials from .env
 * @returns {Object} { token, refreshToken, expiresIn }
 */
function generateAdminToken() {
  const payload = {
    username: process.env.ADMIN_USERNAME || 'admin',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000)
  };
  
  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    token,
    refreshToken,
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
    user: {
      username: payload.username,
      role: payload.role
    }
  };
}

/**
 * Validate admin credentials
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {boolean} True if credentials are valid
 */
function validateAdminCredentials(username, password) {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  return username === adminUsername && password === adminPassword;
}

/**
 * Refresh an expired token
 * @param {string} refreshToken - Refresh token
 * @returns {Object|null} New token pair or null if invalid
 */
function refreshToken(refreshToken) {
  const decoded = verifyToken(refreshToken);
  
  if (!decoded || decoded.error) {
    return null;
  }
  
  // Generate new token pair
  const payload = {
    username: decoded.username,
    role: decoded.role,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return {
    token: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: 24 * 60 * 60
  };
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Create authentication middleware
 * @returns {Function} Express middleware
 */
function createAuthMiddleware() {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authentication required'
      });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.error) {
      let message = 'Invalid token';
      if (decoded?.error === 'TokenExpiredError') {
        message = 'Token has expired';
      }
      return res.status(401).json({
        success: false,
        error: message,
        code: decoded?.error
      });
    }
    
    req.user = decoded;
    next();
  };
}

/**
 * Create admin-only middleware
 * @returns {Function} Express middleware
 */
function createAdminMiddleware() {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }
    next();
  };
}

// Export all auth utilities
module.exports = {
  // Token generation
  generateToken,
  generateRefreshToken,
  generateAdminToken,
  
  // Token verification
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenRemainingTime,
  refreshToken,
  
  // Token extraction
  extractTokenFromHeader,
  
  // Admin validation
  validateAdminCredentials,
  
  // Middleware creators
  createAuthMiddleware,
  createAdminMiddleware,
  
  // Constants
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};