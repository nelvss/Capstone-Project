const bookings = [
  {
    name: 'Elizabeth Lopez',
    services: 'Hotel Booking, Car Rental',
    rental: 'Car Rental',
    arrival: '2023-10-01',
    departure: '2023-10-05',
    hotel: 'Grand Hotel',
    price: '$500',
    contact: '123-456-7890',
    email: 'ceddreyes21@gmail.com',
    status: 'pending',
  },
  {
    name: 'Mathew Martinez',
    services: 'Hotel Booking',
    rental: 'None',
    arrival: '2023-11-01',
    departure: '2023-11-05',
    hotel: 'City Inn',
    price: '$350',
    contact: '555-123-4567',
    email: 'mmartinez1997@gmail.com',
    status: 'pending',
  },
  {
    name: 'Elizabeth Hall',
    services: 'Car Rental',
    rental: 'Car Rental',
    arrival: '2023-12-10',
    departure: '2023-12-15',
    hotel: 'None',
    price: '$200',
    contact: '555-234-5678',
    email: 'elizabeth_hall_1999@gmail.com',
    status: 'pending',
  },
  {
    name: 'Maria White',
    services: 'Hotel Booking',
    rental: 'None',
    arrival: '2023-09-20',
    departure: '2023-09-25',
    hotel: 'Sunrise Hotel',
    price: '$400',
    contact: '555-345-6789',
    email: 'maria_white@hotmail.com',
    status: 'pending',
  },
  {
    name: 'Elizabeth Watson',
    services: 'Hotel Booking, Car Rental',
    rental: 'Car Rental',
    arrival: '2023-08-05',
    departure: '2023-08-10',
    hotel: 'Ocean View',
    price: '$600',
    contact: '555-456-7890',
    email: 'ewatson@yahoo.com',
    status: 'pending',
  },
  {
    name: 'Elizabeth Allen',
    services: 'Hotel Booking',
    rental: 'None',
    arrival: '2023-07-15',
    departure: '2023-07-20',
    hotel: 'Mountain Lodge',
    price: '$300',
    contact: '555-567-8901',
    email: 'eallen@gmail.com',
    status: 'pending',
  },
  {
    name: 'Caleb Jones',
    services: 'Car Rental',
    rental: 'Car Rental',
    arrival: '2023-06-10',
    departure: '2023-06-15',
    hotel: 'None',
    price: '$150',
    contact: '555-678-9012',
    email: 'calebjones@gmail.com',
    status: 'pending',
  },
];

let ownerStatusFilter = 'all';

// API Configuration
const API_URL = 'http://localhost:3000'; // Change this to your server URL

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
}

// Handle cancel button click
async function handleCancel(booking, button) {
  // Disable button and show loading state
  button.disabled = true;
  button.textContent = 'Sending...';
  
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
}

// Handle reschedule button click
async function handleReschedule(booking, button) {
  // Disable button and show loading state
  button.disabled = true;
  button.textContent = 'Sending...';
  
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
}

function renderTable() {
  const tbody = document.getElementById('booking-table-body');
  tbody.innerHTML = '';
  const rows = bookings.filter(b => ownerStatusFilter === 'all' ? (b.status === 'pending') : (b.status === ownerStatusFilter));
  rows.forEach(b => {
    const tr = document.createElement('tr');
    const actions = ownerStatusFilter === 'all' 
      ? `
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
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
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <span class="action-badge cancelled">Cancelled</span>
      </td>` : ownerStatusFilter === 'rescheduled' ? `
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
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
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
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
  tbody.innerHTML = '';
  
  const filteredBookings = bookings.filter(b => {
    const searchLower = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(searchLower) ||
      b.services.toLowerCase().includes(searchLower) ||
      b.rental.toLowerCase().includes(searchLower) ||
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
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
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
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td>
        <span class="action-badge cancelled">Cancelled</span>
      </td>` : ownerStatusFilter === 'rescheduled' ? `
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
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
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
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
    tr.innerHTML = `<td colspan="10" style="text-align: center; padding: 20px; color: #64748b;">No bookings found matching "${searchTerm}"</td>`;
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

document.addEventListener('DOMContentLoaded', function() {
  // Check session before loading dashboard
  if (checkSession()) {
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
