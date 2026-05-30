// ============================================
// Contacts Routes (v1)
// رحلة في مصر - Journey in Egypt
// ============================================

const express = require('express');
const router = express.Router();

// Controllers
const {
  // Public endpoints
  submitContact,
  // Admin endpoints
  getAllContacts,
  getContactById,
  getUnreadCount,
  getUnreadContacts,
  getContactsByEmail,
  markAsRead,
  replyToContact,
  archiveContact,
  deleteContact,
  bulkDeleteContacts,
  bulkMarkAsRead,
  getContactStats,
  searchContacts,
  updateContactNotes
} = require('../../controllers/contactController');

// Middleware
const { authenticate, adminOnly } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { contactRateLimiter } = require('../../middleware/rateLimiter');
const { cacheMiddleware, invalidateCache } = require('../../middleware/cache');
const { sanitizeBody, sanitizeQuery } = require('../../middleware/sanitize');

// Validators
const {
  validateCreateContact,
  validateGetContactById,
  validateReplyToContact,
  validateUpdateContactNotes,
  validateBulkDeleteContacts,
  validateBulkMarkAsRead,
  validateSearchContacts
} = require('../../validators/contactValidator');

// ============================================
// Public Routes (no authentication required)
// ============================================

/**
 * @route   POST /api/v1/contacts
 * @desc    Submit a contact message
 * @access  Public (with rate limiting)
 */
router.post(
  '/',
  contactRateLimiter,
  sanitizeBody(),
  validateCreateContact,
  validateRequest,
  invalidateCache('contacts'),
  submitContact
);

// ============================================
// Admin Routes (authentication required)
// ============================================

/**
 * @route   GET /api/v1/contacts
 * @desc    Get all contacts (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authenticate,
  adminOnly,
  sanitizeQuery,
  getAllContacts
);

/**
 * @route   GET /api/v1/contacts/stats
 * @desc    Get contact statistics (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  authenticate,
  adminOnly,
  cacheMiddleware(3600), // Cache for 1 hour
  getContactStats
);

/**
 * @route   GET /api/v1/contacts/unread/count
 * @desc    Get unread contacts count (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/unread/count',
  authenticate,
  adminOnly,
  cacheMiddleware(300), // Cache for 5 minutes
  getUnreadCount
);

/**
 * @route   GET /api/v1/contacts/unread
 * @desc    Get unread contacts (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/unread',
  authenticate,
  adminOnly,
  sanitizeQuery,
  getUnreadContacts
);

/**
 * @route   GET /api/v1/contacts/email/:email
 * @desc    Get contacts by email (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/email/:email',
  authenticate,
  adminOnly,
  getContactsByEmail
);

/**
 * @route   GET /api/v1/contacts/search
 * @desc    Search contacts (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/search',
  authenticate,
  adminOnly,
  sanitizeQuery,
  validateSearchContacts,
  validateRequest,
  searchContacts
);

/**
 * @route   GET /api/v1/contacts/:id
 * @desc    Get contact by ID (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  authenticate,
  adminOnly,
  validateGetContactById,
  validateRequest,
  getContactById
);

/**
 * @route   PUT /api/v1/contacts/:id/read
 * @desc    Mark contact as read (admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:id/read',
  authenticate,
  adminOnly,
  validateGetContactById,
  validateRequest,
  invalidateCache('contacts'),
  markAsRead
);

/**
 * @route   POST /api/v1/contacts/:id/reply
 * @desc    Reply to contact message (admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/:id/reply',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateReplyToContact,
  validateRequest,
  invalidateCache('contacts'),
  replyToContact
);

/**
 * @route   PUT /api/v1/contacts/:id/archive
 * @desc    Archive contact (admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:id/archive',
  authenticate,
  adminOnly,
  validateGetContactById,
  validateRequest,
  invalidateCache('contacts'),
  archiveContact
);

/**
 * @route   PUT /api/v1/contacts/:id/notes
 * @desc    Update contact notes (admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:id/notes',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateUpdateContactNotes,
  validateRequest,
  updateContactNotes
);

/**
 * @route   DELETE /api/v1/contacts/:id
 * @desc    Delete contact (admin only)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateGetContactById,
  validateRequest,
  invalidateCache('contacts'),
  deleteContact
);

/**
 * @route   POST /api/v1/contacts/bulk-delete
 * @desc    Bulk delete contacts (admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/bulk-delete',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateBulkDeleteContacts,
  validateRequest,
  invalidateCache('contacts'),
  bulkDeleteContacts
);

/**
 * @route   POST /api/v1/contacts/bulk-read
 * @desc    Bulk mark contacts as read (admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/bulk-read',
  authenticate,
  adminOnly,
  sanitizeBody(),
  validateBulkMarkAsRead,
  validateRequest,
  invalidateCache('contacts'),
  bulkMarkAsRead
);

module.exports = router;