/* ========================================
   DASHBOARD.JS - Admin Dashboard Logic
   ======================================== */

// ---------- Authentication Check ----------
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    return token;
}

// ---------- Dashboard State ----------
let dashboardState = {
    tours: [],
    bookings: [],
    ratings: [],
    contacts: [],
    currentTab: 'overview',
    editingTour: null
};

// ---------- Load Dashboard Data ----------
async function loadDashboardData() {
    const token = checkAdminAuth();
    if (!token) return;
    
    try {
        // Load all data in parallel
        const [tours, bookings, ratings, contacts] = await Promise.all([
            api.get('/api/v1/tours', true),
            api.get('/api/v1/bookings', true),
            api.get('/api/v1/ratings', true),
            api.get('/api/v1/contacts', true)
        ]);
        
        dashboardState.tours = tours || [];
        dashboardState.bookings = bookings || [];
        dashboardState.ratings = ratings || [];
        dashboardState.contacts = contacts || [];
        
        updateDashboardStats();
        
        // Render current tab
        renderCurrentTab();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        utils.showToast('فشل تحميل البيانات', 'error');
    }
}

// ---------- Update Statistics ----------
function updateDashboardStats() {
    const today = new Date().toDateString();
    const todayBookings = dashboardState.bookings.filter(b => 
        new Date(b.createdAt).toDateString() === today
    ).length;
    
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthBookings = dashboardState.bookings.filter(b => {
        const d = new Date(b.createdAt);
        return d.getMonth() === month && d.getFullYear() === year;
    }).length;
    
    const totalRevenue = dashboardState.bookings
        .filter(b => b.payment?.status === 'confirmed')
        .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    
    const avgRating = dashboardState.ratings.length 
        ? (dashboardState.ratings.reduce((s, r) => s + r.rating, 0) / dashboardState.ratings.length).toFixed(1)
        : 0;
    
    // Update DOM
    const statsElements = {
        totalTours: dashboardState.tours.length,
        totalBookings: dashboardState.bookings.length,
        todayBookings: todayBookings,
        monthBookings: monthBookings,
        totalRevenue: totalRevenue,
        avgRating: avgRating,
        totalRatings: dashboardState.ratings.length,
        unreadContacts: dashboardState.contacts.filter(c => c.status === 'unread').length
    };
    
    for (const [key, value] of Object.entries(statsElements)) {
        const el = document.getElementById(`stat-${key}`);
        if (el) {
            if (key === 'totalRevenue') {
                el.textContent = `${value.toLocaleString()} جنيه`;
            } else {
                el.textContent = value;
            }
        }
    }
}

// ---------- Tab Navigation ----------
function initDashboardTabs() {
    const navLinks = document.querySelectorAll('.dashboard-nav-link');
    const tabPanes = document.querySelectorAll('.dashboard-tab-pane');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            tabPanes.forEach(pane => pane.classList.remove('active'));
            const activePane = document.getElementById(`tab-${tabId}`);
            if (activePane) activePane.classList.add('active');
            
            dashboardState.currentTab = tabId;
            renderCurrentTab();
        });
    });
}

function renderCurrentTab() {
    switch (dashboardState.currentTab) {
        case 'tours':
            renderToursTable();
            break;
        case 'bookings':
            renderBookingsTable();
            break;
        case 'ratings':
            renderRatingsTable();
            break;
        case 'contacts':
            renderContactsTable();
            break;
        case 'overview':
        default:
            renderOverview();
            break;
    }
}

// ---------- Overview Tab ----------
function renderOverview() {
    const container = document.getElementById('tab-overview');
    if (!container) return;
    
    // Recent bookings
    const recentBookings = dashboardState.bookings.slice(0, 5);
    const recentRatings = dashboardState.ratings.slice(0, 5);
    
    container.innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h2><i class="fas fa-clock"></i> أحدث الحجوزات</h2>
                <button onclick="switchToTab('bookings')" class="btn btn-outline btn-sm">عرض الكل</button>
            </div>
            <div class="dashboard-table-container">
                <table class="dashboard-table">
                    <thead>
                        <tr><th>العميل</th><th>الرحلة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${recentBookings.length ? recentBookings.map(b => `
                            <tr>
                                <td>${utils.escapeHtml(b.customer?.name || '-')}</td>
                                <td>${utils.escapeHtml(b.tourName || '-')}</td>
                                <td>${b.pricing?.totalAmount || 0} ${b.pricing?.currency === 'EGP' ? 'جنيه' : '$'}</td>
                                <td><span class="status-badge status-${b.payment?.status || 'pending'}">${getStatusText(b.payment?.status)}</span></td>
                                <td>${utils.formatDate(b.createdAt)}</td>
                                <td><button class="action-btn action-btn-view" onclick="viewBooking('${b.id}')"><i class="fas fa-eye"></i></button></td>
                            </tr>
                        `).join('') : '<tr><td colspan="6" class="text-center">لا توجد حجوزات</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h2><i class="fas fa-star"></i> أحدث التقييمات</h2>
                <button onclick="switchToTab('ratings')" class="btn btn-outline btn-sm">عرض الكل</button>
            </div>
            <div class="dashboard-table-container">
                <table class="dashboard-table">
                    <thead><tr><th>العميل</th><th>الدولة</th><th>التقييم</th><th>الرسالة</th><th>التاريخ</th><th></th></tr></thead>
                    <tbody>
                        ${recentRatings.length ? recentRatings.map(r => `
                            <tr>
                                <td>${utils.escapeHtml(r.name)}</td>
                                <td>${utils.escapeHtml(r.country)}</td>
                                <td>${generateStars(r.rating)}</td>
                                <td><small>${utils.escapeHtml(r.message?.substring(0, 50))}${r.message?.length > 50 ? '...' : ''}</small></td>
                                <td>${utils.formatDate(r.createdAt)}</td>
                                <td><button class="action-btn action-btn-delete" onclick="deleteRating('${r.id}')"><i class="fas fa-trash"></i></button></td>
                            </tr>
                        `).join('') : '<tr><td colspan="6" class="text-center">لا توجد تقييمات</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ---------- Tours Management ----------
function renderToursTable() {
    const container = document.getElementById('tab-tours');
    if (!container) return;
    
    container.innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h2><i class="fas fa-map-marked-alt"></i> إدارة الرحلات</h2>
                <button onclick="showAddTourModal()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> إضافة رحلة جديدة
                </button>
            </div>
            <div class="dashboard-table-container">
                <table class="dashboard-table">
                    <thead>
                        <tr><th>الصورة</th><th>الاسم (عربي)</th><th>الاسم (إنجليزي)</th><th>السعر (مصري)</th><th>السعر (أجنبي)</th><th>المدة</th><th>الحالة</th><th>الإجراءات</th></tr>
                    </thead>
                    <tbody id="tours-table-body">
                        ${dashboardState.tours.map(tour => `
                            <tr>
                                <td><img src="${tour.mainImage || '/assets/images/default-tour.jpg'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
                                <td>${utils.escapeHtml(tour.nameAr)}</td>
                                <td>${utils.escapeHtml(tour.nameEn)}</td>
                                <td>${tour.priceEgyptian.toLocaleString()} جنيه</td>
                                <td>${tour.priceForeign} $</td>
                                <td>${tour.duration || '-'}</td>
                                <td>${tour.isActive ? '<span class="status-badge status-confirmed">نشط</span>' : '<span class="status-badge status-pending">غير نشط</span>'}</td>
                                <td>
                                    <button class="action-btn action-btn-edit" onclick="editTour('${tour.id}')"><i class="fas fa-edit"></i></button>
                                    <button class="action-btn action-btn-delete" onclick="deleteTour('${tour.id}')"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAddTourModal() {
    dashboardState.editingTour = null;
    document.getElementById('tourModalTitle').textContent = 'إضافة رحلة جديدة';
    document.getElementById('tourForm').reset();
    document.getElementById('tourModal').classList.add('active');
}

function editTour(tourId) {
    const tour = dashboardState.tours.find(t => t.id === tourId);
    if (!tour) return;
    
    dashboardState.editingTour = tour;
    document.getElementById('tourModalTitle').textContent = 'تعديل الرحلة';
    
    // Populate form
    const fields = ['id', 'nameAr', 'nameEn', 'slug', 'shortDescriptionAr', 'shortDescriptionEn', 
                    'descriptionAr', 'descriptionEn', 'duration', 'priceEgyptian', 'priceForeign', 
                    'maxPersons', 'startLocation', 'pickupTime', 'mainImage', 'isActive', 'featured'];
    
    fields.forEach(field => {
        const el = document.getElementById(`tour_${field}`);
        if (el) el.value = tour[field] !== undefined ? tour[field] : '';
    });
    
    // Populate arrays
    if (tour.itineraryAr) populateArrayField('itineraryAr', tour.itineraryAr);
    if (tour.itineraryEn) populateArrayField('itineraryEn', tour.itineraryEn);
    if (tour.includedAr) populateArrayField('includedAr', tour.includedAr);
    if (tour.includedEn) populateArrayField('includedEn', tour.includedEn);
    if (tour.excludedAr) populateArrayField('excludedAr', tour.excludedAr);
    if (tour.excludedEn) populateArrayField('excludedEn', tour.excludedEn);
    if (tour.galleryImages) populateGallery(tour.galleryImages);
    
    document.getElementById('tourModal').classList.add('active');
}

async function saveTour(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    
    const tourData = {
        nameAr: document.getElementById('tour_nameAr').value,
        nameEn: document.getElementById('tour_nameEn').value,
        slug: utils.generateSlug(document.getElementById('tour_nameEn').value),
        shortDescriptionAr: document.getElementById('tour_shortDescriptionAr').value,
        shortDescriptionEn: document.getElementById('tour_shortDescriptionEn').value,
        descriptionAr: document.getElementById('tour_descriptionAr').value,
        descriptionEn: document.getElementById('tour_descriptionEn').value,
        duration: document.getElementById('tour_duration').value,
        priceEgyptian: parseInt(document.getElementById('tour_priceEgyptian').value),
        priceForeign: parseInt(document.getElementById('tour_priceForeign').value),
        maxPersons: parseInt(document.getElementById('tour_maxPersons').value) || 20,
        startLocation: document.getElementById('tour_startLocation').value,
        pickupTime: document.getElementById('tour_pickupTime').value,
        mainImage: document.getElementById('tour_mainImage').value,
        isActive: document.getElementById('tour_isActive')?.checked || true,
        featured: document.getElementById('tour_featured')?.checked || false,
        itineraryAr: getArrayFieldValues('itineraryAr'),
        itineraryEn: getArrayFieldValues('itineraryEn'),
        includedAr: getArrayFieldValues('includedAr'),
        includedEn: getArrayFieldValues('includedEn'),
        excludedAr: getArrayFieldValues('excludedAr'),
        excludedEn: getArrayFieldValues('excludedEn'),
        galleryImages: getGalleryImages()
    };
    
    try {
        let result;
        if (dashboardState.editingTour) {
            result = await api.put(`/api/v1/tours/${dashboardState.editingTour.id}`, tourData, true);
            utils.showToast('تم تحديث الرحلة بنجاح', 'success');
        } else {
            result = await api.post('/api/v1/tours', tourData, true);
            utils.showToast('تم إضافة الرحلة بنجاح', 'success');
        }
        
        closeTourModal();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Save tour error:', error);
        utils.showToast('فشل حفظ الرحلة', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function deleteTour(tourId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرحلة؟')) return;
    
    try {
        await api.delete(`/api/v1/tours/${tourId}`, true);
        utils.showToast('تم حذف الرحلة بنجاح', 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Delete tour error:', error);
        utils.showToast('فشل حذف الرحلة', 'error');
    }
}

// ---------- Bookings Management ----------
function renderBookingsTable() {
    const container = document.getElementById('tab-bookings');
    if (!container) return;
    
    container.innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h2><i class="fas fa-calendar-check"></i> إدارة الحجوزات</h2>
                <div class="search-bar" style="width: 300px;">
                    <input type="text" id="searchBookings" placeholder="بحث بالاسم أو البريد...">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            <div class="dashboard-table-container">
                <table class="dashboard-table">
                    <thead>
                        <tr><th>العميل</th><th>الرحلة</th><th>عدد الأفراد</th><th>المبلغ</th><th>الحالة</th><th>تاريخ الحجز</th><th>الإجراءات</th></tr>
                    </thead>
                    <tbody id="bookings-table-body">
                        ${dashboardState.bookings.map(booking => `
                            <tr>
                                <td>
                                    <strong>${utils.escapeHtml(booking.customer?.name)}</strong><br>
                                    <small>${utils.escapeHtml(booking.customer?.email)}</small>
                                </td>
                                <td>${utils.escapeHtml(booking.tourName)}</td>
                                <td>${booking.details?.persons || 1}</td>
                                <td>${booking.pricing?.totalAmount || 0} ${booking.pricing?.currency === 'EGP' ? 'جنيه' : '$'}</td>
                                <td><span class="status-badge status-${booking.payment?.status || 'pending'}">${getStatusText(booking.payment?.status)}</span></td>
                                <td>${utils.formatDate(booking.createdAt)}</td>
                                <td>
                                    <button class="action-btn action-btn-view" onclick="viewBooking('${booking.id}')"><i class="fas fa-eye"></i></button>
                                    <button class="action-btn action-btn-edit" onclick="updateBookingStatus('${booking.id}', 'confirmed')"><i class="fas fa-check-circle"></i></button>
                                    <button class="action-btn action-btn-delete" onclick="deleteBooking('${booking.id}')"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Add search functionality
    document.getElementById('searchBookings')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = dashboardState.bookings.filter(b => 
            b.customer?.name?.toLowerCase().includes(term) || 
            b.customer?.email?.toLowerCase().includes(term)
        );
        renderFilteredBookings(filtered);
    });
}

function renderFilteredBookings(bookings) {
    const tbody = document.getElementById('bookings-table-body');
    if (tbody) {
        tbody.innerHTML = bookings.map(booking => `
            <tr>
                <td><strong>${utils.escapeHtml(booking.customer?.name)}</strong><br><small>${utils.escapeHtml(booking.customer?.email)}</small></td>
                <td>${utils.escapeHtml(booking.tourName)}</td>
                <td>${booking.details?.persons || 1}</td>
                <td>${booking.pricing?.totalAmount || 0} ${booking.pricing?.currency === 'EGP' ? 'جنيه' : '$'}</td>
                <td><span class="status-badge status-${booking.payment?.status || 'pending'}">${getStatusText(booking.payment?.status)}</span></td>
                <td>${utils.formatDate(booking.createdAt)}</td>
                <td>
                    <button class="action-btn action-btn-view" onclick="viewBooking('${booking.id}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn action-btn-edit" onclick="updateBookingStatus('${booking.id}', 'confirmed')"><i class="fas fa-check-circle"></i></button>
                    <button class="action-btn action-btn-delete" onclick="deleteBooking('${booking.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
}

async function updateBookingStatus(bookingId, status) {
    try {
        await api.put(`/api/v1/bookings/${bookingId}`, { paymentStatus: status }, true);
        utils.showToast(`تم تحديث حالة الحجز إلى ${getStatusText(status)}`, 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Update status error:', error);
        utils.showToast('فشل تحديث الحالة', 'error');
    }
}

async function deleteBooking(bookingId) {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return;
    
    try {
        await api.delete(`/api/v1/bookings/${bookingId}`, true);
        utils.showToast('تم حذف الحجز بنجاح', 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Delete booking error:', error);
        utils.showToast('فشل حذف الحجز', 'error');
    }
}

function viewBooking(bookingId) {
    const booking = dashboardState.bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const modalContent = `
        <div class="modal-header">
            <h3>تفاصيل الحجز</h3>
            <span class="modal-close" onclick="closeModal()">&times;</span>
        </div>
        <div class="modal-body">
            <div class="booking-details">
                <h4>معلومات العميل</h4>
                <p><strong>الاسم:</strong> ${utils.escapeHtml(booking.customer?.name)}</p>
                <p><strong>البريد:</strong> ${utils.escapeHtml(booking.customer?.email)}</p>
                <p><strong>الهاتف:</strong> ${utils.escapeHtml(booking.customer?.phone)}</p>
                <p><strong>الجنسية:</strong> ${booking.customer?.nationality === 'egyptian' ? 'مصري' : 'أجنبي'}</p>
                
                <h4>معلومات الرحلة</h4>
                <p><strong>الرحلة:</strong> ${utils.escapeHtml(booking.tourName)}</p>
                <p><strong>عدد الأفراد:</strong> ${booking.details?.persons}</p>
                <p><strong>التاريخ:</strong> ${booking.details?.date}</p>
                
                <h4>معلومات الدفع</h4>
                <p><strong>المبلغ:</strong> ${booking.pricing?.totalAmount} ${booking.pricing?.currency === 'EGP' ? 'جنيه' : '$'}</p>
                <p><strong>طريقة الدفع:</strong> ${booking.payment?.method || 'Orange Cash'}</p>
                <p><strong>رقم التحويل:</strong> ${booking.payment?.transferNumber || '-'}</p>
                <p><strong>الحالة:</strong> <span class="status-badge status-${booking.payment?.status || 'pending'}">${getStatusText(booking.payment?.status)}</span></p>
                
                ${booking.details?.message ? `<h4>ملاحظات</h4><p>${utils.escapeHtml(booking.details.message)}</p>` : ''}
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="closeModal()" class="btn btn-outline">إغلاق</button>
            ${booking.payment?.status !== 'confirmed' ? `<button onclick="updateBookingStatus('${booking.id}', 'confirmed'); closeModal();" class="btn btn-primary">تأكيد الحجز</button>` : ''}
        </div>
    `;
    
    showModal(modalContent);
}

// ---------- Ratings Management ----------
function renderRatingsTable() {
    const container = document.getElementById('tab-ratings');
    if (!container) return;
    
    container.innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h2><i class="fas fa-star"></i> إدارة التقييمات</h2>
            </div>
            <div class="dashboard-table-container">
                <table class="dashboard-table">
                    <thead>
                        <tr><th>العميل</th><th>الدولة</th><th>التقييم</th><th>الرسالة</th><th>التاريخ</th><th>الإجراءات</th></tr>
                    </thead>
                    <tbody>
                        ${dashboardState.ratings.map(rating => `
                            <tr>
                                <td>${utils.escapeHtml(rating.name)}</strong><br><small>${utils.escapeHtml(rating.email || '')}</small></td>
                                <td>${utils.escapeHtml(rating.country)}</strong></td>
                                <td>${generateStars(rating.rating)} (${rating.rating}/5)</strong></td>
                                <td><small>${utils.escapeHtml(rating.message?.substring(0, 100))}${rating.message?.length > 100 ? '...' : ''}</small></strong></td>
                                <td>${utils.formatDate(rating.createdAt)}</strong></td>
                                <td><button class="action-btn action-btn-delete" onclick="deleteRating('${rating.id}')"><i class="fas fa-trash"></i></button></strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function deleteRating(ratingId) {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    
    try {
        await api.delete(`/api/v1/ratings/${ratingId}`, true);
        utils.showToast('تم حذف التقييم بنجاح', 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Delete rating error:', error);
        utils.showToast('فشل حذف التقييم', 'error');
    }
}

// ---------- Contacts Management ----------
function renderContactsTable() {
    const container = document.getElementById('tab-contacts');
    if (!container) return;
    
    container.innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h2><i class="fas fa-envelope"></i> رسائل العملاء</h2>
            </div>
            <div class="dashboard-table-container">
                <table class="dashboard-table">
                    <thead>
                        <tr><th>المرسل</th><th>البريد</th><th>الموضوع</th><th>الرسالة</th><th>التاريخ</th><th>الحالة</th><th>الإجراءات</th></tr>
                    </thead>
                    <tbody>
                        ${dashboardState.contacts.map(contact => `
                            <tr>
                                <td>${utils.escapeHtml(contact.name)}</strong></td>
                                <td>${utils.escapeHtml(contact.email)}</strong></td>
                                <td>${utils.escapeHtml(contact.subject || 'بدون موضوع')}</strong></td>
                                <td><small>${utils.escapeHtml(contact.message?.substring(0, 80))}${contact.message?.length > 80 ? '...' : ''}</small></strong></td>
                                <td>${utils.formatDate(contact.createdAt)}</strong></td>
                                <td>${contact.status === 'unread' ? '<span class="status-badge status-pending">غير مقروء</span>' : '<span class="status-badge status-confirmed">مقروء</span>'}</strong></td>
                                <td>
                                    <button class="action-btn action-btn-view" onclick="viewContact('${contact.id}')"><i class="fas fa-eye"></i></button>
                                    <button class="action-btn action-btn-delete" onclick="deleteContact('${contact.id}')"><i class="fas fa-trash"></i></button>
                                 </strong></td>
                            主业
                        `).join('')}
                    </tbody>
                没有人
            </div>
        </div>
    `;
}

function viewContact(contactId) {
    const contact = dashboardState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const modalContent = `
        <div class="modal-header">
            <h3>رسالة من ${utils.escapeHtml(contact.name)}</h3>
            <span class="modal-close" onclick="closeModal()">&times;</span>
        </div>
        <div class="modal-body">
            <p><strong>الاسم:</strong> ${utils.escapeHtml(contact.name)}</p>
            <p><strong>البريد:</strong> ${utils.escapeHtml(contact.email)}</p>
            ${contact.phone ? `<p><strong>الهاتف:</strong> ${utils.escapeHtml(contact.phone)}</p>` : ''}
            <p><strong>الموضوع:</strong> ${utils.escapeHtml(contact.subject || 'بدون موضوع')}</p>
            <p><strong>التاريخ:</strong> ${utils.formatDateTime(contact.createdAt)}</p>
            <hr>
            <p><strong>الرسالة:</strong></p>
            <div style="background: var(--gray-100); padding: 1rem; border-radius: 8px; white-space: pre-wrap;">
                ${utils.escapeHtml(contact.message)}
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="markContactRead('${contact.id}')" class="btn btn-primary">تحديد كمقروء</button>
            <button onclick="replyToContact('${contact.email}')" class="btn btn-outline">رد</button>
            <button onclick="closeModal()" class="btn btn-outline">إغلاق</button>
        </div>
    `;
    
    showModal(modalContent);
    
    // Mark as read if not already
    if (contact.status === 'unread') {
        markContactRead(contactId);
    }
}

async function markContactRead(contactId) {
    try {
        await api.put(`/api/v1/contacts/${contactId}`, { status: 'read' }, true);
        await loadDashboardData();
    } catch (error) {
        console.error('Mark read error:', error);
    }
}

async function deleteContact(contactId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    try {
        await api.delete(`/api/v1/contacts/${contactId}`, true);
        utils.showToast('تم حذف الرسالة بنجاح', 'success');
        await loadDashboardData();
    } catch (error) {
        console.error('Delete contact error:', error);
        utils.showToast('فشل حذف الرسالة', 'error');
    }
}

function replyToContact(email) {
    closeModal();
    switchToTab('messages');
    document.getElementById('email_to').value = email;
    document.getElementById('email_subject').focus();
}

// ---------- Helper Functions ----------
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '<i class="fas fa-star" style="color: #D4AF37;"></i>' : '<i class="far fa-star" style="color: #D4AF37;"></i>';
    }
    return stars;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'confirmed': 'مؤكد',
        'cancelled': 'ملغي',
        'unread': 'غير مقروء',
        'read': 'مقروء'
    };
    return statusMap[status] || status;
}

function switchToTab(tabId) {
    const navLink = document.querySelector(`.dashboard-nav-link[data-tab="${tabId}"]`);
    if (navLink) navLink.click();
}

function showModal(content) {
    let modal = document.getElementById('dynamicModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicModal';
        modal.className = 'modal';
        modal.innerHTML = '<div class="modal-content dashboard-modal"></div>';
        document.body.appendChild(modal);
    }
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = content;
    modal.classList.add('active');
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function closeModal() {
    const modal = document.getElementById('dynamicModal');
    if (modal) modal.classList.remove('active');
}

function closeTourModal() {
    document.getElementById('tourModal')?.classList.remove('active');
}

// Array field helpers
function populateArrayField(fieldId, values) {
    const container = document.getElementById(`${fieldId}_container`);
    if (!container || !values) return;
    
    container.innerHTML = '';
    values.forEach(value => {
        addArrayFieldItem(fieldId, value);
    });
}

function addArrayFieldItem(fieldId, value = '') {
    const container = document.getElementById(`${fieldId}_container`);
    if (!container) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'array-item';
    itemDiv.innerHTML = `
        <input type="text" class="form-input" value="${utils.escapeHtml(value)}" placeholder="أدخل نص">
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(itemDiv);
}

function getArrayFieldValues(fieldId) {
    const container = document.getElementById(`${fieldId}_container`);
    if (!container) return [];
    
    const inputs = container.querySelectorAll('input');
    return Array.from(inputs).map(input => input.value).filter(v => v.trim());
}

function populateGallery(images) {
    const container = document.getElementById('gallery_container');
    if (!container) return;
    
    container.innerHTML = '';
    images.forEach(image => {
        addGalleryImage(image);
    });
}

function addGalleryImage(imageUrl = '') {
    const container = document.getElementById('gallery_container');
    if (!container) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'image-preview-item';
    itemDiv.innerHTML = `
        <img src="${imageUrl}" alt="Gallery image">
        <span class="remove-image" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </span>
        <input type="hidden" value="${imageUrl}">
    `;
    container.appendChild(itemDiv);
}

function getGalleryImages() {
    const container = document.getElementById('gallery_container');
    if (!container) return [];
    
    const hiddenInputs = container.querySelectorAll('input[type="hidden"]');
    return Array.from(hiddenInputs).map(input => input.value).filter(v => v);
}

// ---------- Logout ----------
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
}

// ---------- Initialize Dashboard ----------
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAuth()) return;
    
    initDashboardTabs();
    loadDashboardData();
    
    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.querySelector('.dashboard-sidebar').classList.toggle('open');
        });
    }
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeTourModal();
        }
    });
});

// Export functions for global use
window.switchToTab = switchToTab;
window.showAddTourModal = showAddTourModal;
window.editTour = editTour;
window.saveTour = saveTour;
window.deleteTour = deleteTour;
window.viewBooking = viewBooking;
window.updateBookingStatus = updateBookingStatus;
window.deleteBooking = deleteBooking;
window.deleteRating = deleteRating;
window.viewContact = viewContact;
window.deleteContact = deleteContact;
window.replyToContact = replyToContact;
window.closeTourModal = closeTourModal;
window.closeModal = closeModal;
window.logout = logout;
window.addArrayFieldItem = addArrayFieldItem;
window.addGalleryImage = addGalleryImage;