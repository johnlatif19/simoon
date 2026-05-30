// ============================================
// Email Service
// رحلة في مصر - Journey in Egypt
// ============================================

const nodemailer = require('nodemailer');

// Create transporter
let transporter = null;

/**
 * Initialize email transporter
 * @returns {Object} Nodemailer transporter
 */
function initTransporter() {
  if (transporter) return transporter;
  
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not configured. Email sending disabled.');
    return null;
  }
  
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  
  return transporter;
}

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<boolean>} Success status
 */
async function sendEmail(options) {
  const transport = initTransporter();
  
  if (!transport) {
    console.warn('Email not sent: Transporter not configured');
    return false;
  }
  
  try {
    const info = await transport.sendMail({
      from: `"رحلة في مصر" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || null
    });
    
    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
}

/**
 * Send booking confirmation email to customer
 * @param {Object} booking - Booking object
 * @param {Object} tour - Tour object
 * @returns {Promise<boolean>}
 */
async function sendBookingConfirmation(booking, tour) {
  const tourName = tour.nameAr;
  const date = new Date(booking.details.date).toLocaleDateString('ar-EG');
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تأكيد الحجز - رحلة في مصر</title>
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #D4AF37, #B8860B); color: #2c1810; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; font-weight: bold; color: #D4AF37; margin-bottom: 20px; }
        .details { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .price { background: linear-gradient(135deg, #D4AF37, #FF8C00); color: #2c1810; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0; }
        .price .amount { font-size: 24px; font-weight: bold; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; }
        .button { display: inline-block; background: linear-gradient(135deg, #D4AF37, #FF8C00); color: #2c1810; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏛️ رحلة في مصر</h1>
          <p>Journey in Egypt</p>
        </div>
        <div class="content">
          <div class="greeting">مرحباً ${booking.customer.name}،</div>
          <p>شكراً لحجز رحلتك معنا! تم استلام طلب حجزك بنجاح. فيما يلي تفاصيل حجزك:</p>
          
          <div class="details">
            <div class="detail-row"><span class="detail-label">الرحلة:</span><span class="detail-value">${tourName}</span></div>
            <div class="detail-row"><span class="detail-label">التاريخ:</span><span class="detail-value">${date}</span></div>
            <div class="detail-row"><span class="detail-label">عدد الأفراد:</span><span class="detail-value">${booking.details.persons} شخص</span></div>
            <div class="detail-row"><span class="detail-label">رقم الحجز:</span><span class="detail-value">${booking.id}</span></div>
          </div>
          
          <div class="price">
            <div>المبلغ المطلوب</div>
            <div class="amount">${booking.pricing.totalAmount.toLocaleString()} ${booking.pricing.currency === 'EGP' ? 'جنيه' : '$'}</div>
          </div>
          
          <p>سيتم التواصل معك خلال 24 ساعة لتأكيد الحجز نهائياً.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.SITE_URL || 'https://simoon-issac.vercel.app'}/pay.html" class="button">إتمام الدفع</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 رحلة في مصر - جميع الحقوق محفوظة</p>
          <p>للتواصل: <a href="tel:01229971386">01229971386</a> | <a href="https://wa.me/201229971386">واتساب</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: booking.customer.email,
    subject: `✅ تأكيد حجز رحلتك - ${tourName}`,
    html
  });
}

/**
 * Send payment confirmation email
 * @param {Object} booking - Booking object
 * @param {Object} tour - Tour object
 * @returns {Promise<boolean>}
 */
async function sendPaymentConfirmation(booking, tour) {
  const tourName = tour.nameAr;
  const date = new Date(booking.details.date).toLocaleDateString('ar-EG');
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تأكيد الدفع - رحلة في مصر</title>
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4caf50, #388e3c); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .success-icon { text-align: center; font-size: 60px; color: #4caf50; margin-bottom: 20px; }
        .greeting { font-size: 18px; font-weight: bold; color: #4caf50; margin-bottom: 20px; text-align: center; }
        .details { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ تأكيد الدفع</h1>
        </div>
        <div class="content">
          <div class="success-icon">✓</div>
          <div class="greeting">تم تأكيد دفعك بنجاح!</div>
          <p>نشكرك على ثقتك بنا. تم تأكيد حجزك وسيتم التواصل معك لتأكيد التفاصيل النهائية.</p>
          
          <div class="details">
            <div class="detail-row"><span class="detail-label">الرحلة:</span><span class="detail-value">${tourName}</span></div>
            <div class="detail-row"><span class="detail-label">التاريخ:</span><span class="detail-value">${date}</span></div>
            <div class="detail-row"><span class="detail-label">عدد الأفراد:</span><span class="detail-value">${booking.details.persons} شخص</span></div>
            <div class="detail-row"><span class="detail-label">رقم الحجز:</span><span class="detail-value">${booking.id}</span></div>
            <div class="detail-row"><span class="detail-label">رقم التحويل:</span><span class="detail-value">${booking.payment.transferNumber}</span></div>
          </div>
          
          <p>في حال وجود أي استفسار، لا تتردد في التواصل معنا.</p>
        </div>
        <div class="footer">
          <p>© 2026 رحلة في مصر - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: booking.customer.email,
    subject: `✅ تم تأكيد دفع رحلة ${tourName}`,
    html
  });
}

/**
 * Send contact confirmation email to user
 * @param {Object} contact - Contact object
 * @returns {Promise<boolean>}
 */
async function sendContactConfirmation(contact) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>شكراً لتواصلك - رحلة في مصر</title>
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #D4AF37, #B8860B); color: #2c1810; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; font-weight: bold; color: #D4AF37; margin-bottom: 20px; }
        .message-box { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏛️ رحلة في مصر</h1>
        </div>
        <div class="content">
          <div class="greeting">عزيزي/عزيزتي ${contact.name}،</div>
          <p>شكراً لتواصلك مع فريق رحلة في مصر. هذا تأكيد باستلام رسالتك، وسنقوم بالرد عليك في أقرب وقت ممكن.</p>
          
          <div class="message-box">
            <strong>رسالتك:</strong><br>
            <p>${contact.message}</p>
          </div>
          
          <p>مع تحيات فريق رحلة في مصر</p>
        </div>
        <div class="footer">
          <p>© 2026 رحلة في مصر - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: contact.email,
    subject: `📧 شكراً لتواصلك مع رحلة في مصر`,
    html
  });
}

/**
 * Send contact notification to admin
 * @param {Object} contact - Contact object
 * @returns {Promise<boolean>}
 */
async function sendContactNotification(contact) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>رسالة جديدة من الموقع</title>
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #D4AF37; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .details { background-color: #f5f5f5; padding: 15px; border-radius: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📧 رسالة جديدة من الموقع</h2>
        </div>
        <div class="content">
          <div class="details">
            <p><strong>الاسم:</strong> ${contact.name}</p>
            <p><strong>البريد:</strong> ${contact.email}</p>
            <p><strong>الهاتف:</strong> ${contact.phone || 'غير مدخل'}</p>
            <p><strong>الموضوع:</strong> ${contact.subject}</p>
            <hr>
            <p><strong>الرسالة:</strong></p>
            <p>${contact.message}</p>
          </div>
          <p><a href="${process.env.SITE_URL}/dashboard">الذهاب إلى لوحة التحكم</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: adminEmail,
    subject: `📧 رسالة جديدة من ${contact.name}`,
    html
  });
}

/**
 * Send admin email to customer
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise<boolean>}
 */
async function sendAdminEmail(to, subject, message) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #D4AF37, #B8860B); color: #2c1810; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .message-content { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; white-space: pre-wrap; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏛️ رحلة في مصر</h1>
        </div>
        <div class="content">
          <div class="message-content">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p>مع تحيات فريق رحلة في مصر</p>
        </div>
        <div class="footer">
          <p>© 2026 رحلة في مصر - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to,
    subject,
    html
  });
}

// Export all email functions
module.exports = {
  initTransporter,
  sendEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendContactConfirmation,
  sendContactNotification,
  sendAdminEmail
};