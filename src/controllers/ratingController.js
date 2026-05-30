// ============================================
// Rating Controller
// رحلة في مصر - Journey in Egypt
// ============================================

const { Rating } = require('../models/Rating');
const { Tour } = require('../models/Tour');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, getMessage } = require('../config/constants');

/**
 * @desc    Submit a new rating/review
 * @route   POST /api/v1/ratings
 * @access  Public
 */
const submitRating = asyncHandler(async (req, res) => {
  const { name, email, country, rating, message, tourId } = req.body;
  
  let tourName = null;
  let isVerified = false;
  
  // If tourId is provided, get tour name
  if (tourId) {
    const tour = await Tour.findById(tourId);
    if (tour) {
      tourName = req.lang === 'ar' ? tour.nameAr : tour.nameEn;
      isVerified = true; // Can be set to true if user has booked this tour
    }
  }
  
  // Create rating
  const newRating = await Rating.create({
    name,
    email,
    country,
    rating,
    message,
    tourId,
    tourName,
    isVerified
  });
  
  // Update tour rating if tourId is provided
  if (tourId) {
    try {
      await Tour.updateRating(tourId, rating);
    } catch (error) {
      console.error('Failed to update tour rating:', error);
    }
  }
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: getMessage('RATING_ADDED', req.lang),
    data: newRating.toJSON()
  });
});

/**
 * @desc    Get all ratings (public)
 * @route   GET /api/v1/ratings
 * @access  Public
 */
const getAllRatings = asyncHandler(async (req, res) => {
  const { rating, minRating, maxRating, tourId, country, limit, page } = req.query;
  
  const filters = {
    rating: rating ? parseInt(rating) : undefined,
    minRating: minRating ? parseInt(minRating) : undefined,
    maxRating: maxRating ? parseInt(maxRating) : undefined,
    tourId,
    country,
    isApproved: true, // Only show approved ratings to public
    limit: limit ? parseInt(limit) : 50,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  };
  
  const ratings = await Rating.findAll(filters);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: ratings.length,
    data: ratings.map(r => r.toJSON())
  });
});

/**
 * @desc    Get rating by ID
 * @route   GET /api/v1/ratings/:id
 * @access  Public
 */
const getRatingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const rating = await Rating.findById(id);
  if (!rating) {
    throw ApiError.notFound('Rating not found');
  }
  
  // Only show approved ratings to public
  if (!rating.isApproved && (!req.user || req.user.role !== 'admin')) {
    throw ApiError.notFound('Rating not found');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: rating.toJSON()
  });
});

/**
 * @desc    Get ratings by tour ID
 * @route   GET /api/v1/ratings/tour/:tourId
 * @access  Public
 */
const getRatingsByTour = asyncHandler(async (req, res) => {
  const { tourId } = req.params;
  const { limit, page } = req.query;
  
  const tour = await Tour.findById(tourId);
  if (!tour) {
    throw ApiError.notFound('Tour not found');
  }
  
  const ratings = await Rating.findByTourId(tourId, {
    limit: limit ? parseInt(limit) : 20,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  });
  
  // Get average rating
  const averageRating = await Rating.getAverageRating(tourId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: ratings.length,
    data: {
      tour: {
        id: tour.id,
        name: req.lang === 'ar' ? tour.nameAr : tour.nameEn,
        rating: tour.rating,
        totalRatings: tour.totalRatings
      },
      average: averageRating,
      ratings: ratings.map(r => r.toJSON())
    }
  });
});

/**
 * @desc    Get recent ratings
 * @route   GET /api/v1/ratings/recent
 * @access  Public
 */
const getRecentRatings = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  
  const ratings = await Rating.getRecentRatings(parseInt(limit));
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: ratings.length,
    data: ratings.map(r => r.toJSON())
  });
});

/**
 * @desc    Get top rated tours
 * @route   GET /api/v1/ratings/top-tours
 * @access  Public
 */
const getTopRatedTours = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const topTours = await Rating.getTopRatedTours(parseInt(limit));
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: topTours.length,
    data: topTours
  });
});

/**
 * @desc    Get ratings statistics (public)
 * @route   GET /api/v1/ratings/stats
 * @access  Public
 */
const getRatingStats = asyncHandler(async (req, res) => {
  const stats = await Rating.getStats();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats
  });
});

// ============================================
// Admin Only Controllers
// ============================================

/**
 * @desc    Get all ratings (including unapproved) - Admin only
 * @route   GET /api/v1/ratings/admin/all
 * @access  Private (Admin)
 */
const getAllRatingsAdmin = asyncHandler(async (req, res) => {
  const { status, rating, tourId, isApproved, limit, page } = req.query;
  
  const filters = {
    rating: rating ? parseInt(rating) : undefined,
    tourId,
    isApproved: isApproved !== undefined ? isApproved === 'true' : undefined,
    limit: limit ? parseInt(limit) : 100,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  };
  
  const ratings = await Rating.findAll(filters);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: ratings.length,
    data: ratings.map(r => r.toJSON())
  });
});

/**
 * @desc    Approve a rating - Admin only
 * @route   PUT /api/v1/ratings/:id/approve
 * @access  Private (Admin)
 */
const approveRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const rating = await Rating.findById(id);
  if (!rating) {
    throw ApiError.notFound('Rating not found');
  }
  
  const updatedRating = await Rating.approve(id);
  
  // Update tour rating if tourId exists
  if (rating.tourId && !rating.isApproved) {
    try {
      await Tour.updateRating(rating.tourId, rating.rating);
    } catch (error) {
      console.error('Failed to update tour rating:', error);
    }
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Rating approved successfully',
    data: updatedRating.toJSON()
  });
});

/**
 * @desc    Reject/hide a rating - Admin only
 * @route   PUT /api/v1/ratings/:id/reject
 * @access  Private (Admin)
 */
const rejectRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const rating = await Rating.findById(id);
  if (!rating) {
    throw ApiError.notFound('Rating not found');
  }
  
  const updatedRating = await Rating.reject(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Rating hidden successfully',
    data: updatedRating.toJSON()
  });
});

/**
 * @desc    Add admin reply to rating - Admin only
 * @route   POST /api/v1/ratings/:id/reply
 * @access  Private (Admin)
 */
const addAdminReply = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  
  if (!reply || reply.trim().length === 0) {
    throw ApiError.badRequest('Reply message is required');
  }
  
  const rating = await Rating.findById(id);
  if (!rating) {
    throw ApiError.notFound('Rating not found');
  }
  
  const updatedRating = await Rating.addAdminReply(id, reply);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Reply added successfully',
    data: updatedRating.toJSON()
  });
});

/**
 * @desc    Delete rating - Admin only
 * @route   DELETE /api/v1/ratings/:id
 * @access  Private (Admin)
 */
const deleteRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const rating = await Rating.findById(id);
  if (!rating) {
    throw ApiError.notFound('Rating not found');
  }
  
  await Rating.delete(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Rating deleted successfully'
  });
});

/**
 * @desc    Bulk delete ratings - Admin only
 * @route   POST /api/v1/ratings/bulk-delete
 * @access  Private (Admin)
 */
const bulkDeleteRatings = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('Please provide an array of rating IDs to delete');
  }
  
  const deletedCount = await Rating.bulkDelete(ids);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${deletedCount} ratings deleted successfully`,
    data: { deletedCount }
  });
});

/**
 * @desc    Verify a rating (link to booking) - Admin only
 * @route   PUT /api/v1/ratings/:id/verify
 * @access  Private (Admin)
 */
const verifyRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bookingId } = req.body;
  
  const rating = await Rating.findById(id);
  if (!rating) {
    throw ApiError.notFound('Rating not found');
  }
  
  const updatedRating = await Rating.verify(id, bookingId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Rating verified successfully',
    data: updatedRating.toJSON()
  });
});

/**
 * @desc    Search ratings (admin)
 * @route   GET /api/v1/ratings/admin/search
 * @access  Private (Admin)
 */
const searchRatingsAdmin = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest('Search term must be at least 2 characters');
  }
  
  const ratings = await Rating.search(q);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: ratings.length,
    data: ratings.map(r => r.toJSON())
  });
});

// Export all controller functions
module.exports = {
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
};