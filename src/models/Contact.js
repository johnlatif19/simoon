// ============================================
// Contact Model
// رحلة في مصر - Journey in Egypt
// ============================================

const { db, COLLECTIONS, createDocument, getDocument, updateDocument, deleteDocument, getDocuments } = require('../config/database');
const { CONTACT_STATUS } = require('../config/constants');

/**
 * Contact status constants
 */
const CONTACT_STATUS_ENUM = {
  UNREAD: 'unread',
  READ: 'read',
  REPLIED: 'replied',
  ARCHIVED: 'archived'
};

/**
 * Contact model class
 */
class Contact {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.subject = data.subject || null;
    this.message = data.message || null;
    this.status = data.status || CONTACT_STATUS_ENUM.UNREAD;
    this.reply = data.reply || null;
    this.repliedAt = data.repliedAt || null;
    this.repliedBy = data.repliedBy || null;
    this.notes = data.notes || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Create a new contact message
   * @param {Object} contactData - Contact data
   * @returns {Promise<Contact>} Created contact
   */
  static async create(contactData) {
    // Validate required fields
    if (!contactData.name) {
      throw new Error('Name is required');
    }
    
    if (!contactData.email) {
      throw new Error('Email is required');
    }
    
    if (!contactData.message) {
      throw new Error('Message is required');
    }
    
    // Create contact object
    const contact = {
      name: contactData.name,
      email: contactData.email.toLowerCase(),
      phone: contactData.phone || null,
      subject: contactData.subject || 'رسالة من الموقع',
      message: contactData.message,
      status: CONTACT_STATUS_ENUM.UNREAD,
      reply: null,
      repliedAt: null,
      repliedBy: null,
      notes: contactData.notes || null
    };
    
    const result = await createDocument(COLLECTIONS.CONTACTS, contact);
    return new Contact(result);
  }

  /**
   * Find contact by ID
   * @param {string} id - Contact ID
   * @returns {Promise<Contact|null>} Contact or null
   */
  static async findById(id) {
    const data = await getDocument(COLLECTIONS.CONTACTS, id);
    if (!data) return null;
    return new Contact(data);
  }

  /**
   * Find all contacts with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array<Contact>>} Array of contacts
   */
  static async findAll(filters = {}) {
    const conditions = [];
    
    if (filters.status) {
      conditions.push({
        field: 'status',
        operator: '==',
        value: filters.status
      });
    }
    
    if (filters.email) {
      conditions.push({
        field: 'email',
        operator: '==',
        value: filters.email.toLowerCase()
      });
    }
    
    if (filters.name) {
      conditions.push({
        field: 'name',
        operator: '>=',
        value: filters.name
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
    
    const contacts = await getDocuments(COLLECTIONS.CONTACTS, conditions, options);
    return contacts.map(c => new Contact(c));
  }

  /**
   * Find unread contacts
   * @param {number} limit - Maximum number to return
   * @returns {Promise<Array<Contact>>} Array of unread contacts
   */
  static async findUnread(limit = null) {
    const conditions = [{
      field: 'status',
      operator: '==',
      value: CONTACT_STATUS_ENUM.UNREAD
    }];
    
    const options = {
      orderBy: 'createdAt',
      orderDirection: 'asc',
      limit: limit
    };
    
    const contacts = await getDocuments(COLLECTIONS.CONTACTS, conditions, options);
    return contacts.map(c => new Contact(c));
  }

  /**
   * Find contacts by email
   * @param {string} email - Email address
   * @returns {Promise<Array<Contact>>} Array of contacts
   */
  static async findByEmail(email) {
    const conditions = [{
      field: 'email',
      operator: '==',
      value: email.toLowerCase()
    }];
    
    const contacts = await getDocuments(COLLECTIONS.CONTACTS, conditions, {
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    
    return contacts.map(c => new Contact(c));
  }

  /**
   * Mark contact as read
   * @param {string} id - Contact ID
   * @returns {Promise<Contact>} Updated contact
   */
  static async markAsRead(id) {
    const updateData = {
      status: CONTACT_STATUS_ENUM.READ
    };
    
    const result = await updateDocument(COLLECTIONS.CONTACTS, id, updateData);
    return new Contact(result);
  }

  /**
   * Reply to contact message
   * @param {string} id - Contact ID
   * @param {string} reply - Reply message
   * @param {string} repliedBy - Admin username who replied
   * @returns {Promise<Contact>} Updated contact
   */
  static async replyToContact(id, reply, repliedBy) {
    if (!reply || reply.trim().length === 0) {
      throw new Error('Reply message is required');
    }
    
    const updateData = {
      status: CONTACT_STATUS_ENUM.REPLIED,
      reply: reply.trim(),
      repliedAt: new Date().toISOString(),
      repliedBy: repliedBy || 'admin'
    };
    
    const result = await updateDocument(COLLECTIONS.CONTACTS, id, updateData);
    return new Contact(result);
  }

  /**
   * Archive contact
   * @param {string} id - Contact ID
   * @returns {Promise<Contact>} Updated contact
   */
  static async archive(id) {
    const updateData = {
      status: CONTACT_STATUS_ENUM.ARCHIVED
    };
    
    const result = await updateDocument(COLLECTIONS.CONTACTS, id, updateData);
    return new Contact(result);
  }

  /**
   * Delete contact
   * @param {string} id - Contact ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    return deleteDocument(COLLECTIONS.CONTACTS, id);
  }

  /**
   * Bulk delete contacts
   * @param {Array<string>} ids - Array of contact IDs
   * @returns {Promise<number>} Number of deleted contacts
   */
  static async bulkDelete(ids) {
    let deletedCount = 0;
    
    for (const id of ids) {
      try {
        await this.delete(id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete contact ${id}:`, error);
      }
    }
    
    return deletedCount;
  }

  /**
   * Bulk mark as read
   * @param {Array<string>} ids - Array of contact IDs
   * @returns {Promise<number>} Number of updated contacts
   */
  static async bulkMarkAsRead(ids) {
    let updatedCount = 0;
    
    for (const id of ids) {
      try {
        await this.markAsRead(id);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to mark contact ${id} as read:`, error);
      }
    }
    
    return updatedCount;
  }

  /**
   * Get contact statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getStats() {
    const allContacts = await this.findAll();
    
    const stats = {
      total: allContacts.length,
      unread: 0,
      read: 0,
      replied: 0,
      archived: 0,
      byDate: {},
      recentContacts: []
    };
    
    for (const contact of allContacts) {
      // Count by status
      switch (contact.status) {
        case CONTACT_STATUS_ENUM.UNREAD:
          stats.unread++;
          break;
        case CONTACT_STATUS_ENUM.READ:
          stats.read++;
          break;
        case CONTACT_STATUS_ENUM.REPLIED:
          stats.replied++;
          break;
        case CONTACT_STATUS_ENUM.ARCHIVED:
          stats.archived++;
          break;
      }
      
      // Group by date
      const date = contact.createdAt ? contact.createdAt.split('T')[0] : 'unknown';
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    }
    
    // Get 5 most recent contacts
    stats.recentContacts = allContacts.slice(0, 5);
    
    return stats;
  }

  /**
   * Search contacts by name, email, or message
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array<Contact>>} Matching contacts
   */
  static async search(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    
    const term = searchTerm.toLowerCase();
    const allContacts = await this.findAll();
    
    const filtered = allContacts.filter(contact => {
      return (
        contact.name?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term) ||
        contact.subject?.toLowerCase().includes(term) ||
        contact.message?.toLowerCase().includes(term)
      );
    });
    
    return filtered;
  }

  /**
   * Check if contact has been replied to
   * @returns {boolean} True if replied
   */
  isReplied() {
    return this.status === CONTACT_STATUS_ENUM.REPLIED && this.reply !== null;
  }

  /**
   * Check if contact is unread
   * @returns {boolean} True if unread
   */
  isUnread() {
    return this.status === CONTACT_STATUS_ENUM.UNREAD;
  }

  /**
   * Get formatted message preview
   * @param {number} length - Maximum length
   * @returns {string} Message preview
   */
  getMessagePreview(length = 100) {
    if (!this.message) return '';
    if (this.message.length <= length) return this.message;
    return this.message.substring(0, length) + '...';
  }

  /**
   * Get full contact info for email reply
   * @returns {Object} Contact info
   */
  getReplyInfo() {
    return {
      to: this.email,
      name: this.name,
      originalMessage: this.message,
      originalSubject: this.subject
    };
  }

  /**
   * Update contact notes
   * @param {string} id - Contact ID
   * @param {string} notes - Admin notes
   * @returns {Promise<Contact>} Updated contact
   */
  static async updateNotes(id, notes) {
    const updateData = {
      notes: notes || null
    };
    
    const result = await updateDocument(COLLECTIONS.CONTACTS, id, updateData);
    return new Contact(result);
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
      phone: this.phone,
      subject: this.subject,
      message: this.message,
      status: this.status,
      reply: this.reply,
      repliedAt: this.repliedAt,
      repliedBy: this.repliedBy,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Export model and constants
module.exports = {
  Contact,
  CONTACT_STATUS_ENUM
};