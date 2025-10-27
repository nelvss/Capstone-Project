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

    window.submitBooking = async function() {
        try {
            // Show loading state
            const submitBtn = document.querySelector('button[onclick="submitBooking()"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
            }
            
            // Generate booking reference
            const bookingRef = generateBookingReference();
            
            // Prepare booking data for API (matching actual database schema)
            const bookingPayload = {
                booking_id: bookingRef, // Send the generated booking ID
                customer_first_name: bookingData.firstName,
                customer_last_name: bookingData.lastName,
                customer_email: bookingData.emailAddress,
                customer_contact: bookingData.contactNo,
                booking_type: 'package_only',
                booking_preferences: `Package Only: ${bookingData.selectedPackage || 'N/A'}`, // Store in the specified format
                arrival_date: bookingData.arrivalDate,
                departure_date: bookingData.departureDate,
                number_of_tourist: parseInt(bookingData.touristCount || 1),
                package_only_id: getPackageIdByName(bookingData.selectedPackage),
                hotel_id: bookingData.selectedHotel ? getHotelIdByName(bookingData.selectedHotel) : null,
                hotel_nights: bookingData.selectedHotel ? calculateHotelNights(bookingData.arrivalDate, bookingData.departureDate) : null,
                status: 'pending'
            };
            
            console.log('Submitting booking to API:', bookingPayload);
            
            // Submit main booking to API
            const bookingResponse = await fetch('http://localhost:3000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingPayload)
            });
            
            const bookingResult = await bookingResponse.json();
            
            if (!bookingResult.success) {
                throw new Error(bookingResult.message || 'Failed to create booking');
            }
            
            const bookingId = bookingResult.booking.booking_id || bookingResult.booking.id;
            console.log('Booking created successfully with ID:', bookingId);
            
            // Submit package booking details
            if (bookingData.selectedPackage) {
                const packagePayload = {
                    booking_id: bookingId,
                    package_id: getPackageIdByName(bookingData.selectedPackage),
                    package_name: bookingData.selectedPackage,
                    package_price: parseFloat(bookingData.packageAmount?.replace(/[₱,]/g, '') || 0),
                    notes: `Tourists: ${bookingData.touristCount || 0}`
                };
                
                const packageResponse = await fetch('http://localhost:3000/api/package-booking', {
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
                    booking_type: 'package_only' // Track that this came from Package Only booking
                };
                
                const divingResponse = await fetch('http://localhost:3000/api/booking-diving', {
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
                    
                    return fetch('http://localhost:3000/api/booking-vehicles', {
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
            if (bookingData.vanDestination && bookingData.vanPlace) {
                try {
                    const destinationId = await getDestinationIdByName(bookingData.vanPlace);
                    
                    if (destinationId) {
                        const vanPayload = {
                            booking_id: bookingId,
                            destination_id: destinationId,
                            rental_days: parseInt(bookingData.vanDays) || 1,
                            total_price: parseFloat(bookingData.vanAmount?.replace(/[₱,]/g, '') || 0),
                            rental_start_date: null,
                            rental_end_date: null,
                            notes: ''
                        };
                        
                        const vanResponse = await fetch('http://localhost:3000/api/booking-van-rental', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(vanPayload)
                        });
                        
                        const vanResult = await vanResponse.json();
                        
                        if (!vanResult.success) {
                            console.warn('Van rental booking failed:', vanResult.message);
                        } else {
                            console.log('Van rental booking created successfully');
                        }
                    } else {
                        console.warn('Van rental skipped: destination not found in database');
                    }
                } catch (error) {
                    console.warn('Van rental booking submission error:', error);
                }
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
                                const uploadResponse = await fetch('http://localhost:3000/api/payments/upload-receipt', {
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
                    const paymentResponse = await fetch('http://localhost:3000/api/payments', {
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
                bookingReference: bookingRef,
                bookingId: bookingId,
                submissionDate: new Date().toISOString(),
                status: 'pending'
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
            
            // Show success message
            alert('✅ Booking submitted successfully! Your booking reference is: ' + bookingRef);
            
            // Move to confirmation step
            currentStep = 7;
            showStep(currentStep);
            
        } catch (error) {
            console.error('Booking submission error:', error);
            alert('❌ Failed to submit booking: ' + error.message);
            
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
            const response = await fetch('http://localhost:3000/api/hotels');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.hotels) {
                hotelsData = data.hotels;
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
    
    // Helper function to get package ID by name (you may need to implement this based on your package data)
    function getPackageIdByName(packageName) {
        // This is a placeholder - you should implement this based on your package data structure
        // For now, return null or a default ID
        return null;
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
            // Load destinations from cache or API
            if (!vanDestinationsCache) {
                const response = await fetch('http://localhost:3000/api/van-destinations');
                const result = await response.json();
                
                if (result.success && result.destinations) {
                    vanDestinationsCache = result.destinations;
                } else {
                    console.warn('Failed to load van destinations:', result.message);
                    return null;
                }
            }
            
            // Find destination by name (case-insensitive)
            const destination = vanDestinationsCache.find(dest => {
                const nameField = dest.destination_name || dest.name || dest.destination;
                return nameField && nameField.toLowerCase() === destinationName.toLowerCase();
            });
            
            if (destination) {
                return destination.id || destination.van_destination_id || destination.destination_id;
            } else {
                console.warn(`Van destination not found: ${destinationName}`);
                console.log('Available destinations:', vanDestinationsCache.map(d => ({
                    id: d.id || d.van_destination_id || d.destination_id,
                    name: d.destination_name || d.name || d.destination
                })));
                return null;
            }
        } catch (error) {
            console.error('Error fetching destination ID:', error);
            return null;
        }
    }

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
    async function init() {
        console.log('Package Summary page initializing...');
        
        // Fetch hotels data first
        await fetchHotels();
        
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
