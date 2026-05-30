// ============================================
// رحلة في مصر - Journey in Egypt
// Server Entry Point
// ============================================

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🏛️  رحلة في مصر - Journey in Egypt  🏛️                 ║
  ║                                                           ║
  ║   🚀 Server is running!                                   ║
  ║   📡 Port: ${PORT}                                           ║
  ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                    ║
  ║                                                           ║
  ║   📱 Main Site:     http://localhost:${PORT}/              ║
  ║   🔐 Login:         http://localhost:${PORT}/login         ║
  ║   📊 Dashboard:     http://localhost:${PORT}/dashboard     ║
  ║   ⭐ Rate:          http://localhost:${PORT}/rate          ║
  ║                                                           ║
  ║   🔥 Firebase:     ${process.env.FIREBASE_CONFIG ? '✅ Connected' : '❌ Not Configured'}   ║
  ║   📧 SMTP:         ${process.env.SMTP_USER ? '✅ Configured' : '❌ Not Configured'}       ║
  ║                                                           ║
  ║   👤 Admin:        ${process.env.ADMIN_USERNAME || 'not set'}                               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;