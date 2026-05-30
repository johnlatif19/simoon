// ============================================
// Contact Controller
// رحلة في مصر - Journey in Egypt
// ============================================

const { Contact, CONTACT_STATUS_ENUM } = require('../models/Contact');
const { sendContactConfirmation, sendContactNotification } = require('../services/emailService');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, getMessage } = require('../config/constants');
const { logEmail } = require('../utils/logger');

/**
 * @desc    Submit a contact message
 * @route   POST /api/v1/contacts
 * @access  Public
 */
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  // Create contact record
  const contact = await Contact.create({
    name,
    email,
    phone,
    subject,
    message
  });
  
  // Send confirmation email to user
  try {
    await sendContactConfirmation(contact);
    logEmail(email, 'Contact Form Confirmation', true);
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    logEmail(email, 'Contact Form Confirmation', false, emailError);
  }
  
  // Send notification email to admin
  try {
    await sendContactNotification(contact);
    logEmail(process.env.ADMIN_EMAIL || 'admin@journeyinegypt.com', 'New Contact Message', true);
  } catch (emailError) {
    console.error('Failed to send admin notification:', emailError);
  }
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: getMessage('CONTACT_SENT', req.lang),
    data: {
      id: contact.id,
      status: contact.status
    }
  });
});

/**
 * @desc    Get all contacts (admin only)
 * @route   GET /api/v1/contacts
 * @access  Private (Admin)
 */
const getAllContacts = asyncHandler(async (req, res) => {
  const { status, email, startDate, endDate, page, limit } = req.query;
  
  const filters = {
    status,
    email,
    startDate,
    endDate,
    limit: limit ? parseInt(limit) : 100,
    orderBy: 'createdAt',
    orderDirection: 'desc'
  };
  
  const contacts = await Contact.findAll(filters);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: contacts.length,
    data: contacts.map(c => c.toJSON())
  });
});

/**
 * @desc    Get contact by ID (admin only)
 * @route   GET /api/v1/contacts/:id
 * @access  Private (Admin)
 */
const getContactById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const contact = await Contact.findById(id);
  if (!contact) {
    throw ApiError.notFound('Contact message not found');
  }
  
  // Auto-mark as read when viewed
  if (contact.status === CONTACT_STATUS_ENUM.UNREAD) {
    await Contact.markAsRead(id);
    contact.status = CONTACT_STATUS_ENUM.READ;
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: contact.toJSON()
  });
});

/**
 * @desc    Get unread contacts count (admin only)
 * @route   GET /api/v1/contacts/unread/count
 * @access  Private (Admin)
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadContacts = await Contact.findUnread();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      unreadCount: unreadContacts.length
    }
  });
});

/**
 * @desc    Get unread contacts (admin only)
 * @route   GET /api/v1/contacts/unread
 * @access  Private (Admin)
 */
const getUnreadContacts = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  
  const contacts = await Contact.findUnread(limit ? parseInt(limit) : null);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: contacts.length,
    data: contacts.map(c => c.toJSON())
  });
});

/**
 * @desc    Get contacts by email (admin only)
 * @route   GET /api/v1/contacts/email/:email
 * @access  Private (Admin)
 */
const getContactsByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  
  const contacts = await Contact.findByEmail(email);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: contacts.length,
    data: contacts.map(c => c.toJSON())
  });
});

/**
 * @desc    Mark contact as read (admin only)
 * @route   PUT /api/v1/contacts/:id/read
 * @access  Private (Admin)
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const contact = await Contact.findById(id);
  if (!contact) {
    throw ApiError.notFound('Contact message not found');
  }
  
  const updatedContact = await Contact.markAsRead(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Contact marked as read',
    data: updatedContact.toJSON()
  });
});

/**
 * @desc    Reply to contact message (admin only)
 * @route   POST /api/v1/contacts/:id/reply
 * @access  Private (Admin)
 */
const replyToContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  
  if (!reply || reply.trim().length === 0) {
    throw ApiError.badRequest('Reply message is required');
  }
  
  const contact = await Contact.findById(id);
  if (!contact) {
    throw ApiError.notFound('Contact message not found');
  }
  
  // Update contact with reply
  const updatedContact = await Contact.replyToContact(
    id,
    reply,
    req.user.username || 'admin'
  );
  
  // Send reply email to user
  try {
    // In production, send actual email here
    // await sendContactReply(contact, reply);
    logEmail(contact.email, `Reply to: ${contact.subject}`, true);
  } catch (emailError) {
    console.error('Failed to send reply email:', emailError);
  }
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Reply sent successfully',
    data: updatedContact.toJSON()
  });
});

/**
 * @desc    Archive contact (admin only)
 * @route   PUT /api/v1/contacts/:id/archive
 * @access  Private (Admin)
 */
const archiveContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const contact = await Contact.findById(id);
  if (!contact) {
    throw ApiError.notFound('Contact message not found');
  }
  
  const updatedContact = await Contact.archive(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Contact archived',
    data: updatedContact.toJSON()
  });
});

/**
 * @desc    Delete contact (admin only)
 * @route   DELETE /api/v1/contacts/:id
 * @access  Private (Admin)
 */
const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const contact = await Contact.findById(id);
  if (!contact) {
    throw ApiError.notFound('Contact message not found');
  }
  
  await Contact.delete(id);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

/**
 * @desc    Bulk delete contacts (admin only)
 * @route   POST /api/v1/contacts/bulk-delete
 * @access  Private (Admin)
 */
const bulkDeleteContacts = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('Please provide an array of contact IDs to delete');
  }
  
  const deletedCount = await Contact.bulkDelete(ids);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${deletedCount} contacts deleted successfully`,
    data: { deletedCount }
  });
});

/**
 * @desc    Bulk mark as read (admin only)
 * @route   POST /api/v1/contacts/bulk-read
 * @access  Private (Admin)
 */
const bulkMarkAsRead = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('Please provide an array of contact IDs');
  }
  
  const updatedCount = await Contact.bulkMarkAsRead(ids);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${updatedCount} contacts marked as read`,
    data: { updatedCount }
  });
});

/**
 * @desc    Get contact statistics (admin only)
 * @route   GET /api/v1/contacts/stats
 * @access  Private (Admin)
 */
const getContactStats = asyncHandler(async (req, res) => {
  const stats = await Contact.getStats();
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Search contacts (admin only)
 * @route   GET /api/v1/contacts/search
 * @access  Private (Admin)
 */
const searchContacts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest('Search term must be at least 2 characters');
  }
  
  const contacts = await Contact.search(q);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    count: contacts.length,
    data: contacts.map(c => c.toJSON())
  });
});

/**
 * @desc    Update contact notes (admin only)
 * @route   PUT /api/v1/contacts/:id/notes
 * @access  Private (Admin)
 */
const updateContactNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  const contact = await Contact.findById(id);
  if (!contact) {
    throw ApiError.notFound('Contact message not found');
  }
  
  const updatedContact = await Contact.updateNotes(id, notes);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Notes updated successfully',
    data: updatedContact.toJSON()
  });
});

// Export all controller functions
module.exports = {
  // Public
  submitContact,
  
  // Admin - Read
  getAllContacts,
  getContactById,
  getUnreadCount,
  getUnreadContacts,
  getContactsByEmail,
  getContactStats,
  searchContacts,
  
  // Admin - Update
  markAsRead,
  replyToContact,
  archiveContact,
  updateContactNotes,
  
  // Admin - Delete
  deleteContact,
  bulkDeleteContacts,
  bulkMarkAsRead
};