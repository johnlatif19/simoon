// @ts-nocheck
const { User, USER_ROLES, USER_STATUS } = require('../models/User');
const { Tour } = require('../models/Tour');
const { Booking } = require('../models/Booking');
const { Contact } = require('../models/Contact');
const { Rating } = require('../models/Rating');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, getMessage } = require('../config/constants');
const { getRecentLogs, clearLogs as clearLogFiles, logSecurity } = require('../utils/logger');
const { seoService } = require('../services/seoService');

// ============================================
// System Health & Statistics
// ============================================

/**
 * @desc    Get system health status
 * @route   GET /api/v1/admin/system/health
 * @access  Private (Admin only)
 */
const getSystemHealth = asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database connection
  try {
    const { getDB } = require('../config/database');
    const db = getDB();
    health.database = db ? 'connected' : 'disconnected';
  } catch (error) {
    health.database = 'error';
    health.status = 'degraded';
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: health
  });
});

/**
 * @desc    Get system statistics
 * @route   GET /api/v1/admin/system/stats
 * @access  Private (Admin only)
 */
const getSystemStats = asyncHandler(async (req, res) => {
  // Get all statistics in parallel
  const [tourStats, bookingStats, contactStats, ratingStats, userStats] = await Promise.all([
    Tour.getStats(),
    Booking.getStats(),
    Contact.getStats(),
    Rating.getStats(),
    User.getStats()
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      tours: tourStats,
      bookings: bookingStats,
      contacts: contactStats,
      ratings: ratingStats,
      users: userStats,
      system: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    }
  });
});

/**
 * @desc    Get dashboard statistics (overview)
 * @route   GET /api/v1/admin/dashboard/stats
 * @access  Private (Admin only)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;

  // Get current date ranges
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
  const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];

  // Get statistics
  const [allBookings, allTours, allContacts, allRatings] = await Promise.all([
    Booking.findAll(),
    Tour.findAll({ isActive: undefined }),
    Contact.findAll(),
    Rating.findAll()
  ]);

  // Calculate today's stats
  const todayBookings = allBookings.filter(b => b.createdAt?.split('T')[0] === today);
  const todayContacts = allContacts.filter(c => c.createdAt?.split('T')[0] === today);
  const todayRatings = allRatings.filter(r => r.createdAt?.split('T')[0] === today);

  // Calculate weekly stats
  const weekBookings = allBookings.filter(b => b.createdAt >= weekAgo);
  const weekContacts = allContacts.filter(c => c.createdAt >= weekAgo);
  const weekRatings = allRatings.filter(r => r.createdAt >= weekAgo);

  // Calculate revenue
  const totalRevenue = allBookings
    .filter(b => b.payment?.status === 'confirmed')
    .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

  const weekRevenue = weekBookings
    .filter(b => b.payment?.status === 'confirmed')
    .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

  // Calculate average rating
  const avgRating = allRatings.length
    ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1)
    : 0;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      overview: {
        totalTours: allTours.length,
        activeTours: allTours.filter(t => t.isActive).length,
        totalBookings: allBookings.length,
        confirmedBookings: allBookings.filter(b => b.payment?.status === 'confirmed').length,
        totalRevenue,
        averageRating: avgRating,
        totalRatings: allRatings.length,
        unreadContacts: allContacts.filter(c => c.status === 'unread').length
      },
      today: {
        bookings: todayBookings.length,
        contacts: todayContacts.length,
        ratings: todayRatings.length
      },
      thisWeek: {
        bookings: weekBookings.length,
        revenue: weekRevenue,
        contacts: weekContacts.length,
        ratings: weekRatings.length
      },
      period
    }
  });
});

/**
 * @desc    Get recent activities
 * @route   GET /api/v1/admin/dashboard/recent
 * @access  Private (Admin only)
 */
const getRecentActivities = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get recent items
  const [recentBookings, recentContacts, recentRatings] = await Promise.all([
    Booking.findAll({ limit: parseInt(limit), orderBy: 'createdAt', orderDirection: 'desc' }),
    Contact.findAll({ limit: parseInt(limit), orderBy: 'createdAt', orderDirection: 'desc' }),
    Rating.findAll({ limit: parseInt(limit), orderBy: 'createdAt', orderDirection: 'desc' })
  ]);

  // Format activities
  const activities = [];

  // Add bookings as activities
  recentBookings.forEach(booking => {
    activities.push({
      id: booking.id,
      type: 'booking',
      action: 'created',
      title: `حجز جديد من ${booking.customer?.name}`,
      description: `رحلة: ${booking.tourName} - ${booking.details?.persons} أشخاص`,
      status: booking.payment?.status,
      createdAt: booking.createdAt,
      icon: 'fas fa-calendar-check',
      color: 'primary'
    });
  });

  // Add contacts as activities
  recentContacts.forEach(contact => {
    activities.push({
      id: contact.id,
      type: 'contact',
      action: contact.status === 'unread' ? 'new' : 'read',
      title: `رسالة جديدة من ${contact.name}`,
      description: contact.message?.substring(0, 100) + (contact.message?.length > 100 ? '...' : ''),
      status: contact.status,
      createdAt: contact.createdAt,
      icon: 'fas fa-envelope',
      color: 'warning'
    });
  });

  // Add ratings as activities
  recentRatings.forEach(rating => {
    activities.push({
      id: rating.id,
      type: 'rating',
      action: 'created',
      title: `تقييم جديد من ${rating.name}`,
      description: `${rating.rating} نجوم - ${rating.message?.substring(0, 100)}...`,
      rating: rating.rating,
      createdAt: rating.createdAt,
      icon: 'fas fa-star',
      color: 'gold'
    });
  });

  // Sort by date (newest first)
  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  activities.slice(0, parseInt(limit));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: activities.length,
    data: activities
  });
});

// ============================================
// System Logs
// ============================================

/**
 * @desc    Get system logs
 * @route   GET /api/v1/admin/system/logs
 * @access  Private (Admin only)
 */
const getLogs = asyncHandler(async (req, res) => {
  const { type = 'combined', lines = 100 } = req.query;

  const logs = await getRecentLogs(type, parseInt(lines));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      type,
      lines: parseInt(lines),
      content: logs
    }
  });
});

/**
 * @desc    Clear system logs
 * @route   DELETE /api/v1/admin/system/logs
 * @access  Private (Admin only)
 */
const clearLogs = asyncHandler(async (req, res) => {
  const success = await clearLogFiles();

  if (success) {
    logSecurity('System logs cleared', req.ip, { userId: req.user?.id });
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: success ? 'Logs cleared successfully' : 'Failed to clear logs'
  });
});

// ============================================
// User Management (Admin)
// ============================================

/**
 * @desc    Get all users
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, limit, page, sortBy, sortOrder } = req.query;

  const filters = {
    role,
    status,
    limit: limit ? parseInt(limit) : 50,
    orderBy: sortBy || 'createdAt',
    orderDirection: sortOrder || 'desc'
  };

  const users = await User.findAll(filters);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: users.length,
    data: users.map(u => u.toJSON())
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user.toJSON()
  });
});

/**
 * @desc    Create new user (admin)
 * @route   POST /api/v1/admin/users
 * @access  Private (Admin only)
 */
const createUser = asyncHandler(async (req, res) => {
  const userData = req.body;

  const user = await User.create({
    ...userData,
    createdBy: req.user.id
  });

  logSecurity('New user created', req.ip, { 
    userId: user.id, 
    username: user.username,
    createdBy: req.user.id 
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User created successfully',
    data: user.toJSON()
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const updatedUser = await User.update(id, updates);

  logSecurity('User updated', req.ip, { 
    userId: id, 
    updatedBy: req.user.id,
    updates: Object.keys(updates)
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser.toJSON()
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Prevent deleting own account
  if (user.id === req.user.id) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  await User.delete(id);

  logSecurity('User deleted', req.ip, { 
    userId: id, 
    username: user.username,
    deletedBy: req.user.id 
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// ============================================
// Sitemap & SEO
// ============================================

/**
 * @desc    Generate and serve sitemap.xml
 * @route   GET /sitemap.xml
 * @access  Public
 */
const generateSitemap = asyncHandler(async (req, res) => {
  const tours = await Tour.findAll({ isActive: true });
  const sitemap = seoService.generateSitemap(tours);

  res.setHeader('Content-Type', 'application/xml');
  res.send(sitemap);
});

/**
 * @desc    Generate and serve robots.txt
 * @route   GET /robots.txt
 * @access  Public
 */
const generateRobotsTxt = asyncHandler(async (req, res) => {
  const robotsTxt = seoService.generateRobotsTxt();

  res.setHeader('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

// Export all controller functions
module.exports = {
  // System
  getSystemHealth,
  getSystemStats,
  getDashboardStats,
  getRecentActivities,
  
  // Logs
  getLogs,
  clearLogs,
  
  // User management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  
  // SEO
  generateSitemap,
  generateRobotsTxt
};