// ============================================
// Booking Controller
// رحلة في مصر - Journey in Egypt
// ============================================

const { Booking, BOOKING_STATUS, PAYMENT_METHODS } = require('../models/Booking');
const { Tour } = require('../models/Tour');
const { sendBookingConfirmation, sendPaymentConfirmation } = require('../services/emailService');
const { calculatePrice } = require('../utils/priceCalculator');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, getMessage } = require('../config/constants');
const { logPayment, logEmail } = require('../utils/logger');

/**
 * @desc    Create a new booking
 * @route   POST /api/v1/bookings
 * @access  Public
 */
const createBooking = asyncHandler(async (req, res) => {
  const { tourId, customer, details } = req.body;
  
  // Get tour details
  const tour = await Tour.findById(tourId);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  // Check if tour is active
  if (!tour.isActive) {
    throw ApiError.badRequest('This tour is currently not available');
  }
  
  // Calculate price
  const priceCalculation = calculatePrice(
    tour,
    customer.nationality,
    details.persons
  );
  
  // Create booking
  const bookingData = {
    tourId: tour.id,
    tourName: req.lang === 'ar' ? tour.nameAr : tour.nameEn,
    customer,
    details,
    pricing: {
      pricePerPerson: priceCalculation.pricePerPerson,
      totalAmount: priceCalculation.totalAmount,
      currency: priceCalculation.currency,
      discount: priceCalculation.discount,
      discountPercentage: priceCalculation.discountPercentage
    },
    payment: {
      method: PAYMENT_METHODS.ORANGE_CASH,
      status: BOOKING_STATUS.PENDING
    }
  };
  
  const booking = await Booking.create(bookingData);
  
  // Send confirmation email
  try {
    await sendBookingConfirmation(booking, tour);
    logEmail(customer.email, 'Booking Confirmation', true);
  } catch (emailError) {
    console.error('Failed to send booking email:', emailError);
    logEmail(customer.email, 'Booking Confirmation', false, emailError);
  }
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: getMessage('BOOKING_CREATED', req.lang),
    data: {
      booking: booking.toJSON(),
      paymentInfo: {
        totalAmount: priceCalculation.totalAmount,
        currency: priceCalculation.currency,
        status: BOOKING_STATUS.PENDING,
        instructions: {
          mobileNumber: process.env.WHATSAPP_NUMBER || '01229971386',
          beneficiaryName: 'Simon Issac'
        }
      }
    }
  });
});

/**
 * @desc    Calculate price for a tour
 * @route   POST /api/v1/bookings/calculate
 * @access  Public
 */
const calculateBookingPrice = asyncHandler(async (req, res) => {
  const { tourId, nationality, persons, couponCode } = req.body;
  
  // Get tour details
  const tour = await Tour.findById(tourId);
  if (!tour) {
    throw ApiError.notFound(getMessage('TOUR_NOT_FOUND', req.lang));
  }
  
  // Calculate price
  const priceCalculation = calculatePrice(tour, nationality, persons);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      pricePerPerson: priceCalculation.pricePerPerson,
      totalAmount: priceCalculation.totalAmount,
      currency: priceCalculation.currency,
      persons: priceCalculation.persons,
      discount: priceCalculation.discount,
      discountPercentage: priceCalculation.discountPercentage,
      finalAmount: priceCalculation.finalAmount
    }
  });
});

/**
 * @desc    Get all bookings (admin only)
 * @route   GET /api/v1/bookings
 * @access  Private (Admin)
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, email, tourId, nationality, startDate, endDate, page, limit } = req.query;
  
  const filters = {
    status,
    email,
    tourId,
    nationality,
    startDate,
    endDate,
    limit: limit ? parseInt(limit) : 50,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  };
  
  const bookings = await Booking.findAll(filters);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: bookings.length,
    data: bookings.map(b => b.toJSON())
  });
});

/**
 * @desc    Get booking by ID
 * @route   GET /api/v1/bookings/:id
 * @access  Private (Admin or Owner)
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  // Check authorization (admin or booking owner)
  if (req.user.role !== 'admin' && booking.customer.email !== req.user.email) {
    throw ApiError.forbidden('You are not authorized to view this booking');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: booking.toJSON()
  });
});

/**
 * @desc    Get bookings by customer email
 * @route   GET /api/v1/bookings/customer/:email
 * @access  Private (Admin or Owner)
 */
const getBookingsByCustomer = asyncHandler(async (req, res) => {
  const { email } = req.params;
  
  // Check authorization
  if (req.user.role !== 'admin' && req.user.email !== email) {
    throw ApiError.forbidden('You are not authorized to view these bookings');
  }
  
  const bookings = await Booking.findByCustomerEmail(email);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: bookings.length,
    data: bookings.map(b => b.toJSON())
  });
});

/**
 * @desc    Get bookings by tour ID
 * @route   GET /api/v1/bookings/tour/:tourId
 * @access  Private (Admin)
 */
const getBookingsByTour = asyncHandler(async (req, res) => {
  const { tourId } = req.params;
  
  const bookings = await Booking.findByTourId(tourId);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: bookings.length,
    data: bookings.map(b => b.toJSON())
  });
});

/**
 * @desc    Update booking status (admin)
 * @route   PUT /api/v1/bookings/:id/status
 * @access  Private (Admin)
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, notes } = req.body;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  const updatedBooking = await Booking.updateStatus(id, paymentStatus);
  
  // If status changed to confirmed, send confirmation email
  if (paymentStatus === BOOKING_STATUS.CONFIRMED && booking.payment.status !== BOOKING_STATUS.CONFIRMED) {
    try {
      const tour = await Tour.findById(booking.tourId);
      await sendPaymentConfirmation(updatedBooking, tour);
      logEmail(booking.customer.email, 'Payment Confirmation', true);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Booking status updated to ${paymentStatus}`,
    data: updatedBooking.toJSON()
  });
});

/**
 * @desc    Confirm payment for a booking
 * @route   POST /api/v1/bookings/confirm-payment
 * @access  Public
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const { bookingId, transferNumber, paymentMethod } = req.body;
  
  // Find booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  // Check if already confirmed
  if (booking.payment.status === BOOKING_STATUS.CONFIRMED) {
    throw ApiError.badRequest('Payment already confirmed for this booking');
  }
  
  // Confirm payment
  const updatedBooking = await Booking.confirmPayment(
    bookingId,
    transferNumber,
    paymentMethod || PAYMENT_METHODS.ORANGE_CASH
  );
  
  // Update tour booking count
  try {
    await Tour.incrementBookings(booking.tourId);
  } catch (error) {
    console.error('Failed to increment tour bookings:', error);
  }
  
  // Send confirmation email
  try {
    const tour = await Tour.findById(booking.tourId);
    await sendPaymentConfirmation(updatedBooking, tour);
    logEmail(booking.customer.email, 'Payment Confirmed', true);
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }
  
  // Log payment
  logPayment(
    'confirm',
    bookingId,
    booking.pricing.totalAmount,
    booking.pricing.currency,
    true
  );
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Payment confirmed successfully',
    data: updatedBooking.toJSON()
  });
});

/**
 * @desc    Cancel booking
 * @route   PUT /api/v1/bookings/:id/cancel
 * @access  Private (Admin or Owner)
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  // Check authorization
  if (req.user.role !== 'admin' && booking.customer.email !== req.user.email) {
    throw ApiError.forbidden('You are not authorized to cancel this booking');
  }
  
  // Check if already cancelled or confirmed
  if (booking.payment.status === BOOKING_STATUS.CANCELLED) {
    throw ApiError.badRequest('Booking is already cancelled');
  }
  
  if (booking.payment.status === BOOKING_STATUS.CONFIRMED) {
    throw ApiError.badRequest('Cannot cancel a confirmed booking. Please contact support.');
  }
  
  const updatedBooking = await Booking.cancelBooking(id, reason);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: updatedBooking.toJSON()
  });
});

/**
 * @desc    Delete booking (admin only)
 * @route   DELETE /api/v1/bookings/:id
 * @access  Private (Admin)
 */
const deleteBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  await Booking.delete(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Booking deleted successfully'
  });
});

/**
 * @desc    Get booking statistics (admin)
 * @route   GET /api/v1/bookings/stats
 * @access  Private (Admin)
 */
const getBookingStats = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;
  
  const filters = {};
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  
  const stats = await Booking.getStats(filters);
  
  // Get today's bookings
  const todayBookings = await Booking.getTodayBookings();
  
  // Get upcoming bookings
  const upcomingBookings = await Booking.getUpcomingBookings(7);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...stats,
      todayBookings: todayBookings.length,
      upcomingBookings: upcomingBookings.length
    }
  });
});

/**
 * @desc    Update booking details (admin)
 * @route   PUT /api/v1/bookings/:id
 * @access  Private (Admin)
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const booking = await Booking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  const updatedBooking = await Booking.update(id, updates);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Booking updated successfully',
    data: updatedBooking.toJSON()
  });
});

/**
 * @desc    Get booking by transfer number
 * @route   GET /api/v1/bookings/transfer/:transferNumber
 * @access  Private (Admin)
 */
const getBookingByTransferNumber = asyncHandler(async (req, res) => {
  const { transferNumber } = req.params;
  
  const bookings = await Booking.findAll();
  const booking = bookings.find(b => b.payment.transferNumber === transferNumber);
  
  if (!booking) {
    throw ApiError.notFound('Booking not found with this transfer number');
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: booking.toJSON()
  });
});

// Export all controller functions
module.exports = {
  createBooking,
  calculateBookingPrice,
  getAllBookings,
  getBookingById,
  getBookingsByCustomer,
  getBookingsByTour,
  updateBookingStatus,
  confirmPayment,
  cancelBooking,
  deleteBooking,
  getBookingStats,
  updateBooking,
  getBookingByTransferNumber
};