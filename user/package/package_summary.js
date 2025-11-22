// Package Summary JavaScript - Load and display booking data
(() => {
    console.log('🚀 Package Summary script loaded!');
    let currentStep = 3; // Start at step 3 (summary)
    let bookingData = null;
    
    // API Base URL
    const API_BASE_URL = (window.API_BASE_URL && window.API_BASE_URL.length > 0)
        ? window.API_BASE_URL
        : 'https://api.otgpuertogaleratravel.com/api';
    
    // Store QR codes data
    let qrCodesData = [];
    
    // Initialize Socket.IO connection
    let socket = null;
    function initializeSocketIO() {
        try {
            const serverURL = API_BASE_URL.replace('/api', '');
            socket = io(serverURL, {
                transports: ['websocket', 'polling'],
                reconnection: true
            });

            socket.on('connect', () => {
                console.log('🔌 User connected to server:', socket.id);
            });

            socket.on('disconnect', () => {
                console.log('🔌 User disconnected from server');
            });
        } catch (error) {
            console.error('❌ Socket.IO initialization error:', error);
        }
    }
    
    // Initialize Socket.IO on page load
    initializeSocketIO();
    
    // Load QR codes from database
    async function loadQRCodes() {
        try {
            const response = await fetch(`${API_BASE_URL}/settings/qr-codes`);
            const result = await response.json();
            
            if (result.success) {
                qrCodesData = result.qr_codes;
                console.log('✅ QR codes loaded:', qrCodesData.length);
            }
        } catch (error) {
            console.error('Error loading QR codes:', error);
            // Continue with default placeholders
        }
    }

    // ----------------------------
    // DATA LOADING AND INITIALIZATION
    // ----------------------------
    
    function loadBookingData() {
        const completeBookingDataString = sessionStorage.getItem('completeBookingData');
        if (completeBookingDataString) {
            try {
                bookingData = JSON.parse(completeBookingDataString);
                console.log('✅ Loaded booking data:', bookingData);
                console.log('🔍 Checking for additional services in booking data:');
                console.log('  - rentalVehicles:', bookingData.rentalVehicles);
                console.log('  - selectedVehicles:', bookingData.selectedVehicles);
                console.log('  - vehicleAmount:', bookingData.vehicleAmount);
                console.log('  - diving:', bookingData.diving);
                console.log('  - divingName:', bookingData.divingName);
                console.log('  - divingAmount:', bookingData.divingAmount);
                console.log('  - numberOfDivers:', bookingData.numberOfDivers);
                console.log('  - vanDestination:', bookingData.vanDestination);
                console.log('  - vanPlace:', bookingData.vanPlace);
                console.log('  - vanAmount:', bookingData.vanAmount);
                console.log('🚐 Van Rental Info:', {
                    vanDestination: bookingData.vanDestination,
                    vanPlace: bookingData.vanPlace,
                    vanTripType: bookingData.vanTripType,
                    vanDays: bookingData.vanDays,
                    vanAmount: bookingData.vanAmount
                });
                console.log('📞 About to call populateSummary()...');
                populateSummary();
                console.log('✅ populateSummary() completed');
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
        console.log('📝 populateSummary() called');
        if (!bookingData) {
            console.error('❌ No booking data available in populateSummary()');
            return;
        }

        console.log('📦 Booking data in populateSummary:', bookingData);

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
        console.log('📞 Calling populateAdditionalServices()...');
        populateAdditionalServices();

        // Total Amount
        const totalAmount = bookingData.totalAmount || '₱0.00';
        document.getElementById('summary-total-amount').textContent = totalAmount;
        document.getElementById('payment-total-amount').textContent = totalAmount;
    }

    function populateAdditionalServices() {
        console.log('🔍 populateAdditionalServices() called');
        console.log('📦 Full bookingData:', bookingData);
        
        // Reset all sections to hidden first
        const vehicleSubsection = document.getElementById('vehicle-subsection');
        const divingSubsection = document.getElementById('diving-subsection');
        const vanSubsection = document.getElementById('van-subsection');
        const additionalServicesSection = document.getElementById('additional-services-section');
        
        if (!vehicleSubsection || !divingSubsection || !vanSubsection || !additionalServicesSection) {
            console.error('❌ Required DOM elements not found!');
            return;
        }
        
        vehicleSubsection.classList.add('d-none');
        divingSubsection.classList.add('d-none');
        vanSubsection.classList.add('d-none');
        additionalServicesSection.classList.add('d-none');

        let hasServices = false;

        // Vehicle Rental - Check multiple possible field names
        console.log('🚗 Checking Vehicle Rental...');
        console.log('  - rentalVehicles:', bookingData.rentalVehicles, 'type:', typeof bookingData.rentalVehicles, 'isArray:', Array.isArray(bookingData.rentalVehicles));
        console.log('  - selectedVehicles:', bookingData.selectedVehicles, 'type:', typeof bookingData.selectedVehicles, 'isArray:', Array.isArray(bookingData.selectedVehicles));
        console.log('  - vehicleAmount:', bookingData.vehicleAmount, 'type:', typeof bookingData.vehicleAmount);
        console.log('  - rentalDays:', bookingData.rentalDays);
        
        // More lenient check - if vehicleAmount exists and is not empty/zero, show it
        const vehicleAmountStr = String(bookingData.vehicleAmount || '').trim();
        const vehicleAmountNum = vehicleAmountStr ? parseFloat(vehicleAmountStr.replace(/[₱,]/g, '')) : 0;
        
        const hasVehicles = (bookingData.rentalVehicles && Array.isArray(bookingData.rentalVehicles) && bookingData.rentalVehicles.length > 0) ||
                           (bookingData.selectedVehicles && Array.isArray(bookingData.selectedVehicles) && bookingData.selectedVehicles.length > 0) ||
                           (vehicleAmountStr !== '' && vehicleAmountStr !== '₱0.00' && vehicleAmountStr !== '0' && vehicleAmountStr !== '₱0' && !isNaN(vehicleAmountNum) && vehicleAmountNum > 0);
        
        console.log('  - vehicleAmountStr:', vehicleAmountStr);
        console.log('  - vehicleAmountNum:', vehicleAmountNum);
        console.log('  - hasVehicles result:', hasVehicles);
        
        if (hasVehicles) {
            hasServices = true;
            vehicleSubsection.classList.remove('d-none');
            let vehicleNames = [];
            
            if (bookingData.rentalVehicles && Array.isArray(bookingData.rentalVehicles) && bookingData.rentalVehicles.length > 0) {
                vehicleNames = bookingData.rentalVehicles;
            } else if (bookingData.selectedVehicles && Array.isArray(bookingData.selectedVehicles) && bookingData.selectedVehicles.length > 0) {
                vehicleNames = bookingData.selectedVehicles.map(v => typeof v === 'string' ? v : (v.name || v));
            } else {
                vehicleNames = ['Vehicle Rental'];
            }
            
            document.getElementById('summary-vehicle').textContent = vehicleNames.join(', ');
            document.getElementById('summary-vehicle-days').textContent = bookingData.rentalDays || '-';
            console.log('✅ Vehicle Rental displayed:', vehicleNames, 'Days:', bookingData.rentalDays);
        }

        // Diving Activity - Check if diving is selected (boolean) OR if diving amount exists
        console.log('🏊 Checking Diving Activity...');
        console.log('  - diving:', bookingData.diving, 'type:', typeof bookingData.diving);
        console.log('  - divingName:', bookingData.divingName, 'type:', typeof bookingData.divingName);
        console.log('  - numberOfDivers:', bookingData.numberOfDivers, 'type:', typeof bookingData.numberOfDivers);
        console.log('  - divingAmount:', bookingData.divingAmount, 'type:', typeof bookingData.divingAmount);
        
        const divingAmountStr = String(bookingData.divingAmount || '').trim();
        const divingAmountNum = divingAmountStr ? parseFloat(divingAmountStr.replace(/[₱,]/g, '')) : 0;
        
        const hasDiving = bookingData.diving === true || 
                         bookingData.diving === 'true' ||
                         String(bookingData.diving) === 'true' ||
                         (bookingData.divingName && String(bookingData.divingName).trim() !== '') ||
                         (divingAmountStr !== '' && divingAmountStr !== '₱0.00' && divingAmountStr !== '0' && divingAmountStr !== '₱0' && !isNaN(divingAmountNum) && divingAmountNum > 0);
        
        console.log('  - divingAmountStr:', divingAmountStr);
        console.log('  - divingAmountNum:', divingAmountNum);
        console.log('  - hasDiving result:', hasDiving);
        
        if (hasDiving) {
            hasServices = true;
            divingSubsection.classList.remove('d-none');
            const diversCount = bookingData.numberOfDivers || '-';
            document.getElementById('summary-divers').textContent = diversCount;
            console.log('✅ Diving Activity displayed:', bookingData.divingName || 'Diving', 'Divers:', diversCount);
        }

        // Van Rental - Check if any van data exists (destination, place, or amount)
        console.log('🚐 Checking Van Rental...');
        console.log('  - vanDestination:', bookingData.vanDestination);
        console.log('  - vanPlace:', bookingData.vanPlace);
        console.log('  - vanTripType:', bookingData.vanTripType);
        console.log('  - vanDays:', bookingData.vanDays);
        console.log('  - vanAmount:', bookingData.vanAmount);
        console.log('  - vanDestinationId:', bookingData.vanDestinationId);
        
        // Check if van rental exists - vanDestination could be "Within Puerto Galera" or "Outside Puerto Galera"
        // OR if vanPlace is set, OR if vanAmount is set
        const vanDest = String(bookingData.vanDestination || '').trim();
        const vanPl = String(bookingData.vanPlace || '').trim();
        const vanAmt = String(bookingData.vanAmount || '').trim();
        
        const hasVanRental = (vanDest !== '' && vanDest !== 'None' && vanDest !== 'none' && 
                             (vanDest === 'Within Puerto Galera' || vanDest === 'Outside Puerto Galera' || vanPl !== '')) ||
                            (vanPl !== '' && vanPl !== 'None' && vanPl !== 'none') ||
                            (vanAmt !== '' && vanAmt !== '₱0.00' && vanAmt !== '0' && vanAmt !== '₱0' && !isNaN(parseFloat(vanAmt.replace(/[₱,]/g, ''))) && parseFloat(vanAmt.replace(/[₱,]/g, '')) > 0) ||
                            (bookingData.vanDestinationId && bookingData.vanDestinationId !== null && bookingData.vanDestinationId !== '');
        
        console.log('  - hasVanRental result:', hasVanRental);
        console.log('  - vanDest check:', vanDest, 'valid:', vanDest !== '' && vanDest !== 'None' && vanDest !== 'none');
        console.log('  - vanPl check:', vanPl, 'valid:', vanPl !== '' && vanPl !== 'None' && vanPl !== 'none');
        console.log('  - vanAmt check:', vanAmt, 'valid:', vanAmt !== '' && vanAmt !== '₱0.00' && vanAmt !== '0');
        
        if (hasVanRental) {
            hasServices = true;
            vanSubsection.classList.remove('d-none');
            document.getElementById('summary-van-destination').textContent = bookingData.vanDestination || '-';
            document.getElementById('summary-van-place').textContent = bookingData.vanPlace || '-';
            document.getElementById('summary-van-trip-type').textContent = bookingData.vanTripType || '-';
            document.getElementById('summary-van-days').textContent = bookingData.vanDays || '-';
            console.log('✅ Van Rental displayed:', {
                destination: bookingData.vanDestination,
                place: bookingData.vanPlace,
                tripType: bookingData.vanTripType,
                days: bookingData.vanDays
            });
        }

        // Show Additional Services section if any services are selected
        console.log('📋 Final hasServices:', hasServices);
        if (hasServices) {
            additionalServicesSection.classList.remove('d-none');
            console.log('✅ Additional Services section displayed');
        } else {
            console.log('⚠️ No additional services found in booking data');
            console.log('📋 All booking data keys:', Object.keys(bookingData));
            console.log('🚗 Vehicle data:', {
                rentalVehicles: bookingData.rentalVehicles,
                selectedVehicles: bookingData.selectedVehicles,
                vehicleAmount: bookingData.vehicleAmount,
                rentalDays: bookingData.rentalDays
            });
            console.log('🏊 Diving data:', {
                diving: bookingData.diving,
                divingName: bookingData.divingName,
                numberOfDivers: bookingData.numberOfDivers,
                divingAmount: bookingData.divingAmount,
                divingId: bookingData.divingId
            });
            console.log('🚐 Van data:', {
                vanDestination: bookingData.vanDestination,
                vanPlace: bookingData.vanPlace,
                vanTripType: bookingData.vanTripType,
                vanDays: bookingData.vanDays,
                vanAmount: bookingData.vanAmount,
                vanDestinationId: bookingData.vanDestinationId
            });
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
        console.log(`📺 showStep(${step}) called`);
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Show current step
        const currentStepEl = document.getElementById(`form-step-${step}`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
            console.log(`✅ Step ${step} is now active`);
            
            // If showing step 3 (summary), ensure data is populated
            if (step === 3 && bookingData) {
                console.log('🔄 Step 3 is active, repopulating summary...');
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    populateSummary();
                }, 100);
            }
        } else {
            console.error(`❌ Step ${step} element not found!`);
        }

        // Update payment amount if on payment step
        if (step === 4 && bookingData) {
            updatePaymentAmount();
            // Small delay to ensure DOM is ready before setting up payment options
            setTimeout(() => {
                setupPaymentOptions();
            }, 100);
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

    // Payment Options setup: copy total and initialize minimum down payment
    function setupPaymentOptions() {
        const summaryTotalElement = document.getElementById('summary-total-amount');
        const paymentTotalElement = document.getElementById('payment-total-amount');
        if (summaryTotalElement && paymentTotalElement) {
            const totalText = summaryTotalElement.textContent || '₱0.00';
            paymentTotalElement.textContent = totalText;
        }

        // Minimum down payment: ₱500 per tourist
        if (!bookingData) {
            console.warn('No booking data available for setupPaymentOptions');
            return;
        }
        
        const numTourists = parseInt(bookingData.touristCount, 10) || 0;
        const minimumDownPayment = Math.max(0, numTourists * 500);

        const minimumDownPaymentText = document.getElementById('minimumDownPaymentText');
        const minimumDownPaymentAmount = document.getElementById('minimumDownPaymentAmount');
        const downPaymentInput = document.getElementById('downPaymentAmount');
        
        if (minimumDownPaymentText) {
            minimumDownPaymentText.textContent = `Minimum for your booking: ₱${minimumDownPayment.toLocaleString()}`;
        }
        if (minimumDownPaymentAmount) {
            minimumDownPaymentAmount.textContent = `₱${minimumDownPayment.toLocaleString()}`;
        }
        if (downPaymentInput) {
            downPaymentInput.min = minimumDownPayment;
        }
        
        // Set max attribute on down payment input to prevent exceeding total amount
        const downPaymentAmountInput = document.getElementById('downPaymentAmount');
        const paymentTotalElementForMax = document.getElementById('payment-total-amount');
        if (downPaymentAmountInput && paymentTotalElementForMax) {
            const totalAmount = parseFloat(paymentTotalElementForMax.textContent.replace(/[₱,]/g, '')) || 0;
            downPaymentAmountInput.setAttribute('max', totalAmount);
        }
    }

    // Handle payment option changes
    document.addEventListener('change', function(e) {
        if (e.target.name === 'paymentOption') {
            const downPaymentSection = document.getElementById('downPaymentSection');
            const downPaymentReminder = document.getElementById('downPaymentReminder');
            const downPaymentAmountInput = document.getElementById('downPaymentAmount');
            
            if (e.target.value === 'down') {
                downPaymentSection.classList.remove('d-none');
                downPaymentReminder.classList.remove('d-none');
                
                // Set minimum value, max attribute, and focus
                if (downPaymentAmountInput) {
                    const minimumValue = parseInt(downPaymentAmountInput.getAttribute('min')) || 1000;
                    downPaymentAmountInput.value = minimumValue;
                    
                    // Ensure max attribute is set based on total amount
                    const paymentTotalElement = document.getElementById('payment-total-amount');
                    if (paymentTotalElement) {
                        const totalAmount = parseFloat(paymentTotalElement.textContent.replace(/[₱,]/g, '')) || 0;
                        downPaymentAmountInput.setAttribute('max', totalAmount);
                    } else {
                        // Fallback to bookingData if element not available
                        const totalAmount = bookingData.totalAmount || '₱0.00';
                        const totalNumeric = parseFloat(totalAmount.replace(/[₱,]/g, '')) || 0;
                        downPaymentAmountInput.setAttribute('max', totalNumeric);
                    }
                    
                    downPaymentAmountInput.focus();
                    updateRemainingBalance();
                } else {
                    updateRemainingBalance();
                }
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
    
    // Handle down payment amount blur for additional validation
    document.addEventListener('blur', function(e) {
        if (e.target.id === 'downPaymentAmount') {
            updateRemainingBalance();
        }
    }, true);

    function updateRemainingBalance() {
        // Get total amount from payment-total-amount element or bookingData
        let totalNumeric = 0;
        const paymentTotalElement = document.getElementById('payment-total-amount');
        if (paymentTotalElement && paymentTotalElement.textContent) {
            totalNumeric = parseFloat(paymentTotalElement.textContent.replace(/[₱,]/g, '')) || 0;
        } else {
            const totalAmount = bookingData.totalAmount || '₱0.00';
            totalNumeric = parseFloat(totalAmount.replace(/[₱,]/g, '')) || 0;
        }
        
        const downPaymentAmountInput = document.getElementById('downPaymentAmount');
        let downPayment = parseFloat(downPaymentAmountInput?.value) || 0;
        const remainingBalanceElement = document.getElementById('remainingBalance');
        
        // Validate that down payment does not exceed total amount
        if (downPayment > totalNumeric) {
            // Reset to total amount if it exceeds
            downPayment = totalNumeric;
            if (downPaymentAmountInput) {
                downPaymentAmountInput.value = totalNumeric;
                
                // Show error styling
                downPaymentAmountInput.classList.add('is-invalid');
                
                // Show error message - place after the small element showing minimum
                let errorMessageEl = document.getElementById('downPaymentErrorMessage');
                const minimumTextEl = document.getElementById('minimumDownPaymentAmount');
                
                if (!errorMessageEl) {
                    // Create error message element if it doesn't exist
                    errorMessageEl = document.createElement('div');
                    errorMessageEl.id = 'downPaymentErrorMessage';
                    errorMessageEl.className = 'invalid-feedback d-block text-danger';
                    
                    // Place it after the small element showing minimum, or after form-floating if small doesn't exist
                    if (minimumTextEl && minimumTextEl.parentElement) {
                        minimumTextEl.parentElement.insertAdjacentElement('afterend', errorMessageEl);
                    } else if (downPaymentAmountInput.parentElement) {
                        downPaymentAmountInput.parentElement.insertAdjacentElement('afterend', errorMessageEl);
                    }
                }
                const totalDisplay = `₱${totalNumeric.toLocaleString()}.00`;
                errorMessageEl.textContent = `Down payment cannot exceed total amount of ${totalDisplay}`;
                errorMessageEl.style.display = 'block';
            }
        } else {
            // Remove error styling and message if valid
            if (downPaymentAmountInput) {
                downPaymentAmountInput.classList.remove('is-invalid');
            }
            const errorMessageEl = document.getElementById('downPaymentErrorMessage');
            if (errorMessageEl) {
                errorMessageEl.style.display = 'none';
            }
        }
        
        const remaining = totalNumeric - downPayment;
        if (remainingBalanceElement) {
            remainingBalanceElement.textContent = `₱${remaining.toLocaleString()}.00`;
        }
    }

    // ----------------------------
    // FILE UPLOAD FUNCTIONALITY
    // ----------------------------
    
    window.handleFileUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showErrorModal('Validation Error', 'Please select an image file.');
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            showErrorModal('Validation Error', 'File size must be less than 5MB.');
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
    
    function generateBookingReference() {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const timestampPart = Date.now().toString();
        const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const uniqueSuffix = `${timestampPart.slice(-6)}${randomPart}`.slice(-6);
        return `${currentYear}-${uniqueSuffix}`;
    }

    window.submitBooking = async function() {
        console.log('🎯 Starting booking submission...');
        console.log('📋 Full booking data:', bookingData);
        
        try {
            // Show loading state
            const submitBtn = document.querySelector('button[onclick="submitBooking()"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
            }
            
            const bookingRef = generateBookingReference();
            
            // Resolve customer email to ALWAYS match the logged-in account (so bookings show in "My Bookings")
            let accountEmail = null;
            try {
                const userSessionRaw = localStorage.getItem('userSession');
                if (userSessionRaw) {
                    const session = JSON.parse(userSessionRaw);
                    if (session && session.email) {
                        accountEmail = session.email;
                    }
                }
            } catch (e) {
                console.warn('Unable to read userSession from localStorage:', e);
            }
            const customerEmail = (accountEmail || bookingData.emailAddress || '').trim().toLowerCase();

            // Prepare booking data for API (matching actual database schema)
            const bookingPayload = {
                booking_id: bookingRef,
                customer_first_name: bookingData.firstName,
                customer_last_name: bookingData.lastName,
                // Use normalized email so backend lookups by email work reliably
                customer_email: customerEmail,
                customer_contact: bookingData.contactNo,
                booking_type: 'package_only',
                booking_preferences: `Package Only: ${bookingData.selectedPackage || 'N/A'}`, // Store in the specified format
                arrival_date: bookingData.arrivalDate,
                departure_date: bookingData.departureDate,
                number_of_tourist: parseInt(bookingData.touristCount || 1),
                package_only_id: bookingData.packageOnlyId || getPackageIdByName(bookingData.selectedPackage),
                hotel_id: bookingData.selectedHotel ? getHotelIdByName(bookingData.selectedHotel) : null,
                status: 'pending'
            };
            
            console.log('Submitting booking to API:', bookingPayload);
            
            // Submit main booking to API
            const bookingResponse = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingPayload)
            });
            
            let bookingResult;
            try {
                bookingResult = await bookingResponse.json();
            } catch (parseError) {
                console.error('❌ Failed to parse booking response JSON:', parseError);
                throw new Error(`Failed to create booking (status ${bookingResponse.status})`);
            }
            
            if (!bookingResponse.ok) {
                console.error('❌ Booking creation failed - status not OK:', bookingResponse.status, bookingResult);
                throw new Error(bookingResult?.message || `Failed to create booking (status ${bookingResponse.status})`);
            }
            
            if (!bookingResult.success || !bookingResult.booking) {
                console.error('❌ Booking creation failed response:', bookingResult);
                throw new Error(bookingResult.message || 'Failed to create booking');
            }
            
            const bookingId = bookingResult.booking.booking_id || bookingResult.booking.id;
            if (!bookingId) {
                throw new Error('Booking created but server did not return a booking ID');
            }
            console.log('Booking created successfully with ID:', bookingId);
            
            // Emit Socket.IO event for new booking
            if (socket && socket.connected) {
                socket.emit('new-booking', {
                    bookingId: bookingId,
                    customerName: `${bookingData.firstName} ${bookingData.lastName}`,
                    email: bookingData.emailAddress,
                    bookingType: 'package_only',
                    timestamp: new Date().toISOString()
                });
                console.log('🔌 Socket.IO event emitted for new booking');
            }
            
            // Submit package booking details
            if (bookingData.selectedPackage) {
                const packagePayload = {
                    booking_id: bookingId,
                    package_id: bookingData.packageOnlyId || getPackageIdByName(bookingData.selectedPackage),
                    package_name: bookingData.selectedPackage,
                    package_price: parseFloat(bookingData.packageAmount?.replace(/[₱,]/g, '') || 0),
                    notes: `Tourists: ${bookingData.touristCount || 0}`
                };
                
                const packageResponse = await fetch(`${API_BASE_URL}/package-booking`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(packagePayload)
                });
                
                const packageResult = await packageResponse.json();
                
                if (!packageResult.success) {
                    console.warn('Package booking failed:', packageResult.message);
                } else {
                    console.log('Package booking created successfully');
                }
            }
            
            // Submit diving bookings if selected
            if (bookingData.diving && bookingData.numberOfDivers) {
                const divingPayload = {
                    booking_id: bookingId,
                    number_of_divers: parseInt(bookingData.numberOfDivers) || 1,
                    total_amount: parseFloat(bookingData.divingAmount?.replace(/[₱,]/g, '') || 0),
                    booking_type: 'package_only', // Track that this came from Package Only booking
                    diving_id: bookingData.divingId || null, // Include diving_id from selected diving service
                    diving_name: bookingData.divingName || null // Include diving_name for reference
                };
                
                const divingResponse = await fetch(`${API_BASE_URL}/booking-diving`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(divingPayload)
                });
                
                const divingResult = await divingResponse.json();
                
                if (!divingResult.success) {
                    console.warn('Diving booking failed:', divingResult.message);
                } else {
                    console.log('Diving booking created successfully');
                }
            }
            
            // Submit vehicle bookings if selected
            if (bookingData.selectedVehicles && bookingData.selectedVehicles.length > 0) {
                const vehiclePromises = bookingData.selectedVehicles.map(vehicle => {
                    const vehiclePayload = {
                        booking_id: bookingId,
                        vehicle_id: vehicle.id,
                        vehicle_name: vehicle.name,
                        rental_days: vehicle.days || 1,
                        total_amount: vehicle.price || 0
                    };
                    
                    return fetch(`${API_BASE_URL}/booking-vehicles`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(vehiclePayload)
                    });
                });
                
                try {
                    const vehicleResponses = await Promise.all(vehiclePromises);
                    const vehicleResults = await Promise.all(vehicleResponses.map(r => r.json()));
                    
                    vehicleResults.forEach((result, index) => {
                        if (!result.success) {
                            console.warn(`Vehicle booking ${index + 1} failed:`, result.message);
                        } else {
                            console.log(`Vehicle booking ${index + 1} created successfully`);
                        }
                    });
                } catch (error) {
                    console.warn('Vehicle booking submission error:', error);
                }
            }
            
            // Submit van rental booking if selected
            console.log('🚐 Checking van rental data:', {
                vanDestination: bookingData.vanDestination,
                vanPlace: bookingData.vanPlace,
                vanDestinationId: bookingData.vanDestinationId,
                vanDays: bookingData.vanDays,
                vanAmount: bookingData.vanAmount,
                vanTripType: bookingData.vanTripType
            });
            
            if (bookingData.vanDestination && bookingData.vanPlace && bookingData.vanDestinationId) {
                try {
                    const vanPayload = {
                        booking_id: bookingId,
                        van_destination_id: bookingData.vanDestinationId,
                        number_of_days: parseInt(bookingData.vanDays) || 1,
                        total_amount: parseFloat(bookingData.vanAmount?.replace(/[₱,]/g, '') || 0),
                        trip_type: bookingData.vanTripType || 'oneway',
                        choose_destination: bookingData.vanDestination || ''
                    };
                    
                    console.log('📦 Sending van rental payload:', vanPayload);
                    
                    const vanResponse = await fetch(`${API_BASE_URL}/booking-van-rental`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(vanPayload)
                    });
                    
                    const vanResult = await vanResponse.json();
                    console.log('📥 Van rental API response:', vanResult);
                    
                    if (!vanResult.success) {
                        console.error('❌ Van rental booking failed:', vanResult.message);
                        console.error('Error details:', vanResult.error);
                    } else {
                        console.log('✅ Van rental booking created successfully:', vanResult.van_rental_booking);
                    }
                } catch (error) {
                    console.error('❌ Van rental booking submission error:', error);
                    console.error('Error stack:', error.stack);
                }
            } else {
                console.log('ℹ️ Van rental not selected - skipping');
            }
            
            // Submit payment if payment information is provided
            const paymentOption = document.querySelector('input[name="paymentOption"]:checked')?.value;
            if (paymentOption) {
                const totalAmount = bookingData.totalAmount || '₱0.00';
                const totalNumeric = parseFloat(totalAmount.replace(/[₱,]/g, '')) || 0;
                let paidAmount = totalNumeric;
                let paymentOptionValue = 'Full Payment';
                
                if (paymentOption === 'down') {
                    const downPaymentInput = document.getElementById('downPaymentAmount');
                    paidAmount = parseFloat(downPaymentInput?.value) || 0;
                    paymentOptionValue = 'Partial Payment';
                }
                
                // Get receipt file if uploaded
                const receiptFile = document.getElementById('receiptFile')?.files[0];
                let receiptUrl = '';
                
                if (receiptFile) {
                    // Upload receipt image to Supabase Storage
                    const reader = new FileReader();
                    receiptUrl = await new Promise((resolve, reject) => {
                        reader.onload = async function(e) {
                            try {
                                const base64Data = e.target.result;
                                const uploadResponse = await fetch(`${API_BASE_URL}/payments/upload-receipt`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        imageData: base64Data,
                                        fileName: receiptFile.name,
                                        bookingId: bookingId
                                    })
                                });
                                
                                const uploadResult = await uploadResponse.json();
                                if (uploadResult.success) {
                                    resolve(uploadResult.imageUrl);
                                } else {
                                    console.warn('Receipt upload failed:', uploadResult.message);
                                    resolve(''); // Continue without receipt
                                }
                            } catch (error) {
                                console.warn('Receipt upload error:', error);
                                resolve(''); // Continue without receipt
                            }
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(receiptFile);
                    });
                }
                
                // Get selected payment method from sessionStorage
                const selectedPaymentMethod = sessionStorage.getItem('selectedPaymentMethod');
                console.log('Selected payment method from sessionStorage:', selectedPaymentMethod);
                
                // Map payment method codes to display names
                const paymentMethodMap = {
                    'gcash': 'GCash',
                    'paymaya': 'PayMaya',
                    'banking': 'Online Banking',
                    'cash': 'Cash'
                };
                const displayPaymentMethod = selectedPaymentMethod ? paymentMethodMap[selectedPaymentMethod.toLowerCase()] || selectedPaymentMethod : 'Cash';
                
                console.log('Final payment method to be stored:', displayPaymentMethod);
                
                const paymentPayload = {
                    booking_id: bookingId,
                    payment_method: displayPaymentMethod,
                    total_booking_amount: totalNumeric,
                    paid_amount: paidAmount,
                    payment_option: paymentOptionValue,
                    receipt_image_url: receiptUrl
                };
                
                try {
                    const paymentResponse = await fetch(`${API_BASE_URL}/payments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(paymentPayload)
                    });
                    
                    const paymentResult = await paymentResponse.json();
                    if (paymentResult.success) {
                        console.log('✅ Payment recorded successfully');
                    } else {
                        console.warn('⚠️ Payment recording failed:', paymentResult.message);
                    }
                } catch (error) {
                    console.warn('⚠️ Payment recording error:', error);
                }
            }
            
            // Store final booking data with API response
            const finalBookingData = {
                ...bookingData,
                bookingReference: bookingId,
                bookingId: bookingId,
                submissionDate: new Date().toISOString(),
                status: 'pending'
            };
            
            sessionStorage.setItem('finalBookingData', JSON.stringify(finalBookingData));
            
            // Update booking reference displays
            const bookingRefElement = document.getElementById('bookingReference');
            const finalBookingRefElement = document.getElementById('finalBookingReference');
            if (bookingRefElement) {
                bookingRefElement.textContent = bookingId;
            }
            if (finalBookingRefElement) {
                finalBookingRefElement.textContent = bookingId;
            }
            
            // Clear booking data from sessionStorage after successful submission
            // (Keep finalBookingData for confirmation page, but clear the rest)
            sessionStorage.removeItem('completeBookingData');
            sessionStorage.removeItem('tourSelections');
            sessionStorage.removeItem('bookingFormData');
            sessionStorage.removeItem('bookingOption');
            sessionStorage.removeItem('selectedPaymentMethod');
            sessionStorage.removeItem('paidAmount');
            
            // Move to confirmation step
            currentStep = 7;
            showStep(currentStep);
            
        } catch (error) {
            console.error('Booking submission error:', error);
            showErrorModal('Error', 'Failed to submit booking: ' + error.message);
            
            // Reset button state
            const submitBtn = document.querySelector('button[onclick="submitBooking()"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Booking';
            }
        }
    };
    
    // ----------------------------
    // HOTEL DATA MANAGEMENT
    // ----------------------------
    
    // Global variable to store hotels data
    let hotelsData = [];
    
    // Function to fetch hotels from API
    async function fetchHotels() {
        try {
            console.log('🏨 Fetching hotels from API...');
            const response = await fetch(`${API_BASE_URL}/hotels`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.hotels) {
                // Filter out N/A hotels
                hotelsData = data.hotels.filter(hotel => hotel.name && hotel.name !== 'N/A');
                console.log('✅ Hotels loaded successfully:', hotelsData.length, 'hotels');
                return hotelsData;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('❌ Error fetching hotels:', error);
            // Fallback to hardcoded hotels if API fails
            hotelsData = [
                { hotel_id: '1', name: 'Ilaya', description: 'Beachfront resort with modern amenities', base_price_per_night: 2000, image_urls: ['Images/ilaya.jpg'] },
                { hotel_id: '2', name: 'Bliss', description: 'Luxury beachfront resort', base_price_per_night: 1500, image_urls: ['Images/bliss.jpg'] },
                { hotel_id: '3', name: 'The Mangyan Grand Hotel', description: 'Elegant hotel in the heart of Puerto Galera', base_price_per_night: 2500, image_urls: ['Images/the_mangyan_grand_hotel.png'] },
                { hotel_id: '4', name: 'Transient House', description: 'Comfortable and affordable accommodation', base_price_per_night: 1500, image_urls: ['Images/mangyan.jpg'] },
                { hotel_id: '5', name: 'SouthView', description: 'Cozy lodge with panoramic views', base_price_per_night: 3000, image_urls: ['Images/southview.jpg'] }
            ];
            return hotelsData;
        }
    }
    
    // Helper function to get hotel ID by name
    function getHotelIdByName(hotelName) {
        if (!hotelName || !hotelsData.length) {
            console.warn('No hotel name provided or hotels data not loaded');
            return null;
        }
        
        const hotel = hotelsData.find(h => h.name === hotelName);
        if (hotel) {
            console.log(`Found hotel ID for "${hotelName}":`, hotel.hotel_id);
            return hotel.hotel_id;
        } else {
            console.warn(`Hotel not found: "${hotelName}"`);
            return null;
        }
    }
    
    // Store packages data
    let packagesData = [];
    
    // Fetch packages from API
    async function fetchPackagesForSummary() {
        try {
            console.log('🔄 Fetching packages for summary...');
            const response = await fetch(`${API_BASE_URL}/package-only?include=pricing`, { cache: 'no-cache' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.packages) {
                packagesData = result.packages;
                console.log('✅ Packages loaded for summary:', packagesData.length, 'packages');
                return packagesData;
            } else {
                console.error('❌ Failed to fetch packages:', result.message || 'Unknown error');
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching packages:', error);
            return [];
        }
    }
    
    // Helper function to get package ID by name
    function getPackageIdByName(packageName) {
        if (!packagesData || packagesData.length === 0) {
            console.warn('No packages data available');
            return null;
        }
        
        // Get hotel name from booking data
        const hotelName = bookingData?.selectedHotel || null;
        
        if (hotelName) {
            // Hotel name mapping (same as in package_only.js)
            const HOTEL_NAME_MAPPING = {
                'Ilaya Resort': 'Ilaya',
                'Ilaya': 'Ilaya',
                'Bliss Beach Resort': 'Bliss',
                'Bliss': 'Bliss',
                'The Mangyan Grand Hotel': 'The Mangyan Grand Hotel',
                'Mindoro Transient House': 'Casa de Honcho',
                'Casa De Honcho': 'Casa de Honcho',
                'Casa de Honcho': 'Casa de Honcho',
                'Transient House': 'Casa de Honcho',
                'Southview Lodge': 'SouthView',
                'SouthView': 'SouthView',
                'SouthView Lodge': 'SouthView'
            };
            
            const HOTEL_ID_MAP = {
                'Ilaya': '08e190f4-60da-4188-9c8b-de535ef3fcf2',
                'Casa de Honcho': '11986747-1a86-4d88-a952-a66b69c7e3ec',
                'Bliss': '2da89c09-1c3d-4cd5-817d-637c1c0289de',
                'SouthView': '7c071f4b-5ced-4f34-8864-755e5a4d5c38',
                'The Mangyan Grand Hotel': 'd824f56b-db62-442c-9cf4-26f4c0cc83d0'
            };
            
            const normalizedHotel = HOTEL_NAME_MAPPING[hotelName] || hotelName;
            const hotelId = HOTEL_ID_MAP[normalizedHotel];
            
            if (hotelId) {
                const pkg = packagesData.find(p => 
                    p.category === packageName && p.hotel_id === hotelId
                );
                if (pkg) {
                    return pkg.package_only_id || pkg.id;
                }
            }
        }
        
        // Fallback: try to find any package with this category
        const pkg = packagesData.find(p => p.category === packageName);
        return pkg ? (pkg.package_only_id || pkg.id) : null;
    }
    
    // Helper function to calculate hotel nights
    function calculateHotelNights(arrivalDate, departureDate) {
        const arrival = new Date(arrivalDate);
        const departure = new Date(departureDate);
        const timeDiff = departure.getTime() - arrival.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return nights > 0 ? nights : 1;
    }
    
    // Cache for van destinations
    let vanDestinationsCache = null;
    
    // Helper function to get destination ID by name
    async function getDestinationIdByName(destinationName) {
        try {
            console.log('🔍 getDestinationIdByName called with:', destinationName);
            
            // Load destinations from cache or API
            if (!vanDestinationsCache) {
                console.log('📡 Fetching van destinations from API...');
                const response = await fetch(`${API_BASE_URL}/van-destinations`);
                const result = await response.json();
                
                console.log('📥 API response:', result);
                
                if (result.success && result.destinations) {
                    vanDestinationsCache = result.destinations;
                    console.log('✅ Van destinations cached:', vanDestinationsCache.length, 'destinations');
                } else {
                    console.warn('❌ Failed to load van destinations:', result.message);
                    return null;
                }
            } else {
                console.log('📦 Using cached van destinations');
            }
            
            console.log('🔎 Searching for destination:', destinationName);
            console.log('🗂️ Available destinations:', vanDestinationsCache.map(d => ({
                id: d.id || d.van_destination_id || d.destination_id,
                name: d.destination_name || d.name || d.destination,
                fullObject: d
            })));
            
            // Find destination by name (case-insensitive)
            const destination = vanDestinationsCache.find(dest => {
                const nameField = dest.destination_name || dest.name || dest.destination;
                const matches = nameField && nameField.toLowerCase() === destinationName.toLowerCase();
                console.log(`  Comparing "${nameField}" with "${destinationName}": ${matches}`);
                return matches;
            });
            
            if (destination) {
                const foundId = destination.id || destination.van_destination_id || destination.destination_id;
                console.log('✅ Destination found:', destination);
                console.log('📍 Using ID:', foundId);
                return foundId;
            } else {
                console.warn(`❌ Van destination not found: "${destinationName}"`);
                console.warn('💡 Available destination names:', vanDestinationsCache.map(d => 
                    d.destination_name || d.name || d.destination
                ));
                return null;
            }
        } catch (error) {
            console.error('❌ Error fetching destination ID:', error);
            console.error('Error stack:', error.stack);
            return null;
        }
    }

    window.goToHomePage = function() {
        // Clear all booking-related session storage
        sessionStorage.removeItem('completeBookingData');
        sessionStorage.removeItem('finalBookingData');
        sessionStorage.removeItem('tourSelections');
        sessionStorage.removeItem('bookingFormData');
        sessionStorage.removeItem('bookingOption');
        sessionStorage.removeItem('selectedPaymentMethod');
        sessionStorage.removeItem('paidAmount');
        
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
                
                // Load QR code image from database if available
                const qrData = qrCodesData.find(qr => qr.payment_method === paymentType);
                const qrContainer = document.querySelector('.qr-code-container-custom');
                
                if (qrContainer && qrData && qrData.qr_image_url) {
                    qrContainer.innerHTML = `<img src="${qrData.qr_image_url}" alt="${paymentNames[paymentType]} QR Code" style="max-width: 100%; height: auto; border-radius: 8px;">`;
                } else if (qrContainer) {
                    // Show default placeholder if no QR code is uploaded
                    qrContainer.innerHTML = `
                        <div class="text-center">
                            <i class="fas fa-qrcode fa-4x text-danger mb-2"></i>
                            <p class="text-muted small mb-0">QR Code</p>
                        </div>
                    `;
                }
                
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

        // Directly navigate to Upload Receipt step (step 6)
        currentStep = 6;
        showStep(currentStep);
    };

    // Fix accessibility issue: Remove focus from modal elements when modal is being hidden
    const paymentQRModal = document.getElementById('paymentQRModal');
    if (paymentQRModal) {
        paymentQRModal.addEventListener('hide.bs.modal', function() {
            // Blur any focused elements inside the modal before it's hidden
            const focusedElement = this.querySelector(':focus');
            if (focusedElement) {
                focusedElement.blur();
            }
        });
    }

    // ----------------------------
    // INITIALIZATION
    // ----------------------------
    
    // Initialize the page
    async function init() {
        console.log('Package Summary page initializing...');
        
        // Fetch hotels data first
        await fetchHotels();
        
        // Fetch packages data
        await fetchPackagesForSummary();
        
        // Load QR codes from database
        await loadQRCodes();
        
        if (loadBookingData()) {
            console.log('✅ Booking data loaded successfully');
            // Show step first, then populate (populateSummary is called in loadBookingData, but we'll call it again after step is shown)
            showStep(currentStep);
            // Ensure summary is populated after step is visible
            setTimeout(() => {
                if (bookingData) {
                    console.log('🔄 Repopulating summary after step is shown...');
                    populateSummary();
                }
            }, 200);
        } else {
            console.error('❌ Failed to load booking data');
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
