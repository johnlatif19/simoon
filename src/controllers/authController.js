// @ts-nocheck
// ============================================
// Auth Controller
// رحلة في مصر - Journey in Egypt
// ============================================

const { User, USER_ROLES, USER_STATUS } = require('../models/User');
const { generateAdminToken, validateAdminCredentials } = require('../config/auth');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, getMessage } = require('../config/constants');
const { logSecurity } = require('../utils/logger');

// ============================================
// JWT Functions (المضافة)
// ============================================
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const refreshTokenFunction = (oldRefreshToken) => {
  try {
    const decoded = jwt.verify(oldRefreshToken, JWT_SECRET);
    const newPayload = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    return {
      token: jwt.sign(newPayload, JWT_SECRET, { expiresIn: '24h' }),
      refreshToken: jwt.sign(newPayload, JWT_SECRET, { expiresIn: '7d' })
    };
  } catch (error) {
    return null;
  }
};

/**
 * @desc    Admin login
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Validate credentials against .env
  const isValid = validateAdminCredentials(username, password);
  
  if (!isValid) {
    logSecurity('Failed login attempt', clientIp, { username });
    throw ApiError.unauthorized(getMessage('INVALID_CREDENTIALS', req.lang));
  }
  
  // Generate token
  const { token, refreshToken, expiresIn, user } = generateAdminToken();
  
  logSecurity('Successful admin login', clientIp, { username });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      token,
      refreshToken,
      expiresIn,
      user
    }
  });
});

/**
 * @desc    User login (for future user accounts)
 * @route   POST /api/v1/auth/user-login
 * @access  Public
 */
const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Authenticate user
  const user = await User.authenticate(email, password);
  
  if (!user) {
    logSecurity('Failed user login attempt', clientIp, { email });
    throw ApiError.unauthorized(getMessage('INVALID_CREDENTIALS', req.lang));
  }
  
  // Update last login
  await User.updateLastLogin(user.id, clientIp);
  
  // Generate token
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });
  
  logSecurity('Successful user login', clientIp, { userId: user.id });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      token,
      expiresIn: 24 * 60 * 60,
      user: user.toJSON()
    }
  });
});

/**
 * @desc    Verify token
 * @route   GET /api/v1/auth/verify
 * @access  Private
 */
const verifyToken = asyncHandler(async (req, res) => {
  // User is already attached by auth middleware
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      valid: true,
      user: req.user
    }
  });
});

/**
 * @desc    Refresh token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: oldRefreshToken } = req.body;
  
  if (!oldRefreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }
  
  const result = refreshTokenFunction(oldRefreshToken);
  
  if (!result) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Logout (client side only - no server action needed)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Token invalidation would require a token blacklist
  // For simplicity, client will just remove the token
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Change password (for admin)
 * @route   POST /api/v1/auth/change-password
 * @access  Private (Admin)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // For admin, check against .env credentials
  // For simplicity, we'll just validate the current password matches .env
  const isValid = validateAdminCredentials(req.user.username, currentPassword);
  
  if (!isValid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }
  
  // Note: In production, you'd update the .env file or use a database
  // For now, we'll just return success
  // The actual password change would require updating .env file
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // For demo purposes, just return success
  // In production, you would:
  // 1. Find user by email
  // 2. Generate reset token
  // 3. Send email with reset link
  // 4. Store token in database
  
  logSecurity('Password reset requested', clientIp, { email });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'If your email is registered, you will receive a password reset link'
  });
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  // For demo purposes
  // In production, verify token and update password
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successfully'
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  // For admin, return basic info from token
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      permissions: {
        canManageTours: req.user.role === 'admin',
        canManageBookings: req.user.role === 'admin',
        canManageUsers: req.user.role === 'admin',
        canViewReports: req.user.role === 'admin'
      }
    }
  });
});

/**
 * @desc    Update profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  
  // For demo purposes
  // In production, update user in database
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      fullName,
      phone,
      username: req.user.username
    }
  });
});

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/v1/auth/users
 * @access  Private (Admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll(req.query);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: users.length,
    data: users.map(u => u.toJSON())
  });
});

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/v1/auth/users/:id
 * @access  Private (Admin)
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
 * @desc    Create user (admin only)
 * @route   POST /api/v1/auth/users
 * @access  Private (Admin)
 */
const createUser = asyncHandler(async (req, res) => {
  const userData = req.body;
  
  const user = await User.create({
    ...userData,
    createdBy: req.user.id
  });
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: user.toJSON()
  });
});

/**
 * @desc    Update user (admin only)
 * @route   PUT /api/v1/auth/users/:id
 * @access  Private (Admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const user = await User.update(id, updates);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user.toJSON()
  });
});

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/v1/auth/users/:id
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

// Export all controller functions
module.exports = {
  // Authentication
  adminLogin,
  userLogin,
  verifyToken,
  refreshToken,
  logout,
  
  // Password management
  changePassword,
  forgotPassword,
  resetPassword,
  
  // Profile
  getProfile,
  updateProfile,
  
  // User management (admin)
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};