// Owner Payment Page JavaScript

// Session checking
function checkOwnerSession() {
  const userSession = localStorage.getItem('userSession');
  
  if (!userSession) {
    window.location.href = 'login.html';
    return false;
  }
  
  try {
    const session = JSON.parse(userSession);
    
    if (session.type !== 'owner') {
      alert('Access denied. Owner access required.');
      window.location.href = 'login.html';
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
    return false;
  }
}

// Global state
let allPayments = [];
let currentFilter = 'all';

// Smooth page navigation with transition
function navigateWithTransition(url) {
  document.body.classList.add('page-transition');
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// Sidebar toggle and logout functionality
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
  }
}

// Load payments from API
async function loadPayments() {
  try {
    console.log('Loading payments...');
    
    const response = await fetch('http://localhost:3000/api/payments');
    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to load payments:', result.message);
      document.getElementById('receipts-gallery').innerHTML = '<p>Failed to load payments. Please try again later.</p>';
      return;
    }
    
    allPayments = result.payments || [];
    console.log('Payments loaded:', allPayments.length);
    
    renderPayments(allPayments);
    
  } catch (error) {
    console.error('Error loading payments:', error);
    document.getElementById('receipts-gallery').innerHTML = '<p>Error loading payments. Please refresh the page.</p>';
  }
}

// Render payment cards
function renderPayments(payments) {
  const gallery = document.getElementById('receipts-gallery');
  
  if (!gallery) {
    console.error('Receipts gallery element not found');
    return;
  }
  
  if (payments.length === 0) {
    gallery.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">No payments found. Use the "Record Payment" button to add a payment.</p>';
    return;
  }
  
  gallery.innerHTML = payments.map(payment => {
    const booking = payment.bookings || {};
    const customerName = booking.customer_first_name && booking.customer_last_name
      ? `${booking.customer_first_name} ${booking.customer_last_name}`
      : 'Unknown Customer';
    
    const paymentDate = new Date(payment.payment_date);
    const formattedDate = paymentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Use data attribute for safer handling of URLs
    const receiptImage = payment.receipt_image_url 
      ? `<img src="${payment.receipt_image_url}" alt="Receipt" class="receipt-image" data-receipt-url="${payment.receipt_image_url}">`
      : '<div class="no-receipt">No Receipt</div>';
    
    return `
      <div class="receipt-item" data-date="${paymentDate.toISOString().split('T')[0]}" data-customer="${customerName.toLowerCase()}">
        <div class="receipt-header">
          <span class="receipt-id">${formattedDate}</span>
          <span class="receipt-date">${payment.booking_id}</span>
        </div>
        <div class="receipt-preview">
          ${receiptImage}
        </div>
        <div class="receipt-details">
          <p class="customer-name">${customerName}</p>
          <p class="amount">₱${parseFloat(payment.paid_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
          <span class="payment-method">${payment.payment_method}</span>
          <div class="balance-info" style="margin-top: 8px; font-size: 0.85rem; color: #666;">
            ${payment.remaining_balance > 0 
              ? `<span style="color: #ef4444;">Balance: ₱${parseFloat(payment.remaining_balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>`
              : '<span style="color: #10b981;">Fully Paid</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners to receipt images
  const receiptImages = gallery.querySelectorAll('.receipt-image');
  receiptImages.forEach(img => {
    img.addEventListener('click', function() {
      const imageUrl = this.getAttribute('data-receipt-url');
      if (imageUrl) {
        openReceiptModal(imageUrl);
      }
    });
  });
}

// Receipt filtering functionality
function filterReceipts(period) {
  currentFilter = period;
  const receipts = document.querySelectorAll('.receipt-item');
  const buttons = document.querySelectorAll('.filter-btn');
  
  // Update active button
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const today = new Date();
  const currentDate = today.toISOString().split('T')[0];
  
  receipts.forEach(receipt => {
    const receiptDate = receipt.getAttribute('data-date');
    let showReceipt = false;
    
    switch(period) {
      case 'all':
        showReceipt = true;
        break;
      case 'today':
        showReceipt = receiptDate === currentDate;
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        showReceipt = new Date(receiptDate) >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        showReceipt = new Date(receiptDate) >= monthAgo;
        break;
    }
    
    receipt.style.display = showReceipt ? 'block' : 'none';
  });
}

// Search receipts functionality
function searchReceipts() {
  const searchTerm = document.getElementById('receipt-search').value.toLowerCase();
  const receipts = document.querySelectorAll('.receipt-item');
  
  receipts.forEach(receipt => {
    const customer = receipt.getAttribute('data-customer').toLowerCase();
    const receiptId = receipt.querySelector('.receipt-id')?.textContent.toLowerCase() || '';
    
    if (customer.includes(searchTerm) || receiptId.includes(searchTerm)) {
      receipt.style.display = 'block';
    } else {
      receipt.style.display = 'none';
    }
  });
}

// Modal functionality
function openReceiptModal(imageUrl) {
  const modal = document.getElementById('receiptModal');
  const modalImage = document.getElementById('modalReceiptImage');
  
  // Only show receipt image if it exists
  if (modalImage && imageUrl) {
    console.log('Opening modal with image URL:', imageUrl);
    
    // Reset the image
    modalImage.src = '';
    modalImage.style.display = 'none';
    
    // Show the modal first
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Load the image
    modalImage.onload = function() {
      console.log('Image loaded successfully');
      modalImage.style.display = 'block';
      this.onerror = null; // Clear any existing error handlers
    };
    
    // Add error handling for failed image loads
    modalImage.onerror = function() {
      console.error('Failed to load image:', imageUrl);
      alert('Failed to load the receipt image. Please check if the image URL is valid.');
      closeReceiptModal();
    };
    
    // Set the src after handlers are attached
    modalImage.src = imageUrl;
  } else {
    alert('No receipt image available for this payment.');
    return;
  }
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Modal actions
function printReceipt() {
  const receiptImage = document.getElementById('modalReceiptImage').src;
  const printWindow = window.open('', '_blank');
  const htmlContent = '<html><head><title>Print Receipt</title></head><body style="margin: 0; padding: 20px; text-align: center;"><img src="' + receiptImage + '" style="max-width: 100%; height: auto;"></body></html>';
  printWindow.document.write(htmlContent);
  printWindow.onload = function() { 
    printWindow.print(); 
    printWindow.close(); 
  };
}

function downloadReceipt() {
  const receiptImage = document.getElementById('modalReceiptImage');
  const receiptId = document.getElementById('modalReceiptId').textContent;
  
  const link = document.createElement('a');
  link.download = `receipt_${receiptId.replace('#', '')}.jpg`;
  link.href = receiptImage.src;
  link.click();
}

function emailReceipt() {
  const customer = document.getElementById('modalCustomer').textContent;
  const receiptId = document.getElementById('modalReceiptId').textContent;
  
  alert(`Email functionality would send receipt ${receiptId} to ${customer}'s email address.`);
}

// Close modals when clicking outside
window.onclick = function(event) {
  const receiptModal = document.getElementById('receiptModal');
  const recordModal = document.getElementById('recordPaymentModal');
  
  if (event.target === receiptModal) {
    closeReceiptModal();
  }
  if (event.target === recordModal) {
    closeRecordPaymentModal();
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Check owner session before loading page
  if (!checkOwnerSession()) {
    return;
  }
  
  console.log('Owner Payment page loaded successfully');
  
  // Load payments from API
  loadPayments();
});
