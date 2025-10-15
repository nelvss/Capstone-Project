// Staff Dashboard JavaScript - Connected to same data as owner dashboard
// Same booking data structure as dashboard.js

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
    email: 'elopez@yahoo.com',
    status: 'pending'
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
    status: 'pending'
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
    status: 'pending'
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
    status: 'pending'
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
    status: 'pending'
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
    status: 'pending'
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
    status: 'pending'
  }
];

let currentStatusFilter = 'all';

// Render main table with status column and action buttons
function renderTable() {
  const tbody = document.getElementById('booking-table-body');
  tbody.innerHTML = '';
  
  const rows = bookings
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => currentStatusFilter === 'all' ? true : b.status === currentStatusFilter);

  rows.forEach(({ b: booking, i: index }) => {
    const tr = document.createElement('tr');
    
    // Get status display with appropriate styling
    const statusDisplay = getStatusDisplay(booking.status);
    
    tr.innerHTML = `
      <td>${booking.name}</td>
      <td>${booking.services}</td>
      <td>${booking.rental}</td>
      <td>${booking.arrival}</td>
      <td>${booking.departure}</td>
      <td>${booking.hotel}</td>
      <td>${booking.price}</td>
      <td>${booking.contact}</td>
      <td>${booking.email}</td>
      <td>${statusDisplay}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-confirm" onclick="confirmBooking(${index})">Confirm</button>
          <button class="action-btn btn-cancel" onclick="cancelBooking(${index})">Cancel</button>
          <button class="action-btn btn-reschedule" onclick="rescheduleBooking(${index})">Reschedule</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateStats();
  renderBuckets();
}

// Get status display with proper styling
function getStatusDisplay(status) {
  const statusClass = `status-badge status-${status}`;
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="${statusClass}">${statusText}</span>`;
}

// Staff action functions
function confirmBooking(index) {
  const booking = bookings[index];
  if (booking && confirm(`Confirm booking for ${booking.name}?`)) {
    booking.status = 'confirmed';
    renderTable();
  }
}

function cancelBooking(index) {
  const booking = bookings[index];
  if (booking && confirm(`Are you sure you want to cancel the booking for ${booking.name}?`)) {
    booking.status = 'cancelled';
    renderTable();
  }
}

function rescheduleBooking(index) {
  const booking = bookings[index];
  if (booking) {
    const newArrival = prompt(`Enter new arrival date for ${booking.name}:`, booking.arrival);
    const newDeparture = prompt(`Enter new departure date for ${booking.name}:`, booking.departure);
    
    if (newArrival && newDeparture) {
      booking.arrival = newArrival;
      booking.departure = newDeparture;
      booking.status = 'rescheduled';
      renderTable(); // Refresh the table to show updated dates
    }
  }
}

// Render status buckets (Confirmed / Cancelled / Rescheduled)
function renderBuckets() {
  const containers = {
    confirmed: document.getElementById('confirmed-list'),
    cancelled: document.getElementById('cancelled-list'),
    rescheduled: document.getElementById('rescheduled-list')
  };
  const counters = {
    confirmed: document.getElementById('confirmed-count'),
    cancelled: document.getElementById('cancelled-count'),
    rescheduled: document.getElementById('rescheduled-count')
  };

  Object.values(containers).forEach(el => el && (el.innerHTML = ''));

  const grouped = { confirmed: [], cancelled: [], rescheduled: [] };
  bookings.forEach((b, i) => {
    if (grouped[b.status]) grouped[b.status].push({ b, i });
  });

  Object.keys(grouped).forEach(status => {
    const list = containers[status];
    const count = counters[status];
    if (!list) return;

    grouped[status].forEach(({ b, i }) => {
      const li = document.createElement('li');
      li.className = 'bucket-item';
      li.innerHTML = `
        <div class="name">${b.name}</div>
        <div class="meta">${b.arrival} → ${b.departure} • ${b.services}</div>
      `;
      li.addEventListener('click', () => showDetails(i));
      list.appendChild(li);
    });

    if (count) count.textContent = grouped[status].length;
  });
}

// Status filter from dropdown
function filterBookings() {
  const sel = document.getElementById('status-filter');
  currentStatusFilter = sel ? sel.value : 'all';
  renderTable();
}

// Update top statistic cards
function updateStats() {
  const totals = bookings.reduce((acc, b) => {
    acc.total += 1;
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, { total: 0, pending: 0, confirmed: 0, cancelled: 0, rescheduled: 0 });

  const byId = id => document.getElementById(id);
  const set = (id, val) => { const el = byId(id); if (el) el.textContent = String(val); };
  set('total-bookings', totals.total);
  set('pending-bookings', totals.pending);
  set('confirmed-bookings', totals.confirmed);
  set('cancelled-bookings', totals.cancelled);
}

// Modal helpers
function showDetails(index) {
  const b = bookings[index];
  const modal = document.getElementById('details-modal');
  const body = document.getElementById('details-body');
  if (!b || !modal || !body) return;

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px">
      <div><strong>Name:</strong></div><div>${b.name}</div>
      <div><strong>Email:</strong></div><div>${b.email}</div>
      <div><strong>Contact:</strong></div><div>${b.contact}</div>
      <div><strong>Services:</strong></div><div>${b.services}</div>
      <div><strong>Rental:</strong></div><div>${b.rental}</div>
      <div><strong>Hotel:</strong></div><div>${b.hotel}</div>
      <div><strong>Arrival:</strong></div><div>${b.arrival}</div>
      <div><strong>Departure:</strong></div><div>${b.departure}</div>
      <div><strong>Total Price:</strong></div><div>${b.price}</div>
      <div><strong>Status:</strong></div><div>${b.status.toUpperCase()}</div>
    </div>
  `;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

// Sidebar toggle functionality (same as owner dashboard)
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

// Logout functionality (staff version)
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear session data
    localStorage.removeItem('userSession');
    
    // Redirect to login page
    window.location.href = '../owner/login.html';
  }
}

// Session checking
function checkSession() {
  const userSession = localStorage.getItem('userSession');
  
  if (!userSession) {
    // No session found, redirect to login
    window.location.href = '../owner/login.html';
    return false;
  }
  
  try {
    const session = JSON.parse(userSession);
    
    // Check if user is staff
    if (session.type !== 'staff') {
      alert('Access denied. Staff access required.');
      window.location.href = '../owner/login.html';
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
    window.location.href = '../owner/login.html';
    return false;
  }
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
    tr.innerHTML = `
      <td>${b.name}</td>
      <td>${b.services}</td>
      <td>${b.rental}</td>
      <td>${b.arrival}</td>
      <td>${b.departure}</td>
      <td>${b.hotel}</td>
      <td>${b.price}</td>
      <td>${b.contact}</td>
      <td>${b.email}</td>
      <td><span class="status-badge status-${b.status}">${b.status.toUpperCase()}</span></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-confirm" data-action="confirm">Confirm</button>
          <button class="action-btn btn-cancel" data-action="cancel">Cancel</button>
          <button class="action-btn btn-reschedule" data-action="reschedule">Reschedule</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Show message if no results found
  if (filteredBookings.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="11" style="text-align: center; padding: 20px; color: #64748b;">No bookings found matching "${searchTerm}"</td>`;
    tbody.appendChild(tr);
  }
}

// Initialize staff dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check session before loading dashboard
  if (checkSession()) {
    renderTable();
    
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
    
    // Set staff welcome message
    console.log('Staff Dashboard loaded successfully');
    console.log(`Total bookings: ${bookings.length}`);
  }
});