// ============================================
// Routes Index
// رحلة في مصر - Journey in Egypt
// ============================================

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./v1/auth');
const tourRoutes = require('./v1/tours');
const bookingRoutes = require('./v1/bookings');
const ratingRoutes = require('./v1/ratings');
const contactRoutes = require('./v1/contacts');
const adminRoutes = require('./v1/admin');

// API version information
const API_VERSION = 'v1';
const API_PREFIX = '/api/v1';

/**
 * Mount all routes
 * @param {Object} app - Express app instance
 */
function mountRoutes(app) {
  // API info endpoint
  app.get(`${API_PREFIX}`, (req, res) => {
    res.status(200).json({
      name: 'رحلة في مصر API',
      version: API_VERSION,
      description: 'Tourism platform API for booking tours in Egypt',
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        tours: `${API_PREFIX}/tours`,
        bookings: `${API_PREFIX}/bookings`,
        ratings: `${API_PREFIX}/ratings`,
        contacts: `${API_PREFIX}/contacts`,
        admin: `${API_PREFIX}/admin`
      },
      documentation: `${process.env.SITE_URL || 'https://simoon-issac.vercel.app'}/api-docs`,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: API_VERSION
    });
  });

  // Mount individual route modules
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/tours`, tourRoutes);
  app.use(`${API_PREFIX}/bookings`, bookingRoutes);
  app.use(`${API_PREFIX}/ratings`, ratingRoutes);
  app.use(`${API_PREFIX}/contacts`, contactRoutes);
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  // 404 handler for API routes (catch-all for undefined API endpoints)
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        `${API_PREFIX}/auth`,
        `${API_PREFIX}/tours`,
        `${API_PREFIX}/bookings`,
        `${API_PREFIX}/ratings`,
        `${API_PREFIX}/contacts`,
        `${API_PREFIX}/admin`
      ]
    });
  });
}

// Export router and mount function
module.exports = {
  router,
  mountRoutes,
  API_VERSION,
  API_PREFIX
};