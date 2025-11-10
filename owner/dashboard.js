// Dynamic bookings array - will be populated from API
let bookings = [];
let availableVehicles = []; // Store vehicles for dropdown
let availableVanDestinations = []; // Store van destinations for dropdown
let availableTours = []; // Store tours for dropdown
let availablePackages = []; // Store packages for dropdown
let availableDiving = []; // Store diving options for dropdown

let ownerStatusFilter = 'all';

let currentEditingBooking = null;
let ownerEditModal = null;

const VEHICLE_EMPTY_MESSAGE = 'No vehicles added yet. Use "Add Vehicle" to include one.';
const VAN_EMPTY_MESSAGE = 'No van rentals added yet. Use "Add Van Rental" to include one.';

// API Configuration
const API_URL = (window.API_URL && window.API_URL.length > 0)
  ? window.API_URL
  : 'https://api.otgpuertogaleratravel.com';

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

// Load hotels from API
async function loadHotels() {
  try {
    console.log('🏨 Loading hotels from API...');
    
    const response = await fetch(`${API_URL}/api/hotels`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to load hotels');
    }
    
    const hotels = result.hotels || [];
    
    // Populate hotel dropdown in package section
    const hotelSelect = document.getElementById('package-hotel-select');
    if (hotelSelect) {
      hotelSelect.innerHTML = '<option value="">Select Hotel</option>';
      hotels.forEach(hotel => {
        const option = document.createElement('option');
        option.value = hotel.hotel_id;
        option.textContent = hotel.name;
        hotelSelect.appendChild(option);
      });
    }
    
    console.log('✅ Hotels loaded successfully:', hotels.length, 'hotels');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading hotels:', error);
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

// Booking edit modal helpers
function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => {
    return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
  });
}

function focusFirstElement(container) {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
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
  if (ownerEditModal && ownerEditModal.initialized) return;

  const form = modalElement.querySelector('#booking-edit-form');
  ownerEditModal = {
    container: modalElement,
    form,
    closeBtn: modalElement.querySelector('[data-close-modal]'),
    cancelBtn: modalElement.querySelector('[data-cancel-modal]'),
    vehicleList: modalElement.querySelector('[data-vehicle-list]'),
    vanRentalList: modalElement.querySelector('[data-van-rental-list]'),
    divingList: modalElement.querySelector('[data-diving-list]'),
    addVehicleBtn: modalElement.querySelector('[data-add-vehicle]'),
    addVanRentalBtn: modalElement.querySelector('[data-add-van-rental]'),
    addDivingBtn: modalElement.querySelector('[data-add-diving]'),
    saveBtn: modalElement.querySelector('.modal-primary-btn'),
    initialized: true,
    escapeHandlerBound: false,
    previouslyFocusedElement: null
  };

  modalElement.addEventListener('click', (event) => {
    if (event.target === modalElement) {
      closeBookingEditModal();
    }
  });

  ownerEditModal.closeBtn?.addEventListener('click', () => closeBookingEditModal());
  ownerEditModal.cancelBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    closeBookingEditModal();
  });
  ownerEditModal.addVehicleBtn?.addEventListener('click', () => addVehicleRow());
  ownerEditModal.addVanRentalBtn?.addEventListener('click', () => addVanRentalRow());
  ownerEditModal.addDivingBtn?.addEventListener('click', () => addDivingRow());
  form?.addEventListener('submit', submitBookingEditForm);

  // Setup booking type change handler
  const bookingTypeSelect = form?.querySelector('[name="booking_type"]');
  const tourSection = document.getElementById('tour-selection-section');
  const packageSection = document.getElementById('package-selection-section');
  const numberOfTourists = form?.querySelector('[name="number_of_tourist"]');
  
  if (bookingTypeSelect) {
    bookingTypeSelect.addEventListener('change', (e) => {
      const bookingType = e.target.value;
      if (bookingType === 'tour_only') {
        tourSection.style.display = 'grid';
        packageSection.style.display = 'none';
      } else if (bookingType === 'package_only') {
        tourSection.style.display = 'none';
        packageSection.style.display = 'grid';
      } else {
        tourSection.style.display = 'none';
        packageSection.style.display = 'none';
      }
    });
  }
  
  // Setup tour type change handler
  const tourTypeSelect = document.getElementById('tour-type-select');
  const tourPriceInput = document.getElementById('tour-price-input');
  const tourTotalInput = document.getElementById('tour-total-input');
  
  if (tourTypeSelect) {
    tourTypeSelect.addEventListener('change', (e) => {
      const tourType = e.target.value;
      if (!tourType) {
        tourPriceInput.value = '';
        tourTotalInput.value = '';
        updateTotalBookingAmount();
        return;
      }
      
      // Find tour by category
      const categoryMap = {
        'island': 'Island Tour',
        'inland': 'Inland Tour',
        'snorkeling': 'Snorkeling Tour'
      };
      
      const tour = availableTours.find(t => t.category === categoryMap[tourType]);
      if (tour) {
        // Find pricing based on number of tourists
        const tourists = parseInt(numberOfTourists?.value) || 1;
        const pricing = tour.pricing?.find(p => tourists >= p.min_tourist && tourists <= p.max_tourist);
        
        if (pricing) {
          tourPriceInput.value = pricing.price_per_head;
          const total = pricing.price_per_head * tourists;
          tourTotalInput.value = total.toFixed(2);
        } else {
          tourPriceInput.value = '';
          tourTotalInput.value = '';
        }
        
        updateTotalBookingAmount();
      }
    });
  }
  
  // Setup package type change handler
  const packageTypeSelect = document.getElementById('package-type-select');
  const packageIdInput = document.getElementById('package-id-input');
  const packagePriceInput = document.getElementById('package-price-input');
  const packageTotalInput = document.getElementById('package-total-input');
  
  if (packageTypeSelect) {
    packageTypeSelect.addEventListener('change', (e) => {
      const packageType = e.target.value;
      if (!packageType) {
        packageIdInput.value = '';
        packagePriceInput.value = '';
        packageTotalInput.value = '';
        updateTotalBookingAmount();
        return;
      }
      
      // Find package by category (Package 1, Package 2, etc.)
      const packageCategory = `Package ${packageType}`;
      const pkg = availablePackages.find(p => p.category === packageCategory);
      
      if (pkg) {
        packageIdInput.value = pkg.package_only_id;
        
        // Find pricing based on number of tourists
        const tourists = parseInt(numberOfTourists?.value) || 1;
        const pricing = pkg.pricing?.find(p => tourists >= p.min_tourist && tourists <= p.max_tourist);
        
        if (pricing) {
          packagePriceInput.value = pricing.price_per_head;
          const total = pricing.price_per_head * tourists;
          packageTotalInput.value = total.toFixed(2);
        } else {
          packagePriceInput.value = '';
          packageTotalInput.value = '';
        }
        
        updateTotalBookingAmount();
      }
    });
  }
  
  // Recalculate tour/package total when number of tourists changes
  if (numberOfTourists) {
    numberOfTourists.addEventListener('input', () => {
      // Trigger recalculation for tour
      if (tourTypeSelect?.value) {
        tourTypeSelect.dispatchEvent(new Event('change'));
      }
      // Trigger recalculation for package
      if (packageTypeSelect?.value) {
        packageTypeSelect.dispatchEvent(new Event('change'));
      }
    });
  }

  if (!ownerEditModal.escapeHandlerBound) {
    document.addEventListener('keydown', handleEditModalEscape);
    ownerEditModal.escapeHandlerBound = true;
  }

  setRepeatableEmptyState(ownerEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
  setRepeatableEmptyState(ownerEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
  setRepeatableEmptyState(ownerEditModal.divingList, null);
}

function handleEditModalEscape(event) {
  if (event.key === 'Escape' && ownerEditModal?.container?.classList.contains('open')) {
    closeBookingEditModal();
  }
}

function openBookingEditModal(booking) {
  if (!ownerEditModal || !ownerEditModal.initialized) {
    setupBookingEditModal();
  }

  if (!ownerEditModal || !ownerEditModal.form) {
    console.warn('Booking edit modal is not initialized.');
    return;
  }

  currentEditingBooking = booking;
  ownerEditModal.form.dataset.bookingId = booking.id;
  populateBookingEditForm(booking);

  ownerEditModal.previouslyFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  ownerEditModal.container.classList.add('open');
  ownerEditModal.container.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  requestAnimationFrame(() => {
    focusFirstElement(ownerEditModal.container);
  });
}

function closeBookingEditModal() {
  if (!ownerEditModal?.container) return;

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && ownerEditModal.container.contains(activeElement)) {
    activeElement.blur();
  }

  ownerEditModal.container.classList.remove('open');
  ownerEditModal.container.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  const previousFocus = ownerEditModal.previouslyFocusedElement;
  ownerEditModal.previouslyFocusedElement = null;

  currentEditingBooking = null;

  if (ownerEditModal.form) {
    ownerEditModal.form.reset();
    delete ownerEditModal.form.dataset.bookingId;
  }

  if (ownerEditModal.vehicleList) {
    ownerEditModal.vehicleList.innerHTML = '';
    setRepeatableEmptyState(ownerEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
  }

  if (ownerEditModal.vanRentalList) {
    ownerEditModal.vanRentalList.innerHTML = '';
    setRepeatableEmptyState(ownerEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
  }

  if (ownerEditModal.divingList) {
    ownerEditModal.divingList.innerHTML = '';
    setRepeatableEmptyState(ownerEditModal.divingList, null);
  }

  ownerEditModal.cancelBtn?.removeAttribute('disabled');
  ownerEditModal.addVehicleBtn?.removeAttribute('disabled');
  ownerEditModal.addVanRentalBtn?.removeAttribute('disabled');
  ownerEditModal.addDivingBtn?.removeAttribute('disabled');
  if (ownerEditModal.saveBtn) {
    ownerEditModal.saveBtn.disabled = false;
    ownerEditModal.saveBtn.textContent = 'Save Changes';
  }

  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
}

function setFormValue(name, value) {
  if (!ownerEditModal?.form) return;
  const field = ownerEditModal.form.elements[name];
  if (!field) return;
  field.value = value ?? '';
}

function setSelectValue(name, value) {
  if (!ownerEditModal?.form) return;
  const field = ownerEditModal.form.elements[name];
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
  if (!ownerEditModal?.form) return;
  const raw = booking?.raw ? JSON.parse(JSON.stringify(booking.raw)) : {};

  ownerEditModal.form.reset();

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

  // Show/hide tour or package sections based on booking type
  const tourSection = document.getElementById('tour-selection-section');
  const packageSection = document.getElementById('package-selection-section');
  const bookingType = raw.booking_type || 'package_only';
  
  if (bookingType === 'tour_only') {
    tourSection.style.display = 'grid';
    packageSection.style.display = 'none';
    
    console.log('📋 Populating tour details for booking:', raw);
    console.log('📋 Booking preferences:', raw.booking_preferences);
    
    const tourTypeSelect = document.getElementById('tour-type-select');
    const tourPriceInput = document.getElementById('tour-price-input');
    const tourTotalInput = document.getElementById('tour-total-input');
    
    let tourCategory = null;
    
    // Parse tour category from booking_preferences
    if (raw.booking_preferences) {
      // Parse "Tour Only: Island Tour" format
      const match = raw.booking_preferences.match(/Tour Only:\s*(.+)/i);
      if (match) {
        tourCategory = match[1].trim();
        console.log('📝 Parsed tour category from preferences:', tourCategory);
        
        // Find tour by category
        const tour = availableTours.find(t => t.category === tourCategory);
        console.log('🔍 Found tour:', tour);
        
        if (tour) {
          // Map category to tour type
          const categoryToType = {
            'Island Tour': 'island',
            'Inland Tour': 'inland',
            'Snorkeling Tour': 'snorkeling'
          };
          
          const tourType = categoryToType[tour.category];
          if (tourType) {
            tourTypeSelect.value = tourType;
          }
          
          // Calculate price based on number of tourists
          const tourists = parseInt(raw.number_of_tourist) || 1;
          const pricing = tour.pricing?.find(p => tourists >= p.min_tourist && tourists <= p.max_tourist);
          
          console.log('💰 Found pricing:', pricing, 'for', tourists, 'tourists');
          
          if (pricing) {
            tourPriceInput.value = pricing.price_per_head;
            const total = pricing.price_per_head * tourists;
            tourTotalInput.value = total.toFixed(2);
          }
        } else {
          console.warn('⚠️ Tour not found in availableTours for category:', tourCategory);
        }
      }
    } else {
      console.warn('⚠️ No booking preferences found');
    }
  } else if (bookingType === 'package_only') {
    tourSection.style.display = 'none';
    packageSection.style.display = 'grid';
    
    // Populate package data if available
    if (raw.package_only_id) {
      const packageIdInput = document.getElementById('package-id-input');
      const packageTypeSelect = document.getElementById('package-type-select');
      const packagePriceInput = document.getElementById('package-price-input');
      const packageTotalInput = document.getElementById('package-total-input');
      const hotelSelect = document.getElementById('package-hotel-select');
      const hotelNightsInput = document.getElementById('package-hotel-nights');
      
      packageIdInput.value = raw.package_only_id;
      
      // Set hotel and hotel nights
      if (raw.hotel_id && hotelSelect) {
        hotelSelect.value = raw.hotel_id;
      }
      if (raw.hotel_nights && hotelNightsInput) {
        hotelNightsInput.value = raw.hotel_nights;
      }
      
      // Find the package to get its category
      const pkg = availablePackages.find(p => p.package_only_id === raw.package_only_id);
      if (pkg) {
        // Extract package number from category (e.g., "Package 1" -> "1")
        const match = pkg.category?.match(/Package (\d)/);
        if (match) {
          packageTypeSelect.value = match[1];
        }
        
        // Calculate price based on number of tourists
        const tourists = parseInt(raw.number_of_tourist) || 1;
        const pricing = pkg.pricing?.find(p => tourists >= p.min_tourist && tourists <= p.max_tourist);
        
        if (pricing) {
          packagePriceInput.value = pricing.price_per_head;
          const total = pricing.price_per_head * tourists;
          packageTotalInput.value = total.toFixed(2);
        }
      }
    }
  } else {
    tourSection.style.display = 'none';
    packageSection.style.display = 'none';
  }

  if (ownerEditModal.vehicleList) {
    ownerEditModal.vehicleList.innerHTML = '';
    const vehicles = raw.vehicle_bookings || [];
    if (vehicles.length > 0) {
      vehicles.forEach(vehicle => addVehicleRow(vehicle));
    } else {
      setRepeatableEmptyState(ownerEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
    }
  }

  if (ownerEditModal.vanRentalList) {
    ownerEditModal.vanRentalList.innerHTML = '';
    const vanRentals = raw.van_rental_bookings || [];
    if (vanRentals.length > 0) {
      vanRentals.forEach(van => addVanRentalRow(van));
    } else {
      setRepeatableEmptyState(ownerEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
    }
  }

  if (ownerEditModal.divingList) {
    ownerEditModal.divingList.innerHTML = '';
    const divingBookings = raw.diving_bookings || [];
    if (divingBookings.length > 0) {
      divingBookings.forEach(diving => addDivingRow(diving));
    } else {
      setRepeatableEmptyState(ownerEditModal.divingList, null);
    }
  }

  ownerEditModal.container?.scrollTo({ top: 0 });
}

// Function to calculate and update total booking amount
function updateTotalBookingAmount() {
  if (!ownerEditModal) return;
  
  let total = 0;
  
  // Add tour amount if tour only
  const tourTotal = document.getElementById('tour-total-input');
  if (tourTotal && tourTotal.value) {
    total += parseFloat(tourTotal.value) || 0;
  }
  
  // Add package amount if package only
  const packageTotal = document.getElementById('package-total-input');
  if (packageTotal && packageTotal.value) {
    total += parseFloat(packageTotal.value) || 0;
  }
  
  // Sum all vehicle amounts
  const vehicleRows = ownerEditModal.vehicleList?.querySelectorAll('.modal-repeatable-item') || [];
  vehicleRows.forEach(row => {
    const amount = parseFloat(getRepeatableFieldValue(row, 'total_amount')) || 0;
    total += amount;
  });
  
  // Sum all van rental amounts
  const vanRows = ownerEditModal.vanRentalList?.querySelectorAll('.modal-repeatable-item') || [];
  vanRows.forEach(row => {
    const amount = parseFloat(getRepeatableFieldValue(row, 'total_amount')) || 0;
    total += amount;
  });
  
  // Sum all diving amounts
  const divingRows = ownerEditModal.divingList?.querySelectorAll('.modal-repeatable-item') || [];
  divingRows.forEach(row => {
    const amount = parseFloat(getRepeatableFieldValue(row, 'total_amount')) || 0;
    total += amount;
  });
  
  // Update the total booking amount field
  const totalField = document.querySelector('[name="total_booking_amount"]');
  if (totalField) {
    totalField.value = total.toFixed(2);
  }
  
  console.log('💰 Total Booking Amount updated:', total);
}

function createVehicleRowElement() {
  const row = document.createElement('div');
  row.className = 'modal-repeatable-item';
  
  // Build vehicle dropdown options
  let vehicleOptions = '<option value="">Select a vehicle</option>';
  availableVehicles.forEach(vehicle => {
    vehicleOptions += `<option value="${vehicle.vehicle_id}" data-price="${vehicle.price_per_day}">${vehicle.name}</option>`;
  });
  
  row.innerHTML = `
    <button type="button" class="modal-row-remove" aria-label="Remove vehicle">Remove</button>
    <div class="modal-row-grid">
      <label class="modal-field">
        <span class="modal-field-label">Vehicle ID</span>
        <input type="text" data-field="vehicle_id" readonly>
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Vehicle Name</span>
        <select data-field="vehicle_name">
          ${vehicleOptions}
        </select>
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Rental Days</span>
        <input type="number" min="1" step="1" data-field="rental_days" value="1">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Total Amount</span>
        <input type="number" min="0" step="0.01" data-field="total_amount" readonly>
      </label>
    </div>
  `;
  
  return row;
}

function addVehicleRow(data = {}) {
  if (!ownerEditModal?.vehicleList) return;

  setRepeatableEmptyState(ownerEditModal.vehicleList, null);

  const row = createVehicleRowElement();
  ownerEditModal.vehicleList.appendChild(row);

  const vehicleIdField = row.querySelector('[data-field="vehicle_id"]');
  const vehicleNameField = row.querySelector('[data-field="vehicle_name"]');
  const rentalDaysField = row.querySelector('[data-field="rental_days"]');
  const totalAmountField = row.querySelector('[data-field="total_amount"]');

  const removeBtn = row.querySelector('.modal-row-remove');
  removeBtn?.addEventListener('click', async () => {
    // If this vehicle is from an existing booking, delete it from the database
    const vehicleId = vehicleIdField.value;
    if (vehicleId && currentEditingBooking && currentEditingBooking.id) {
      const confirmDelete = confirm('Are you sure you want to remove this vehicle from the booking?');
      if (!confirmDelete) return;
      
      try {
        const bookingId = String(currentEditingBooking.id).split(':')[0];
        const response = await fetch(`${API_URL}/api/bookings/${bookingId}/vehicles/${vehicleId}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to delete vehicle');
        }
        
        console.log('✅ Vehicle deleted from database');
      } catch (error) {
        console.error('❌ Error deleting vehicle:', error);
        alert('Failed to remove vehicle: ' + error.message);
        return; // Don't remove from UI if database deletion failed
      }
    }
    
    // Remove from UI
    row.remove();
    if (!ownerEditModal.vehicleList.querySelector('.modal-repeatable-item')) {
      setRepeatableEmptyState(ownerEditModal.vehicleList, VEHICLE_EMPTY_MESSAGE);
    }
    updateTotalBookingAmount(); // Update total when vehicle is removed
  });

  // Function to calculate total amount
  const calculateTotal = () => {
    const selectedOption = vehicleNameField.options[vehicleNameField.selectedIndex];
    const pricePerDay = parseFloat(selectedOption.dataset.price || 0);
    const days = parseInt(rentalDaysField.value || 1);
    const total = pricePerDay * days;
    totalAmountField.value = total.toFixed(2);
    updateTotalBookingAmount(); // Update total booking amount
  };

  // Event listener for vehicle selection change
  vehicleNameField.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const vehicleId = selectedOption.value;
    
    // Update vehicle ID field
    vehicleIdField.value = vehicleId;
    
    // Calculate total
    calculateTotal();
  });

  // Event listener for rental days change
  rentalDaysField.addEventListener('input', calculateTotal);

  // Set initial values if data is provided
  const vehicleId = data.vehicle_id ?? data.vehicle?.vehicle_id ?? '';
  const vehicleName = data.vehicle_name ?? data.vehicle?.name ?? '';

  if (vehicleId) {
    vehicleIdField.value = vehicleId;
    // Set the dropdown to the matching vehicle ID
    vehicleNameField.value = vehicleId;
  }
  
  rentalDaysField.value = data.rental_days ?? 1;
  totalAmountField.value = data.total_amount ?? '';
  
  // If we have existing data, calculate total if not already set
  if (vehicleId && !data.total_amount) {
    calculateTotal();
  }
}

function createVanRentalRowElement() {
  const row = document.createElement('div');
  row.className = 'modal-repeatable-item';
  
  // Create location type options
  const locationTypeOptions = `
    <option value="">Select Location Type</option>
    <option value="within">Within Puerto Galera</option>
    <option value="outside">Outside Puerto Galera</option>
  `;
  
  row.innerHTML = `
    <button type="button" class="modal-row-remove" aria-label="Remove van rental">Remove</button>
    <div class="modal-row-grid">
      <label class="modal-field">
        <span class="modal-field-label">Destination ID</span>
        <input type="text" data-field="van_destination_id" readonly>
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Location Type</span>
        <select data-field="location_type">
          ${locationTypeOptions}
        </select>
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Destination Place</span>
        <select data-field="choose_destination" disabled>
          <option value="">Select location type first</option>
        </select>
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
        <input type="number" min="1" step="1" data-field="number_of_days" value="1">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Total Amount</span>
        <input type="number" min="0" step="0.01" data-field="total_amount" readonly>
      </label>
    </div>
  `;
  return row;
}

function addVanRentalRow(data = {}) {
  if (!ownerEditModal?.vanRentalList) return;

  setRepeatableEmptyState(ownerEditModal.vanRentalList, null);

  const row = createVanRentalRowElement();
  ownerEditModal.vanRentalList.appendChild(row);

  const removeBtn = row.querySelector('.modal-row-remove');
  removeBtn?.addEventListener('click', async () => {
    // If this van rental is from an existing booking, delete it from the database
    const vanDestinationId = row.querySelector('[data-field="van_destination_id"]')?.value;
    if (vanDestinationId && currentEditingBooking && currentEditingBooking.id) {
      const confirmDelete = confirm('Are you sure you want to remove this van rental from the booking?');
      if (!confirmDelete) return;
      
      try {
        const bookingId = String(currentEditingBooking.id).split(':')[0];
        const response = await fetch(`${API_URL}/api/bookings/${bookingId}/van-rentals/${vanDestinationId}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to delete van rental');
        }
        
        console.log('✅ Van rental deleted from database');
      } catch (error) {
        console.error('❌ Error deleting van rental:', error);
        alert('Failed to remove van rental: ' + error.message);
        return; // Don't remove from UI if database deletion failed
      }
    }
    
    // Remove from UI
    row.remove();
    if (!ownerEditModal.vanRentalList.querySelector('.modal-repeatable-item')) {
      setRepeatableEmptyState(ownerEditModal.vanRentalList, VAN_EMPTY_MESSAGE);
    }
    updateTotalBookingAmount(); // Update total when van rental is removed
  });

  // Get field elements
  const locationTypeSelect = row.querySelector('[data-field="location_type"]');
  const destinationSelect = row.querySelector('[data-field="choose_destination"]');
  const destinationIdInput = row.querySelector('[data-field="van_destination_id"]');
  const tripTypeSelect = row.querySelector('[data-field="trip_type"]');
  const daysInput = row.querySelector('[data-field="number_of_days"]');
  const totalAmountInput = row.querySelector('[data-field="total_amount"]');

  // Function to update destination dropdown based on location type
  function updateDestinationOptions(locationType) {
    console.log('🔍 Updating destinations for location type:', locationType);
    console.log('📦 Available van destinations:', availableVanDestinations);
    
    if (!locationType) {
      destinationSelect.innerHTML = '<option value="">Select location type first</option>';
      destinationSelect.disabled = true;
      return;
    }

    // Filter destinations based on location type
    // Check if location_type contains the selected type (case-insensitive)
    const filteredDestinations = availableVanDestinations.filter(dest => {
      const destLocationType = (dest.location_type || '').toLowerCase();
      const selectedType = locationType.toLowerCase();
      
      console.log(`Checking destination: ${dest.destination_name}, location_type: "${destLocationType}" against "${selectedType}"`);
      
      // Match "within" with destinations that have "within" in location_type
      // Match "outside" with destinations that have "outside" in location_type
      return destLocationType.includes(selectedType);
    });

    console.log('✅ Filtered destinations:', filteredDestinations);

    destinationSelect.innerHTML = '<option value="">Select Destination</option>';
    
    if (filteredDestinations.length === 0) {
      console.warn('⚠️ No destinations found for location type:', locationType);
      destinationSelect.innerHTML += '<option value="" disabled>No destinations available</option>';
    }
    
    filteredDestinations.forEach(dest => {
      const option = document.createElement('option');
      option.value = dest.van_destination_id;
      option.textContent = dest.destination_name;
      option.dataset.onewayPrice = dest.oneway_price || 0;
      option.dataset.roundtripPrice = dest.roundtrip_price || 0;
      destinationSelect.appendChild(option);
    });

    destinationSelect.disabled = false;
  }

  // Function to calculate total amount
  function calculateVanTotal() {
    const selectedOption = destinationSelect.options[destinationSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
      totalAmountInput.value = '';
      return;
    }

    const tripType = tripTypeSelect.value;
    const days = parseInt(daysInput.value) || 1;
    
    let pricePerDay = 0;
    if (tripType === 'roundtrip') {
      pricePerDay = parseFloat(selectedOption.dataset.roundtripPrice) || 0;
    } else {
      pricePerDay = parseFloat(selectedOption.dataset.onewayPrice) || 0;
    }

    const total = pricePerDay * days;
    totalAmountInput.value = total.toFixed(2);
    updateTotalBookingAmount(); // Update total booking amount
  }

  // Event listener for location type change
  locationTypeSelect.addEventListener('change', (e) => {
    const locationType = e.target.value;
    updateDestinationOptions(locationType);
    destinationIdInput.value = '';
    totalAmountInput.value = '';
    updateTotalBookingAmount(); // Update total when destination is cleared
  });

  // Event listener for destination change
  destinationSelect.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (selectedOption && selectedOption.value) {
      destinationIdInput.value = selectedOption.value;
      calculateVanTotal();
    } else {
      destinationIdInput.value = '';
      totalAmountInput.value = '';
    }
  });

  // Event listeners for trip type and days change
  tripTypeSelect.addEventListener('change', calculateVanTotal);
  daysInput.addEventListener('input', calculateVanTotal);

  // Populate data if provided
  if (data.van_destination_id) {
    const destination = availableVanDestinations.find(d => d.van_destination_id === data.van_destination_id);
    if (destination) {
      const locationType = (destination.location_type || '').toLowerCase();
      locationTypeSelect.value = locationType;
      updateDestinationOptions(locationType);
      
      setTimeout(() => {
        destinationSelect.value = data.van_destination_id;
        destinationIdInput.value = data.van_destination_id;
      }, 50);
    }
  }

  const rawTripType = (data.trip_type || '').toLowerCase();
  const normalizedTripType = rawTripType === 'roundtrip' ? 'roundtrip' : 'oneway';
  tripTypeSelect.value = normalizedTripType;
  daysInput.value = data.number_of_days || 1;
  totalAmountInput.value = data.total_amount || '';
}

function createDivingRowElement() {
  const row = document.createElement('div');
  row.className = 'modal-repeatable-item';
  
  row.innerHTML = `
    <button type="button" class="modal-row-remove" aria-label="Remove diving">Remove</button>
    <div class="modal-row-grid">
      <label class="modal-field">
        <span class="modal-field-label">Diving Experience</span>
        <select data-field="diving_option_id"></select>
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Number of Divers</span>
        <input type="number" min="1" step="1" data-field="number_of_divers" value="1">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Price Per Head (₱)</span>
        <input type="number" min="0" step="0.01" data-field="price_per_head">
      </label>
      <label class="modal-field">
        <span class="modal-field-label">Total Amount (₱)</span>
        <input type="number" min="0" step="0.01" data-field="total_amount" readonly>
      </label>
    </div>
  `;
  
  return row;
}

function addDivingRow(data = {}) {
  if (!ownerEditModal?.divingList) return;

  setRepeatableEmptyState(ownerEditModal.divingList, null);

  const row = createDivingRowElement();
  ownerEditModal.divingList.appendChild(row);

  const removeBtn = row.querySelector('.modal-row-remove');
  const diversInput = row.querySelector('[data-field="number_of_divers"]');
  const pricePerHeadInput = row.querySelector('[data-field="price_per_head"]');
  const totalAmountInput = row.querySelector('[data-field="total_amount"]');
  const divingSelect = row.querySelector('[data-field="diving_option_id"]');

  const normalizedAvailableDiving = Array.isArray(availableDiving) ? availableDiving : [];

  const populateDivingSelect = () => {
    if (!divingSelect) return;

    divingSelect.innerHTML = '<option value="">Select Diving Experience</option>';

    if (normalizedAvailableDiving.length === 0) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'No diving options available';
      emptyOption.disabled = true;
      divingSelect.appendChild(emptyOption);
      divingSelect.setAttribute('disabled', 'disabled');
      return;
    }

    divingSelect.removeAttribute('disabled');

    normalizedAvailableDiving.forEach(diving => {
      const option = document.createElement('option');
      const optionId = diving.diving_id ?? diving.id ?? '';
      option.value = optionId;
      option.dataset.price = diving.price_per_head ?? 0;
      option.textContent = diving.name || `Diving Option ${optionId}`;
      divingSelect.appendChild(option);
    });
  };

  populateDivingSelect();

  const getDefaultPricePerHead = () => {
    if (normalizedAvailableDiving.length === 0) return 0;
    const defaultOption = normalizedAvailableDiving[0];
    return Number(defaultOption?.price_per_head) || 0;
  };

  const calculateTotal = () => {
    const divers = parseInt(diversInput.value, 10);
    const pricePerHead = parseFloat(pricePerHeadInput.value);

    const safeDivers = Number.isFinite(divers) && divers > 0 ? divers : 0;
    const safePrice = Number.isFinite(pricePerHead) ? pricePerHead : 0;
    const total = safeDivers * safePrice;

    totalAmountInput.value = total > 0 ? total.toFixed(2) : '0.00';
    updateTotalBookingAmount();
  };

  const applySelectionToInputs = () => {
    if (!divingSelect) return;
    const selectedOption = divingSelect.options[divingSelect.selectedIndex];
    if (selectedOption && selectedOption.value) {
      const optionPrice = parseFloat(selectedOption.dataset.price || '0');
      if (Number.isFinite(optionPrice)) {
        pricePerHeadInput.value = optionPrice.toFixed(2);
      }
    } else {
      pricePerHeadInput.value = getDefaultPricePerHead().toFixed(2);
    }
    calculateTotal();
  };

  removeBtn?.addEventListener('click', async () => {
    if (currentEditingBooking && currentEditingBooking.id) {
      const confirmDelete = confirm('Are you sure you want to remove this diving booking?');
      if (!confirmDelete) return;

      try {
        const bookingId = String(currentEditingBooking.id).split(':')[0];
        const response = await fetch(`${API_URL}/api/bookings/${bookingId}/diving`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to delete diving booking');
        }

        console.log('✅ Diving booking deleted from database');
      } catch (error) {
        console.error('❌ Error deleting diving booking:', error);
        alert('Failed to remove diving booking: ' + error.message);
        return;
      }
    }

    row.remove();
    if (!ownerEditModal.divingList.querySelector('.modal-repeatable-item')) {
      setRepeatableEmptyState(ownerEditModal.divingList, null);
    }
    updateTotalBookingAmount();
  });

  diversInput.addEventListener('input', calculateTotal);
  pricePerHeadInput.addEventListener('input', calculateTotal);
  divingSelect?.addEventListener('change', () => {
    if (divingSelect.hasAttribute('disabled')) return;
    applySelectionToInputs();
  });

  const initializeFromData = () => {
    const initialDivers = Number.parseInt(data.number_of_divers, 10);
    diversInput.value = Number.isInteger(initialDivers) && initialDivers > 0 ? initialDivers : (data.number_of_divers === 0 ? 0 : 1);

    let initialPrice = data.price_per_head !== undefined && data.price_per_head !== null
      ? Number(data.price_per_head)
      : getDefaultPricePerHead();

    if (!Number.isFinite(initialPrice)) {
      initialPrice = getDefaultPricePerHead();
    }

    pricePerHeadInput.value = initialPrice > 0 ? initialPrice.toFixed(2) : initialPrice.toString();

    if (divingSelect && !divingSelect.hasAttribute('disabled')) {
      let matchedOption = null;

      if (data.diving_option_id) {
        matchedOption = Array.from(divingSelect.options).find(option => option.value === String(data.diving_option_id));
      }

      if (!matchedOption && data.diving_type) {
        const normalizedType = String(data.diving_type).trim().toLowerCase();
        matchedOption = Array.from(divingSelect.options).find(option => option.textContent.trim().toLowerCase() === normalizedType);
      }

      if (!matchedOption && data.diving_type) {
        const fallbackOption = document.createElement('option');
        fallbackOption.value = data.diving_option_id ? String(data.diving_option_id) : `legacy-${Date.now()}`;
        fallbackOption.textContent = data.diving_type;
        fallbackOption.dataset.price = initialPrice;
        divingSelect.appendChild(fallbackOption);
        matchedOption = fallbackOption;
      }

      if (matchedOption) {
        divingSelect.value = matchedOption.value;
        if (!matchedOption.dataset.price) {
          matchedOption.dataset.price = initialPrice;
        }
      } else if (normalizedAvailableDiving.length > 0) {
        divingSelect.value = String(normalizedAvailableDiving[0].diving_id ?? normalizedAvailableDiving[0].id ?? '');
      }
    }

    if (divingSelect && divingSelect.value) {
      applySelectionToInputs();
    } else {
      if (!divingSelect?.hasAttribute('disabled')) {
        pricePerHeadInput.value = getDefaultPricePerHead().toFixed(2);
      }
      calculateTotal();
    }

    if (data.total_amount !== undefined && data.total_amount !== null) {
      const totalValue = Number(data.total_amount);
      if (Number.isFinite(totalValue)) {
        totalAmountInput.value = totalValue.toFixed(2);
      }
    }
  };

  if (!data || Object.keys(data).length === 0) {
    if (divingSelect && !divingSelect.hasAttribute('disabled') && normalizedAvailableDiving.length > 0) {
      divingSelect.value = String(normalizedAvailableDiving[0].diving_id ?? normalizedAvailableDiving[0].id ?? '');
    }
    applySelectionToInputs();
    return;
  }

  initializeFromData();
}

function getRepeatableFieldValue(row, field) {
  const el = row.querySelector(`[data-field="${field}"]`);
  if (!el) return '';
  
  // For vehicle_name field which is now a select, we want to get the text of selected option
  if (field === 'vehicle_name' && el.tagName === 'SELECT') {
    const selectedOption = el.options[el.selectedIndex];
    return selectedOption ? selectedOption.text : '';
  }
  
  // For choose_destination field which is now a select, we want to get the text of selected option
  if (field === 'choose_destination' && el.tagName === 'SELECT') {
    const selectedOption = el.options[el.selectedIndex];
    return selectedOption ? selectedOption.text : '';
  }
  
  return el.value ?? '';
}

function collectBookingFormData() {
  if (!ownerEditModal?.form) return null;

  const formData = new FormData(ownerEditModal.form);
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
    vehicles: [],
    van_rentals: [],
    diving: []
  };

  const vehicleRows = ownerEditModal.vehicleList
    ? Array.from(ownerEditModal.vehicleList.querySelectorAll('.modal-repeatable-item'))
    : [];

  vehicleRows.forEach(row => {
    const vehicleId = emptyToNull(trim(getRepeatableFieldValue(row, 'vehicle_id')));
    
    // Only include vehicle if vehicle_id is present
    if (vehicleId) {
      const vehicle = {
        vehicle_id: vehicleId,
        rental_days: parseIntegerField(getRepeatableFieldValue(row, 'rental_days')),
        total_amount: parseNumberField(getRepeatableFieldValue(row, 'total_amount'))
      };
      payload.vehicles.push(vehicle);
    }
  });

  const vanRows = ownerEditModal.vanRentalList
    ? Array.from(ownerEditModal.vanRentalList.querySelectorAll('.modal-repeatable-item'))
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

  const divingRows = ownerEditModal.divingList
    ? Array.from(ownerEditModal.divingList.querySelectorAll('.modal-repeatable-item'))
    : [];

  divingRows.forEach(row => {
    const divingOptionId = emptyToNull(trim(getRepeatableFieldValue(row, 'diving_option_id')));
    const diving = {
      number_of_divers: parseIntegerField(getRepeatableFieldValue(row, 'number_of_divers')),
      price_per_head: parseNumberField(getRepeatableFieldValue(row, 'price_per_head')),
      total_amount: parseNumberField(getRepeatableFieldValue(row, 'total_amount'))
    };

    if (divingOptionId) {
      diving.diving_option_id = divingOptionId;
    }

    if (
      diving.number_of_divers !== null ||
      diving.price_per_head !== null ||
      diving.total_amount !== null ||
      (diving.diving_option_id && String(diving.diving_option_id).trim().length > 0)
    ) {
      payload.diving.push(diving);
    }
  });

  // Collect tour data if booking type is tour_only
  if (payload.booking_type === 'tour_only') {
    const tourType = trim(formData.get('tour_type'));
    
    if (tourType) {
      // Map tour type to category
      const categoryMap = {
        'island': 'Island Tour',
        'inland': 'Inland Tour',
        'snorkeling': 'Snorkeling Tour'
      };
      
      const tourCategory = categoryMap[tourType];
      if (tourCategory) {
        payload.booking_preferences = `Tour Only: ${tourCategory}`;
      }
    }
  }

  // Collect package data if booking type is package_only
  if (payload.booking_type === 'package_only') {
    const packageId = trim(formData.get('package_id'));
    
    if (packageId) {
      payload.package_only_id = packageId;
      
      // Find the package to get its category
      const pkg = availablePackages.find(p => p.package_only_id === packageId);
      if (pkg) {
        payload.booking_preferences = `Package Only: ${pkg.category}`;
      }
    }
  }

  return payload;
}

async function submitBookingEditForm(event) {
  event.preventDefault();

  if (!currentEditingBooking) {
    console.warn('No booking selected for editing.');
    return;
  }

  if (!ownerEditModal?.form) {
    console.warn('Edit modal form is not available.');
    return;
  }

  const submitButton = ownerEditModal.saveBtn;
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
    ownerEditModal.cancelBtn?.setAttribute('disabled', 'disabled');
    ownerEditModal.addVehicleBtn?.setAttribute('disabled', 'disabled');
    ownerEditModal.addVanRentalBtn?.setAttribute('disabled', 'disabled');
    ownerEditModal.addDivingBtn?.setAttribute('disabled', 'disabled');

    const payloadForApi = { ...payload };
    delete payloadForApi.booking_id;
    payloadForApi.status = payloadForApi.status || currentEditingBooking.status;

    // Ensure we have a clean booking ID without any suffixes
    const bookingId = String(currentEditingBooking.id).split(':')[0];
    console.log('🔄 Updating booking with ID:', bookingId);
    console.log('📤 Payload:', payloadForApi);
    
    // Validate JSON before sending
    let jsonPayload;
    try {
      jsonPayload = JSON.stringify(payloadForApi);
      console.log('✅ JSON is valid, length:', jsonPayload.length);
    } catch (jsonError) {
      console.error('❌ JSON stringify error:', jsonError);
      console.error('Problem field:', payloadForApi);
      throw new Error('Invalid data format. Please check all fields.');
    }

    const response = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonPayload
    });

    console.log('📥 Response status:', response.status, response.statusText);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    console.log('📥 Response content-type:', contentType);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const textResponse = await response.text();
      console.error('❌ Non-JSON response:', textResponse);
      throw new Error(`Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 200)}`);
    }

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
    updateOwnerStats();

    alert('Booking updated successfully.');
  } catch (error) {
    console.error('Error updating booking:', error);
    alert(error.message || 'Failed to update booking. Please try again.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText || 'Save Changes';
    }
    ownerEditModal.cancelBtn?.removeAttribute('disabled');
    ownerEditModal.addVehicleBtn?.removeAttribute('disabled');
    ownerEditModal.addVanRentalBtn?.removeAttribute('disabled');
    ownerEditModal.addDivingBtn?.removeAttribute('disabled');
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
          <button class="action-btn btn-edit" data-action="edit">Edit</button>
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
    
    // Add event listeners to buttons
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const editBtn = tr.querySelector('.btn-edit');
    
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (editBtn) editBtn.addEventListener('click', () => openBookingEditModal(b));
    
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
          <button class="action-btn btn-edit" data-action="edit">Edit</button>
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
    
    // Add event listeners to buttons
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const editBtn = tr.querySelector('.btn-edit');
    
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (editBtn) editBtn.addEventListener('click', () => openBookingEditModal(b));
    
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

  setupBookingEditModal();

  // Show loading screen immediately
  showLoadingScreen();
  
  // Check session before loading dashboard
  if (checkSession()) {
    try {
      // Load vehicles, van destinations, tours, packages, hotels, diving, and bookings from API
      await loadVehicles(); // Load vehicles first
      await loadVanDestinations(); // Load van destinations
      await loadTours(); // Load tours
      await loadPackages(); // Load packages
      await loadHotels(); // Load hotels
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
  // Redirect to login page
  window.location.href = 'login.html';
}
