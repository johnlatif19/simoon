// ============================================
// Tour Model
// رحلة في مصر - Journey in Egypt
// ============================================

const { db, COLLECTIONS, createDocument, getDocument, updateDocument, deleteDocument, getDocuments } = require('../config/database');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const { TOUR_DEFAULTS } = require('../config/constants');

/**
 * Tour model class
 */
class Tour {
  constructor(data) {
    this.id = data.id || null;
    this.nameAr = data.nameAr || null;
    this.nameEn = data.nameEn || null;
    this.slug = data.slug || null;
    
    // Descriptions
    this.shortDescriptionAr = data.shortDescriptionAr || null;
    this.shortDescriptionEn = data.shortDescriptionEn || null;
    this.descriptionAr = data.descriptionAr || null;
    this.descriptionEn = data.descriptionEn || null;
    
    // Pricing
    this.priceEgyptian = data.priceEgyptian || TOUR_DEFAULTS.PRICE_EGYPTIAN || 0;
    this.priceForeign = data.priceForeign || TOUR_DEFAULTS.PRICE_FOREIGN || 0;
    
    // Tour details
    this.duration = data.duration || TOUR_DEFAULTS.DURATION;
    this.maxPersons = data.maxPersons || TOUR_DEFAULTS.MAX_PERSONS;
    this.startLocation = data.startLocation || TOUR_DEFAULTS.START_LOCATION;
    this.pickupTime = data.pickupTime || TOUR_DEFAULTS.PICKUP_TIME;
    
    // Itinerary
    this.itineraryAr = data.itineraryAr || [];
    this.itineraryEn = data.itineraryEn || [];
    
    // Inclusions & Exclusions
    this.includedAr = data.includedAr || [];
    this.includedEn = data.includedEn || [];
    this.excludedAr = data.excludedAr || [];
    this.excludedEn = data.excludedEn || [];
    
    // Images
    this.mainImage = data.mainImage || null;
    this.galleryImages = data.galleryImages || [];
    
    // Status
    this.isActive = data.isActive !== undefined ? data.isActive : TOUR_DEFAULTS.IS_ACTIVE;
    this.featured = data.featured || TOUR_DEFAULTS.FEATURED;
    
    // Statistics
    this.rating = data.rating || TOUR_DEFAULTS.RATING;
    this.totalRatings = data.totalRatings || TOUR_DEFAULTS.TOTAL_RATINGS;
    this.totalBookings = data.totalBookings || TOUR_DEFAULTS.TOTAL_BOOKINGS;
    
    // SEO
    this.metaTitleAr = data.metaTitleAr || null;
    this.metaTitleEn = data.metaTitleEn || null;
    this.metaDescriptionAr = data.metaDescriptionAr || null;
    this.metaDescriptionEn = data.metaDescriptionEn || null;
    
    // Timestamps
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Generate slug from tour name
   * @param {Object} tourData - Tour data
   * @returns {Promise<string>} Generated slug
   */
  static async generateSlug(tourData) {
    const baseText = tourData.nameEn || tourData.nameAr || 'tour';
    const baseSlug = slugify(baseText);
    
    const checkExists = async (slug) => {
      const conditions = [{ field: 'slug', operator: '==', value: slug }];
      const existing = await getDocuments(COLLECTIONS.TOURS, conditions);
      return existing.length > 0;
    };
    
    return generateUniqueSlug(baseText, checkExists);
  }

  /**
   * Create a new tour
   * @param {Object} tourData - Tour data
   * @returns {Promise<Tour>} Created tour
   */
  static async create(tourData) {
    // Validate required fields
    if (!tourData.nameAr) {
      throw new Error('Arabic name is required');
    }
    
    if (!tourData.nameEn) {
      throw new Error('English name is required');
    }
    
    if (!tourData.priceEgyptian || tourData.priceEgyptian <= 0) {
      throw new Error('Valid Egyptian price is required');
    }
    
    if (!tourData.priceForeign || tourData.priceForeign <= 0) {
      throw new Error('Valid foreign price is required');
    }
    
    // Generate slug if not provided
    let slug = tourData.slug;
    if (!slug) {
      slug = await this.generateSlug(tourData);
    }
    
    // Create tour object
    const tour = {
      nameAr: tourData.nameAr.trim(),
      nameEn: tourData.nameEn.trim(),
      slug: slug,
      shortDescriptionAr: tourData.shortDescriptionAr?.trim() || null,
      shortDescriptionEn: tourData.shortDescriptionEn?.trim() || null,
      descriptionAr: tourData.descriptionAr?.trim() || null,
      descriptionEn: tourData.descriptionEn?.trim() || null,
      priceEgyptian: tourData.priceEgyptian,
      priceForeign: tourData.priceForeign,
      duration: tourData.duration || TOUR_DEFAULTS.DURATION,
      maxPersons: tourData.maxPersons || TOUR_DEFAULTS.MAX_PERSONS,
      startLocation: tourData.startLocation || TOUR_DEFAULTS.START_LOCATION,
      pickupTime: tourData.pickupTime || TOUR_DEFAULTS.PICKUP_TIME,
      itineraryAr: tourData.itineraryAr || [],
      itineraryEn: tourData.itineraryEn || [],
      includedAr: tourData.includedAr || [],
      includedEn: tourData.includedEn || [],
      excludedAr: tourData.excludedAr || [],
      excludedEn: tourData.excludedEn || [],
      mainImage: tourData.mainImage || null,
      galleryImages: tourData.galleryImages || [],
      isActive: tourData.isActive !== undefined ? tourData.isActive : true,
      featured: tourData.featured || false,
      rating: 0,
      totalRatings: 0,
      totalBookings: 0,
      metaTitleAr: tourData.metaTitleAr || tourData.nameAr,
      metaTitleEn: tourData.metaTitleEn || tourData.nameEn,
      metaDescriptionAr: tourData.metaDescriptionAr || tourData.shortDescriptionAr,
      metaDescriptionEn: tourData.metaDescriptionEn || tourData.shortDescriptionEn
    };
    
    const result = await createDocument(COLLECTIONS.TOURS, tour);
    return new Tour(result);
  }

  /**
   * Find tour by ID
   * @param {string} id - Tour ID
   * @returns {Promise<Tour|null>} Tour or null
   */
  static async findById(id) {
    const data = await getDocument(COLLECTIONS.TOURS, id);
    if (!data) return null;
    return new Tour(data);
  }

  /**
   * Find tour by slug
   * @param {string} slug - Tour slug
   * @returns {Promise<Tour|null>} Tour or null
   */
  static async findBySlug(slug) {
    const conditions = [{ field: 'slug', operator: '==', value: slug }];
    const tours = await getDocuments(COLLECTIONS.TOURS, conditions);
    if (tours.length === 0) return null;
    return new Tour(tours[0]);
  }

  /**
   * Find all tours with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array<Tour>>} Array of tours
   */
  static async findAll(filters = {}) {
    const conditions = [];
    
    // Add active filter
    if (filters.isActive !== undefined) {
      conditions.push({
        field: 'isActive',
        operator: '==',
        value: filters.isActive
      });
    } else {
      // Default: show only active tours
      conditions.push({
        field: 'isActive',
        operator: '==',
        value: true
      });
    }
    
    if (filters.featured !== undefined) {
      conditions.push({
        field: 'featured',
        operator: '==',
        value: filters.featured
      });
    }
    
    if (filters.minPrice) {
      conditions.push({
        field: 'priceEgyptian',
        operator: '>=',
        value: filters.minPrice
      });
    }
    
    if (filters.maxPrice) {
      conditions.push({
        field: 'priceEgyptian',
        operator: '<=',
        value: filters.maxPrice
      });
    }
    
    if (filters.duration) {
      conditions.push({
        field: 'duration',
        operator: '==',
        value: filters.duration
      });
    }
    
    if (filters.search) {
      // Search in name and description (client-side filtering)
      // For production, consider using Algolia or ElasticSearch
    }
    
    const options = {
      orderBy: filters.orderBy || 'createdAt',
      orderDirection: filters.orderDirection || 'desc',
      limit: filters.limit || null
    };
    
    const tours = await getDocuments(COLLECTIONS.TOURS, conditions, options);
    let results = tours.map(t => new Tour(t));
    
    // Apply search filter (client-side for simplicity)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(tour => 
        tour.nameAr.toLowerCase().includes(searchTerm) ||
        tour.nameEn.toLowerCase().includes(searchTerm) ||
        tour.shortDescriptionAr?.toLowerCase().includes(searchTerm) ||
        tour.shortDescriptionEn?.toLowerCase().includes(searchTerm)
      );
    }
    
    return results;
  }

  /**
   * Get featured tours
   * @param {number} limit - Maximum number of tours
   * @returns {Promise<Array<Tour>>} Featured tours
   */
  static async getFeaturedTours(limit = 6) {
    const conditions = [
      { field: 'featured', operator: '==', value: true },
      { field: 'isActive', operator: '==', value: true }
    ];
    
    const tours = await getDocuments(COLLECTIONS.TOURS, conditions, {
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit: limit
    });
    
    return tours.map(t => new Tour(t));
  }

  /**
   * Get popular tours (by booking count)
   * @param {number} limit - Maximum number of tours
   * @returns {Promise<Array<Tour>>} Popular tours
   */
  static async getPopularTours(limit = 6) {
    const conditions = [{ field: 'isActive', operator: '==', value: true }];
    
    const tours = await getDocuments(COLLECTIONS.TOURS, conditions, {
      orderBy: 'totalBookings',
      orderDirection: 'desc',
      limit: limit
    });
    
    return tours.map(t => new Tour(t));
  }

  /**
   * Get top rated tours
   * @param {number} limit - Maximum number of tours
   * @returns {Promise<Array<Tour>>} Top rated tours
   */
  static async getTopRatedTours(limit = 6) {
    const conditions = [{ field: 'isActive', operator: '==', value: true }];
    
    const tours = await getDocuments(COLLECTIONS.TOURS, conditions, {
      orderBy: 'rating',
      orderDirection: 'desc',
      limit: limit
    });
    
    return tours.map(t => new Tour(t));
  }

  /**
   * Update tour
   * @param {string} id - Tour ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Tour>} Updated tour
   */
  static async update(id, updates) {
    const allowedUpdates = [
      'nameAr', 'nameEn', 'slug', 'shortDescriptionAr', 'shortDescriptionEn',
      'descriptionAr', 'descriptionEn', 'priceEgyptian', 'priceForeign',
      'duration', 'maxPersons', 'startLocation', 'pickupTime',
      'itineraryAr', 'itineraryEn', 'includedAr', 'includedEn',
      'excludedAr', 'excludedEn', 'mainImage', 'galleryImages',
      'isActive', 'featured', 'metaTitleAr', 'metaTitleEn',
      'metaDescriptionAr', 'metaDescriptionEn'
    ];
    
    const updateData = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }
    
    // Regenerate slug if name changed
    if (updates.nameEn || updates.nameAr) {
      const currentTour = await this.findById(id);
      if (currentTour && (updates.nameEn !== currentTour.nameEn || updates.nameAr !== currentTour.nameAr)) {
        updateData.slug = await this.generateSlug(updates);
      }
    }
    
    const result = await updateDocument(COLLECTIONS.TOURS, id, updateData);
    return new Tour(result);
  }

  /**
   * Update tour rating (when new rating added)
   * @param {string} id - Tour ID
   * @param {number} newRating - New rating value
   * @returns {Promise<Tour>} Updated tour
   */
  static async updateRating(id, newRating) {
    const tour = await this.findById(id);
    if (!tour) throw new Error('Tour not found');
    
    const newTotalRatings = tour.totalRatings + 1;
    const newAverage = ((tour.rating * tour.totalRatings) + newRating) / newTotalRatings;
    
    const updateData = {
      rating: Math.round(newAverage * 10) / 10,
      totalRatings: newTotalRatings
    };
    
    const result = await updateDocument(COLLECTIONS.TOURS, id, updateData);
    return new Tour(result);
  }

  /**
   * Increment booking count
   * @param {string} id - Tour ID
   * @returns {Promise<Tour>} Updated tour
   */
  static async incrementBookings(id) {
    const tour = await this.findById(id);
    if (!tour) throw new Error('Tour not found');
    
    const updateData = {
      totalBookings: tour.totalBookings + 1
    };
    
    const result = await updateDocument(COLLECTIONS.TOURS, id, updateData);
    return new Tour(result);
  }

  /**
   * Delete tour
   * @param {string} id - Tour ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    return deleteDocument(COLLECTIONS.TOURS, id);
  }

  /**
   * Bulk update tours status
   * @param {Array<string>} ids - Tour IDs
   * @param {boolean} isActive - New active status
   * @returns {Promise<number>} Number of updated tours
   */
  static async bulkUpdateStatus(ids, isActive) {
    let updatedCount = 0;
    
    for (const id of ids) {
      try {
        await this.update(id, { isActive });
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update tour ${id}:`, error);
      }
    }
    
    return updatedCount;
  }

  /**
   * Get tour statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getStats() {
    const allTours = await this.findAll({ isActive: undefined });
    const activeTours = allTours.filter(t => t.isActive);
    const featuredTours = allTours.filter(t => t.featured);
    
    const stats = {
      total: allTours.length,
      active: activeTours.length,
      inactive: allTours.length - activeTours.length,
      featured: featuredTours.length,
      totalBookings: allTours.reduce((sum, t) => sum + (t.totalBookings || 0), 0),
      averagePrice: {
        egyptian: activeTours.reduce((sum, t) => sum + t.priceEgyptian, 0) / (activeTours.length || 1),
        foreign: activeTours.reduce((sum, t) => sum + t.priceForeign, 0) / (activeTours.length || 1)
      }
    };
    
    return stats;
  }

  /**
   * Get tour by name (for search)
   * @param {string} name - Tour name (Arabic or English)
   * @returns {Promise<Array<Tour>>} Matching tours
   */
  static async findByName(name) {
    if (!name) return [];
    
    const searchTerm = name.toLowerCase();
    const allTours = await this.findAll({ isActive: true });
    
    return allTours.filter(tour => 
      tour.nameAr.toLowerCase().includes(searchTerm) ||
      tour.nameEn.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get tour information for display (based on language)
   * @param {string} lang - Language code ('ar' or 'en')
   * @returns {Object} Localized tour info
   */
  getLocalizedInfo(lang = 'ar') {
    if (lang === 'en') {
      return {
        name: this.nameEn,
        shortDescription: this.shortDescriptionEn,
        description: this.descriptionEn,
        itinerary: this.itineraryEn,
        included: this.includedEn,
        excluded: this.excludedEn,
        metaTitle: this.metaTitleEn,
        metaDescription: this.metaDescriptionEn
      };
    }
    
    return {
      name: this.nameAr,
      shortDescription: this.shortDescriptionAr,
      description: this.descriptionAr,
      itinerary: this.itineraryAr,
      included: this.includedAr,
      excluded: this.excludedAr,
      metaTitle: this.metaTitleAr,
      metaDescription: this.metaDescriptionAr
    };
  }

  /**
   * Get price for specific nationality
   * @param {string} nationality - 'egyptian' or 'foreign'
   * @returns {number} Price
   */
  getPriceByNationality(nationality) {
    return nationality === 'egyptian' ? this.priceEgyptian : this.priceForeign;
  }

  /**
   * Get currency for nationality
   * @param {string} nationality - 'egyptian' or 'foreign'
   * @returns {string} Currency code
   */
  getCurrencyByNationality(nationality) {
    return nationality === 'egyptian' ? 'EGP' : 'USD';
  }

  /**
   * Convert to JSON
   * @returns {Object} Plain object
   */
  toJSON() {
    return {
      id: this.id,
      nameAr: this.nameAr,
      nameEn: this.nameEn,
      slug: this.slug,
      shortDescriptionAr: this.shortDescriptionAr,
      shortDescriptionEn: this.shortDescriptionEn,
      descriptionAr: this.descriptionAr,
      descriptionEn: this.descriptionEn,
      priceEgyptian: this.priceEgyptian,
      priceForeign: this.priceForeign,
      duration: this.duration,
      maxPersons: this.maxPersons,
      startLocation: this.startLocation,
      pickupTime: this.pickupTime,
      itineraryAr: this.itineraryAr,
      itineraryEn: this.itineraryEn,
      includedAr: this.includedAr,
      includedEn: this.includedEn,
      excludedAr: this.excludedAr,
      excludedEn: this.excludedEn,
      mainImage: this.mainImage,
      galleryImages: this.galleryImages,
      isActive: this.isActive,
      featured: this.featured,
      rating: this.rating,
      totalRatings: this.totalRatings,
      totalBookings: this.totalBookings,
      metaTitleAr: this.metaTitleAr,
      metaTitleEn: this.metaTitleEn,
      metaDescriptionAr: this.metaDescriptionAr,
      metaDescriptionEn: this.metaDescriptionEn,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Export model
module.exports = { Tour };