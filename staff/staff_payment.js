// Staff Payment Page JavaScript

// Session checking
function checkStaffSession() {
  const userSession = localStorage.getItem('userSession');
  
  if (!userSession) {
    window.location.href = '../owner/login.html';
    return false;
  }
  
  try {
    const session = JSON.parse(userSession);
    
    if (session.type !== 'staff') {
      alert('Access denied. Staff access required.');
      window.location.href = '../owner/login.html';
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem('userSession');
    window.location.href = '../owner/login.html';
    return false;
  }
}

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
    window.location.href = '../owner/login.html';
  }
}

// Receipt filtering functionality
function filterReceipts(period) {
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
    const receiptId = receipt.querySelector('.receipt-id').textContent.toLowerCase();
    
    if (customer.includes(searchTerm) || receiptId.includes(searchTerm)) {
      receipt.style.display = 'block';
    } else {
      receipt.style.display = 'none';
    }
  });
}

// Modal functionality
function openReceiptModal(imageSrc, customer, receiptId, amount) {
  const modal = document.getElementById('receiptModal');
  const modalImage = document.getElementById('modalReceiptImage');
  const modalCustomer = document.getElementById('modalCustomer');
  const modalReceiptId = document.getElementById('modalReceiptId');
  const modalAmount = document.getElementById('modalAmount');
  
  modalImage.src = imageSrc;
  modalCustomer.textContent = customer;
  modalReceiptId.textContent = receiptId;
  modalAmount.textContent = amount;
  
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
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
  // In a real application, this would integrate with an email service
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('receiptModal');
  if (event.target === modal) {
    closeReceiptModal();
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Check staff session before loading page
  if (!checkStaffSession()) {
    return;
  }
  console.log('Staff Payment page loaded successfully');
});
