// ============================================
// Payment Service
// رحلة في مصر - Journey in Egypt
// ============================================

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Payment service for handling payment operations
 * Currently supports Orange Cash (Egypt)
 * Ready for integration with Stripe, Paymob, etc.
 */
class PaymentService {
  constructor() {
    this.provider = process.env.PAYMENT_PROVIDER || 'orange-cash';
    this.mobileNumber = process.env.WHATSAPP_NUMBER || '01229971386';
    this.beneficiaryName = 'Simon Issac';
    this.apiKey = process.env.PAYMENT_API_KEY || null;
    this.secretKey = process.env.PAYMENT_SECRET_KEY || null;
  }

  /**
   * Generate a unique transaction ID
   * @returns {string} Transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN${timestamp}${random}`;
  }

  /**
   * Generate a reference number for transfer
   * @param {string} bookingId - Booking ID
   * @returns {string} Reference number
   */
  generateReferenceNumber(bookingId) {
    const timestamp = Date.now().toString().slice(-6);
    const shortId = bookingId.slice(-6);
    return `REF${timestamp}${shortId}`.toUpperCase();
  }

  /**
   * Get payment instructions for Orange Cash
   * @param {Object} booking - Booking object
   * @returns {Object} Payment instructions
   */
  getOrangeCashInstructions(booking) {
    const referenceNumber = this.generateReferenceNumber(booking.id);
    
    return {
      provider: 'orange-cash',
      mobileNumber: this.mobileNumber,
      beneficiaryName: this.beneficiaryName,
      referenceNumber: referenceNumber,
      amount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      steps: [
        'افتح تطبيق أورنج كاش على هاتفك',
        'اختر "تحويل الأموال" من القائمة الرئيسية',
        'أدخل رقم المحفظة: ' + this.mobileNumber,
        `أدخل المبلغ: ${booking.pricing.totalAmount} ${booking.pricing.currency === 'EGP' ? 'جنيه' : 'دولار'}`,
        `أدخل الرقم المرجعي: ${referenceNumber} في خانة الرسالة`,
        'قم بتأكيد عملية التحويل',
        'أدخل الرقم المرجعي في الموقع لتأكيد الحجز'
      ],
      referenceNumber: referenceNumber,
      expiresIn: 3600 // 1 hour in seconds
    };
  }

  /**
   * Verify Orange Cash payment (simulated)
   * In production, this would call Orange Cash API
   * @param {string} transferNumber - Transfer reference number
   * @param {number} amount - Expected amount
   * @returns {Promise<Object>} Verification result
   */
  async verifyOrangeCashPayment(transferNumber, amount) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, accept any transfer number that follows the pattern
    const isValidFormat = /^REF\d{10,}$/i.test(transferNumber);
    
    if (isValidFormat) {
      return {
        success: true,
        verified: true,
        transactionId: this.generateTransactionId(),
        message: 'Payment verified successfully',
        details: {
          transferNumber,
          amount,
          status: 'completed',
          verifiedAt: new Date().toISOString()
        }
      };
    }
    
    return {
      success: false,
      verified: false,
      message: 'Invalid transfer number format. Please check and try again.',
      details: {
        transferNumber,
        expectedFormat: 'REF followed by 10+ digits'
      }
    };
  }

  /**
   * Create payment intent (for Stripe/Paymob integration)
   * @param {Object} booking - Booking object
   * @returns {Promise<Object>} Payment intent
   */
  async createPaymentIntent(booking) {
    // Placeholder for Stripe/Paymob integration
    // In production, implement actual API call
    
    return {
      success: true,
      clientSecret: `pi_${uuidv4()}_secret_${uuidv4()}`,
      amount: booking.pricing.totalAmount,
      currency: booking.pricing.currency.toLowerCase(),
      paymentIntentId: `pi_${uuidv4()}`
    };
  }

  /**
   * Confirm payment intent (for Stripe/Paymob)
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmPaymentIntent(paymentIntentId) {
    // Placeholder for Stripe/Paymob integration
    
    return {
      success: true,
      status: 'succeeded',
      paymentIntentId,
      confirmedAt: new Date().toISOString()
    };
  }

  /**
   * Get payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(transactionId) {
    // Placeholder for payment provider API
    
    return {
      success: true,
      transactionId,
      status: 'pending',
      message: 'Payment is being processed'
    };
  }

  /**
   * Refund payment
   * @param {string} transactionId - Original transaction ID
   * @param {number} amount - Amount to refund
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(transactionId, amount, reason) {
    // Placeholder for refund logic
    
    const refundId = `ref_${uuidv4()}`;
    
    return {
      success: true,
      refundId,
      transactionId,
      amount,
      reason,
      status: 'completed',
      refundedAt: new Date().toISOString()
    };
  }

  /**
   * Generate payment link (for bank transfer or manual payment)
   * @param {Object} booking - Booking object
   * @returns {string} Payment link
   */
  generatePaymentLink(booking) {
    const baseUrl = process.env.SITE_URL || 'https://simoon-issac.vercel.app';
    return `${baseUrl}/pay.html?booking=${booking.id}`;
  }

  /**
   * Validate webhook signature (for payment providers)
   * @param {string} payload - Raw request body
   * @param {string} signature - Signature header
   * @param {string} secret - Webhook secret
   * @returns {boolean} Valid signature
   */
  validateWebhookSignature(payload, signature, secret) {
    if (!secret) return true; // Skip validation if no secret
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get available payment methods
   * @returns {Array} List of payment methods
   */
  getAvailablePaymentMethods() {
    return [
      {
        id: 'orange-cash',
        name: 'أورنج كاش',
        nameEn: 'Orange Cash',
        icon: 'fas fa-mobile-alt',
        enabled: true,
        description: 'الدفع عبر محفظة أورنج كاش',
        descriptionEn: 'Pay via Orange Cash wallet'
      },
      {
        id: 'vodafone-cash',
        name: 'فودافون كاش',
        nameEn: 'Vodafone Cash',
        icon: 'fas fa-wifi',
        enabled: false,
        description: 'قريباً',
        descriptionEn: 'Coming soon'
      },
      {
        id: 'instapay',
        name: 'إنستا باي',
        nameEn: 'InstaPay',
        icon: 'fas fa-bolt',
        enabled: false,
        description: 'قريباً',
        descriptionEn: 'Coming soon'
      },
      {
        id: 'bank-transfer',
        name: 'تحويل بنكي',
        nameEn: 'Bank Transfer',
        icon: 'fas fa-university',
        enabled: false,
        description: 'قريباً',
        descriptionEn: 'Coming soon'
      }
    ];
  }

  /**
   * Calculate payment expiration time
   * @param {number} minutes - Minutes until expiration
   * @returns {string} Expiration timestamp
   */
  getPaymentExpiration(minutes = 60) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
    return expiresAt.toISOString();
  }

  /**
   * Check if payment is expired
   * @param {string} expiresAt - Expiration timestamp
   * @returns {boolean}
   */
  isPaymentExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency = 'EGP') {
    if (currency === 'EGP') {
      return `${amount.toLocaleString()} ج.م`;
    }
    return `${amount.toLocaleString()} $`;
  }

  /**
   * Convert between currencies (approximate)
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {number} rate - Exchange rate (optional)
   * @returns {number} Converted amount
   */
  convertCurrency(amount, fromCurrency, toCurrency, rate = null) {
    const USD_TO_EGP = rate || 48;
    
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'USD' && toCurrency === 'EGP') {
      return amount * USD_TO_EGP;
    }
    
    if (fromCurrency === 'EGP' && toCurrency === 'USD') {
      return amount / USD_TO_EGP;
    }
    
    return amount;
  }
}

// Create singleton instance
const paymentService = new PaymentService();

// Export service and utilities
module.exports = {
  paymentService,
  PaymentService,
  
  // Convenience methods
  generateTransactionId: () => paymentService.generateTransactionId(),
  generateReferenceNumber: (bookingId) => paymentService.generateReferenceNumber(bookingId),
  getOrangeCashInstructions: (booking) => paymentService.getOrangeCashInstructions(booking),
  verifyOrangeCashPayment: (transferNumber, amount) => paymentService.verifyOrangeCashPayment(transferNumber, amount),
  getAvailablePaymentMethods: () => paymentService.getAvailablePaymentMethods(),
  formatAmount: (amount, currency) => paymentService.formatAmount(amount, currency)
};