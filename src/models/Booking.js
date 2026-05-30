// ============================================
// Booking Model
// رحلة في مصر - Journey in Egypt
// ============================================

const { db, COLLECTIONS, createDocument, getDocument, updateDocument, deleteDocument, getDocuments } = require('../config/database');
const { PAYMENT_STATUS, NATIONALITY_TYPES } = require('../config/constants');

/**
 * Booking status constants
 */
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

/**
 * Payment method constants
 */
const PAYMENT_METHODS = {
  ORANGE_CASH: 'orange-cash',
  VODAFONE_CASH: 'vodafone-cash',
  INSTAPAY: 'instapay',
  BANK_TRANSFER: 'bank-transfer'
};

/**
 * Booking model class
 */
class Booking {
  constructor(data) {
    this.id = data.id || null;
    this.tourId = data.tourId || null;
    this.tourName = data.tourName || null;
    
    // Customer information
    this.customer = {
      name: data.customer?.name || null,
      email: data.customer?.email || null,
      phone: data.customer?.phone || null,
      nationality: data.customer?.nationality || null
    };
    
    // Booking details
    this.details = {
      persons: data.details?.persons || 1,
      date: data.details?.date || null,
      message: data.details?.message || null
    };
    
    // Pricing information
    this.pricing = {
      pricePerPerson: data.pricing?.pricePerPerson || 0,
      totalAmount: data.pricing?.totalAmount || 0,
      currency: data.pricing?.currency || 'EGP',
      discount: data.pricing?.discount || 0,
      discountPercentage: data.pricing?.discountPercentage || 0,
      couponApplied: data.pricing?.couponApplied || null
    };
    
    // Payment information
    this.payment = {
      method: data.payment?.method || PAYMENT_METHODS.ORANGE_CASH,
      transferNumber: data.payment?.transferNumber || null,
      status: data.payment?.status || BOOKING_STATUS.PENDING,
      confirmedAt: data.payment?.confirmedAt || null,
      notes: data.payment?.notes || null
    };
    
    // Timestamps
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Booking>} Created booking
   */
  static async create(bookingData) {
    // Validate required fields
    if (!bookingData.tourId) {
      throw new Error('Tour ID is required');
    }
    
    if (!bookingData.customer?.name) {
      throw new Error('Customer name is required');
    }
    
    if (!bookingData.customer?.email) {
      throw new Error('Customer email is required');
    }
    
    if (!bookingData.customer?.phone) {
      throw new Error('Customer phone is required');
    }
    
    if (!bookingData.details?.date) {
      throw new Error('Booking date is required');
    }
    
    // Set default values
    const booking = {
      tourId: bookingData.tourId,
      tourName: bookingData.tourName || null,
      customer: {
        name: bookingData.customer.name,
        email: bookingData.customer.email.toLowerCase(),
        phone: bookingData.customer.phone,
        nationality: bookingData.customer.nationality || NATIONALITY_TYPES.FOREIGN
      },
      details: {
        persons: bookingData.details.persons || 1,
        date: bookingData.details.date,
        message: bookingData.details.message || null
      },
      pricing: {
        pricePerPerson: bookingData.pricing?.pricePerPerson || 0,
        totalAmount: bookingData.pricing?.totalAmount || 0,
        currency: bookingData.pricing?.currency || 'EGP',
        discount: bookingData.pricing?.discount || 0,
        discountPercentage: bookingData.pricing?.discountPercentage || 0,
        couponApplied: bookingData.pricing?.couponApplied || null
      },
      payment: {
        method: bookingData.payment?.method || PAYMENT_METHODS.ORANGE_CASH,
        transferNumber: bookingData.payment?.transferNumber || null,
        status: BOOKING_STATUS.PENDING,
        confirmedAt: null,
        notes: bookingData.payment?.notes || null
      }
    };
    
    const result = await createDocument(COLLECTIONS.BOOKINGS, booking);
    return new Booking(result);
  }

  /**
   * Find booking by ID
   * @param {string} id - Booking ID
   * @returns {Promise<Booking|null>} Booking or null
   */
  static async findById(id) {
    const data = await getDocument(COLLECTIONS.BOOKINGS, id);
    if (!data) return null;
    return new Booking(data);
  }

  /**
   * Find all bookings with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array<Booking>>} Array of bookings
   */
  static async findAll(filters = {}) {
    const conditions = [];
    
    if (filters.status) {
      conditions.push({
        field: 'payment.status',
        operator: '==',
        value: filters.status
      });
    }
    
    if (filters.email) {
      conditions.push({
        field: 'customer.email',
        operator: '==',
        value: filters.email.toLowerCase()
      });
    }
    
    if (filters.tourId) {
      conditions.push({
        field: 'tourId',
        operator: '==',
        value: filters.tourId
      });
    }
    
    if (filters.nationality) {
      conditions.push({
        field: 'customer.nationality',
        operator: '==',
        value: filters.nationality
      });
    }
    
    if (filters.startDate) {
      conditions.push({
        field: 'details.date',
        operator: '>=',
        value: filters.startDate
      });
    }
    
    if (filters.endDate) {
      conditions.push({
        field: 'details.date',
        operator: '<=',
        value: filters.endDate
      });
    }
    
    const options = {
      orderBy: filters.orderBy || 'createdAt',
      orderDirection: filters.orderDirection || 'desc',
      limit: filters.limit || null
    };
    
    const bookings = await getDocuments(COLLECTIONS.BOOKINGS, conditions, options);
    return bookings.map(b => new Booking(b));
  }

  /**
   * Find bookings by customer email
   * @param {string} email - Customer email
   * @returns {Promise<Array<Booking>>} Array of bookings
   */
  static async findByCustomerEmail(email) {
    const conditions = [{
      field: 'customer.email',
      operator: '==',
      value: email.toLowerCase()
    }];
    
    const bookings = await getDocuments(COLLECTIONS.BOOKINGS, conditions, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    
    return bookings.map(b => new Booking(b));
  }

  /**
   * Find bookings by tour ID
   * @param {string} tourId - Tour ID
   * @returns {Promise<Array<Booking>>} Array of bookings
   */
  static async findByTourId(tourId) {
    const conditions = [{
      field: 'tourId',
      operator: '==',
      value: tourId
    }];
    
    const bookings = await getDocuments(COLLECTIONS.BOOKINGS, conditions, {
      orderBy: 'details.date',
      orderDirection: 'asc'
    });
    
    return bookings.map(b => new Booking(b));
  }

  /**
   * Find bookings by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array<Booking>>} Array of bookings
   */
  static async findByDateRange(startDate, endDate) {
    const conditions = [
      {
        field: 'details.date',
        operator: '>=',
        value: startDate
      },
      {
        field: 'details.date',
        operator: '<=',
        value: endDate
      }
    ];
    
    const bookings = await getDocuments(COLLECTIONS.BOOKINGS, conditions, {
      orderBy: 'details.date',
      orderDirection: 'asc'
    });
    
    return bookings.map(b => new Booking(b));
  }

  /**
   * Update booking status
   * @param {string} id - Booking ID
   * @param {string} status - New status
   * @returns {Promise<Booking>} Updated booking
   */
  static async updateStatus(id, status) {
    if (!Object.values(BOOKING_STATUS).includes(status)) {
      throw new Error('Invalid booking status');
    }
    
    const updateData = {
      'payment.status': status
    };
    
    if (status === BOOKING_STATUS.CONFIRMED) {
      updateData['payment.confirmedAt'] = new Date().toISOString();
    }
    
    const result = await updateDocument(COLLECTIONS.BOOKINGS, id, updateData);
    return new Booking(result);
  }

  /**
   * Confirm payment for booking
   * @param {string} id - Booking ID
   * @param {string} transferNumber - Transfer reference number
   * @param {string} method - Payment method
   * @returns {Promise<Booking>} Updated booking
   */
  static async confirmPayment(id, transferNumber, method = PAYMENT_METHODS.ORANGE_CASH) {
    const updateData = {
      'payment.transferNumber': transferNumber,
      'payment.method': method,
      'payment.status': BOOKING_STATUS.CONFIRMED,
      'payment.confirmedAt': new Date().toISOString()
    };
    
    const result = await updateDocument(COLLECTIONS.BOOKINGS, id, updateData);
    return new Booking(result);
  }

  /**
   * Cancel booking
   * @param {string} id - Booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Booking>} Updated booking
   */
  static async cancelBooking(id, reason = null) {
    const updateData = {
      'payment.status': BOOKING_STATUS.CANCELLED,
      'payment.notes': reason || 'Cancelled by user'
    };
    
    const result = await updateDocument(COLLECTIONS.BOOKINGS, id, updateData);
    return new Booking(result);
  }

  /**
   * Delete booking
   * @param {string} id - Booking ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    return deleteDocument(COLLECTIONS.BOOKINGS, id);
  }

  /**
   * Get booking statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Statistics
   */
  static async getStats(filters = {}) {
    const bookings = await this.findAll(filters);
    
    const stats = {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      byNationality: {
        egyptian: 0,
        foreign: 0
      }
    };
    
    for (const booking of bookings) {
      // Count by status
      switch (booking.payment.status) {
        case BOOKING_STATUS.PENDING:
          stats.pending++;
          break;
        case BOOKING_STATUS.CONFIRMED:
          stats.confirmed++;
          if (booking.pricing.currency === 'EGP') {
            stats.totalRevenue += booking.pricing.totalAmount;
          }
          break;
        case BOOKING_STATUS.CANCELLED:
          stats.cancelled++;
          break;
        case BOOKING_STATUS.COMPLETED:
          stats.completed++;
          break;
      }
      
      // Count by nationality
      if (booking.customer.nationality === NATIONALITY_TYPES.EGYPTIAN) {
        stats.byNationality.egyptian++;
      } else {
        stats.byNationality.foreign++;
      }
    }
    
    // Calculate average booking value
    if (stats.confirmed > 0) {
      stats.averageBookingValue = stats.totalRevenue / stats.confirmed;
    }
    
    return stats;
  }

  /**
   * Get today's bookings
   * @returns {Promise<Array<Booking>>} Today's bookings
   */
  static async getTodayBookings() {
    const today = new Date().toISOString().split('T')[0];
    return this.findByDateRange(today, today);
  }

  /**
   * Get upcoming bookings
   * @param {number} days - Number of days ahead
   * @returns {Promise<Array<Booking>>} Upcoming bookings
   */
  static async getUpcomingBookings(days = 7) {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + days);
    const futureDate = future.toISOString().split('T')[0];
    
    return this.findByDateRange(today, futureDate);
  }

  /**
   * Update booking details
   * @param {string} id - Booking ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Booking>} Updated booking
   */
  static async update(id, updates) {
    const allowedUpdates = [
      'details.persons',
      'details.date',
      'details.message',
      'payment.transferNumber',
      'payment.notes'
    ];
    
    const updateData = {};
    for (const key of allowedUpdates) {
      const value = this.getNestedValue(updates, key);
      if (value !== undefined) {
        updateData[key] = value;
      }
    }
    
    const result = await updateDocument(COLLECTIONS.BOOKINGS, id, updateData);
    return new Booking(result);
  }

  /**
   * Helper to get nested object value
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {any} Value or undefined
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Convert to JSON
   * @returns {Object} Plain object
   */
  toJSON() {
    return {
      id: this.id,
      tourId: this.tourId,
      tourName: this.tourName,
      customer: { ...this.customer },
      details: { ...this.details },
      pricing: { ...this.pricing },
      payment: { ...this.payment },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Export model and constants
module.exports = {
  Booking,
  BOOKING_STATUS,
  PAYMENT_METHODS
};