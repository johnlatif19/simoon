// ============================================
// رحلة في مصر - Journey in Egypt
// Express App Configuration
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { standardRateLimiter } = require('./middleware/rateLimiter');

// Import routes (v1)
const authRoutes = require('./routes/v1/auth');
const tourRoutes = require('./routes/v1/tours');
const bookingRoutes = require('./routes/v1/bookings');
const ratingRoutes = require('./routes/v1/ratings');
const contactRoutes = require('./routes/v1/contacts');

// Initialize express app
const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://i.postimg.cc", "https://images.unsplash.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.SITE_URL || 'https://simoon-issac.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================
// Standard Middleware
// ============================================

// Compression - Gzip response compression
app.use(compression());

// Logging - Morgan for development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting - Protect from DDoS (NOW ACTIVE)
app.use(standardRateLimiter);

// ============================================
// Static Files
// ============================================

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// API Routes (v1)
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API version info
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'Journey in Egypt API',
    version: '3.0.0',
    description: 'Tourism platform API for booking tours in Egypt',
    endpoints: {
      auth: '/api/v1/auth',
      tours: '/api/v1/tours',
      bookings: '/api/v1/bookings',
      ratings: '/api/v1/ratings',
      contacts: '/api/v1/contacts'
    }
  });
});

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/contacts', contactRoutes);

// ============================================
// HTML Routes (for direct access)
// ============================================

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Tour details page
app.get('/tour-details', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/tour-details.html'));
});

// Payment page
app.get('/pay', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pay.html'));
});

// Rate page
app.get('/rate', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/rate.html'));
});

// ============================================
// Catch-All Route (SPA support)
// ============================================

// For any other route, serve index.html
app.get('*', (req, res) => {
  // Don't catch API routes that weren't found
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.path}`
    });
  }
  
  // Serve index.html for all other routes
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================
// Error Handling Middleware (must be last)
// ============================================

// 404 handler for non-existent routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.path}`
    });
  } else {
    // For non-API routes, serve index.html (let frontend handle routing)
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Global error handler
app.use(errorHandler);

// ============================================
// Export app
// ============================================

module.exports = app;