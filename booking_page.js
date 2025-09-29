// booking_page.js
(() => {
    // ----------------------------
    // STEP HANDLER (4-step wizard)
    // ----------------------------
    let currentStep = 1;
    const totalSteps = 4;
  
    function showStep(step) {
      document.querySelectorAll(".form-step").forEach((el, index) => {
        el.classList.toggle("active", index === step - 1);
      });
    }
  
    // Expose for buttons in HTML
    window.nextStep = function () {
      // Block advancing from Step 1 unless valid
      if (currentStep === 1) {
        const ok = validateStep1();
        if (!ok) {
          const firstInvalid = document.querySelector(
            "#form-step-1 .form-control.is-invalid"
          );
          if (firstInvalid) firstInvalid.focus();
          return; // stay on step 1
        }
      }
      
      // Block advancing from Step 2 unless valid
      if (currentStep === 2) {
        const ok = validateStep2();
        if (!ok) {
          return; // stay on step 2
        }
        // Clear any existing step 2 errors when validation passes
        hideStep2Error();
      }
      
      if (currentStep < totalSteps) {
        currentStep++;
        
        // When moving to step 3, always populate the summary with current selections
        if (currentStep === 3) {
          populateBookingSummary();
        }
        
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  
    window.previousStep = function () {
      if (currentStep > 1) {
        // Clear step 2 errors when navigating away from step 2
        if (currentStep === 2) {
          hideStep2Error();
        }
        
        currentStep--;
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  
    showStep(currentStep);
  
    // Function to populate booking summary
    function populateBookingSummary() {
      // Personal Information
      const firstName = document.getElementById("firstName")?.value || "";
      const lastName = document.getElementById("lastName")?.value || "";
      const email = document.getElementById("emailAddress")?.value || "";
      const contact = document.getElementById("contactNo")?.value || "";
      const arrival = document.getElementById("arrivalDate")?.value || "";
      const departure = document.getElementById("departureDate")?.value || "";
      const tourists = document.getElementById("touristCount")?.value || "";

      document.getElementById("summary-name").textContent = `${firstName} ${lastName}`.trim() || "-";
      document.getElementById("summary-email").textContent = email || "-";
      document.getElementById("summary-contact").textContent = contact || "-";
      document.getElementById("summary-arrival").textContent = arrival || "-";
      document.getElementById("summary-departure").textContent = departure || "-";
      document.getElementById("summary-tourists").textContent = tourists || "-";

      // Island Tours
      const islandTours = document.querySelectorAll(".island-option:checked");
      const islandList = document.getElementById("summary-island-tours");
      if (islandTours.length > 0) {
        islandList.innerHTML = "";
        islandTours.forEach(tour => {
          const li = document.createElement("li");
          li.innerHTML = `<i class="fas fa-check text-success me-2"></i>${tour.value}`;
          islandList.appendChild(li);
        });
      } else {
        islandList.innerHTML = '<li class="text-muted">No island tours selected</li>';
      }

      // Inland Tours
      const inlandTours = document.querySelectorAll(".inland-option:checked");
      const inlandList = document.getElementById("summary-inland-tours");
      if (inlandTours.length > 0) {
        inlandList.innerHTML = "";
        inlandTours.forEach(tour => {
          const li = document.createElement("li");
          li.innerHTML = `<i class="fas fa-check text-success me-2"></i>${tour.value}`;
          inlandList.appendChild(li);
        });
      } else {
        inlandList.innerHTML = '<li class="text-muted">No inland tours selected</li>';
      }

      // Snorkeling Tours
      const snorkelTours = document.querySelectorAll(".snorkel-option:checked");
      const snorkelList = document.getElementById("summary-snorkel-tours");
      if (snorkelTours.length > 0) {
        snorkelList.innerHTML = "";
        snorkelTours.forEach(tour => {
          const li = document.createElement("li");
          li.innerHTML = `<i class="fas fa-check text-success me-2"></i>${tour.value}`;
          snorkelList.appendChild(li);
        });
      } else {
        snorkelList.innerHTML = '<li class="text-muted">No snorkeling tours selected</li>';
      }

      // Package Amount
      const packageAmount = document.getElementById("amountOfPackage")?.value || "₱0.00";
      document.getElementById("summary-package-amount").textContent = packageAmount;

      // Hotel Information
      const selectedHotel = document.querySelector(".hotels-option:checked");
      const hotelDays = document.getElementById("days")?.value || "";
      const hotelPrice = document.getElementById("hotelPrice")?.value || "";
      const accommodationSection = document.getElementById("accommodation-section");

      if (selectedHotel) {
        document.getElementById("summary-hotel").textContent = selectedHotel.value;
        document.getElementById("summary-hotel-days").textContent = hotelDays || "-";
        document.getElementById("summary-hotel-amount").textContent = hotelPrice || "₱0.00";
        accommodationSection.style.display = "block";
      } else {
        accommodationSection.style.display = "none";
      }

      // Vehicle Rental Information
      const selectedVehicles = document.querySelectorAll(".rental-option:checked");
      const rentalDays = document.getElementById("rentalDays")?.value || "";
      const vehicleAmount = document.getElementById("amountOfVehicle")?.value || "";
      const vehicleSection = document.getElementById("vehicle-section");

      if (selectedVehicles.length > 0) {
        const vehicleNames = Array.from(selectedVehicles).map(v => v.value).join(", ");
        document.getElementById("summary-vehicle").textContent = vehicleNames;
        document.getElementById("summary-vehicle-days").textContent = rentalDays ? `${rentalDays} day(s)` : "-";
        document.getElementById("summary-vehicle-amount").textContent = vehicleAmount || "₱0.00";
        vehicleSection.style.display = "block";
      } else {
        vehicleSection.style.display = "none";
      }

      // Diving Information
      const divingSelected = document.querySelector(".diving-option:checked");
      const numberOfDivers = document.getElementById("numberOfDiver")?.value || "";
      const divingAmount = document.getElementById("amountOfDiving")?.value || "";
      const divingSection = document.getElementById("diving-section");

      if (divingSelected && numberOfDivers) {
        document.getElementById("summary-divers").textContent = numberOfDivers;
        document.getElementById("summary-diving-amount").textContent = divingAmount || "₱0.00";
        divingSection.style.display = "block";
      } else {
        divingSection.style.display = "none";
      }

      // Total Amount
      const totalAmount = document.getElementById("totalAmount")?.value || "₱0.00";
      document.getElementById("summary-total-amount").textContent = totalAmount;
    }

    // VALIDATION UTILITIES PAGE 1

    const FIELD_LABELS = {
      firstName: "First Name",
      lastName: "Last Name",
      emailAddress: "Email Address",
      contactNo: "Contact Number",
      arrivalDate: "Arrival Date",
      departureDate: "Departure Date",
      touristCount: "Number of Tourists",
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
  
    function isValidEmail(email) {
      // Basic and reliable for UI validation
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    }
  
    // STEP 1 VALIDATION
    function validateStep1() {
      let valid = true;
  
      const firstName = document.getElementById("firstName");
      const lastName = document.getElementById("lastName");
      const emailAddress = document.getElementById("emailAddress");
      const contactNo = document.getElementById("contactNo");
      const arrivalDate = document.getElementById("arrivalDate");
      const departureDate = document.getElementById("departureDate");
      const touristCount = document.getElementById("touristCount");
  
      // Clear previous errors
      [firstName, lastName, emailAddress, contactNo, arrivalDate, departureDate, touristCount].forEach(
        (el) => setError(el, "")
      );
  
      // Required: names
      if (!firstName.value.trim()) {
        setError(firstName, `${FIELD_LABELS.firstName} is required.`);
        valid = false;
      }
      if (!lastName.value.trim()) {
        setError(lastName, `${FIELD_LABELS.lastName} is required.`);
        valid = false;
      }
  
      // Email
      if (!emailAddress.value.trim()) {
        setError(emailAddress, `${FIELD_LABELS.emailAddress} is required.`);
        valid = false;
      } else if (!isValidEmail(emailAddress.value.trim())) {
        setError(emailAddress, `Please enter a valid email address (e.g., name@example.com).`);
        valid = false;
      }
  
      // Contact: numeric only & exactly 11 digits
      const digits = contactNo.value.replace(/\D/g, "");
      if (!digits) {
        setError(contactNo, `${FIELD_LABELS.contactNo} is required.`);
        valid = false;
      } else if (digits.length !== 11) {
        setError(contactNo, `Contact number must be exactly 11 digits.`);
        valid = false;
      }
  
      // Dates (required)
      if (!arrivalDate.value) {
        setError(arrivalDate, `${FIELD_LABELS.arrivalDate} is required.`);
        valid = false;
      }
      if (!departureDate.value) {
        setError(departureDate, `${FIELD_LABELS.departureDate} is required.`);
        valid = false;
      }
  
      // Dates (logic): require at least 1 night (departure > arrival)
      if (arrivalDate.value && departureDate.value) {
        const a = new Date(arrivalDate.value);
        const d = new Date(departureDate.value);
        if (d <= a) {
          setError(departureDate, "Departure must be at least the day after Arrival.");
          valid = false;
        }
      }

      // Check if any tour packages are selected (Island, Inland, or Snorkeling)
      const islandTours = document.querySelectorAll(".island-option:checked");
      const inlandTours = document.querySelectorAll(".inland-option:checked");
      const snorkelTours = document.querySelectorAll(".snorkel-option:checked");
      const anyTourPackageSelected = islandTours.length > 0 || inlandTours.length > 0 || snorkelTours.length > 0;
      
      // If tour packages are selected, number of tourists is required
      if (anyTourPackageSelected) {
        const touristValue = touristCount.value.trim();
        if (!touristValue) {
          setError(touristCount, "Number of tourists is required when tour packages are selected.");
          valid = false;
        } else if (parseInt(touristValue) <= 0) {
          setError(touristCount, "Number of tourists must be at least 1.");
          valid = false;
        }
      }
  
      return valid;
    }

    // STEP 2 VALIDATION
    function validateStep2() {
      let valid = true;
      let errorMessages = [];
      
      // Clear any existing field errors
      clearTouristCountError();
      clearRentalDaysError();
      clearNumberOfDiversError();
      
      // Check if at least one tour package is selected (Island, Inland, or Snorkeling)
      const islandTours = document.querySelectorAll(".island-option:checked");
      const inlandTours = document.querySelectorAll(".inland-option:checked");
      const snorkelTours = document.querySelectorAll(".snorkel-option:checked");
      const tourPackageSelected = islandTours.length > 0 || inlandTours.length > 0 || snorkelTours.length > 0;
      
      // Check if rental vehicle is selected
      const rentalVehicles = document.querySelectorAll(".rental-option:checked");
      const rentalSelected = rentalVehicles.length > 0;
      
      // Check if diving is selected
      const divingOptions = document.querySelectorAll(".diving-option:checked");
      const divingSelected = divingOptions.length > 0;
      
      // User must select at least one of: Tour Package, Rental Vehicle, or Diving
      if (!tourPackageSelected && !rentalSelected && !divingSelected) {
        errorMessages.push("Please select at least one option from Tour Packages, Rental Vehicle, or Diving to proceed.");
        valid = false;
      }
      
      // If tour packages are selected, validate tourist count
      if (tourPackageSelected) {
        const touristCountInput = document.getElementById("touristCount");
        const touristCount = parseInt(touristCountInput.value) || 0;
        
        if (touristCount <= 0) {
          // Only show field-specific error for Number of Tourist, not the general error at top
          showTouristCountError("Number of Tourist is required when tour packages are selected.");
          valid = false;
          // Don't add to errorMessages array to prevent top error from showing
        }
      }
      
      // If rental vehicle is selected, validate rental days
      if (rentalSelected) {
        const rentalDaysSelect = document.getElementById("rentalDays");
        const selectedDays = rentalDaysSelect.value;
        
        if (!selectedDays) {
          // Only show field-specific error for Rental Days, not the general error at top
          showRentalDaysError("Rental days must be selected when vehicle is chosen.");
          valid = false;
          // Don't add to errorMessages array to prevent top error from showing
        }
      }
      
      // If diving is selected, validate number of divers
      if (divingSelected) {
        const numberOfDiversInput = document.getElementById("numberOfDiver");
        const numberOfDivers = parseInt(numberOfDiversInput.value) || 0;
        
        if (numberOfDivers <= 0) {
          // Only show field-specific error for Number of Divers, not the general error at top
          showNumberOfDiversError("Number of divers is required when diving is selected.");
          valid = false;
          // Don't add to errorMessages array to prevent top error from showing
        }
      }
      
      // Only show the general error at top if there are other errors (not field-specific errors)
      if (errorMessages.length > 0) {
        const errorMessage = errorMessages.join(" ");
        showStep2Error(errorMessage);
      } else {
        // Clear any existing general error
        hideStep2Error();
      }
      
      return valid;
    }
    
    // Function to show tourist count field error
    function showTouristCountError(message) {
      const touristCountInput = document.getElementById("touristCount");
      
      if (touristCountInput) {
        // Use the same setError function as step 1 validation
        setError(touristCountInput, message);
      }
    }
    
    // Function to clear tourist count field error
    function clearTouristCountError() {
      const touristCountInput = document.getElementById("touristCount");
      
      if (touristCountInput) {
        // Use the same setError function as step 1 validation (empty message clears error)
        setError(touristCountInput, "");
      }
    }

    // Function to show rental days field error
    function showRentalDaysError(message) {
      const rentalDaysInput = document.getElementById("rentalDays");
      
      if (rentalDaysInput) {
        // Use the same setError function as step 1 validation
        setError(rentalDaysInput, message);
      }
    }
    
    // Function to clear rental days field error
    function clearRentalDaysError() {
      const rentalDaysInput = document.getElementById("rentalDays");
      
      if (rentalDaysInput) {
        // Use the same setError function as step 1 validation (empty message clears error)
        setError(rentalDaysInput, "");
      }
    }

    // Function to show number of divers field error
    function showNumberOfDiversError(message) {
      const numberOfDiversInput = document.getElementById("numberOfDiver");
      
      if (numberOfDiversInput) {
        // Use the same setError function as step 1 validation
        setError(numberOfDiversInput, message);
      }
    }
    
    // Function to clear number of divers field error
    function clearNumberOfDiversError() {
      const numberOfDiversInput = document.getElementById("numberOfDiver");
      
      if (numberOfDiversInput) {
        // Use the same setError function as step 1 validation (empty message clears error)
        setError(numberOfDiversInput, "");
      }
    }
    
    // Function to show step 2 error message
    function showStep2Error(message) {
      // Remove existing error if any
      hideStep2Error();
      
      // Create error element
      const errorDiv = document.createElement('div');
      errorDiv.id = 'step2-error';
      errorDiv.className = 'alert alert-danger mt-3';
      errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
      
      // Find the form step 2 container and add error before the navigation buttons
      const step2 = document.getElementById('form-step-2');
      const buttonRow = step2.querySelector('.row:last-child');
      buttonRow.parentNode.insertBefore(errorDiv, buttonRow);
      
      // Scroll to error
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Function to hide step 2 error message
    function hideStep2Error() {
      const existingError = document.getElementById('step2-error');
      if (existingError) {
        existingError.remove();
      }
      // Don't clear tourist count field error here - it should be cleared separately
    }
  
    (function enforceContactInput() {
      const contactNo = document.getElementById("contactNo");
      if (!contactNo) return;
  
      // Keep digits only and cap at 11 while typing/pasting
      contactNo.addEventListener("input", () => {
        let digits = contactNo.value.replace(/\D/g, "");
        if (digits.length > 11) digits = digits.slice(0, 11);
        contactNo.value = digits;
        if (digits.length <= 11) setError(contactNo, "");
      });
  
      // Block non-digits at keypress level
      contactNo.addEventListener("keypress", (e) => {
        const char = String.fromCharCode(e.which);
        if (!/[0-9]/.test(char)) e.preventDefault();
      });
    })();
  
    (function dateGuards() {
      const arrival = document.getElementById("arrivalDate");
      const departure = document.getElementById("departureDate");
      if (!arrival || !departure) return;
  
      const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
      };
  
      const today = new Date();
      const todayStr = fmt(today);
  
      // Arrival cannot be in the past
      arrival.min = todayStr;
  
      function syncDepartureMin() {
        // Base = arrival if chosen, otherwise today
        let base = arrival.value ? new Date(arrival.value) : new Date(today);
        // Require at least 1 night
        const minDep = new Date(base);
        minDep.setDate(minDep.getDate() + 1);
        const minDepStr = fmt(minDep);
  
        departure.min = minDepStr;
  
        // Clear invalid departure if needed
        if (departure.value && departure.value < minDepStr) {
          departure.value = "";
        }
      }
  
      arrival.addEventListener("change", syncDepartureMin);
      // Initialize on load
      syncDepartureMin();
    })();
  })();
  

  // For island, inland, and snorkeling dropdown groups

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
      if (typeof updateHotelsRowVisibility === "function") {
        updateHotelsRowVisibility();
      }
      // Update package price when selections change
      updatePackagePrice();
      // Update rental vehicle price if this is rental section
      if (selectAllId === "rental-select-all" && typeof calculateRentalVehiclePrice === "function") {
        calculateRentalVehiclePrice();
      }
    });

    optionCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        updateSelectAllState();
        updateSelectionMessage();
        if (typeof updateHotelsRowVisibility === "function") {
          updateHotelsRowVisibility();
        }
        // Update package price when selections change
        updatePackagePrice();
        // Update rental vehicle price if this is rental section
        if (cb.classList.contains("rental-option") && typeof calculateRentalVehiclePrice === "function") {
          calculateRentalVehiclePrice();
        }
      });
    });

    updateSelectAllState();
    updateSelectionMessage();
    if (typeof updateHotelsRowVisibility === "function") {
      updateHotelsRowVisibility();
    }
  }

  // Island tour
  wireMultiSelect("island-select-all", "island-options", "island-option", null);
  // Inland tour
  wireMultiSelect("inland-select-all", "inland-options", "inland-option", null);
  // Snorkeling tour
  wireMultiSelect("snorkel-select-all", "snorkel-options", "snorkel-option", null);
  // Rental vehicle
  wireMultiSelect("rental-select-all", "rental-options", "rental-option", null);
  
  // Add event listeners for rental vehicle pricing
  document.querySelectorAll(".rental-option").forEach(option => {
    option.addEventListener("change", function() {
      calculateRentalVehiclePrice();
      
      // Clear rental days error if no vehicles are selected
      const rentalVehicles = document.querySelectorAll(".rental-option:checked");
      const rentalSelected = rentalVehicles.length > 0;
      
      if (!rentalSelected) {
        clearRentalDaysError();
      }
    });
  });
  
  // Add explicit event listeners for tour package pricing
  document.querySelectorAll(".island-option, .inland-option, .snorkel-option").forEach(option => {
    option.addEventListener("change", function() {
      updatePackagePrice();
      
      // Clear tourist count error if no tours are selected
      const islandTours = document.querySelectorAll(".island-option:checked");
      const inlandTours = document.querySelectorAll(".inland-option:checked");
      const snorkelTours = document.querySelectorAll(".snorkel-option:checked");
      const tourPackageSelected = islandTours.length > 0 || inlandTours.length > 0 || snorkelTours.length > 0;
      
      if (!tourPackageSelected) {
        clearTouristCountError();
      }
    });
  });
  
  // Add event listener for rental days dropdown
  const rentalDaysSelect = document.getElementById("rentalDays");
  if (rentalDaysSelect) {
    rentalDaysSelect.addEventListener("change", function() {
      calculateRentalVehiclePrice();
      
      // Clear rental days error if user selects a valid option and vehicles are selected
      const rentalVehicles = document.querySelectorAll(".rental-option:checked");
      const rentalSelected = rentalVehicles.length > 0;
      
      if (rentalSelected && rentalDaysSelect.value) {
        clearRentalDaysError();
      }
    });
  }
  
  // Add event listeners for diving functionality
  const numberOfDiverInput = document.getElementById("numberOfDiver");
  if (numberOfDiverInput) {
    // Only allow numbers and trigger price calculation
    numberOfDiverInput.addEventListener("input", () => {
      // Keep only digits
      let value = numberOfDiverInput.value.replace(/\D/g, "");
      numberOfDiverInput.value = value;
      calculateDivingPrice();
      
      // Clear number of divers error if user provides a valid number and diving is selected
      const numberOfDivers = parseInt(numberOfDiverInput.value) || 0;
      const divingOptions = document.querySelectorAll(".diving-option:checked");
      const divingSelected = divingOptions.length > 0;
      
      if (divingSelected && numberOfDivers > 0) {
        clearNumberOfDiversError();
      }
    });
    
    // Block non-digit characters at keypress level
    numberOfDiverInput.addEventListener("keypress", (e) => {
      const char = String.fromCharCode(e.which);
      if (!/[0-9]/.test(char)) e.preventDefault();
    });
    
    // Validate on blur
    numberOfDiverInput.addEventListener("blur", () => {
      const value = parseInt(numberOfDiverInput.value) || 0;
      if (value < 0) {
        numberOfDiverInput.value = "";
      }
      calculateDivingPrice();
    });
  }
  // Hotels - Single selection (radio buttons), no wireMultiSelect needed
  
  // Add event listeners to clear step 2 validation errors when selections are made
  function addStep2ValidationClearListeners() {
    // Clear error when any tour package option is selected
    document.querySelectorAll(".island-option, .inland-option, .snorkel-option").forEach(option => {
      option.addEventListener("change", () => {
        hideStep2Error();
      });
    });
    
    // Clear error when rental vehicle option is selected
    document.querySelectorAll(".rental-option").forEach(option => {
      option.addEventListener("change", () => {
        hideStep2Error();
      });
    });
    
    // Clear error when diving option is selected
    document.querySelectorAll(".diving-option").forEach(option => {
      option.addEventListener("change", () => {
        hideStep2Error();
        
        // Clear number of divers error if no diving is selected
        const divingOptions = document.querySelectorAll(".diving-option:checked");
        const divingSelected = divingOptions.length > 0;
        
        if (!divingSelected) {
          clearNumberOfDiversError();
        }
      });
    });
  }
  
  // Initialize the validation clear listeners
  addStep2ValidationClearListeners();
  
  // Add days visibility control to hotel options
  const hotelOptions = document.querySelectorAll(".hotels-option");
  hotelOptions.forEach(option => {
    option.addEventListener("change", updateDaysVisibility);
  });
  
  // Initialize days visibility
  updateDaysVisibility();
  // Pre diving (single option, no select-all)
  (function wireDivingSingleOption() {
    const hotelsRow = document.getElementById("hotelsRow");
    const divingOption = document.querySelector("#diving-options .diving-option");
    if (!divingOption) return;
    const refresh = () => {
      updateHotelsRowVisibility();
      updatePackagePrice();
      calculateDivingPrice();
    };
    divingOption.addEventListener("change", refresh);
  })();

// Control Hotels row visibility based on selected tour options only
function updateHotelsRowVisibility() {
  const hotelsRow = document.getElementById("hotelsRow");
  if (!hotelsRow) return;
  const anyChecked = document.querySelectorAll(
    ".island-option:checked, .inland-option:checked, .snorkel-option:checked, .diving-option:checked"
  ).length > 0;
  if (anyChecked) {
    hotelsRow.classList.add("is-visible");
  } else {
    hotelsRow.classList.remove("is-visible");
  }
}

[".island-option", ".inland-option", ".snorkel-option", ".diving-option"].forEach((selector) => {
  document.querySelectorAll(selector).forEach((cb) => {
    cb.addEventListener("change", updateHotelsRowVisibility);
  });
});

// Function to control days input visibility
function updateDaysVisibility() {
  const daysGroup = document.getElementById("daysGroup");
  const anyHotelSelected = document.querySelectorAll(".hotels-option:checked").length > 0;
  
  if (daysGroup) {
    daysGroup.style.display = anyHotelSelected ? "block" : "none";
    if (!anyHotelSelected) {
      const daysInput = document.getElementById("days");
      if (daysInput) daysInput.value = "";
    } else {
      calculateDuration(); // Update days when showing
    }
  }
}

// Wire up hotel options for days visibility
document.querySelectorAll(".hotels-option").forEach(option => {
  option.addEventListener("change", () => {
    updateDaysVisibility();
    calculateHotelPrice();
  });
});

// Initialize visibility states
updateHotelsRowVisibility();
updateDaysVisibility();

// PRICING LOGIC

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

// RENTAL VEHICLE PRICING
function calculateRentalVehiclePrice() {
  const rentalDaysSelect = document.getElementById("rentalDays");
  const amountOfVehicleInput = document.getElementById("amountOfVehicle");
  
  if (!rentalDaysSelect || !amountOfVehicleInput) return 0;
  
  const selectedDays = parseInt(rentalDaysSelect.value) || 0;
  if (selectedDays <= 0) {
    amountOfVehicleInput.value = "";
    calculateTotalAmount();
    return 0;
  }

  // Get selected rental vehicles
  const selectedVehicles = document.querySelectorAll(".rental-option:checked");
  if (selectedVehicles.length === 0) {
    amountOfVehicleInput.value = "";
    calculateTotalAmount();
    return 0;
  }

  // Vehicle pricing per day
  const vehiclePrices = {
    "ADV": 1000,
    "NMAX": 1000,
    "VERSYS 650": 4000,
    "VERSYS 1000": 4500,
    "TUKTUK": 1500,
    "CAR": 3500
  };

  let totalPrice = 0;
  selectedVehicles.forEach(vehicle => {
    const vehicleType = vehicle.value;
    const pricePerDay = vehiclePrices[vehicleType] || 0;
    totalPrice += pricePerDay * selectedDays;
  });

  // Format and display vehicle price
  if (totalPrice > 0) {
    amountOfVehicleInput.value = `₱${totalPrice.toLocaleString()}.00`;
  } else {
    amountOfVehicleInput.value = "";
  }

  // Update total amount whenever vehicle price changes
  calculateTotalAmount();
  
  return totalPrice;
}

// DIVING PRICING
function calculateDivingPrice() {
  const numberOfDiverInput = document.getElementById("numberOfDiver");
  const amountOfDivingInput = document.getElementById("amountOfDiving");
  
  if (!numberOfDiverInput || !amountOfDivingInput) return 0;
  
  const numberOfDivers = parseInt(numberOfDiverInput.value) || 0;
  
  // Check if diving option is selected
  const divingOptionSelected = document.querySelector(".diving-option:checked");
  if (!divingOptionSelected || numberOfDivers <= 0) {
    amountOfDivingInput.value = "";
    calculateTotalAmount();
    return 0;
  }

  // Diving price per diver
  const pricePerDiver = 3500;
  const totalPrice = pricePerDiver * numberOfDivers;

  // Format and display diving price
  amountOfDivingInput.value = `₱${totalPrice.toLocaleString()}.00`;
  
  // Update total amount whenever diving price changes
  calculateTotalAmount();
  
  return totalPrice;
}

// TOTAL AMOUNT CALCULATION
function calculateTotalAmount() {
  const totalAmountInput = document.getElementById("totalAmount");
  if (!totalAmountInput) return;

  let total = 0;

  // Get package amount (tours)
  const packageAmountInput = document.getElementById("amountOfPackage");
  if (packageAmountInput && packageAmountInput.value) {
    const packageAmount = parseFloat(packageAmountInput.value.replace(/[₱,]/g, "")) || 0;
    total += packageAmount;
  }

  // Get hotel price
  const hotelPriceInput = document.getElementById("hotelPrice");
  if (hotelPriceInput && hotelPriceInput.value) {
    const hotelAmount = parseFloat(hotelPriceInput.value.replace(/[₱,]/g, "")) || 0;
    total += hotelAmount;
  }

  // Get vehicle rental amount
  const vehicleAmountInput = document.getElementById("amountOfVehicle");
  if (vehicleAmountInput && vehicleAmountInput.value) {
    const vehicleAmount = parseFloat(vehicleAmountInput.value.replace(/[₱,]/g, "")) || 0;
    total += vehicleAmount;
  }

  // Get diving service amount
  const divingAmountInput = document.getElementById("amountOfDiving");
  if (divingAmountInput && divingAmountInput.value) {
    const divingAmount = parseFloat(divingAmountInput.value.replace(/[₱,]/g, "")) || 0;
    total += divingAmount;
  }

  // Format and display total amount
  if (total > 0) {
    totalAmountInput.value = `₱${total.toLocaleString()}.00`;
  } else {
    totalAmountInput.value = "";
  }
}

// Main function to update package price
function calculateHotelPrice() {
  const days = calculateDuration();
  const touristCount = parseInt(document.getElementById("touristCount")?.value) || 0;
  const hotelPriceInput = document.getElementById("hotelPrice");
  
  if (!days || !touristCount || !hotelPriceInput) {
    if (hotelPriceInput) hotelPriceInput.value = "";
    calculateTotalAmount();
    return 0;
  }

  const selectedHotel = document.querySelector(".hotels-option:checked");
  if (!selectedHotel) {
    hotelPriceInput.value = "";
    calculateTotalAmount();
    return 0;
  }

  // Hotel price will be set later
  hotelPriceInput.value = "";
  calculateTotalAmount();
  return 0;
}

function updatePackagePrice() {
  console.log("updatePackagePrice called");
  const touristCountInput = document.getElementById("touristCount");
  const amountOfPackageInput = document.getElementById("amountOfPackage");
  const hotelPriceInput = document.getElementById("hotelPrice");
  
  if (!touristCountInput || !amountOfPackageInput) {
    console.log("Missing required elements:", { touristCountInput, amountOfPackageInput });
    return;
  }
  
  const touristCount = parseInt(touristCountInput.value) || 0;
  console.log("Tourist count:", touristCount);
  
  // Check if any island tour option is selected
  const islandOptionsChecked = document.querySelectorAll(".island-option:checked").length > 0;
  const inlandOptionsChecked = document.querySelectorAll(".inland-option:checked").length > 0;
  const snorkelOptionsChecked = document.querySelectorAll(".snorkel-option:checked").length > 0;
  
  const anyTourSelected = islandOptionsChecked || inlandOptionsChecked || snorkelOptionsChecked;
  
  console.log("Tour options selected:", { island: islandOptionsChecked, inland: inlandOptionsChecked, snorkel: snorkelOptionsChecked });
  
  let totalPackagePrice = 0;
  
  // Only calculate and show package price if both tourist count is provided AND tours are selected
  if (anyTourSelected && touristCount > 0) {
    // Calculate island tour price if any island option is selected
    if (islandOptionsChecked) {
      const islandPrice = calculateIslandTourPrice(touristCount);
      console.log("Island tour price for", touristCount, "tourists:", islandPrice);
      totalPackagePrice += islandPrice;
    }

    // Calculate inland tour price if any inland option is selected
    if (inlandOptionsChecked) {
      const inlandPrice = calculateInlandTourPrice(touristCount);
      totalPackagePrice += inlandPrice;
    }

    // Calculate snorkeling tour price if any snorkeling option is selected
    if (snorkelOptionsChecked) {
      const snorkelPrice = calculateSnorkelingTourPrice(touristCount);
      totalPackagePrice += snorkelPrice;
    }
  }

  // Calculate hotel price if selected
  calculateHotelPrice();
  
  console.log("Total package price calculated:", totalPackagePrice);
  
  // Format and display package price
  if (totalPackagePrice > 0) {
    amountOfPackageInput.value = `₱${totalPackagePrice.toLocaleString()}.00`;
    console.log("Price set to:", amountOfPackageInput.value);
  } else {
    amountOfPackageInput.value = "";
    console.log("Package price cleared - either no tours selected or no tourist count provided");
  }

  // Update total amount whenever package price changes
  calculateTotalAmount();
}

// Add event listener to tourist count input
(function() {
  const touristCountInput = document.getElementById("touristCount");
  if (touristCountInput) {
    touristCountInput.addEventListener("input", function() {
      updatePackagePrice();
      
      // Clear errors if user provides a valid number and tours are selected
      const touristCount = parseInt(touristCountInput.value) || 0;
      const islandTours = document.querySelectorAll(".island-option:checked");
      const inlandTours = document.querySelectorAll(".inland-option:checked");
      const snorkelTours = document.querySelectorAll(".snorkel-option:checked");
      const tourPackageSelected = islandTours.length > 0 || inlandTours.length > 0 || snorkelTours.length > 0;
      
      if (tourPackageSelected && touristCount > 0) {
        clearTouristCountError();
      }
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
    });
  }
})();

// Initialize package price on load
updatePackagePrice();

// Initialize rental vehicle pricing on load
calculateRentalVehiclePrice();

// Initialize diving pricing on load
calculateDivingPrice();

// Initialize total amount calculation on load
calculateTotalAmount();

// HOTELS - Calculate Duration Function
function calculateDuration() {
  const arrivalDate = document.getElementById("arrivalDate");
  const departureDate = document.getElementById("departureDate");
  const daysInput = document.getElementById("days");

  if (!arrivalDate || !departureDate || !daysInput) return 0;

  if (arrivalDate.value && departureDate.value) {
    const arrival = new Date(arrivalDate.value);
    const departure = new Date(departureDate.value);

    if (departure > arrival) {
      const timeDifference = departure - arrival;
      const days = Math.ceil(timeDifference / (1000 * 3600 * 24));
      daysInput.value = days;
      return days;
    }
  }
  
  daysInput.value = "";
  return 0;
}