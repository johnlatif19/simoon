// ============================================
// Email Controller
// رحلة في مصر - Journey in Egypt
// ============================================

const { sendAdminEmail } = require('../services/emailService');
const { Booking } = require('../models/Booking');
const { Tour } = require('../models/Tour');
const { Contact } = require('../models/Contact');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, getMessage } = require('../config/constants');
const { logEmail } = require('../utils/logger');

/**
 * @desc    Send email to customer (admin only)
 * @route   POST /api/v1/admin/email/send
 * @access  Private (Admin only)
 */
const sendAdminEmailToCustomer = asyncHandler(async (req, res) => {
  const { to, subject, message, html } = req.body;
  
  // Log the attempt
  logEmail(to, subject, false);
  
  const success = await sendAdminEmail(to, subject, message);
  
  if (success) {
    logEmail(to, subject, true);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Email sent successfully'
    });
  } else {
    throw ApiError.internal('Failed to send email. Please check SMTP configuration.');
  }
});

/**
 * @desc    Send booking confirmation email (manual trigger)
 * @route   POST /api/v1/admin/email/booking-confirmation/:bookingId
 * @access  Private (Admin only)
 */
const sendBookingConfirmationEmail = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  const tour = await Tour.findById(booking.tourId);
  if (!tour) {
    throw ApiError.notFound('Tour not found');
  }
  
  const { sendBookingConfirmation } = require('../services/emailService');
  const success = await sendBookingConfirmation(booking, tour);
  
  if (success) {
    logEmail(booking.customer.email, `Booking Confirmation - ${booking.id}`, true);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Booking confirmation email sent successfully'
    });
  } else {
    throw ApiError.internal('Failed to send booking confirmation email');
  }
});

/**
 * @desc    Send payment confirmation email (manual trigger)
 * @route   POST /api/v1/admin/email/payment-confirmation/:bookingId
 * @access  Private (Admin only)
 */
const sendPaymentConfirmationEmail = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  const tour = await Tour.findById(booking.tourId);
  if (!tour) {
    throw ApiError.notFound('Tour not found');
  }
  
  const { sendPaymentConfirmation } = require('../services/emailService');
  const success = await sendPaymentConfirmation(booking, tour);
  
  if (success) {
    logEmail(booking.customer.email, `Payment Confirmation - ${booking.id}`, true);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment confirmation email sent successfully'
    });
  } else {
    throw ApiError.internal('Failed to send payment confirmation email');
  }
});

/**
 * @desc    Send bulk emails to customers (admin only)
 * @route   POST /api/v1/admin/email/bulk
 * @access  Private (Admin only)
 */
const sendBulkEmails = asyncHandler(async (req, res) => {
  const { subject, message, filters } = req.body;
  
  if (!subject || !message) {
    throw ApiError.badRequest('Subject and message are required');
  }
  
  // Get customers based on filters
  let customers = [];
  
  if (filters?.bookingStatus) {
    const bookings = await Booking.findAll({ status: filters.bookingStatus });
    customers = bookings.map(b => ({
      email: b.customer.email,
      name: b.customer.name,
      bookingId: b.id
    }));
  } else if (filters?.tourId) {
    const bookings = await Booking.findByTourId(filters.tourId);
    customers = bookings.map(b => ({
      email: b.customer.email,
      name: b.customer.name,
      bookingId: b.id
    }));
  } else {
    // Get all unique customers from bookings
    const allBookings = await Booking.findAll();
    const uniqueCustomers = new Map();
    for (const booking of allBookings) {
      if (!uniqueCustomers.has(booking.customer.email)) {
        uniqueCustomers.set(booking.customer.email, {
          email: booking.customer.email,
          name: booking.customer.name
        });
      }
    }
    customers = Array.from(uniqueCustomers.values());
  }
  
  if (customers.length === 0) {
    throw ApiError.badRequest('No customers found matching the filters');
  }
  
  // Send emails (limit to 50 per batch to avoid overwhelming)
  const batchSize = 50;
  const emailsToSend = customers.slice(0, batchSize);
  let successCount = 0;
  let failCount = 0;
  
  for (const customer of emailsToSend) {
    const personalizedMessage = message.replace('{name}', customer.name);
    const success = await sendAdminEmail(customer.email, subject, personalizedMessage);
    
    if (success) {
      successCount++;
      logEmail(customer.email, subject, true);
    } else {
      failCount++;
      logEmail(customer.email, subject, false);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Bulk email completed. Sent: ${successCount}, Failed: ${failCount}`,
    data: {
      totalCustomers: customers.length,
      sent: successCount,
      failed: failCount,
      batchLimit: batchSize,
      note: customers.length > batchSize ? `Only first ${batchSize} customers were processed.` : null
    }
  });
});

/**
 * @desc    Test email configuration
 * @route   POST /api/v1/admin/email/test
 * @access  Private (Admin only)
 */
const testEmailConfig = asyncHandler(async (req, res) => {
  const testEmail = req.body.email || process.env.SMTP_USER;
  
  if (!testEmail) {
    throw ApiError.badRequest('Test email address is required');
  }
  
  const { initTransporter, sendEmail } = require('../services/emailService');
  
  // Try to initialize transporter
  const transporter = initTransporter();
  if (!transporter) {
    throw ApiError.internal('SMTP not configured. Please check your .env file');
  }
  
  // Send test email
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; direction: rtl;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #D4AF37, #B8860B); padding: 20px; text-align: center; color: #2c1810;">
          <h1>🏛️ رحلة في مصر</h1>
          <p>Journey in Egypt</p>
        </div>
        <div style="padding: 20px;">
          <h2>✅ اختبار البريد الإلكتروني</h2>
          <p>تم إرسال هذا البريد بنجاح من خادم رحلة في مصر.</p>
          <p>إذا كنت ترى هذه الرسالة، فإن إعدادات البريد الإلكتروني تعمل بشكل صحيح.</p>
          <hr>
          <p><strong>الوقت:</strong> ${new Date().toLocaleString('ar-EG')}</p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px;">
          <p>© 2026 رحلة في مصر - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const success = await sendEmail({
    to: testEmail,
    subject: '✅ اختبار البريد الإلكتروني - رحلة في مصر',
    html: testHtml
  });
  
  if (success) {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`
    });
  } else {
    throw ApiError.internal('Failed to send test email. Please check SMTP configuration.');
  }
});

/**
 * @desc    Get email templates
 * @route   GET /api/v1/admin/email/templates
 * @access  Private (Admin only)
 */
const getEmailTemplates = asyncHandler(async (req, res) => {
  const templates = {
    booking_confirmation: {
      name: 'تأكيد الحجز',
      description: 'يتم إرسالها تلقائياً بعد إنشاء حجز جديد',
      variables: ['{customer_name}', '{tour_name}', '{booking_date}', '{persons}', '{total_amount}', '{booking_id}']
    },
    payment_confirmation: {
      name: 'تأكيد الدفع',
      description: 'يتم إرسالها بعد تأكيد الدفع',
      variables: ['{customer_name}', '{tour_name}', '{booking_date}', '{persons}', '{total_amount}', '{transfer_number}', '{booking_id}']
    },
    contact_confirmation: {
      name: 'تأكيد رسالة التواصل',
      description: 'يتم إرسالها تلقائياً بعد إرسال نموذج التواصل',
      variables: ['{customer_name}', '{message}']
    },
    admin_notification: {
      name: 'إشعار للمدير',
      description: 'يتم إرسالها عند استلام رسالة جديدة',
      variables: ['{customer_name}', '{customer_email}', '{customer_phone}', '{message}']
    }
  };
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: templates
  });
});

/**
 * @desc    Resend booking confirmation for a specific booking
 * @route   POST /api/v1/admin/email/resend/:bookingId
 * @access  Private (Admin only)
 */
const resendBookingEmail = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  
  const tour = await Tour.findById(booking.tourId);
  if (!tour) {
    throw ApiError.notFound('Tour not found');
  }
  
  const { sendBookingConfirmation } = require('../services/emailService');
  const success = await sendBookingConfirmation(booking, tour);
  
  if (success) {
    logEmail(booking.customer.email, `Resent: Booking Confirmation - ${booking.id}`, true);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Booking confirmation email resent successfully'
    });
  } else {
    throw ApiError.internal('Failed to resend booking confirmation email');
  }
});

// Export all controller functions
module.exports = {
  sendAdminEmailToCustomer,
  sendBookingConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendBulkEmails,
  testEmailConfig,
  getEmailTemplates,
  resendBookingEmail
};