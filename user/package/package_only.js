// tour_only.js - Tour Booking Form JavaScript
(() => {
    // ----------------------------
    // VALIDATION UTILITIES
    // ----------------------------
    
    const FIELD_LABELS = {
        touristCount: "Number of Tourist",
        rentalDays: "Select Rental Days",
        numberOfDiver: "Number of Divers"
    };

    // ----------------------------
    // VEHICLE DATA MANAGEMENT
    // ----------------------------
    
    let vehiclesData = [];
    
    // Global variable to store diving data
    let divingData = [];
    
    // Global variable to store van destinations data
    let vanDestinationsData = [];
    
    // Global variable to store packages data
    let packagesData = [];

    // API Base URL
    const API_BASE_URL = (window.API_BASE_URL && window.API_BASE_URL.length > 0)
        ? window.API_BASE_URL
        : 'https://api.otgpuertogaleratravel.com/api';

    // Fetch diving records from database
    async function fetchDiving() {
        try {
            console.log('🔄 Fetching diving records from API...');
            const response = await fetch(`${API_BASE_URL}/diving`, { cache: 'no-cache' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.diving) {
                divingData = result.diving;
                console.log('✅ Diving records loaded:', divingData.length, 'records');
                // Try to render immediately
                renderDivingOptions();
                // Also set up a backup render in case container isn't ready
                setTimeout(() => {
                    const container = document.getElementById('diving-options');
                    if (container && container.textContent.includes('Loading')) {
                        renderDivingOptions();
                    }
                }, 500);
                return divingData;
            } else {
                console.error('❌ Failed to fetch diving records:', result.message || 'Unknown error');
                renderDivingOptionsError(result.message || 'Failed to load diving records');
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching diving records:', error);
            renderDivingOptionsError(`Error: ${error.message}`);
            return [];
        }
    }

    // Render diving options dynamically from database
    function renderDivingOptions(retryCount = 0) {
        const divingOptionsContainer = document.getElementById('diving-options');
        if (!divingOptionsContainer) {
            if (retryCount < 5) {
                console.warn(`⚠️ Diving options container not found. Retrying... (${retryCount + 1}/5)`);
                setTimeout(() => {
                    renderDivingOptions(retryCount + 1);
                }, 500);
            } else {
                console.error('❌ Diving options container not found after 5 retries');
            }
            return;
        }

        // Clear existing content
        divingOptionsContainer.innerHTML = '';

        if (!divingData || divingData.length === 0) {
            divingOptionsContainer.innerHTML = '<div class="text-center text-muted py-3"><small>No diving services available</small></div>';
            return;
        }

        // Filter out invalid diving records
        const validDiving = divingData.filter(diving => diving.name && diving.name.trim() !== '' && diving.name.toUpperCase() !== 'N/A');
        
        if (validDiving.length === 0) {
            divingOptionsContainer.innerHTML = '<div class="text-center text-muted py-3"><small>No diving services available</small></div>';
            return;
        }
        
        // Render each diving option from database
        validDiving.forEach((diving, index) => {
            const divingId = `diving-${diving.diving_id || `diving-${index}`}`;
            const divingName = diving.name || 'Unknown Diving Service';
            const isLast = index === validDiving.length - 1;
            
            const divingOption = document.createElement('div');
            divingOption.className = `form-check ${isLast ? '' : 'mb-2'}`;
            
            // Create input element
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input diving-option';
            input.id = divingId;
            input.value = divingName;
            input.dataset.divingId = diving.diving_id; // Store diving_id for reference
            input.dataset.pricePerHead = diving.price_per_head || 0; // Store price for calculation
            
            // Create label element with for attribute
            const label = document.createElement('label');
            label.className = 'form-check-label d-flex align-items-center';
            label.htmlFor = divingId;
            
            // Create span for label text
            const span = document.createElement('span');
            span.innerHTML = `${divingName} <small class="text-muted ms-2">(₱${(diving.price_per_head || 0).toLocaleString()}/head)</small>`;
            
            // Add input and label as siblings
            divingOption.appendChild(input);
            label.appendChild(span);
            divingOption.appendChild(label);
            
            divingOptionsContainer.appendChild(divingOption);
        });

        // Re-attach event listeners for diving selection
        attachDivingEventListeners();
    }

    // Render error message in diving options
    function renderDivingOptionsError(errorMessage) {
        const divingOptionsContainer = document.getElementById('diving-options');
        if (!divingOptionsContainer) {
            console.warn('⚠️ Diving options container not found for error display');
            return;
        }
        divingOptionsContainer.innerHTML = `<div class="text-center text-danger py-3"><small>${errorMessage}</small><br><small class="text-muted">Please refresh the page.</small></div>`;
    }

    // Attach event listeners to diving options
    function attachDivingEventListeners() {
        const divingOptions = document.querySelectorAll('.diving-option');
        divingOptions.forEach(option => {
            // Remove existing listeners by cloning
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            // Add new listener
            newOption.addEventListener('change', () => {
                calculateDivingPrice();
                clearNumberOfDiversErrorIfNoDiving();
            });
        });
    }

    // Get diving by name or ID
    function getDivingByName(divingName) {
        if (!divingData || divingData.length === 0) {
            console.warn('No diving data available');
            return null;
        }
        
        // Try exact match first
        let diving = divingData.find(d => d.name === divingName);
        
        // If no exact match, try case-insensitive match
        if (!diving) {
            diving = divingData.find(d => 
                d.name && d.name.toLowerCase() === divingName.toLowerCase()
            );
        }
        
        return diving;
    }

    // Fetch van destinations from database
    async function fetchVanDestinations() {
        try {
            console.log('🔄 Fetching van destinations from API...');
            const response = await fetch(`${API_BASE_URL}/van-destinations`, { cache: 'no-cache' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.destinations) {
                vanDestinationsData = result.destinations;
                console.log('✅ Van destinations loaded:', vanDestinationsData.length, 'destinations');
                // Populate dropdowns immediately
                populateVanDestinationDropdowns();
                return vanDestinationsData;
            } else {
                console.error('❌ Failed to fetch van destinations:', result.message || 'Unknown error');
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching van destinations:', error);
            return [];
        }
    }

    // Populate van destination dropdowns based on location type
    function populateVanDestinationDropdowns() {
        if (!vanDestinationsData || vanDestinationsData.length === 0) {
            console.warn('⚠️ No van destinations data available');
            return;
        }

        const currentDestination = destinationSelect?.value || '';
        const currentPlace = document.getElementById('placeSelect')?.value || '';

        populatePlaceOptions(currentDestination, currentPlace);

        console.log('✅ Van destination options refreshed for', currentDestination || 'no selection');
    }

    // Get van destination by name
    function getVanDestinationByName(destinationName) {
        if (!vanDestinationsData || vanDestinationsData.length === 0) {
            console.warn('No van destinations data available');
            return null;
        }
        
        // Try exact match first
        let destination = vanDestinationsData.find(d => d.destination_name === destinationName);
        
        // If no exact match, try case-insensitive match
        if (!destination) {
            destination = vanDestinationsData.find(d => 
                d.destination_name && d.destination_name.toLowerCase() === destinationName.toLowerCase()
            );
        }
        
        return destination;
    }

    // ----------------------------
    // PACKAGE DATA MANAGEMENT
    // ----------------------------
    
    // Hotel name mapping between booking page and settings
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
    
    // Hotel ID mapping from settings (reverse lookup)
    const HOTEL_ID_MAP = {
        'Ilaya': '08e190f4-60da-4188-9c8b-de535ef3fcf2',
        'Casa de Honcho': '11986747-1a86-4d88-a952-a66b69c7e3ec',
        'Bliss': '2da89c09-1c3d-4cd5-817d-637c1c0289de',
        'SouthView': '7c071f4b-5ced-4f34-8864-755e5a4d5c38',
        'The Mangyan Grand Hotel': 'd824f56b-db62-442c-9cf4-26f4c0cc83d0'
    };
    
    // Normalize hotel name for lookup
    function normalizeHotelName(hotelName) {
        if (!hotelName) return null;
        return HOTEL_NAME_MAPPING[hotelName] || hotelName;
    }
    
    // Get hotel ID by name
    function getHotelIdFromName(hotelName) {
        const normalized = normalizeHotelName(hotelName);
        return HOTEL_ID_MAP[normalized] || null;
    }
    
    // Fetch packages from database
    async function fetchPackages() {
        try {
            console.log('🔄 Fetching packages from API...');
            // Add timestamp to force fresh fetch and bypass cache
            const timestamp = new Date().getTime();
            const response = await fetch(`${API_BASE_URL}/package-only?include=pricing&_t=${timestamp}`, { 
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.packages) {
                packagesData = result.packages;
                console.log('✅ Packages loaded:', packagesData.length, 'packages');
                
                // Log package details for debugging
                packagesData.forEach(pkg => {
                    console.log(`📦 Package: ${pkg.category}, Hotel ID: ${pkg.hotel_id}, Pricing tiers: ${pkg.pricing?.length || 0}`);
                    if (pkg.pricing && pkg.pricing.length > 0) {
                        pkg.pricing.forEach(tier => {
                            console.log(`   Tier: ${tier.min_tourist}-${tier.max_tourist}, Price: ₱${tier.price_per_head}`);
                        });
                    }
                });
                
                // Refresh package prices after fetching (will use hotels if available)
                refreshPackagePrices();
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
    
    // Get package by category and hotel
    function getPackageByCategoryAndHotel(category, hotelName) {
        if (!packagesData || packagesData.length === 0) {
            console.warn(`⚠️ No packages data available when looking for ${category} at ${hotelName}`);
            return null;
        }
        
        const hotelId = getHotelIdFromName(hotelName);
        if (!hotelId) {
            console.warn(`⚠️ Hotel ID not found for: ${hotelName}`);
            console.log('Available hotels in mapping:', Object.keys(HOTEL_ID_MAP));
            return null;
        }
        
        const pkg = packagesData.find(pkg => 
            pkg.category === category && pkg.hotel_id === hotelId
        );
        
        if (!pkg) {
            console.warn(`⚠️ Package not found: category=${category}, hotelName=${hotelName}, hotelId=${hotelId}`);
            console.log('Available packages:', packagesData.map(p => `{category: ${p.category}, hotel_id: ${p.hotel_id}}`));
        } else {
            console.log(`✅ Found package: ${category} at ${hotelName} (ID: ${hotelId})`);
        }
        
        return pkg || null;
    }
    
    // Get package by ID
    function getPackageById(packageId) {
        if (!packagesData || packagesData.length === 0) return null;
        return packagesData.find(pkg => 
            pkg.package_only_id === packageId || pkg.id === packageId
        ) || null;
    }
    
    // Get package ID by name (category)
    function getPackageIdByName(packageName) {
        // This is used when we have a selected hotel
        const selectedHotel = document.querySelector('input[name="hotel-selection"]:checked');
        const hotelName = selectedHotel ? selectedHotel.value : null;
        
        if (hotelName) {
            const pkg = getPackageByCategoryAndHotel(packageName, hotelName);
            if (pkg) {
                return pkg.package_only_id || pkg.id;
            }
        }
        
        // Fallback: try to find any package with this category
        const pkg = packagesData.find(p => p.category === packageName);
        return pkg ? (pkg.package_only_id || pkg.id) : null;
    }

    // Fetch vehicles from database
    async function fetchVehicles() {
        try {
            console.log('🔄 Fetching vehicles from API...');
            const response = await fetch(`${API_BASE_URL}/vehicles`, { cache: 'no-cache' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.vehicles) {
                vehiclesData = result.vehicles;
                console.log('✅ Vehicles loaded:', vehiclesData.length, 'vehicles');
                // Try to render immediately
                renderVehicleOptions();
                // Also set up a backup render in case container isn't ready
                setTimeout(() => {
                    const container = document.getElementById('rental-options');
                    if (container && container.textContent.includes('Loading')) {
                        renderVehicleOptions();
                    }
                }, 500);
                return vehiclesData;
            } else {
                console.error('❌ Failed to fetch vehicles:', result.message || 'Unknown error');
                renderVehicleOptionsError(result.message || 'Failed to load vehicles');
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching vehicles:', error);
            renderVehicleOptionsError(`Error: ${error.message}`);
            return [];
        }
    }

    // Render vehicle options dynamically from database
    function renderVehicleOptions(retryCount = 0) {
        const rentalOptionsContainer = document.getElementById('rental-options');
        if (!rentalOptionsContainer) {
            if (retryCount < 5) {
                console.warn(`⚠️ Rental options container not found. Retrying... (${retryCount + 1}/5)`);
                setTimeout(() => {
                    renderVehicleOptions(retryCount + 1);
                }, 500);
            } else {
                console.error('❌ Rental options container not found after 5 retries');
            }
            return;
        }

        // Clear existing content
        rentalOptionsContainer.innerHTML = '';

        if (!vehiclesData || vehiclesData.length === 0) {
            rentalOptionsContainer.innerHTML = '<div class="text-center text-muted py-3"><small>No vehicles available</small></div>';
            return;
        }

        // Filter out N/A vehicles
        const validVehicles = vehiclesData.filter(vehicle => vehicle.name && vehicle.name.trim() !== '' && vehicle.name.toUpperCase() !== 'N/A');
        
        if (validVehicles.length === 0) {
            rentalOptionsContainer.innerHTML = '<div class="text-center text-muted py-3"><small>No vehicles available</small></div>';
            return;
        }
        
        // Render each vehicle from database
        validVehicles.forEach((vehicle, index) => {
            const vehicleId = `rental-${vehicle.vehicle_id || `vehicle-${index}`}`;
            const vehicleName = vehicle.name || 'Unknown Vehicle';
            const isLast = index === validVehicles.length - 1;
            
            const vehicleOption = document.createElement('div');
            vehicleOption.className = `form-check ${isLast ? '' : 'mb-2'}`;
            
            // Create input element
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input rental-option';
            input.id = vehicleId;
            input.value = vehicleName;
            
            // Create label element with for attribute (Bootstrap form-check pattern)
            const label = document.createElement('label');
            label.className = 'form-check-label d-flex align-items-center';
            label.htmlFor = vehicleId; // Associate label with input using for attribute
            
            // Create span for label text
            const span = document.createElement('span');
            span.innerHTML = `${vehicleName} <small class="text-muted ms-2">(₱${(vehicle.price_per_day || 0).toLocaleString()}/day)</small>`;
            
            // Add input and label as siblings (Bootstrap form-check pattern)
            vehicleOption.appendChild(input);
            label.appendChild(span);
            vehicleOption.appendChild(label);
            
            rentalOptionsContainer.appendChild(vehicleOption);
        });

        // Re-attach event listeners for vehicle selection
        attachVehicleEventListeners();
    }

    // Render error message in vehicle options
    function renderVehicleOptionsError(errorMessage) {
        const rentalOptionsContainer = document.getElementById('rental-options');
        if (!rentalOptionsContainer) {
            console.warn('⚠️ Rental options container not found for error display');
            return;
        }
        rentalOptionsContainer.innerHTML = `<div class="text-center text-danger py-3"><small>${errorMessage}</small><br><small class="text-muted">Please refresh the page.</small></div>`;
    }

    // Attach event listeners to rental vehicle options
    function attachVehicleEventListeners() {
        const rentalOptions = document.querySelectorAll('.rental-option');
        rentalOptions.forEach(option => {
            // Remove existing listeners by cloning
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            // Add new listener
            newOption.addEventListener('change', () => {
                calculateVehiclePrice();
                clearRentalDaysErrorIfNoVehicles();
            });
        });
    }
    
    // Get vehicle by name (for backward compatibility)
    function getVehicleByName(vehicleName) {
        // If no vehicles data loaded, return null
        if (!vehiclesData || vehiclesData.length === 0) {
            console.warn('No vehicles data available, using fallback pricing');
            return null;
        }
        
        // Try exact match first
        let vehicle = vehiclesData.find(v => v.name === vehicleName);
        
        // If no exact match, try case-insensitive match
        if (!vehicle) {
            vehicle = vehiclesData.find(v => 
                v.name && v.name.toLowerCase() === vehicleName.toLowerCase()
            );
        }
        
        // If still no match, try partial match
        if (!vehicle) {
            vehicle = vehiclesData.find(v => 
                v.name && v.name.toLowerCase().includes(vehicleName.toLowerCase())
            );
        }
        
        console.log(`Looking for vehicle: "${vehicleName}", found:`, vehicle);
        return vehicle;
    }
    
    // Fallback pricing for when database data is not available
    function getFallbackPricing(vehicleType) {
        const fallbackRates = {
            "ADV": 1000,
            "NMAX": 1000,
            "VERSYS 650": 2000,
            "VERSYS 1000": 2500,
            "TUKTUK": 1800,
            "CAR": 3000
        };
        return fallbackRates[vehicleType] || 0;
    }

    function setError(inputEl, message) {
        // error holder is the next sibling after .form-floating
        const errorHolder = inputEl.closest(".form-floating")?.nextElementSibling;
        if (!errorHolder) return; // silent guard
        if (message) {
            inputEl.classList.add("is-invalid");
            errorHolder.textContent = message;
        } else {
            inputEl.classList.remove("is-invalid");
            errorHolder.textContent = "";
        }
    }

    // ----------------------------
    // FORM VALIDATION
    // ----------------------------
    
    function validateStep2() {
        let valid = true;
        
        // Check if at least one service is selected:
        // 1. Tour packages (island, inland, or snorkeling)
        // 2. Rental vehicle
        // 3. Diving
        
        const errorMessageDiv = document.getElementById("step2-error-message");
        const errorTextSpan = document.getElementById("step2-error-text");
        const touristCountInput = document.getElementById("touristCount");
        const rentalDaysSelect = document.getElementById("rentalDays");
        const numberOfDiversInput = document.getElementById("numberOfDiver");
        
        // Check if a package is selected
        const selectedPackage = document.querySelector('input[name="package-selection"]:checked');
        const hasTourPackages = selectedPackage !== null;
        
        // Check rental vehicles
        const rentalVehicles = document.querySelectorAll('.rental-option:checked');
        const hasRentalVehicle = rentalVehicles.length > 0;
        
        // Check van rental with tourist franchise
        const franchiseDestination = document.getElementById('destinationSelect');
        const hasFranchiseRental = franchiseDestination && franchiseDestination.value !== "";
        
        // Check diving
        const divingOptions = document.querySelectorAll('.diving-option:checked');
        const hasDiving = divingOptions.length > 0;
        
        // Clear previous errors
        if (touristCountInput) {
            setError(touristCountInput, "");
        }
        if (rentalDaysSelect) {
            setError(rentalDaysSelect, "");
        }
        if (numberOfDiversInput) {
            setError(numberOfDiversInput, "");
        }
        
        // Validate that at least one service is selected
        if (!hasTourPackages && !hasRentalVehicle && !hasFranchiseRental && !hasDiving) {
            // Show error message
            if (errorMessageDiv && errorTextSpan) {
                errorTextSpan.textContent = 'Please select at least one service (Tour Package, Van Rental, Van Rental with Tourist Franchise, or Diving).';
                errorMessageDiv.style.display = 'block';
                // Scroll to the error message
                errorMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
        
        // If tour packages are selected, validate tourist count
        if (hasTourPackages) {
            const touristCount = parseInt(touristCountInput.value) || 0;
            
            if (touristCount === 0 || touristCountInput.value.trim() === "") {
                setError(touristCountInput, "Number of Tourist is required when selecting a package.");
                valid = false;
                // Focus on the tourist count input
                touristCountInput.focus();
            } else if (touristCount < 1) {
                setError(touristCountInput, "Number of Tourist must be at least 2 for package bookings.");
                valid = false;
                touristCountInput.focus();
            }
        }
        
        // If rental vehicles are selected, validate rental days
        if (hasRentalVehicle) {
            const rentalDays = rentalDaysSelect.value;
            
            if (!rentalDays || rentalDays === "") {
                setError(rentalDaysSelect, "Select Rental Days is required when selecting rental vehicles.");
                valid = false;
                // Focus on the rental days select if tourist count was valid
                if (hasTourPackages && parseInt(touristCountInput.value) > 0) {
                    rentalDaysSelect.focus();
                } else if (!hasTourPackages) {
                    rentalDaysSelect.focus();
                }
            }
        }
        
        // If diving is selected, validate number of divers
        if (hasDiving) {
            const numberOfDivers = parseInt(numberOfDiversInput.value) || 0;
            
            if (numberOfDivers === 0 || numberOfDiversInput.value.trim() === "") {
                setError(numberOfDiversInput, "Number of Divers is required when selecting diving service.");
                valid = false;
                // Focus on the number of divers input if previous validations passed
                if (!hasTourPackages && !hasRentalVehicle) {
                    numberOfDiversInput.focus();
                } else if (hasTourPackages && parseInt(touristCountInput.value) > 0 && (!hasRentalVehicle || rentalDaysSelect.value !== "")) {
                    numberOfDiversInput.focus();
                } else if (!hasTourPackages && hasRentalVehicle && rentalDaysSelect.value !== "") {
                    numberOfDiversInput.focus();
                }
            } else if (numberOfDivers < 1) {
                setError(numberOfDiversInput, "Number of Divers must be at least 1.");
                valid = false;
                numberOfDiversInput.focus();
            }
        }
        
        // Hide the general error message if validation passes
        if (valid && errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
        }
        
        return valid;
    }

    // Function to clear Step 2 error message when user makes a selection
    function clearStep2Error() {
        const errorMessageDiv = document.getElementById("step2-error-message");
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
        }
    }

    // Function to clear tourist count error if no tour packages are selected
    function clearTouristCountErrorIfNoTours() {
        const touristCountInput = document.getElementById("touristCount");
        const selectedPackage = document.querySelector('input[name="package-selection"]:checked');
        const hasTourPackages = selectedPackage !== null;
        
        // Clear tourist count error if no tour packages are selected
        if (!hasTourPackages && touristCountInput) {
            setError(touristCountInput, "");
        }
    }

    // Function to clear rental days error if no rental vehicles are selected
    function clearRentalDaysErrorIfNoVehicles() {
        const rentalDaysSelect = document.getElementById("rentalDays");
        const rentalVehicles = document.querySelectorAll('.rental-option:checked');
        const hasRentalVehicle = rentalVehicles.length > 0;
        
        // Clear rental days error if no rental vehicles are selected
        if (!hasRentalVehicle && rentalDaysSelect) {
            setError(rentalDaysSelect, "");
        }
    }

    // Function to clear number of divers error if diving is not selected
    function clearNumberOfDiversErrorIfNoDiving() {
        const numberOfDiversInput = document.getElementById("numberOfDiver");
        const divingOptions = document.querySelectorAll('.diving-option:checked');
        const hasDiving = divingOptions.length > 0;
        
        // Clear number of divers error if diving is not selected
        if (!hasDiving && numberOfDiversInput) {
            setError(numberOfDiversInput, "");
        }
    }

    // ----------------------------
    // MULTI-SELECT DROPDOWN FUNCTIONALITY
    // ----------------------------
    
    function wireMultiSelect(selectAllId, optionsContainerId, optionClass, selectionMessageId) {
        const selectAll = document.getElementById(selectAllId);
        const optionsContainer = document.getElementById(optionsContainerId);
        const selectionMessage = selectionMessageId
            ? document.getElementById(selectionMessageId)
            : null;
        if (!selectAll || !optionsContainer) return;

        const optionCheckboxes = Array.from(
            optionsContainer.querySelectorAll(`.${optionClass}`)
        );

        function updateSelectAllState() {
            const total = optionCheckboxes.length;
            const checkedCount = optionCheckboxes.filter(cb => cb.checked).length;
            if (checkedCount === 0) {
                selectAll.indeterminate = false;
                selectAll.checked = false;
            } else if (checkedCount === total) {
                selectAll.indeterminate = false;
                selectAll.checked = true;
            } else {
                selectAll.indeterminate = true;
                selectAll.checked = false;
            }
        }

        function updateSelectionMessage() {
            if (!selectionMessage) return;
            const selected = optionCheckboxes
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            selectionMessage.textContent = selected.length
                ? `Selected: ${selected.join(", ")}`
                : "No destinations selected";
        }

        selectAll.addEventListener("change", () => {
            const check = selectAll.checked;
            optionCheckboxes.forEach(cb => {
                cb.checked = check;
            });
            updateSelectAllState();
            updateSelectionMessage();
            updateHotelsRowVisibility();
            updatePackagePrice();
            clearStep2Error();
            clearTouristCountErrorIfNoTours();
        });

        optionCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                updateSelectAllState();
                updateSelectionMessage();
                updateHotelsRowVisibility();
                updatePackagePrice();
                clearStep2Error();
                clearTouristCountErrorIfNoTours();
            });
        });

        updateSelectAllState();
        updateSelectionMessage();
        updateHotelsRowVisibility();
    }

    // ----------------------------
    // HOTELS ROW VISIBILITY CONTROL
    // ----------------------------
    
    // Control Hotels row visibility based on package selection
    function updateHotelsRowVisibility() {
        const hotelsRow = document.getElementById("hotelsRow");
        if (!hotelsRow) return;
        
        // Always show hotels (don't hide based on package selection)
        hotelsRow.classList.add("is-visible");
        
        // Update days visibility when hotels row visibility changes
        updateDaysVisibility();
    }

    // Function to control days input visibility
    function updateDaysVisibility() {
        const daysGroup = document.getElementById("daysGroup");
        const hotelsRow = document.getElementById("hotelsRow");
        
        if (daysGroup && hotelsRow) {
            // Show days field when hotels row is visible (i.e., when tour packages are selected)
            const isHotelsRowVisible = hotelsRow.classList.contains("is-visible");
            daysGroup.style.display = isHotelsRowVisible ? "block" : "none";
            
            if (!isHotelsRowVisible) {
                const daysInput = document.getElementById("days");
                if (daysInput) daysInput.value = "";
            } else {
                calculateDuration(); // Update days when showing
            }
        }
    }

    // ----------------------------
    // PACKAGE PRICING CALCULATIONS
    // ----------------------------

    // Hotel-based package pricing based on tourist count, selected package, and hotel (using database ONLY)
    function calculatePackagePricing(selectedPackage, touristCount, selectedHotel) {
        if (!selectedPackage || !touristCount || touristCount <= 0) {
            console.warn('⚠️ Invalid parameters for calculatePackagePricing:', { selectedPackage, touristCount, selectedHotel });
            return { pricePerPax: 0, totalPrice: 0 };
        }
        
        // Ensure packages are loaded
        if (!packagesData || packagesData.length === 0) {
            console.error('❌ Packages data not loaded yet! Cannot calculate pricing.');
            return { pricePerPax: 0, totalPrice: 0 };
        }
        
        // Try to get package from database
        const pkg = getPackageByCategoryAndHotel(selectedPackage, selectedHotel);
        
        if (!pkg) {
            console.error(`❌ Package not found in database: ${selectedPackage} for hotel: ${selectedHotel}`);
            return { pricePerPax: 0, totalPrice: 0 };
        }
        
        if (!pkg.pricing || !Array.isArray(pkg.pricing) || pkg.pricing.length === 0) {
            console.error(`❌ No pricing tiers found in database for hotel: ${selectedHotel}, package: ${selectedPackage}`);
            return { pricePerPax: 0, totalPrice: 0 };
        }
        
        console.log(`💰 Calculating price for ${selectedPackage} at ${selectedHotel} with ${touristCount} tourists`);
        
        // Find the appropriate pricing tier based on tourist count
        let matchingTier = null;
        
        // Sort pricing tiers by min_tourist to ensure proper matching
        const sortedPricing = [...pkg.pricing].sort((a, b) => a.min_tourist - b.min_tourist);
        
        for (const tier of sortedPricing) {
            const min = tier.min_tourist || 0;
            const max = tier.max_tourist || Infinity;
            
            if (touristCount >= min && touristCount <= max) {
                matchingTier = tier;
                break;
            }
        }
        
        // If no exact match found, try to find the closest tier
        if (!matchingTier) {
            // Find the tier with the highest max_tourist that's less than touristCount
            for (let i = sortedPricing.length - 1; i >= 0; i--) {
                if (touristCount > sortedPricing[i].max_tourist) {
                    matchingTier = sortedPricing[i];
                    break;
                }
            }
            // If still no match, use the last tier (highest max)
            if (!matchingTier && sortedPricing.length > 0) {
                matchingTier = sortedPricing[sortedPricing.length - 1];
            }
        }
        
        if (!matchingTier || !matchingTier.price_per_head) {
            console.error(`❌ No matching pricing tier found for ${touristCount} tourists. Available tiers:`, sortedPricing.map(t => `${t.min_tourist}-${t.max_tourist} (₱${t.price_per_head})`).join(', '));
            return { pricePerPax: 0, totalPrice: 0 };
        }
        
        const pricePerPax = matchingTier.price_per_head;
        const totalPrice = pricePerPax * touristCount;
        
        console.log(`✅ Price calculated: ₱${pricePerPax} per pax x ${touristCount} = ₱${totalPrice} (tier: ${matchingTier.min_tourist}-${matchingTier.max_tourist})`);
        
        return { pricePerPax, totalPrice };
    }

    // Function to update selected package pricing
    function updatePackageSelectionPricing() {
        console.log('updatePackageSelectionPricing called');
        
        const touristCountInput = document.getElementById("touristCount");
        const selectedPackageInput = document.querySelector('input[name="package-selection"]:checked');
        const selectedHotelInput = document.querySelector('input[name="hotel-selection"]:checked');
        const selectedPackageText = document.getElementById("selectedPackageText");
        
        if (!touristCountInput) {
            console.log('Missing required inputs');
            return;
        }
        
        const touristCount = parseInt(touristCountInput.value) || 0;
        const selectedPackage = selectedPackageInput ? selectedPackageInput.value : null;
        const selectedHotel = selectedHotelInput ? selectedHotelInput.value : null;
        
        console.log('Tourist count:', touristCount, 'Selected package:', selectedPackage, 'Selected hotel:', selectedHotel);
        
        if (selectedPackage && touristCount > 0) {
            // Check if tourist count is valid for the selected package
            if (touristCount < 1) {
                selectedPackageText.innerHTML = `${selectedPackage} <small class="text-danger">(Min 1 pax)</small>`;
                // Still update total amount even when invalid
                calculateTotalAmount();
                return;
            }
            
            const pricing = calculatePackagePricing(selectedPackage, touristCount, selectedHotel);
            
            if (pricing.pricePerPax > 0) {
                // Update selected package text with pricing info and hotel indication
                const hotelIndicator = selectedHotel ? ` - ${selectedHotel.split(' ')[0]}` : '';
                selectedPackageText.innerHTML = `${selectedPackage}${hotelIndicator} <small class="text-muted">(₱${pricing.pricePerPax.toLocaleString()} x ${touristCount})</small>`;
            } else {
                selectedPackageText.innerHTML = `${selectedPackage} <small class="text-warning">(Invalid count)</small>`;
            }
        } else if (selectedPackage && !touristCount) {
            const hotelIndicator = selectedHotel ? ` - ${selectedHotel.split(' ')[0]}` : '';
            selectedPackageText.innerHTML = `${selectedPackage}${hotelIndicator} <small class="text-muted">(Enter tourist count)</small>`;
        } else {
            selectedPackageText.textContent = "Select Package";
        }
        
        // Update package dropdown prices based on selected hotel
        if (selectedHotel) {
            updatePackageDropdownPrices(selectedHotel);
        }
        
        // Update total amount whenever package price changes
        console.log('Calling calculateTotalAmount from updatePackageSelectionPricing');
        calculateTotalAmount();
    }

    // Function to render package options dynamically from database
    function renderPackageOptions() {
        if (!packagesData || packagesData.length === 0) {
            console.warn('No package data available to render');
            return;
        }
        
        // Update package dropdown prices for currently selected hotel, or first available hotel
        const selectedHotel = document.querySelector('input[name="hotel-selection"]:checked');
        if (selectedHotel) {
            updatePackageDropdownPrices(selectedHotel.value);
        } else {
            // If no hotel selected, update with first available hotel from hotelsData
            if (hotelsData && hotelsData.length > 0) {
                const firstHotel = hotelsData[0];
                updatePackageDropdownPrices(firstHotel.name);
            } else {
                // Try to get first hotel from radio buttons
                const firstHotelOption = document.querySelector('input[name="hotel-selection"]');
                if (firstHotelOption) {
                    updatePackageDropdownPrices(firstHotelOption.value);
                }
            }
        }
    }
    
    // Function to update price displays in package dropdowns based on selected hotel (using database)
    function updatePackageDropdownPrices(selectedHotel) {
        console.log('🔄 Updating dropdown prices for hotel:', selectedHotel);
        
        if (!packagesData || packagesData.length === 0) {
            console.warn('⚠️ No package data available');
            return;
        }
        
        if (!selectedHotel) {
            console.warn('⚠️ No hotel selected for price update');
            return;
        }
        
        const packages = ['Package 1', 'Package 2', 'Package 3', 'Package 4'];
        
        packages.forEach(packageName => {
            // Get package from database for this hotel
            const pkg = getPackageByCategoryAndHotel(packageName, selectedHotel);
            
            if (!pkg) {
                console.warn(`⚠️ Package not found: ${packageName} for hotel ${selectedHotel}`);
                return;
            }
            
            if (!pkg.pricing || !Array.isArray(pkg.pricing) || pkg.pricing.length === 0) {
                console.warn(`⚠️ No pricing data for ${packageName} at ${selectedHotel}`);
                return;
            }
            
            console.log(`✅ Found package ${packageName} for ${selectedHotel} with ${pkg.pricing.length} pricing tiers`);
            
            // Sort pricing tiers by min_tourist
            const sortedPricing = [...pkg.pricing].sort((a, b) => a.min_tourist - b.min_tourist);
            
            // Find all price spans for current package using data attributes
            const priceSpans = document.querySelectorAll(`[data-package="${packageName}"].package-price`);
            
            priceSpans.forEach(span => {
                const touristTier = parseInt(span.getAttribute('data-tier'));
                
                if (touristTier) {
                    // Find matching pricing tier - check if touristTier falls within any tier range
                    let matchingTier = null;
                    
                    for (const tier of sortedPricing) {
                        const min = tier.min_tourist || 0;
                        const max = tier.max_tourist || Infinity;
                        
                        if (touristTier >= min && touristTier <= max) {
                            matchingTier = tier;
                            break;
                        }
                    }
                    
                    // If no exact match, try to find the best matching tier
                    // The data-tier values represent: 1, 2, 3 (for 3-4), 5 (for 5-6), 7 (for 7-9), 10 (for 10+)
                    if (!matchingTier) {
                        if (touristTier === 1) {
                            matchingTier = sortedPricing.find(t => t.min_tourist === 1);
                        } else if (touristTier === 2) {
                            matchingTier = sortedPricing.find(t => t.min_tourist === 2);
                        } else if (touristTier === 3) {
                            // Look for 3-4 range
                            matchingTier = sortedPricing.find(t => t.min_tourist === 3 && (t.max_tourist === 4 || t.max_tourist >= 4));
                        } else if (touristTier === 5) {
                            // Look for 5-6 range
                            matchingTier = sortedPricing.find(t => t.min_tourist === 5 && (t.max_tourist === 6 || t.max_tourist >= 6));
                        } else if (touristTier === 7) {
                            // Look for 7-9 range
                            matchingTier = sortedPricing.find(t => t.min_tourist === 7 && (t.max_tourist === 9 || t.max_tourist >= 9));
                        } else if (touristTier === 10) {
                            // Look for 10+ range (min_tourist >= 10)
                            matchingTier = sortedPricing.find(t => t.min_tourist >= 10);
                        }
                        
                        // If still no match, use the tier that contains this number or the closest one
                        if (!matchingTier) {
                            // Find tier with highest max that's less than touristTier, or lowest min that's greater
                            for (let i = sortedPricing.length - 1; i >= 0; i--) {
                                if (touristTier >= sortedPricing[i].min_tourist) {
                                    matchingTier = sortedPricing[i];
                                    break;
                                }
                            }
                            // If still no match, use the last tier (highest range)
                            if (!matchingTier && sortedPricing.length > 0) {
                                matchingTier = sortedPricing[sortedPricing.length - 1];
                            }
                        }
                    }
                    
                    if (matchingTier && matchingTier.price_per_head) {
                        const priceToUse = matchingTier.price_per_head;
                        const oldPrice = span.textContent;
                        span.textContent = `₱${priceToUse.toLocaleString()}`;
                        console.log(`✅ Updated ${packageName} tier ${touristTier} (${matchingTier.min_tourist}-${matchingTier.max_tourist}) from ${oldPrice} to ₱${priceToUse.toLocaleString()}`);
                    } else {
                        console.warn(`⚠️ No matching tier found for ${packageName} tier ${touristTier} - available tiers:`, sortedPricing.map(t => `${t.min_tourist}-${t.max_tourist}`).join(', '));
                    }
                }
            });
        });
    }

    // ----------------------------
    // LEGACY PRICING CALCULATIONS (kept for compatibility)
    // ----------------------------

    // ISLAND TOUR PRICING
    function calculateIslandTourPrice(touristCount) {
        if (!touristCount || touristCount <= 0) return 0;
        
        let pricePerPerson = 0;
        
        if (touristCount === 1) {
            pricePerPerson = 3000;
        } else if (touristCount === 2) {
            pricePerPerson = 1600;
        } else if (touristCount >= 3 && touristCount <= 4) {
            pricePerPerson = 1000;
        } else if (touristCount >= 5) {
            pricePerPerson = 800;
        }
        
        return pricePerPerson * touristCount;
    }

    // INLAND TOUR PRICING
    function calculateInlandTourPrice(touristCount) {
        if (!touristCount || touristCount <= 0) return 0;

        let pricePerPerson = 0;

        if (touristCount === 2) {
            pricePerPerson = 1500;
        } else if (touristCount === 3) {
            pricePerPerson = 1100;
        } else if (touristCount === 4) {
            pricePerPerson = 800;
        } else if (touristCount >= 5 && touristCount <= 6) {
            pricePerPerson = 700;
        } else if (touristCount >= 7 && touristCount <= 9) {
            pricePerPerson = 600;
        } else if (touristCount >= 10) {
            pricePerPerson = 550;
        }

        return pricePerPerson * touristCount;
    }

    // SNORKELING TOUR PRICING
    function calculateSnorkelingTourPrice(touristCount) {
        if (!touristCount || touristCount <= 0) return 0;

        let pricePerPerson = 0;

        if (touristCount === 1) {
            pricePerPerson = 2400;
        } else if (touristCount === 2) {
            pricePerPerson = 1300;
        } else if (touristCount >= 3 && touristCount <= 4) {
            pricePerPerson = 1000;
        } else if (touristCount >= 5 && touristCount <= 6) {
            pricePerPerson = 900;
        } else if (touristCount >= 7) {
            pricePerPerson = 800;
        }

        return pricePerPerson * touristCount;
    }

    // VEHICLE RENTAL PRICING
    function calculateVehiclePrice() {
        const vehicleAmountInput = document.getElementById("amountOfVehicle");
        const rentalDaysSelect = document.getElementById("rentalDays");
        
        if (!vehicleAmountInput || !rentalDaysSelect) return 0;

        const selectedVehicles = document.querySelectorAll(".rental-option:checked");
        const rentalDays = parseInt(rentalDaysSelect.value) || 0;
        
        if (selectedVehicles.length === 0 || rentalDays === 0) {
            vehicleAmountInput.value = "";
            return 0;
        }

        let totalVehiclePrice = 0;
        
        selectedVehicles.forEach(vehicle => {
            const vehicleType = vehicle.value;
            let dailyRate = 0;
            let isVanService = false;
            let vanPrice = 0;
            
            // Try to get price from database first
            const vehicleData = getVehicleByName(vehicleType);
            if (vehicleData && vehicleData.price_per_day) {
                dailyRate = vehicleData.price_per_day;
            } else {
                // Fallback to hardcoded pricing only for VAN services
                // Regular vehicles should be in database, but handle gracefully
                dailyRate = getFallbackPricing(vehicleType);
                if (dailyRate === 0) {
                    console.warn(`⚠️ Vehicle "${vehicleType}" not found in database and no fallback price available`);
                }
            }
            
            // Check if it's a VAN service (these are not in vehicles table)
            if (vehicleType.startsWith("VAN -")) {
                isVanService = true;
                switch (vehicleType) {
                // Within Puerto Galera Van Destinations (fixed prices, no daily multiplier)
                case "VAN - Sabang":
                    isVanService = true;
                    vanPrice = 800;
                    break;
                case "VAN - Sabang Roundtrip":
                    isVanService = true;
                    vanPrice = 1600;
                    break;
                case "VAN - Muelle":
                    isVanService = true;
                    vanPrice = 800;
                    break;
                case "VAN - Muelle Roundtrip":
                    isVanService = true;
                    vanPrice = 1600;
                    break;
                case "VAN - Balatero":
                    isVanService = true;
                    vanPrice = 1000;
                    break;
                case "VAN - Balatero Roundtrip":
                    isVanService = true;
                    vanPrice = 2000;
                    break;
                case "VAN - White Beach":
                    isVanService = true;
                    vanPrice = 1500;
                    break;
                case "VAN - White Beach Roundtrip":
                    isVanService = true;
                    vanPrice = 3000;
                    break;
                case "VAN - Aninuan":
                    isVanService = true;
                    vanPrice = 1500;
                    break;
                case "VAN - Aninuan Roundtrip":
                    isVanService = true;
                    vanPrice = 3000;
                    break;
                case "VAN - Ponderosa":
                    isVanService = true;
                    vanPrice = 1800;
                    break;
                case "VAN - Ponderosa Roundtrip":
                    isVanService = true;
                    vanPrice = 3000;
                    break;
                case "VAN - Tabinay":
                    isVanService = true;
                    vanPrice = 800;
                    break;
                case "VAN - Tabinay Roundtrip":
                    isVanService = true;
                    vanPrice = 1500;
                    break;
                case "VAN - Dulangan":
                    isVanService = true;
                    vanPrice = 1500;
                    break;
                case "VAN - Dulangan Roundtrip":
                    isVanService = true;
                    vanPrice = 3000;
                    break;
                case "VAN - Tamaraw Falls":
                    isVanService = true;
                    vanPrice = 3000;
                    break;
                case "VAN - Tamaraw/Ponderosa/Talipanan/White Beach":
                    isVanService = true;
                    vanPrice = 4000;
                    break;
                case "VAN - Windfarm":
                    isVanService = true;
                    vanPrice = 3000;
                    break;
                case "VAN - Tukuran Falls":
                    isVanService = true;
                    vanPrice = 3500;
                    break;
                case "VAN - Infinity Farm":
                    isVanService = true;
                    vanPrice = 4500;
                    break;
                case "VAN - Lantuyan":
                    isVanService = true;
                    vanPrice = 4500;
                    break;
                case "VAN - Calapan (Within PG)":
                    isVanService = true;
                    vanPrice = 4500;
                    break;
                case "VAN - Roxas (Within PG)":
                    isVanService = true;
                    vanPrice = 9000;
                    break;
                case "VAN - Around Puerto Galera":
                    isVanService = true;
                    vanPrice = 4500;
                    break;
                // Outside Puerto Galera Van Destinations (fixed prices, no daily multiplier)
                case "VAN - Calapan":
                    isVanService = true;
                    vanPrice = 5000;
                    break;
                case "VAN - Naujan":
                    isVanService = true;
                    vanPrice = 6000;
                    break;
                case "VAN - Victoria":
                    isVanService = true;
                    vanPrice = 6500;
                    break;
                case "VAN - Socorro":
                    isVanService = true;
                    vanPrice = 7000;
                    break;
                case "VAN - Pola":
                    isVanService = true;
                    vanPrice = 7500;
                    break;
                case "VAN - Pinamalayan":
                    isVanService = true;
                    vanPrice = 7500;
                    break;
                case "VAN - Gloria":
                    isVanService = true;
                    vanPrice = 8000;
                    break;
                case "VAN - Bansud":
                    isVanService = true;
                    vanPrice = 8500;
                    break;
                case "VAN - Bongabong":
                    isVanService = true;
                    vanPrice = 9000;
                    break;
                case "VAN - Roxas":
                    isVanService = true;
                    vanPrice = 10000;
                    break;
                case "VAN - Mansalay":
                    isVanService = true;
                    vanPrice = 11000;
                    break;
                case "VAN - Bulalacao":
                    isVanService = true;
                    vanPrice = 12500;
                    break;
                case "VAN - San Jose":
                    isVanService = true;
                    vanPrice = 15000;
                    break;
                case "VAN - Sablayan":
                    isVanService = true;
                    vanPrice = 20000;
                    break;
                case "VAN - Manila Airport":
                    isVanService = true;
                    vanPrice = 25000;
                    break;
                default:
                    dailyRate = 1000;
            }
            }
            
            // Add price: vans have fixed price, vehicles multiply by rental days
            if (isVanService) {
                totalVehiclePrice += vanPrice;
            } else {
                totalVehiclePrice += dailyRate * rentalDays;
            }
        });

        vehicleAmountInput.value = totalVehiclePrice > 0 ? `₱${totalVehiclePrice.toLocaleString()}.00` : "";
        return totalVehiclePrice;
    }

    // DIVING SERVICE PRICING
    function calculateDivingPrice() {
        const divingAmountInput = document.getElementById("amountOfDiving");
        const numberOfDiversInput = document.getElementById("numberOfDiver");
        
        if (!divingAmountInput || !numberOfDiversInput) return 0;

        const selectedDiving = document.querySelector(".diving-option:checked");
        const numberOfDivers = parseInt(numberOfDiversInput.value) || 0;
        
        if (!selectedDiving || numberOfDivers === 0) {
            divingAmountInput.value = "";
            return 0;
        }

        // Get price from database (stored in data attribute)
        let pricePerDiver = parseFloat(selectedDiving.dataset.pricePerHead) || 0;
        
        // Fallback: if no price in data attribute, try to get from diving data
        if (pricePerDiver === 0) {
            const divingName = selectedDiving.value;
            const divingDataItem = getDivingByName(divingName);
            if (divingDataItem && divingDataItem.price_per_head) {
                pricePerDiver = divingDataItem.price_per_head;
            } else {
                // Ultimate fallback to old hardcoded price
                console.warn('⚠️ Using fallback diving price (3500) - diving data not available');
                pricePerDiver = 3500;
            }
        }
        
        const totalDivingPrice = pricePerDiver * numberOfDivers;

        divingAmountInput.value = totalDivingPrice > 0 ? `₱${totalDivingPrice.toLocaleString()}.00` : "";
        return totalDivingPrice;
    }

    // Main function to update package price - now uses package selection pricing
    function updatePackagePrice() {
        // Use the new package selection pricing instead of individual tour pricing
        updatePackageSelectionPricing();
        
        // Calculate vehicle rental price if selected
        calculateVehiclePrice();
        
        // Calculate diving service price if selected
        calculateDivingPrice();
        
        // Ensure total amount is always updated
        calculateTotalAmount();
    }

    // Function to calculate total amount
    function calculateTotalAmount() {
        console.log('calculateTotalAmount called');
        let total = 0;
        
        // Calculate package amount directly
        const touristCountInput = document.getElementById("touristCount");
        const selectedPackageInput = document.querySelector('input[name="package-selection"]:checked');
        const selectedHotelInput = document.querySelector('input[name="hotel-selection"]:checked');
        
        console.log('Tourist count input found:', !!touristCountInput);
        console.log('Selected package input found:', !!selectedPackageInput);
        console.log('Selected hotel input found:', !!selectedHotelInput);
        
        if (touristCountInput && selectedPackageInput) {
            const touristCount = parseInt(touristCountInput.value) || 0;
            const selectedPackage = selectedPackageInput.value;
            const selectedHotel = selectedHotelInput ? selectedHotelInput.value : null;
            
            console.log('Tourist count:', touristCount, 'Selected package:', selectedPackage, 'Selected hotel:', selectedHotel);
            
            if (selectedPackage && touristCount >= 1) {
                const pricing = calculatePackagePricing(selectedPackage, touristCount, selectedHotel);
                console.log('Package pricing result:', pricing);
                if (pricing.totalPrice > 0) {
                    total += pricing.totalPrice;
                    console.log('Added package price to total:', pricing.totalPrice);
                }
            }
        }
        
        // Get vehicle amount
        const vehicleAmountText = document.getElementById('amountOfVehicle').value;
        if (vehicleAmountText) {
            const vehicleAmount = parseFloat(vehicleAmountText.replace(/[₱,]/g, '')) || 0;
            total += vehicleAmount;
        }
        
        // Get diving amount
        const divingAmountText = document.getElementById('amountOfDiving').value;
        if (divingAmountText) {
            const divingAmount = parseFloat(divingAmountText.replace(/[₱,]/g, '')) || 0;
            total += divingAmount;
        }
        
        // Get van rental amount
        const vanAmountText = document.getElementById('vanTotalAmount').value;
        if (vanAmountText) {
            const vanAmount = parseFloat(vanAmountText.replace(/[₱,]/g, '')) || 0;
            total += vanAmount;
        }
        
        // Update total amount field
        const totalAmountInput = document.getElementById('totalAmount');
        console.log('Total amount input found:', !!totalAmountInput);
        
        if (total > 0) {
            const formattedTotal = `₱${total.toLocaleString()}.00`;
            if (totalAmountInput) {
                totalAmountInput.value = formattedTotal;
                console.log('Updated total amount field to:', formattedTotal);
            }
        } else {
            if (totalAmountInput) {
                totalAmountInput.value = '';
                console.log('Cleared total amount field');
            }
        }
        
        // Debug log for testing
        console.log('Total amount calculated (including package price):', total);
    }

    // Function to calculate duration (for hotels)
    function calculateDuration() {
        // This is a simplified version - in a real scenario you'd get arrival/departure dates
        // For this standalone form, we'll set a default value
        const daysInput = document.getElementById("days");
        if (daysInput) {
            daysInput.value = "3"; // Default to 3 days
        }
        return 3;
    }

    // ----------------------------
    // INLAND TOUR AVAILABILITY LOGIC
    // ----------------------------
    
    // Function to update inland tour availability based on tourist count
    function updateInlandTourAvailability() {
        const touristCountInput = document.getElementById("touristCount");
        const touristCount = parseInt(touristCountInput?.value) || 0;
        
        // Get all inland tour checkboxes including select-all
        const inlandSelectAll = document.getElementById("inland-select-all");
        const inlandOptions = document.querySelectorAll(".inland-option");
        const inlandDropdownButton = document.getElementById("inlandDropdown");
        const inlandTourAlert = document.getElementById("inlandTourAlert");
        
        // If tourist count is less than 2, disable all inland options
        if (touristCount < 2) {
            // Disable and uncheck all inland tour options
            if (inlandSelectAll) {
                inlandSelectAll.disabled = true;
                inlandSelectAll.checked = false;
                inlandSelectAll.indeterminate = false;
            }
            
            inlandOptions.forEach(option => {
                option.disabled = true;
                option.checked = false;
            });
            
            // Update the dropdown button to show it's disabled (visual only - still clickable to view)
            if (inlandDropdownButton) {
                inlandDropdownButton.classList.add('opacity-75');
                inlandDropdownButton.style.cursor = 'pointer'; // Keep it clickable
            }
            
            // Update alert message to show it's disabled
            if (inlandTourAlert) {
                inlandTourAlert.className = 'alert alert-danger py-2 px-3 mb-2';
                inlandTourAlert.innerHTML = `
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    <strong>Not Available:</strong> You need at least 2 tourists to book Inland Tour. 
                    ${touristCount === 0 ? 'Please enter number of tourists.' : `Currently: ${touristCount} tourist${touristCount === 1 ? '' : 's'}.`}
                `;
            }
        } else {
            // Enable all inland tour options
            if (inlandSelectAll) {
                inlandSelectAll.disabled = false;
            }
            
            inlandOptions.forEach(option => {
                option.disabled = false;
            });
            
            // Remove disabled styling from dropdown button
            if (inlandDropdownButton) {
                inlandDropdownButton.classList.remove('opacity-75');
                inlandDropdownButton.style.cursor = 'pointer';
            }
            
            // Update alert message to show it's available
            if (inlandTourAlert) {
                inlandTourAlert.className = 'alert alert-success py-2 px-3 mb-2';
                inlandTourAlert.innerHTML = `
                    <i class="fas fa-check-circle me-1"></i>
                    <strong>Available:</strong> You can now select Inland Tour destinations (${touristCount} tourists).
                `;
            }
        }
        
        // Recalculate package price since inland tours may have been unchecked
        updatePackagePrice();
    }

    // ----------------------------
    // EVENT LISTENERS SETUP
    // ----------------------------
    
    // Package selection setup (replacing old multi-select dropdowns)
    // wireMultiSelect("island-select-all", "island-options", "island-option", null);
    // wireMultiSelect("inland-select-all", "inland-options", "inland-option", null);
    // wireMultiSelect("snorkel-select-all", "snorkel-options", "snorkel-option", null);

    // Add specific handling for rental vehicle options
    const rentalOptions = document.querySelectorAll(".rental-option");
        rentalOptions.forEach(option => {
            option.addEventListener("change", () => {
                calculateVehiclePrice();
                calculateTotalAmount();
                clearRentalDaysErrorIfNoVehicles();
                clearStep2Error();
                saveCurrentFormData(); // Save data when rental options change
            });
        });
    
    // Add event listener for rental days dropdown
    const rentalDaysSelect = document.getElementById("rentalDays");
    if (rentalDaysSelect) {
        rentalDaysSelect.addEventListener("change", () => {
            calculateVehiclePrice();
            calculateTotalAmount();
            // Clear error when user selects a value
            if (rentalDaysSelect.value !== "") {
                setError(rentalDaysSelect, "");
            }
            saveCurrentFormData(); // Save data when rental days change
        });
    }
    
    // Add event listener for diving option
    const divingOption = document.getElementById("diving-only");
    if (divingOption) {
        divingOption.addEventListener("change", () => {
            calculateDivingPrice();
            calculateTotalAmount();
            updatePackagePrice();
            clearNumberOfDiversErrorIfNoDiving();
            clearStep2Error();
            saveCurrentFormData(); // Save data when diving option changes
        });
    }
    
    // Add event listener to tourist count input
    const touristCountInput = document.getElementById("touristCount");
    if (touristCountInput) {
        touristCountInput.addEventListener("input", () => {
            updatePackagePrice();
            // Clear error when user types
            if (touristCountInput.value.trim() !== "") {
                setError(touristCountInput, "");
            }
            // Package selection will handle availability based on tourist count
            saveCurrentFormData(); // Save data when tourist count changes
        });
        
        // Ensure only positive numbers are entered
        touristCountInput.addEventListener("keypress", (e) => {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) e.preventDefault();
        });
        
        // Prevent negative values
        touristCountInput.addEventListener("blur", () => {
            const value = parseInt(touristCountInput.value) || 0;
            if (value < 0) {
                touristCountInput.value = "";
            }
            updatePackagePrice();
            // Package selection handles tourist count validation
        });
    }

    // Store the last selected package value globally to allow toggling
    let lastSelectedPackage = null;
    
    // Store the last selected hotel value globally to allow toggling
    let lastSelectedHotel = null;
    
    // Add event listeners for package selection radio buttons
    function attachPackageSelectionListeners() {
        const packageSelectionOptions = document.querySelectorAll(".package-selection-option");
        console.log('Found package selection options:', packageSelectionOptions.length);
        
        packageSelectionOptions.forEach(option => {
            // Add click event to allow deselection by clicking the same option
            option.addEventListener("click", (e) => {
                // Check if this was already selected before the click
                const wasSelected = option.value === lastSelectedPackage;
                
                // Use setTimeout to check state after the default behavior
                setTimeout(() => {
                    if (wasSelected) {
                        // Deselect the option
                        option.checked = false;
                        lastSelectedPackage = null;
                        
                        // Update UI and calculations
                        console.log('Package deselected:', option.value);
                        updatePackageSelectionPricing();
                        setTimeout(() => {
                            calculateTotalAmount();
                        }, 10);
                        updateHotelsRowVisibility();
                        clearStep2Error();
                        clearTouristCountErrorIfNoTours();
                        saveCurrentFormData();
                    } else {
                        // Update the last selected value
                        lastSelectedPackage = option.value;
                        console.log('Package selected:', option.value);
                    }
                }, 0);
            });
            
            option.addEventListener("change", () => {
                if (option.checked) {
                    console.log('Package selection changed:', option.value);
                    lastSelectedPackage = option.value;
                    updatePackageSelectionPricing();
                    // Force immediate total calculation
                    setTimeout(() => {
                        calculateTotalAmount();
                    }, 10);
                    updateHotelsRowVisibility();
                    clearStep2Error();
                    clearTouristCountErrorIfNoTours();
                    saveCurrentFormData(); // Save data when package selection changes
                }
            });
        });
    }
    
    // Add event listeners for hotel selection radio buttons
    function attachHotelSelectionListeners() {
        const hotelSelectionOptions = document.querySelectorAll("input[name='hotel-selection']");
        console.log('Found hotel selection options:', hotelSelectionOptions.length);
        hotelSelectionOptions.forEach(option => {
            // Remove existing listeners by cloning
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            // Add click event to allow deselection by clicking the same option
            newOption.addEventListener("click", (e) => {
                // Check if this was already selected before the click
                const wasSelected = newOption.value === lastSelectedHotel;
                
                // Use setTimeout to check state after the default behavior
                setTimeout(() => {
                    if (wasSelected) {
                        // Deselect the option
                        newOption.checked = false;
                        lastSelectedHotel = null;
                        
                        // Update UI and calculations
                        console.log('🏨 Hotel deselected:', newOption.value);
                        
                        // Clear package availability restrictions
                        updatePackageAvailability(null);
                        
                        // Update pricing with no hotel selected
                        updatePackageSelectionPricing();
                        setTimeout(() => {
                            calculateTotalAmount();
                        }, 10);
                        
                        // Update the selected hotel text
                        const selectedHotelText = document.getElementById('selectedHotelText');
                        if (selectedHotelText) {
                            selectedHotelText.textContent = 'Choose Your Hotel';
                        }
                        
                        saveCurrentFormData();
                    } else {
                        // Update the last selected value
                        lastSelectedHotel = newOption.value;
                        console.log('🏨 Hotel selected:', newOption.value);
                    }
                }, 0);
            });
            
            // Add change listener
            newOption.addEventListener("change", () => {
                if (newOption.checked) {
                    console.log('🏨 Hotel selection changed:', newOption.value);
                    lastSelectedHotel = newOption.value;
                    
                    // Update package availability based on hotel
                    updatePackageAvailability(newOption.value);
                    
                    // Force fresh fetch of packages to ensure latest prices
                    fetchPackages().then(() => {
                        // Update package dropdown prices when hotel changes
                        updatePackageDropdownPrices(newOption.value);
                        updatePackageSelectionPricing();
                        // Force immediate total calculation
                        setTimeout(() => {
                            calculateTotalAmount();
                        }, 10);
                    });
                    
                    saveCurrentFormData(); // Save data when hotel selection changes
                }
            });
        });
    }

    // Function to update package availability based on selected hotel
    function updatePackageAvailability(selectedHotel) {
        console.log('🔍 Checking package availability for hotel:', selectedHotel);
        
        // If no hotel selected, enable all packages
        if (!selectedHotel) {
            console.log('✅ No hotel selected - enabling all packages');
            const packageOptions = document.querySelectorAll('.package-selection-option');
            packageOptions.forEach(option => {
                const parentDiv = option.closest('.form-check');
                const label = parentDiv?.querySelector('label');
                
                // Enable the package option
                option.disabled = false;
                
                // Remove disabled styling
                if (parentDiv) {
                    parentDiv.style.opacity = '1';
                    parentDiv.style.cursor = 'pointer';
                }
                if (label) {
                    label.style.cursor = 'pointer';
                }
                
                // Remove "Not Available" badge if it exists
                const unavailableBadge = label?.querySelector('.unavailable-badge');
                if (unavailableBadge) {
                    unavailableBadge.remove();
                }
            });
            
            // Also update the package dropdown buttons
            const packageDropdownButtons = [
                { id: 'package3Dropdown', package: 'Package 3' },
                { id: 'package4Dropdown', package: 'Package 4' }
            ];
            
            packageDropdownButtons.forEach(({ id }) => {
                const button = document.getElementById(id);
                if (button) {
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    
                    const dropdown = button.nextElementSibling;
                    const note = dropdown?.querySelector('.unavailable-note');
                    if (note) {
                        note.remove();
                    }
                }
            });
            
            return;
        }
        
        // Normalize hotel name
        const normalizedHotel = normalizeHotelName(selectedHotel);
        console.log('📋 Normalized hotel name:', normalizedHotel);
        
        // Define which packages are NOT available for Casa de Honcho
        const casaDeHonchoUnavailablePackages = ['Package 3', 'Package 4'];
        
        // Check if selected hotel is Casa de Honcho
        const isCasaDeHoncho = normalizedHotel === 'Casa de Honcho';
        
        // Get all package selection options
        const packageOptions = document.querySelectorAll('.package-selection-option');
        
        packageOptions.forEach(option => {
            const packageValue = option.value;
            const parentDiv = option.closest('.form-check');
            const label = parentDiv?.querySelector('label');
            
            // Check if this package is unavailable for the selected hotel
            const isUnavailable = isCasaDeHoncho && casaDeHonchoUnavailablePackages.includes(packageValue);
            
            if (isUnavailable) {
                // Disable the package option
                option.disabled = true;
                
                // Add visual styling to show it's disabled
                if (parentDiv) {
                    parentDiv.style.opacity = '0.5';
                    parentDiv.style.cursor = 'not-allowed';
                }
                if (label) {
                    label.style.cursor = 'not-allowed';
                }
                
                // If this package is currently selected, uncheck it
                if (option.checked) {
                    option.checked = false;
                    console.log(`⚠️ Unchecked ${packageValue} because it's not available for ${selectedHotel}`);
                    
                    // Update the selected package text
                    const selectedPackageText = document.getElementById('selectedPackageText');
                    if (selectedPackageText) {
                        selectedPackageText.textContent = 'Select Package';
                    }
                    
                    // Recalculate prices
                    updatePackageSelectionPricing();
                    calculateTotalAmount();
                }
                
                // Add "Not Available" badge to the label
                if (label && !label.querySelector('.unavailable-badge')) {
                    const unavailableBadge = document.createElement('span');
                    unavailableBadge.className = 'badge bg-secondary ms-2 unavailable-badge';
                    unavailableBadge.textContent = 'Not Available';
                    unavailableBadge.style.fontSize = '0.7rem';
                    label.appendChild(unavailableBadge);
                }
                
                console.log(`🚫 Disabled ${packageValue} for ${selectedHotel}`);
            } else {
                // Enable the package option
                option.disabled = false;
                
                // Remove disabled styling
                if (parentDiv) {
                    parentDiv.style.opacity = '1';
                    parentDiv.style.cursor = 'pointer';
                }
                if (label) {
                    label.style.cursor = 'pointer';
                }
                
                // Remove "Not Available" badge if it exists
                const unavailableBadge = label?.querySelector('.unavailable-badge');
                if (unavailableBadge) {
                    unavailableBadge.remove();
                }
                
                console.log(`✅ Enabled ${packageValue} for ${selectedHotel}`);
            }
        });
        
        // Also update the package dropdown buttons (Package 1, 2, 3, 4 info buttons)
        const packageDropdownButtons = [
            { id: 'package3Dropdown', package: 'Package 3' },
            { id: 'package4Dropdown', package: 'Package 4' }
        ];
        
        packageDropdownButtons.forEach(({ id, package: packageName }) => {
            const button = document.getElementById(id);
            if (button) {
                const isUnavailable = isCasaDeHoncho && casaDeHonchoUnavailablePackages.includes(packageName);
                
                if (isUnavailable) {
                    // Add visual indication that this package is not available
                    button.style.opacity = '0.6';
                    button.style.cursor = 'not-allowed';
                    
                    // Add a note in the dropdown
                    const dropdown = button.nextElementSibling;
                    if (dropdown && !dropdown.querySelector('.unavailable-note')) {
                        const note = document.createElement('div');
                        note.className = 'alert alert-warning mb-0 mt-2 unavailable-note';
                        note.style.fontSize = '0.85rem';
                        note.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i><strong>Not Available</strong> for Casa de Honcho';
                        dropdown.appendChild(note);
                    }
                } else {
                    // Remove unavailable styling
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    
                    // Remove unavailable note
                    const dropdown = button.nextElementSibling;
                    const note = dropdown?.querySelector('.unavailable-note');
                    if (note) {
                        note.remove();
                    }
                }
            }
        });
    }

    // Try to attach listeners immediately, and also after a small delay as fallback
    attachPackageSelectionListeners();
    attachHotelSelectionListeners();
    setTimeout(attachPackageSelectionListeners, 100);
    setTimeout(attachHotelSelectionListeners, 100);
    
    // Add event listener to number of divers input
    const numberOfDiversInput = document.getElementById("numberOfDiver");
    if (numberOfDiversInput) {
        numberOfDiversInput.addEventListener("input", () => {
            calculateDivingPrice();
            calculateTotalAmount();
            // Clear error when user types
            if (numberOfDiversInput.value.trim() !== "") {
                setError(numberOfDiversInput, "");
            }
            saveCurrentFormData(); // Save data when number of divers changes
        });
        
        // Ensure only positive numbers are entered
        numberOfDiversInput.addEventListener("keypress", (e) => {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) e.preventDefault();
        });
        
        // Prevent negative values
        numberOfDiversInput.addEventListener("blur", () => {
            const value = parseInt(numberOfDiversInput.value) || 0;
            if (value < 0) {
                numberOfDiversInput.value = "";
            }
            calculateDivingPrice();
            calculateTotalAmount();
        });
    }

    // ----------------------------
    // NAVIGATION FUNCTIONS
    // ----------------------------
    
    // Function to go back to booking page (same as previousStep but more explicit)
    window.goBackToBookingPage = function() {
        // Get package_only_id for selected package
        const selectedPackageForId = document.querySelector('input[name="package-selection"]:checked')?.value || null;
        const selectedHotelForId = document.querySelector('input[name="hotel-selection"]:checked')?.value || null;
        let packageOnlyId = null;
        if (selectedPackageForId && selectedHotelForId) {
            const pkg = getPackageByCategoryAndHotel(selectedPackageForId, selectedHotelForId);
            if (pkg) {
                packageOnlyId = pkg.package_only_id || pkg.id;
            }
        }
        
        // Save current tour selections to sessionStorage before going back
        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            selectedPackage: selectedPackageForId,
            selectedHotel: selectedHotelForId,
            packageOnlyId: packageOnlyId,
            selectedVehicles: (() => {
                const selectedVehicles = [];
                const rentalDays = parseInt(document.getElementById('rentalDays').value) || 0;
                const selectedVehicleOptions = document.querySelectorAll('.rental-option:checked');
                
                selectedVehicleOptions.forEach(vehicle => {
                    const vehicleType = vehicle.value;
                    const vehicleData = getVehicleByName(vehicleType);
                    
                    if (rentalDays > 0) {
                        if (vehicleData) {
                            // Use database data with vehicle_id
                            selectedVehicles.push({
                                id: vehicleData.vehicle_id, // Always include vehicle_id from database
                                name: vehicleData.name,
                                days: rentalDays,
                                price: vehicleData.price_per_day * rentalDays
                            });
                        } else {
                            // If no database match, skip this vehicle (don't allow booking without vehicle_id)
                            console.warn(`Vehicle "${vehicleType}" not found in database - skipping`);
                        }
                    }
                });
                return selectedVehicles;
            })(),
            rentalVehicles: Array.from(document.querySelectorAll('.rental-option:checked')).map(option => option.value),
            rentalDays: document.getElementById('rentalDays').value,
            diving: document.querySelector('.diving-option:checked') ? true : false,
            numberOfDivers: document.getElementById('numberOfDiver').value,
            packageAmount: '',
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value
        };
        
        sessionStorage.setItem('tourSelections', JSON.stringify(tourSelections));
        
        // Go back to option page
        window.location.href = '../option/option_page.html';
    };
    
    // Function to go back to booking page
    window.previousStep = function() {
        // Collect van rental data
        const destinationSelect = document.getElementById('destinationSelect')?.value || '';
        const vanPlace = document.getElementById('placeSelect')?.value || '';
        const vanTripType = document.getElementById('tripTypeSelect')?.value || '';
        const vanDays = document.getElementById('vanNumberOfDays')?.value || '';
        
        // Save current tour selections to sessionStorage before going back
        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            selectedPackage: document.querySelector('input[name="package-selection"]:checked')?.value || null,
            selectedVehicles: (() => {
                const selectedVehicles = [];
                const rentalDays = parseInt(document.getElementById('rentalDays').value) || 0;
                const selectedVehicleOptions = document.querySelectorAll('.rental-option:checked');
                
                selectedVehicleOptions.forEach(vehicle => {
                    const vehicleType = vehicle.value;
                    const vehicleData = getVehicleByName(vehicleType);
                    
                    if (rentalDays > 0) {
                        if (vehicleData) {
                            // Use database data with vehicle_id
                            selectedVehicles.push({
                                id: vehicleData.vehicle_id, // Always include vehicle_id from database
                                name: vehicleData.name,
                                days: rentalDays,
                                price: vehicleData.price_per_day * rentalDays
                            });
                        } else {
                            // If no database match, skip this vehicle (don't allow booking without vehicle_id)
                            console.warn(`Vehicle "${vehicleType}" not found in database - skipping`);
                        }
                    }
                });
                return selectedVehicles;
            })(),
            rentalVehicles: Array.from(document.querySelectorAll('.rental-option:checked')).map(option => option.value),
            rentalDays: document.getElementById('rentalDays').value,
            diving: document.querySelector('.diving-option:checked') ? true : false,
            divingId: (() => {
                const selectedDiving = document.querySelector('.diving-option:checked');
                return selectedDiving ? selectedDiving.dataset.divingId : null;
            })(),
            divingName: (() => {
                const selectedDiving = document.querySelector('.diving-option:checked');
                return selectedDiving ? selectedDiving.value : null;
            })(),
            numberOfDivers: document.getElementById('numberOfDiver').value,
            // Van rental data
            vanDestination: destinationSelect,
            vanPlace: vanPlace,
            vanDestinationId: (() => {
                const selectEl = document.getElementById('placeSelect');
                const selectedOption = selectEl?.options[selectEl?.selectedIndex];
                return selectedOption?.dataset.vanDestinationId || null;
            })(),
            vanTripType: vanTripType,
            vanDays: vanDays,
            vanAmount: document.getElementById('vanTotalAmount')?.value || '',
            packageAmount: '',
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value
        };
        
        sessionStorage.setItem('tourSelections', JSON.stringify(tourSelections));
        
        // Go back to option page
        window.location.href = '../option/option_page.html';
    };
    
    window.nextStep = function() {
        console.log("Next button clicked!");
        
        // Validate form before proceeding
        const isValid = validateStep2();
        if (!isValid) {
            console.log("Form validation failed - cannot proceed to booking page");
            return;
        }
        
        // Validate hotel selection ONLY if a tour package is selected
        const selectedPackage = document.querySelector('input[name="package-selection"]:checked');
        const selectedHotel = document.querySelector('input[name="hotel-selection"]:checked');
        const hotelErrorMessage = document.getElementById('hotel-error-message');
        
        // Hotel is only required when a package is selected
        if (selectedPackage && !selectedHotel) {
            // Show error message on the page
            if (hotelErrorMessage) {
                hotelErrorMessage.style.display = 'block';
                // Scroll to the error message for better visibility
                hotelErrorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            console.log("Hotel validation failed - no hotel selected for package booking");
            return;
        } else {
            // Hide error message if hotel is not required or is selected
            if (hotelErrorMessage) {
                hotelErrorMessage.style.display = 'none';
            }
        }
        
        console.log("Form is valid, proceeding to booking page");
        
        // Combine form data from step 1 and tour selections
        const formData = window.bookingFormData || {};
        
        // Collect van rental data
        const destinationSelect = document.getElementById('destinationSelect')?.value || '';
        const vanPlace = document.getElementById('placeSelect')?.value || '';
        const vanTripType = document.getElementById('tripTypeSelect')?.value || '';
        const vanDays = document.getElementById('vanNumberOfDays')?.value || '';
        
        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            selectedPackage: document.querySelector('input[name="package-selection"]:checked')?.value || null,
            selectedHotel: document.querySelector('input[name="hotel-selection"]:checked')?.value || null,
            selectedVehicles: (() => {
                const selectedVehicles = [];
                const rentalDays = parseInt(document.getElementById('rentalDays').value) || 0;
                const selectedVehicleOptions = document.querySelectorAll('.rental-option:checked');
                
                selectedVehicleOptions.forEach(vehicle => {
                    const vehicleType = vehicle.value;
                    const vehicleData = getVehicleByName(vehicleType);
                    
                    if (rentalDays > 0) {
                        if (vehicleData) {
                            // Use database data with vehicle_id
                            selectedVehicles.push({
                                id: vehicleData.vehicle_id, // Always include vehicle_id from database
                                name: vehicleData.name,
                                days: rentalDays,
                                price: vehicleData.price_per_day * rentalDays
                            });
                        } else {
                            // If no database match, skip this vehicle (don't allow booking without vehicle_id)
                            console.warn(`Vehicle "${vehicleType}" not found in database - skipping`);
                        }
                    }
                });
                return selectedVehicles;
            })(),
            rentalVehicles: Array.from(document.querySelectorAll('.rental-option:checked')).map(option => option.value),
            rentalDays: document.getElementById('rentalDays').value,
            diving: document.querySelector('.diving-option:checked') ? true : false,
            divingId: (() => {
                const selectedDiving = document.querySelector('.diving-option:checked');
                return selectedDiving ? selectedDiving.dataset.divingId : null;
            })(),
            divingName: (() => {
                const selectedDiving = document.querySelector('.diving-option:checked');
                return selectedDiving ? selectedDiving.value : null;
            })(),
            numberOfDivers: document.getElementById('numberOfDiver').value,
            // Van rental data
            vanDestination: destinationSelect,
            vanPlace: vanPlace,
            vanDestinationId: (() => {
                const selectEl = document.getElementById('placeSelect');
                const selectedOption = selectEl?.options[selectEl?.selectedIndex];
                return selectedOption?.dataset.vanDestinationId || null;
            })(),
            vanTripType: vanTripType,
            vanDays: vanDays,
            vanAmount: document.getElementById('vanTotalAmount')?.value || '',
            packageAmount: (() => {
                const touristCount = parseInt(document.getElementById('touristCount').value) || 0;
                const selectedPackage = document.querySelector('input[name="package-selection"]:checked')?.value || null;
                const selectedHotel = document.querySelector('input[name="hotel-selection"]:checked')?.value || null;
                if (selectedPackage && touristCount >= 1) {
                    const pricing = calculatePackagePricing(selectedPackage, touristCount, selectedHotel);
                    return pricing.totalPrice > 0 ? `₱${pricing.totalPrice.toLocaleString()}.00` : '';
                }
                return '';
            })(),
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value
        };
        
        // Store complete booking data for the next page
        const completeBookingData = {
            ...formData,
            ...tourSelections,
            bookingType: 'package_only'
        };
        
        console.log('Saving to sessionStorage - completeBookingData:', completeBookingData);
        console.log('Package Amount:', completeBookingData.packageAmount);
        console.log('Vehicle Amount:', completeBookingData.vehicleAmount);
        console.log('Diving Amount:', completeBookingData.divingAmount);
        console.log('Van Rental Data:', {
            destination: completeBookingData.vanDestination,
            place: completeBookingData.vanPlace,
            tripType: completeBookingData.vanTripType,
            days: completeBookingData.vanDays,
            amount: completeBookingData.vanAmount
        });
        console.log('Total Amount:', completeBookingData.totalAmount);
        
        sessionStorage.setItem('completeBookingData', JSON.stringify(completeBookingData));
        sessionStorage.setItem('tourSelections', JSON.stringify(tourSelections));
        
        console.log("Redirecting to booking package page...");
        // Redirect to booking package page for final step (payment/confirmation)
        window.location.href = 'package_summary.html';
    };  

    // ----------------------------
    // FORM DATA LOADING FROM SESSION STORAGE
    // ----------------------------
    
    // Function to load form data from sessionStorage (passed from booking_page.html step 1)
    function loadFormDataFromSession() {
        const formDataString = sessionStorage.getItem('bookingFormData');
        if (formDataString) {
            try {
                const formData = JSON.parse(formDataString);
                console.log('Loaded form data from booking page:', formData);
                
                // Store the data globally for potential use in form submission
                window.bookingFormData = formData;
                
                // You can display this data somewhere on the page if needed
                // For example, create a summary section showing customer details
                displayCustomerSummary(formData);
                
                return formData;
            } catch (error) {
                console.error('Error parsing form data from session storage:', error);
                return null;
            }
        }
        return null;
    }
    
    // Function to restore previous tour selections if user returns to this page
    function restoreTourSelections() {
        let tourSelections = null;
        
        // First try to get tour selections directly
        const tourSelectionsString = sessionStorage.getItem('tourSelections');
        if (tourSelectionsString) {
            try {
                tourSelections = JSON.parse(tourSelectionsString);
                console.log('Restoring package selections from tourSelections:', tourSelections);
            } catch (error) {
                console.error('Error parsing tourSelections:', error);
            }
        }
        
        // If no tour selections found, try to get from completeBookingData
        if (!tourSelections) {
            const completeBookingDataString = sessionStorage.getItem('completeBookingData');
            if (completeBookingDataString) {
                try {
                    const completeData = JSON.parse(completeBookingDataString);
                    if (completeData.bookingType === 'package_only') {
                        tourSelections = completeData;
                        console.log('Restoring package selections from completeBookingData:', tourSelections);
                    }
                } catch (error) {
                    console.error('Error parsing completeBookingData:', error);
                }
            }
        }
        
        if (tourSelections) {
            try {
                // Restore tourist count
                if (tourSelections.touristCount) {
                    document.getElementById('touristCount').value = tourSelections.touristCount;
                }
                
                // Restore selected package
                if (tourSelections.selectedPackage) {
                    const packageRadio = document.querySelector(`input[name="package-selection"][value="${tourSelections.selectedPackage}"]`);
                    if (packageRadio) {
                        packageRadio.checked = true;
                        // Update the global lastSelectedPackage variable
                        lastSelectedPackage = tourSelections.selectedPackage;
                    }
                }
                
                // Restore selected hotel
                if (tourSelections.selectedHotel) {
                    const hotelRadio = document.querySelector(`input[name="hotel-selection"][value="${tourSelections.selectedHotel}"]`);
                    if (hotelRadio) {
                        hotelRadio.checked = true;
                        // Update the global lastSelectedHotel variable
                        lastSelectedHotel = tourSelections.selectedHotel;
                        // Update package availability when hotel is restored
                        updatePackageAvailability(tourSelections.selectedHotel);
                    }
                }
                
                // Restore rental vehicles
                tourSelections.rentalVehicles?.forEach(vehicle => {
                    const checkbox = document.querySelector(`.rental-option[value="${vehicle}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Restore rental days
                if (tourSelections.rentalDays) {
                    document.getElementById('rentalDays').value = tourSelections.rentalDays;
                }
                
                // Restore diving
                if (tourSelections.diving) {
                    const divingCheckbox = document.querySelector('.diving-option');
                    if (divingCheckbox) divingCheckbox.checked = true;
                }
                
                // Restore number of divers
                if (tourSelections.numberOfDivers) {
                    document.getElementById('numberOfDiver').value = tourSelections.numberOfDivers;
                }
                
                // Restore van rental data
                if (tourSelections.vanDestination) {
                    const destinationSelect = document.getElementById('destinationSelect');
                    if (destinationSelect) {
                        destinationSelect.value = tourSelections.vanDestination;
                        // Trigger change event to show appropriate fields
                        destinationSelect.dispatchEvent(new Event('change'));
                        
                        // Wait for the change event to update the UI, then restore other fields
                        setTimeout(() => {
                            if (tourSelections.vanPlace) {
                                const placeSelectEl = document.getElementById('placeSelect');
                                if (placeSelectEl) placeSelectEl.value = tourSelections.vanPlace;
                            }
                            if (tourSelections.vanTripType) {
                                const tripTypeSelectEl = document.getElementById('tripTypeSelect');
                                if (tripTypeSelectEl) tripTypeSelectEl.value = tourSelections.vanTripType;
                            }
                            if (tourSelections.vanDays) {
                                const vanDaysSelectEl = document.getElementById('vanNumberOfDays');
                                if (vanDaysSelectEl) vanDaysSelectEl.value = tourSelections.vanDays;
                            }
                            updateVanPrice();
                        }, 50);
                    }
                }
                
                // Update all pricing after restoration
                setTimeout(() => {
                    updatePackagePrice();
                    calculateVehiclePrice();
                    calculateDivingPrice();
                    calculateTotalAmount();
                    updateHotelsRowVisibility();
                }, 150);
                
                return tourSelections;
            } catch (error) {
                console.error('Error restoring package selections:', error);
                return null;
            }
        }
        
        return null;
    }
    
    // Function to display customer summary (optional)
    function displayCustomerSummary(formData) {
        // You can add a summary section to the HTML and populate it here
        console.log('Customer Details:', {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.emailAddress,
            contact: formData.contactNo,
            arrival: formData.arrivalDate,
            departure: formData.departureDate
        });
    }

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
                hotelsData = data.hotels;
                console.log('✅ Hotels loaded successfully:', hotelsData.length, 'hotels');
                generateHotelOptions();
                // Update package prices after hotels are loaded
                refreshPackagePrices();
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
            generateHotelOptions();
            // Update package prices after hotels are loaded
            refreshPackagePrices();
            return hotelsData;
        }
    }
    
    // Function to refresh package prices (called when both packages and hotels are available)
    function refreshPackagePrices() {
        if (!packagesData || packagesData.length === 0) {
            console.log('⏳ Packages not loaded yet, will update when packages are loaded');
            return;
        }
        
        if (!hotelsData || hotelsData.length === 0) {
            console.log('⏳ Hotels not loaded yet, will update when hotels are loaded');
            return;
        }
        
        console.log('🔄 Refreshing package prices from database...');
        
        // Wait a bit for DOM to be ready, then update prices
        setTimeout(() => {
            const selectedHotel = document.querySelector('input[name="hotel-selection"]:checked');
            let hotelToUse = null;
            
            if (selectedHotel) {
                hotelToUse = selectedHotel.value;
                console.log('📍 Using selected hotel:', hotelToUse);
            } else if (hotelsData && hotelsData.length > 0) {
                // Use first hotel as default to show prices immediately
                hotelToUse = hotelsData[0].name;
                console.log('📍 Using default hotel (first available):', hotelToUse);
            } else {
                console.warn('⚠️ No hotel available for price update');
                return;
            }
            
            // Force update all package prices from database
            updatePackageDropdownPrices(hotelToUse);
            
            // Also update the selected package pricing if a package is already selected
            const selectedPackage = document.querySelector('input[name="package-selection"]:checked');
            const touristCount = document.getElementById('touristCount')?.value;
            if (selectedPackage && touristCount) {
                console.log('🔄 Updating selected package pricing after refresh...');
                updatePackageSelectionPricing();
            }
        }, 500);
    }
    
    // Function to generate hotel options dynamically
    function generateHotelOptions() {
        const hotelsContainer = document.getElementById('hotels-options');
        if (!hotelsContainer || !hotelsData.length) {
            console.warn('Hotels container not found or no hotels data');
            return;
        }
        
        // Clear existing options
        hotelsContainer.innerHTML = '';
        
        // Filter out N/A hotels and generate hotel options
        const validHotels = hotelsData.filter(hotel => hotel.name && hotel.name !== 'N/A');
        
        validHotels.forEach((hotel, index) => {
            const hotelOption = document.createElement('div');
            hotelOption.className = 'form-check mb-2';
            
            const hotelId = `hotel-${hotel.hotel_id}`;
            const isIlaya = hotel.name === 'Ilaya Resort';
            
            hotelOption.innerHTML = `
                <input class="form-check-input hotels-option" type="radio" name="hotel-selection" id="${hotelId}" value="${hotel.name}">
                <label class="form-check-label" for="${hotelId}">
                    <strong>${hotel.name}</strong>
                    ${isIlaya ? '<small>    (No Additional Charge)</small>' : ''}
                    ${hotel.description ? `<br><small class="text-muted">${hotel.description}</small>` : ''}
                </label>
            `;
            
            hotelsContainer.appendChild(hotelOption);
        });
        
        // Re-attach event listeners to new hotel options
        attachHotelSelectionListeners();
        
        // Check if a hotel is already selected and update package availability
        setTimeout(() => {
            const selectedHotel = document.querySelector('input[name="hotel-selection"]:checked');
            if (selectedHotel) {
                updatePackageAvailability(selectedHotel.value);
                updatePackageDropdownPrices(selectedHotel.value);
            } else if (hotelsData && hotelsData.length > 0) {
                // Use first hotel as default for price display
                updatePackageDropdownPrices(hotelsData[0].name);
            }
        }, 200);
        
        console.log('✅ Hotel options generated successfully');
    }
    
    // Function to get hotel ID by name
    function getHotelIdByName(hotelName) {
        const hotel = hotelsData.find(h => h.name === hotelName);
        return hotel ? hotel.hotel_id : null;
    }

    // ----------------------------
    // INITIALIZATION
    // ----------------------------
    
    // Initialize the form
    updateHotelsRowVisibility();
    updateDaysVisibility();
    updatePackagePrice();
    
    // Load form data from previous step
    loadFormDataFromSession();
    
    // Restore tour selections if returning to this page
    restoreTourSelections();
    
    // Fetch hotels from API
    fetchHotels();

    // Add event listeners to hotel options to clear error message when selected
    const hotelOptions = document.querySelectorAll('.hotels-option');
    hotelOptions.forEach(option => {
        option.addEventListener('change', () => {
            const hotelErrorMessage = document.getElementById('hotel-error-message');
            if (hotelErrorMessage && option.checked) {
                hotelErrorMessage.style.display = 'none';
            }
            // Save current data when hotel selection changes
            saveCurrentFormData();
        });
    });

    // Function to save current form data to sessionStorage
    function saveCurrentFormData() {
        const formData = window.bookingFormData || {};
        
        // Collect van rental data
        const destinationSelect = document.getElementById('destinationSelect')?.value || '';
        const vanPlace = document.getElementById('placeSelect')?.value || '';
        const vanTripType = document.getElementById('tripTypeSelect')?.value || '';
        const vanDays = document.getElementById('vanNumberOfDays')?.value || '';
        
        // Get package_only_id for selected package
        const selectedPackageForId = document.querySelector('input[name="package-selection"]:checked')?.value || null;
        const selectedHotelForId = document.querySelector('input[name="hotel-selection"]:checked')?.value || null;
        let packageOnlyId = null;
        if (selectedPackageForId && selectedHotelForId) {
            const pkg = getPackageByCategoryAndHotel(selectedPackageForId, selectedHotelForId);
            if (pkg) {
                packageOnlyId = pkg.package_only_id || pkg.id;
            }
        }
        
        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            selectedPackage: selectedPackageForId,
            selectedHotel: selectedHotelForId,
            packageOnlyId: packageOnlyId,
            selectedVehicles: (() => {
                const selectedVehicles = [];
                const rentalDays = parseInt(document.getElementById('rentalDays').value) || 0;
                const selectedVehicleOptions = document.querySelectorAll('.rental-option:checked');
                
                selectedVehicleOptions.forEach(vehicle => {
                    const vehicleType = vehicle.value;
                    const vehicleData = getVehicleByName(vehicleType);
                    
                    if (rentalDays > 0) {
                        if (vehicleData) {
                            // Use database data with vehicle_id
                            selectedVehicles.push({
                                id: vehicleData.vehicle_id, // Always include vehicle_id from database
                                name: vehicleData.name,
                                days: rentalDays,
                                price: vehicleData.price_per_day * rentalDays
                            });
                        } else {
                            // If no database match, skip this vehicle (don't allow booking without vehicle_id)
                            console.warn(`Vehicle "${vehicleType}" not found in database - skipping`);
                        }
                    }
                });
                return selectedVehicles;
            })(),
            rentalVehicles: Array.from(document.querySelectorAll('.rental-option:checked')).map(option => option.value),
            rentalDays: document.getElementById('rentalDays').value,
            diving: document.querySelector('.diving-option:checked') ? true : false,
            divingId: (() => {
                const selectedDiving = document.querySelector('.diving-option:checked');
                return selectedDiving ? selectedDiving.dataset.divingId : null;
            })(),
            divingName: (() => {
                const selectedDiving = document.querySelector('.diving-option:checked');
                return selectedDiving ? selectedDiving.value : null;
            })(),
            numberOfDivers: document.getElementById('numberOfDiver').value,
            // Van rental data
            vanDestination: destinationSelect,
            vanPlace: vanPlace,
            vanDestinationId: (() => {
                const selectEl = document.getElementById('placeSelect');
                const selectedOption = selectEl?.options[selectEl?.selectedIndex];
                return selectedOption?.dataset.vanDestinationId || null;
            })(),
            vanTripType: vanTripType,
            vanDays: vanDays,
            vanAmount: document.getElementById('vanTotalAmount')?.value || '',
            packageAmount: (() => {
                const touristCount = parseInt(document.getElementById('touristCount').value) || 0;
                const selectedPackage = document.querySelector('input[name="package-selection"]:checked')?.value || null;
                const selectedHotel = document.querySelector('input[name="hotel-selection"]:checked')?.value || null;
                if (selectedPackage && touristCount >= 1) {
                    const pricing = calculatePackagePricing(selectedPackage, touristCount, selectedHotel);
                    return pricing.totalPrice > 0 ? `₱${pricing.totalPrice.toLocaleString()}.00` : '';
                }
                return '';
            })(),
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value
        };
        
        // Store complete booking data for the summary page
        const completeBookingData = {
            ...formData,
            ...tourSelections,
            bookingType: 'package_only'
        };
        
        sessionStorage.setItem('completeBookingData', JSON.stringify(completeBookingData));
        sessionStorage.setItem('tourSelections', JSON.stringify(tourSelections));
        
        console.log('Form data saved to sessionStorage:', completeBookingData);
    }

    // ----------------------------
    // VAN RENTAL DESTINATION HANDLING
    // ----------------------------
    
    const destinationSelect = document.getElementById('destinationSelect');
    const placeSelectionContainer = document.getElementById('placeSelectionContainer');
    const tripTypeContainer = document.getElementById('tripTypeContainer');
    const vanDaysContainer = document.getElementById('vanDaysContainer');
    const vanTotalAmountContainer = document.getElementById('vanTotalAmountContainer');
    const placeSelect = document.getElementById('placeSelect');
    const tripTypeSelect = document.getElementById('tripTypeSelect');
    const vanNumberOfDays = document.getElementById('vanNumberOfDays');
    const vanAmountInput = document.getElementById('vanTotalAmount');

    // Debug logging to verify elements are found
    console.log('Van Rental Elements Check:', {
        destinationSelect: !!destinationSelect,
        placeSelectionContainer: !!placeSelectionContainer,
        tripTypeContainer: !!tripTypeContainer,
        vanDaysContainer: !!vanDaysContainer,
        vanTotalAmountContainer: !!vanTotalAmountContainer,
        placeSelect: !!placeSelect,
        tripTypeSelect: !!tripTypeSelect,
        vanNumberOfDays: !!vanNumberOfDays,
        vanAmountInput: !!vanAmountInput
    });

    // Handle dropdown button clicks for Choose Destination
    const destinationDropdownItems = document.querySelectorAll('#destinationDropdown + .dropdown-menu .dropdown-item');
    const destinationSelectedText = document.getElementById('destinationSelectedText');
    
    destinationDropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const value = this.getAttribute('data-value');
            const text = this.textContent;
            
            // Update hidden input and display text
            destinationSelect.value = value;
            destinationSelectedText.textContent = text;
            
            // Trigger change event
            const event = new Event('change');
            destinationSelect.dispatchEvent(event);
        });
    });

    const vanControlContainers = [placeSelectionContainer, tripTypeContainer, vanDaysContainer];
    const vanControls = [placeSelect, tripTypeSelect, vanNumberOfDays];

    function resetVanSelections() {
        if (placeSelect) {
            placeSelect.selectedIndex = 0;
        }
        if (tripTypeSelect) {
            tripTypeSelect.value = '';
        }
        if (vanNumberOfDays) {
            vanNumberOfDays.value = '';
        }
        if (vanAmountInput) {
            vanAmountInput.value = '';
        }
    }

    function setVanControlsEnabled(enabled) {
        vanControlContainers.forEach(container => {
            if (!container) return;
            container.classList.toggle('van-disabled', !enabled);
        });

        vanControls.forEach(control => {
            if (!control) return;
            control.disabled = !enabled;
            if (!enabled) {
                const tagName = (control.tagName || '').toUpperCase();
                if (tagName === 'SELECT') {
                    control.selectedIndex = 0;
                } else {
                    control.value = '';
                }
            }
        });
    }

    function setVanTotalState(enabled) {
        if (vanTotalAmountContainer) {
            vanTotalAmountContainer.classList.toggle('van-disabled', !enabled);
        }

        if (vanAmountInput) {
            vanAmountInput.disabled = !enabled;
            if (!enabled) {
                vanAmountInput.value = '';
            }
        }
    }

    function clearPlaceOptions() {
        if (!placeSelect) return;
        while (placeSelect.options.length > 1) {
            placeSelect.remove(1);
        }
    }

    function getDestinationsByLocationType(locationType) {
        if (!locationType || !vanDestinationsData) {
            return [];
        }
        const normalized = locationType.toLowerCase();
        return vanDestinationsData.filter(dest => 
            dest.location_type && dest.location_type.toLowerCase() === normalized
        );
    }

    function populatePlaceOptions(locationType, selectedValue = '') {
        if (!placeSelect) return;

        const previousValue = selectedValue || placeSelect.value;
        clearPlaceOptions();

        if (!locationType) {
            return;
        }

        const destinations = getDestinationsByLocationType(locationType);
        destinations.forEach(dest => {
            if (!dest.destination_name) return;
            const option = document.createElement('option');
            option.value = dest.destination_name;
            option.textContent = dest.destination_name;
            option.dataset.vanDestinationId = dest.van_destination_id;
            option.dataset.onewayPrice = dest.oneway_price || 0;
            option.dataset.roundtripPrice = dest.roundtrip_price || 0;
            placeSelect.appendChild(option);
        });

        if (previousValue) {
            placeSelect.value = previousValue;
        }
        
        // Force select to maintain fixed width after options are added
        if (placeSelect) {
            placeSelect.style.width = '100%';
            placeSelect.style.maxWidth = '100%';
            placeSelect.style.boxSizing = 'border-box';
            placeSelect.style.minWidth = '0';
        }
    }

    function updateVanPrice() {
        if (!vanAmountInput) {
            calculateTotalAmount();
            return;
        }

        const destinationValue = destinationSelect?.value || '';
        const selectedOption = placeSelect ? placeSelect.options[placeSelect.selectedIndex] : null;
        const tripType = tripTypeSelect?.value || '';
        const days = parseInt(vanNumberOfDays?.value || '', 10) || 0;

        if (!destinationValue || !selectedOption || !tripType || !days) {
            vanAmountInput.value = '';
            calculateTotalAmount();
            return;
        }

        const priceKey = tripType === 'oneway' ? 'onewayPrice' : 'roundtripPrice';
        const basePrice = parseFloat(selectedOption.dataset[priceKey]) || 0;

        if (basePrice > 0) {
            const totalPrice = basePrice * days;
            vanAmountInput.value = `₱${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            vanAmountInput.value = '';
        }

        calculateTotalAmount();
    }

    function handleDestinationSelection(selectedDestination, options = {}) {
        const { preserveValues = false, selectedPlace = '', selectedTripType = '', selectedDays = '' } = options;
        console.log('Destination selected:', selectedDestination);

        const isWithin = selectedDestination === 'Within Puerto Galera';
        const isOutside = selectedDestination === 'Outside Puerto Galera';
        const enableControls = isWithin || isOutside;

        if (!preserveValues) {
            resetVanSelections();
        }

        setVanControlsEnabled(enableControls);
        setVanTotalState(enableControls);

        const locationType = isWithin ? 'Within Puerto Galera' : isOutside ? 'Outside Puerto Galera' : '';
        if (enableControls) {
            const desiredPlace = preserveValues ? selectedPlace : '';
            populatePlaceOptions(locationType, desiredPlace);

            if (preserveValues && placeSelect && selectedPlace) {
                placeSelect.value = selectedPlace;
            }
            if (preserveValues && tripTypeSelect && selectedTripType) {
                tripTypeSelect.value = selectedTripType;
            }
            if (preserveValues && vanNumberOfDays && selectedDays) {
                vanNumberOfDays.value = selectedDays;
            }
        } else {
            clearPlaceOptions();
        }

        updateVanPrice();

        if (!preserveValues) {
            saveCurrentFormData();
        }
    }

    if (destinationSelect) {
        destinationSelect.addEventListener('change', function() {
            handleDestinationSelection(this.value);
        });

        handleDestinationSelection(destinationSelect.value || '');
    } else {
        setVanControlsEnabled(false);
        setVanTotalState(false);
    }

    if (placeSelect) {
        placeSelect.addEventListener('change', () => {
            updateVanPrice();
            saveCurrentFormData();
        });
    }

    if (tripTypeSelect) {
        tripTypeSelect.addEventListener('change', () => {
            updateVanPrice();
            saveCurrentFormData();
        });
    }

    if (vanNumberOfDays) {
        vanNumberOfDays.addEventListener('change', () => {
            updateVanPrice();
            saveCurrentFormData();
        });
    }

    // Initialize vehicles data when page loads
    // Use a small delay to ensure all dynamic content is loaded
    function initializeVehicles() {
        setTimeout(() => {
            fetchVehicles().then(() => {
                console.log("Vehicles loaded successfully!");
                // Retry rendering if container wasn't available initially
                if (!document.getElementById('rental-options')) {
                    setTimeout(() => renderVehicleOptions(), 1000);
                }
            }).catch(error => {
                console.error("Error loading vehicles:", error);
            });
        }, 100);
    }

    function initializeDiving() {
        setTimeout(() => {
            fetchDiving().then(() => {
                console.log("Diving records loaded successfully!");
                // Retry rendering if container wasn't available initially
                if (!document.getElementById('diving-options')) {
                    setTimeout(() => renderDivingOptions(), 1000);
                }
            }).catch(error => {
                console.error("Error loading diving records:", error);
            });
        }, 100);
    }
    
    function initializeVanDestinations() {
        setTimeout(() => {
            fetchVanDestinations().then(() => {
                console.log("Van destinations loaded successfully!");
            }).catch(error => {
                console.error("Error loading van destinations:", error);
            });
        }, 100);
    }
    
    function initializePackages() {
        setTimeout(() => {
            fetchPackages().then(() => {
                console.log("✅ Packages loaded successfully!");
                // Force immediate price refresh after a short delay to ensure DOM is ready
                setTimeout(() => {
                    refreshPackagePrices();
                }, 500);
            }).catch(error => {
                console.error("❌ Error loading packages:", error);
            });
        }, 100);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeVehicles();
            initializeDiving();
            initializeVanDestinations();
            initializePackages();
        });
    } else {
        // DOM is already loaded
        initializeVehicles();
        initializeDiving();
        initializeVanDestinations();
        initializePackages();
    }

    // ----------------------------
    // PACKAGE INFO MODAL FUNCTIONALITY
    // ----------------------------
    
    // Function to show package information modal
    async function showPackageInfo(packageName) {
        console.log('📦 Showing info for:', packageName);
        
        // Get modal element
        const modalElement = document.getElementById('packageInfoModal');
        const modalTitle = document.getElementById('packageInfoModalLabel');
        const modalSubtitle = document.getElementById('packageInfoSubtitle');
        const modalBody = document.getElementById('packageInfoModalBody');
        
        // Hide any open dropdowns first
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        openDropdowns.forEach(dropdown => {
            const bsDropdown = bootstrap.Dropdown.getInstance(dropdown.previousElementSibling);
            if (bsDropdown) {
                bsDropdown.hide();
            }
        });
        
        // Show loading state
        modalTitle.textContent = packageName;
        modalSubtitle.textContent = 'Loading package details...';
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-danger" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Fetching package information...</p>
            </div>
        `;
        
        // Create or get modal instance
        let modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
            modal = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true,
                focus: true
            });
        }
        
        // Show the modal
        modal.show();
        
        try {
            // Get selected hotel for pricing context
            const selectedHotelInput = document.querySelector('input[name="hotel-selection"]:checked');
            const selectedHotel = selectedHotelInput ? selectedHotelInput.value : null;
            
            // Get package details from packagesData
            let packageInfo = null;
            
            if (selectedHotel) {
                packageInfo = getPackageByCategoryAndHotel(packageName, selectedHotel);
            } else {
                // If no hotel selected, get any package with this category
                packageInfo = packagesData.find(pkg => pkg.category === packageName);
            }
            
            if (!packageInfo) {
                throw new Error('Package information not found');
            }
            
            // Define package details based on category
            const packageDetails = getPackageDetailsTemplate(packageName, packageInfo, selectedHotel);
            
            // Update modal with package information
            modalTitle.textContent = packageDetails.title;
            modalSubtitle.textContent = packageDetails.subtitle;
            modalBody.innerHTML = packageDetails.content;
            
        } catch (error) {
            console.error('❌ Error loading package info:', error);
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error loading package information</strong>
                    <p class="mb-0 mt-2">${error.message}</p>
                </div>
            `;
        }
    }
    
    // Function to generate package details template
    function getPackageDetailsTemplate(packageName, packageInfo, selectedHotel) {
        const details = {
            'Package 1': {
                title: 'Package 1 - 2 Days 1 Night',
                subtitle: 'Hotel + Island Tour + Land Tour',
                description: 'Experience the best of Puerto Galera with our 2-day adventure package. Enjoy comfortable accommodation, exciting island hopping, and explore the beautiful inland attractions.',
                inclusions: [
                    'Hotel accommodation (1 night)',
                    'Island hopping tour (full day)',
                    'Land tour to scenic destinations',
                    'Tour guide services',
                    'Boat transportation',
                    'Environmental fees'
                ]
            },
            'Package 2': {
                title: 'Package 2 - 3 Days 2 Nights ⭐ BESTSELLER',
                subtitle: 'Hotel + Island Tour + Land Tour',
                description: 'Our most popular package! Immerse yourself in 3 days of island paradise with comfortable stays, island adventures, and inland explorations. Perfect for those who want to experience everything Puerto Galera has to offer.',
                inclusions: [
                    'Hotel accommodation (2 nights)',
                    'Island hopping tour (full day)',
                    'Land tour to scenic destinations',
                    'Tour guide services',
                    'Boat transportation',
                    'Environmental fees',
                    'Extended leisure time'
                ]
            },
            'Package 3': {
                title: 'Package 3 - 2 Days 1 Night',
                subtitle: 'Hotel + Island Tour',
                description: 'Perfect for beach lovers! Enjoy 2 days of island paradise with comfortable accommodation and an exciting island hopping adventure visiting the most beautiful beaches and snorkeling spots.',
                inclusions: [
                    'Hotel accommodation (1 night)',
                    'Island hopping tour (full day)',
                    'Tour guide services',
                    'Boat transportation',
                    'Snorkeling equipment',
                    'Environmental fees'
                ]
            },
            'Package 4': {
                title: 'Package 4 - 3 Days 2 Nights',
                subtitle: 'Hotel + Island Tour',
                description: 'Extended island adventure with 3 days of relaxation and exploration. Enjoy comfortable accommodation for 2 nights and a comprehensive island hopping tour to discover the best beaches and marine life.',
                inclusions: [
                    'Hotel accommodation (2 nights)',
                    'Island hopping tour (full day)',
                    'Tour guide services',
                    'Boat transportation',
                    'Snorkeling equipment',
                    'Environmental fees',
                    'Beach leisure time'
                ]
            }
        };
        
        const detail = details[packageName];
        if (!detail) {
            return {
                title: packageName,
                subtitle: 'Package Details',
                content: '<p>Package information not available.</p>'
            };
        }
        
        // Generate pricing section from package pricing data
        let pricingHTML = '';
        if (packageInfo && packageInfo.pricing && packageInfo.pricing.length > 0) {
            const sortedPricing = [...packageInfo.pricing].sort((a, b) => a.min_tourist - b.min_tourist);
            
            pricingHTML = '<div class="pricing-section">';
            pricingHTML += '<div class="pricing-title"><i class="fas fa-tag"></i>Pricing Per Person</div>';
            
            if (selectedHotel) {
                pricingHTML += `<p class="text-muted small mb-3"><i class="fas fa-hotel me-1"></i>Prices shown for: <strong>${selectedHotel}</strong></p>`;
            }
            
            sortedPricing.forEach(tier => {
                const paxRange = tier.min_tourist === tier.max_tourist 
                    ? `${tier.min_tourist} pax`
                    : `${tier.min_tourist}-${tier.max_tourist} pax`;
                
                pricingHTML += `
                    <div class="pricing-item">
                        <span class="pricing-pax">
                            <i class="fas fa-users"></i>${paxRange}
                        </span>
                        <span class="pricing-cost">₱${tier.price_per_head.toLocaleString()}</span>
                    </div>
                `;
            });
            
            pricingHTML += '</div>';
        }
        
        // Generate inclusions section
        let inclusionsHTML = '<div class="inclusions-section">';
        inclusionsHTML += '<div class="inclusions-title"><i class="fas fa-check-circle"></i>Package Inclusions</div>';
        detail.inclusions.forEach(item => {
            inclusionsHTML += `
                <div class="inclusion-item">
                    <i class="fas fa-check"></i>
                    <span>${item}</span>
                </div>
            `;
        });
        inclusionsHTML += '</div>';
        
        // Combine all sections
        const content = `
            <div class="description-section">
                <p><strong>${detail.description}</strong></p>
            </div>
            ${pricingHTML}
            ${inclusionsHTML}
            ${!selectedHotel ? '<div class="alert alert-info mt-3"><i class="fas fa-info-circle me-2"></i>Select a hotel to see specific pricing for your preferred accommodation.</div>' : ''}
        `;
        
        return {
            title: detail.title,
            subtitle: detail.subtitle,
            content: content
        };
    }
    
    // Attach event listeners to "More Info" buttons
    function attachPackageInfoListeners() {
        const packageInfoButtons = document.querySelectorAll('.btn-package-info');
        console.log('Found package info buttons:', packageInfoButtons.length);
        
        packageInfoButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent dropdown from closing
                const packageName = button.getAttribute('data-package');
                showPackageInfo(packageName);
            });
        });
    }
    
    // Initialize package info listeners
    attachPackageInfoListeners();
    setTimeout(attachPackageInfoListeners, 100); // Backup initialization
    
    // Add event listener to clean up modal on close
    const packageInfoModal = document.getElementById('packageInfoModal');
    if (packageInfoModal) {
        packageInfoModal.addEventListener('hidden.bs.modal', function () {
            // Ensure all backdrops are removed
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            console.log('✅ Modal closed and cleaned up');
        });
    }

    console.log("Tour booking form initialized successfully!");
})();
