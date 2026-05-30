/* ========================================
   MAIN.JS - Core Website Functionality
   ======================================== */

// API Configuration
const API_BASE_URL = window.location.origin;
let currentLanguage = localStorage.getItem('language') || 'ar';

// ---------- API Calls ----------
const api = {
    async get(endpoint, requiresAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (requiresAuth) {
            const token = localStorage.getItem('adminToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },
    
    async post(endpoint, data, requiresAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (requiresAuth) {
            const token = localStorage.getItem('adminToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },
    
    async put(endpoint, data, requiresAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (requiresAuth) {
            const token = localStorage.getItem('adminToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },
    
    async delete(endpoint, requiresAuth = true) {
        const headers = {};
        
        if (requiresAuth) {
            const token = localStorage.getItem('adminToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    }
};

// ---------- Dark Mode ----------
function initDarkMode() {
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (!darkModeBtn) return;
    
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkNow = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkNow);
        darkModeBtn.innerHTML = isDarkNow ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// ---------- Language System ----------
const translations = {
    ar: {
        // Navigation
        nav_home: 'الرئيسية',
        nav_about: 'نبذة عنا',
        nav_tours: 'الجولات',
        nav_gallery: 'المعرض',
        nav_ratings: 'التقييمات',
        nav_contact: 'اتصل بنا',
        
        // Common
        book_now: 'احجز الآن',
        details: 'التفاصيل',
        loading: 'جاري التحميل...',
        no_data: 'لا توجد بيانات',
        error: 'حدث خطأ',
        
        // Tour Card
        duration: 'المدة',
        persons: 'أفراد',
        price: 'السعر',
        
        // Buttons
        confirm: 'تأكيد',
        cancel: 'إلغاء',
        save: 'حفظ',
        delete: 'حذف',
        edit: 'تعديل',
        search: 'بحث',
        
        // Footer
        copyright: '© 2026 رحلة في مصر مع سيمون. جميع الحقوق محفوظة'
    },
    en: {
        // Navigation
        nav_home: 'Home',
        nav_about: 'About',
        nav_tours: 'Tours',
        nav_gallery: 'Gallery',
        nav_ratings: 'Ratings',
        nav_contact: 'Contact',
        
        // Common
        book_now: 'Book Now',
        details: 'Details',
        loading: 'Loading...',
        no_data: 'No data available',
        error: 'An error occurred',
        
        // Tour Card
        duration: 'Duration',
        persons: 'Persons',
        price: 'Price',
        
        // Buttons
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        
        // Footer
        copyright: '© 2026 Journey in Egypt with Simon. All Rights Reserved'
    }
};

function updateLanguage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[currentLanguage][key];
            } else {
                el.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        langBtn.textContent = currentLanguage === 'ar' ? 'EN' : 'AR';
    }
    
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    localStorage.setItem('language', currentLanguage);
}

function initLanguage() {
    const langBtn = document.getElementById('langBtn');
    if (!langBtn) return;
    
    langBtn.addEventListener('click', () => {
        currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
        updateLanguage();
    });
    updateLanguage();
}

// ---------- Load Tours on Homepage ----------
async function loadTours() {
    const toursGrid = document.getElementById('toursGrid');
    if (!toursGrid) return;
    
    try {
        toursGrid.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
        
        const tours = await api.get('/api/v1/tours');
        
        if (!tours || tours.length === 0) {
            toursGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marked-alt"></i>
                    <h3>لا توجد رحلات حالياً</h3>
                    <p>سيتم إضافة رحلات جديدة قريباً</p>
                </div>
            `;
            return;
        }
        
        toursGrid.innerHTML = tours.map(tour => `
            <div class="tour-card">
                <div class="tour-card-image">
                    <img src="${tour.mainImage || 'https://via.placeholder.com/400x300?text=Egypt+Tour'}" 
                         alt="${currentLanguage === 'ar' ? tour.nameAr : tour.nameEn}"
                         loading="lazy">
                    ${tour.featured ? '<span class="tour-card-badge">مميز</span>' : ''}
                </div>
                <div class="tour-card-content">
                    <h3 class="tour-card-title">
                        ${currentLanguage === 'ar' ? escapeHtml(tour.nameAr) : escapeHtml(tour.nameEn)}
                    </h3>
                    <p class="tour-card-description">
                        ${currentLanguage === 'ar' ? escapeHtml(tour.shortDescriptionAr || tour.descriptionAr?.substring(0, 100)) : escapeHtml(tour.shortDescriptionEn || tour.descriptionEn?.substring(0, 100))}
                    </p>
                    <div class="tour-card-details">
                        <span><i class="fas fa-clock"></i> ${tour.duration}</span>
                        <span><i class="fas fa-users"></i> ${tour.maxPersons || 20} ${currentLanguage === 'ar' ? 'شخص' : 'Persons'}</span>
                    </div>
                    <div class="tour-card-price">
                        <div class="price-egp">
                            <span>${tour.priceEgyptian.toLocaleString()}</span> جنيه
                        </div>
                        <div class="price-usd">
                            ${tour.priceForeign} $
                        </div>
                    </div>
                    <div class="tour-card-actions">
                        <button onclick="window.location.href='/tour-details.html?id=${tour.id}'" class="btn btn-outline">
                            <i class="fas fa-info-circle"></i> ${currentLanguage === 'ar' ? 'تفاصيل' : 'Details'}
                        </button>
                        <button onclick="openBookingModal('${tour.id}')" class="btn btn-primary">
                            <i class="fas fa-calendar-check"></i> ${currentLanguage === 'ar' ? 'احجز' : 'Book'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading tours:', error);
        toursGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>فشل تحميل الرحلات. يرجى المحاولة مرة أخرى.</p>
                <button onclick="loadTours()" class="btn btn-primary mt-3">إعادة المحاولة</button>
            </div>
        `;
    }
}

// ---------- Booking Modal ----------
let currentTourId = null;

function openBookingModal(tourId) {
    currentTourId = tourId;
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentTourId = null;
}

async function submitBooking(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحجز...';
    
    const bookingData = {
        tourId: currentTourId,
        name: document.getElementById('bookingName').value,
        email: document.getElementById('bookingEmail').value,
        phone: document.getElementById('bookingPhone').value,
        nationality: document.getElementById('bookingNationality').value,
        persons: parseInt(document.getElementById('bookingPersons').value),
        date: document.getElementById('bookingDate').value,
        message: document.getElementById('bookingMessage').value || ''
    };
    
    try {
        const response = await api.post('/api/v1/bookings', bookingData);
        
        if (response.success) {
            utils.showToast('تم إرسال طلب الحجز بنجاح! سيتم التواصل معك قريباً.', 'success');
            closeBookingModal();
            form.reset();
            
            // Store booking data for payment
            if (response.booking) {
                utils.storage.set('pendingBooking', response.booking);
            }
        } else {
            utils.showToast(response.error || 'حدث خطأ في الحجز', 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        utils.showToast('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ---------- Mobile Menu Toggle ----------
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking links
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

// ---------- Navbar Scroll Effect ----------
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ---------- Smooth Scroll ----------
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                utils.scrollToElement(href.substring(1));
            }
        });
    });
}

// ---------- Initialize Everything ----------
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initLanguage();
    initMobileMenu();
    initNavbarScroll();
    initSmoothScroll();
    loadTours();
    
    // Close modal on outside click
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeBookingModal();
            }
        });
    }
});

// Export for use in other files
window.api = api;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.submitBooking = submitBooking;