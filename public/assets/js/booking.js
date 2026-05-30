/* ========================================
   BOOKING.JS - Booking System Logic
   ======================================== */

// ---------- Booking State ----------
let bookingState = {
    currentTour: null,
    selectedTourId: null,
    priceCalculation: null
};

// ---------- Open Booking Modal ----------
async function openBookingModal(tourId) {
    bookingState.selectedTourId = tourId;
    
    try {
        // Fetch tour details for pricing
        const tour = await api.get(`/api/v1/tours/${tourId}`);
        bookingState.currentTour = tour;
        
        // Show modal
        const modal = document.getElementById('bookingModal');
        if (modal) {
            // Update modal with tour info
            const tourNameEl = document.getElementById('modalTourName');
            if (tourNameEl) {
                const currentLang = localStorage.getItem('language') || 'ar';
                tourNameEl.textContent = currentLang === 'ar' ? tour.nameAr : tour.nameEn;
            }
            
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading tour for booking:', error);
        utils.showToast('فشل تحميل بيانات الرحلة', 'error');
    }
}

// ---------- Close Booking Modal ----------
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('active');
    }
    bookingState.selectedTourId = null;
    bookingState.currentTour = null;
    bookingState.priceCalculation = null;
    
    // Reset form
    const form = document.getElementById('bookingForm');
    if (form) form.reset();
    
    // Reset price display
    const priceDisplay = document.getElementById('calculatedPrice');
    if (priceDisplay) priceDisplay.textContent = '';
}

// ---------- Calculate Price (Server-side for security) ----------
async function calculatePrice() {
    const nationality = document.getElementById('bookingNationality')?.value;
    const persons = parseInt(document.getElementById('bookingPersons')?.value) || 1;
    
    if (!nationality || !bookingState.currentTour) return;
    
    try {
        const response = await api.post('/api/v1/bookings/calculate', {
            tourId: bookingState.selectedTourId,
            nationality: nationality,
            persons: persons
        });
        
        bookingState.priceCalculation = response;
        
        // Update price display
        const priceDisplay = document.getElementById('calculatedPrice');
        if (priceDisplay) {
            const currency = response.currency === 'EGP' ? 'جنيه' : '$';
            priceDisplay.innerHTML = `
                <div class="price-calculation">
                    <div class="price-breakdown">
                        <span>السعر للفرد: ${response.pricePerPerson.toLocaleString()} ${currency}</span>
                        <span>× ${persons} أشخاص</span>
                    </div>
                    <div class="price-total">
                        <strong>الإجمالي: ${response.totalAmount.toLocaleString()} ${currency}</strong>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Price calculation error:', error);
        utils.showToast('فشل حساب السعر', 'error');
    }
}

// ---------- Submit Booking ----------
async function submitBooking(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحجز...';
    
    // Validate form
    const name = document.getElementById('bookingName')?.value.trim();
    const email = document.getElementById('bookingEmail')?.value.trim();
    const phone = document.getElementById('bookingPhone')?.value.trim();
    const nationality = document.getElementById('bookingNationality')?.value;
    const persons = parseInt(document.getElementById('bookingPersons')?.value) || 1;
    const date = document.getElementById('bookingDate')?.value;
    const message = document.getElementById('bookingMessage')?.value || '';
    
    // Validation
    if (!name) {
        utils.showToast('الرجاء إدخال الاسم', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    if (!email || !utils.isValidEmail(email)) {
        utils.showToast('الرجاء إدخال بريد إلكتروني صحيح', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    if (!phone) {
        utils.showToast('الرجاء إدخال رقم الهاتف', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    if (!nationality) {
        utils.showToast('الرجاء اختيار الجنسية', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    if (!date) {
        utils.showToast('الرجاء اختيار تاريخ الرحلة', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
    }
    
    const bookingData = {
        tourId: bookingState.selectedTourId,
        customer: {
            name: name,
            email: email,
            phone: phone,
            nationality: nationality
        },
        details: {
            persons: persons,
            date: date,
            message: message
        }
    };
    
    try {
        const response = await api.post('/api/v1/bookings', bookingData);
        
        if (response.success) {
            utils.showToast('تم إرسال طلب الحجز بنجاح! سيتم التواصل معك قريباً.', 'success');
            
            // Store booking data for payment page
            if (response.booking) {
                utils.storage.set('pendingBooking', {
                    id: response.booking.id,
                    tourName: bookingState.currentTour?.nameAr,
                    customer: bookingData.customer,
                    details: bookingData.details,
                    pricing: response.pricing
                });
            }
            
            closeBookingModal();
            
            // Ask if user wants to proceed to payment
            setTimeout(() => {
                if (confirm('هل تريد المتابعة إلى صفحة الدفع الآن؟')) {
                    window.location.href = '/pay.html';
                }
            }, 500);
        } else {
            utils.showToast(response.error || 'حدث خطأ في الحجز', 'error');
        }
        
    } catch (error) {
        console.error('Booking submission error:', error);
        utils.showToast('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ---------- Get Booking Details for Payment ----------
function getPendingBooking() {
    return utils.storage.get('pendingBooking');
}

function clearPendingBooking() {
    utils.storage.remove('pendingBooking');
}

// ---------- Initialize Booking Form Events ----------
function initBookingForm() {
    const nationalitySelect = document.getElementById('bookingNationality');
    const personsInput = document.getElementById('bookingPersons');
    
    if (nationalitySelect) {
        nationalitySelect.addEventListener('change', calculatePrice);
    }
    
    if (personsInput) {
        personsInput.addEventListener('input', calculatePrice);
    }
    
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', submitBooking);
    }
    
    // Set min date to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
}

// ---------- Load Booking Data on Payment Page ----------
async function loadPaymentPage() {
    const pendingBooking = getPendingBooking();
    
    if (!pendingBooking) {
        window.location.href = '/';
        return;
    }
    
    // Display booking summary
    const summaryContainer = document.getElementById('bookingSummary');
    if (summaryContainer) {
        const currentLang = localStorage.getItem('language') || 'ar';
        
        summaryContainer.innerHTML = `
            <div class="booking-summary-card">
                <h3><i class="fas fa-receipt"></i> ملخص الحجز</h3>
                <div class="summary-details">
                    <div class="summary-row">
                        <span>الرحلة:</span>
                        <strong>${utils.escapeHtml(pendingBooking.tourName)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>الاسم:</span>
                        <strong>${utils.escapeHtml(pendingBooking.customer.name)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>البريد الإلكتروني:</span>
                        <strong>${utils.escapeHtml(pendingBooking.customer.email)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>رقم الهاتف:</span>
                        <strong>${utils.escapeHtml(pendingBooking.customer.phone)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>الجنسية:</span>
                        <strong>${pendingBooking.customer.nationality === 'egyptian' ? '🇪🇬 مصري' : '🌍 أجنبي'}</strong>
                    </div>
                    <div class="summary-row">
                        <span>عدد الأفراد:</span>
                        <strong>${pendingBooking.details.persons} أشخاص</strong>
                    </div>
                    <div class="summary-row">
                        <span>تاريخ الرحلة:</span>
                        <strong>${pendingBooking.details.date}</strong>
                    </div>
                    <div class="summary-row total-row">
                        <span>المبلغ الإجمالي:</span>
                        <strong class="total-amount">${pendingBooking.pricing.totalAmount.toLocaleString()} ${pendingBooking.pricing.currency === 'EGP' ? 'جنيه' : '$'}</strong>
                    </div>
                </div>
            </div>
        `;
    }
}

// ---------- Confirm Payment ----------
async function confirmPayment() {
    const pendingBooking = getPendingBooking();
    if (!pendingBooking) {
        utils.showToast('لا توجد بيانات حجز', 'error');
        return;
    }
    
    const transferNumber = document.getElementById('transferNumber')?.value;
    if (!transferNumber) {
        utils.showToast('الرجاء إدخال رقم التحويل', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const originalText = confirmBtn?.innerHTML;
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التأكيد...';
    }
    
    try {
        const response = await api.post('/api/v1/bookings/confirm-payment', {
            bookingId: pendingBooking.id,
            transferNumber: transferNumber
        });
        
        if (response.success) {
            utils.showToast('تم تأكيد الدفع بنجاح! سيصلك تأكيد عبر البريد الإلكتروني.', 'success');
            clearPendingBooking();
            
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            utils.showToast(response.error || 'فشل تأكيد الدفع', 'error');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalText;
            }
        }
    } catch (error) {
        console.error('Payment confirmation error:', error);
        utils.showToast('حدث خطأ في تأكيد الدفع', 'error');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalText;
        }
    }
}

// ---------- Export ----------
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.submitBooking = submitBooking;
window.calculatePrice = calculatePrice;
window.confirmPayment = confirmPayment;
window.loadPaymentPage = loadPaymentPage;

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initBookingForm();
    
    // Check if on payment page
    if (window.location.pathname.includes('pay.html')) {
        loadPaymentPage();
    }
});