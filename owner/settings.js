// Settings Page JavaScript - Connected to Owner Dashboard

// Service data that can be edited
let servicesData = {
  // Hotel Services
  standardRoom: {
    price: 80,
    description: "Comfortable standard rooms with essential amenities, perfect for budget-conscious travelers.",
    features: ["Free WiFi", "Air Conditioning", "Private Bathroom", "Daily Housekeeping", "Cable TV"],
    images: ["../Images/infinity_hotel.jpg"]
  },
  deluxeRoom: {
    price: 120,
    description: "Spacious deluxe rooms with premium amenities, breakfast included, and ocean view.",
    features: ["Free WiFi", "Breakfast Included", "Ocean View", "Mini Bar", "24/7 Room Service"],
    images: ["../Images/the_mangyan_grand_hotel.png"]
  },
  suiteRoom: {
    price: 200,
    description: "Luxurious suite rooms with separate living area, premium amenities, and exclusive services.",
    features: ["Separate Living Area", "Premium Ocean View", "Complimentary Breakfast", "Personal Concierge", "Jacuzzi Tub"],
    images: ["../Images/infinity_hotel.jpg"]
  },
  
  // Vehicle Rentals
  motorcycle: {
    price: 25,
    description: "Fuel-efficient motorcycles perfect for exploring the island, includes helmet and basic insurance.",
    features: ["Helmet Included", "Basic Insurance", "Fuel Efficient", "Easy to Park", "Perfect for Island Exploration"],
    images: ["../Images/nmax.png"]
  },
  car: {
    price: 45,
    description: "Modern cars with full insurance coverage, GPS navigation, and 24/7 roadside assistance.",
    features: ["Full Insurance Coverage", "GPS Navigation", "24/7 Roadside Assistance", "Air Conditioning", "Free Airport Pickup"],
    images: ["../Images/versys_650.png"]
  },
  van: {
    price: 80,
    description: "Spacious vans ideal for group travel, equipped with comfortable seating and ample luggage space.",
    features: ["Seats 8-12 People", "Ample Luggage Space", "Air Conditioning", "Professional Driver Available", "Group Travel Friendly"],
    images: ["../Images/versys_1000.png"]
  },
  
  // Tour Packages
  islandTour: {
    price: 75,
    description: "Full-day island hopping adventure visiting multiple pristine beaches and hidden lagoons with boat transportation.",
    features: ["Boat Transportation", "Visit 3-4 Islands", "Lunch Included", "Snorkeling Equipment", "Professional Guide"],
    images: ["../Images/white_beach.jpg", "../Images/virgin_beach.jpg"]
  },
  inlandTour: {
    price: 65,
    description: "Explore mountains, waterfalls, and cultural sites with hiking adventures and local village visits.",
    features: ["Mountain Hiking", "Waterfall Visits", "Cultural Village Tour", "Local Lunch", "Transportation Included"],
    images: ["../Images/tamaraw_falls.jpg"]
  },
  snorkelTour: {
    price: 90,
    description: "Underwater adventure exploring coral reefs and marine life with professional diving instruction.",
    features: ["Professional Dive Instructor", "Complete Equipment Provided", "Coral Reef Exploration", "Marine Life Spotting", "Underwater Photography"],
    images: ["../Images/coral_garden.jpg", "../Images/giant_clamps.jpg"]
  },
  sunsetTour: {
    price: 55,
    description: "Romantic sunset viewing and night market exploration with dinner and cultural entertainment.",
    features: ["Scenic Sunset Viewing", "Night Market Visit", "Local Dinner Included", "Cultural Show", "Transportation Included"],
    images: ["../Images/long_beach.jpg", "../Images/muelle_beach.jpg"]
  }
};

// Business settings data
let businessSettings = {
  name: "Travel Admin",
  email: "info@traveladmin.com",
  phone: "+1 (555) 123-4567",
  address: "123 Travel Street, Tourism City, TC 12345",
  cancellationPolicy: 24,
  advanceBookingLimit: 365,
  requireDeposit: true,
  depositPercentage: 25
};

// Tab switching functionality
function showTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => tab.classList.remove('active'));
  
  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab and activate button
  document.getElementById(tabName + '-tab').classList.add('active');
  event.target.classList.add('active');
}

// Save all changes
function saveAllChanges() {
  try {
    // Save hotel service prices and descriptions
    servicesData.standardRoom.price = parseFloat(document.getElementById('standard-room-price').value);
    servicesData.standardRoom.description = document.getElementById('standard-room-description').value;
    servicesData.standardRoom.features = document.getElementById('standard-room-features').value.split('\n').filter(f => f.trim());
    
    servicesData.deluxeRoom.price = parseFloat(document.getElementById('deluxe-room-price').value);
    servicesData.deluxeRoom.description = document.getElementById('deluxe-room-description').value;
    servicesData.deluxeRoom.features = document.getElementById('deluxe-room-features').value.split('\n').filter(f => f.trim());
    
    servicesData.suiteRoom.price = parseFloat(document.getElementById('suite-room-price').value);
    servicesData.suiteRoom.description = document.getElementById('suite-room-description').value;
    servicesData.suiteRoom.features = document.getElementById('suite-room-features').value.split('\n').filter(f => f.trim());
    
    // Save vehicle rental prices and descriptions
    servicesData.motorcycle.price = parseFloat(document.getElementById('motorcycle-price').value);
    servicesData.motorcycle.description = document.getElementById('motorcycle-description').value;
    servicesData.motorcycle.features = document.getElementById('motorcycle-features').value.split('\n').filter(f => f.trim());
    
    servicesData.car.price = parseFloat(document.getElementById('car-price').value);
    servicesData.car.description = document.getElementById('car-description').value;
    servicesData.car.features = document.getElementById('car-features').value.split('\n').filter(f => f.trim());
    
    servicesData.van.price = parseFloat(document.getElementById('van-price').value);
    servicesData.van.description = document.getElementById('van-description').value;
    servicesData.van.features = document.getElementById('van-features').value.split('\n').filter(f => f.trim());
    
    // Save tour package prices and descriptions
    servicesData.islandTour.price = parseFloat(document.getElementById('island-tour-price').value);
    servicesData.islandTour.description = document.getElementById('island-tour-description').value;
    servicesData.islandTour.features = document.getElementById('island-tour-features').value.split('\n').filter(f => f.trim());
    
    servicesData.inlandTour.price = parseFloat(document.getElementById('inland-tour-price').value);
    servicesData.inlandTour.description = document.getElementById('inland-tour-description').value;
    servicesData.inlandTour.features = document.getElementById('inland-tour-features').value.split('\n').filter(f => f.trim());
    
    servicesData.snorkelTour.price = parseFloat(document.getElementById('snorkel-tour-price').value);
    servicesData.snorkelTour.description = document.getElementById('snorkel-tour-description').value;
    servicesData.snorkelTour.features = document.getElementById('snorkel-tour-features').value.split('\n').filter(f => f.trim());
    
    servicesData.sunsetTour.price = parseFloat(document.getElementById('sunset-tour-price').value);
    servicesData.sunsetTour.description = document.getElementById('sunset-tour-description').value;
    servicesData.sunsetTour.features = document.getElementById('sunset-tour-features').value.split('\n').filter(f => f.trim());
    
    // Save business settings
    businessSettings.name = document.getElementById('business-name').value;
    businessSettings.email = document.getElementById('business-email').value;
    businessSettings.phone = document.getElementById('business-phone').value;
    businessSettings.address = document.getElementById('business-address').value;
    businessSettings.cancellationPolicy = parseInt(document.getElementById('cancellation-policy').value);
    businessSettings.advanceBookingLimit = parseInt(document.getElementById('advance-booking').value);
    businessSettings.requireDeposit = document.getElementById('require-deposit').checked;
    businessSettings.depositPercentage = parseInt(document.getElementById('deposit-percentage').value);
    
    // Store data in localStorage (in real app, would send to server)
    localStorage.setItem('servicesData', JSON.stringify(servicesData));
    localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
    
    // Show success message
    showSuccessMessage();
    
    console.log('Settings saved successfully:', { servicesData, businessSettings });
    
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

// Show success message
function showSuccessMessage() {
  const successMsg = document.getElementById('success-message');
  successMsg.classList.add('show');
  
  setTimeout(() => {
    successMsg.classList.remove('show');
  }, 3000);
}

// Image management functions
function removeImage(button) {
  if (confirm('Are you sure you want to remove this image?')) {
    const imageItem = button.closest('.image-item');
    imageItem.remove();
    console.log('Image removed');
  }
}

function setPrimaryImage(button) {
  const imageGrid = button.closest('.image-grid');
  const allItems = imageGrid.querySelectorAll('.image-item');
  
  // Remove primary class from all images
  allItems.forEach(item => item.classList.remove('primary'));
  
  // Add primary class to selected image
  const imageItem = button.closest('.image-item');
  imageItem.classList.add('primary');
  
  console.log('Primary image set');
}

// Handle file uploads
function handleImageUpload(event, serviceType) {
  const files = event.target.files;
  const imageGrid = document.getElementById(serviceType + '-image-grid');
  
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
          <img src="${e.target.result}" alt="${serviceType} image">
          <div class="image-overlay">
            <button class="btn-remove" onclick="removeImage(this)">🗑️</button>
            <button class="btn-primary" onclick="setPrimaryImage(this)">⭐</button>
          </div>
        `;
        imageGrid.appendChild(imageItem);
      };
      reader.readAsDataURL(file);
    }
  });
}

// Load saved data on page load
function loadSavedData() {
  // Load from localStorage if available
  const savedServices = localStorage.getItem('servicesData');
  const savedBusiness = localStorage.getItem('businessSettings');
  
  if (savedServices) {
    servicesData = JSON.parse(savedServices);
  }
  
  if (savedBusiness) {
    businessSettings = JSON.parse(savedBusiness);
  }
  
  // Populate form fields with saved data
  populateFormFields();
}

function populateFormFields() {
  // Populate hotel service data
  document.getElementById('standard-room-price').value = servicesData.standardRoom.price;
  document.getElementById('standard-room-description').value = servicesData.standardRoom.description;
  document.getElementById('standard-room-features').value = servicesData.standardRoom.features.join('\n');
  
  document.getElementById('deluxe-room-price').value = servicesData.deluxeRoom.price;
  document.getElementById('deluxe-room-description').value = servicesData.deluxeRoom.description;
  document.getElementById('deluxe-room-features').value = servicesData.deluxeRoom.features.join('\n');
  
  document.getElementById('suite-room-price').value = servicesData.suiteRoom.price;
  document.getElementById('suite-room-description').value = servicesData.suiteRoom.description;
  document.getElementById('suite-room-features').value = servicesData.suiteRoom.features.join('\n');
  
  // Populate vehicle rental data
  document.getElementById('motorcycle-price').value = servicesData.motorcycle.price;
  document.getElementById('motorcycle-description').value = servicesData.motorcycle.description;
  document.getElementById('motorcycle-features').value = servicesData.motorcycle.features.join('\n');
  
  document.getElementById('car-price').value = servicesData.car.price;
  document.getElementById('car-description').value = servicesData.car.description;
  document.getElementById('car-features').value = servicesData.car.features.join('\n');
  
  document.getElementById('van-price').value = servicesData.van.price;
  document.getElementById('van-description').value = servicesData.van.description;
  document.getElementById('van-features').value = servicesData.van.features.join('\n');
  
  // Populate tour package data
  document.getElementById('island-tour-price').value = servicesData.islandTour.price;
  document.getElementById('island-tour-description').value = servicesData.islandTour.description;
  document.getElementById('island-tour-features').value = servicesData.islandTour.features.join('\n');
  
  document.getElementById('inland-tour-price').value = servicesData.inlandTour.price;
  document.getElementById('inland-tour-description').value = servicesData.inlandTour.description;
  document.getElementById('inland-tour-features').value = servicesData.inlandTour.features.join('\n');
  
  document.getElementById('snorkel-tour-price').value = servicesData.snorkelTour.price;
  document.getElementById('snorkel-tour-description').value = servicesData.snorkelTour.description;
  document.getElementById('snorkel-tour-features').value = servicesData.snorkelTour.features.join('\n');
  
  document.getElementById('sunset-tour-price').value = servicesData.sunsetTour.price;
  document.getElementById('sunset-tour-description').value = servicesData.sunsetTour.description;
  document.getElementById('sunset-tour-features').value = servicesData.sunsetTour.features.join('\n');
  
  // Populate business settings
  document.getElementById('business-name').value = businessSettings.name;
  document.getElementById('business-email').value = businessSettings.email;
  document.getElementById('business-phone').value = businessSettings.phone;
  document.getElementById('business-address').value = businessSettings.address;
  document.getElementById('cancellation-policy').value = businessSettings.cancellationPolicy;
  document.getElementById('advance-booking').value = businessSettings.advanceBookingLimit;
  document.getElementById('require-deposit').checked = businessSettings.requireDeposit;
  document.getElementById('deposit-percentage').value = businessSettings.depositPercentage;
}

// Sidebar toggle functionality (same as dashboard)
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

// Logout functionality (same as dashboard)
function handleLogout() {
  if (confirm('Are you sure you want to logout? Any unsaved changes will be lost.')) {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
  }
}

// Real-time price validation
function validatePriceInput(input) {
  const value = parseFloat(input.value);
  if (value < 0) {
    input.value = 0;
  }
}

// Auto-save functionality (save changes every 30 seconds)
function enableAutoSave() {
  setInterval(() => {
    const hasChanges = checkForUnsavedChanges();
    if (hasChanges) {
      saveAllChanges();
      console.log('Auto-saved changes');
    }
  }, 30000); // 30 seconds
}

function checkForUnsavedChanges() {
  // Simple check - in real app would compare with last saved state
  // Check if any of the service prices have changed
  const standardRoomChanged = document.getElementById('standard-room-price').value !== servicesData.standardRoom.price.toString();
  const deluxeRoomChanged = document.getElementById('deluxe-room-price').value !== servicesData.deluxeRoom.price.toString();
  const suiteRoomChanged = document.getElementById('suite-room-price').value !== servicesData.suiteRoom.price.toString();
  const motorcycleChanged = document.getElementById('motorcycle-price').value !== servicesData.motorcycle.price.toString();
  const carChanged = document.getElementById('car-price').value !== servicesData.car.price.toString();
  const vanChanged = document.getElementById('van-price').value !== servicesData.van.price.toString();
  const islandTourChanged = document.getElementById('island-tour-price').value !== servicesData.islandTour.price.toString();
  const inlandTourChanged = document.getElementById('inland-tour-price').value !== servicesData.inlandTour.price.toString();
  const snorkelTourChanged = document.getElementById('snorkel-tour-price').value !== servicesData.snorkelTour.price.toString();
  const sunsetTourChanged = document.getElementById('sunset-tour-price').value !== servicesData.sunsetTour.price.toString();
  
  return standardRoomChanged || deluxeRoomChanged || suiteRoomChanged || motorcycleChanged || 
         carChanged || vanChanged || islandTourChanged || inlandTourChanged || 
         snorkelTourChanged || sunsetTourChanged;
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
    
    return true;
  } catch (error) {
    // Invalid session data
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
    return false;
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Check session before loading settings
  if (!checkSession()) {
    return;
  }
  
  console.log('Settings page loaded');
  
  // Load saved data
  loadSavedData();
  
  // Set up file upload handlers (will be added when image upload sections are implemented)
  
  // Set up price input validation
  const priceInputs = document.querySelectorAll('input[type="number"]');
  priceInputs.forEach(input => {
    input.addEventListener('change', () => validatePriceInput(input));
  });
  
  // Enable auto-save
  enableAutoSave();
  
  console.log('Settings initialized successfully');
});

// Export functions for use in other files (dashboard integration)
window.getServicesData = function() {
  return servicesData;
};

window.getBusinessSettings = function() {
  return businessSettings;
};