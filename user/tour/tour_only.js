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
        const vanRentalAmountText = document.getElementById('amountOfVanRental')?.value;
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
        const tourSelections = {
            touristCount: document.getElementById('touristCount').value,
            islandTours: Array.from(document.querySelectorAll('.island-option:checked')).map(option => option.value),
            inlandTours: Array.from(document.querySelectorAll('.inland-option:checked')).map(option => option.value),
            snorkelTours: Array.from(document.querySelectorAll('.snorkel-option:checked')).map(option => option.value),
            rentalVehicles: Array.from(document.querySelectorAll('.rental-option:checked')).map(option => option.value),
            rentalDays: document.getElementById('rentalDays').value,
            diving: document.querySelector('.diving-option:checked') ? true : false,
            numberOfDivers: document.getElementById('numberOfDiver').value,
            selectedHotel: document.querySelector('.hotels-option:checked')?.value || '',
            packageAmount: document.getElementById('amountOfPackage').value,
            vehicleAmount: document.getElementById('amountOfVehicle').value,
            vanRentalAmount: document.getElementById('amountOfVanRental')?.value || '',
            divingAmount: document.getElementById('amountOfDiving').value,
            totalAmount: document.getElementById('totalAmount').value
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
    const vanAmountInput = document.getElementById('amountOfVanRental');

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
        
        placeSelect.addEventListener('change', updateWithinPrice);
        withinTripTypeSelect.addEventListener('change', updateWithinPrice);
        withinNumberOfDays.addEventListener('change', updateWithinPrice);
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
        
        outsidePlaceSelect.addEventListener('change', updateOutsidePrice);
        tripTypeSelect.addEventListener('change', updateOutsidePrice);
        outsideNumberOfDays.addEventListener('change', updateOutsidePrice);
    }

    console.log("Tour booking form initialized successfully!");
})();
