// Dynamic bookings array - will be populated from API
let bookings = [];
let availableVehicles = []; // Store vehicles for dropdown
let availableVanDestinations = []; // Store van destinations for dropdown
let availableTours = []; // Store tours for dropdown
let availablePackages = []; // Store packages for dropdown
let availableDiving = []; // Store diving options for dropdown

let ownerStatusFilter = 'all';

// API Configuration
const API_URL = (window.API_URL && window.API_URL.length > 0)
  ? window.API_URL
  : 'https://api.otgpuertogaleratravel.com';

// Socket.IO Connection (use window.socket to share with analytics.js)
window.socket = window.socket || null;
function initializeSocketIO() {
  try {
    window.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    window.socket.on('connect', () => {
      console.log('🔌 Connected to server:', window.socket.id);
      showNotification('✅ Real-time updates connected', 'success');
    });

    window.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      showNotification('⚠️ Real-time updates disconnected', 'warning');
    });

    window.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });

    // Listen for booking updates
    window.socket.on('booking-update', async (data) => {
      console.log('📋 New booking update received:', data);
      
      // Check if this is a reschedule request
      const isRescheduleRequest = data.booking?.reschedule_requested || false;
      const notificationMessage = isRescheduleRequest 
        ? '📅 Reschedule request received!' 
        : '🎉 New booking received!';
      
      showNotification(notificationMessage, isRescheduleRequest ? 'info' : 'success');
      
      // Reload bookings to get the latest data
      await loadBookings();
      renderTable();
      updateOwnerStats();
    });

    // Listen for payment status changes
    window.socket.on('payment-status-changed', async (data) => {
      console.log('💳 Payment status changed:', data);
      showNotification('💳 Payment status updated', 'info');
      
      // Reload bookings to reflect payment changes
      await loadBookings();
      renderTable();
      updateOwnerStats();
    });

    // Listen for analytics updates
    window.socket.on('analytics-refresh', () => {
      console.log('📊 Analytics refresh requested');
      showNotification('📊 Analytics data updated', 'info');
    });
  } catch (error) {
    console.error('❌ Socket.IO initialization error:', error);
  }
}

// Notification function
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    font-size: 14px;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

function mapBookingRecord(apiBooking) {
  if (!apiBooking) return null;

  const rawBooking = JSON.parse(JSON.stringify(apiBooking));

  if (apiBooking.van_rental_bookings && apiBooking.van_rental_bookings.length > 0) {
    console.log(`🚐 Booking ${apiBooking.booking_id} has van rental data:`, apiBooking.van_rental_bookings);
  } else {
    console.log(`⚠️ Booking ${apiBooking.booking_id} has no van rental data. van_rental_bookings:`, apiBooking.van_rental_bookings);
  }

  let vehicleInfo = 'N/A';
  if (apiBooking.vehicle_bookings && apiBooking.vehicle_bookings.length > 0) {
    const vehicleNames = apiBooking.vehicle_bookings.map(vb => {
      if (vb.vehicle) {
        return `${vb.vehicle.name} (${vb.rental_days} day${vb.rental_days > 1 ? 's' : ''})`;
      }
      return `${vb.vehicle_name} (${vb.rental_days} day${vb.rental_days > 1 ? 's' : ''})`;
    });
    vehicleInfo = vehicleNames.join(', ');
  }

  let vanRentalInfo = 'N/A';
  if (apiBooking.van_rental_bookings && apiBooking.van_rental_bookings.length > 0) {
    const vanRentalDetails = apiBooking.van_rental_bookings.map(vrb => {
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

  const totalAmount = apiBooking.total_booking_amount || 0;
  const formattedPrice = totalAmount > 0
    ? `₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₱0';

  let divingInfo = 'N/A';
  if (apiBooking.diving_bookings && apiBooking.diving_bookings.length > 0) {
    console.log(`🤿 Booking ${apiBooking.booking_id} has diving data:`, apiBooking.diving_bookings);
    const totalDivers = apiBooking.diving_bookings.reduce((sum, diving) => {
      const divers = parseInt(diving.number_of_divers) || 0;
      console.log(`   - Diving entry: ${divers} divers`);
      return sum + divers;
    }, 0);
    divingInfo = totalDivers > 0 ? String(totalDivers) : 'N/A';
    console.log(`   Total divers for booking ${apiBooking.booking_id}: ${divingInfo}`);
  } else {
    console.log(`⚠️ Booking ${apiBooking.booking_id} has no diving data. diving_bookings:`, apiBooking.diving_bookings);
  }

  let hotelDisplay = 'No Hotel Selected';
  if (apiBooking.booking_type === 'tour_only') {
    hotelDisplay = 'N/A';
  } else if (apiBooking.hotels?.name) {
    hotelDisplay = apiBooking.hotels.name;
  }

  rawBooking.total_booking_amount = totalAmount;
  rawBooking.payment_date = apiBooking.payment_date || null;
  if (!rawBooking.vehicle_bookings) rawBooking.vehicle_bookings = [];
  if (!rawBooking.van_rental_bookings) rawBooking.van_rental_bookings = [];
  if (!rawBooking.diving_bookings) rawBooking.diving_bookings = [];
  if (!rawBooking.booking_preferences) rawBooking.booking_preferences = '';

  return {
    id: apiBooking.booking_id,
    name: `${apiBooking.customer_first_name} ${apiBooking.customer_last_name}`,
    services: apiBooking.booking_preferences || 'N/A',
    rental: vehicleInfo,
    vanRental: vanRentalInfo,
    diving: divingInfo,
    arrival: apiBooking.arrival_date,
    departure: apiBooking.departure_date,
    hotel: hotelDisplay,
    price: formattedPrice,
    contact: apiBooking.customer_contact,
    email: apiBooking.customer_email,
    receipt_image_url: apiBooking.receipt_image_url || null,
    status: apiBooking.status,
    reschedule_requested: apiBooking.reschedule_requested || false,
    reschedule_requested_at: apiBooking.reschedule_requested_at || null,
    payment_method: apiBooking.payment_method || null,
    payment_option: apiBooking.payment_option || null,
    paid_amount: apiBooking.paid_amount || null,
    remaining_balance: apiBooking.remaining_balance || null,
    raw: rawBooking
  };
}

// Load bookings from API
async function loadBookings() {
  try {
    console.log('📊 Loading bookings from API...');
    
    const response = await fetch(`${API_URL}/api/bookings`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load bookings');
    }
    
    bookings = result.bookings.map(mapBookingRecord).filter(Boolean);
    
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

// Load vehicles from API
async function loadVehicles() {
  try {
    console.log('🚗 Loading vehicles from API...');
    
    const response = await fetch(`${API_URL}/api/vehicles`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load vehicles');
    }
    
    availableVehicles = result.vehicles || [];
    
    console.log('✅ Vehicles loaded successfully:', availableVehicles.length, 'vehicles');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading vehicles:', error);
    availableVehicles = [];
    return false;
  }
}

// Load van destinations from API
async function loadVanDestinations() {
  try {
    console.log('🚐 Loading van destinations from API...');
    
    const response = await fetch(`${API_URL}/api/van-destinations`);
    const result = await response.json();
    
    console.log('📥 Van destinations response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load van destinations');
    }
    
    availableVanDestinations = result.destinations || [];
    
    console.log('✅ Van destinations loaded successfully:', availableVanDestinations.length, 'destinations');
    console.log('📋 Destinations data:', availableVanDestinations);
    return true;
    
  } catch (error) {
    console.error('❌ Error loading van destinations:', error);
    availableVanDestinations = [];
    return false;
  }
}

// Load tours from API
async function loadTours() {
  try {
    console.log('🏝️ Loading tours from API...');
    
    const response = await fetch(`${API_URL}/api/tours`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load tours');
    }
    
    availableTours = result.tours || [];
    
    console.log('✅ Tours loaded successfully:', availableTours.length, 'tours');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading tours:', error);
    availableTours = [];
    return false;
  }
}

// Load packages from API
async function loadPackages() {
  try {
    console.log('📦 Loading packages from API...');
    
    const response = await fetch(`${API_URL}/api/package-only?include=pricing`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load packages');
    }
    
    availablePackages = result.packages || [];
    
    console.log('✅ Packages loaded successfully:', availablePackages.length, 'packages');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading packages:', error);
    availablePackages = [];
    return false;
  }
}

// Load diving from API
async function loadDiving() {
  try {
    console.log('🤿 Loading diving options from API...');
    
    const response = await fetch(`${API_URL}/api/diving`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load diving options');
    }
    
    availableDiving = result.diving || [];
    
    console.log('✅ Diving options loaded successfully:', availableDiving.length, 'options');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading diving options:', error);
    availableDiving = [];
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
      if (booking.raw) booking.raw.status = 'confirmed';
      showNotification('✅ Booking confirmed successfully', 'success');
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
      if (booking.raw) booking.raw.status = 'cancelled';
      showNotification('❌ Booking cancelled successfully', 'warning');
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

// Store current booking and button for reschedule confirmation
let currentRescheduleBooking = null;
let currentRescheduleButton = null;

// Handle confirm reschedule button click - show popup first
async function handleConfirmReschedule(booking, button) {
  // Add immediate visual feedback
  let originalButtonHTML = '';
  if (button) {
    originalButtonHTML = button.innerHTML;
    button.classList.add('loading');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  }
  
  // Store booking and button for later use
  currentRescheduleBooking = booking;
  currentRescheduleButton = button;
  
  // Show modal immediately with loading state
  const modal = document.getElementById('rescheduleConfirmationModal');
  const content = document.getElementById('rescheduleModalContent');
  
  if (!modal || !content) {
    // Restore button if modal elements don't exist
    if (button) {
      button.classList.remove('loading');
      button.disabled = false;
      button.innerHTML = originalButtonHTML;
    }
    return;
  }
  
  // Show loading state in modal
  content.innerHTML = `
    <div class="reschedule-modal-loading">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading booking details...</p>
    </div>
  `;
  
  // Show modal immediately
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  
  try {
    // Get current booking details to preserve all fields
    const getResponse = await fetch(`${API_URL}/api/bookings/${booking.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!getResponse.ok) {
      throw new Error('Failed to fetch booking details');
    }
    
    const getResult = await getResponse.json();
    if (!getResult.success || !getResult.booking) {
      throw new Error('Booking not found');
    }
    
    const currentBooking = getResult.booking;
    
    // Populate modal with booking data
    showRescheduleConfirmationModal(currentBooking);
    
  } catch (error) {
    console.error('Error fetching booking details:', error);
    
    // Show error in modal
    content.innerHTML = `
      <div class="alert alert-danger" style="margin: 20px;">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error:</strong> ${error.message}
      </div>
    `;
  } finally {
    // Restore button state
    if (button) {
      button.classList.remove('loading');
      button.disabled = false;
      button.innerHTML = originalButtonHTML;
    }
  }
}

// Show reschedule confirmation modal with date comparison
function showRescheduleConfirmationModal(booking) {
  const modal = document.getElementById('rescheduleConfirmationModal');
  const content = document.getElementById('rescheduleModalContent');
  
  if (!modal || !content) return;
  
  // Get original and new dates
  const originalArrival = booking.original_arrival_date || booking.arrival_date;
  const originalDeparture = booking.original_departure_date || booking.departure_date;
  const newArrival = booking.arrival_date;
  const newDeparture = booking.departure_date;
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Build modal content
  content.innerHTML = `
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; margin-bottom: 15px; color: #1f2937;">Date Comparison</h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <h4 style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; font-weight: 600;">Original Dates</h4>
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="margin-bottom: 10px;">
              <strong style="color: #6b7280; font-size: 12px;">Arrival:</strong>
              <div style="color: #1f2937; font-size: 16px; margin-top: 4px;">${formatDate(originalArrival)}</div>
            </div>
            <div>
              <strong style="color: #6b7280; font-size: 12px;">Departure:</strong>
              <div style="color: #1f2937; font-size: 16px; margin-top: 4px;">${formatDate(originalDeparture)}</div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; font-weight: 600;">New Requested Dates</h4>
          <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="margin-bottom: 10px;">
              <strong style="color: #6b7280; font-size: 12px;">Arrival:</strong>
              <div style="color: #1f2937; font-size: 16px; margin-top: 4px;">${formatDate(newArrival)}</div>
            </div>
            <div>
              <strong style="color: #6b7280; font-size: 12px;">Departure:</strong>
              <div style="color: #1f2937; font-size: 16px; margin-top: 4px;">${formatDate(newDeparture)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Show modal
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

// Close reschedule confirmation modal
function closeRescheduleConfirmationModal() {
  const modal = document.getElementById('rescheduleConfirmationModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  currentRescheduleBooking = null;
  currentRescheduleButton = null;
}

// Process final reschedule confirmation
async function processRescheduleConfirmation() {
  if (!currentRescheduleBooking || !currentRescheduleButton) {
    console.error('No booking or button stored for reschedule confirmation');
    return;
  }
  
  const booking = currentRescheduleBooking;
  const button = currentRescheduleButton;
  
  // Disable button and show loading state
  const confirmBtn = document.getElementById('finalConfirmRescheduleBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';
  }
  
  try {
    // Get current booking details to preserve all fields
    const getResponse = await fetch(`${API_URL}/api/bookings/${booking.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!getResponse.ok) {
      throw new Error('Failed to fetch booking details');
    }
    
    const getResult = await getResponse.json();
    if (!getResult.success || !getResult.booking) {
      throw new Error('Booking not found');
    }
    
    const currentBooking = getResult.booking;
    
    // Transform vehicle_bookings to vehicles format
    const vehicles = (currentBooking.vehicle_bookings || []).map(vb => ({
      vehicle_id: vb.vehicle_id,
      vehicle_name: vb.vehicle_name || '',
      rental_days: vb.rental_days || 0,
      total_amount: vb.total_amount || 0
    }));
    
    // Transform van_rental_bookings to van_rentals format
    const van_rentals = (currentBooking.van_rental_bookings || []).map(vrb => ({
      van_destination_id: vrb.van_destination_id || '',
      choose_destination: vrb.choose_destination || vrb.location_type || '',
      trip_type: vrb.trip_type || 'oneway',
      number_of_days: vrb.number_of_days || 0,
      total_amount: vrb.total_amount || 0
    }));
    
    // Transform diving_bookings to diving format
    const diving = (currentBooking.diving_bookings || []).map(db => ({
      number_of_divers: db.number_of_divers || 0,
      total_amount: db.total_amount || 0
    }));
    
    // Prepare update payload - clear reschedule flags and keep new dates
    const updatePayload = {
      customer_first_name: currentBooking.customer_first_name,
      customer_last_name: currentBooking.customer_last_name,
      customer_email: currentBooking.customer_email,
      customer_contact: currentBooking.customer_contact,
      arrival_date: currentBooking.arrival_date, // Keep the new dates
      departure_date: currentBooking.departure_date, // Keep the new dates
      booking_type: currentBooking.booking_type,
      booking_preferences: currentBooking.booking_preferences || '',
      number_of_tourist: currentBooking.number_of_tourist,
      status: 'confirmed', // Update status to confirmed
      reschedule_requested: false, // Clear reschedule flag
      reschedule_requested_at: null // Clear reschedule timestamp
    };
    
    // Add optional fields if they exist
    if (currentBooking.hotel_id) updatePayload.hotel_id = currentBooking.hotel_id;
    if (currentBooking.package_only_id) updatePayload.package_only_id = currentBooking.package_only_id;
    
    // Preserve vehicles, van_rentals, diving, total_booking_amount, and receipt_image_url
    if (vehicles.length > 0) updatePayload.vehicles = vehicles;
    if (van_rentals.length > 0) updatePayload.van_rentals = van_rentals;
    if (diving.length > 0) updatePayload.diving = diving;
    if (currentBooking.total_booking_amount !== null && currentBooking.total_booking_amount !== undefined) {
      updatePayload.total_booking_amount = currentBooking.total_booking_amount;
    }
    if (currentBooking.receipt_image_url !== null && currentBooking.receipt_image_url !== undefined && currentBooking.receipt_image_url !== '') {
      updatePayload.receipt_image_url = currentBooking.receipt_image_url;
    }
    
    // Update booking to clear reschedule flags
    const updateResponse = await fetch(`${API_URL}/api/bookings/${booking.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload)
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResult.success) {
      throw new Error(updateResult.message || 'Failed to confirm reschedule');
    }
    
    // Prepare booking data for email (with new dates)
    const emailBooking = {
      booking_id: booking.id,
      customer_first_name: currentBooking.customer_first_name,
      customer_last_name: currentBooking.customer_last_name,
      email: booking.email,
      customer_email: booking.email,
      arrival_date: currentBooking.arrival_date,
      departure_date: currentBooking.departure_date,
      number_of_tourist: currentBooking.number_of_tourist,
      booking_type: currentBooking.booking_type,
      booking_preferences: currentBooking.booking_preferences || '',
      total_booking_amount: currentBooking.total_booking_amount || 0
    };
    
    // Automatically send reschedule confirmation email
    const emailResult = await sendEmail('reschedule', emailBooking);
    
    if (emailResult.success) {
      console.log(`Reschedule confirmation email sent successfully to ${booking.email}`);
      button.textContent = '✓ Confirmed';
      button.style.backgroundColor = '#10b981';
      booking.reschedule_requested = false;
      booking.status = 'confirmed';
      if (booking.raw) {
        booking.raw.reschedule_requested = false;
        booking.raw.reschedule_requested_at = null;
        booking.raw.status = 'confirmed';
      }
      showNotification('✅ Reschedule confirmed and email sent successfully', 'success');
      renderTable();
      closeRescheduleConfirmationModal();
    } else {
      console.warn(`Failed to send reschedule confirmation email: ${emailResult.message}`);
      // Still update the UI since the reschedule was confirmed in the database
      booking.reschedule_requested = false;
      booking.status = 'confirmed';
      if (booking.raw) {
        booking.raw.reschedule_requested = false;
        booking.raw.reschedule_requested_at = null;
        booking.raw.status = 'confirmed';
      }
      showNotification('⚠️ Reschedule confirmed but email failed to send', 'warning');
      renderTable();
      closeRescheduleConfirmationModal();
    }
  } catch (error) {
    console.error('Error confirming reschedule:', error);
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Reschedule';
    }
    alert('Failed to confirm reschedule: ' + error.message);
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  const rescheduleModal = document.getElementById('rescheduleConfirmationModal');
  if (rescheduleModal && rescheduleModal.classList.contains('open') && event.target === rescheduleModal) {
    closeRescheduleConfirmationModal();
  }
});

// Booking edit modal functions removed

// Helper function to generate receipt cell HTML
function getReceiptCell(receiptImageUrl) {
  if (receiptImageUrl) {
    // Escape the URL for safe HTML insertion
    const escapedUrl = receiptImageUrl.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    return `<td>
      <img src="${escapedUrl}" alt="Receipt" class="receipt-thumbnail" data-receipt-url="${escapedUrl}" style="width: 50px; height: 50px; object-fit: cover; cursor: pointer; border-radius: 4px; border: 1px solid #ddd;">
    </td>`;
  } else {
    return `<td style="text-align: center; color: #999;">No Receipt</td>`;
  }
}

// Receipt modal functions
function openReceiptModal(booking) {
  const modal = document.getElementById('receiptModal');
  const modalImage = document.getElementById('modalReceiptImage');
  const receiptNoImage = document.getElementById('receiptNoImage');
  
  if (!modal) return;
  
  // Get payment information
  const paymentOption = booking.payment_option || 'N/A';
  const paymentMethod = booking.payment_method || 'N/A';
  const paidAmount = booking.paid_amount || 0;
  const remainingBalance = booking.remaining_balance || 0;
  const imageUrl = booking.receipt_image_url;
  
  // Set payment option
  const paymentOptionEl = document.getElementById('receiptPaymentOption');
  if (paymentOptionEl) {
    if (paymentOption === 'Full Payment' || paymentOption === 'full') {
      paymentOptionEl.textContent = 'Full Payment';
      paymentOptionEl.style.color = '#10b981';
    } else if (paymentOption === 'Down Payment' || paymentOption === 'Partial Payment' || paymentOption === 'down') {
      paymentOptionEl.textContent = 'Down Payment';
      paymentOptionEl.style.color = '#f59e0b';
    } else {
      paymentOptionEl.textContent = paymentOption;
    }
  }
  
  // Set payment method with icon
  const paymentMethodIconEl = document.getElementById('receiptPaymentMethodIcon');
  const paymentMethodTextEl = document.getElementById('receiptPaymentMethodText');
  
  if (paymentMethodIconEl && paymentMethodTextEl) {
    // Clear previous icon
    paymentMethodIconEl.innerHTML = '';
    
    // Set icon based on payment method
    const methodLower = (paymentMethod || '').toLowerCase();
    if (methodLower.includes('gcash')) {
      paymentMethodIconEl.innerHTML = '<i class="fas fa-mobile-alt"></i>';
      paymentMethodTextEl.textContent = 'GCash';
    } else if (methodLower.includes('paymaya')) {
      paymentMethodIconEl.innerHTML = '<i class="fas fa-credit-card"></i>';
      paymentMethodTextEl.textContent = 'PayMaya';
    } else if (methodLower.includes('banking') || methodLower.includes('bank')) {
      paymentMethodIconEl.innerHTML = '<i class="fas fa-university"></i>';
      paymentMethodTextEl.textContent = 'Online Banking';
    } else {
      paymentMethodIconEl.innerHTML = '<i class="fas fa-money-bill"></i>';
      paymentMethodTextEl.textContent = paymentMethod;
    }
  }
  
  // Set paid amount
  const paidAmountEl = document.getElementById('receiptPaidAmount');
  if (paidAmountEl) {
    paidAmountEl.textContent = paidAmount > 0 
      ? `₱${parseFloat(paidAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'N/A';
  }
  
  // Handle remaining balance (show only for Down Payment)
  const remainingBalanceContainer = document.getElementById('receiptRemainingBalanceContainer');
  const remainingBalanceEl = document.getElementById('receiptRemainingBalance');
  
  const isDownPayment = paymentOption === 'Down Payment' || paymentOption === 'Partial Payment' || paymentOption === 'down';
  
  if (remainingBalanceContainer && remainingBalanceEl) {
    if (isDownPayment && remainingBalance > 0) {
      remainingBalanceContainer.style.display = 'block';
      remainingBalanceEl.textContent = `₱${parseFloat(remainingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      remainingBalanceContainer.style.display = 'none';
    }
  }
  
  // Set receipt image
  if (imageUrl && modalImage) {
    modalImage.src = imageUrl;
    modalImage.style.display = 'block';
    if (receiptNoImage) receiptNoImage.style.display = 'none';
  } else {
    if (modalImage) modalImage.style.display = 'none';
    if (receiptNoImage) receiptNoImage.style.display = 'block';
  }
  
  // Open modal
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  const receiptModal = document.getElementById('receiptModal');
  if (receiptModal && receiptModal.classList.contains('open') && event.target === receiptModal) {
    closeReceiptModal();
  }
});

function renderTable() {
  const tbody = document.getElementById('booking-table-body');
  if (!tbody) return; // Not on dashboard page
  tbody.innerHTML = '';
  // Always show bookings with reschedule requests, plus bookings matching the status filter
  const rows = bookings.filter(b => {
    // Always include bookings with reschedule requests regardless of status
    if (b.reschedule_requested) {
      return true;
    }
    // For other bookings, apply the status filter
    return ownerStatusFilter === 'all' ? (b.status === 'pending') : (b.status === ownerStatusFilter);
  });
  rows.forEach(b => {
    const tr = document.createElement('tr');
    const receiptCell = getReceiptCell(b.receipt_image_url);
    
    // Add reschedule indicator class if reschedule is requested
    if (b.reschedule_requested) {
      tr.classList.add('reschedule-request-row');
    }
    
    const actions = ownerStatusFilter === 'all' 
      ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.diving}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      ${receiptCell}
      <td>
        <div class="action-buttons">
          ${b.reschedule_requested ? `
          <button class="action-btn btn-reschedule-confirm" data-action="confirm-reschedule">Confirm Reschedule</button>
          ` : `
          <button class="action-btn btn-confirm" data-action="confirm">Confirm</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
          `}
        </div>
      </td>`
      : ownerStatusFilter === 'cancelled' ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.diving}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      ${receiptCell}
      <td>
        <span class="action-badge cancelled">Cancelled</span>
      </td>` : `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.diving}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      ${receiptCell}
      <td>
        <div class="action-buttons">
          ${b.reschedule_requested ? `
          <button class="action-btn btn-reschedule-confirm" data-action="confirm-reschedule">Confirm Reschedule</button>
          ` : `
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
          `}
        </div>
      </td>`;
    tr.innerHTML = actions;
    
    // Add event listeners to buttons
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const rescheduleConfirmBtn = tr.querySelector('.btn-reschedule-confirm');
    const receiptThumbnail = tr.querySelector('.receipt-thumbnail');
    
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (rescheduleConfirmBtn) rescheduleConfirmBtn.addEventListener('click', () => handleConfirmReschedule(b, rescheduleConfirmBtn));
    if (receiptThumbnail) {
      receiptThumbnail.addEventListener('click', function() {
        openReceiptModal(b);
      });
    }
    
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
  }, { total: 0, pending: 0, confirmed: 0, cancelled: 0 });

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
  set('owner-total-bookings', totals.total);
  set('owner-pending-bookings', totals.pending);
  set('owner-confirmed-bookings', totals.confirmed);
  set('owner-cancelled-bookings', totals.cancelled);
}

// Search functionality
function filterTable(searchTerm) {
  const tbody = document.getElementById('booking-table-body');
  if (!tbody) return; // Not on dashboard page
  tbody.innerHTML = '';
  
  const filteredBookings = bookings.filter(b => {
    // Always include bookings with reschedule requests regardless of status filter
    const matchesReschedule = b.reschedule_requested;
    // Apply status filter for non-reschedule bookings
    const matchesStatus = ownerStatusFilter === 'all' ? (b.status === 'pending') : (b.status === ownerStatusFilter);
    
    // Include if it matches reschedule OR status filter
    if (!matchesReschedule && !matchesStatus) {
      return false;
    }
    
    // Then apply search filter
    const searchLower = searchTerm.toLowerCase();
    return (
      b.id.toLowerCase().includes(searchLower) ||
      b.name.toLowerCase().includes(searchLower) ||
      b.services.toLowerCase().includes(searchLower) ||
      b.rental.toLowerCase().includes(searchLower) ||
      b.vanRental.toLowerCase().includes(searchLower) ||
      b.diving.toLowerCase().includes(searchLower) ||
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
    const receiptCell = getReceiptCell(b.receipt_image_url);
    
    // Add reschedule indicator class if reschedule is requested
    if (b.reschedule_requested) {
      tr.classList.add('reschedule-request-row');
    }
    
    const actions = ownerStatusFilter === 'all'
      ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.diving}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      ${receiptCell}
      <td>
        <div class="action-buttons">
          ${b.reschedule_requested ? `
          <button class="action-btn btn-reschedule-confirm" data-action="confirm-reschedule">Confirm Reschedule</button>
          ` : `
          <button class="action-btn btn-confirm" data-action="confirm">Confirm</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
          `}
        </div>
      </td>`
      : ownerStatusFilter === 'cancelled' ? `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.diving}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      ${receiptCell}
      <td>
        <span class="action-badge cancelled">Cancelled</span>
      </td>` : `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.vanRental}</td>
      <td>${b.diving}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      ${receiptCell}
      <td>
        <div class="action-buttons">
          ${b.reschedule_requested ? `
          <button class="action-btn btn-reschedule-confirm" data-action="confirm-reschedule">Confirm Reschedule</button>
          ` : `
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
          `}
        </div>
      </td>`;
    tr.innerHTML = actions;
    
    // Add event listeners to buttons
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const rescheduleConfirmBtn = tr.querySelector('.btn-reschedule-confirm');
    const receiptThumbnail = tr.querySelector('.receipt-thumbnail');
    
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (rescheduleConfirmBtn) rescheduleConfirmBtn.addEventListener('click', () => handleConfirmReschedule(b, rescheduleConfirmBtn));
    if (receiptThumbnail) {
      receiptThumbnail.addEventListener('click', function() {
        openReceiptModal(b);
      });
    }
    
    tbody.appendChild(tr);
  });
  
  // Show message if no results found
  if (filteredBookings.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="13" style="text-align: center; padding: 20px; color: #64748b;">No bookings found matching "${searchTerm}"</td>`;
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
  
  // Initialize Socket.IO connection
  initializeSocketIO();
  
  // Check session before loading dashboard
  if (checkSession()) {
    try {
      // Load vehicles, van destinations, tours, packages, hotels, diving, and bookings from API
      await loadVehicles(); // Load vehicles first
      await loadVanDestinations(); // Load van destinations
      await loadTours(); // Load tours
      await loadPackages(); // Load packages
      await loadDiving(); // Load diving options
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
  // Redirect to landing page
  window.location.href = '../user/home/home.html';
}
