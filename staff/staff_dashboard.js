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

// Render table with status column and action buttons
function renderTable() {
  const tbody = document.getElementById('booking-table-body');
  tbody.innerHTML = '';
  
  bookings.forEach((booking, index) => {
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
    alert(`Booking for ${booking.name} has been confirmed!`);
    // In a real app, this would update the database
    console.log(`Confirmed booking for ${booking.name}`);
  }
}

function cancelBooking(index) {
  const booking = bookings[index];
  if (booking && confirm(`Are you sure you want to cancel the booking for ${booking.name}?`)) {
    alert(`Booking for ${booking.name} has been cancelled!`);
    // In a real app, this would update the database
    console.log(`Cancelled booking for ${booking.name}`);
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
      alert(`Booking for ${booking.name} has been rescheduled!`);
      renderTable(); // Refresh the table to show updated dates
    }
  }
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

// Initialize staff dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check session before loading dashboard
  if (checkSession()) {
    renderTable();
    
    // Set staff welcome message
    console.log('Staff Dashboard loaded successfully');
    console.log(`Total bookings: ${bookings.length}`);
  }
});