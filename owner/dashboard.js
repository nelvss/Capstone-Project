// Dynamic bookings array - will be populated from API
let bookings = [];

let ownerStatusFilter = 'all';

// API Configuration
const API_URL = (window.API_URL && window.API_URL.length > 0)
  ? window.API_URL
  : 'https://api.otgpuertogaleratravel.com';

// Load bookings from API
async function loadBookings() {
  try {
    console.log('📊 Loading bookings from API...');
    
    const response = await fetch(`${API_URL}/api/bookings`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load bookings');
    }
    
    // Transform API data to match the expected format
    bookings = result.bookings.map(booking => {
      // Debug: Log van rental data for this booking
      if (booking.van_rental_bookings && booking.van_rental_bookings.length > 0) {
        console.log(`🚐 Booking ${booking.booking_id} has van rental data:`, booking.van_rental_bookings);
      } else {
        console.log(`⚠️ Booking ${booking.booking_id} has no van rental data. van_rental_bookings:`, booking.van_rental_bookings);
      }
      
      // Format vehicle information
      let vehicleInfo = 'N/A';
      if (booking.vehicle_bookings && booking.vehicle_bookings.length > 0) {
        const vehicleNames = booking.vehicle_bookings.map(vb => {
          if (vb.vehicle) {
            return `${vb.vehicle.name} (${vb.rental_days} day${vb.rental_days > 1 ? 's' : ''})`;
          } else {
            return `${vb.vehicle_name} (${vb.rental_days} day${vb.rental_days > 1 ? 's' : ''})`;
          }
        });
        vehicleInfo = vehicleNames.join(', ');
      }
      
      // Format van rental information
      let vanRentalInfo = 'N/A';
      if (booking.van_rental_bookings && booking.van_rental_bookings.length > 0) {
        const vanRentalDetails = booking.van_rental_bookings.map(vrb => {
          // Extract location type from choose_destination (e.g., "Within Puerto Galera" -> "Within")
          let locationType = 'Unknown';
          if (vrb.choose_destination) {
            if (vrb.choose_destination.includes('Within')) {
              locationType = 'Within';
            } else if (vrb.choose_destination.includes('Outside')) {
              locationType = 'Outside';
            } else {
              locationType = vrb.choose_destination;
            }
          }
          const tripType = vrb.trip_type === 'roundtrip' ? 'Round Trip' : 'One Way';
          return `${locationType} - ${tripType}`;
        });
        vanRentalInfo = vanRentalDetails.join(', ');
      }
      
      // Format price from total_booking_amount, default to ₱0 if no payment exists
      const totalAmount = booking.total_booking_amount || 0;
      const formattedPrice = totalAmount > 0 ? `₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0';
      
      // Determine hotel display value
      let hotelDisplay = 'No Hotel Selected';
      if (booking.booking_type === 'tour_only') {
        hotelDisplay = 'N/A';
      } else if (booking.hotels?.name) {
        hotelDisplay = booking.hotels.name;
      }
      
      return {
        id: booking.booking_id,
        name: `${booking.customer_first_name} ${booking.customer_last_name}`,
        services: booking.booking_preferences || 'N/A',
        rental: vehicleInfo,
        vanRental: vanRentalInfo,
        arrival: booking.arrival_date,
        departure: booking.departure_date,
        hotel: hotelDisplay,
        price: formattedPrice,
        contact: booking.customer_contact,
        email: booking.customer_email,
        status: booking.status
      };
    });
    
    console.log('✅ Bookings loaded successfully:', bookings.length, 'bookings');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading bookings:', error);
    
    // Fallback to empty array or show error message
    bookings = [];
    
    // Show error message to user
    const errorMessage = document.createElement('div');
    errorMessage.className = 'alert alert-danger';
    errorMessage.innerHTML = `
      <i class="fas fa-exclamation-triangle me-2"></i>
      Failed to load bookings: ${error.message}
    `;
    
    const container = document.querySelector('.container-fluid');
    if (container) {
      container.insertBefore(errorMessage, container.firstChild);
    }
    
    return false;
  }
}

// Function to send email via API
async function sendEmail(action, booking) {
  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        booking: booking
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      message: 'Failed to connect to email server. Please ensure the server is running.' 
    };
  }
}

// Handle confirm button click
async function handleConfirm(booking, button) {
  // Disable button and show loading state
  button.disabled = true;
  button.textContent = 'Sending...';
  
  try {
    // Update booking status in database
    const statusResponse = await fetch(`${API_URL}/api/bookings/${booking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    
    const statusResult = await statusResponse.json();
    
    if (!statusResult.success) {
      throw new Error(statusResult.message || 'Failed to update booking status');
    }
    
    // Send confirmation email
    const result = await sendEmail('confirm', booking);
    
    if (result.success) {
      console.log(`Confirmation email sent successfully to ${booking.email}`);
      button.textContent = '✓ Confirmed';
      button.style.backgroundColor = '#10b981';
      booking.status = 'confirmed';
      renderTable();
    } else {
      console.warn(`Failed to send confirmation email: ${result.message}`);
      button.disabled = false;
      button.textContent = 'Confirm';
    }
  } catch (error) {
    console.error('Error confirming booking:', error);
    button.disabled = false;
    button.textContent = 'Confirm';
    alert('Failed to confirm booking: ' + error.message);
  }
}

// Handle cancel button click
async function handleCancel(booking, button) {
  // Disable button and show loading state
  button.disabled = true;
  button.textContent = 'Sending...';
  
  try {
    // Update booking status in database
    const statusResponse = await fetch(`${API_URL}/api/bookings/${booking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    
    const statusResult = await statusResponse.json();
    
    if (!statusResult.success) {
      throw new Error(statusResult.message || 'Failed to update booking status');
    }
    
    // Send cancellation email
    const result = await sendEmail('cancel', booking);
    
    if (result.success) {
      console.log(`Cancellation email sent successfully to ${booking.email}`);
      button.textContent = '✓ Cancelled';
      button.style.backgroundColor = '#ef4444';
      booking.status = 'cancelled';
      renderTable();
    } else {
      console.warn(`Failed to send cancellation email: ${result.message}`);
      button.disabled = false;
      button.textContent = 'Cancel';
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    button.disabled = false;
    button.textContent = 'Cancel';
    alert('Failed to cancel booking: ' + error.message);
  }
}

// Handle reschedule button click
async function handleReschedule(booking, button) {
  // Disable button and show loading state
  button.disabled = true;
  button.textContent = 'Sending...';
  
  try {
    // Update booking status in database
    const statusResponse = await fetch(`${API_URL}/api/bookings/${booking.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'rescheduled' })
    });
    
    const statusResult = await statusResponse.json();
    
    if (!statusResult.success) {
      throw new Error(statusResult.message || 'Failed to update booking status');
    }
    
    // Send reschedule email
    const result = await sendEmail('reschedule', booking);
    
    if (result.success) {
      console.log(`Reschedule email sent successfully to ${booking.email}`);
      button.textContent = '✓ Rescheduled';
      button.style.backgroundColor = '#3b82f6';
      booking.status = 'rescheduled';
      renderTable();
    } else {
      console.warn(`Failed to send reschedule email: ${result.message}`);
      button.disabled = false;
      button.textContent = 'Reschedule';
    }
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    button.disabled = false;
    button.textContent = 'Reschedule';
    alert('Failed to reschedule booking: ' + error.message);
  }
}

function renderTable() {
  const tbody = document.getElementById('booking-table-body');
  if (!tbody) return; // Not on dashboard page
  tbody.innerHTML = '';
  const rows = bookings.filter(b => ownerStatusFilter === 'all' ? (b.status === 'pending') : (b.status === ownerStatusFilter));
  rows.forEach(b => {
    const tr = document.createElement('tr');
    const actions = ownerStatusFilter === 'all' 
      ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-confirm" data-action="confirm">Confirm</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
          <button class="action-btn btn-reschedule" data-action="reschedule">Reschedule</button>
        </div>
      </td>`
      : ownerStatusFilter === 'cancelled' ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <span class="action-badge cancelled">Cancelled</span>
      </td>` : ownerStatusFilter === 'rescheduled' ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
        </div>
      </td>` : `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-reschedule" data-action="reschedule">Reschedule</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
        </div>
      </td>`;
    tr.innerHTML = actions;
    
    // Add event listeners to buttons
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const rescheduleBtn = tr.querySelector('.btn-reschedule');
    
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (rescheduleBtn) rescheduleBtn.addEventListener('click', () => handleReschedule(b, rescheduleBtn));
    
    tbody.appendChild(tr);
  });
  updateOwnerStats();
}

function ownerFilterChange() {
  const sel = document.getElementById('owner-status-filter');
  ownerStatusFilter = sel ? sel.value : 'all';
  renderTable();
}

function updateOwnerStats() {
  const totals = bookings.reduce((acc, b) => {
    acc.total += 1;
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, { total: 0, pending: 0, confirmed: 0, cancelled: 0, rescheduled: 0 });

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
  set('owner-total-bookings', totals.total);
  set('owner-pending-bookings', totals.pending);
  set('owner-confirmed-bookings', totals.confirmed + totals.rescheduled);
  set('owner-cancelled-bookings', totals.cancelled);
}

// Search functionality
function filterTable(searchTerm) {
  const tbody = document.getElementById('booking-table-body');
  if (!tbody) return; // Not on dashboard page
  tbody.innerHTML = '';
  
  const filteredBookings = bookings.filter(b => {
    const searchLower = searchTerm.toLowerCase();
    return (
      b.id.toLowerCase().includes(searchLower) ||
      b.name.toLowerCase().includes(searchLower) ||
      b.services.toLowerCase().includes(searchLower) ||
      b.rental.toLowerCase().includes(searchLower) ||
      b.vanRental.toLowerCase().includes(searchLower) ||
      b.arrival.toLowerCase().includes(searchLower) ||
      b.departure.toLowerCase().includes(searchLower) ||
      b.hotel.toLowerCase().includes(searchLower) ||
      b.price.toLowerCase().includes(searchLower) ||
      b.contact.toLowerCase().includes(searchLower) ||
      b.email.toLowerCase().includes(searchLower)
    );
  });
  
  filteredBookings.forEach(b => {
    const tr = document.createElement('tr');
    const actions = ownerStatusFilter === 'all'
      ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-confirm" data-action="confirm">Confirm</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
          <button class="action-btn btn-reschedule" data-action="reschedule">Reschedule</button>
        </div>
      </td>`
      : ownerStatusFilter === 'cancelled' ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <span class="action-badge cancelled">Cancelled</span>
      </td>` : ownerStatusFilter === 'rescheduled' ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
        </div>
      </td>` : `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-reschedule" data-action="reschedule">Reschedule</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
        </div>
      </td>`;
    tr.innerHTML = actions;
    
    // Add event listeners to buttons
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const rescheduleBtn = tr.querySelector('.btn-reschedule');
    
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (rescheduleBtn) rescheduleBtn.addEventListener('click', () => handleReschedule(b, rescheduleBtn));
    
    tbody.appendChild(tr);
  });
  
  // Show message if no results found
  if (filteredBookings.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="12" style="text-align: center; padding: 20px; color: #64748b;">No bookings found matching "${searchTerm}"</td>`;
    tbody.appendChild(tr);
  }
}

// Session checking
function checkSession() {
  const userSession = localStorage.getItem('userSession');
  
  if (!userSession) {
    // No session found, redirect to login
    window.location.href = 'login.html';
    return false;
  }
  
  try {
    const session = JSON.parse(userSession);
    
    // Check if user is owner
    if (session.type !== 'owner') {
      alert('Access denied. Owner access required.');
      window.location.href = 'login.html';
      return false;
    }
    
    // Update welcome message if element exists
    const welcomeElement = document.querySelector('.user-welcome');
    if (welcomeElement) {
      welcomeElement.textContent = `Welcome, ${session.username}`;
    }
    
    return true;
  } catch (error) {
    // Invalid session data
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
    return false;
  }
}

// Loading screen functionality
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('fade-out');
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    // Remove the loading screen from DOM after animation completes
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  // Only initialize on dashboard where table exists
  const dashboardTable = document.getElementById('booking-table-body');
  if (!dashboardTable) {
    return; // Skip initialization on non-dashboard pages
  }

  // Show loading screen immediately
  showLoadingScreen();
  
  // Check session before loading dashboard
  if (checkSession()) {
    try {
      // Load bookings from API
      const bookingsLoaded = await loadBookings();
      
      if (bookingsLoaded) {
        renderTable();
        updateOwnerStats();
        
        // Add search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            if (searchTerm === '') {
              renderTable(); // Show all bookings if search is empty
            } else {
              filterTable(searchTerm);
            }
          });
        }
      }
      
      // Hide loading screen after everything is loaded
      setTimeout(() => {
        hideLoadingScreen();
      }, 500);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      hideLoadingScreen();
    }
  } else {
    // If no session, hide loading screen immediately
    setTimeout(() => {
      hideLoadingScreen();
    }, 1000);
  }
});

// Sidebar toggle functionality
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
}

// Smooth page navigation with transition
function navigateWithTransition(url) {
  // Add transition class to body
  document.body.classList.add('page-transition');
  
  // Wait for transition to complete before navigating
  setTimeout(() => {
    window.location.href = url;
  }, 300); // Match the CSS transition duration
}

// Logout functionality
function handleLogout() {
  // Clear stored session data
  localStorage.removeItem('userSession');
  // Redirect to login page
  window.location.href = 'login.html';
}
