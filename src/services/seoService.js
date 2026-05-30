// ============================================
// SEO Service
// رحلة في مصر - Journey in Egypt
// ============================================

const { SITE_CONFIG } = require('../config/constants');

/**
 * SEO Service for generating meta tags, structured data, and sitemap
 */
class SEOService {
  constructor() {
    this.siteUrl = SITE_CONFIG.SITE_URL || 'https://simoon-issac.vercel.app';
    this.siteNameAr = SITE_CONFIG.NAME_AR || 'رحلة في مصر';
    this.siteNameEn = SITE_CONFIG.NAME_EN || 'Journey in Egypt';
    this.defaultImage = 'https://i.postimg.cc/d0Pfc81d/Logo.jpg';
    this.defaultDescription = 'استمتع بأفضل الرحلات السياحية في مصر. الأهرامات، الأقصر، الغردقة وشرم الشيخ. عروض حصرية، حجز آمن، دعم فوري.';
    this.defaultKeywords = 'رحلات سياحية مصر, حجز جولات سياحية, عروض السفر, Nile cruise, Cairo tours, Luxor excursions';
  }

  /**
   * Generate basic meta tags for a page
   * @param {Object} options - SEO options
   * @returns {Object} Meta tags object
   */
  generateMetaTags(options = {}) {
    const {
      title,
      description,
      keywords,
      canonicalUrl,
      robots = 'index, follow',
      author = SITE_CONFIG.NAME_AR
    } = options;

    return {
      title: title ? `${title} | ${this.siteNameAr}` : this.siteNameAr,
      meta: [
        { name: 'description', content: description || this.defaultDescription },
        { name: 'keywords', content: keywords || this.defaultKeywords },
        { name: 'author', content: author },
        { name: 'robots', content: robots },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'canonical', href: canonicalUrl || this.siteUrl },
        { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' }
      ]
    };
  }

  /**
   * Generate Open Graph meta tags for social media
   * @param {Object} options - OG options
   * @returns {Array} OG meta tags
   */
  generateOpenGraphTags(options = {}) {
    const {
      title,
      description,
      image,
      url,
      type = 'website',
      siteName = this.siteNameAr,
      locale = 'ar_AR'
    } = options;

    return [
      { property: 'og:title', content: title || this.siteNameAr },
      { property: 'og:description', content: description || this.defaultDescription },
      { property: 'og:image', content: image || this.defaultImage },
      { property: 'og:url', content: url || this.siteUrl },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: siteName },
      { property: 'og:locale', content: locale },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: title || this.siteNameAr }
    ];
  }

  /**
   * Generate Twitter Card meta tags
   * @param {Object} options - Twitter card options
   * @returns {Array} Twitter meta tags
   */
  generateTwitterTags(options = {}) {
    const {
      title,
      description,
      image,
      card = 'summary_large_image',
      site = '@journeyinegypt'
    } = options;

    return [
      { name: 'twitter:card', content: card },
      { name: 'twitter:site', content: site },
      { name: 'twitter:title', content: title || this.siteNameAr },
      { name: 'twitter:description', content: description || this.defaultDescription },
      { name: 'twitter:image', content: image || this.defaultImage }
    ];
  }

  /**
   * Generate complete SEO tags for a page
   * @param {Object} options - SEO options
   * @returns {Object} Complete SEO tags
   */
  generateCompleteSEOTags(options = {}) {
    return {
      ...this.generateMetaTags(options),
      openGraph: this.generateOpenGraphTags(options),
      twitter: this.generateTwitterTags(options)
    };
  }

  /**
   * Generate JSON-LD structured data for organization
   * @returns {Object} Organization schema
   */
  generateOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      name: this.siteNameAr,
      alternateName: this.siteNameEn,
      url: this.siteUrl,
      logo: this.defaultImage,
      description: this.defaultDescription,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'القاهرة',
        addressCountry: 'EG'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+201229971386',
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'English']
      },
      sameAs: [
        'https://www.facebook.com/simoon.issac',
        'https://www.instagram.com/simoon.issac',
        'https://wa.me/201229971386'
      ]
    };
  }

  /**
   * Generate JSON-LD structured data for a tour
   * @param {Object} tour - Tour object
   * @returns {Object} Tour schema
   */
  generateTourSchema(tour) {
    const tourName = tour.nameAr;
    const tourDescription = tour.descriptionAr || tour.shortDescriptionAr || this.defaultDescription;
    const tourImage = tour.mainImage || this.defaultImage;
    const tourUrl = `${this.siteUrl}/tour/${tour.slug || tour.id}`;

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: tourName,
      description: tourDescription,
      image: tourImage,
      url: tourUrl,
      brand: {
        '@type': 'Brand',
        name: this.siteNameAr
      },
      offers: {
        '@type': 'Offer',
        price: tour.priceEgyptian,
        priceCurrency: 'EGP',
        availability: tour.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: tourUrl,
        validFrom: new Date().toISOString()
      },
      aggregateRating: tour.totalRatings > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: tour.rating,
        ratingCount: tour.totalRatings,
        bestRating: 5,
        worstRating: 1
      } : undefined
    };
  }

  /**
   * Generate JSON-LD for multiple tours (list)
   * @param {Array} tours - Array of tour objects
   * @returns {Object} ItemList schema
   */
  generateTourListSchema(tours) {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'قائمة الجولات السياحية',
      description: 'اكتشف أفضل الجولات السياحية في مصر',
      numberOfItems: tours.length,
      itemListElement: tours.map((tour, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${this.siteUrl}/tour/${tour.slug || tour.id}`,
        name: tour.nameAr
      }))
    };
  }

  /**
   * Generate JSON-LD for breadcrumbs
   * @param {Array} items - Breadcrumb items [{name, url}]
   * @returns {Object} BreadcrumbList schema
   */
  generateBreadcrumbSchema(items) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Generate JSON-LD for FAQ
   * @param {Array} faqs - FAQ items [{question, answer}]
   * @returns {Object} FAQPage schema
   */
  generateFAQSchema(faqs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate JSON-LD for review
   * @param {Object} rating - Rating object
   * @param {Object} tour - Tour object
   * @returns {Object} Review schema
   */
  generateReviewSchema(rating, tour) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: rating.name
      },
      datePublished: rating.createdAt,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: rating.rating,
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: rating.message,
      itemReviewed: {
        '@type': 'Product',
        name: tour.nameAr,
        url: `${this.siteUrl}/tour/${tour.slug || tour.id}`
      }
    };
  }

  /**
   * Generate sitemap XML
   * @param {Array} tours - Array of tour objects
   * @returns {string} Sitemap XML
   */
  generateSitemap(tours = []) {
    const staticPages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/rate', priority: 0.8, changefreq: 'weekly' },
      { url: '/#tours', priority: 0.9, changefreq: 'daily' },
      { url: '/#about', priority: 0.7, changefreq: 'monthly' },
      { url: '/#contact', priority: 0.6, changefreq: 'monthly' }
    ];

    const tourUrls = tours.map(tour => ({
      url: `/tour/${tour.slug || tour.id}`,
      priority: 0.9,
      changefreq: 'weekly',
      lastmod: tour.updatedAt || new Date().toISOString()
    }));

    const allUrls = [...staticPages, ...tourUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(item => `  <url>
    <loc>${this.siteUrl}${item.url}</loc>
    <lastmod>${item.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  }

  /**
   * Generate robots.txt content
   * @returns {string} Robots.txt content
   */
  generateRobotsTxt() {
    return `# Robots.txt for ${this.siteNameAr}
User-agent: *
Allow: /
Disallow: /login
Disallow: /dashboard
Disallow: /api/
Disallow: /pay
Disallow: /admin/

Sitemap: ${this.siteUrl}/sitemap.xml

# Crawl delay for bots
Crawl-delay: 1

# Host
Host: ${this.siteUrl.replace('https://', '')}`;
  }

  /**
   * Generate meta description from tour data
   * @param {Object} tour - Tour object
   * @param {number} maxLength - Maximum length
   * @returns {string} Meta description
   */
  generateTourMetaDescription(tour, maxLength = 160) {
    let description = tour.shortDescriptionAr || tour.descriptionAr || '';
    
    if (!description) {
      description = `استكشف رحلة ${tour.nameAr} مع رحلة في مصر. ${tour.duration} من المغامرة والتاريخ والثقافة. احجز الآن واستمتع بتجربة لا تُنسى.`;
    }
    
    if (description.length > maxLength) {
      description = description.substring(0, maxLength - 3) + '...';
    }
    
    return description;
  }

  /**
   * Generate meta keywords from tour
   * @param {Object} tour - Tour object
   * @returns {string} Meta keywords
   */
  generateTourKeywords(tour) {
    const baseKeywords = ['رحلة سياحية مصر', 'حجز جولات سياحية', 'رحلات سياحية'];
    const tourKeywords = tour.nameAr.split(' ');
    const allKeywords = [...baseKeywords, ...tourKeywords, 'مصر', 'سياحة'];
    return [...new Set(allKeywords)].join(', ');
  }

  /**
   * Generate complete page SEO data for a tour
   * @param {Object} tour - Tour object
   * @returns {Object} Complete SEO data
   */
  generateTourSEOData(tour) {
    const title = tour.nameAr;
    const description = this.generateTourMetaDescription(tour);
    const keywords = this.generateTourKeywords(tour);
    const url = `${this.siteUrl}/tour/${tour.slug || tour.id}`;
    const image = tour.mainImage || this.defaultImage;

    return {
      title,
      metaTags: this.generateCompleteSEOTags({
        title,
        description,
        keywords,
        canonicalUrl: url
      }),
      openGraph: this.generateOpenGraphTags({
        title,
        description,
        image,
        url,
        type: 'product'
      }),
      twitter: this.generateTwitterTags({
        title,
        description,
        image
      }),
      structuredData: this.generateTourSchema(tour),
      breadcrumb: this.generateBreadcrumbSchema([
        { name: 'الرئيسية', url: this.siteUrl },
        { name: 'الجولات', url: `${this.siteUrl}/#tours` },
        { name: title, url: url }
      ])
    };
  }

  /**
   * Generate complete page SEO data for homepage
   * @returns {Object} Homepage SEO data
   */
  generateHomepageSEOData() {
    return {
      title: this.siteNameAr,
      metaTags: this.generateCompleteSEOTags({
        title: this.siteNameAr,
        description: this.defaultDescription,
        keywords: this.defaultKeywords
      }),
      structuredData: this.generateOrganizationSchema()
    };
  }
}

// Create singleton instance
const seoService = new SEOService();

// Export service
module.exports = {
  seoService,
  SEOService
};