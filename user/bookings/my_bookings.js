// my_bookings.js
// Handles fetching and displaying user bookings

// API Base URL resolution
function getApiBaseUrl() {
  const apiBaseFromMeta = document.querySelector('meta[name="api-base"]')?.getAttribute('content')?.trim();
  if (apiBaseFromMeta && apiBaseFromMeta.length > 0) {
    return apiBaseFromMeta;
  }
  return 'https://api.otgpuertogaleratravel.com/api';
}

const API_BASE_URL = getApiBaseUrl();

// In-memory cache of the user's current bookings
let currentBookings = [];

// Derive Socket.IO base URL from API base (strip trailing /api if present)
function getSocketBaseUrl() {
  try {
    const url = new URL(API_BASE_URL);
    // If path ends with /api, remove it so we connect to the root origin
    if (url.pathname.endsWith('/api')) {
      url.pathname = url.pathname.replace(/\/api$/, '');
    }
    return url.origin + url.pathname;
  } catch (error) {
    console.error('Error deriving Socket.IO base URL, falling back to window.location.origin:', error);
    return window.location.origin;
  }
}

let socket = null;

// Check authentication
function checkAuthentication() {
  const userSession = localStorage.getItem('userSession');
  if (!userSession) {
    return null;
  }
  
  try {
    const session = JSON.parse(userSession);
    if (session.type && session.email && session.userId) {
      return session;
    }
  } catch (error) {
    console.error('Error parsing user session:', error);
    localStorage.removeItem('userSession');
  }
  
  return null;
}

// Format currency
function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '₱—';
  }
  return `₱${number.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

// Get status badge HTML
function getStatusBadge(status) {
  const statusLower = (status || '').toLowerCase();
  let badgeClass = 'bg-secondary';
  let icon = 'fa-circle';
  
  switch (statusLower) {
    case 'confirmed':
      badgeClass = 'bg-success';
      icon = 'fa-check-circle';
      break;
    case 'pending':
      badgeClass = 'bg-warning';
      icon = 'fa-clock';
      break;
    case 'cancelled':
      badgeClass = 'bg-danger';
      icon = 'fa-times-circle';
      break;
    case 'completed':
      badgeClass = 'bg-info';
      icon = 'fa-check-circle';
      break;
    default:
      badgeClass = 'bg-secondary';
      icon = 'fa-circle';
  }
  
  return `<span class="badge ${badgeClass} px-3 py-2">
    <i class="fas ${icon} me-1"></i>${status || 'Unknown'}
  </span>`;
}

// Load user bookings
async function loadUserBookings() {
  const session = checkAuthentication();
  
  if (!session) {
    // Redirect to login
    window.location.href = '/owner/login.html';
    return;
  }
  
  const email = session.email;
  
  // Show loading state
  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('bookingsContainer').style.display = 'none';
  
  try {
    const response = await fetch(`${API_BASE_URL}/user/bookings?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load bookings');
    }
    
    const bookings = result.bookings || [];
    // Cache the current list of bookings in memory for quick updates
    currentBookings = bookings;
    
    // Hide loading state
    document.getElementById('loadingState').style.display = 'none';
    
    if (bookings.length === 0) {
      // Show empty state
      document.getElementById('emptyState').style.display = 'block';
      return;
    }
    
    // Display bookings
    displayBookings(bookings);
    document.getElementById('bookingsContainer').style.display = 'flex';
    
  } catch (error) {
    console.error('Error loading bookings:', error);
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = `Failed to load bookings: ${error.message}`;
  }
}

// Display bookings
function displayBookings(bookings) {
  const container = document.getElementById('bookingsContainer');
  container.innerHTML = '';
  
  bookings.forEach(booking => {
    const bookingCard = createBookingCard(booking);
    container.appendChild(bookingCard);
  });
}

// Create booking card
function createBookingCard(booking) {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4';
  if (booking.booking_id) {
    col.setAttribute('data-booking-id', booking.booking_id);
  }
  
  // Get booking services summary
  const services = [];
  if (booking.booking_type === 'package_only' && booking.hotels) {
    services.push(`Hotel: ${booking.hotels.name || 'N/A'}`);
  }
  if (booking.vehicle_bookings && booking.vehicle_bookings.length > 0) {
    services.push(`Vehicle Rental (${booking.vehicle_bookings.length})`);
  }
  if (booking.van_rental_bookings && booking.van_rental_bookings.length > 0) {
    services.push(`Van Rental (${booking.van_rental_bookings.length})`);
  }
  if (booking.diving_bookings && booking.diving_bookings.length > 0) {
    services.push(`Diving (${booking.diving_bookings.length})`);
  }
  if (booking.booking_type === 'tour_only') {
    services.push('Tour Only');
  }
  
  const servicesText = services.length > 0 ? services.join(', ') : 'Package booking';
  
  col.innerHTML = `
    <div class="booking-card">
      <div class="booking-card-header">
        <div class="booking-id">
          <i class="fas fa-hashtag me-2"></i>
          <strong>${booking.booking_id || 'N/A'}</strong>
        </div>
        ${getStatusBadge(booking.status)}
      </div>
      <div class="booking-card-body">
        <!-- User Profile Section -->
        <div class="booking-user-profile">
          <div class="user-avatar-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="user-info-section">
            <div class="user-info-text user-name">${booking.customer_first_name || ''} ${booking.customer_last_name || ''}</div>
            <div class="user-info-text user-email"><i class="fas fa-envelope"></i> ${booking.customer_email || 'N/A'}</div>
            <div class="user-info-text user-contact"><i class="fas fa-phone"></i> ${booking.customer_contact || 'N/A'}</div>
          </div>
        </div>
        
        <!-- Booking Details Section -->
        <div class="booking-details-section">
          <div class="booking-info-item">
            <i class="fas fa-calendar-check me-2 text-danger"></i>
            <span>${formatDate(booking.arrival_date)}</span>
          </div>
          <div class="booking-info-item">
            <i class="fas fa-calendar-times me-2 text-danger"></i>
            <span>${formatDate(booking.departure_date)}</span>
          </div>
          <div class="booking-info-item">
            <i class="fas fa-users me-2 text-danger"></i>
            <span>${booking.number_of_tourist || 0} Tourist(s)</span>
          </div>
          <div class="booking-info-item">
            <i class="fas fa-tag me-2 text-danger"></i>
            <span>${servicesText}</span>
          </div>
          ${booking.total_booking_amount ? `
            <div class="booking-info-item booking-total">
              <i class="fas fa-peso-sign me-2 text-danger"></i>
              <strong>Total: ${formatCurrency(booking.total_booking_amount)}</strong>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="booking-card-footer">
        <button class="btn btn-outline-danger btn-sm" onclick="showBookingDetails('${booking.booking_id}')">
          <i class="fas fa-eye me-1"></i>View Details
        </button>
      </div>
    </div>
  `;
  
  return col;
}

// Show booking details
async function showBookingDetails(bookingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.booking) {
      throw new Error(result.message || 'Booking not found');
    }
    
    const booking = result.booking;
    const modalBody = document.getElementById('bookingDetailsBody');
    
    let detailsHTML = `
      <div class="booking-details">
        <div class="row mb-3">
          <div class="col-6">
            <strong>Booking ID:</strong><br>
            ${booking.booking_id || 'N/A'}
          </div>
          <div class="col-6">
            <strong>Status:</strong><br>
            ${getStatusBadge(booking.status)}
          </div>
        </div>
        
        <hr>
        
        <h6 class="mb-3"><i class="fas fa-user me-2"></i>Customer Information</h6>
        <div class="row mb-3">
          <div class="col-6">
            <strong>Name:</strong><br>
            ${booking.customer_first_name || ''} ${booking.customer_last_name || ''}
          </div>
          <div class="col-6">
            <strong>Email:</strong><br>
            ${booking.customer_email || 'N/A'}
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-6">
            <strong>Contact:</strong><br>
            ${booking.customer_contact || 'N/A'}
          </div>
          <div class="col-6">
            <strong>Tourists:</strong><br>
            ${booking.number_of_tourist || 0}
          </div>
        </div>
        
        <hr>
        
        <h6 class="mb-3"><i class="fas fa-calendar me-2"></i>Booking Dates</h6>
        <div class="row mb-3">
          <div class="col-6">
            <strong>Arrival:</strong><br>
            ${formatDate(booking.arrival_date)}
          </div>
          <div class="col-6">
            <strong>Departure:</strong><br>
            ${formatDate(booking.departure_date)}
          </div>
        </div>
        
        <hr>
        
        <h6 class="mb-3"><i class="fas fa-info-circle me-2"></i>Booking Details</h6>
        <div class="mb-3">
          <strong>Type:</strong> ${booking.booking_type || 'N/A'}<br>
          <strong>Preferences:</strong> ${booking.booking_preferences || 'N/A'}
        </div>
    `;
    
    // Hotel information
    if (booking.hotels) {
      detailsHTML += `
        <hr>
        <h6 class="mb-3"><i class="fas fa-hotel me-2"></i>Hotel</h6>
        <div class="mb-3">
          <strong>Name:</strong> ${booking.hotels.name || 'N/A'}<br>
          <strong>Nights:</strong> ${booking.hotel_nights || 0}
        </div>
      `;
    }
    
    // Vehicle bookings
    if (booking.vehicle_bookings && booking.vehicle_bookings.length > 0) {
      detailsHTML += `
        <hr>
        <h6 class="mb-3"><i class="fas fa-car me-2"></i>Vehicle Rentals</h6>
        <ul class="list-group mb-3">
      `;
      booking.vehicle_bookings.forEach(vb => {
        detailsHTML += `
          <li class="list-group-item">
            <strong>${vb.vehicle_name || 'N/A'}</strong><br>
            Days: ${vb.rental_days || 0} | Amount: ${formatCurrency(vb.total_amount || 0)}
          </li>
        `;
      });
      detailsHTML += `</ul>`;
    }
    
    // Van rental bookings
    if (booking.van_rental_bookings && booking.van_rental_bookings.length > 0) {
      detailsHTML += `
        <hr>
        <h6 class="mb-3"><i class="fas fa-bus me-2"></i>Van Rentals</h6>
        <ul class="list-group mb-3">
      `;
      booking.van_rental_bookings.forEach(vrb => {
        detailsHTML += `
          <li class="list-group-item">
            <strong>${vrb.destination?.destination_name || 'N/A'}</strong><br>
            Type: ${vrb.trip_type || 'N/A'} | Days: ${vrb.number_of_days || 0} | Amount: ${formatCurrency(vrb.total_amount || 0)}
          </li>
        `;
      });
      detailsHTML += `</ul>`;
    }
    
    // Diving bookings
    if (booking.diving_bookings && booking.diving_bookings.length > 0) {
      detailsHTML += `
        <hr>
        <h6 class="mb-3"><i class="fas fa-mask-diving me-2"></i>Diving</h6>
        <ul class="list-group mb-3">
      `;
      booking.diving_bookings.forEach(db => {
        detailsHTML += `
          <li class="list-group-item">
            Divers: ${db.number_of_divers || 0} | Amount: ${formatCurrency(db.total_amount || 0)}
          </li>
        `;
      });
      detailsHTML += `</ul>`;
    }
    
    // Total amount
    if (booking.total_booking_amount) {
      detailsHTML += `
        <hr>
        <div class="text-end">
          <h5>Total Amount: ${formatCurrency(booking.total_booking_amount)}</h5>
        </div>
      `;
    }
    
    detailsHTML += `</div>`;
    
    modalBody.innerHTML = detailsHTML;
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error loading booking details:', error);
    alert(`Failed to load booking details: ${error.message}`);
  }
}

// Handle logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userSession');
    window.location.href = '/owner/login.html';
  }
}

// Initialize Socket.IO for real-time booking updates
function initializeSocket() {
  if (typeof io === 'undefined') {
    console.warn('Socket.IO client is not loaded.');
    return;
  }

  const baseUrl = getSocketBaseUrl();

  try {
    socket = io(baseUrl, {
      transports: ['websocket', 'polling']
    });
  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
    return;
  }

  socket.on('connect', () => {
    console.log('🔌 Connected to Socket.IO server for bookings. Socket ID:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from Socket.IO server');
  });

  // Listen for booking status changes (confirmed / cancelled / etc.)
  socket.on('payment-status-changed', (payload) => {
    console.log('📩 Booking status changed event received:', payload);
    if (!payload || !payload.bookingId || !payload.status) {
      // Fallback to full reload if payload is incomplete
      loadUserBookings();
      return;
    }

    // Update status locally without refetching everything
    updateBookingStatusLocally(payload.bookingId, payload.status);
  });

  // Listen for general booking updates (optional: new bookings, edits)
  socket.on('booking-update', (payload) => {
    console.log('📩 Booking update event received:', payload);
    if (payload && payload.booking) {
      // Update / insert this booking into the local list and re-render cards
      upsertBookingLocally(payload.booking);
    } else {
      // Unknown payload shape – safest to reload
      loadUserBookings();
    }
  });
}

// Replace or insert a booking in the in-memory list and re-render cards
function upsertBookingLocally(updatedBooking) {
  if (!updatedBooking || !updatedBooking.booking_id) {
    return;
  }

  const bookingId = String(updatedBooking.booking_id).trim();
  let found = false;

  currentBookings = (currentBookings || []).map((b) => {
    if (String(b.booking_id).trim() === bookingId) {
      found = true;
      return { ...b, ...updatedBooking };
    }
    return b;
  });

  if (!found) {
    currentBookings.push(updatedBooking);
  }

  displayBookings(currentBookings);
}

// Update only the status of a booking in memory and in the DOM
function updateBookingStatusLocally(bookingId, status) {
  if (!bookingId) return;

  const normalizedId = String(bookingId).trim();

  // Update in-memory cache
  currentBookings = (currentBookings || []).map((b) => {
    if (String(b.booking_id).trim() === normalizedId) {
      return { ...b, status };
    }
    return b;
  });

  // Update the DOM badge for this booking, if present
  const cardCol = document.querySelector(`[data-booking-id="${normalizedId}"]`);
  if (!cardCol) {
    // If card is not on screen (e.g. filtered out), skip DOM update
    return;
  }

  const badgeEl = cardCol.querySelector('.booking-card-header .badge');
  if (badgeEl) {
    // Replace the entire badge HTML with the new status badge
    badgeEl.outerHTML = getStatusBadge(status);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadUserBookings();
  initializeSocket();
});

