// ============================================
// Auth Routes (v1) - WORKING VERSION
// ============================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ApiError, asyncHandler } = require('../../middleware/errorHandler');
const { HTTP_STATUS } = require('../../config/constants');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'john';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'latif';

// Middleware (تعريف بسيط)
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    throw ApiError.unauthorized('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw ApiError.unauthorized('Invalid token');
  }
});

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    throw ApiError.forbidden('Admin access required');
  }
  next();
};

// Helper
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// ============================================
// Routes
// ============================================

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken({ username, role: 'admin' });
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { token, expiresIn: 86400, user: { username, role: 'admin' } }
    });
  } else {
    throw ApiError.unauthorized('Invalid credentials');
  }
}));

// Verify token
router.get('/verify', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    throw ApiError.unauthorized('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(HTTP_STATUS_OK).json({ success: true, data: { valid: true, user: decoded } });
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}));

// DELETE user (admin only)
router.delete('/users/:id', authenticate, adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (id === req.user.id) {
    throw ApiError.badRequest('لا يمكنك حذف حسابك الخاص');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `User ${id} deleted successfully`
  });
}));

module.exports = router;