/* ========================================
   UTILS.JS - Helper Functions
   ======================================== */

// ---------- Security ----------
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeInput(str) {
    if (!str) return '';
    return str.trim().replace(/[<>{}]/g, '');
}

// ---------- Date Formatting ----------
function formatDate(dateString, locale = 'ar-EG') {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString, locale = 'ar-EG') {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 30) return formatDate(dateString);
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return 'الآن';
}

// ---------- Slug Generation ----------
function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\u0600-\u06FF]+/g, '-')  // Replace spaces and Arabic chars
        .replace(/[^\w\-]+/g, '')              // Remove non-word chars
        .replace(/\-\-+/g, '-')                // Replace multiple dashes
        .replace(/^-+/, '')                    // Trim dashes from start
        .replace(/-+$/, '');                   // Trim dashes from end
}

// ---------- Price Formatting ----------
function formatPrice(amount, currency = 'EGP') {
    if (currency === 'EGP') {
        return `${amount.toLocaleString('ar-EG')} جنيه`;
    }
    return `${amount.toLocaleString('en-US')} $`;
}

// ---------- Local Storage Helpers ----------
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        localStorage.removeItem(key);
    },
    
    clear() {
        localStorage.clear();
    }
};

// ---------- Toast Notifications ----------
let toastTimeout = null;

function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
        if (toastTimeout) clearTimeout(toastTimeout);
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 3 seconds
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---------- Loading States ----------
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    }
}

function hideLoading(containerId) {
    // Will be implemented by caller
}

// ---------- Debounce ----------
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ---------- Copy to Clipboard ----------
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('تم النسخ!', 'success');
        return true;
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('فشل النسخ', 'error');
        return false;
    }
}

// ---------- Validate Email ----------
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ---------- Validate Phone (Egypt) ----------
function isValidEgyptianPhone(phone) {
    const re = /^(01)[0125][0-9]{8}$/;
    return re.test(phone);
}

// ---------- Get Query Parameters ----------
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ---------- Scroll to Element ----------
function scrollToElement(elementId, offset = 80) {
    const element = document.getElementById(elementId);
    if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// ---------- Detect Mobile ----------
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ---------- Export for use ----------
window.utils = {
    escapeHtml,
    sanitizeInput,
    formatDate,
    formatDateTime,
    getRelativeTime,
    generateSlug,
    formatPrice,
    storage,
    showToast,
    showLoading,
    hideLoading,
    debounce,
    copyToClipboard,
    isValidEmail,
    isValidEgyptianPhone,
    getQueryParam,
    scrollToElement,
    isMobile
};