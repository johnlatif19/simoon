// ============================================
// Vercel Serverless Function Entry Point
// رحلة في مصر - Journey in Egypt
// ============================================

// Load environment variables
require('dotenv').config();

// Import the Express app
const app = require('../src/app');

// Export the app for Vercel
module.exports = app;