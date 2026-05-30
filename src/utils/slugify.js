// ============================================
// Slugify Utility
// رحلة في مصر - Journey in Egypt
// ============================================

/**
 * Convert Arabic text to transliterated slug
 * @param {string} text - Arabic text to convert
 * @returns {string} Transliterated string
 */
function arabicToTransliteration(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Arabic to Latin character mapping
  const arabicMap = {
    'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's',
    'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
    'ة': 'h', 'ى': 'a', 'ء': 'a', 'ؤ': 'a', 'ئ': 'a', 'إ': 'i', 'أ': 'a',
    'آ': 'a', '': ''
  };
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += arabicMap[char] || char;
  }
  
  return result;
}

/**
 * Generate URL-friendly slug from string
 * @param {string} text - Text to convert to slug
 * @param {Object} options - Slug options
 * @param {boolean} options.lowercase - Convert to lowercase (default: true)
 * @param {boolean} options.removeStopWords - Remove common stop words (default: false)
 * @param {string} options.separator - Word separator (default: '-')
 * @returns {string} URL-friendly slug
 */
function slugify(text, options = {}) {
  const {
    lowercase = true,
    removeStopWords = false,
    separator = '-'
  } = options;
  
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let processedText = text.trim();
  
  // Check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF]/.test(processedText);
  
  if (hasArabic) {
    // Convert Arabic to transliteration
    processedText = arabicToTransliteration(processedText);
  }
  
  // Convert to lowercase if needed
  if (lowercase) {
    processedText = processedText.toLowerCase();
  }
  
  // Remove stop words if enabled
  if (removeStopWords) {
    const stopWords = ['a', 'an', 'and', 'the', 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];
    const words = processedText.split(' ');
    processedText = words.filter(word => !stopWords.includes(word)).join(' ');
  }
  
  // Remove special characters and replace spaces with separator
  let slug = processedText
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, separator)     // Replace spaces with separator
    .replace(/-+/g, separator)      // Replace multiple separators with single
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), ''); // Trim separators from ends
  
  // Limit slug length
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
    // Remove incomplete last word if needed
    const lastSeparatorIndex = slug.lastIndexOf(separator);
    if (lastSeparatorIndex > 50) {
      slug = slug.substring(0, lastSeparatorIndex);
    }
  }
  
  // Ensure slug is not empty
  if (!slug) {
    slug = 'tour';
  }
  
  return slug;
}

/**
 * Generate unique slug by checking against existing slugs
 * @param {string} baseText - Base text for slug
 * @param {Function} checkExists - Async function to check if slug exists
 * @param {Object} options - Slug options
 * @returns {Promise<string>} Unique slug
 */
async function generateUniqueSlug(baseText, checkExists, options = {}) {
  let slug = slugify(baseText, options);
  let uniqueSlug = slug;
  let counter = 1;
  
  while (await checkExists(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

/**
 * Generate slug from tour name (Arabic or English)
 * @param {Object} tour - Tour object with nameAr and nameEn
 * @returns {string} Generated slug
 */
function generateTourSlug(tour) {
  if (!tour) return '';
  
  // Prefer English name if available
  if (tour.nameEn && tour.nameEn.trim()) {
    return slugify(tour.nameEn);
  }
  
  // Fallback to Arabic name
  if (tour.nameAr && tour.nameAr.trim()) {
    return slugify(tour.nameAr);
  }
  
  // Last resort: use ID
  return tour.id || `tour-${Date.now()}`;
}

/**
 * Check if slug is valid
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid
 */
function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  
  // Slug should only contain lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}

/**
 * Normalize slug for comparison
 * @param {string} slug - Slug to normalize
 * @returns {string} Normalized slug
 */
function normalizeSlug(slug) {
  if (!slug) return '';
  return slug.toLowerCase().trim();
}

/**
 * Create SEO-friendly URL from slug
 * @param {string} slug - Slug
 * @param {string} basePath - Base path (default: '/tour')
 * @returns {string} Full URL
 */
function createSeoUrl(slug, basePath = '/tour') {
  if (!slug) return basePath;
  return `${basePath}/${slug}`;
}

/**
 * Extract slug from URL
 * @param {string} url - Full URL
 * @returns {string} Extracted slug
 */
function extractSlugFromUrl(url) {
  if (!url) return '';
  
  const parts = url.split('/');
  const slug = parts[parts.length - 1];
  
  // Remove query parameters if any
  return slug.split('?')[0];
}

/**
 * Batch generate slugs for multiple tours
 * @param {Array} tours - Array of tour objects
 * @returns {Array} Tours with slugs added
 */
function generateTourSlugs(tours) {
  if (!Array.isArray(tours)) return [];
  
  const slugMap = new Map();
  
  return tours.map(tour => {
    let baseSlug = generateTourSlug(tour);
    let uniqueSlug = baseSlug;
    let counter = 1;
    
    while (slugMap.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    slugMap.set(uniqueSlug, true);
    
    return {
      ...tour,
      slug: uniqueSlug
    };
  });
}

/**
 * Common stop words for different languages
 */
const STOP_WORDS = {
  en: ['a', 'an', 'and', 'the', 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'but', 'or', 'so', 'for', 'nor', 'yet', 'as', 'like', 'such', 'that', 'this', 'these', 'those', 'then', 'than', 'so', 'too', 'very', 'just', 'but', 'do', 'does', 'did', 'doing'],
  ar: ['و', 'ف', 'ثم', 'أو', 'ب', 'ل', 'عن', 'على', 'في', 'من', 'إلى', 'هذا', 'هذه', 'ذلك', 'تلك', 'هناك', 'هنا', 'كان', 'كانت', 'يكون', 'تصبح', 'أصبح', 'صار', 'ليس', 'لا', 'ما', 'لم', 'لن', 'سوف', 'قد', 'هل', 'أ', 'ال', 'ان', 'انها', 'انه', 'نحن', 'هم', 'هن', 'أنت', 'أنتم', 'أنتن', 'أنا']
};

/**
 * Remove stop words from text before slugification
 * @param {string} text - Input text
 * @param {string} lang - Language ('en' or 'ar')
 * @returns {string} Text without stop words
 */
function removeStopWords(text, lang = 'en') {
  if (!text) return '';
  
  const stopWords = STOP_WORDS[lang] || STOP_WORDS.en;
  const words = text.toLowerCase().split(/\s+/);
  const filtered = words.filter(word => !stopWords.includes(word));
  
  return filtered.join(' ');
}

// Export all slugify utilities
module.exports = {
  // Main slugify function
  slugify,
  generateUniqueSlug,
  generateTourSlug,
  
  // Validation
  isValidSlug,
  normalizeSlug,
  
  // URL utilities
  createSeoUrl,
  extractSlugFromUrl,
  
  // Batch operations
  generateTourSlugs,
  
  // Helpers
  arabicToTransliteration,
  removeStopWords,
  STOP_WORDS
};