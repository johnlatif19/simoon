// ============================================
// Price Calculator Utility
// رحلة في مصر - Journey in Egypt
// ============================================

const { NATIONALITY_TYPES, PRICE_LIMITS } = require('../config/constants');

/**
 * Price calculation result structure
 * @typedef {Object} PriceCalculation
 * @property {number} pricePerPerson - Price per person
 * @property {number} totalAmount - Total amount for all persons
 * @property {string} currency - Currency code (EGP or USD)
 * @property {string} nationality - Nationality type
 * @property {number} persons - Number of persons
 * @property {number} discount - Discount amount (if any)
 * @property {number} finalAmount - Final amount after discount
 */

/**
 * Calculate price for a tour based on nationality and number of persons
 * @param {Object} tour - Tour object with prices
 * @param {string} nationality - Nationality type ('egyptian' or 'foreign')
 * @param {number} persons - Number of persons (min 1)
 * @param {Object} options - Additional options (discountCode, groupDiscount)
 * @returns {PriceCalculation} Price calculation result
 */
function calculatePrice(tour, nationality, persons, options = {}) {
  // Input validation
  if (!tour) {
    throw new Error('Tour data is required');
  }
  
  if (!nationality || ![NATIONALITY_TYPES.EGYPTIAN, NATIONALITY_TYPES.FOREIGN].includes(nationality)) {
    throw new Error('Invalid nationality. Must be "egyptian" or "foreign"');
  }
  
  if (!persons || persons < 1) {
    throw new Error('Number of persons must be at least 1');
  }
  
  // Get price per person based on nationality
  let pricePerPerson;
  let currency;
  
  if (nationality === NATIONALITY_TYPES.EGYPTIAN) {
    pricePerPerson = tour.priceEgyptian || 0;
    currency = 'EGP';
  } else {
    pricePerPerson = tour.priceForeign || 0;
    currency = 'USD';
  }
  
  // Validate price
  if (pricePerPerson <= 0) {
    throw new Error(`Price not available for ${nationality} nationality`);
  }
  
  // Apply group discount for larger groups
  let discount = 0;
  let discountPercentage = 0;
  
  if (options.applyGroupDiscount !== false) {
    const groupDiscount = calculateGroupDiscount(persons, currency);
    if (groupDiscount.percentage > 0) {
      discountPercentage = groupDiscount.percentage;
      discount = pricePerPerson * persons * (discountPercentage / 100);
    }
  }
  
  // Calculate total before any discount
  let totalAmount = pricePerPerson * persons;
  
  // Apply discount
  let finalAmount = totalAmount - discount;
  
  // Ensure minimum price (not below zero)
  finalAmount = Math.max(finalAmount, 0);
  
  // Round to 2 decimal places
  finalAmount = Math.round(finalAmount * 100) / 100;
  totalAmount = Math.round(totalAmount * 100) / 100;
  
  return {
    pricePerPerson,
    totalAmount,
    currency,
    nationality,
    persons,
    discount: Math.round(discount * 100) / 100,
    discountPercentage,
    finalAmount
  };
}

/**
 * Calculate group discount based on number of persons
 * @param {number} persons - Number of persons
 * @param {string} currency - Currency code
 * @returns {Object} Discount information
 */
function calculateGroupDiscount(persons, currency = 'EGP') {
  // Group discount tiers (percentage)
  const discountTiers = [
    { minPersons: 1, maxPersons: 4, percentage: 0 },
    { minPersons: 5, maxPersons: 9, percentage: 5 },
    { minPersons: 10, maxPersons: 14, percentage: 10 },
    { minPersons: 15, maxPersons: 19, percentage: 12 },
    { minPersons: 20, maxPersons: Infinity, percentage: 15 }
  ];
  
  const tier = discountTiers.find(t => persons >= t.minPersons && persons <= t.maxPersons);
  const percentage = tier ? tier.percentage : 0;
  
  return {
    percentage,
    description: percentage > 0 ? `${percentage}% خصم للمجموعات` : 'لا يوجد خصم للمجموعات الصغيرة'
  };
}

/**
 * Apply coupon/discount code
 * @param {number} amount - Original amount
 * @param {string} couponCode - Coupon code
 * @param {Object} validCoupons - Object of valid coupons
 * @returns {Object} Discount result
 */
function applyCoupon(amount, couponCode, validCoupons = {}) {
  // Default valid coupons (can be overridden)
  const defaultCoupons = {
    'WELCOME10': { type: 'percentage', value: 10, description: 'خصم 10% للترحيب' },
    'EGYPT20': { type: 'percentage', value: 20, description: 'خصم 20% على الرحلات' },
    'SUMMER25': { type: 'percentage', value: 25, description: 'خصم 25% عروض الصيف' },
    'FAMILY50': { type: 'fixed', value: 50, currency: 'EGP', description: 'خصم 50 جنيه للعائلة' }
  };
  
  const coupons = { ...defaultCoupons, ...validCoupons };
  const coupon = coupons[couponCode?.toUpperCase()];
  
  if (!coupon) {
    return {
      applied: false,
      discountAmount: 0,
      description: 'كود الخصم غير صالح'
    };
  }
  
  let discountAmount = 0;
  
  if (coupon.type === 'percentage') {
    discountAmount = amount * (coupon.value / 100);
  } else if (coupon.type === 'fixed') {
    discountAmount = coupon.value;
  }
  
  // Cap discount at 50% of total
  const maxDiscount = amount * 0.5;
  discountAmount = Math.min(discountAmount, maxDiscount);
  
  return {
    applied: true,
    discountAmount: Math.round(discountAmount * 100) / 100,
    description: coupon.description,
    couponName: couponCode.toUpperCase()
  };
}

/**
 * Calculate price with all options (nationality, group, coupon)
 * @param {Object} tour - Tour object
 * @param {string} nationality - Nationality type
 * @param {number} persons - Number of persons
 * @param {Object} options - Additional options
 * @returns {PriceCalculation} Complete price calculation
 */
function calculateFullPrice(tour, nationality, persons, options = {}) {
  // Base calculation
  const baseCalculation = calculatePrice(tour, nationality, persons, options);
  
  // Apply coupon if provided
  let couponResult = null;
  if (options.couponCode) {
    couponResult = applyCoupon(baseCalculation.totalAmount, options.couponCode, options.validCoupons);
    if (couponResult.applied) {
      baseCalculation.discount += couponResult.discountAmount;
      baseCalculation.discountPercentage = (baseCalculation.discount / baseCalculation.totalAmount) * 100;
      baseCalculation.finalAmount = baseCalculation.totalAmount - baseCalculation.discount;
      baseCalculation.couponApplied = couponResult.couponName;
    }
  }
  
  return baseCalculation;
}

/**
 * Get price range for a tour (for display)
 * @param {Object} tour - Tour object
 * @returns {Object} Price range object
 */
function getTourPriceRange(tour) {
  return {
    egyptian: {
      min: tour.priceEgyptian || 0,
      max: tour.priceEgyptian || 0,
      currency: 'EGP',
      display: `${(tour.priceEgyptian || 0).toLocaleString()} ج.م`
    },
    foreign: {
      min: tour.priceForeign || 0,
      max: tour.priceForeign || 0,
      currency: 'USD',
      display: `$${(tour.priceForeign || 0).toLocaleString()}`
    }
  };
}

/**
 * Format price for display
 * @param {number} amount - Price amount
 * @param {string} currency - Currency code
 * @param {string} lang - Language ('ar' or 'en')
 * @returns {string} Formatted price string
 */
function formatPriceDisplay(amount, currency, lang = 'ar') {
  if (currency === 'EGP') {
    if (lang === 'ar') {
      return `${amount.toLocaleString('ar-EG')} ج.م`;
    }
    return `${amount.toLocaleString('en-US')} EGP`;
  }
  
  // USD
  if (lang === 'ar') {
    return `${amount.toLocaleString('ar-EG')} $`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

/**
 * Validate price against limits
 * @param {number} price - Price to validate
 * @param {string} currency - Currency code
 * @returns {boolean} True if price is within limits
 */
function isValidPrice(price, currency = 'EGP') {
  if (typeof price !== 'number' || isNaN(price)) return false;
  
  if (currency === 'EGP') {
    return price >= PRICE_LIMITS.MIN_EGP && price <= PRICE_LIMITS.MAX_EGP;
  }
  
  return price >= PRICE_LIMITS.MIN_USD && price <= PRICE_LIMITS.MAX_USD;
}

/**
 * Convert price between currencies (approximate)
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {number} exchangeRate - Optional custom exchange rate
 * @returns {number} Converted amount
 */
function convertCurrency(amount, fromCurrency, toCurrency, exchangeRate = null) {
  // Default exchange rate (USD to EGP)
  const USD_TO_EGP = exchangeRate || 48;
  
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'USD' && toCurrency === 'EGP') {
    return amount * USD_TO_EGP;
  }
  
  if (fromCurrency === 'EGP' && toCurrency === 'USD') {
    return amount / USD_TO_EGP;
  }
  
  return amount;
}

/**
 * Calculate total revenue from bookings
 * @param {Array} bookings - Array of booking objects
 * @param {string} targetCurrency - Currency to convert to
 * @returns {Object} Revenue summary
 */
function calculateTotalRevenue(bookings, targetCurrency = 'EGP') {
  let total = 0;
  const byStatus = {
    pending: 0,
    confirmed: 0,
    cancelled: 0
  };
  
  for (const booking of bookings) {
    const amount = booking.pricing?.totalAmount || 0;
    const currency = booking.pricing?.currency || 'EGP';
    const status = booking.payment?.status || 'pending';
    
    let convertedAmount = amount;
    if (currency !== targetCurrency) {
      convertedAmount = convertCurrency(amount, currency, targetCurrency);
    }
    
    total += convertedAmount;
    
    if (status === 'confirmed') {
      byStatus.confirmed += convertedAmount;
    } else if (status === 'pending') {
      byStatus.pending += convertedAmount;
    } else if (status === 'cancelled') {
      byStatus.cancelled += convertedAmount;
    }
  }
  
  return {
    total: Math.round(total * 100) / 100,
    byStatus,
    currency: targetCurrency
  };
}

/**
 * Calculate average price per booking
 * @param {Array} bookings - Array of booking objects
 * @returns {Object} Average price info
 */
function calculateAveragePrice(bookings) {
  const confirmedBookings = bookings.filter(b => b.payment?.status === 'confirmed');
  
  if (confirmedBookings.length === 0) {
    return { average: 0, count: 0, currency: 'EGP' };
  }
  
  let totalEGP = 0;
  let totalUSD = 0;
  let egpCount = 0;
  let usdCount = 0;
  
  for (const booking of confirmedBookings) {
    const amount = booking.pricing?.totalAmount || 0;
    const currency = booking.pricing?.currency || 'EGP';
    
    if (currency === 'EGP') {
      totalEGP += amount;
      egpCount++;
    } else {
      totalUSD += amount;
      usdCount++;
    }
  }
  
  return {
    averageEGP: egpCount > 0 ? Math.round(totalEGP / egpCount) : 0,
    averageUSD: usdCount > 0 ? Math.round(totalUSD / usdCount) : 0,
    count: confirmedBookings.length
  };
}

// Export all price calculator utilities
module.exports = {
  // Main calculation functions
  calculatePrice,
  calculateFullPrice,
  calculateGroupDiscount,
  applyCoupon,
  
  // Display utilities
  getTourPriceRange,
  formatPriceDisplay,
  
  // Validation
  isValidPrice,
  
  // Currency conversion
  convertCurrency,
  
  // Analytics
  calculateTotalRevenue,
  calculateAveragePrice
};