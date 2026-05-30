// ============================================
// Tour Controller
// رحلة في مصر - Journey in Egypt
// ============================================

const { Tour } = require('../models/Tour');
const { Rating } = require('../models/Rating');
const { Booking } = require('../models/Booking');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, getMessage } = require('../config/constants');
const { slugify } = require('../utils/slugify');

/**
 * @desc    Get all tours (public)
 * @route   GET /api/v1/tours
 * @access  Public
 */
const getAllTours = asyncHandler(async (req, res) => {
  const { 
    featured, 
    minPrice, 
    maxPrice, 
    duration, 
    search, 
    sortBy, 
    sortOrder,
    limit,
    page 
  } = req.query;
  
  const filters = {
    isActive: true,
    featured: featured === 'true' ? true : (featured === 'false' ? false : undefined),
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    duration,
    search,
    orderBy: sortBy || 'createdAt',
    orderDirection: sortOrder || 'desc',
    limit: limit ? parseInt(limit) : 20
  };
  
  const tours = await Tour.findAll(filters);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: tours.length,
    data: tours.map(t => t.toJSON())
  });
});

/**
 * @desc    Get tour by ID
 * @route   GET /api/v1/tours/:id
 * @access  Public
 */
const getTourById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tour = await Tour.findById(id);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  // Get tour ratings
  const ratings = await Rating.findByTourId(id, { limit: 10 });
  const averageRating = await Rating.getAverageRating(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...tour.toJSON(),
      ratings: {
        average: averageRating.average,
        total: averageRating.total,
        distribution: averageRating.distribution,
        recent: ratings.map(r => r.toJSON())
      }
    }
  });
});

/**
 * @desc    Get tour by slug
 * @route   GET /api/v1/tours/slug/:slug
 * @access  Public
 */
const getTourBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const tour = await Tour.findBySlug(slug);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  // Get tour ratings
  const ratings = await Rating.findByTourId(tour.id, { limit: 10 });
  const averageRating = await Rating.getAverageRating(tour.id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...tour.toJSON(),
      ratings: {
        average: averageRating.average,
        total: averageRating.total,
        distribution: averageRating.distribution,
        recent: ratings.map(r => r.toJSON())
      }
    }
  });
});

/**
 * @desc    Get featured tours
 * @route   GET /api/v1/tours/featured
 * @access  Public
 */
const getFeaturedTours = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  
  const tours = await Tour.getFeaturedTours(parseInt(limit));
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: tours.length,
    data: tours.map(t => t.toJSON())
  });
});

/**
 * @desc    Get popular tours (most booked)
 * @route   GET /api/v1/tours/popular
 * @access  Public
 */
const getPopularTours = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  
  const tours = await Tour.getPopularTours(parseInt(limit));
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: tours.length,
    data: tours.map(t => t.toJSON())
  });
});

/**
 * @desc    Get top rated tours
 * @route   GET /api/v1/tours/top-rated
 * @access  Public
 */
const getTopRatedTours = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  
  const tours = await Tour.getTopRatedTours(parseInt(limit));
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: tours.length,
    data: tours.map(t => t.toJSON())
  });
});

/**
 * @desc    Search tours
 * @route   GET /api/v1/tours/search
 * @access  Public
 */
const searchTours = asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest('Search term must be at least 2 characters');
  }
  
  const filters = {
    isActive: true,
    search: q,
    limit: parseInt(limit)
  };
  
  const tours = await Tour.findAll(filters);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: tours.length,
    data: tours.map(t => t.toJSON())
  });
});

/**
 * @desc    Get tour availability
 * @route   GET /api/v1/tours/:id/availability
 * @access  Public
 */
const getTourAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  const tour = await Tour.findById(id);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  // Get bookings for this tour on the specified date
  let bookingsCount = 0;
  if (date) {
    const bookings = await Booking.findByTourId(id);
    const bookingsOnDate = bookings.filter(b => b.details.date === date);
    bookingsCount = bookingsOnDate.reduce((sum, b) => sum + b.details.persons, 0);
  }
  
  const availableSpots = Math.max(0, tour.maxPersons - bookingsCount);
  const isAvailable = availableSpots > 0;
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      tourId: tour.id,
      tourName: req.lang === 'ar' ? tour.nameAr : tour.nameEn,
      maxPersons: tour.maxPersons,
      bookedPersons: bookingsCount,
      availableSpots,
      isAvailable,
      date: date || null
    }
  });
});

/**
 * @desc    Get tour statistics (public)
 * @route   GET /api/v1/tours/stats
 * @access  Public
 */
const getTourStatsPublic = asyncHandler(async (req, res) => {
  const stats = await Tour.getStats();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      totalTours: stats.active,
      totalBookings: stats.totalBookings,
      averagePrice: stats.averagePrice
    }
  });
});

// ============================================
// Admin Only Controllers
// ============================================

/**
 * @desc    Create a new tour (admin only)
 * @route   POST /api/v1/tours
 * @access  Private (Admin)
 */
const createTour = asyncHandler(async (req, res) => {
  const tourData = req.body;
  
  // Generate slug if not provided
  if (!tourData.slug) {
    tourData.slug = slugify(tourData.nameEn || tourData.nameAr);
  }
  
  const tour = await Tour.create(tourData);
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: getMessage('TOUR_CREATED', req.lang),
    data: tour.toJSON()
  });
});

/**
 * @desc    Update tour (admin only)
 * @route   PUT /api/v1/tours/:id
 * @access  Private (Admin)
 */
const updateTour = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tour = await Tour.findById(id);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  const updatedTour = await Tour.update(id, req.body);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: getMessage('TOUR_UPDATED', req.lang),
    data: updatedTour.toJSON()
  });
});

/**
 * @desc    Delete tour (admin only)
 * @route   DELETE /api/v1/tours/:id
 * @access  Private (Admin)
 */
const deleteTour = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tour = await Tour.findById(id);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  await Tour.delete(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: getMessage('TOUR_DELETED', req.lang)
  });
});

/**
 * @desc    Toggle tour active status (admin only)
 * @route   PATCH /api/v1/tours/:id/toggle-active
 * @access  Private (Admin)
 */
const toggleTourActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tour = await Tour.findById(id);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  const updatedTour = await Tour.update(id, { isActive: !tour.isActive });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Tour ${updatedTour.isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedTour.toJSON()
  });
});

/**
 * @desc    Toggle tour featured status (admin only)
 * @route   PATCH /api/v1/tours/:id/toggle-featured
 * @access  Private (Admin)
 */
const toggleTourFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tour = await Tour.findById(id);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  const updatedTour = await Tour.update(id, { featured: !tour.featured });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Tour ${updatedTour.featured ? 'featured' : 'unfeatured'} successfully`,
    data: updatedTour.toJSON()
  });
});

/**
 * @desc    Bulk update tours status (admin only)
 * @route   POST /api/v1/tours/bulk-update
 * @access  Private (Admin)
 */
const bulkUpdateTours = asyncHandler(async (req, res) => {
  const { ids, isActive, featured } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('Please provide an array of tour IDs');
  }
  
  let updatedCount = 0;
  
  for (const id of ids) {
    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (featured !== undefined) updates.featured = featured;
    
    if (Object.keys(updates).length > 0) {
      await Tour.update(id, updates);
      updatedCount++;
    }
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${updatedCount} tours updated successfully`,
    data: { updatedCount }
  });
});

/**
 * @desc    Get all tours (admin - includes inactive)
 * @route   GET /api/v1/tours/admin/all
 * @access  Private (Admin)
 */
const getAllToursAdmin = asyncHandler(async (req, res) => {
  const { status, featured, limit, page } = req.query;
  
  const filters = {
    isActive: status === 'active' ? true : (status === 'inactive' ? false : undefined),
    featured: featured === 'true' ? true : (featured === 'false' ? false : undefined),
    limit: limit ? parseInt(limit) : 100,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  };
  
  const tours = await Tour.findAll(filters);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: tours.length,
    data: tours.map(t => t.toJSON())
  });
});

/**
 * @desc    Get tour statistics (admin)
 * @route   GET /api/v1/tours/admin/stats
 * @access  Private (Admin)
 */
const getTourStatsAdmin = asyncHandler(async (req, res) => {
  const stats = await Tour.getStats();
  
  // Get additional stats
  const allTours = await Tour.findAll({ isActive: undefined });
  const toursWithRatings = allTours.filter(t => t.totalRatings > 0);
  const avgRating = toursWithRatings.reduce((sum, t) => sum + t.rating, 0) / (toursWithRatings.length || 1);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...stats,
      averageRating: Math.round(avgRating * 10) / 10,
      toursWithRatings: toursWithRatings.length,
      toursWithoutRatings: allTours.length - toursWithRatings.length
    }
  });
});

// Export all controller functions
module.exports = {
  // Public endpoints
  getAllTours,
  getTourById,
  getTourBySlug,
  getFeaturedTours,
  getPopularTours,
  getTopRatedTours,
  searchTours,
  getTourAvailability,
  getTourStatsPublic,
  
  // Admin endpoints
  createTour,
  updateTour,
  deleteTour,
  toggleTourActive,
  toggleTourFeatured,
  bulkUpdateTours,
  getAllToursAdmin,
  getTourStatsAdmin
};