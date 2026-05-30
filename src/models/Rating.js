// ============================================
// Rating Model
// رحلة في مصر - Journey in Egypt
// ============================================

const { db, COLLECTIONS, createDocument, getDocument, updateDocument, deleteDocument, getDocuments } = require('../config/database');

/**
 * Rating model class
 */
class Rating {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || null;
    this.email = data.email || null;
    this.country = data.country || null;
    this.rating = data.rating || null;
    this.message = data.message || null;
    this.tourId = data.tourId || null;
    this.tourName = data.tourName || null;
    this.isVerified = data.isVerified || false;
    this.bookingId = data.bookingId || null;
    this.isApproved = data.isApproved !== undefined ? data.isApproved : true;
    this.adminReply = data.adminReply || null;
    this.repliedAt = data.repliedAt || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Create a new rating
   * @param {Object} ratingData - Rating data
   * @returns {Promise<Rating>} Created rating
   */
  static async create(ratingData) {
    // Validate required fields
    if (!ratingData.name) {
      throw new Error('Name is required');
    }
    
    if (!ratingData.country) {
      throw new Error('Country is required');
    }
    
    if (!ratingData.rating || ratingData.rating < 1 || ratingData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    if (!ratingData.message || ratingData.message.trim().length < 10) {
      throw new Error('Message must be at least 10 characters');
    }
    
    // Create rating object
    const rating = {
      name: ratingData.name,
      email: ratingData.email || null,
      country: ratingData.country,
      rating: ratingData.rating,
      message: ratingData.message.trim(),
      tourId: ratingData.tourId || null,
      tourName: ratingData.tourName || null,
      isVerified: ratingData.isVerified || false,
      bookingId: ratingData.bookingId || null,
      isApproved: ratingData.isApproved !== undefined ? ratingData.isApproved : true,
      adminReply: null,
      repliedAt: null
    };
    
    const result = await createDocument(COLLECTIONS.RATINGS, rating);
    return new Rating(result);
  }

  /**
   * Find rating by ID
   * @param {string} id - Rating ID
   * @returns {Promise<Rating|null>} Rating or null
   */
  static async findById(id) {
    const data = await getDocument(COLLECTIONS.RATINGS, id);
    if (!data) return null;
    return new Rating(data);
  }

  /**
   * Find all ratings with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array<Rating>>} Array of ratings
   */
  static async findAll(filters = {}) {
    const conditions = [];
    
    if (filters.rating !== undefined) {
      conditions.push({
        field: 'rating',
        operator: '==',
        value: filters.rating
      });
    }
    
    if (filters.minRating) {
      conditions.push({
        field: 'rating',
        operator: '>=',
        value: filters.minRating
      });
    }
    
    if (filters.maxRating) {
      conditions.push({
        field: 'rating',
        operator: '<=',
        value: filters.maxRating
      });
    }
    
    if (filters.tourId) {
      conditions.push({
        field: 'tourId',
        operator: '==',
        value: filters.tourId
      });
    }
    
    if (filters.isApproved !== undefined) {
      conditions.push({
        field: 'isApproved',
        operator: '==',
        value: filters.isApproved
      });
    }
    
    if (filters.isVerified !== undefined) {
      conditions.push({
        field: 'isVerified',
        operator: '==',
        value: filters.isVerified
      });
    }
    
    if (filters.country) {
      conditions.push({
        field: 'country',
        operator: '==',
        value: filters.country
      });
    }
    
    if (filters.startDate) {
      conditions.push({
        field: 'createdAt',
        operator: '>=',
        value: filters.startDate
      });
    }
    
    if (filters.endDate) {
      conditions.push({
        field: 'createdAt',
        operator: '<=',
        value: filters.endDate
      });
    }
    
    const options = {
      orderBy: filters.orderBy || 'createdAt',
      orderDirection: filters.orderDirection || 'desc',
      limit: filters.limit || null
    };
    
    const ratings = await getDocuments(COLLECTIONS.RATINGS, conditions, options);
    return ratings.map(r => new Rating(r));
  }

  /**
   * Find ratings by tour ID
   * @param {string} tourId - Tour ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array<Rating>>} Array of ratings
   */
  static async findByTourId(tourId, options = {}) {
    const conditions = [{
      field: 'tourId',
      operator: '==',
      value: tourId
    }, {
      field: 'isApproved',
      operator: '==',
      value: true
    }];
    
    const queryOptions = {
      orderBy: options.orderBy || 'createdAt',
      orderDirection: options.orderDirection || 'desc',
      limit: options.limit || null
    };
    
    const ratings = await getDocuments(COLLECTIONS.RATINGS, conditions, queryOptions);
    return ratings.map(r => new Rating(r));
  }

  /**
   * Find ratings by email
   * @param {string} email - Email address
   * @returns {Promise<Array<Rating>>} Array of ratings
   */
  static async findByEmail(email) {
    const conditions = [{
      field: 'email',
      operator: '==',
      value: email.toLowerCase()
    }];
    
    const ratings = await getDocuments(COLLECTIONS.RATINGS, conditions, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    
    return ratings.map(r => new Rating(r));
  }

  /**
   * Get average rating for a tour
   * @param {string} tourId - Tour ID
   * @returns {Promise<Object>} Average rating and count
   */
  static async getAverageRating(tourId) {
    const conditions = [{
      field: 'tourId',
      operator: '==',
      value: tourId
    }, {
      field: 'isApproved',
      operator: '==',
      value: true
    }];
    
    const ratings = await getDocuments(COLLECTIONS.RATINGS, conditions);
    
    if (ratings.length === 0) {
      return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;
    
    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rating of ratings) {
      distribution[rating.rating]++;
    }
    
    return {
      average: Math.round(average * 10) / 10,
      total: ratings.length,
      distribution
    };
  }

  /**
   * Get recent ratings with limit
   * @param {number} limit - Maximum number of ratings
   * @returns {Promise<Array<Rating>>} Recent ratings
   */
  static async getRecentRatings(limit = 5) {
    const conditions = [{
      field: 'isApproved',
      operator: '==',
      value: true
    }];
    
    const ratings = await getDocuments(COLLECTIONS.RATINGS, conditions, {
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit: limit
    });
    
    return ratings.map(r => new Rating(r));
  }

  /**
   * Get top rated tours
   * @param {number} limit - Number of tours to return
   * @returns {Promise<Array<Object>>} Top rated tours
   */
  static async getTopRatedTours(limit = 10) {
    const allRatings = await this.findAll({ isApproved: true });
    
    // Group ratings by tourId
    const tourRatings = new Map();
    
    for (const rating of allRatings) {
      if (!rating.tourId) continue;
      
      if (!tourRatings.has(rating.tourId)) {
        tourRatings.set(rating.tourId, {
          tourId: rating.tourId,
          tourName: rating.tourName,
          ratings: [],
          total: 0,
          sum: 0
        });
      }
      
      const tour = tourRatings.get(rating.tourId);
      tour.ratings.push(rating.rating);
      tour.sum += rating.rating;
      tour.total++;
    }
    
    // Calculate averages and sort
    const toursWithAvg = Array.from(tourRatings.values()).map(tour => ({
      ...tour,
      average: tour.sum / tour.total,
      averageRounded: Math.round((tour.sum / tour.total) * 10) / 10
    }));
    
    toursWithAvg.sort((a, b) => b.average - a.average);
    
    return toursWithAvg.slice(0, limit);
  }

  /**
   * Approve a rating (admin)
   * @param {string} id - Rating ID
   * @returns {Promise<Rating>} Updated rating
   */
  static async approve(id) {
    const updateData = {
      isApproved: true
    };
    
    const result = await updateDocument(COLLECTIONS.RATINGS, id, updateData);
    return new Rating(result);
  }

  /**
   * Reject/hide a rating (admin)
   * @param {string} id - Rating ID
   * @returns {Promise<Rating>} Updated rating
   */
  static async reject(id) {
    const updateData = {
      isApproved: false
    };
    
    const result = await updateDocument(COLLECTIONS.RATINGS, id, updateData);
    return new Rating(result);
  }

  /**
   * Reply to a rating (admin)
   * @param {string} id - Rating ID
   * @param {string} reply - Admin reply message
   * @returns {Promise<Rating>} Updated rating
   */
  static async addAdminReply(id, reply) {
    if (!reply || reply.trim().length === 0) {
      throw new Error('Reply message is required');
    }
    
    const updateData = {
      adminReply: reply.trim(),
      repliedAt: new Date().toISOString()
    };
    
    const result = await updateDocument(COLLECTIONS.RATINGS, id, updateData);
    return new Rating(result);
  }

  /**
   * Delete rating
   * @param {string} id - Rating ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    return deleteDocument(COLLECTIONS.RATINGS, id);
  }

  /**
   * Bulk delete ratings
   * @param {Array<string>} ids - Array of rating IDs
   * @returns {Promise<number>} Number of deleted ratings
   */
  static async bulkDelete(ids) {
    let deletedCount = 0;
    
    for (const id of ids) {
      try {
        await this.delete(id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete rating ${id}:`, error);
      }
    }
    
    return deletedCount;
  }

  /**
   * Get rating statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getStats() {
    const allRatings = await this.findAll({ isApproved: true });
    
    const stats = {
      total: allRatings.length,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byCountry: {},
      recentRatings: []
    };
    
    let sum = 0;
    
    for (const rating of allRatings) {
      sum += rating.rating;
      stats.distribution[rating.rating]++;
      
      if (rating.country) {
        stats.byCountry[rating.country] = (stats.byCountry[rating.country] || 0) + 1;
      }
    }
    
    stats.average = allRatings.length > 0 ? Math.round((sum / allRatings.length) * 10) / 10 : 0;
    stats.recentRatings = allRatings.slice(0, 5);
    
    return stats;
  }

  /**
   * Verify a rating (link to a confirmed booking)
   * @param {string} id - Rating ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Rating>} Updated rating
   */
  static async verify(id, bookingId) {
    const updateData = {
      isVerified: true,
      bookingId: bookingId
    };
    
    const result = await updateDocument(COLLECTIONS.RATINGS, id, updateData);
    return new Rating(result);
  }

  /**
   * Search ratings by name or message
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array<Rating>>} Matching ratings
   */
  static async search(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    
    const term = searchTerm.toLowerCase();
    const allRatings = await this.findAll({ isApproved: true });
    
    const filtered = allRatings.filter(rating => {
      return (
        rating.name?.toLowerCase().includes(term) ||
        rating.country?.toLowerCase().includes(term) ||
        rating.message?.toLowerCase().includes(term)
      );
    });
    
    return filtered;
  }

  /**
   * Generate star rating HTML
   * @returns {string} HTML star rating
   */
  getStarRatingHtml() {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= this.rating) {
        stars += '<i class="fas fa-star"></i>';
      } else if (i - 0.5 <= this.rating) {
        stars += '<i class="fas fa-star-half-alt"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }

  /**
   * Get formatted message preview
   * @param {number} length - Maximum length
   * @returns {string} Message preview
   */
  getMessagePreview(length = 150) {
    if (!this.message) return '';
    if (this.message.length <= length) return this.message;
    return this.message.substring(0, length) + '...';
  }

  /**
   * Check if rating is high (4 or 5 stars)
   * @returns {boolean} True if high rating
   */
  isHighRating() {
    return this.rating >= 4;
  }

  /**
   * Check if rating is low (1 or 2 stars)
   * @returns {boolean} True if low rating
   */
  isLowRating() {
    return this.rating <= 2;
  }

  /**
   * Convert to JSON
   * @returns {Object} Plain object
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      country: this.country,
      rating: this.rating,
      message: this.message,
      tourId: this.tourId,
      tourName: this.tourName,
      isVerified: this.isVerified,
      bookingId: this.bookingId,
      isApproved: this.isApproved,
      adminReply: this.adminReply,
      repliedAt: this.repliedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Export model
module.exports = { Rating };