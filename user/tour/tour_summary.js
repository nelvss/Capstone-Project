// Minimal booking summary logic for Tour Summary page
let currentStep = 3;
const totalSteps = 8;

function showStep(step) {
    const steps = document.querySelectorAll('.form-step');
    steps.forEach((el, index) => {
        const shouldBeActive = index === step - 3; // Step 3 maps to index 0
        el.classList.toggle('active', shouldBeActive);
    });
}

function formatCurrency(valueText) {
    if (!valueText) return 0;
    const num = parseFloat(String(valueText).replace(/[₱,]/g, '')) || 0;
    return num;
}

function displayCurrency(num) {
    return `₱${Number(num).toLocaleString()}.00`;
}

function populateTourLists(bookingData) {
    const tourSelectedSection = document.getElementById('tour-selected-section');
    const noToursMessage = document.getElementById('no-tours-selected');

    const islandTours = bookingData.islandTours || [];
    const inlandTours = bookingData.inlandTours || [];
    const snorkelTours = bookingData.snorkelTours || [];

    const hasAny = islandTours.length || inlandTours.length || snorkelTours.length;
    if (tourSelectedSection) tourSelectedSection.classList.toggle('d-none', !hasAny);
    if (noToursMessage) noToursMessage.classList.toggle('d-none', !!hasAny);

    const sections = [
        { listId: 'island-tour-list', colId: 'island-tour-column', items: islandTours },
        { listId: 'inland-tour-list', colId: 'inland-tour-column', items: inlandTours },
        { listId: 'snorkel-tour-list', colId: 'snorkel-tour-column', items: snorkelTours },
    ];

    sections.forEach(({ listId, colId, items }) => {
        const listEl = document.getElementById(listId);
        const colEl = document.getElementById(colId);
        if (!listEl || !colEl) return;
        if (items.length) {
            colEl.classList.remove('d-none');
            listEl.innerHTML = '';
            items.forEach((name) => {
                const li = document.createElement('li');
                li.className = 'mb-2';
                li.innerHTML = `<span class="text-primary">${name}</span>`;
                listEl.appendChild(li);
            });
        } else {
            colEl.classList.add('d-none');
            listEl.innerHTML = '';
        }
    });
}

function populateAdditionalServices(bookingData) {
    const additionalServicesSection = document.getElementById('additional-services-section');

    // Vehicle
    const vehicleSub = document.getElementById('vehicle-subsection');
    const vehicles = bookingData.rentalVehicles || [];
    const rentalDays = bookingData.rentalDays || '';
    const vehicleAmount = bookingData.vehicleAmount || '';
    if (vehicleSub) {
        if (vehicles.length) {
            vehicleSub.classList.remove('d-none');
            const vText = document.getElementById('summary-vehicle');
            const dText = document.getElementById('summary-vehicle-days');
            if (vText) vText.textContent = vehicles.join(', ');
            if (dText) dText.textContent = rentalDays ? `${rentalDays} Day${parseInt(rentalDays, 10) > 1 ? 's' : ''}` : '-';
        } else {
            vehicleSub.classList.add('d-none');
        }
    }

    // Van
    const vanSub = document.getElementById('van-subsection');
    const vanAmount = bookingData.vanRentalAmount || '';
    if (vanSub) {
        if (vanAmount) {
            vanSub.classList.remove('d-none');
            const aText = document.getElementById('summary-van-amount');
            if (aText) aText.textContent = vanAmount;
        } else {
            vanSub.classList.add('d-none');
        }
    }

    // Diving
    const divingSub = document.getElementById('diving-subsection');
    const hasDiving = !!bookingData.diving;
    const divers = bookingData.numberOfDivers || '';
    if (divingSub) {
        if (hasDiving) {
            divingSub.classList.remove('d-none');
            const dText = document.getElementById('summary-divers');
            if (dText) dText.textContent = divers || '-';
        } else {
            divingSub.classList.add('d-none');
        }
    }

    // Show additional services if any sub is visible
    if (additionalServicesSection) {
        const anyVisible = [vehicleSub, vanSub, divingSub].some(
            (el) => el && !el.classList.contains('d-none')
        );
        additionalServicesSection.classList.toggle('d-none', !anyVisible);
    }
}

function calculateAndDisplayTotal(bookingData) {
    let total = 0;
    total += formatCurrency(bookingData.packageAmount);
    total += formatCurrency(bookingData.vehicleAmount);
    total += formatCurrency(bookingData.vanRentalAmount);
    total += formatCurrency(bookingData.divingAmount);

    const summaryTotal = document.getElementById('summary-total-amount');
    if (summaryTotal) summaryTotal.textContent = displayCurrency(total);
}

function populateBookingSummary() {
    let bookingData = {};
    try {
        bookingData = JSON.parse(sessionStorage.getItem('completeBookingData') || '{}');
    } catch {}

    // Personal info
    const fullName = `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim();
    const nameEl = document.getElementById('summary-name');
    const emailEl = document.getElementById('summary-email');
    const contactEl = document.getElementById('summary-contact');
    const arrivalEl = document.getElementById('summary-arrival');
    const departureEl = document.getElementById('summary-departure');
    const touristsEl = document.getElementById('summary-tourists');
    if (nameEl) nameEl.textContent = fullName || '-';
    if (emailEl) emailEl.textContent = bookingData.emailAddress || '-';
    if (contactEl) contactEl.textContent = bookingData.contactNo || '-';
    if (arrivalEl) arrivalEl.textContent = bookingData.arrivalDate || '-';
    if (departureEl) departureEl.textContent = bookingData.departureDate || '-';
    if (touristsEl) touristsEl.textContent = bookingData.touristCount || '-';

    // Package amount
    const pkgAmountEl = document.getElementById('summary-package-amount');
    if (pkgAmountEl) pkgAmountEl.textContent = bookingData.packageAmount || '₱0.00';

    // Tours
    populateTourLists(bookingData);

    // Accommodation
    const hotelSection = document.getElementById('accommodation-section');
    const hotelNameEl = document.getElementById('summary-hotel');
    const hotelDaysEl = document.getElementById('summary-hotel-days');
    const hotelAmountEl = document.getElementById('summary-hotel-amount');
    const hasHotel = !!bookingData.selectedHotel;
    if (hotelSection) hotelSection.classList.toggle('d-none', !hasHotel);
    if (hasHotel) {
        if (hotelNameEl) hotelNameEl.textContent = bookingData.selectedHotel;
        if (hotelDaysEl) hotelDaysEl.textContent = bookingData.days || '-';
        if (hotelAmountEl) hotelAmountEl.textContent = bookingData.hotelAmount || '₱0.00';
    }

    // Additional services
    populateAdditionalServices(bookingData);

    // Total
    calculateAndDisplayTotal(bookingData);
}

window.nextStep = function() {
    if (currentStep < totalSteps) {
        currentStep += 1;
        showStep(currentStep);
        if (currentStep === 4) {
            setupPaymentOptions();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.previousStep = function() {
    if (currentStep === 3) {
        window.location.href = 'tour_only.html';
        return;
    }
    if (currentStep > 3) {
        currentStep -= 1;
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    showStep(currentStep);
    populateBookingSummary();
    if (currentStep === 4) {
        setupPaymentOptions();
    }
});

// Payment Options setup: copy total and initialize minimum down payment
function setupPaymentOptions() {
    const summaryTotalElement = document.getElementById('summary-total-amount');
    const paymentTotalElement = document.getElementById('payment-total-amount');
    if (summaryTotalElement && paymentTotalElement) {
        const totalText = summaryTotalElement.textContent || '₱0.00';
        paymentTotalElement.textContent = totalText;
    }

    // Minimum down payment: ₱500 per tourist
    let bookingData = {};
    try {
        bookingData = JSON.parse(sessionStorage.getItem('completeBookingData') || '{}');
    } catch {}
    const numTourists = parseInt(bookingData.touristCount, 10) || 0;
    const minimumDownPayment = Math.max(0, numTourists * 500);

    const minimumDownPaymentText = document.getElementById('minimumDownPaymentText');
    const minimumDownPaymentAmount = document.getElementById('minimumDownPaymentAmount');
    if (minimumDownPaymentText) {
        minimumDownPaymentText.textContent = `Minimum for your booking: ₱${minimumDownPayment.toLocaleString()}`;
    }
    if (minimumDownPaymentAmount) {
        minimumDownPaymentAmount.textContent = `₱${minimumDownPayment.toLocaleString()}`;
    }
    
    // Set up payment option event listeners
    setupPaymentOptionListeners();
}

// Set up payment option radio button listeners
function setupPaymentOptionListeners() {
    const fullPaymentRadio = document.getElementById('fullPayment');
    const downPaymentRadio = document.getElementById('downPayment');
    const downPaymentReminder = document.getElementById('downPaymentReminder');
    const downPaymentSection = document.getElementById('downPaymentSection');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    
    if (fullPaymentRadio) {
        fullPaymentRadio.addEventListener('change', function() {
            if (this.checked) {
                // Hide down payment sections
                if (downPaymentReminder) downPaymentReminder.classList.add('d-none');
                if (downPaymentSection) downPaymentSection.classList.add('d-none');
            }
        });
    }
    
    if (downPaymentRadio) {
        downPaymentRadio.addEventListener('change', function() {
            if (this.checked) {
                // Show down payment sections
                if (downPaymentReminder) downPaymentReminder.classList.remove('d-none');
                if (downPaymentSection) downPaymentSection.classList.remove('d-none');
                
                // Set minimum value and focus
                if (downPaymentAmountInput) {
                    const minimumValue = parseInt(downPaymentAmountInput.getAttribute('min')) || 1000;
                    downPaymentAmountInput.value = minimumValue;
                    downPaymentAmountInput.focus();
                    updateRemainingBalance();
                }
            }
        });
    }
    
    if (downPaymentAmountInput) {
        downPaymentAmountInput.addEventListener('input', updateRemainingBalance);
    }
}

// Update remaining balance calculation
function updateRemainingBalance() {
    const paymentTotalElement = document.getElementById('payment-total-amount');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    const remainingBalanceElement = document.getElementById('remainingBalance');
    
    if (paymentTotalElement && downPaymentAmountInput && remainingBalanceElement) {
        const totalAmount = parseFloat(paymentTotalElement.textContent.replace(/[₱,]/g, '')) || 0;
        const downPaymentAmount = parseFloat(downPaymentAmountInput.value) || 0;
        const remainingBalance = totalAmount - downPaymentAmount;
        
        remainingBalanceElement.textContent = `₱${remainingBalance.toLocaleString()}.00`;
    }
}

// Show payment QR modal for selected payment method
function showPaymentQR(paymentType) {
    const modal = new bootstrap.Modal(document.getElementById('paymentQRModal'));
    const paymentIcon = document.getElementById('paymentIcon');
    const paymentMethodName = document.getElementById('paymentMethodName');
    const instructionApp = document.getElementById('instructionApp');
    const modalPaymentAmount = document.getElementById('modalPaymentAmount');
    
    // Get payment amount based on selected option
    let paymentAmount = '₱0.00';
    const fullPaymentRadio = document.getElementById('fullPayment');
    const downPaymentRadio = document.getElementById('downPayment');
    
    if (fullPaymentRadio && fullPaymentRadio.checked) {
        // Full payment - use total amount
        const paymentTotalElement = document.getElementById('payment-total-amount');
        if (paymentTotalElement) {
            paymentAmount = paymentTotalElement.textContent;
        }
    } else if (downPaymentRadio && downPaymentRadio.checked) {
        // Down payment - use entered amount
        const downPaymentAmountInput = document.getElementById('downPaymentAmount');
        if (downPaymentAmountInput && downPaymentAmountInput.value) {
            const amount = parseFloat(downPaymentAmountInput.value) || 0;
            paymentAmount = `₱${amount.toLocaleString()}.00`;
        }
    }
    
    // Update modal content based on payment type
    const paymentConfig = {
        gcash: {
            icon: 'fas fa-mobile-alt',
            name: 'GCASH',
            app: 'GCash'
        },
        paymaya: {
            icon: 'fas fa-credit-card',
            name: 'PAYMAYA',
            app: 'PayMaya'
        },
        banking: {
            icon: 'fas fa-university',
            name: 'ONLINE BANKING',
            app: 'your banking app'
        }
    };
    
    const config = paymentConfig[paymentType] || paymentConfig.gcash;
    
    if (paymentIcon) paymentIcon.className = config.icon + ' me-2';
    if (paymentMethodName) paymentMethodName.textContent = config.name;
    if (instructionApp) instructionApp.textContent = config.app;
    if (modalPaymentAmount) modalPaymentAmount.textContent = paymentAmount;
    
    // Show the modal
    modal.show();
}

// Confirm payment completion
function confirmPayment() {
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('paymentQRModal'));
    if (modal) modal.hide();
    
    // Enable the next button
    const paymentNextBtn = document.getElementById('paymentNextBtn');
    if (paymentNextBtn) {
        paymentNextBtn.disabled = false;
    }
    
    // Update payment instructions
    const paymentInstructions = document.getElementById('paymentInstructions');
    if (paymentInstructions) {
        paymentInstructions.innerHTML = '<i class="fas fa-check-circle me-1 text-success"></i>Payment confirmed! You can now proceed to the next step.';
    }
}

// Handle file upload for receipt
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        alert('File size must be less than 5MB.');
        return;
    }
    
    // Show success state
    const uploadArea = document.getElementById('uploadArea');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    
    if (uploadArea) uploadArea.classList.add('d-none');
    if (uploadedFiles) uploadedFiles.classList.remove('d-none');
    
    // Create file preview
    if (filePreviewContainer) {
        const reader = new FileReader();
        reader.onload = function(e) {
            filePreviewContainer.innerHTML = `
                <div class="text-center">
                    <img src="${e.target.result}" alt="Receipt Preview" class="img-fluid rounded shadow-sm" style="max-height: 200px;">
                    <p class="text-muted small mt-2 mb-0">${file.name}</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    // Enable submit button
    const submitBtn = document.getElementById('submitBookingBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

// Generate booking reference with year and counter
function generateBookingReference() {
    const currentYear = new Date().getFullYear().toString().slice(-2); // Get 2-digit year
    const storageKey = 'bookingCounter';
    const yearKey = 'bookingYear';
    
    // Get stored values from localStorage
    const storedYear = localStorage.getItem(yearKey);
    const storedCounter = parseInt(localStorage.getItem(storageKey)) || 0;
    
    let counter = 1;
    
    // Check if year has changed
    if (storedYear !== currentYear) {
        // Year changed, reset counter to 1
        counter = 1;
    } else {
        // Same year, increment counter
        counter = storedCounter + 1;
    }
    
    // Store updated values
    localStorage.setItem(yearKey, currentYear);
    localStorage.setItem(storageKey, counter.toString());
    
    // Format counter with leading zeros (001, 002, etc.)
    const formattedCounter = counter.toString().padStart(3, '0');
    
    return `${currentYear}-${formattedCounter}`;
}

// Submit booking
function submitBooking() {
    // Generate booking reference
    const bookingRef = generateBookingReference();
    
    // Store booking data
    let bookingData = {};
    try {
        bookingData = JSON.parse(sessionStorage.getItem('completeBookingData') || '{}');
    } catch {}
    
    // Add booking reference and submission timestamp
    bookingData.bookingReference = bookingRef;
    bookingData.submissionDate = new Date().toISOString();
    bookingData.status = 'pending';
    
    // Save updated booking data
    sessionStorage.setItem('completeBookingData', JSON.stringify(bookingData));
    
    // Update booking reference displays
    const bookingRefElement = document.getElementById('bookingReference');
    const finalBookingRefElement = document.getElementById('finalBookingReference');
    if (bookingRefElement) {
        bookingRefElement.textContent = bookingRef;
    }
    if (finalBookingRefElement) {
        finalBookingRefElement.textContent = bookingRef;
    }
    
    // Move to confirmation step
    nextStep();
}

// Go to home page
function goToHomePage() {
    window.location.href = '../home/home.html';
}


