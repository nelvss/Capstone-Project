// Staff Dashboard JavaScript - mirror Owner Dashboard behavior, adapted for staff

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

let staffStatusFilter = 'all';

// API Configuration (same endpoint if used by owners)
const API_URL = 'http://localhost:3000';

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
  if (confirm(`Are you sure you want to confirm the booking for ${booking.name}?`)) {
    button.disabled = true;
    button.textContent = 'Sending...';
    const result = await sendEmail('confirm', booking);
    if (result.success) {
      alert(`✅ Confirmation email sent successfully to ${booking.email}`);
      button.textContent = '✓ Confirmed';
      button.style.backgroundColor = '#10b981';
      booking.status = 'confirmed';
      renderTable();
    } else {
      alert(`❌ Failed to send email: ${result.message}`);
      button.disabled = false;
      button.textContent = 'Confirm';
    }
  }
}

async function handleCancel(booking, button) {
  if (confirm(`Are you sure you want to cancel the booking for ${booking.name}?`)) {
    button.disabled = true;
    button.textContent = 'Sending...';
    const result = await sendEmail('cancel', booking);
    if (result.success) {
      alert(`✅ Cancellation email sent successfully to ${booking.email}`);
      button.textContent = '✓ Cancelled';
      button.style.backgroundColor = '#ef4444';
      booking.status = 'cancelled';
      renderTable();
    } else {
      alert(`❌ Failed to send email: ${result.message}`);
      button.disabled = false;
      button.textContent = 'Cancel';
    }
  }
}

async function handleReschedule(booking, button) {
  if (confirm(`Are you sure you want to send a reschedule request for ${booking.name}?`)) {
    button.disabled = true;
    button.textContent = 'Sending...';
    const result = await sendEmail('reschedule', booking);
    if (result.success) {
      alert(`✅ Reschedule email sent successfully to ${booking.email}`);
      button.textContent = '✓ Rescheduled';
      button.style.backgroundColor = '#3b82f6';
      booking.status = 'rescheduled';
      renderTable();
    } else {
      alert(`❌ Failed to send email: ${result.message}`);
      button.disabled = false;
      button.textContent = 'Reschedule';
    }
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
      : staffStatusFilter === 'cancelled' ? `
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
      </td>` : staffStatusFilter === 'rescheduled' ? `
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
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const rescheduleBtn = tr.querySelector('.btn-reschedule');
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (rescheduleBtn) rescheduleBtn.addEventListener('click', () => handleReschedule(b, rescheduleBtn));
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
    const actions = staffStatusFilter === 'all'
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
      : staffStatusFilter === 'cancelled' ? `
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
      </td>` : staffStatusFilter === 'rescheduled' ? `
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
    const confirmBtn = tr.querySelector('.btn-confirm');
    const cancelBtn = tr.querySelector('.btn-cancel');
    const rescheduleBtn = tr.querySelector('.btn-reschedule');
    if (confirmBtn) confirmBtn.addEventListener('click', () => handleConfirm(b, confirmBtn));
    if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(b, cancelBtn));
    if (rescheduleBtn) rescheduleBtn.addEventListener('click', () => handleReschedule(b, rescheduleBtn));
    tbody.appendChild(tr);
  });
  if (filteredBookings.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="10" style="text-align: center; padding: 20px; color: #64748b;">No bookings found matching "${searchTerm}"</td>`;
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
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userSession');
    window.location.href = '../owner/login.html';
  }
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

document.addEventListener('DOMContentLoaded', function() {
  if (checkSession()) {
    renderTable();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.trim();
        if (searchTerm === '') { renderTable(); } else { filterTable(searchTerm); }
      });
    }
  }
});