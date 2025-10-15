// Package Summary JavaScript - Load and display booking data
(() => {
    let currentStep = 3; // Start at step 3 (summary)
    let bookingData = null;

    // ----------------------------
    // DATA LOADING AND INITIALIZATION
    // ----------------------------
    
    function loadBookingData() {
        const completeBookingDataString = sessionStorage.getItem('completeBookingData');
        if (completeBookingDataString) {
            try {
                bookingData = JSON.parse(completeBookingDataString);
                console.log('Loaded booking data:', bookingData);
                populateSummary();
                return true;
            } catch (error) {
                console.error('Error parsing booking data:', error);
                return false;
            }
        } else {
            console.warn('No booking data found in sessionStorage');
            return false;
        }
    }

    // Function to reload and update booking data (called when returning from package page)
    function reloadBookingData() {
        console.log('Reloading booking data from sessionStorage...');
        
        // Clear existing data
        bookingData = null;
        
        // Load fresh data
        if (loadBookingData()) {
            console.log('Booking data reloaded successfully');
            return true;
        } else {
            console.error('Failed to reload booking data');
            return false;
        }
    }

    // ----------------------------
    // SUMMARY POPULATION
    // ----------------------------
    
    function populateSummary() {
        if (!bookingData) {
            console.error('No booking data available');
            return;
        }

        // Personal Information
        document.getElementById('summary-name').textContent = `${bookingData.firstName} ${bookingData.lastName}`;
        document.getElementById('summary-email').textContent = bookingData.emailAddress || '-';
        document.getElementById('summary-contact').textContent = bookingData.contactNo || '-';
        document.getElementById('summary-arrival').textContent = bookingData.arrivalDate || '-';
        document.getElementById('summary-departure').textContent = bookingData.departureDate || '-';
        document.getElementById('summary-tourists').textContent = bookingData.touristCount || '-';

        // Package Type
        const packageTypeContainer = document.getElementById('summary-package-type');
        if (bookingData.selectedPackage) {
            const hotelInfo = bookingData.selectedHotel ? ` - ${bookingData.selectedHotel}` : '';
            packageTypeContainer.innerHTML = `
                <div class="alert alert-info border-0 mb-0">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-box-open text-primary me-2"></i>
                        <div>
                            <strong>${bookingData.selectedPackage}</strong>${hotelInfo}
                            ${bookingData.touristCount ? `<br><small class="text-muted">${bookingData.touristCount} tourist${bookingData.touristCount > 1 ? 's' : ''}</small>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            packageTypeContainer.innerHTML = '<span class="text-muted">No package selected</span>';
        }

        // Package Amount
        const packageAmount = bookingData.packageAmount || '₱0.00';
        document.getElementById('summary-package-amount').textContent = packageAmount;

        // Additional Services
        populateAdditionalServices();

        // Total Amount
        const totalAmount = bookingData.totalAmount || '₱0.00';
        document.getElementById('summary-total-amount').textContent = totalAmount;
        document.getElementById('payment-total-amount').textContent = totalAmount;
    }

    function populateAdditionalServices() {
        // Reset all sections to hidden first
        document.getElementById('vehicle-subsection').classList.add('hidden-section');
        document.getElementById('diving-subsection').classList.add('hidden-section');
        document.getElementById('van-subsection').classList.add('hidden-section');
        document.getElementById('additional-services-section').classList.add('hidden-section');

        let hasServices = false;

        // Vehicle Rental
        if (bookingData.rentalVehicles && bookingData.rentalVehicles.length > 0) {
            hasServices = true;
            document.getElementById('vehicle-subsection').classList.remove('hidden-section');
            document.getElementById('summary-vehicle').textContent = bookingData.rentalVehicles.join(', ');
            document.getElementById('summary-vehicle-days').textContent = bookingData.rentalDays || '-';
        }

        // Diving Activity
        if (bookingData.diving && bookingData.numberOfDivers) {
            hasServices = true;
            document.getElementById('diving-subsection').classList.remove('hidden-section');
            document.getElementById('summary-divers').textContent = bookingData.numberOfDivers;
        }

        // Van Rental
        if (bookingData.vanDestination && bookingData.vanPlace) {
            hasServices = true;
            document.getElementById('van-subsection').classList.remove('hidden-section');
            document.getElementById('summary-van-destination').textContent = bookingData.vanDestination;
            document.getElementById('summary-van-place').textContent = bookingData.vanPlace;
            document.getElementById('summary-van-trip-type').textContent = bookingData.vanTripType || '-';
            document.getElementById('summary-van-days').textContent = bookingData.vanDays || '-';
        }

        // Show Additional Services section if any services are selected
        if (hasServices) {
            document.getElementById('additional-services-section').classList.remove('hidden-section');
        }
    }

    // ----------------------------
    // NAVIGATION FUNCTIONS
    // ----------------------------
    
    window.previousStep = function() {
        if (currentStep > 3) {
            currentStep--;
            showStep(currentStep);
        } else {
            // Go back to package only page
            window.location.href = 'package_only.html';
        }
    };

    window.nextStep = function() {
        if (currentStep < 8) {
            currentStep++;
            showStep(currentStep);
        }
    };

    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Show current step
        const currentStepEl = document.getElementById(`form-step-${step}`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }

        // Update payment amount if on payment step
        if (step === 4 && bookingData) {
            updatePaymentAmount();
        }
    }

    // ----------------------------
    // PAYMENT FUNCTIONALITY
    // ----------------------------
    
    function updatePaymentAmount() {
        const totalAmount = bookingData.totalAmount || '₱0.00';
        document.getElementById('payment-total-amount').textContent = totalAmount;
        
        // Set max value for down payment
        const downPaymentInput = document.getElementById('downPaymentAmount');
        if (downPaymentInput) {
            const numericAmount = parseFloat(totalAmount.replace(/[₱,]/g, '')) || 0;
            downPaymentInput.max = numericAmount;
        }
    }

    // Handle payment option changes
    document.addEventListener('change', function(e) {
        if (e.target.name === 'paymentOption') {
            const downPaymentSection = document.getElementById('downPaymentSection');
            const downPaymentReminder = document.getElementById('downPaymentReminder');
            
            if (e.target.value === 'down') {
                downPaymentSection.classList.remove('d-none');
                downPaymentReminder.classList.remove('d-none');
                updateRemainingBalance();
            } else {
                downPaymentSection.classList.add('d-none');
                downPaymentReminder.classList.add('d-none');
            }
        }
    });

    // Handle down payment amount changes
    document.addEventListener('input', function(e) {
        if (e.target.id === 'downPaymentAmount') {
            updateRemainingBalance();
        }
    });

    function updateRemainingBalance() {
        const totalAmount = bookingData.totalAmount || '₱0.00';
        const totalNumeric = parseFloat(totalAmount.replace(/[₱,]/g, '')) || 0;
        const downPayment = parseFloat(document.getElementById('downPaymentAmount').value) || 0;
        const remaining = totalNumeric - downPayment;
        
        document.getElementById('remainingBalance').textContent = `₱${remaining.toLocaleString()}.00`;
    }

    // ----------------------------
    // FILE UPLOAD FUNCTIONALITY
    // ----------------------------
    
    window.handleFileUpload = function(event) {
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
    };

    // ----------------------------
    // BOOKING SUBMISSION
    // ----------------------------
    
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

    window.submitBooking = function() {
        // Generate booking reference
        const bookingRef = generateBookingReference();
        
        // Store final booking data
        const finalBookingData = {
            ...bookingData,
            bookingReference: bookingRef,
            submissionDate: new Date().toISOString(),
            status: 'pending_review'
        };
        
        sessionStorage.setItem('finalBookingData', JSON.stringify(finalBookingData));
        
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
        currentStep = 7;
        showStep(currentStep);
    };

    window.goToHomePage = function() {
        // Clear session storage
        sessionStorage.removeItem('completeBookingData');
        sessionStorage.removeItem('finalBookingData');
        
        // Redirect to home page
        window.location.href = '../home/home.html';
    };

    // ----------------------------
    // PAYMENT MODAL FUNCTIONALITY
    // ----------------------------
    
    document.addEventListener('click', function(e) {
        if (e.target.dataset.bsToggle === 'modal') {
            const paymentType = e.target.dataset.paymentType;
            const modal = document.getElementById('paymentQRModal');
            
            if (modal && paymentType) {
                // Update modal content based on payment type
                const paymentIcons = {
                    'gcash': 'fas fa-mobile-alt',
                    'paymaya': 'fas fa-credit-card',
                    'banking': 'fas fa-university'
                };
                
                const paymentNames = {
                    'gcash': 'GCASH',
                    'paymaya': 'PAYMAYA',
                    'banking': 'ONLINE BANKING'
                };
                
                const instructionApps = {
                    'gcash': 'GCash',
                    'paymaya': 'PayMaya',
                    'banking': 'your banking app'
                };
                
                document.getElementById('paymentIcon').className = paymentIcons[paymentType] + ' me-2';
                document.getElementById('paymentMethodName').textContent = paymentNames[paymentType];
                document.getElementById('instructionApp').textContent = instructionApps[paymentType];
                
                // Update payment amount
                const totalAmount = bookingData.totalAmount || '₱0.00';
                document.getElementById('modalPaymentAmount').textContent = totalAmount;
                
                // Store selected payment method
                sessionStorage.setItem('selectedPaymentMethod', paymentType);
                sessionStorage.setItem('paidAmount', totalAmount);
            }
        }
    });

    window.confirmPayment = function() {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentQRModal'));
        if (modal) {
            modal.hide();
        }
        
        // Enable payment next button
        const paymentNextBtn = document.getElementById('paymentNextBtn');
        if (paymentNextBtn) {
            paymentNextBtn.disabled = false;
        }
        
        // Update payment instructions
        const paymentInstructions = document.getElementById('paymentInstructions');
        if (paymentInstructions) {
            paymentInstructions.innerHTML = '<i class="fas fa-check-circle me-1 text-success"></i>Payment confirmed! You can now proceed to the next step.';
        }
    };

    // ----------------------------
    // INITIALIZATION
    // ----------------------------
    
    // Initialize the page
    function init() {
        console.log('Package Summary page initializing...');
        
        if (loadBookingData()) {
            console.log('Booking data loaded successfully');
            showStep(currentStep);
        } else {
            console.error('Failed to load booking data');
            // Redirect back to package page if no data
            setTimeout(() => {
                window.location.href = 'package_only.html';
            }, 2000);
        }

        // Add visibility change listener to reload data when user returns from package page
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                console.log('Page became visible - checking for updated booking data...');
                // Small delay to ensure sessionStorage is updated
                setTimeout(() => {
                    reloadBookingData();
                }, 100);
            }
        });

        // Also listen for focus events (when user switches back to tab)
        window.addEventListener('focus', function() {
            console.log('Window focused - checking for updated booking data...');
            setTimeout(() => {
                reloadBookingData();
            }, 100);
        });
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log("Package Summary page initialized successfully!");
})();
