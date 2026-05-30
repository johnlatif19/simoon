// ============================================
// Bookings Routes (v1)
// رحلة في مصر - Journey in Egypt
// ============================================

const express = require('express');
const router = express.Router();

// Controllers
const {
  createBooking,
  calculateBookingPrice,
  getAllBookings,
  getBookingById,
  getBookingsByCustomer,
  getBookingsByTour,
  updateBookingStatus,
  confirmPayment,
  cancelBooking,
  deleteBooking,
  getBookingStats,
  updateBooking,
  getBookingByTransferNumber
} = require('../../controllers/bookingController');

// Middleware
const { authenticate, adminOnly } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { bookingRateLimiter } = require('../../middleware/rateLimiter');
const { sanitizeBody, sanitizeQuery } = require('../../middleware/sanitize');

// Validators
const {
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateConfirmPayment,
  validateGetBookingById,
  validateGetBookings,
  validateDeleteBooking,
  validateCalculatePrice,
  validateCancelBooking,
  validateBookingStats
} = require('../../validators/bookingValidator');

// ============================================
// Public Routes (no authentication required)
// ============================================

/**
 * @route   POST /api/v1/bookings/calculate
 * @desc    Calculate price for a booking
 * @access  Public
 */
router.post(
  '/calculate',
  sanitizeBody(),
  validateCalculatePrice,
  validateRequest,
  calculateBookingPrice
);

/**
 * @route   POST /api/v1/bookings
 * @desc    Create a new booking
 * @access  Public (with rate limiting)
 */
router.post(
  '/',
  bookingRateLimiter,
  sanitizeBody(),
  validateCreateBooking,
  validateRequest,
  createBooking
);

/**
 * @route   POST /api/v1/bookings/confirm-payment
 * @desc    Confirm payment for a booking
 * @access  Public
 */
router.post(
  '/confirm-payment',
  sanitizeBody(),
  validateConfirmPayment,
  validateRequest,
  confirmPayment
);

/**
 * @route   GET /api/v1/bookings/customer/:email
 * @desc    Get bookings by customer email (requires auth for own bookings)
 * @access  Private (Admin or Owner)
 */
router.get(
  '/customer/:email',
  authenticate,
  getBookingsByCustomer
);

/**
 * @route   GET /api/v1/bookings/transfer/:transferNumber
 * @desc    Get booking by transfer number
 * @access  Private (Admin only)
 */
router.get(
  '/transfer/:transferNumber',
  authenticate,
  adminOnly,
  getBookingByTransferNumber
);

/**
 * @route   GET /api/v1/bookings/tour/:tourId
 * @desc    Get bookings by tour ID
 * @access  Private (Admin only)
 */
router.get(
  '/tour/:tourId',
  authenticate,
  adminOnly,
  getBookingsByTour
);

// ============================================
// Admin Routes (authentication required)
// ============================================

/**
 * @route   GET /api/v1/bookings
 * @desc    Get all bookings (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  sanitizeQuery,
  validateGetBookings,
  validateRequest,
  getAllBookings
);

/**
 * @route   GET /api/v1/bookings/stats
 * @desc    Get booking statistics (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  authenticate,
  adminOnly,
  validateBookingStats,
  validateRequest,
  getBookingStats
);

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking by ID
 * @access  Private (Admin or Owner)
 */
router.get(
  '/:id',
  authenticate,
  validateGetBookingById,
  validateRequest,
  getBookingById
);

/**
 * @route   PUT /api/v1/bookings/:id
 * @desc    Update booking details (admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateGetBookingById,
  validateRequest,
  updateBooking
);

/**
 * @route   PUT /api/v1/bookings/:id/status
 * @desc    Update booking status (admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:id/status',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateUpdateBookingStatus,
  validateRequest,
  updateBookingStatus
);

/**
 * @route   PUT /api/v1/bookings/:id/cancel
 * @desc    Cancel booking (admin or owner)
 * @access  Private (Admin or Owner)
 */
router.put(
  '/:id/cancel',
  authenticate,
  sanitizeBody(),
  validateCancelBooking,
  validateRequest,
  cancelBooking
);

/**
 * @route   DELETE /api/v1/bookings/:id
 * @desc    Delete booking (admin only)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateDeleteBooking,
  validateRequest,
  deleteBooking
);

module.exports = router;