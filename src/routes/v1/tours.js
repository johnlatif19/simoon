// ============================================
// Tours Routes (v1)
// رحلة في مصر - Journey in Egypt
// ============================================

const express = require('express');
const router = express.Router();

// Controllers
const {
  getAllTours,
  getTourById,
  getTourBySlug,
  getFeaturedTours,
  getPopularTours,
  getTopRatedTours,
  searchTours,
  getTourAvailability,
  getTourStatsPublic,
  createTour,
  updateTour,
  deleteTour,
  toggleTourActive,
  toggleTourFeatured,
  bulkUpdateTours,
  getAllToursAdmin,
  getTourStatsAdmin
} = require('../../controllers/tourController');

// Middleware
const { authenticate, adminOnly } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { cacheMiddleware, invalidateCache } = require('../../middleware/cache');
const { sanitizeBody, sanitizeQuery } = require('../../middleware/sanitize');

// Validators
const {
  validateCreateTour,
  validateUpdateTour,
  validateGetTourById,
  validateGetTourBySlug,
  validateGetTours,
  validateDeleteTour,
  validateCheckAvailability,
  validateBulkUpdateTours,
  validateTourStats
} = require('../../validators/tourValidator');

// ============================================
// Public Routes (no authentication required)
// ============================================

/**
 * @route   GET /api/v1/tours
 * @desc    Get all tours with filters
 * @access  Public
 */
router.get(
  '/',
  sanitizeQuery,
  validateGetTours,
  validateRequest,
  cacheMiddleware(1800), // Cache for 30 minutes
  getAllTours
);

/**
 * @route   GET /api/v1/tours/featured
 * @desc    Get featured tours
 * @access  Public
 */
router.get(
  '/featured',
  cacheMiddleware(3600), // Cache for 1 hour
  getFeaturedTours
);

/**
 * @route   GET /api/v1/tours/popular
 * @desc    Get popular tours (most booked)
 * @access  Public
 */
router.get(
  '/popular',
  cacheMiddleware(3600),
  getPopularTours
);

/**
 * @route   GET /api/v1/tours/top-rated
 * @desc    Get top rated tours
 * @access  Public
 */
router.get(
  '/top-rated',
  cacheMiddleware(3600),
  getTopRatedTours
);

/**
 * @route   GET /api/v1/tours/search
 * @desc    Search tours by name or description
 * @access  Public
 */
router.get(
  '/search',
  sanitizeQuery,
  searchTours
);

/**
 * @route   GET /api/v1/tours/stats
 * @desc    Get public tour statistics
 * @access  Public
 */
router.get(
  '/stats',
  cacheMiddleware(7200), // Cache for 2 hours
  getTourStatsPublic
);

/**
 * @route   GET /api/v1/tours/slug/:slug
 * @desc    Get tour by slug
 * @access  Public
 */
router.get(
  '/slug/:slug',
  validateGetTourBySlug,
  validateRequest,
  cacheMiddleware(3600),
  getTourBySlug
);

/**
 * @route   GET /api/v1/tours/:id/availability
 * @desc    Check tour availability for a specific date
 * @access  Public
 */
router.get(
  '/:id/availability',
  validateCheckAvailability,
  validateRequest,
  cacheMiddleware(300), // Cache for 5 minutes
  getTourAvailability
);

/**
 * @route   GET /api/v1/tours/:id
 * @desc    Get tour by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateGetTourById,
  validateRequest,
  cacheMiddleware(3600),
  getTourById
);

// ============================================
// Admin Routes (authentication required)
// ============================================

/**
 * @route   POST /api/v1/tours
 * @desc    Create a new tour
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateCreateTour,
  validateRequest,
  invalidateCache('tours'),
  createTour
);

/**
 * @route   GET /api/v1/tours/admin/all
 * @desc    Get all tours (including inactive) - Admin only
 * @access  Private (Admin only)
 */
router.get(
  '/admin/all',
  authenticate,
  adminOnly,
  sanitizeQuery,
  getAllToursAdmin
);

/**
 * @route   GET /api/v1/tours/admin/stats
 * @desc    Get detailed tour statistics - Admin only
 * @access  Private (Admin only)
 */
router.get(
  '/admin/stats',
  authenticate,
  adminOnly,
  validateTourStats,
  validateRequest,
  getTourStatsAdmin
);

/**
 * @route   PUT /api/v1/tours/:id
 * @desc    Update a tour
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateUpdateTour,
  validateRequest,
  invalidateCache('tours'),
  updateTour
);

/**
 * @route   PATCH /api/v1/tours/:id/toggle-active
 * @desc    Toggle tour active status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/toggle-active',
  authenticate,
  adminOnly,
  validateGetTourById,
  validateRequest,
  invalidateCache('tours'),
  toggleTourActive
);

/**
 * @route   PATCH /api/v1/tours/:id/toggle-featured
 * @desc    Toggle tour featured status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/toggle-featured',
  authenticate,
  adminOnly,
  validateGetTourById,
  validateRequest,
  invalidateCache('tours'),
  toggleTourFeatured
);

/**
 * @route   DELETE /api/v1/tours/:id
 * @desc    Delete a tour
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateDeleteTour,
  validateRequest,
  invalidateCache('tours'),
  deleteTour
);

/**
 * @route   POST /api/v1/tours/bulk-update
 * @desc    Bulk update tours status
 * @access  Private (Admin only)
 */
router.post(
  '/bulk-update',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateBulkUpdateTours,
  validateRequest,
  invalidateCache('tours'),
  bulkUpdateTours
);

module.exports = router;