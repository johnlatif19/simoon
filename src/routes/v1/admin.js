// ============================================
// Admin Routes (v1)
// رحلة في مصر - Journey in Egypt
// ============================================

const express = require('express');
const router = express.Router();

// Controllers
const {
  // User management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  // System
  getSystemStats,
  getLogs,
  clearLogs,
  getSystemHealth
} = require('../../controllers/adminController');

// Email controller
const { sendAdminEmail } = require('../../controllers/emailController');

// Middleware
const { authenticate, adminOnly } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { adminRateLimiter } = require('../../middleware/rateLimiter');
const { sanitizeBody, sanitizeQuery } = require('../../middleware/sanitize');

// Validators
const {
  validateCreateAdmin,
  validateUpdateUser,
  validateGetUserById,
  validateSendEmail,
  validateGetLogs
} = require('../../validators/adminValidator');

// ============================================
// All routes in this file require admin authentication
// ============================================

// Apply admin authentication to all routes
router.use(authenticate, adminOnly, adminRateLimiter);

// ============================================
// System Routes
// ============================================

/**
 * @route   GET /api/v1/admin/system/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
router.get(
  '/system/health',
  getSystemHealth
);

/**
 * @route   GET /api/v1/admin/system/stats
 * @desc    Get system statistics
 * @access  Private (Admin only)
 */
router.get(
  '/system/stats',
  getSystemStats
);

/**
 * @route   GET /api/v1/admin/system/logs
 * @desc    Get system logs
 * @access  Private (Admin only)
 */
router.get(
  '/system/logs',
  sanitizeQuery,
  validateGetLogs,
  validateRequest,
  getLogs
);

/**
 * @route   DELETE /api/v1/admin/system/logs
 * @desc    Clear system logs
 * @access  Private (Admin only)
 */
router.delete(
  '/system/logs',
  clearLogs
);

// ============================================
// Email Routes
// ============================================

/**
 * @route   POST /api/v1/admin/email/send
 * @desc    Send email to customer
 * @access  Private (Admin only)
 */
router.post(
  '/email/send',
  sanitizeBody(),
  validateSendEmail,
  validateRequest,
  sendAdminEmail
);

// ============================================
// User Management Routes
// ============================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get(
  '/users',
  sanitizeQuery,
  getAllUsers
);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get(
  '/users/:id',
  validateGetUserById,
  validateRequest,
  getUserById
);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new user (admin)
 * @access  Private (Admin only)
 */
router.post(
  '/users',
  sanitizeBody(),
  validateCreateAdmin,
  validateRequest,
  createUser
);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/users/:id',
  sanitizeBody(),
  validateUpdateUser,
  validateRequest,
  updateUser
);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete(
  '/users/:id',
  validateGetUserById,
  validateRequest,
  deleteUser
);

// ============================================
// Dashboard Statistics Routes
// ============================================

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get dashboard statistics (overview)
 * @access  Private (Admin only)
 */
router.get(
  '/dashboard/stats',
  async (req, res) => {
    // This will be handled by the adminController
    const { getDashboardStats } = require('../../controllers/adminController');
    await getDashboardStats(req, res);
  }
);

/**
 * @route   GET /api/v1/admin/dashboard/recent
 * @desc    Get recent activities
 * @access  Private (Admin only)
 */
router.get(
  '/dashboard/recent',
  async (req, res) => {
    const { getRecentActivities } = require('../../controllers/adminController');
    await getRecentActivities(req, res);
  }
);

module.exports = router;