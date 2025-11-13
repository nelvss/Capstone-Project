// Staff Dashboard JavaScript - mirror Owner Dashboard behavior, adapted for staff

// Dynamic bookings array - will be populated from API
let bookings = [];

let staffStatusFilter = 'all';

// API Configuration (same endpoint if used by owners)
const API_URL = (window.API_URL && window.API_URL.length > 0)
  ? window.API_URL
  : 'https://api.otgpuertogaleratravel.com';

let currentEditingBooking = null;
let staffEditModal = null;

const VEHICLE_EMPTY_MESSAGE = 'No vehicles added yet. Use "Add Vehicle" to include one.';
const VAN_EMPTY_MESSAGE = 'No van rentals added yet. Use "Add Van Rental" to include one.';

// Socket.IO Connection
let socket = null;
function initializeSocketIO() {
  try {
    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('🔌 Staff connected to server:', socket.id);
      showNotification('✅ Real-time updates connected', 'success');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Staff disconnected from server');
      showNotification('⚠️ Real-time updates disconnected', 'warning');
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });

    // Listen for booking updates
    socket.on('booking-update', async (data) => {
      console.log('📋 New booking update received:', data);
      showNotification('🎉 New booking received!', 'success');
      
      // Play notification sound (optional)
      playNotificationSound();
      
      // Reload bookings to get the latest data
      await loadBookings();
      renderTable();
      updateStaffStats();
    });

    // Listen for payment status changes
    socket.on('payment-status-changed', async (data) => {
      console.log('💳 Payment status changed:', data);
      showNotification('💳 Payment status updated', 'info');
      
      // Reload bookings to reflect payment changes
      await loadBookings();
      renderTable();
      updateStaffStats();
    });
  } catch (error) {
    console.error('❌ Socket.IO initialization error:', error);
  }
}

// Notification function
function showNotification(message, type = 'info') {
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
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Optional: Play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCuIzfPTgjMGHm7A7+OZURE');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
  } catch (error) {
    console.log('Notification sound not available');
  }
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
  if (!rawBooking.booking_preferences) rawBooking.booking_preferences = '';

  return {
    id: apiBooking.booking_id,
    name: `${apiBooking.customer_first_name} ${apiBooking.customer_last_name}`,
    services: apiBooking.booking_preferences || 'N/A',
    rental: vehicleInfo,
    vanRental: vanRentalInfo,
    arrival: apiBooking.arrival_date,
    departure: apiBooking.departure_date,
    hotel: hotelDisplay,
    price: formattedPrice,
    contact: apiBooking.customer_contact,
    email: apiBooking.customer_email,
    status: apiBooking.status,
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
    
    // Transform API data to match the expected format
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

async function sendEmail(action, booking) {
  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, booking }),
    });
    const result = await response.json();
    return result.success
      ? { success: true, message: result.message }
      : { success: false, message: result.message };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to connect to email server. Please ensure the server is running.' };
  }
}

async function handleConfirm(booking, button) {
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

async function handleCancel(booking, button) {
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

function extractDateOnly(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.includes('T')) return value.split('T')[0];
    return value.substring(0, 10);
  }
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
}

function setupBookingEditModal() {
  const modalElement = document.getElementById('booking-edit-modal');
  if (!modalElement) return;
  if (staffEditModal && staffEditModal.initialized) return;

  const form = modalElement.querySelector('#booking-edit-form');
  staffEditModal = {
    container: modalElement,
    form,
    closeBtn: modalElement.querySelector('[data-close-modal]'),
    cancelBtn: modalElement.querySelector('[data-cancel-modal]'),
    vehicleList: modalElement.querySelector('[data-vehicle-list]'),
    vanRentalList: modalElement.querySelector('[data-van-rental-list]'),
    addVehicleBtn: modalElement.querySelector('[data-add-vehicle]'),
    addVanRentalBtn: modalElement.querySelector('[data-add-van-rental]'),
    saveBtn: modalElement.querySelector('.modal-primary-btn'),
    initialized: true,
    escapeHandlerBound: false
  };

  modalElement.addEventListener('click', (event) => {
    if (event.target === modalElement) {
      closeBookingEditModal();
    }
  });

  staffEditModal.closeBtn?.addEventListener('click', () => closeBookingEditModal());
  staffEditModal.cancelBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    closeBookingEditModal();
  });
  staffEditModal.addVehicleBtn?.addEventListener('click', () => addVehicleRow());
  staffEditModal.addVanRentalBtn?.addEventListener('click', () => addVanRentalRow());
  form?.addEventListener('submit', submitBookingEditForm);

  if (!staffEditModal.escapeHandlerBound) {
    document.addEventListener('keydown', handleEditModalEscape);
    staffEditModal.escapeHandlerBound = true;
  }

  setRepeatableEmptyState(staffEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
  setRepeatableEmptyState(staffEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
}

function handleEditModalEscape(event) {
  if (event.key === 'Escape' && staffEditModal?.container?.classList.contains('open')) {
    closeBookingEditModal();
  }
}

function openBookingEditModal(booking) {
  if (!staffEditModal || !staffEditModal.initialized) {
    setupBookingEditModal();
  }

  if (!staffEditModal || !staffEditModal.form) {
    console.warn('Booking edit modal is not initialized.');
    return;
  }

  currentEditingBooking = booking;
  staffEditModal.form.dataset.bookingId = booking.id;
  populateBookingEditForm(booking);

  staffEditModal.container.classList.add('open');
  staffEditModal.container.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeBookingEditModal() {
  if (!staffEditModal?.container) return;

  staffEditModal.container.classList.remove('open');
  staffEditModal.container.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  currentEditingBooking = null;

  if (staffEditModal.form) {
    staffEditModal.form.reset();
    delete staffEditModal.form.dataset.bookingId;
  }

  if (staffEditModal.vehicleList) {
    staffEditModal.vehicleList.innerHTML = '';
    setRepeatableEmptyState(staffEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
  }

  if (staffEditModal.vanRentalList) {
    staffEditModal.vanRentalList.innerHTML = '';
    setRepeatableEmptyState(staffEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
  }

  staffEditModal.cancelBtn?.removeAttribute('disabled');
  staffEditModal.addVehicleBtn?.removeAttribute('disabled');
  staffEditModal.addVanRentalBtn?.removeAttribute('disabled');
  if (staffEditModal.saveBtn) {
    staffEditModal.saveBtn.disabled = false;
    staffEditModal.saveBtn.textContent = 'Save Changes';
  }
}

function setFormValue(name, value) {
  if (!staffEditModal?.form) return;
  const field = staffEditModal.form.elements[name];
  if (!field) return;
  field.value = value ?? '';
}

function setSelectValue(name, value) {
  if (!staffEditModal?.form) return;
  const field = staffEditModal.form.elements[name];
  if (!field) return;
  const allowedValues = Array.from(field.options).map(option => option.value);
  field.value = allowedValues.includes(value) ? value : allowedValues[0] || '';
}

function setRepeatableEmptyState(container, message) {
  if (!container) return;
  let placeholder = container.querySelector('.modal-repeatable-empty');
  if (!message) {
    if (placeholder) placeholder.remove();
    return;
  }
  if (!placeholder) {
    placeholder = document.createElement('div');
    placeholder.className = 'modal-repeatable-empty';
    container.appendChild(placeholder);
  }
  placeholder.textContent = message;
}

function populateBookingEditForm(booking) {
  if (!staffEditModal?.form) return;
  const raw = booking?.raw ? JSON.parse(JSON.stringify(booking.raw)) : {};

  staffEditModal.form.reset();

  setFormValue('booking_id', booking.id || raw.booking_id || '');
  setSelectValue('status', raw.status || booking.status || 'pending');
  setSelectValue('booking_type', raw.booking_type || 'package_only');
  setFormValue('number_of_tourist', raw.number_of_tourist ?? '');
  setFormValue('customer_first_name', raw.customer_first_name || '');
  setFormValue('customer_last_name', raw.customer_last_name || '');
  setFormValue('customer_email', raw.customer_email || '');
  setFormValue('customer_contact', raw.customer_contact || '');
  setFormValue('arrival_date', extractDateOnly(raw.arrival_date));
  setFormValue('departure_date', extractDateOnly(raw.departure_date));
  setFormValue('hotel_id', raw.hotel_id || '');
  setFormValue('hotel_nights', raw.hotel_nights ?? '');
  setFormValue('package_only_id', raw.package_only_id || '');
  setFormValue('booking_preferences', raw.booking_preferences || '');
  setFormValue('notes', raw.notes || '');
  setFormValue('total_booking_amount', raw.total_booking_amount ?? '');
  setFormValue('payment_date', extractDateOnly(raw.payment_date));

  if (staffEditModal.vehicleList) {
    staffEditModal.vehicleList.innerHTML = '';
    const vehicles = raw.vehicle_bookings || [];
    if (vehicles.length > 0) {
      vehicles.forEach(vehicle => addVehicleRow(vehicle));
    } else {
      setRepeatableEmptyState(staffEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
    }
  }

  if (staffEditModal.vanRentalList) {
    staffEditModal.vanRentalList.innerHTML = '';
    const vanRentals = raw.van_rental_bookings || [];
    if (vanRentals.length > 0) {
      vanRentals.forEach(van => addVanRentalRow(van));
    } else {
      setRepeatableEmptyState(staffEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
    }
  }

  staffEditModal.container?.scrollTo({ top: 0 });
}

function createVehicleRowElement() {
  const row = document.createElement('div');
  row.className = 'modal-repeatable-item';
  row.innerHTML = `
    <button type="button" class="modal-row-remove" aria-label="Remove vehicle">Remove</button>
    <div class="modal-row-grid">
      <label class="modal-field">
        <span class="modal-field-label">Vehicle ID</span>
        <input type="text" data-field="vehicle_id">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Vehicle Name</span>
        <input type="text" data-field="vehicle_name">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Rental Days</span>
        <input type="number" min="1" step="1" data-field="rental_days">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Total Amount</span>
        <input type="number" min="0" step="0.01" data-field="total_amount">
      </label>
    </div>
  `;
  return row;
}

function addVehicleRow(data = {}) {
  if (!staffEditModal?.vehicleList) return;

  setRepeatableEmptyState(staffEditModal.vehicleList, null);

  const row = createVehicleRowElement();
  staffEditModal.vehicleList.appendChild(row);

  const removeBtn = row.querySelector('.modal-row-remove');
  removeBtn?.addEventListener('click', () => {
    row.remove();
    if (!staffEditModal.vehicleList.querySelector('.modal-repeatable-item')) {
      setRepeatableEmptyState(staffEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
    }
  });

  const vehicleId = data.vehicle_id ?? data.vehicle?.vehicle_id ?? '';
  const vehicleName = data.vehicle_name ?? data.vehicle?.name ?? '';

  row.querySelector('[data-field="vehicle_id"]').value = vehicleId ?? '';
  row.querySelector('[data-field="vehicle_name"]').value = vehicleName ?? '';
  row.querySelector('[data-field="rental_days"]').value = data.rental_days ?? '';
  row.querySelector('[data-field="total_amount"]').value = data.total_amount ?? '';
}

function createVanRentalRowElement() {
  const row = document.createElement('div');
  row.className = 'modal-repeatable-item';
  row.innerHTML = `
    <button type="button" class="modal-row-remove" aria-label="Remove van rental">Remove</button>
    <div class="modal-row-grid">
      <label class="modal-field">
        <span class="modal-field-label">Destination ID</span>
        <input type="text" data-field="van_destination_id">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Destination Name</span>
        <input type="text" data-field="choose_destination">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Trip Type</span>
        <select data-field="trip_type">
          <option value="roundtrip">Round Trip</option>
          <option value="oneway">One Way</option>
        </select>
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Days</span>
        <input type="number" min="1" step="1" data-field="number_of_days">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Total Amount</span>
        <input type="number" min="0" step="0.01" data-field="total_amount">
      </label>
    </div>
  `;
  return row;
}

function addVanRentalRow(data = {}) {
  if (!staffEditModal?.vanRentalList) return;

  setRepeatableEmptyState(staffEditModal.vanRentalList, null);

  const row = createVanRentalRowElement();
  staffEditModal.vanRentalList.appendChild(row);

  const removeBtn = row.querySelector('.modal-row-remove');
  removeBtn?.addEventListener('click', () => {
    row.remove();
    if (!staffEditModal.vanRentalList.querySelector('.modal-repeatable-item')) {
      setRepeatableEmptyState(staffEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
    }
  });

  const destinationId = data.van_destination_id ?? '';
  const destinationName = data.choose_destination ?? data.destination?.destination_name ?? '';
  const rawTripType = (data.trip_type || '').toLowerCase();
  const normalizedTripType = rawTripType === 'roundtrip' ? 'roundtrip' : 'oneway';

  row.querySelector('[data-field="van_destination_id"]').value = destinationId ?? '';
  row.querySelector('[data-field="choose_destination"]').value = destinationName ?? '';
  row.querySelector('[data-field="trip_type"]').value = normalizedTripType;
  row.querySelector('[data-field="number_of_days"]').value = data.number_of_days ?? '';
  row.querySelector('[data-field="total_amount"]').value = data.total_amount ?? '';
}

function getRepeatableFieldValue(row, field) {
  const el = row.querySelector(`[data-field="${field}"]`);
  if (!el) return '';
  return el.value ?? '';
}

function collectBookingFormData() {
  if (!staffEditModal?.form) return null;

  const formData = new FormData(staffEditModal.form);
  const trim = (value) => (value === null || value === undefined) ? '' : String(value).trim();
  const emptyToNull = (value) => value === '' ? null : value;
  const parseIntegerField = (value) => {
    const trimmed = trim(value);
    if (trimmed === '') return null;
    const parsed = parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const parseNumberField = (value) => {
    const trimmed = trim(value);
    if (trimmed === '') return null;
    const parsed = parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const payload = {
    booking_id: trim(formData.get('booking_id')),
    status: trim(formData.get('status')) || 'pending',
    booking_type: emptyToNull(trim(formData.get('booking_type'))),
    number_of_tourist: parseIntegerField(formData.get('number_of_tourist')),
    customer_first_name: trim(formData.get('customer_first_name')),
    customer_last_name: trim(formData.get('customer_last_name')),
    customer_email: trim(formData.get('customer_email')),
    customer_contact: trim(formData.get('customer_contact')),
    arrival_date: emptyToNull(trim(formData.get('arrival_date'))),
    departure_date: emptyToNull(trim(formData.get('departure_date'))),
    hotel_id: emptyToNull(trim(formData.get('hotel_id'))),
    hotel_nights: parseIntegerField(formData.get('hotel_nights')),
    package_only_id: emptyToNull(trim(formData.get('package_only_id'))),
    booking_preferences: trim(formData.get('booking_preferences')),
    notes: trim(formData.get('notes')),
    total_booking_amount: parseNumberField(formData.get('total_booking_amount')),
    payment_date: emptyToNull(trim(formData.get('payment_date'))),
    vehicles: [],
    van_rentals: []
  };

  const vehicleRows = staffEditModal.vehicleList
    ? Array.from(staffEditModal.vehicleList.querySelectorAll('.modal-repeatable-item'))
    : [];

  vehicleRows.forEach(row => {
    const vehicle = {
      vehicle_id: emptyToNull(trim(getRepeatableFieldValue(row, 'vehicle_id'))),
      vehicle_name: emptyToNull(trim(getRepeatableFieldValue(row, 'vehicle_name'))),
      rental_days: parseIntegerField(getRepeatableFieldValue(row, 'rental_days')),
      total_amount: parseNumberField(getRepeatableFieldValue(row, 'total_amount'))
    };

    if (vehicle.vehicle_id || vehicle.vehicle_name || vehicle.rental_days !== null || vehicle.total_amount !== null) {
      payload.vehicles.push(vehicle);
    }
  });

  const vanRows = staffEditModal.vanRentalList
    ? Array.from(staffEditModal.vanRentalList.querySelectorAll('.modal-repeatable-item'))
    : [];

  vanRows.forEach(row => {
    const tripTypeRaw = trim(getRepeatableFieldValue(row, 'trip_type')).toLowerCase();
    const van = {
      van_destination_id: emptyToNull(trim(getRepeatableFieldValue(row, 'van_destination_id'))),
      choose_destination: emptyToNull(trim(getRepeatableFieldValue(row, 'choose_destination'))),
      trip_type: tripTypeRaw ? (tripTypeRaw === 'roundtrip' ? 'roundtrip' : 'oneway') : null,
      number_of_days: parseIntegerField(getRepeatableFieldValue(row, 'number_of_days')),
      total_amount: parseNumberField(getRepeatableFieldValue(row, 'total_amount'))
    };

    if (
      van.van_destination_id ||
      van.choose_destination ||
      van.trip_type ||
      van.number_of_days !== null ||
      van.total_amount !== null
    ) {
      payload.van_rentals.push(van);
    }
  });

  return payload;
}

async function submitBookingEditForm(event) {
  event.preventDefault();

  if (!currentEditingBooking) {
    console.warn('No booking selected for editing.');
    return;
  }

  if (!staffEditModal?.form) {
    console.warn('Edit modal form is not available.');
    return;
  }

  const submitButton = staffEditModal.saveBtn;
  const originalButtonText = submitButton ? submitButton.textContent : null;

  const payload = collectBookingFormData();
  if (!payload) {
    alert('Unable to collect booking details. Please try again.');
    return;
  }

  const requiredFields = [
    'customer_first_name',
    'customer_last_name',
    'customer_email',
    'customer_contact',
    'arrival_date',
    'departure_date'
  ];

  const missingFields = requiredFields.filter(field => {
    const value = payload[field];
    return value === null || value === undefined || String(value).trim() === '';
  });

  if (missingFields.length > 0) {
    alert(`Please fill out the following fields: ${missingFields.map(field => field.replace(/_/g, ' ')).join(', ')}`);
    return;
  }

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
    }
    staffEditModal.cancelBtn?.setAttribute('disabled', 'disabled');
    staffEditModal.addVehicleBtn?.setAttribute('disabled', 'disabled');
    staffEditModal.addVanRentalBtn?.setAttribute('disabled', 'disabled');

    const payloadForApi = { ...payload };
    delete payloadForApi.booking_id;
    payloadForApi.status = payloadForApi.status || currentEditingBooking.status;

    const response = await fetch(`${API_URL}/api/bookings/${currentEditingBooking.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadForApi)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result?.message || 'Failed to update booking');
    }

    const updatedBooking = mapBookingRecord(result.booking);
    if (!updatedBooking) {
      throw new Error('Received unexpected booking response');
    }

    const bookingIndex = bookings.findIndex(b => b.id === updatedBooking.id);
    if (bookingIndex !== -1) {
      bookings[bookingIndex] = updatedBooking;
    } else {
      bookings.push(updatedBooking);
    }

    closeBookingEditModal();
    renderTable();
    updateStaffStats();
  } catch (error) {
    console.error('Error updating booking:', error);
    alert(error.message || 'Failed to update booking. Please try again.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText || 'Save Changes';
    }
    staffEditModal.cancelBtn?.removeAttribute('disabled');
    staffEditModal.addVehicleBtn?.removeAttribute('disabled');
    staffEditModal.addVanRentalBtn?.removeAttribute('disabled');
  }
}

function renderTable() {
  const tbody = document.getElementById('booking-table-body');
  tbody.innerHTML = '';
  const rows = bookings.filter(b => staffStatusFilter === 'all' ? (b.status === 'pending') : (b.status === staffStatusFilter));
  rows.forEach(b => {
    const tr = document.createElement('tr');
    const actions = staffStatusFilter === 'all'
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
          <button class="action-btn btn-edit" data-action="edit">Edit</button>
        </div>
      </td>`
      : staffStatusFilter === 'cancelled' ? `
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
      </td>` : staffStatusFilter === 'rescheduled' ? `
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
          <button class="action-btn btn-edit" data-action="edit">Edit</button>
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
          <button class="action-btn btn-edit" data-action="edit">Edit</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
        </div>
      </td>`;
    tr.innerHTML = actions;
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const editBtn = tr.querySelector('.btn-edit');
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (editBtn) editBtn.addEventListener('click', () => openBookingEditModal(b));
    tbody.appendChild(tr);
  });
  updateStaffStats();
}

function staffFilterChange() {
  const sel = document.getElementById('staff-status-filter');
  staffStatusFilter = sel ? sel.value : 'all';
  renderTable();
}

function updateStaffStats() {
  const totals = bookings.reduce((acc, b) => {
    acc.total += 1;
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, { total: 0, pending: 0, confirmed: 0, cancelled: 0, rescheduled: 0 });
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
  set('total-bookings', totals.total);
  set('pending-bookings', totals.pending);
  set('confirmed-bookings', totals.confirmed + totals.rescheduled);
  set('cancelled-bookings', totals.cancelled);
}

function filterTable(searchTerm) {
  const tbody = document.getElementById('booking-table-body');
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
    const actions = staffStatusFilter === 'all'
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
          <button class="action-btn btn-edit" data-action="edit">Edit</button>
        </div>
      </td>`
      : staffStatusFilter === 'cancelled' ? `
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
      </td>` : staffStatusFilter === 'rescheduled' ? `
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
          <button class="action-btn btn-edit" data-action="edit">Edit</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
        </div>
      </td>`;
    tr.innerHTML = actions;
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const editBtn = tr.querySelector('.btn-edit');
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (editBtn) editBtn.addEventListener('click', () => openBookingEditModal(b));
    tbody.appendChild(tr);
  });
  if (filteredBookings.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="12" style="text-align: center; padding: 20px; color: #64748b;">No bookings found matching "${searchTerm}"</td>`;
    tbody.appendChild(tr);
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
}

function navigateWithTransition(url) {
  document.body.classList.add('page-transition');
  setTimeout(() => { window.location.href = url; }, 300);
}

function handleLogout() {
  localStorage.removeItem('userSession');
  window.location.href = '../owner/login.html';
}

function checkSession() {
  const userSession = localStorage.getItem('userSession');
  if (!userSession) { window.location.href = '../owner/login.html'; return false; }
  try {
    const session = JSON.parse(userSession);
    if (session.type !== 'staff') { alert('Access denied. Staff access required.'); window.location.href = '../owner/login.html'; return false; }
    const welcomeElement = document.querySelector('.user-welcome');
    if (welcomeElement) welcomeElement.textContent = `Welcome, ${session.username}`;
    return true;
  } catch {
    localStorage.removeItem('userSession');
    window.location.href = '../owner/login.html';
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  if (checkSession()) {
    setupBookingEditModal();
    
    // Initialize Socket.IO connection
    initializeSocketIO();
    
    try {
      // Load bookings from API
      const bookingsLoaded = await loadBookings();
      
      if (bookingsLoaded) {
        renderTable();
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            if (searchTerm === '') { renderTable(); } else { filterTable(searchTerm); }
          });
        }
      }
    } catch (error) {
      console.error('Error initializing staff dashboard:', error);
    }
  }
});