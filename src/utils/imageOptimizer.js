// ============================================
// Image Optimizer Utility
// رحلة في مصر - Journey in Egypt
// ============================================

const { IMAGE_SETTINGS } = require('../config/constants');

/**
 * Default image dimensions
 */
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 300, height: 200, quality: 75 },
  medium: { width: 600, height: 400, quality: 80 },
  large: { width: 1200, height: 800, quality: 85 },
  hero: { width: 1920, height: 1080, quality: 90 }
};

/**
 * Default placeholder image
 */
const DEFAULT_IMAGES = {
  tour: '/assets/images/default-tour.jpg',
  avatar: '/assets/images/default-avatar.png',
  gallery: '/assets/images/default-gallery.jpg'
};

/**
 * Check if image URL is valid
 * @param {string} url - Image URL to validate
 * @returns {boolean}
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const allowedExtensions = IMAGE_SETTINGS.ALLOWED_TYPES || ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = url.split('.').pop()?.toLowerCase();
  
  // Check extension
  if (extension && !allowedExtensions.includes(extension)) {
    return false;
  }
  
  // Check URL format
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get file extension from URL
 * @param {string} url - Image URL
 * @returns {string} File extension
 */
function getImageExtension(url) {
  if (!url) return 'jpg';
  const match = url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Generate image URL with optimization parameters
 * For use with image CDN services like Cloudinary, Imgix, etc.
 * @param {string} url - Original image URL
 * @param {string} size - Size key (thumbnail, small, medium, large, hero)
 * @returns {string} Optimized URL
 */
function getOptimizedImageUrl(url, size = 'medium') {
  if (!url || !isValidImageUrl(url)) {
    return DEFAULT_IMAGES.tour;
  }
  
  const dimensions = IMAGE_SIZES[size] || IMAGE_SIZES.medium;
  
  // For Unsplash images
  if (url.includes('unsplash.com')) {
    return `${url}&w=${dimensions.width}&h=${dimensions.height}&fit=crop&q=${dimensions.quality}`;
  }
  
  // For Cloudinary (if using Cloudinary)
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${dimensions.width},h_${dimensions.height},c_fill,q_${dimensions.quality}/`);
  }
  
  // For Imgix (if using Imgix)
  if (url.includes('imgix.net')) {
    return `${url}?w=${dimensions.width}&h=${dimensions.height}&fit=crop&q=${dimensions.quality}`;
  }
  
  // For local images or other sources
  // Add query parameters for potential future CDN
  if (url.startsWith('/assets/')) {
    return url;
  }
  
  // Return original URL with size hint in query (for future processing)
  return `${url}?w=${dimensions.width}&h=${dimensions.height}&q=${dimensions.quality}`;
}

/**
 * Get thumbnail URL
 * @param {string} url - Original image URL
 * @returns {string} Thumbnail URL
 */
function getThumbnailUrl(url) {
  return getOptimizedImageUrl(url, 'thumbnail');
}

/**
 * Get hero image URL (large banner)
 * @param {string} url - Original image URL
 * @returns {string} Hero image URL
 */
function getHeroImageUrl(url) {
  return getOptimizedImageUrl(url, 'hero');
}

/**
 * Generate multiple sizes for responsive images
 * @param {string} url - Original image URL
 * @returns {Object} Object with srcset and sizes
 */
function getResponsiveImageSet(url) {
  if (!url || !isValidImageUrl(url)) {
    return {
      srcset: `${DEFAULT_IMAGES.tour} 600w`,
      sizes: '(max-width: 600px) 100vw, 600px'
    };
  }
  
  const sizes = ['small', 'medium', 'large'];
  const srcset = sizes.map(size => {
    const optimizedUrl = getOptimizedImageUrl(url, size);
    const width = IMAGE_SIZES[size].width;
    return `${optimizedUrl} ${width}w`;
  }).join(', ');
  
  return {
    srcset,
    sizes: '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw'
  };
}

/**
 * Generate alt text from tour name
 * @param {string} tourName - Tour name in Arabic or English
 * @param {string} lang - Language code
 * @returns {string} Alt text
 */
function generateAltText(tourName, lang = 'ar') {
  if (!tourName) return 'رحلة سياحية في مصر';
  
  if (lang === 'ar') {
    return `رحلة ${tourName} - اكتشف جمال مصر`;
  }
  return `${tourName} tour - Discover Egypt's beauty`;
}

/**
 * Validate image file (for uploads)
 * @param {Object} file - Multer file object
 * @returns {Object} { valid, error }
 */
function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'لم يتم رفع أي ملف' };
  }
  
  // Check file size
  const maxSizeMB = IMAGE_SETTINGS.MAX_SIZE_MB || 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `حجم الملف يجب أن يكون أقل من ${maxSizeMB} ميجابايت` 
    };
  }
  
  // Check file type
  const allowedTypes = IMAGE_SETTINGS.ALLOWED_TYPES || ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const fileType = file.mimetype.split('/')[1];
  
  if (!allowedTypes.includes(fileType)) {
    return { 
      valid: false, 
      error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { valid: true, error: null };
}

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extract image URL from rich text content
 * @param {string} content - HTML content
 * @returns {Array} Array of image URLs
 */
function extractImagesFromContent(content) {
  if (!content || typeof content !== 'string') return [];
  
  const imageRegex = /<img[^>]+src="([^">]+)"/g;
  const images = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  
  return images;
}

/**
 * Get dominant color from image (placeholder for future implementation)
 * @param {string} url - Image URL
 * @returns {Promise<string>} Hex color code
 */
async function getDominantColor(url) {
  // This would require a backend service or external API
  // For now, return a default gold color
  return '#D4AF37';
}

/**
 * Lazy loading attributes for images
 * @param {string} url - Image URL
 * @param {string} alt - Alt text
 * @param {string} className - CSS class
 * @returns {string} HTML img tag with lazy loading
 */
function getLazyImageHtml(url, alt, className = '') {
  if (!url) url = DEFAULT_IMAGES.tour;
  
  return `<img 
    src="${getThumbnailUrl(url)}" 
    data-src="${getOptimizedImageUrl(url, 'medium')}" 
    data-srcset="${getResponsiveImageSet(url).srcset}"
    alt="${escapeHtmlForAttribute(alt)}" 
    class="lazy-image ${className}"
    loading="lazy"
    width="600"
    height="400"
  />`;
}

/**
 * Escape HTML for attribute
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtmlForAttribute(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generate image placeholder (blurhash or low quality placeholder)
 * @returns {string} Base64 placeholder
 */
function getImagePlaceholder() {
  // Simple base64 placeholder (1x1 transparent GIF)
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}

// Export all image utilities
module.exports = {
  IMAGE_SIZES,
  DEFAULT_IMAGES,
  isValidImageUrl,
  getImageExtension,
  getOptimizedImageUrl,
  getThumbnailUrl,
  getHeroImageUrl,
  getResponsiveImageSet,
  generateAltText,
  validateImageFile,
  formatFileSize,
  extractImagesFromContent,
  getDominantColor,
  getLazyImageHtml,
  getImagePlaceholder
};