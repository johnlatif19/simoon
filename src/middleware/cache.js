// ============================================
// Cache Middleware
// رحلة في مصر - Journey in Egypt
// ============================================

const { CACHE_SETTINGS } = require('../config/constants');

/**
 * Simple in-memory cache store
 * For production, consider using Redis
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = CACHE_SETTINGS.TTL || 3600; // 1 hour in seconds
    this.maxItems = CACHE_SETTINGS.MAX_ITEMS || 100;
    
    // Start cleanup interval (every 5 minutes)
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Generate cache key from request
   * @param {Object} req - Express request
   * @returns {string} Cache key
   */
  generateKey(req) {
    const { originalUrl, query, params, user } = req;
    const userPart = user?.id || 'anonymous';
    return `${originalUrl}:${JSON.stringify(query)}:${JSON.stringify(params)}:${userPart}`;
  }

  /**
   * Set cache item
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // Clean up if cache is too large
    if (this.cache.size >= this.maxItems) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000),
      createdAt: Date.now()
    });
  }

  /**
   * Get cache item
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache item
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear cache by pattern (e.g., all tours)
   * @param {string} pattern - Key pattern to match
   */
  clearByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict oldest cache items
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Cleanup expired items
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxItems,
      defaultTTL: this.defaultTTL,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create cache instance
const cache = new MemoryCache();

/**
 * Cache middleware - caches GET requests
 * @param {number} duration - Cache duration in seconds
 * @returns {Function} Express middleware
 */
function cacheMiddleware(duration = 3600) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Don't cache authenticated requests with user-specific data
    if (req.user && req.path.includes('/api/v1/bookings')) {
      return next();
    }

    const key = cache.generateKey(req);
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Send cached response
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-TTL', duration);
      return res.status(200).json(cachedResponse);
    }

    // Store original send function
    const originalSend = res.json;
    
    // Override send function to cache response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, data, duration);
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-TTL', duration);
      }
      
      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Cache middleware for tours (longer duration)
 */
const toursCacheMiddleware = cacheMiddleware(7200); // 2 hours

/**
 * Cache middleware for ratings (medium duration)
 */
const ratingsCacheMiddleware = cacheMiddleware(1800); // 30 minutes

/**
 * Cache middleware for homepage (shorter duration)
 */
const homepageCacheMiddleware = cacheMiddleware(300); // 5 minutes

/**
 * Clear cache for specific resource
 * @param {string} resource - Resource type (tours, bookings, etc.)
 */
function clearResourceCache(resource) {
  cache.clearByPattern(resource);
}

/**
 * Invalidate cache after write operations
 * @param {string} resource - Resource type
 * @returns {Function} Express middleware
 */
function invalidateCache(resource) {
  return (req, res, next) => {
    // Store original send
    const originalSend = res.json;
    
    res.json = function(data) {
      // Clear cache on successful write
      if (res.statusCode === 200 || res.statusCode === 201) {
        clearResourceCache(resource);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Conditional cache - cache only if condition met
 * @param {Function} condition - Condition function
 * @param {number} duration - Cache duration
 * @returns {Function} Express middleware
 */
function conditionalCache(condition, duration = 3600) {
  return (req, res, next) => {
    if (condition(req)) {
      return cacheMiddleware(duration)(req, res, next);
    }
    next();
  };
}

/**
 * No-cache middleware for sensitive endpoints
 */
function noCache(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

/**
 * Browser cache control for static assets
 */
function staticCache(req, res, next) {
  // Cache static assets for 1 year
  if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
}

// Export cache utilities
module.exports = {
  cache,
  cacheMiddleware,
  toursCacheMiddleware,
  ratingsCacheMiddleware,
  homepageCacheMiddleware,
  clearResourceCache,
  invalidateCache,
  conditionalCache,
  noCache,
  staticCache,
  MemoryCache
};