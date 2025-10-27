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
    
    // Fetch vehicles from database
    async function fetchVehicles() {
        try {
            const response = await fetch('http://localhost:3000/api/vehicles');
            const result = await response.json();
            
            if (result.success) {
                vehiclesData = result.vehicles;
                console.log('✅ Vehicles loaded:', vehiclesData);
                return vehiclesData;
            } else {
                console.error('❌ Failed to fetch vehicles:', result.message);
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching vehicles:', error);
            return [];
        }
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

    // Hotel-based package pricing based on tourist count, selected package, and hotel
    function calculatePackagePricing(selectedPackage, touristCount, selectedHotel) {
        if (!selectedPackage || !touristCount || touristCount <= 0) return { pricePerPax: 0, totalPrice: 0 };
        
        let pricePerPax = 0;
        
        // If no hotel is selected, return default Ilaya pricing (first hotel in list)
        const hotel = selectedHotel || 'Ilaya';
        
        // Define pricing structure for all hotels and packages
        const hotelPricing = {
            'Ilaya': {
                'Package 1': {
                    1: 6400, 2: 3200, '3-4': 2950, '5-6': 2650, '7-9': 2350, '10+': 2100
                },
                'Package 2': {
                    1: 7600, 2: 3800, '3-4': 3450, '5-6': 3150, '7-9': 2850, '10+': 2600
                },
                'Package 3': {
                    1: 5600, 2: 2800, 3: 2550, 4: 2300, '5-6': 1950, '7-9': 1850, '10+': 1650
                },
                'Package 4': {
                    1: 6600, 2: 3300, 3: 3150, 4: 3000, '5-6': 2700, '7-9': 2400, '10+': 2100
                }
            },
            'Bliss': {
                'Package 1': {
                    1: 6800, 2: 3400, '3-4': 3150, '5-6': 2850, '7-9': 2550, '10+': 2300
                },
                'Package 2': {
                    1: 8000, 2: 4000, '3-4': 3650, '5-6': 3350, '7-9': 3050, '10+': 2800
                },
                'Package 3': {
                    1: 6000, 2: 3000, 3: 2750, 4: 2500, '5-6': 2150, '7-9': 2050, '10+': 1850
                },
                'Package 4': {
                    1: 7000, 2: 3500, 3: 3350, 4: 3200, '5-6': 2900, '7-9': 2600, '10+': 2300
                }
            },
            'The Mangyan Grand Hotel': {
                'Package 1': {
                    1: 8600, 2: 4300, '3-4': 4100, '5-8': 3900, '9+': 3700
                },
                'Package 2': {
                    1: 11700, 2: 5850, '3-4': 5400, '5-8': 4900, '9+': 4700
                },
                'Package 3': {
                    1: 8100, 2: 4050, '3-4': 3850, '5-8': 3300, '9+': 3100
                },
                'Package 4': {
                    1: 10800, 2: 5400, '3-4': 4800, '5-8': 4200, '9+': 4000
                }
            },
            'Transient House': { // Casa De Honcho
                'Package 1': {
                    1: 6900, 2: 3450, '3-4': 3300, '5-6': 3100, '7-9': 2900, '10+': 2600
                },
                'Package 2': {
                    1: 9200, 2: 4600, '3-4': 4400, '5-6': 4100, '7-9': 3800, '10+': 3500
                },
                'Package 3': {
                    1: 6900, 2: 3450, '3-4': 3300, '5-6': 3100, '7-9': 2900, '10+': 2600
                },
                'Package 4': {
                    1: 9200, 2: 4600, '3-4': 4400, '5-6': 4100, '7-9': 3800, '10+': 3500
                }
            },
            'SouthView': {
                'Package 1': {
                    1: 7000, 2: 3500, '3-4': 3150, '5-6': 2850, '7-9': 2550, '10+': 2300
                },
                'Package 2': {
                    1: 8000, 2: 4000, '3-4': 3750, '5-6': 3350, '7-9': 3050, '10+': 2800
                },
                'Package 3': {
                    1: 6000, 2: 3000, 3: 2750, 4: 2500, '5-6': 2150, '7-9': 2050, '10+': 1850
                },
                'Package 4': {
                    1: 7000, 2: 3500, 3: 3350, 4: 3200, '5-6': 2900, '7-9': 2600, '10+': 2300
                }
            }
        };
        
        // Get pricing for the selected hotel and package
        const packagePricing = hotelPricing[hotel]?.[selectedPackage];
        if (!packagePricing) {
            console.warn(`No pricing found for hotel: ${hotel}, package: ${selectedPackage}`);
            return { pricePerPax: 0, totalPrice: 0 };
        }
        
        // Determine price based on tourist count
        if (hotel === 'The Mangyan Grand Hotel') {
            // Mangyan Grand Hotel has different groupings
            if (touristCount === 1 || touristCount === 2) {
                pricePerPax = packagePricing[touristCount] || packagePricing[2];
            } else if (touristCount >= 3 && touristCount <= 4) {
                pricePerPax = packagePricing['3-4'];
            } else if (touristCount >= 5 && touristCount <= 8) {
                pricePerPax = packagePricing['5-8'];
            } else if (touristCount >= 9) {
                pricePerPax = packagePricing['9+'];
            }
        } else {
            // Standard groupings for other hotels
            if (touristCount === 1 || touristCount === 2) {
                pricePerPax = packagePricing[touristCount] || packagePricing[2];
            } else if (touristCount === 3 && packagePricing[3]) {
                pricePerPax = packagePricing[3];
            } else if (touristCount === 4 && packagePricing[4]) {
                pricePerPax = packagePricing[4];
            } else if (touristCount >= 3 && touristCount <= 4 && packagePricing['3-4']) {
                pricePerPax = packagePricing['3-4'];
            } else if (touristCount >= 5 && touristCount <= 6) {
                pricePerPax = packagePricing['5-6'];
            } else if (touristCount >= 7 && touristCount <= 9) {
                pricePerPax = packagePricing['7-9'];
            } else if (touristCount >= 10) {
                pricePerPax = packagePricing['10+'];
            }
        }
        
        const totalPrice = pricePerPax * touristCount;
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

    // Function to update price displays in package dropdowns based on selected hotel
    function updatePackageDropdownPrices(selectedHotel) {
        console.log('Updating dropdown prices for hotel:', selectedHotel);
        
        const packages = ['Package 1', 'Package 2', 'Package 3', 'Package 4'];
        
        packages.forEach(packageName => {
            // Find all price spans for current package using data attributes
            const priceSpans = document.querySelectorAll(`[data-package="${packageName}"].package-price`);
            
            priceSpans.forEach(span => {
                const touristTier = parseInt(span.getAttribute('data-tier'));
                
                if (touristTier) {
                    const pricing = calculatePackagePricing(packageName, touristTier, selectedHotel);
                    if (pricing.pricePerPax > 0) {
                        span.textContent = `₱${pricing.pricePerPax.toLocaleString()}`;
                        console.log(`Updated ${packageName} tier ${touristTier} to ₱${pricing.pricePerPax.toLocaleString()}`);
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
            
            switch (vehicleType) {
                case "ADV":
                    dailyRate = 1000;
                    break;
                case "NMAX":
                    dailyRate = 1000;
                    break;
                case "VERSYS 650":
                    dailyRate = 2000;
                    break;
                case "VERSYS 1000":
                    dailyRate = 2500;
                    break;
                case "TUKTUK":
                    dailyRate = 1800;
                    break;
                case "CAR":
                    dailyRate = 3000;
                    break;
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

        // Diving service pricing (per diver)
        const pricePerDiver = 3500;
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

    // Add event listeners for package selection radio buttons
    function attachPackageSelectionListeners() {
        const packageSelectionOptions = document.querySelectorAll(".package-selection-option");
        console.log('Found package selection options:', packageSelectionOptions.length);
        packageSelectionOptions.forEach(option => {
            option.addEventListener("change", () => {
                console.log('Package selection changed:', option.value);
                updatePackageSelectionPricing();
                // Force immediate total calculation
                setTimeout(() => {
                    calculateTotalAmount();
                }, 10);
                updateHotelsRowVisibility();
                clearStep2Error();
                clearTouristCountErrorIfNoTours();
                saveCurrentFormData(); // Save data when package selection changes
            });
        });
    }
    
    // Add event listeners for hotel selection radio buttons
    function attachHotelSelectionListeners() {
        const hotelSelectionOptions = document.querySelectorAll("input[name='hotel-selection']");
        console.log('Found hotel selection options:', hotelSelectionOptions.length);
        hotelSelectionOptions.forEach(option => {
            option.addEventListener("change", () => {
                console.log('Hotel selection changed:', option.value);
                updatePackageSelectionPricing();
                // Force immediate total calculation
                setTimeout(() => {
                    calculateTotalAmount();
                }, 10);
                saveCurrentFormData(); // Save data when hotel selection changes
            });
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
        let vanPlace = '';
        let vanTripType = '';
        let vanDays = '';
        
        if (destinationSelect === 'Within Puerto Galera') {
            vanPlace = document.getElementById('placeSelect')?.value || '';
            vanTripType = document.getElementById('withinTripTypeSelect')?.value || '';
            vanDays = document.getElementById('withinNumberOfDays')?.value || '';
        } else if (destinationSelect === 'Outside Puerto Galera') {
            vanPlace = document.getElementById('outsidePlaceSelect')?.value || '';
            vanTripType = document.getElementById('tripTypeSelect')?.value || '';
            vanDays = document.getElementById('outsideNumberOfDays')?.value || '';
        }
        
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
            numberOfDivers: document.getElementById('numberOfDiver').value,
            // Van rental data
            vanDestination: destinationSelect,
            vanPlace: vanPlace,
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
        let vanPlace = '';
        let vanTripType = '';
        let vanDays = '';
        
        if (destinationSelect === 'Within Puerto Galera') {
            vanPlace = document.getElementById('placeSelect')?.value || '';
            vanTripType = document.getElementById('withinTripTypeSelect')?.value || '';
            vanDays = document.getElementById('withinNumberOfDays')?.value || '';
        } else if (destinationSelect === 'Outside Puerto Galera') {
            vanPlace = document.getElementById('outsidePlaceSelect')?.value || '';
            vanTripType = document.getElementById('tripTypeSelect')?.value || '';
            vanDays = document.getElementById('outsideNumberOfDays')?.value || '';
        }
        
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
            numberOfDivers: document.getElementById('numberOfDiver').value,
            // Van rental data
            vanDestination: destinationSelect,
            vanPlace: vanPlace,
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
                    if (packageRadio) packageRadio.checked = true;
                }
                
                // Restore selected hotel
                if (tourSelections.selectedHotel) {
                    const hotelRadio = document.querySelector(`input[name="hotel-selection"][value="${tourSelections.selectedHotel}"]`);
                    if (hotelRadio) hotelRadio.checked = true;
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
                            if (tourSelections.vanDestination === 'Within Puerto Galera') {
                                if (tourSelections.vanPlace) {
                                    const placeSelect = document.getElementById('placeSelect');
                                    if (placeSelect) placeSelect.value = tourSelections.vanPlace;
                                }
                                if (tourSelections.vanTripType) {
                                    const withinTripTypeSelect = document.getElementById('withinTripTypeSelect');
                                    if (withinTripTypeSelect) withinTripTypeSelect.value = tourSelections.vanTripType;
                                }
                                if (tourSelections.vanDays) {
                                    const withinNumberOfDays = document.getElementById('withinNumberOfDays');
                                    if (withinNumberOfDays) withinNumberOfDays.value = tourSelections.vanDays;
                                }
                            } else if (tourSelections.vanDestination === 'Outside Puerto Galera') {
                                if (tourSelections.vanPlace) {
                                    const outsidePlaceSelect = document.getElementById('outsidePlaceSelect');
                                    if (outsidePlaceSelect) outsidePlaceSelect.value = tourSelections.vanPlace;
                                }
                                if (tourSelections.vanTripType) {
                                    const tripTypeSelect = document.getElementById('tripTypeSelect');
                                    if (tripTypeSelect) tripTypeSelect.value = tourSelections.vanTripType;
                                }
                                if (tourSelections.vanDays) {
                                    const outsideNumberOfDays = document.getElementById('outsideNumberOfDays');
                                    if (outsideNumberOfDays) outsideNumberOfDays.value = tourSelections.vanDays;
                                }
                            }
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
            const response = await fetch('http://localhost:3000/api/hotels');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.hotels) {
                hotelsData = data.hotels;
                console.log('✅ Hotels loaded successfully:', hotelsData.length, 'hotels');
                generateHotelOptions();
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
            return hotelsData;
        }
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
        
        // Generate hotel options
        hotelsData.forEach((hotel, index) => {
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
        let vanPlace = '';
        let vanTripType = '';
        let vanDays = '';
        
        if (destinationSelect === 'Within Puerto Galera') {
            vanPlace = document.getElementById('placeSelect')?.value || '';
            vanTripType = document.getElementById('withinTripTypeSelect')?.value || '';
            vanDays = document.getElementById('withinNumberOfDays')?.value || '';
        } else if (destinationSelect === 'Outside Puerto Galera') {
            vanPlace = document.getElementById('outsidePlaceSelect')?.value || '';
            vanTripType = document.getElementById('tripTypeSelect')?.value || '';
            vanDays = document.getElementById('outsideNumberOfDays')?.value || '';
        }
        
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
            numberOfDivers: document.getElementById('numberOfDiver').value,
            // Van rental data
            vanDestination: destinationSelect,
            vanPlace: vanPlace,
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
    const withinTripTypeContainer = document.getElementById('withinTripTypeContainer');
    const withinDaysContainer = document.getElementById('withinDaysContainer');
    const outsidePlaceContainer = document.getElementById('outsidePlaceContainer');
    const tripTypeContainer = document.getElementById('tripTypeContainer');
    const outsideDaysContainer = document.getElementById('outsideDaysContainer');
    const vanTotalAmountContainer = document.getElementById('vanTotalAmountContainer');
    const placeSelect = document.getElementById('placeSelect');
    const withinTripTypeSelect = document.getElementById('withinTripTypeSelect');
    const withinNumberOfDays = document.getElementById('withinNumberOfDays');
    const outsidePlaceSelect = document.getElementById('outsidePlaceSelect');
    const tripTypeSelect = document.getElementById('tripTypeSelect');
    const outsideNumberOfDays = document.getElementById('outsideNumberOfDays');
    const vanAmountInput = document.getElementById('vanTotalAmount');

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

    if (destinationSelect) {
        destinationSelect.addEventListener('change', function() {
            const selectedDestination = this.value;
            
            // Hide all dynamic containers
            placeSelectionContainer.style.display = 'none';
            withinTripTypeContainer.style.display = 'none';
            withinDaysContainer.style.display = 'none';
            outsidePlaceContainer.style.display = 'none';
            tripTypeContainer.style.display = 'none';
            outsideDaysContainer.style.display = 'none';
            vanTotalAmountContainer.style.display = 'none';
            
            // Reset selections
            if (placeSelect) placeSelect.value = '';
            if (withinTripTypeSelect) withinTripTypeSelect.value = '';
            if (withinNumberOfDays) withinNumberOfDays.value = '';
            if (outsidePlaceSelect) outsidePlaceSelect.value = '';
            if (tripTypeSelect) tripTypeSelect.value = '';
            if (outsideNumberOfDays) outsideNumberOfDays.value = '';
            if (vanAmountInput) vanAmountInput.value = '';
            
            // Show appropriate container based on selection
            if (selectedDestination === 'Within Puerto Galera') {
                placeSelectionContainer.style.display = 'block';
                withinTripTypeContainer.style.display = 'block';
                withinDaysContainer.style.display = 'block';
                vanTotalAmountContainer.style.display = 'block';
            } else if (selectedDestination === 'Outside Puerto Galera') {
                outsidePlaceContainer.style.display = 'block';
                tripTypeContainer.style.display = 'block';
                outsideDaysContainer.style.display = 'block';
                vanTotalAmountContainer.style.display = 'block';
            }
            
            // Save data when destination changes
            saveCurrentFormData();
        });
    }

    // Handle Within PG place, trip type, and days selection
    if (placeSelect && withinTripTypeSelect && withinNumberOfDays) {
        function updateWithinPrice() {
            const selectedPlace = placeSelect.options[placeSelect.selectedIndex];
            const tripType = withinTripTypeSelect.value;
            const days = parseInt(withinNumberOfDays.value) || 0;
            
            if (!selectedPlace || !tripType || !days || !vanAmountInput) {
                if (vanAmountInput) vanAmountInput.value = '';
                return;
            }
            
            let basePrice = 0;
            if (tripType === 'oneway') {
                basePrice = selectedPlace.getAttribute('data-oneway');
            } else if (tripType === 'roundtrip') {
                basePrice = selectedPlace.getAttribute('data-roundtrip');
            }
            
            if (basePrice) {
                const totalPrice = parseInt(basePrice) * days;
                vanAmountInput.value = `₱${totalPrice.toLocaleString()}.00`;
            } else {
                vanAmountInput.value = '';
            }
            
            calculateTotalAmount();
        }
        
        placeSelect.addEventListener('change', () => { updateWithinPrice(); saveCurrentFormData(); });
        withinTripTypeSelect.addEventListener('change', () => { updateWithinPrice(); saveCurrentFormData(); });
        withinNumberOfDays.addEventListener('change', () => { updateWithinPrice(); saveCurrentFormData(); });
    }

    // Handle Outside PG place, trip type, and days selection
    if (outsidePlaceSelect && tripTypeSelect && outsideNumberOfDays) {
        function updateOutsidePrice() {
            const selectedPlace = outsidePlaceSelect.options[outsidePlaceSelect.selectedIndex];
            const tripType = tripTypeSelect.value;
            const days = parseInt(outsideNumberOfDays.value) || 0;
            
            if (!selectedPlace || !tripType || !days || !vanAmountInput) {
                if (vanAmountInput) vanAmountInput.value = '';
                return;
            }
            
            let basePrice = 0;
            if (tripType === 'oneway') {
                basePrice = selectedPlace.getAttribute('data-oneway');
            } else if (tripType === 'roundtrip') {
                basePrice = selectedPlace.getAttribute('data-roundtrip');
            }
            
            if (basePrice) {
                const totalPrice = parseInt(basePrice) * days;
                vanAmountInput.value = `₱${totalPrice.toLocaleString()}.00`;
            } else {
                vanAmountInput.value = '';
            }
            
            calculateTotalAmount();
        }
        
        outsidePlaceSelect.addEventListener('change', () => { updateOutsidePrice(); saveCurrentFormData(); });
        tripTypeSelect.addEventListener('change', () => { updateOutsidePrice(); saveCurrentFormData(); });
        outsideNumberOfDays.addEventListener('change', () => { updateOutsidePrice(); saveCurrentFormData(); });
    }

    // Initialize vehicles data when page loads
    fetchVehicles().then(() => {
        console.log("Vehicles loaded successfully!");
    });

    console.log("Tour booking form initialized successfully!");
})();
