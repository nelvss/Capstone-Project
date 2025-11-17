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
        ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
        <button class="btn btn-outline-primary btn-sm ms-2" onclick="openRescheduleModal('${booking.booking_id}')">
          <i class="fas fa-calendar-alt me-1"></i>Reschedule
        </button>
        ` : ''}
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
          <strong>Name:</strong> ${booking.hotels.name || 'N/A'}
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

// Open reschedule modal
async function openRescheduleModal(bookingId) {
  try {
    // Fetch current booking details
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
    
    // Set booking ID
    document.getElementById('rescheduleBookingId').value = bookingId;
    
    // Pre-fill current dates
    const arrivalDate = booking.arrival_date ? new Date(booking.arrival_date).toISOString().split('T')[0] : '';
    const departureDate = booking.departure_date ? new Date(booking.departure_date).toISOString().split('T')[0] : '';
    
    document.getElementById('rescheduleArrivalDate').value = arrivalDate;
    document.getElementById('rescheduleDepartureDate').value = departureDate;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rescheduleArrivalDate').setAttribute('min', today);
    document.getElementById('rescheduleDepartureDate').setAttribute('min', today);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('rescheduleModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error opening reschedule modal:', error);
    alert(`Failed to load booking details: ${error.message}`);
  }
}

// Submit reschedule request
async function submitRescheduleRequest() {
  const bookingId = document.getElementById('rescheduleBookingId').value;
  const newArrivalDate = document.getElementById('rescheduleArrivalDate').value;
  const newDepartureDate = document.getElementById('rescheduleDepartureDate').value;
  
  // Validation
  if (!bookingId || !newArrivalDate || !newDepartureDate) {
    alert('Please fill in all fields');
    return;
  }
  
  // Validate dates
  const arrival = new Date(newArrivalDate);
  const departure = new Date(newDepartureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (arrival < today) {
    alert('Arrival date cannot be in the past');
    return;
  }
  
  if (departure <= arrival) {
    alert('Departure date must be after arrival date');
    return;
  }
  
  // Get current booking to preserve other fields
  try {
    const getResponse = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!getResponse.ok) {
      throw new Error('Failed to fetch booking details');
    }
    
    const getResult = await getResponse.json();
    if (!getResult.success || !getResult.booking) {
      throw new Error('Booking not found');
    }
    
    const booking = getResult.booking;
    
    // Transform vehicle_bookings to vehicles format
    const vehicles = (booking.vehicle_bookings || []).map(vb => ({
      vehicle_id: vb.vehicle_id,
      vehicle_name: vb.vehicle_name || '',
      rental_days: vb.rental_days || 0,
      total_amount: vb.total_amount || 0
    }));
    
    // Transform van_rental_bookings to van_rentals format
    const van_rentals = (booking.van_rental_bookings || []).map(vrb => ({
      van_destination_id: vrb.van_destination_id || '',
      choose_destination: vrb.choose_destination || vrb.location_type || '',
      trip_type: vrb.trip_type || 'oneway',
      number_of_days: vrb.number_of_days || 0,
      total_amount: vrb.total_amount || 0
    }));
    
    // Transform diving_bookings to diving format
    const diving = (booking.diving_bookings || []).map(db => ({
      number_of_divers: db.number_of_divers || 0,
      total_amount: db.total_amount || 0
    }));
    
    // Prepare update payload
    const updatePayload = {
      customer_first_name: booking.customer_first_name,
      customer_last_name: booking.customer_last_name,
      customer_email: booking.customer_email,
      customer_contact: booking.customer_contact,
      arrival_date: newArrivalDate,
      departure_date: newDepartureDate,
      booking_type: booking.booking_type,
      booking_preferences: booking.booking_preferences || '',
      number_of_tourist: booking.number_of_tourist,
      status: booking.status, // Keep original status
      reschedule_requested: true,
      reschedule_requested_at: new Date().toISOString()
    };
    
    // Add optional fields if they exist
    if (booking.hotel_id) updatePayload.hotel_id = booking.hotel_id;
    if (booking.package_only_id) updatePayload.package_only_id = booking.package_only_id;
    
    // Preserve vehicles, van_rentals, diving, total_booking_amount, and receipt_image_url
    if (vehicles.length > 0) updatePayload.vehicles = vehicles;
    if (van_rentals.length > 0) updatePayload.van_rentals = van_rentals;
    if (diving.length > 0) updatePayload.diving = diving;
    if (booking.total_booking_amount !== null && booking.total_booking_amount !== undefined) {
      updatePayload.total_booking_amount = booking.total_booking_amount;
    }
    if (booking.receipt_image_url !== null && booking.receipt_image_url !== undefined && booking.receipt_image_url !== '') {
      updatePayload.receipt_image_url = booking.receipt_image_url;
    }
    
    // Disable submit button
    const submitBtn = document.querySelector('#rescheduleModal .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Submitting...';
    
    // Send update request
    const updateResponse = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
      mode: 'cors'
    });
    
    if (!updateResponse.ok) {
      const errorResult = await updateResponse.json();
      throw new Error(errorResult.message || 'Failed to submit reschedule request');
    }
    
    const updateResult = await updateResponse.json();
    
    if (!updateResult.success) {
      throw new Error(updateResult.message || 'Failed to submit reschedule request');
    }
    
    // Success - close modal and reload bookings
    const modal = bootstrap.Modal.getInstance(document.getElementById('rescheduleModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('rescheduleForm').reset();
    
    // Show success message
    alert('Reschedule request submitted successfully! The admin will review your request and notify you once it\'s confirmed.');
    
    // Reload bookings to show updated status
    await loadUserBookings();
    
  } catch (error) {
    console.error('Error submitting reschedule request:', error);
    alert(`Failed to submit reschedule request: ${error.message}`);
    
    // Re-enable submit button
    const submitBtn = document.querySelector('#rescheduleModal .btn-primary');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Submit Request';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadUserBookings();
  initializeSocket();
});

