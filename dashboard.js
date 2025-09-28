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
  },
];

function renderTable() {
  const tbody = document.getElementById('booking-table-body');
  tbody.innerHTML = '';
  bookings.forEach(b => {
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
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-confirm">Confirm</button>
          <button class="action-btn btn-cancel">Cancel</button>
          <button class="action-btn btn-reschedule">Reschedule</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', renderTable);

// Sidebar toggle functionality
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
}

// Logout functionality
function handleLogout() {
  // Show confirmation dialog
  if (confirm('Are you sure you want to logout?')) {
    // Clear any stored session data if needed
    // localStorage.clear(); // Uncomment if you're using localStorage for sessions
    
    // Redirect to login page
    window.location.href = 'login.html';
  }
}
