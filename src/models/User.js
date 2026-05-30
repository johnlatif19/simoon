// ============================================
// User Model
// رحلة في مصر - Journey in Egypt
// ============================================

const { db, COLLECTIONS, createDocument, getDocument, updateDocument, deleteDocument, getDocuments } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * User roles constants
 */
const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  USER: 'user'
};

/**
 * User status constants
 */
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

/**
 * User model class
 */
class User {
  constructor(data) {
    this.id = data.id || null;
    this.username = data.username || null;
    this.email = data.email || null;
    this.passwordHash = data.passwordHash || null;
    this.role = data.role || USER_ROLES.USER;
    this.status = data.status || USER_STATUS.ACTIVE;
    this.fullName = data.fullName || null;
    this.phone = data.phone || null;
    this.avatar = data.avatar || null;
    this.lastLoginAt = data.lastLoginAt || null;
    this.lastLoginIp = data.lastLoginIp || null;
    this.passwordResetToken = data.passwordResetToken || null;
    this.passwordResetExpires = data.passwordResetExpires || null;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Hash password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if valid
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user
   */
  static async create(userData) {
    // Validate required fields
    if (!userData.username) {
      throw new Error('Username is required');
    }
    
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    if (!userData.password) {
      throw new Error('Password is required');
    }
    
    // Check if username already exists
    const existingByUsername = await this.findByUsername(userData.username);
    if (existingByUsername) {
      throw new Error('Username already exists');
    }
    
    // Check if email already exists
    const existingByEmail = await this.findByEmail(userData.email);
    if (existingByEmail) {
      throw new Error('Email already exists');
    }
    
    // Hash password
    const passwordHash = await this.hashPassword(userData.password);
    
    // Create user object
    const user = {
      username: userData.username.toLowerCase(),
      email: userData.email.toLowerCase(),
      passwordHash: passwordHash,
      role: userData.role || USER_ROLES.USER,
      status: userData.status || USER_STATUS.ACTIVE,
      fullName: userData.fullName || null,
      phone: userData.phone || null,
      avatar: userData.avatar || null,
      lastLoginAt: null,
      lastLoginIp: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdBy: userData.createdBy || null
    };
    
    const result = await createDocument(COLLECTIONS.USERS, user);
    return new User(result);
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User or null
   */
  static async findById(id) {
    const data = await getDocument(COLLECTIONS.USERS, id);
    if (!data) return null;
    return new User(data);
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>} User or null
   */
  static async findByUsername(username) {
    const conditions = [{
      field: 'username',
      operator: '==',
      value: username.toLowerCase()
    }];
    
    const users = await getDocuments(COLLECTIONS.USERS, conditions);
    if (users.length === 0) return null;
    return new User(users[0]);
  }

  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<User|null>} User or null
   */
  static async findByEmail(email) {
    const conditions = [{
      field: 'email',
      operator: '==',
      value: email.toLowerCase()
    }];
    
    const users = await getDocuments(COLLECTIONS.USERS, conditions);
    if (users.length === 0) return null;
    return new User(users[0]);
  }

  /**
   * Find user by password reset token
   * @param {string} token - Reset token
   * @returns {Promise<User|null>} User or null
   */
  static async findByResetToken(token) {
    const conditions = [
      {
        field: 'passwordResetToken',
        operator: '==',
        value: token
      },
      {
        field: 'passwordResetExpires',
        operator: '>',
        value: new Date().toISOString()
      }
    ];
    
    const users = await getDocuments(COLLECTIONS.USERS, conditions);
    if (users.length === 0) return null;
    return new User(users[0]);
  }

  /**
   * Find all users with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array<User>>} Array of users
   */
  static async findAll(filters = {}) {
    const conditions = [];
    
    if (filters.role) {
      conditions.push({
        field: 'role',
        operator: '==',
        value: filters.role
      });
    }
    
    if (filters.status) {
      conditions.push({
        field: 'status',
        operator: '==',
        value: filters.status
      });
    }
    
    const options = {
      orderBy: filters.orderBy || 'createdAt',
      orderDirection: filters.orderDirection || 'desc',
      limit: filters.limit || null
    };
    
    const users = await getDocuments(COLLECTIONS.USERS, conditions, options);
    return users.map(u => new User(u));
  }

  /**
   * Get all admins
   * @returns {Promise<Array<User>>} Admin users
   */
  static async getAdmins() {
    const conditions = [{
      field: 'role',
      operator: '==',
      value: USER_ROLES.ADMIN
    }];
    
    const users = await getDocuments(COLLECTIONS.USERS, conditions);
    return users.map(u => new User(u));
  }

  /**
   * Authenticate user
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise<User|null>} User if authenticated, null otherwise
   */
  static async authenticate(username, password) {
    // Try to find by username first
    let user = await this.findByUsername(username);
    
    // If not found, try by email
    if (!user) {
      user = await this.findByEmail(username);
    }
    
    if (!user) return null;
    
    // Check if user is active
    if (user.status !== USER_STATUS.ACTIVE) return null;
    
    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) return null;
    
    return user;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<User>} Updated user
   */
  static async update(id, updates) {
    const allowedUpdates = [
      'fullName', 'phone', 'avatar', 'status', 'role'
    ];
    
    const updateData = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }
    
    // Handle password update separately
    if (updates.password) {
      updateData.passwordHash = await this.hashPassword(updates.password);
    }
    
    const result = await updateDocument(COLLECTIONS.USERS, id, updateData);
    return new User(result);
  }

  /**
   * Update last login info
   * @param {string} id - User ID
   * @param {string} ip - IP address
   * @returns {Promise<User>} Updated user
   */
  static async updateLastLogin(id, ip) {
    const updateData = {
      lastLoginAt: new Date().toISOString(),
      lastLoginIp: ip
    };
    
    const result = await updateDocument(COLLECTIONS.USERS, id, updateData);
    return new User(result);
  }

  /**
   * Change password
   * @param {string} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async changePassword(id, currentPassword, newPassword) {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');
    
    // Verify current password
    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Current password is incorrect');
    
    // Update password
    const newHash = await this.hashPassword(newPassword);
    await updateDocument(COLLECTIONS.USERS, id, { passwordHash: newHash });
    
    return true;
  }

  /**
   * Set password reset token
   * @param {string} id - User ID
   * @param {string} token - Reset token
   * @param {number} expiresInHours - Token expiration in hours
   * @returns {Promise<User>} Updated user
   */
  static async setResetToken(id, token, expiresInHours = 24) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    
    const updateData = {
      passwordResetToken: token,
      passwordResetExpires: expiresAt.toISOString()
    };
    
    const result = await updateDocument(COLLECTIONS.USERS, id, updateData);
    return new User(result);
  }

  /**
   * Reset password using token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<User>} Updated user
   */
  static async resetPassword(token, newPassword) {
    const user = await this.findByResetToken(token);
    if (!user) throw new Error('Invalid or expired reset token');
    
    // Update password
    const newHash = await this.hashPassword(newPassword);
    await updateDocument(COLLECTIONS.USERS, user.id, {
      passwordHash: newHash,
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    return user;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    return deleteDocument(COLLECTIONS.USERS, id);
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getStats() {
    const allUsers = await this.findAll();
    
    const stats = {
      total: allUsers.length,
      byRole: {
        admin: 0,
        editor: 0,
        viewer: 0,
        user: 0
      },
      byStatus: {
        active: 0,
        inactive: 0,
        suspended: 0
      },
      activeUsers: 0,
      recentUsers: []
    };
    
    for (const user of allUsers) {
      // Count by role
      if (stats.byRole[user.role] !== undefined) {
        stats.byRole[user.role]++;
      }
      
      // Count by status
      if (stats.byStatus[user.status] !== undefined) {
        stats.byStatus[user.status]++;
      }
      
      if (user.status === USER_STATUS.ACTIVE) {
        stats.activeUsers++;
      }
    }
    
    // Get 5 most recent users
    stats.recentUsers = allUsers.slice(0, 5);
    
    return stats;
  }

  /**
   * Check if user has admin role
   * @returns {boolean} True if admin
   */
  isAdmin() {
    return this.role === USER_ROLES.ADMIN;
  }

  /**
   * Check if user has editor role
   * @returns {boolean} True if editor
   */
  isEditor() {
    return this.role === USER_ROLES.EDITOR || this.isAdmin();
  }

  /**
   * Check if user is active
   * @returns {boolean} True if active
   */
  isActive() {
    return this.status === USER_STATUS.ACTIVE;
  }

  /**
   * Convert to JSON (exclude sensitive data)
   * @returns {Object} Plain object without password hash
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      status: this.status,
      fullName: this.fullName,
      phone: this.phone,
      avatar: this.avatar,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Export model and constants
module.exports = {
  User,
  USER_ROLES,
  USER_STATUS
};