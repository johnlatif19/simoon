// ============================================
// Image Service
// رحلة في مصر - Journey in Egypt
// ============================================

const { IMAGE_SETTINGS, DEFAULT_IMAGES } = require('../config/constants');

/**
 * Image service for handling image operations
 * Note: For production, consider using Cloudinary or similar service
 */
class ImageService {
  constructor() {
    this.allowedTypes = IMAGE_SETTINGS.ALLOWED_TYPES || ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    this.maxSizeMB = IMAGE_SETTINGS.MAX_SIZE_MB || 5;
    this.maxSizeBytes = this.maxSizeMB * 1024 * 1024;
  }

  /**
   * Validate image file
   * @param {Object} file - Multer file object
   * @returns {Object} { valid, error }
   */
  validateImage(file) {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > this.maxSizeBytes) {
      return { 
        valid: false, 
        error: `File size must be less than ${this.maxSizeMB}MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      };
    }

    // Check file type
    const mimeType = file.mimetype;
    const extension = file.originalname.split('.').pop().toLowerCase();
    
    if (!this.allowedTypes.includes(extension) && !this.allowedTypes.includes(mimeType.split('/')[1])) {
      return { 
        valid: false, 
        error: `File type not allowed. Allowed: ${this.allowedTypes.join(', ')}` 
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Validate multiple images
   * @param {Array} files - Array of Multer file objects
   * @returns {Object} { valid, errors, validFiles }
   */
  validateMultipleImages(files) {
    if (!files || files.length === 0) {
      return { valid: false, error: 'No files provided', validFiles: [] };
    }

    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const validation = this.validateImage(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push({ filename: file.originalname, error: validation.error });
      }
    }

    return {
      valid: validFiles.length > 0,
      errors,
      validFiles,
      totalValid: validFiles.length,
      totalInvalid: errors.length
    };
  }

  /**
   * Get file extension
   * @param {string} filename - File name
   * @returns {string} Extension
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original file name
   * @param {string} prefix - Prefix for the filename
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalName, prefix = 'tour') {
    const extension = this.getFileExtension(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Get image URL with size parameters
   * @param {string} url - Original image URL
   * @param {string} size - Size name (thumbnail, small, medium, large)
   * @returns {string} Optimized URL
   */
  getOptimizedUrl(url, size = 'medium') {
    if (!url) return DEFAULT_IMAGES.tour;
    
    // For external URLs (Unsplash, etc.)
    if (url.includes('unsplash.com')) {
      const sizes = {
        thumbnail: '&w=150&h=150&fit=crop',
        small: '&w=300&h=200&fit=crop',
        medium: '&w=600&h=400&fit=crop',
        large: '&w=1200&h=800&fit=crop'
      };
      return `${url}${sizes[size] || sizes.medium}`;
    }
    
    // For Cloudinary
    if (url.includes('cloudinary.com')) {
      const sizes = {
        thumbnail: 'w_150,h_150,c_fill',
        small: 'w_300,h_200,c_fill',
        medium: 'w_600,h_400,c_fill',
        large: 'w_1200,h_800,c_fill'
      };
      return url.replace('/upload/', `/upload/${sizes[size] || sizes.medium}/`);
    }
    
    // For local images
    return url;
  }

  /**
   * Get thumbnail URL
   * @param {string} url - Original image URL
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(url) {
    return this.getOptimizedUrl(url, 'thumbnail');
  }

  /**
   * Get responsive srcset for image
   * @param {string} url - Original image URL
   * @returns {string} Srcset attribute value
   */
  getResponsiveSrcset(url) {
    if (!url) return '';
    
    const sizes = ['small', 'medium', 'large'];
    const srcset = sizes.map(size => {
      const optimizedUrl = this.getOptimizedUrl(url, size);
      const width = size === 'small' ? 300 : (size === 'medium' ? 600 : 1200);
      return `${optimizedUrl} ${width}w`;
    }).join(', ');
    
    return srcset;
  }

  /**
   * Get image placeholder (data URI)
   * @returns {string} Base64 placeholder
   */
  getPlaceholder() {
    // Simple 1x1 transparent GIF
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  /**
   * Generate alt text from tour name
   * @param {Object} tour - Tour object
   * @param {string} lang - Language code
   * @returns {string} Alt text
   */
  generateAltText(tour, lang = 'ar') {
    const name = lang === 'ar' ? tour.nameAr : tour.nameEn;
    if (lang === 'ar') {
      return `رحلة ${name} - اكتشف جمال مصر مع رحلة في مصر`;
    }
    return `${name} tour - Discover Egypt with Journey in Egypt`;
  }

  /**
   * Check if image URL is valid
   * @param {string} url - Image URL
   * @returns {boolean}
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      if (!validProtocols.includes(urlObj.protocol)) return false;
      
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
      return imageExtensions.test(url);
    } catch {
      return false;
    }
  }

  /**
   * Extract image URLs from text
   * @param {string} text - Text containing image URLs
   * @returns {Array} Array of image URLs
   */
  extractImageUrls(text) {
    if (!text || typeof text !== 'string') return [];
    
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  /**
   * Get default image for a type
   * @param {string} type - Image type (tour, avatar, gallery)
   * @returns {string} Default image URL
   */
  getDefaultImage(type = 'tour') {
    return DEFAULT_IMAGES[type] || DEFAULT_IMAGES.tour;
  }

  /**
   * Format file size for display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get image dimensions from URL (async)
   * @param {string} url - Image URL
   * @returns {Promise<Object>} { width, height }
   */
  async getImageDimensions(url) {
    return new Promise((resolve) => {
      const img = new (require('image-size'))();
      // Note: This is a simplified version
      // In production, use a proper image processing library
      resolve({ width: 800, height: 600 });
    });
  }

  /**
   * Check if image exists and is accessible
   * @param {string} url - Image URL
   * @returns {Promise<boolean>}
   */
  async imageExists(url) {
    if (!this.isValidImageUrl(url)) return false;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const imageService = new ImageService();

// Export service and utilities
module.exports = {
  imageService,
  ImageService,
  
  // Convenience methods
  validateImage: (file) => imageService.validateImage(file),
  validateMultipleImages: (files) => imageService.validateMultipleImages(files),
  getOptimizedUrl: (url, size) => imageService.getOptimizedUrl(url, size),
  getThumbnailUrl: (url) => imageService.getThumbnailUrl(url),
  getResponsiveSrcset: (url) => imageService.getResponsiveSrcset(url),
  getPlaceholder: () => imageService.getPlaceholder(),
  generateAltText: (tour, lang) => imageService.generateAltText(tour, lang),
  isValidImageUrl: (url) => imageService.isValidImageUrl(url),
  getDefaultImage: (type) => imageService.getDefaultImage(type),
  formatFileSize: (bytes) => imageService.formatFileSize(bytes)
};