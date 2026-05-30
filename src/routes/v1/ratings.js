// ============================================
// Ratings Routes (v1)
// رحلة في مصر - Journey in Egypt
// ============================================

const express = require('express');
const router = express.Router();

// Controllers
const {
  // Public endpoints
  submitRating,
  getAllRatings,
  getRatingById,
  getRatingsByTour,
  getRecentRatings,
  getTopRatedTours,
  getRatingStats,
  // Admin endpoints
  getAllRatingsAdmin,
  approveRating,
  rejectRating,
  addAdminReply,
  deleteRating,
  bulkDeleteRatings,
  verifyRating,
  searchRatingsAdmin
} = require('../../controllers/ratingController');

// Middleware
const { authenticate, adminOnly } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { ratingRateLimiter } = require('../../middleware/rateLimiter');
const { cacheMiddleware, invalidateCache } = require('../../middleware/cache');
const { sanitizeBody, sanitizeQuery } = require('../../middleware/sanitize');

// Validators
const {
  validateCreateRating,
  validateGetRatingById,
  validateGetRatingsByTour,
  validateAddAdminReply,
  validateVerifyRating
} = require('../../validators/ratingValidator');

// ============================================
// Public Routes (no authentication required)
// ============================================

/**
 * @route   POST /api/v1/ratings
 * @desc    Submit a new rating/review
 * @access  Public (with rate limiting)
 */
router.post(
  '/',
  ratingRateLimiter,
  sanitizeBody(),
  validateCreateRating,
  validateRequest,
  invalidateCache('ratings'),
  submitRating
);

/**
 * @route   GET /api/v1/ratings
 * @desc    Get all ratings (approved only)
 * @access  Public
 */
router.get(
  '/',
  sanitizeQuery,
  cacheMiddleware(1800), // Cache for 30 minutes
  getAllRatings
);

/**
 * @route   GET /api/v1/ratings/recent
 * @desc    Get recent ratings
 * @access  Public
 */
router.get(
  '/recent',
  cacheMiddleware(1800),
  getRecentRatings
);

/**
 * @route   GET /api/v1/ratings/top-tours
 * @desc    Get top rated tours
 * @access  Public
 */
router.get(
  '/top-tours',
  cacheMiddleware(3600), // Cache for 1 hour
  getTopRatedTours
);

/**
 * @route   GET /api/v1/ratings/stats
 * @desc    Get ratings statistics
 * @access  Public
 */
router.get(
  '/stats',
  cacheMiddleware(7200), // Cache for 2 hours
  getRatingStats
);

/**
 * @route   GET /api/v1/ratings/tour/:tourId
 * @desc    Get ratings by tour ID
 * @access  Public
 */
router.get(
  '/tour/:tourId',
  validateGetRatingsByTour,
  validateRequest,
  cacheMiddleware(1800),
  getRatingsByTour
);

/**
 * @route   GET /api/v1/ratings/:id
 * @desc    Get rating by ID
 * @access  Public (only approved ratings)
 */
router.get(
  '/:id',
  validateGetRatingById,
  validateRequest,
  cacheMiddleware(3600),
  getRatingById
);

// ============================================
// Admin Routes (authentication required)
// ============================================

/**
 * @route   GET /api/v1/ratings/admin/all
 * @desc    Get all ratings (including unapproved) - Admin only
 * @access  Private (Admin only)
 */
router.get(
  '/admin/all',
  authenticate,
  adminOnly,
  sanitizeQuery,
  getAllRatingsAdmin
);

/**
 * @route   GET /api/v1/ratings/admin/search
 * @desc    Search ratings - Admin only
 * @access  Private (Admin only)
 */
router.get(
  '/admin/search',
  authenticate,
  adminOnly,
  sanitizeQuery,
  searchRatingsAdmin
);

/**
 * @route   PUT /api/v1/ratings/:id/approve
 * @desc    Approve a rating - Admin only
 * @access  Private (Admin only)
 */
router.put(
  '/:id/approve',
  authenticate,
  adminOnly,
  validateGetRatingById,
  validateRequest,
  invalidateCache('ratings'),
  approveRating
);

/**
 * @route   PUT /api/v1/ratings/:id/reject
 * @desc    Reject/hide a rating - Admin only
 * @access  Private (Admin only)
 */
router.put(
  '/:id/reject',
  authenticate,
  adminOnly,
  validateGetRatingById,
  validateRequest,
  invalidateCache('ratings'),
  rejectRating
);

/**
 * @route   POST /api/v1/ratings/:id/reply
 * @desc    Add admin reply to rating - Admin only
 * @access  Private (Admin only)
 */
router.post(
  '/:id/reply',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateAddAdminReply,
  validateRequest,
  invalidateCache('ratings'),
  addAdminReply
);

/**
 * @route   PUT /api/v1/ratings/:id/verify
 * @desc    Verify a rating (link to booking) - Admin only
 * @access  Private (Admin only)
 */
router.put(
  '/:id/verify',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateVerifyRating,
  validateRequest,
  invalidateCache('ratings'),
  verifyRating
);

/**
 * @route   DELETE /api/v1/ratings/:id
 * @desc    Delete a rating - Admin only
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateGetRatingById,
  validateRequest,
  invalidateCache('ratings'),
  deleteRating
);

/**
 * @route   POST /api/v1/ratings/bulk-delete
 * @desc    Bulk delete ratings - Admin only
 * @access  Private (Admin only)
 */
router.post(
  '/bulk-delete',
  authenticate,
  adminOnly,
  sanitizeBody(),
  bulkDeleteRatings
);

module.exports = router;