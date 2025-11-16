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

    // ----------------------------
    // DIVING DATA MANAGEMENT
    // ----------------------------
    
    let divingData = [];
    
    // ----------------------------
    // VAN DESTINATIONS DATA MANAGEMENT
    // ----------------------------
    
    let vanDestinationsData = [];

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
                console.log('✅ Vehicles loaded:', vehiclesData);
                renderVehicleOptions();
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
    function renderVehicleOptions() {
        const rentalOptionsContainer = document.getElementById('rental-options');
        if (!rentalOptionsContainer) {
            console.warn('⚠️ Rental options container not found. Retrying in 500ms...');
            setTimeout(() => {
                const retryContainer = document.getElementById('rental-options');
                if (retryContainer) {
                    renderVehicleOptions();
                } else {
                    console.error('❌ Rental options container still not found after retry');
                }
            }, 500);
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
        
        // Check tour packages
        const islandTours = document.querySelectorAll('.island-option:checked');
        const inlandTours = document.querySelectorAll('.inland-option:checked');
        const snorkelTours = document.querySelectorAll('.snorkel-option:checked');
        const hasTourPackages = islandTours.length > 0 || inlandTours.length > 0 || snorkelTours.length > 0;
        
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
                errorTextSpan.textContent = 'Please select at least one service (Tour Package, Rental Vehicle, Van Rental with Tourist Franchise, or Diving) before proceeding to the next page.';
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
                setError(touristCountInput, "Number of Tourist is required.");
                valid = false;
                // Focus on the tourist count input
                touristCountInput.focus();
            } else if (touristCount < 1) {
                setError(touristCountInput, "Number of Tourist must be at least 1.");
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
        const islandTours = document.querySelectorAll('.island-option:checked');
        const inlandTours = document.querySelectorAll('.inland-option:checked');
        const snorkelTours = document.querySelectorAll('.snorkel-option:checked');
        const hasTourPackages = islandTours.length > 0 || inlandTours.length > 0 || snorkelTours.length > 0;
        
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
    
    // Control Hotels row visibility based on selected package
    function updateHotelsRowVisibility() {
        const hotelsRow = document.getElementById("hotelsRow");
        if (!hotelsRow) return;
        
        // Show hotels when any package is selected (all packages include accommodation)
        const packageSelected = document.querySelector(".package-selection-option:checked");
        
        if (packageSelected) {
            hotelsRow.classList.add("is-visible");
        } else {
            hotelsRow.classList.remove("is-visible");
        }
        
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
    // PRICING CALCULATIONS
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

        if (touristCount === 1) {
            pricePerPerson = 3000;
        } else if (touristCount === 2) {
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

    // Main function to update package price
    function updatePackagePrice() {
        const touristCountInput = document.getElementById("touristCount");
        const amountOfPackageInput = document.getElementById("amountOfPackage");
        
        if (!touristCountInput || !amountOfPackageInput) return;
        
        const touristCount = parseInt(touristCountInput.value) || 0;
        
        // Check if any island tour option is selected
        const islandOptionsChecked = document.querySelectorAll(".island-option:checked").length > 0;
        const inlandOptionsChecked = document.querySelectorAll(".inland-option:checked").length > 0;
        const snorkelOptionsChecked = document.querySelectorAll(".snorkel-option:checked").length > 0;
        
        let totalPackagePrice = 0;
        
        // Calculate island tour price if any island option is selected
        if (islandOptionsChecked) {
            totalPackagePrice += calculateIslandTourPrice(touristCount);
        }

        // Calculate inland tour price if any inland option is selected
        if (inlandOptionsChecked) {
            totalPackagePrice += calculateInlandTourPrice(touristCount);
        }

        // Calculate snorkeling tour price if any snorkeling option is selected
        if (snorkelOptionsChecked) {
            totalPackagePrice += calculateSnorkelingTourPrice(touristCount);
        }

        // Calculate vehicle rental price if selected
        calculateVehiclePrice();
        
        // Calculate diving service price if selected
        calculateDivingPrice();
        
        // Format and display package price
        if (totalPackagePrice > 0) {
            amountOfPackageInput.value = `₱${totalPackagePrice.toLocaleString()}.00`;
        } else {
            amountOfPackageInput.value = "";
        }
        
        // Update total amount whenever package price changes
        calculateTotalAmount();
    }

    // Function to calculate total amount
    function calculateTotalAmount() {
        let total = 0;
        
        // Get package amount
        const packageAmountText = document.getElementById('amountOfPackage').value;
        if (packageAmountText) {
            const packageAmount = parseFloat(packageAmountText.replace(/[₱,]/g, '')) || 0;
            total += packageAmount;
        }
        
        // Get vehicle amount (regular rental vehicles)
        const vehicleAmountText = document.getElementById('amountOfVehicle').value;
        if (vehicleAmountText) {
            const vehicleAmount = parseFloat(vehicleAmountText.replace(/[₱,]/g, '')) || 0;
            total += vehicleAmount;
        }
        
        // Get van rental amount (van rental with tourist franchise)
        const vanRentalAmountText = document.getElementById('vanTotalAmount')?.value;
        if (vanRentalAmountText) {
            const vanRentalAmount = parseFloat(vanRentalAmountText.replace(/[₱,]/g, '')) || 0;
            total += vanRentalAmount;
        }
        
        // Get diving amount
        const divingAmountText = document.getElementById('amountOfDiving').value;
        if (divingAmountText) {
            const divingAmount = parseFloat(divingAmountText.replace(/[₱,]/g, '')) || 0;
            total += divingAmount;
        }
        
        // Update total amount field
        const totalAmountInput = document.getElementById('totalAmount');
        
        if (total > 0) {
            const formattedTotal = `₱${total.toLocaleString()}.00`;
            if (totalAmountInput) totalAmountInput.value = formattedTotal;
        } else {
            if (totalAmountInput) totalAmountInput.value = '';
        }
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
        // Recalculate package price
        updatePackagePrice();
    }

    // ----------------------------
    // HOTEL SELECTION FUNCTIONALITY
    // ----------------------------
    
    function updateHotelSelection() {
        const hotelOptions = document.querySelectorAll('.hotels-option');
        const selectedHotelText = document.getElementById('selectedHotelText');
        
        hotelOptions.forEach(option => {
            option.addEventListener('change', function() {
                if (this.checked) {
                    const hotelName = this.value;
                    selectedHotelText.textContent = hotelName;
                    
                    // Add visual feedback to selected option
                    document.querySelectorAll('.hotels-option').forEach(opt => {
                        const label = opt.closest('.hover-option');
                        if (label) {
                            label.classList.remove('selected-option');
                        }
                    });
                    
                    const selectedLabel = this.closest('.hover-option');
                    if (selectedLabel) {
                        selectedLabel.classList.add('selected-option');
                    }
                    
                    // Store selected hotel in form data
                    if (window.bookingFormData) {
                        window.bookingFormData.selectedHotel = hotelName;
                    }
                    
                    console.log('Hotel selected:', hotelName);
                }
            });
        });
    }

    // ----------------------------
    // PACKAGE SELECTION FUNCTIONALITY
    // ----------------------------
    
    function updatePackageSelection() {
        const packageSelectionOptions = document.querySelectorAll('.package-selection-option');
        const selectedPackageText = document.getElementById('selectedPackageText');
        
        packageSelectionOptions.forEach(option => {
            option.addEventListener('change', function() {
                if (this.checked) {
                    const packageName = this.value;
                    
                    // Update button text to show selected package
                    const packageNumber = packageName.match(/Package (\d+)/)[1];
                    selectedPackageText.textContent = `Package ${packageNumber} Selected`;
                    
                    // Add visual feedback to selected option
                    document.querySelectorAll('.package-selection-option').forEach(opt => {
                        const label = opt.closest('.package-option-item');
                        if (label) {
                            label.classList.remove('selected-option');
                        }
                    });
                    
                    const selectedLabel = this.closest('.package-option-item');
                    if (selectedLabel) {
                        selectedLabel.classList.add('selected-option');
                    }
                    
                    // Store selected package in form data
                    if (window.bookingFormData) {
                        window.bookingFormData.selectedPackage = packageName;
                    }
                    
                    // Update package amount calculation based on selected package
                    updatePackageAmountFromSelection(packageName);
                    
                    // Show hotels row when a package is selected
                    updateHotelsRowVisibility();
                    
                    console.log('Package selected:', packageName);
                }
            });
        });
    }
    
    function updatePackageAmountFromSelection(packageDetails) {
        // This function can be used to show price ranges or calculate based on tourist count
        // For now, we'll just indicate that a package is selected
        const touristCountInput = document.getElementById("touristCount");
        const touristCount = parseInt(touristCountInput?.value) || 0;
        
        if (touristCount > 0) {
            // Calculate approximate price based on package and group size
            // This is a simplified calculation - in a real app you'd have more complex logic
            let priceRange = "";
            
            if (packageDetails.includes("Package 1")) {
                if (touristCount >= 10) priceRange = "₱2,100 per pax";
                else if (touristCount >= 7) priceRange = "₱2,350 per pax";
                else if (touristCount >= 5) priceRange = "₱2,650 per pax";
                else if (touristCount >= 3) priceRange = "₱2,950 per pax";
                else priceRange = "₱3,200 per pax";
            } else if (packageDetails.includes("Package 2")) {
                if (touristCount >= 10) priceRange = "₱2,600 per pax";
                else if (touristCount >= 7) priceRange = "₱2,850 per pax";
                else if (touristCount >= 5) priceRange = "₱3,150 per pax";
                else if (touristCount >= 3) priceRange = "₱3,450 per pax";
                else priceRange = "₱3,800 per pax";
            } else if (packageDetails.includes("Package 3")) {
                if (touristCount >= 10) priceRange = "₱1,650 per pax";
                else if (touristCount >= 7) priceRange = "₱1,850 per pax";
                else if (touristCount >= 5) priceRange = "₱1,950 per pax";
                else if (touristCount >= 4) priceRange = "₱2,300 per pax";
                else if (touristCount >= 3) priceRange = "₱2,550 per pax";
                else priceRange = "₱2,800 per pax";
            } else if (packageDetails.includes("Package 4")) {
                if (touristCount >= 10) priceRange = "₱2,100 per pax";
                else if (touristCount >= 7) priceRange = "₱2,400 per pax";
                else if (touristCount >= 5) priceRange = "₱2,700 per pax";
                else if (touristCount >= 4) priceRange = "₱3,000 per pax";
                else if (touristCount >= 3) priceRange = "₱3,150 per pax";
                else priceRange = "₱3,300 per pax";
            }
            
            // Update a display element if it exists (we can add this later)
            console.log(`Calculated price for ${touristCount} tourists: ${priceRange}`);
        }
        
        // Update total amount
        calculateTotalAmount();
    }

    // ----------------------------
    // EVENT LISTENERS SETUP
    // ----------------------------
    
    // Setup multi-select dropdowns
    wireMultiSelect("island-select-all", "island-options", "island-option", null);
    wireMultiSelect("inland-select-all", "inland-options", "inland-option", null);
    wireMultiSelect("snorkel-select-all", "snorkel-options", "snorkel-option", null);

    // Add specific handling for rental vehicle options
    const rentalOptions = document.querySelectorAll(".rental-option");
    rentalOptions.forEach(option => {
        option.addEventListener("change", () => {
            calculateVehiclePrice();
            calculateTotalAmount();
            clearRentalDaysErrorIfNoVehicles();
            clearStep2Error();
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
            // Update inland tour availability based on tourist count
            updateInlandTourAvailability();
        });
        
        // Ensure only positive numbers are entered
        touristCountInput.addEventListener("keypress", (e) => {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) e.preventDefault();
        });
        
        // Prevent negative values and zero
        touristCountInput.addEventListener("blur", () => {
            const value = parseInt(touristCountInput.value) || 0;
            if (value < 0) {
                touristCountInput.value = "";
            }
            updatePackagePrice();
            updateInlandTourAvailability();
        });
    }
    
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
        // Save current tour selections to sessionStorage before going back
        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            islandTours: Array.from(document.querySelectorAll('.island-option:checked')).map(option => option.value),
            inlandTours: Array.from(document.querySelectorAll('.inland-option:checked')).map(option => option.value),
            snorkelTours: Array.from(document.querySelectorAll('.snorkel-option:checked')).map(option => option.value),
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
            selectedHotel: document.querySelector('.hotels-option:checked')?.value || '',
            packageAmount: document.getElementById('amountOfPackage').value,
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            vanRentalAmount: document.getElementById('amountOfVanRental')?.value || '',
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value
        };
        
        sessionStorage.setItem('tourSelections', JSON.stringify(tourSelections));
        
        // Go back to booking page
        window.location.href = '../form/booking_form.html';
    };
    
    // Function to go back to booking page
    window.previousStep = function() {
        // Save current tour selections to sessionStorage before going back
        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            islandTours: Array.from(document.querySelectorAll('.island-option:checked')).map(option => option.value),
            inlandTours: Array.from(document.querySelectorAll('.inland-option:checked')).map(option => option.value),
            snorkelTours: Array.from(document.querySelectorAll('.snorkel-option:checked')).map(option => option.value),
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
            selectedHotel: document.querySelector('.hotels-option:checked')?.value || '',
            packageAmount: document.getElementById('amountOfPackage').value,
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            vanRentalAmount: document.getElementById('amountOfVanRental')?.value || '',
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value
        };
        
        sessionStorage.setItem('tourSelections', JSON.stringify(tourSelections));
        
        // Go back to booking page
        window.location.href = '../option/option_page.html';
    };

    window.nextStep = function() {
        // Validate form before proceeding
        const isValid = validateStep2();
        if (!isValid) {
            console.log("Form validation failed");
            return;
        }
        
        console.log("Form is valid, proceeding to next step");
        
        // Combine form data from step 1 and tour selections
        const formData = window.bookingFormData || {};
        
        // Collect detailed vehicle information with individual pricing
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
        
        // Collect van rental data
        const selectedVanRental = (() => {
            const destinationSelect = document.getElementById('destinationSelect');
            const placeSelect = document.getElementById('placeSelect');
            const tripTypeSelect = document.getElementById('tripTypeSelect');
            const numberOfDaysSelect = document.getElementById('vanNumberOfDays');
            const vanTotalAmount = document.getElementById('vanTotalAmount');

            if (!destinationSelect || !destinationSelect.value) return null;

            const destination = placeSelect?.value || '';
            const tripType = tripTypeSelect?.value || '';
            const days = parseInt(numberOfDaysSelect?.value) || 0;
            const selectedOption = placeSelect ? placeSelect.options[placeSelect.selectedIndex] : null;
            const vanDestinationId = selectedOption?.dataset.vanDestinationId || null;

            if (!destination || !tripType || days <= 0) return null;

            return {
                destination,
                destinationType: destinationSelect.value,
                vanDestinationId,
                tripType,
                days,
                price: parseFloat(vanTotalAmount?.value?.replace(/[₱,]/g, '') || 0)
            };
        })();

        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            islandTours: Array.from(document.querySelectorAll('.island-option:checked')).map(option => option.value),
            inlandTours: Array.from(document.querySelectorAll('.inland-option:checked')).map(option => option.value),
            snorkelTours: Array.from(document.querySelectorAll('.snorkel-option:checked')).map(option => option.value),
            selectedVehicles: selectedVehicles, // New detailed vehicle objects
            rentalVehicles: Array.from(document.querySelectorAll('.rental-option:checked')).map(option => option.value), // Keep for backward compatibility
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
            selectedHotel: document.querySelector('.hotels-option:checked')?.value || '',
            packageAmount: document.getElementById('amountOfPackage').value,
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            vanRentalAmount: document.getElementById('vanTotalAmount')?.value || '',
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value,
            selectedVanRental: selectedVanRental // Add van rental data
        };
        
        // Store complete booking data for the next page
        const completeBookingData = {
            ...formData,
            ...tourSelections,
            bookingType: 'tour-only'
        };
        
        // Also save tour selections separately for restoration when user returns
        sessionStorage.setItem('tourSelections', JSON.stringify(tourSelections));
        sessionStorage.setItem('completeBookingData', JSON.stringify(completeBookingData));
        
        // Redirect to booking page
        window.location.href = 'tour_summary.html';
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
                console.log('Restoring tour selections from tourSelections:', tourSelections);
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
                    if (completeData.bookingType === 'tour-only') {
                        tourSelections = completeData;
                        console.log('Restoring tour selections from completeBookingData:', tourSelections);
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
                
                // Restore island tours
                tourSelections.islandTours?.forEach(tour => {
                    const checkbox = document.querySelector(`.island-option[value="${tour}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Restore inland tours
                tourSelections.inlandTours?.forEach(tour => {
                    const checkbox = document.querySelector(`.inland-option[value="${tour}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
                // Restore snorkel tours
                tourSelections.snorkelTours?.forEach(tour => {
                    const checkbox = document.querySelector(`.snorkel-option[value="${tour}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                
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
                
                // Restore selected hotel
                if (tourSelections.selectedHotel) {
                    const hotelCheckbox = document.querySelector(`.hotels-option[value="${tourSelections.selectedHotel}"]`);
                    if (hotelCheckbox) {
                        hotelCheckbox.checked = true;
                        const selectedHotelText = document.getElementById('selectedHotelText');
                        if (selectedHotelText) {
                            selectedHotelText.textContent = tourSelections.selectedHotel;
                        }
                    }
                }
                
                // Update all pricing after restoration
                setTimeout(() => {
                    updatePackagePrice();
                    calculateVehiclePrice();
                    calculateDivingPrice();
                    calculateTotalAmount();
                    updateInlandTourAvailability();
                    updateHotelsRowVisibility();
                    updateHotelSelection();
                }, 100);
                
                return tourSelections;
            } catch (error) {
                console.error('Error restoring tour selections:', error);
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
    // INITIALIZATION
    // ----------------------------
    
    // Initialize the form
    updateHotelsRowVisibility();
    updateDaysVisibility();
    updatePackagePrice();
    updateInlandTourAvailability();
    updateHotelSelection(); // Initialize hotel selection functionality
    updatePackageSelection(); // Initialize package selection functionality
    
    // Load form data from previous step
    loadFormDataFromSession();
    
    // Restore tour selections if returning to this page
    restoreTourSelections();

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
        });
    }

    if (tripTypeSelect) {
        tripTypeSelect.addEventListener('change', () => {
            updateVanPrice();
        });
    }

    if (vanNumberOfDays) {
        vanNumberOfDays.addEventListener('change', () => {
            updateVanPrice();
        });
    }

    // Initialize vehicles data when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            fetchVehicles().then(() => {
                console.log("Vehicles loaded successfully!");
            }).catch(error => {
                console.error("Error loading vehicles:", error);
            });
            fetchDiving().then(() => {
                console.log("Diving records loaded successfully!");
            }).catch(error => {
                console.error("Error loading diving records:", error);
            });
            fetchVanDestinations().then(() => {
                console.log("Van destinations loaded successfully!");
            }).catch(error => {
                console.error("Error loading van destinations:", error);
            });
        });
    } else {
        // DOM is already loaded
        fetchVehicles().then(() => {
            console.log("Vehicles loaded successfully!");
        }).catch(error => {
            console.error("Error loading vehicles:", error);
        });
        fetchDiving().then(() => {
            console.log("Diving records loaded successfully!");
        }).catch(error => {
            console.error("Error loading diving records:", error);
        });
        fetchVanDestinations().then(() => {
            console.log("Van destinations loaded successfully!");
        }).catch(error => {
            console.error("Error loading van destinations:", error);
        });
    }

    console.log("Tour booking form initialized successfully!");
})();
