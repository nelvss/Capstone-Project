// booking_page.js
// ----------------------------
// STEP HANDLER (9-step wizard with option page)
// ----------------------------
let currentStep = 3;  // Start at step 3 (booking summary) since steps 1-2 are handled elsewhere
const totalSteps = 8;  // Steps 3-8 are in this page

(() => {
  
    function showStep(step) {
      document.querySelectorAll(".form-step").forEach((el, index) => {
        // Step 3 = index 0, Step 4 = index 1, etc.
        el.classList.toggle("active", index === step - 3);
      });
    }
  
    // Expose for buttons in HTML
    window.nextStep = function () {
  // Steps 1-2 are handled on other pages, starting from step 3 here
  // Step 3 is booking summary - no validation needed, proceed to payment options
  
  // Step 4 validation - payment options must be selected
  if (currentStep === 4) {
    const fullPaymentRadio = document.getElementById('fullPayment');
    const downPaymentRadio = document.getElementById('downPayment');
    
    if (!fullPaymentRadio.checked && !downPaymentRadio.checked) {
      alert('Please select a payment option (Full Payment or Down Payment) before proceeding.');
      return; // stay on step 4
    }
    
    // If down payment is selected, validate the amount
    if (downPaymentRadio.checked) {
      const isValid = window.validatePaymentOptions();
      if (!isValid) {
        return; // stay on step 4
      }
    }
  }
  
  if (currentStep < totalSteps) {
    currentStep++;
    
    // When moving to step 3 (booking summary), populate the summary
    if (currentStep === 3) {
      populateBookingSummary();
    }
    
    // When moving to step 4 (payment options), setup payment options
    if (currentStep === 4) {
      setupPaymentOptions();
    }
    
    // Step 5 is payment methods - no additional setup needed here
    if (currentStep === 5) {
      // Payment methods are static, just show the step
    }
    
    // When moving to step 7 (receipt upload), setup with payment info
    if (currentStep === 7 && window.paymentInfo) {
      setupReceiptUpload(window.paymentInfo.method, window.paymentInfo.amount);
    }
    
    showStep(currentStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};
  
    window.previousStep = function () {
      console.log('previousStep called, currentStep:', currentStep);
      
      // If we're on step 3 (booking summary), go back to package selection page
      if (currentStep === 3) {
        // Check if we came from package_only (has completeBookingData in sessionStorage)
        const completeBookingDataString = sessionStorage.getItem('completeBookingData');
        if (completeBookingDataString) {
          try {
            const bookingData = JSON.parse(completeBookingDataString);
            if (bookingData.bookingType === 'package_only') {
              // Store any additional information filled in the booking page before going back
              const currentBookingPageData = {
                // Get any additional form data from booking page that might have been filled
                paymentMethod: document.querySelector('input[name="paymentOption"]:checked')?.value || '',
                fullPayment: document.getElementById('fullPayment')?.checked || false,
                downPayment: document.getElementById('downPayment')?.checked || false,
                downPaymentAmount: document.getElementById('downPaymentAmount')?.value || '',
                // Add any other fields that might be filled in the booking page
                notes: document.getElementById('notes')?.value || '',
                specialRequests: document.getElementById('specialRequests')?.value || ''
              };
              
              // Merge with existing booking data
              const updatedBookingData = {
                ...bookingData,
                ...currentBookingPageData,
                lastPage: 'booking_page' // Track where we came from
              };
              
              // Store updated data back to sessionStorage
              sessionStorage.setItem('completeBookingData', JSON.stringify(updatedBookingData));
              
              // Also store it as bookingPageData for potential restoration
              sessionStorage.setItem('bookingPageData', JSON.stringify(currentBookingPageData));
              
              console.log('Stored booking page data before going back to package_only:', currentBookingPageData);
              
              // Go back to package_only page
              window.location.href = 'package_only.html';
              return;
            }
          } catch (error) {
            console.error('Error parsing booking data:', error);
          }
        }
      }
      
      // For steps 4 and above, just go back to the previous step within this page
      if (currentStep > 3) {  // Can't go below step 3 (booking summary)
        currentStep--;
        console.log('Moving to step:', currentStep);
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
  
    showStep(currentStep);
    
    // Initialize booking summary on page load (step 3)
    if (currentStep === 3) {
      populateBookingSummary();
    }
  
    // VALIDATION UTILITIES PAGE 1

    const FIELD_LABELS = {
      firstName: "First Name",
      lastName: "Last Name",
      emailAddress: "Email Address",
      contactNo: "Contact Number",
      arrivalDate: "Arrival Date",
      departureDate: "Departure Date",
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
  
      // Clear previous errors
      [firstName, lastName, emailAddress, contactNo, arrivalDate, departureDate].forEach(
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
  
      return valid;
    }

    // STEP 2 VALIDATION
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
      if (!hasTourPackages && !hasRentalVehicle && !hasDiving) {
        // Show error message
        if (errorMessageDiv && errorTextSpan) {
          errorTextSpan.textContent = 'Please select at least one service (Tour Package, Rental Vehicle, or Diving) before proceeding to the next page.';
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
          setError(touristCountInput, "Number of Tourist is required when selecting tour packages.");
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
      // Clear step 2 error message if it exists
      if (typeof clearStep2Error === "function") {
        clearStep2Error();
      }
      // Clear tourist count error if no tour packages selected
      if (typeof clearTouristCountErrorIfNoTours === "function") {
        clearTouristCountErrorIfNoTours();
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
        // Clear step 2 error message if it exists
        if (typeof clearStep2Error === "function") {
          clearStep2Error();
        }
        // Clear tourist count error if no tour packages selected
        if (typeof clearTouristCountErrorIfNoTours === "function") {
          clearTouristCountErrorIfNoTours();
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
  wireMultiSelect("island-select-all", "island-options", "island-option", "selectionMessage");
  // Inland tour
  wireMultiSelect("inland-select-all", "inland-options", "inland-option", null);
  // Snorkeling tour
  wireMultiSelect("snorkel-select-all", "snorkel-options", "snorkel-option", null);
  // Rental vehicle
  wireMultiSelect("rental-select-all", "rental-options", "rental-option", null);
  
  // Add specific handling for rental vehicle options to clear rental days error
  const rentalOptions = document.querySelectorAll(".rental-option");
  rentalOptions.forEach(option => {
    option.addEventListener("change", () => {
      if (typeof clearRentalDaysErrorIfNoVehicles === "function") {
        clearRentalDaysErrorIfNoVehicles();
      }
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
  
  // Hotels
  wireMultiSelect("hotels-select-all", "hotels-options", "hotels-option", null);
  
  // Add event listener for diving option (no select-all needed since there's only one option)
  const divingOption = document.getElementById("diving-only");
  if (divingOption) {
    divingOption.addEventListener("change", () => {
      calculateDivingPrice();
      calculateTotalAmount();
      updatePackagePrice();
      // Clear number of divers error if diving is unchecked
      if (typeof clearNumberOfDiversErrorIfNoDiving === "function") {
        clearNumberOfDiversErrorIfNoDiving();
      }
    });
  }
  
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
      // Clear step 2 error message if it exists
      if (typeof clearStep2Error === "function") {
        clearStep2Error();
      }
    };
    divingOption.addEventListener("change", refresh);
  })();

// Control Hotels row visibility based on selected tour options only (NOT diving or rental)
function updateHotelsRowVisibility() {
  const hotelsRow = document.getElementById("hotelsRow");
  if (!hotelsRow) return;
  // Only show hotels when tour packages are selected (island, inland, or snorkeling)
  // NOT when diving or rental vehicles are selected
  const anyChecked = document.querySelectorAll(
    ".island-option:checked, .inland-option:checked, .snorkel-option:checked"
  ).length > 0;
  if (anyChecked) {
    hotelsRow.classList.add("is-visible");
  } else {
    hotelsRow.classList.remove("is-visible");
  }
  // Update days visibility when hotels row visibility changes
  if (typeof updateDaysVisibility === "function") {
    updateDaysVisibility();
  }
}

// Tour options already have event listeners set up via wireMultiSelect function
// which includes updatePackagePrice() calls

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
      default:
        dailyRate = 1000;
    }
    
    totalVehiclePrice += dailyRate * rentalDays;
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
function calculateHotelPrice() {
  const days = calculateDuration();
  const touristCount = parseInt(document.getElementById("touristCount")?.value) || 0;
  const hotelPriceInput = document.getElementById("hotelPrice");
  
  if (!days || !touristCount || !hotelPriceInput) {
    if (hotelPriceInput) hotelPriceInput.value = "";
    return 0;
  }

  const selectedHotel = document.querySelector(".hotels-option:checked");
  if (!selectedHotel) {
    hotelPriceInput.value = "";
    return 0;
  }

  // Hotel price will be set later
  hotelPriceInput.value = "";
  return 0;
}

function updatePackagePrice() {
  const touristCountInput = document.getElementById("touristCount");
  const amountOfPackageInput = document.getElementById("amountOfPackage");
  const hotelPriceInput = document.getElementById("hotelPrice");
  
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

  // Calculate hotel price if selected
  calculateHotelPrice();
  
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

// Add event listener to tourist count input
(function() {
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
      // Update inland tour availability on blur as well
      updateInlandTourAvailability();
    });
  }
})();

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
      inlandTourAlert.style.fontSize = '0.85rem';
    }
    
    console.log('Inland tour options disabled - tourist count less than 2');
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
      inlandTourAlert.style.fontSize = '0.85rem';
    }
    
    console.log('Inland tour options enabled - tourist count is 2 or more');
  }
  
  // Recalculate package price since inland tours may have been unchecked
  updatePackagePrice();
}

// Add event listener to number of divers input
(function() {
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
})();

// Initialize package price on load
updatePackagePrice();

// Add event listeners to update total amount when individual amounts change
(function() {
  const amountFields = ['amountOfPackage', 'hotelPrice', 'amountOfVehicle', 'amountOfDiving'];
  
  amountFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', calculateTotalAmount);
      // Also listen for value changes from other functions
      const observer = new MutationObserver(() => calculateTotalAmount());
      observer.observe(field, { attributes: true, attributeFilter: ['value'] });
    }
  });
})();

// HOTELS 
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

// Function to populate the booking summary
function populateBookingSummary() {
    console.log('populateBookingSummary called');
    
    // Get complete booking data from sessionStorage (from package_only form)
    const completeBookingDataString = sessionStorage.getItem('completeBookingData');
    let bookingData = null;
    
    if (completeBookingDataString) {
        try {
            bookingData = JSON.parse(completeBookingDataString);
            console.log('Loaded complete booking data from package_only:', bookingData);
        } catch (error) {
            console.error('Error parsing complete booking data:', error);
        }
    }
    
    // Extract data from bookingData or use fallback values
    let firstName = '', lastName = '', email = '', contact = '', arrival = '', departure = '', tourists = '';
    
    if (bookingData) {
        // Use data from package_only form
        firstName = bookingData.firstName || '';
        lastName = bookingData.lastName || '';
        email = bookingData.emailAddress || bookingData.email || '';
        contact = bookingData.contactNo || bookingData.contact || '';
        arrival = bookingData.arrivalDate || bookingData.arrival || '';
        departure = bookingData.departureDate || bookingData.departure || '';
        tourists = bookingData.touristCount || '';
    }

    // Populate personal information summary
    document.getElementById('summary-name').textContent = (firstName + ' ' + lastName).trim() || 'Not provided';
    document.getElementById('summary-email').textContent = email || 'Not provided';
    document.getElementById('summary-contact').textContent = contact || 'Not provided';
    document.getElementById('summary-arrival').textContent = formatDate(arrival) || 'Not provided';
    document.getElementById('summary-departure').textContent = formatDate(departure) || 'Not provided';
    document.getElementById('summary-tourists').textContent = tourists || 'Not specified';

    // Determine and display package type
    displayPackageType(bookingData);

    // Hide individual tour sections since we're using packages
    const tourPackagesSection = document.getElementById('tour-packages-section');
    if (tourPackagesSection) {
        tourPackagesSection.style.display = 'none';
    }

    // Hotel Information (always show for packages)
    populatePackageHotelSummary(bookingData);

    // Vehicle Information
    populateVehicleSummary(bookingData);

    // Diving Information
    populateDivingSummary(bookingData);

    // Calculate and display total amount
    calculateSummaryTotalAmount(bookingData);
}

// Function to display the package type based on selected services
function displayPackageType(bookingData) {
    const packageTypeElement = document.getElementById('summary-package-type');
    if (!packageTypeElement) return;
    
    console.log('displayPackageType called with:', bookingData);
    
    let packageTypes = [];
    let selectedHotel = '';
    let selectedPackageName = '';
    let hasVehicleRental = false;
    let hasDiving = false;
    
    if (bookingData) {
        // Get data from package_only form
        selectedPackageName = bookingData.selectedPackage || '';
        selectedHotel = bookingData.selectedHotel || '';
        hasVehicleRental = (bookingData.rentalVehicles && bookingData.rentalVehicles.length > 0);
        hasDiving = bookingData.diving || false;
    }
    
    // Add package name to services
    if (selectedPackageName) {
        // Add descriptive text based on package
        let packageDescription = selectedPackageName;
        if (selectedPackageName === 'Package 1') {
            packageDescription = 'Package 1 (2D1N - Hotel + Island + Land Tour)';
        } else if (selectedPackageName === 'Package 2') {
            packageDescription = 'Package 2 (3D2N - Hotel + Island + Land Tour)';
        } else if (selectedPackageName === 'Package 3') {
            packageDescription = 'Package 3 (2D1N - Hotel + Island Tour)';
        } else if (selectedPackageName === 'Package 4') {
            packageDescription = 'Package 4 (3D2N - Hotel + Island Tour)';
        }
        packageTypes.push(packageDescription);
    }
    
    // Add additional services
    if (hasVehicleRental) {
        const vehicleList = bookingData.rentalVehicles ? bookingData.rentalVehicles.join(', ') : 'Vehicle Rental';
        packageTypes.push(`Vehicle Rental: ${vehicleList}`);
    }
    if (hasDiving) {
        const divers = bookingData.numberOfDivers || '1';
        packageTypes.push(`Diving Service (${divers} diver${divers > 1 ? 's' : ''})`);
    }
    
    // Create HTML content
    let htmlContent = '';
    
    // Display the package types
    if (packageTypes.length > 0) {
        htmlContent += '<div class="mb-2">';
        htmlContent += '<strong class="text-muted small">Selected Services:</strong><br>';
        packageTypes.forEach(type => {
            htmlContent += `<div class="mb-1"><i class="fas fa-check-circle text-success me-2"></i>${type}</div>`;
        });
        htmlContent += '</div>';
    }
    
    // Display selected hotel if any
    if (selectedHotel) {
        htmlContent += '<div class="mb-2">';
        htmlContent += '<strong class="text-muted small">Hotel Accommodation:</strong><br>';
        htmlContent += `<div class="mb-1"><i class="fas fa-hotel text-primary me-2"></i>${selectedHotel}</div>`;
        htmlContent += '</div>';
    }
    
    // Set final content
    if (htmlContent) {
        packageTypeElement.innerHTML = htmlContent;
    } else {
        packageTypeElement.innerHTML = '<span class="text-muted">No services selected</span>';
    }
}

// Function to adjust tour packages layout based on how many are selected
function updateTourPackagesLayout() {
    const islandContainer = document.getElementById('island-tours-container');
    const inlandContainer = document.getElementById('inland-tours-container');
    const snorkelContainer = document.getElementById('snorkel-tours-container');
    const noToursMessage = document.getElementById('no-tours-message');
    const tourPackagesSection = document.getElementById('tour-packages-section');
    
    // Count how many tour types are selected
    const islandSelected = document.querySelectorAll('.island-option:checked').length > 0;
    const inlandSelected = document.querySelectorAll('.inland-option:checked').length > 0;
    const snorkelSelected = document.querySelectorAll('.snorkel-option:checked').length > 0;
    
    const selectedCount = (islandSelected ? 1 : 0) + (inlandSelected ? 1 : 0) + (snorkelSelected ? 1 : 0);
    
    if (selectedCount === 0) {
        // No tours selected - hide the entire tour packages section
        if (tourPackagesSection) tourPackagesSection.style.display = 'none';
        if (noToursMessage) noToursMessage.style.display = 'block';
    } else {
        // At least one tour selected - show the section and hide the "no tours" message
        if (tourPackagesSection) tourPackagesSection.style.display = 'block';
        if (noToursMessage) noToursMessage.style.display = 'none';
        
        // Adjust column sizes based on how many tour types are selected
        let colClass = 'col-md-4'; // default for 3 columns
        
        if (selectedCount === 1) {
            colClass = 'col-12'; // full width for 1 tour type
        } else if (selectedCount === 2) {
            colClass = 'col-md-6'; // half width for 2 tour types
        }
        
        // Update column classes for visible containers
        if (islandContainer && islandSelected) {
            islandContainer.className = colClass;
        }
        if (inlandContainer && inlandSelected) {
            inlandContainer.className = colClass;
        }
        if (snorkelContainer && snorkelSelected) {
            snorkelContainer.className = colClass;
        }
    }
}

// Helper function to format date for display
function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Function to calculate total amount for summary (package-based)
function calculateSummaryTotalAmount(bookingData) {
    let total = 0;
    
    console.log('calculateSummaryTotalAmount called with:', bookingData);
    
    if (bookingData) {
        // Method 1: Try to get totalAmount directly (this is the complete total)
        if (bookingData.totalAmount) {
            const totalFromForm = parseFloat(bookingData.totalAmount.replace(/[₱,]/g, '')) || 0;
            if (totalFromForm > 0) {
                total = totalFromForm;
                console.log('Using totalAmount from form:', totalFromForm);
            }
        }
        
        // Method 2: If no totalAmount, calculate from individual amounts
        if (total === 0) {
            // Get package amount from session data
            if (bookingData.packageAmount) {
                const packageAmount = parseFloat(bookingData.packageAmount.replace(/[₱,]/g, '')) || 0;
                total += packageAmount;
                console.log('Added package amount:', packageAmount);
            }
            
            // Get vehicle amount from session data  
            if (bookingData.vehicleAmount) {
                const vehicleAmount = parseFloat(bookingData.vehicleAmount.replace(/[₱,]/g, '')) || 0;
                total += vehicleAmount;
                console.log('Added vehicle amount:', vehicleAmount);
            }
            
            // Get diving amount from session data
            if (bookingData.divingAmount) {
                const divingAmount = parseFloat(bookingData.divingAmount.replace(/[₱,]/g, '')) || 0;
                total += divingAmount;
                console.log('Added diving amount:', divingAmount);
            }
        }
    }
    
    console.log('Final total calculated:', total);
    
    // Update total amount fields - including payment option total
    const summaryTotalElement = document.getElementById('summary-total-amount');
    const paymentTotalElement = document.getElementById('payment-total-amount');
    const packageAmountDisplay = document.getElementById('summary-package-amount');
    
    if (total > 0) {
        const formattedTotal = `₱${total.toLocaleString()}.00`;
        if (summaryTotalElement) {
            summaryTotalElement.textContent = formattedTotal;
            console.log('✓ Updated summary-total-amount to:', formattedTotal);
        } else {
            console.error('✗ Element summary-total-amount not found!');
        }
        
        if (paymentTotalElement) {
            paymentTotalElement.textContent = formattedTotal;
            console.log('✓ Updated payment-total-amount to:', formattedTotal);
        } else {
            console.error('✗ Element payment-total-amount not found!');
        }
        
        // Also update package amount display
        if (packageAmountDisplay && bookingData && bookingData.packageAmount) {
            packageAmountDisplay.textContent = bookingData.packageAmount;
            console.log('✓ Updated summary-package-amount to:', bookingData.packageAmount);
        }
    } else {
        console.warn('⚠ Total is 0 or negative, setting default values');
        if (summaryTotalElement) summaryTotalElement.textContent = '₱0.00';
        if (paymentTotalElement) paymentTotalElement.textContent = '₱0.00';
    }
}

// Legacy function (kept for compatibility)
function calculateTotalAmount() {
    let total = 0;
    
    // Try to get total from sessionStorage first
    const completeBookingDataString = sessionStorage.getItem('completeBookingData');
    let sessionTotal = 0;
    
    if (completeBookingDataString) {
        try {
            const bookingData = JSON.parse(completeBookingDataString);
            
            // Get package amount from session data
            if (bookingData.packageAmount) {
                const packageAmount = parseFloat(bookingData.packageAmount.replace(/[₱,]/g, '')) || 0;
                sessionTotal += packageAmount;
            }
            
            // Get vehicle amount from session data
            if (bookingData.vehicleAmount) {
                const vehicleAmount = parseFloat(bookingData.vehicleAmount.replace(/[₱,]/g, '')) || 0;
                sessionTotal += vehicleAmount;
            }
            
            // Get diving amount from session data
            if (bookingData.divingAmount) {
                const divingAmount = parseFloat(bookingData.divingAmount.replace(/[₱,]/g, '')) || 0;
                sessionTotal += divingAmount;
            }
            
            // Use session total if available
            if (sessionTotal > 0) {
                total = sessionTotal;
            }
        } catch (error) {
            console.error('Error parsing booking data for total calculation:', error);
        }
    }
    
    // Update total amount fields - including payment option total
    const totalAmountInput = document.getElementById('totalAmount');
    const summaryTotalElement = document.getElementById('summary-total-amount');
    const paymentTotalElement = document.getElementById('payment-total-amount');
    
    if (total > 0) {
        const formattedTotal = `₱${total.toLocaleString()}.00`;
        if (totalAmountInput) totalAmountInput.value = formattedTotal;
        if (summaryTotalElement) summaryTotalElement.textContent = formattedTotal;
        if (paymentTotalElement) paymentTotalElement.textContent = formattedTotal;
    } else {
        if (totalAmountInput) totalAmountInput.value = '';
        if (summaryTotalElement) summaryTotalElement.textContent = '₱0.00';
        if (paymentTotalElement) paymentTotalElement.textContent = '₱0.00';
    }
}

function populateTourSummary(type, elementId) {
    const summaryElement = document.getElementById(elementId);
    const containerElement = document.getElementById(`${type}-tours-container`);
    
    // Get tour data from sessionStorage
    const completeBookingDataString = sessionStorage.getItem('completeBookingData');
    let selectedTours = [];
    
    if (completeBookingDataString) {
        try {
            const bookingData = JSON.parse(completeBookingDataString);
            
            // Get the appropriate tour array based on type
            if (type === 'island') {
                selectedTours = bookingData.islandTours || [];
            } else if (type === 'inland') {
                selectedTours = bookingData.inlandTours || [];
            } else if (type === 'snorkel') {
                selectedTours = bookingData.snorkelTours || [];
            }
        } catch (error) {
            console.error('Error parsing booking data for tour summary:', error);
        }
    }
    
    // Fallback to current form elements if no session data
    if (selectedTours.length === 0) {
        const options = document.querySelectorAll(`.${type}-option:checked`);
        selectedTours = Array.from(options).map(option => option.value);
    }
    
    if (selectedTours.length > 0) {
        // Show the container
        if (containerElement) {
            containerElement.style.display = 'block';
        }
        
        // Populate the list
        summaryElement.innerHTML = '';
        selectedTours.forEach(tour => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>${tour}`;
            summaryElement.appendChild(li);
        });
    } else {
        // Hide the container when no tours are selected
        if (containerElement) {
            containerElement.style.display = 'none';
        }
        
        const typeDisplay = type === 'island' ? 'island' : type === 'inland' ? 'inland' : 'snorkeling';
        summaryElement.innerHTML = `<li class="text-muted">No ${typeDisplay} tours selected</li>`;
    }
}

// Package-based hotel summary (always included in packages)
function populatePackageHotelSummary(bookingData) {
    const accommodationSection = document.getElementById('accommodation-section');
    
    if (bookingData && bookingData.selectedHotel) {
        accommodationSection.style.display = 'block';
        
        // Display selected hotel
        document.getElementById('summary-hotel').textContent = bookingData.selectedHotel;
        
        // Calculate nights based on package type
        let nights = 1; // Default for 2D1N packages
        const selectedPackage = bookingData.selectedPackage || '';
        
        if (selectedPackage === 'Package 2' || selectedPackage === 'Package 4') {
            nights = 2; // 3D2N packages
        }
        
        document.getElementById('summary-hotel-days').textContent = `${nights} night${nights > 1 ? 's' : ''}`;
        
        // Hotel amount is included in package amount, so show as "Included"
        document.getElementById('summary-hotel-amount').textContent = 'Included in Package';
    } else {
        accommodationSection.style.display = 'none';
    }
}

// Legacy hotel summary function (kept for compatibility)
function populateHotelSummary() {
    const hotelOptions = document.querySelectorAll('.hotels-option:checked');
    const accommodationSection = document.getElementById('accommodation-section');
    
    if (hotelOptions.length > 0) {
        accommodationSection.style.display = 'block';
        document.getElementById('summary-hotel').textContent = hotelOptions[0].value;
        
        const days = document.getElementById('days').value;
        document.getElementById('summary-hotel-days').textContent = days || '-';
        
        const hotelPrice = document.getElementById('hotelPrice').value;
        document.getElementById('summary-hotel-amount').textContent = hotelPrice || '₱0.00';
    } else {
        accommodationSection.style.display = 'none';
    }
}

function populateVehicleSummary(bookingData) {
    const vehicleSubsection = document.getElementById('vehicle-subsection');
    const additionalServicesSection = document.getElementById('additional-services-section');
    
    let selectedVehicles = [];
    let rentalDays = '';
    let vehicleAmount = '';
    
    if (bookingData) {
        selectedVehicles = bookingData.rentalVehicles || [];
        rentalDays = bookingData.rentalDays || '';
        vehicleAmount = bookingData.vehicleAmount || '';
    }
    
    console.log('Vehicle summary - vehicles:', selectedVehicles, 'days:', rentalDays, 'amount:', vehicleAmount);
    
    if (selectedVehicles.length > 0) {
        vehicleSubsection.style.display = 'block';
        
        // Display all selected vehicles
        document.getElementById('summary-vehicle').textContent = selectedVehicles.join(', ');
        
        // Display rental days
        document.getElementById('summary-vehicle-days').textContent = rentalDays ? `${rentalDays} Day${rentalDays > 1 ? 's' : ''}` : '-';
        
        // Show the additional services section
        updateAdditionalServicesVisibility();
    } else {
        vehicleSubsection.style.display = 'none';
        
        // Update visibility of additional services section
        updateAdditionalServicesVisibility();
    }
}

function populateDivingSummary(bookingData) {
    const divingSubsection = document.getElementById('diving-subsection');
    const additionalServicesSection = document.getElementById('additional-services-section');
    
    let hasDiving = false;
    let numberOfDivers = '';
    let divingAmount = '';
    
    if (bookingData) {
        hasDiving = bookingData.diving || false;
        numberOfDivers = bookingData.numberOfDivers || '';
        divingAmount = bookingData.divingAmount || '';
    }
    
    console.log('Diving summary - hasDiving:', hasDiving, 'divers:', numberOfDivers, 'amount:', divingAmount);
    
    if (hasDiving && numberOfDivers) {
        divingSubsection.style.display = 'block';
        
        // Display number of divers
        document.getElementById('summary-divers').textContent = numberOfDivers || '-';
        
        // Show the additional services section
        updateAdditionalServicesVisibility();
    } else {
        divingSubsection.style.display = 'none';
        
        // Update visibility of additional services section
        updateAdditionalServicesVisibility();
    }
}

// Helper function to show/hide the Additional Services section
function updateAdditionalServicesVisibility() {
    const additionalServicesSection = document.getElementById('additional-services-section');
    const vehicleSubsection = document.getElementById('vehicle-subsection');
    const divingSubsection = document.getElementById('diving-subsection');
    
    // Show the section if either vehicle or diving is visible
    const hasVehicle = vehicleSubsection && vehicleSubsection.style.display !== 'none';
    const hasDiving = divingSubsection && divingSubsection.style.display !== 'none';
    
    if (hasVehicle || hasDiving) {
        additionalServicesSection.style.display = 'block';
    } else {
        additionalServicesSection.style.display = 'none';
    }
}

// ----------------------------
// PAYMENT OPTIONS FUNCTIONALITY
// ----------------------------

function setupPaymentOptions() {
    console.log('=== setupPaymentOptions called ===');
    
    // Get the total amount from the summary
    const summaryTotalElement = document.getElementById('summary-total-amount');
    const paymentTotalElement = document.getElementById('payment-total-amount');
    
    console.log('Summary total element found:', !!summaryTotalElement);
    console.log('Payment total element found:', !!paymentTotalElement);
    
    if (summaryTotalElement && paymentTotalElement) {
        const totalAmount = summaryTotalElement.textContent;
        console.log('Summary total amount:', totalAmount);
        paymentTotalElement.textContent = totalAmount;
        console.log('✓ Synced payment total to:', totalAmount);
    } else {
        console.error('✗ Could not sync totals - elements missing');
    }
    
    // Calculate minimum down payment based on number of tourists
    const minimumPerPerson = 500;
    let numberOfTourists = 1;
    let minimumDownPayment = 500;
    
    // Get number of tourists from booking data
    const completeBookingDataString = sessionStorage.getItem('completeBookingData');
    if (completeBookingDataString) {
        try {
            const bookingData = JSON.parse(completeBookingDataString);
            numberOfTourists = parseInt(bookingData.touristCount) || 1;
            console.log('Number of tourists:', numberOfTourists);
        } catch (error) {
            console.error('Error parsing booking data:', error);
        }
    }
    
    // Calculate minimum down payment (₱500 × number of tourists)
    minimumDownPayment = minimumPerPerson * numberOfTourists;
    console.log('Minimum down payment:', minimumDownPayment);
    
    // Update the minimum down payment display
    const minimumDownPaymentText = document.getElementById('minimumDownPaymentText');
    const minimumDownPaymentAmount = document.getElementById('minimumDownPaymentAmount');
    
    if (minimumDownPaymentText) {
        minimumDownPaymentText.textContent = `Minimum for your booking: ₱${minimumDownPayment.toLocaleString()}`;
    }
    
    if (minimumDownPaymentAmount) {
        minimumDownPaymentAmount.textContent = `₱${minimumDownPayment.toLocaleString()}`;
    }
    
    // Initialize Next button state - disabled until payment is confirmed
    const paymentNextBtn = document.getElementById('paymentNextBtn');
    const paymentInstructions = document.getElementById('paymentInstructions');
    
    // Only reset if payment hasn't been confirmed yet
    if (paymentNextBtn && !window.paymentInfo) {
        paymentNextBtn.disabled = true;
        paymentNextBtn.innerHTML = 'Next';
    }
    
    if (paymentInstructions && !window.paymentInfo) {
        paymentInstructions.innerHTML = '<i class="fas fa-info-circle me-1"></i>Please select a payment method and complete the payment to proceed';
        paymentInstructions.classList.remove('text-success');
        paymentInstructions.classList.add('text-muted');
    }
    
    // Set up payment option change handlers
    const fullPaymentRadio = document.getElementById('fullPayment');
    const downPaymentRadio = document.getElementById('downPayment');
    const downPaymentReminder = document.getElementById('downPaymentReminder');
    const downPaymentSection = document.getElementById('downPaymentSection');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    
    // Event listeners for payment option changes
    if (fullPaymentRadio && downPaymentRadio) {
        fullPaymentRadio.addEventListener('change', function() {
            if (this.checked) {
                downPaymentReminder.classList.add('d-none');
                downPaymentSection.classList.add('d-none');
                
                // Enable the Next button
                if (paymentNextBtn) {
                    paymentNextBtn.disabled = false;
                    paymentInstructions.innerHTML = '<i class="fas fa-check-circle me-1 text-success"></i>Full Payment selected. Click Next to proceed.';
                    paymentInstructions.classList.remove('text-muted');
                    paymentInstructions.classList.add('text-success');
                }
            }
        });
        
        downPaymentRadio.addEventListener('change', function() {
            if (this.checked) {
                downPaymentReminder.classList.remove('d-none');
                downPaymentSection.classList.remove('d-none');
                
                // Set the maximum down payment amount to the total
                const totalText = paymentTotalElement.textContent.replace(/[₱,]/g, '');
                const totalAmount = parseFloat(totalText) || 0;
                downPaymentAmountInput.max = totalAmount;
                
                // Set minimum attribute dynamically
                downPaymentAmountInput.min = minimumDownPayment;
                
                // Set default down payment to minimum calculated amount
                downPaymentAmountInput.value = minimumDownPayment;
                updateRemainingBalance();
                
                // Enable the Next button
                if (paymentNextBtn) {
                    paymentNextBtn.disabled = false;
                    paymentInstructions.innerHTML = '<i class="fas fa-check-circle me-1 text-success"></i>Down Payment selected. Click Next to proceed.';
                    paymentInstructions.classList.remove('text-muted');
                    paymentInstructions.classList.add('text-success');
                }
            }
        });
        
        // Update remaining balance when down payment amount changes
        if (downPaymentAmountInput) {
            downPaymentAmountInput.addEventListener('input', function() {
                updateRemainingBalance(minimumDownPayment);
            });
        }
    }
}

function updateRemainingBalance(minimumDownPayment = 500) {
    const paymentTotalElement = document.getElementById('payment-total-amount');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    const remainingBalanceElement = document.getElementById('remainingBalance');
    
    if (paymentTotalElement && downPaymentAmountInput && remainingBalanceElement) {
        const totalText = paymentTotalElement.textContent.replace(/[₱,]/g, '');
        const totalAmount = parseFloat(totalText) || 0;
        const downPaymentAmount = parseFloat(downPaymentAmountInput.value) || 0;
        
        // Validate minimum down payment based on number of tourists
        if (downPaymentAmount < minimumDownPayment && downPaymentAmount > 0) {
            downPaymentAmountInput.value = minimumDownPayment;
        }
        
        // Calculate remaining balance
        const remainingAmount = totalAmount - (parseFloat(downPaymentAmountInput.value) || 0);
        remainingBalanceElement.textContent = `₱${remainingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

// Expose payment validation function
window.validatePaymentOptions = function() {
    const downPaymentRadio = document.getElementById('downPayment');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    
    if (downPaymentRadio && downPaymentRadio.checked) {
        const downPaymentAmount = parseFloat(downPaymentAmountInput.value) || 0;
        
        // Calculate minimum down payment based on number of tourists
        const minimumPerPerson = 500;
        let numberOfTourists = 1;
        let minimumDownPayment = 500;
        
        // Get number of tourists from booking data
        const completeBookingDataString = sessionStorage.getItem('completeBookingData');
        if (completeBookingDataString) {
            try {
                const bookingData = JSON.parse(completeBookingDataString);
                numberOfTourists = parseInt(bookingData.touristCount) || 1;
            } catch (error) {
                console.error('Error parsing booking data:', error);
            }
        }
        
        // Calculate minimum down payment (₱500 × number of tourists)
        minimumDownPayment = minimumPerPerson * numberOfTourists;
        
        if (downPaymentAmount < minimumDownPayment) {
            alert(`Please enter a down payment of at least ₱${minimumDownPayment.toLocaleString()} (₱500 × ${numberOfTourists} tourist${numberOfTourists > 1 ? 's' : ''}).`);
            downPaymentAmountInput.focus();
            return false;
        }
        
        const paymentTotalElement = document.getElementById('payment-total-amount');
        const totalText = paymentTotalElement.textContent.replace(/[₱,]/g, '');
        const totalAmount = parseFloat(totalText) || 0;
        
        if (downPaymentAmount > totalAmount) {
            alert('Down payment cannot exceed the total amount.');
            downPaymentAmountInput.focus();
            return false;
        }
    }
    
    return true;
};

// ----------------------------
// PAYMENT QR CODE FUNCTIONALITY
// ----------------------------

// Payment method configurations
const paymentMethods = {
    gcash: {
        name: 'GCASH',
        icon: 'fas fa-mobile-alt',
        color: '#007cff',
        app: 'GCash'
    },
    paymaya: {
        name: 'PAYMAYA',
        icon: 'fas fa-credit-card',
        color: '#00d4aa',
        app: 'PayMaya'
    },
    banking: {
        name: 'ONLINE BANKING',
        icon: 'fas fa-university',
        color: '#28a745',
        app: 'Banking'
    }
};

// Show payment QR code modal
function showPaymentQR(paymentType) {
    console.log('showPaymentQR called with:', paymentType);
    
    const method = paymentMethods[paymentType];
    if (!method) return;
    
    // AGGRESSIVE CLEANUP: Remove any existing modal backdrops and reset body
    const existingBackdrops = document.querySelectorAll('.modal-backdrop');
    console.log('Removing existing backdrops:', existingBackdrops.length);
    existingBackdrops.forEach(backdrop => backdrop.remove());
    
    // Reset body state
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Update modal content based on payment method
    const modal = document.getElementById('paymentQRModal');
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }
    
    const modalTitle = document.getElementById('paymentQRModalLabel');
    const paymentIcon = document.getElementById('paymentIcon');
    const paymentMethodName = document.getElementById('paymentMethodName');
    const modalPaymentAmount = document.getElementById('modalPaymentAmount');
    const instructionApp = document.getElementById('instructionApp');
    
    // Set payment method details
    if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-qrcode me-2"></i>${method.name} Payment`;
    if (paymentIcon) {
        paymentIcon.className = `${method.icon} fa-3x`;
        paymentIcon.style.color = method.color;
    }
    if (paymentMethodName) {
        paymentMethodName.textContent = method.name;
        paymentMethodName.style.color = method.color;
    }
    if (instructionApp) instructionApp.textContent = method.app;
    
    // Get the payment amount (full payment or down payment)
    const fullPaymentRadio = document.getElementById('fullPayment');
    const downPaymentRadio = document.getElementById('downPayment');
    const paymentTotalElement = document.getElementById('payment-total-amount');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    
    let amountToPay = '₱0.00';
    
    if (paymentTotalElement) {
        if (fullPaymentRadio && fullPaymentRadio.checked) {
            // Full payment
            amountToPay = paymentTotalElement.textContent;
        } else if (downPaymentRadio && downPaymentRadio.checked && downPaymentAmountInput) {
            // Down payment
            const downAmount = parseFloat(downPaymentAmountInput.value) || 0;
            amountToPay = `₱${downAmount.toLocaleString()}.00`;
        } else {
            // Default to full payment
            amountToPay = paymentTotalElement.textContent;
        }
    }
    
    if (modalPaymentAmount) modalPaymentAmount.textContent = amountToPay;
    
    // Generate QR code placeholder (in real implementation, you'd generate actual QR code)
    generateQRCodePlaceholder(method, amountToPay);
    
    // Dispose any existing modal instance
    let bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) {
        console.log('Disposing existing modal instance');
        try {
            bsModal.dispose();
        } catch (e) {
            console.log('Error disposing modal:', e);
        }
    }
    
    // Wait a bit for cleanup to complete, then create and show new modal
    setTimeout(() => {
        console.log('Creating new modal instance');
        // Create new instance and show
        bsModal = new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        console.log('Showing modal');
        bsModal.show();
    }, 150);
}

// Generate QR code placeholder
function generateQRCodePlaceholder(method, amount) {
    const qrContainer = document.querySelector('.qr-code-container');
    let qrImageSrc = '';

    // Choose QR image based on method
    if (method.name === 'GCASH') {
        qrImageSrc = '../user/images/gcash_qr.png'; // update path as needed
    } else if (method.name === 'PAYMAYA') {
        qrImageSrc = '../user/images/paymaya_qr.png';
    } else if (method.name === 'ONLINE BANKING') {
        qrImageSrc = '../user/images/banking_qr.png';
    }

    qrContainer.innerHTML = `
        <div class="text-center">
            <img src="${qrImageSrc}" alt="${method.name} QR Code" style="width: 160px; height: 160px; object-fit: contain; border: 2px solid ${method.color}; border-radius: 8px; margin-bottom: 8px;">
            <div style="font-size: 0.7rem; color: #666; font-weight: bold;">${method.name}</div>
            <div style="font-size: 0.6rem; color: #888;">${amount}</div>
        </div>
        <p class="text-muted small mt-2 mb-0">Scan to pay with ${method.app}</p>
    `;
}

// Confirm payment completion
function confirmPayment() {
    console.log('confirmPayment function called');
    
    // Store payment method info for receipt page before closing modal
    const paymentMethodName = document.getElementById('paymentMethodName')?.textContent || '';
    const paidAmount = document.getElementById('modalPaymentAmount')?.textContent || '';
    
    console.log('Payment Method:', paymentMethodName, 'Amount:', paidAmount);
    
    // Force enable the Next button on step 5 (Payment Methods page)
    // Use a more robust selector to find the button
    const paymentNextBtn = document.querySelector('#paymentNextBtn') || 
                          document.querySelector('#form-step-5 button[onclick="nextStep()"]');
    const paymentInstructions = document.querySelector('#paymentInstructions');
    
    console.log('Next button element found:', paymentNextBtn);
    console.log('Button disabled state before:', paymentNextBtn?.disabled);
    console.log('Instructions element found:', paymentInstructions);
    
    if (paymentNextBtn) {
        // Force enable the button
        paymentNextBtn.removeAttribute('disabled');
        paymentNextBtn.disabled = false;
        paymentNextBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Next';
        // Force styles
        paymentNextBtn.style.opacity = '1';
        paymentNextBtn.style.cursor = 'pointer';
        paymentNextBtn.style.backgroundColor = '#ef4444';
        paymentNextBtn.style.borderColor = '#ef4444';
        console.log('Next button enabled! Disabled state after:', paymentNextBtn.disabled);
    } else {
        console.error('Next button not found! Trying alternative methods...');
        // Try to find all buttons with nextStep
        const allButtons = document.querySelectorAll('button[onclick="nextStep()"]');
        console.log('Found buttons with nextStep():', allButtons.length);
        allButtons.forEach((btn, index) => {
            console.log(`Button ${index}:`, btn.id, btn.textContent);
        });
    }
    
    if (paymentInstructions) {
        paymentInstructions.innerHTML = '<i class="fas fa-check-circle text-success me-1"></i>Payment confirmed! Click Next to continue';
        paymentInstructions.classList.remove('text-muted');
        paymentInstructions.classList.add('text-success');
        console.log('Instructions updated!');
    } else {
        console.error('Instructions element not found!');
    }
    
    // Store payment info for later use
    window.paymentInfo = {
        method: paymentMethodName,
        amount: paidAmount
    };
    
    console.log('Payment info stored:', window.paymentInfo);
    
    // Close and dispose modal properly
    const modalElement = document.getElementById('paymentQRModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
    // Clean up after modal is hidden
    setTimeout(() => {
        if (modal) {
            modal.dispose();
        }
        
        // Remove any lingering backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Ensure body classes are cleaned up
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Double-check button is enabled after modal closes
        const btnCheck = document.getElementById('paymentNextBtn');
        if (btnCheck) {
            console.log('Final button check - disabled:', btnCheck.disabled);
        }
    }, 300);
    
    console.log('Payment confirmed, Next button should be enabled');
}

// ----------------------------
// E-RECEIPT UPLOAD FUNCTIONALITY
// ----------------------------

// Setup receipt upload page
function setupReceiptUpload(paymentMethod, amount) {
    const selectedPaymentMethodElement = document.getElementById('selectedPaymentMethod');
    const paidAmountElement = document.getElementById('paidAmount');
    
    if (selectedPaymentMethodElement) {
        selectedPaymentMethodElement.textContent = paymentMethod;
    }
    
    if (paidAmountElement) {
        paidAmountElement.textContent = amount;
    }
}

// Handle file upload
function handleFileUpload(event) {
    const files = event.target.files;
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const uploadedFilesSection = document.getElementById('uploadedFiles');
    const submitBtn = document.getElementById('submitBookingBtn');
    
    console.log('handleFileUpload called with files:', files.length);
    
    if (files.length > 0) {
        // Set global flag
        isReceiptUploaded = true;
        
        // Clear existing previews
        filePreviewContainer.innerHTML = '';
        
        // Show uploaded files section and remove d-none class
        uploadedFilesSection.classList.remove('d-none');
        uploadedFilesSection.style.display = 'block';
        
        // Create simple preview
        const previewDiv = document.createElement('div');
        previewDiv.className = 'text-center';
        previewDiv.innerHTML = `
            <div class="mb-2">
                <i class="fas fa-image text-success fa-2x"></i>
            </div>
            <p class="mb-0 small text-success">${files[0].name}</p>
            <p class="mb-0 text-muted small">${(files[0].size / 1024 / 1024).toFixed(2)} MB</p>
        `;
        filePreviewContainer.appendChild(previewDiv);
        
        // Enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete<i class="fas fa-check ms-2"></i>';
        
        // Update upload area to show success
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div class="border border-2 border-dashed border-success rounded text-center" style="padding: 1.5rem 1rem; min-height: 120px; display: flex; flex-direction: column; justify-content: center;">
                <i class="fas fa-check-circle text-success" style="font-size: 1.5rem; margin-bottom: 0.75rem;"></i>
                <p class="text-success mb-2">Receipt Uploaded Successfully!</p>
                <button type="button" class="btn btn-outline-success btn-sm" onclick="document.getElementById('receiptFile').click()" style="min-width: 120px;">
                    Change File
                </button>
                <input type="file" id="receiptFile" class="d-none" accept="image/*" onchange="handleFileUpload(event)">
            </div>
        `;
        
        console.log('File upload completed successfully, isReceiptUploaded set to:', isReceiptUploaded);
    }
}

// Remove uploaded file
function removeFile(button, index) {
    const fileCard = button.closest('.col-md-4');
    fileCard.remove();
    
    // Check if any files remain
    const remainingFiles = document.querySelectorAll('#filePreviewContainer .col-md-4');
    if (remainingFiles.length === 0) {
        const uploadedFilesSection = document.getElementById('uploadedFiles');
        const submitBtn = document.getElementById('submitBookingBtn');
        const uploadArea = document.getElementById('uploadArea');
        
        // Hide uploaded files section
        uploadedFilesSection.style.display = 'none';
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Receipt First';
        
        // Reset upload area
        uploadArea.innerHTML = `
            <div class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                <h5 class="text-primary mb-2">Upload Receipt Photo</h5>
                <p class="text-muted mb-3">Drag and drop your receipt image here or click to browse</p>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('receiptFile').click()">
                    <i class="fas fa-camera me-2"></i>Choose Photo
                </button>
                <input type="file" id="receiptFile" class="d-none" accept="image/*" multiple onchange="handleFileUpload(event)">
                <p class="text-muted small mt-2">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
            </div>
        `;
        
        // Reset file input
        document.getElementById('receiptFile').value = '';
    }
}

// Global variable to track file upload status
let isReceiptUploaded = false;

// Submit booking with receipt
function submitBooking() {
    console.log('submitBooking function called');
    console.log('isReceiptUploaded:', isReceiptUploaded);
    
    if (!isReceiptUploaded) {
        alert('Please upload at least one receipt image before completing your booking.');
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitBookingBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    
    console.log('Starting processing...');
    
    // Simulate processing delay
    setTimeout(() => {
        console.log('Processing completed, moving to step 8');
        
        // Generate booking reference
        const bookingRef = 'TB-' + Date.now();
        
        // Hide all steps first
        document.querySelectorAll(".form-step").forEach((step) => {
            step.classList.remove("active");
        });
        
        // Show step 8 directly
        const step8 = document.getElementById('form-step-8');
        if (step8) {
            step8.classList.add('active');
            console.log('Step 8 activated');
            
            // Update booking reference in step 8
            const bookingRefElement = document.getElementById('finalBookingReference');
            if (bookingRefElement) {
                bookingRefElement.textContent = bookingRef;
                console.log('Updated booking reference:', bookingRef);
            } else {
                console.error('finalBookingReference element not found');
            }
        } else {
            console.error('form-step-8 element not found');
        }
        
        // Update current step
        currentStep = 8;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
        
        console.log('Moved to step 8');
        
        // Log booking data
        console.log('Booking submitted for staff review:', { 
            bookingReference: bookingRef,
            timestamp: new Date().toISOString()
        });
        
    }, 500);
}

// Go to home page function
function goToHomePage() {
    // Redirect to home page
    window.location.href = '../home/home.html';
}

// ----------------------------
// NAVIGATION FUNCTIONALITY
// ----------------------------

// Go back to home page
function goBackToHome() {
    window.location.href = '../home/home.html';
}

// Function to load tour data from sessionStorage on page load
function loadTourDataFromSession() {
    const completeBookingDataString = sessionStorage.getItem('completeBookingData');
    if (completeBookingDataString) {
        try {
            const bookingData = JSON.parse(completeBookingDataString);
            console.log('Loading tour data from session on page load:', bookingData);
            
            // Automatically populate the booking summary if we have booking data
            if (bookingData.bookingType === 'tour-only' || bookingData.bookingType === 'package_only') {
                // Set currentStep to 3 (booking summary) when coming from tour_only or package_only
                currentStep = 3;
                console.log(`Set currentStep to 3 for ${bookingData.bookingType} booking`);
                
                // Wait a bit for the DOM to be fully ready
                setTimeout(() => {
                    populateBookingSummary();
                    restoreBookingPageData(); // Restore any previously filled booking page data
                    showStep(currentStep); // Show the correct step
                }, 100);
            } else {
                // If no specific booking type, still initialize to step 3 by default
                currentStep = 3;
                setTimeout(() => {
                    showStep(currentStep);
                }, 100);
            }
        } catch (error) {
            console.error('Error loading tour data from session:', error);
        }
    }
}

// Function to restore booking page data that was previously filled
function restoreBookingPageData() {
    const completeBookingDataString = sessionStorage.getItem('completeBookingData');
    if (completeBookingDataString) {
        try {
            const bookingData = JSON.parse(completeBookingDataString);
            console.log('Restoring booking page data:', bookingData);
            
            // Restore payment method selection
            if (bookingData.paymentMethod) {
                const paymentRadio = document.querySelector(`input[name="paymentOption"][value="${bookingData.paymentMethod}"]`);
                if (paymentRadio) paymentRadio.checked = true;
            }
            
            // Restore payment type (full vs down payment)
            if (bookingData.fullPayment) {
                const fullPaymentRadio = document.getElementById('fullPayment');
                if (fullPaymentRadio) fullPaymentRadio.checked = true;
            }
            
            if (bookingData.downPayment) {
                const downPaymentRadio = document.getElementById('downPayment');
                if (downPaymentRadio) {
                    downPaymentRadio.checked = true;
                    // Show down payment section if down payment was selected
                    const downPaymentSection = document.getElementById('downPaymentSection');
                    if (downPaymentSection) downPaymentSection.style.display = 'block';
                }
            }
            
            // Restore down payment amount
            if (bookingData.downPaymentAmount) {
                const downPaymentAmountInput = document.getElementById('downPaymentAmount');
                if (downPaymentAmountInput) {
                    downPaymentAmountInput.value = bookingData.downPaymentAmount;
                    // Update remaining balance
                    if (typeof updateRemainingBalance === 'function') {
                        updateRemainingBalance();
                    }
                }
            }
            
            // Restore notes
            if (bookingData.notes) {
                const notesInput = document.getElementById('notes');
                if (notesInput) notesInput.value = bookingData.notes;
            }
            
            // Restore special requests
            if (bookingData.specialRequests) {
                const specialRequestsInput = document.getElementById('specialRequests');
                if (specialRequestsInput) specialRequestsInput.value = bookingData.specialRequests;
            }
            
            console.log('Booking page data restored successfully');
        } catch (error) {
            console.error('Error restoring booking page data:', error);
        }
    }
}

// Add event listener to handle modal disposal when it's closed
document.addEventListener('DOMContentLoaded', function() {
    // Load tour data from session storage when page loads
    loadTourDataFromSession();
    
    // Fallback: If currentStep is still not set after 500ms, default to step 3
    setTimeout(() => {
        if (currentStep === 0 || !currentStep) {
            currentStep = 3;
            console.log('Fallback: Setting currentStep to 3');
            showStep(currentStep);
        }
    }, 500);
    
    const paymentModal = document.getElementById('paymentQRModal');
    if (paymentModal) {
        // When modal is hidden, do aggressive cleanup
        paymentModal.addEventListener('hidden.bs.modal', function () {
            console.log('Modal hidden event triggered - cleaning up');
            
            // Dispose of the modal instance when it's fully closed
            const modalInstance = bootstrap.Modal.getInstance(paymentModal);
            if (modalInstance) {
                try {
                    modalInstance.dispose();
                    console.log('Modal instance disposed');
                } catch (e) {
                    console.log('Error disposing modal instance:', e);
                }
            }
            
            // AGGRESSIVE CLEANUP
            // Remove ALL modal backdrops (sometimes multiple can stack)
            setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                console.log('Removing backdrops:', backdrops.length);
                backdrops.forEach(backdrop => {
                    backdrop.remove();
                });
                
                // Force remove modal-open class from body
                document.body.classList.remove('modal-open');
                
                // Reset body styles
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                document.body.removeAttribute('data-bs-overflow');
                document.body.removeAttribute('data-bs-padding-right');
                
                console.log('Cleanup complete - page should be interactive now');
            }, 100);
        });
        
        // Also listen for the hide event (before hidden)
        paymentModal.addEventListener('hide.bs.modal', function () {
            console.log('Modal hide event triggered');
        });
    }
    
    // Initialize Bootstrap tooltips for the inland tour warning icon
    const inlandTourWarning = document.getElementById('inlandTourWarning');
    if (inlandTourWarning) {
        // Initialize tooltip
        const tooltip = new bootstrap.Tooltip(inlandTourWarning, {
            trigger: 'click hover focus',
            html: true
        });
        
        // Optional: Add click event to toggle tooltip
        inlandTourWarning.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent dropdown from toggling
        });
    }
});

// Expose functions globally
window.showPaymentQR = showPaymentQR;
window.confirmPayment = confirmPayment;
window.handleFileUpload = handleFileUpload;
window.removeFile = removeFile;
window.submitBooking = submitBooking;
window.goBackToHome = goBackToHome;
window.goToHomePage = goToHomePage;

// ----------------------------
// BOOKING OPTION SELECTION (STEP 2)
// ----------------------------

// Function to handle booking option selection
window.selectBookingOption = function(optionType) {
    console.log('Selected booking option:', optionType);
    
    // Store the selected option
    window.selectedBookingOption = optionType;
    
    // Get the option cards
    const packageCard = document.getElementById('packageOption');
    const tourCard = document.getElementById('tourOption');
    const optionNextBtn = document.getElementById('optionNextBtn');
    const optionMessage = document.getElementById('optionSelectedMessage');
    const optionText = document.getElementById('selectedOptionText');
    
    // Remove selected class from both cards
    if (packageCard) packageCard.classList.remove('option-selected');
    if (tourCard) tourCard.classList.remove('option-selected');
    
    // Add selected class to the chosen card
    if (optionType === 'package') {
        if (packageCard) packageCard.classList.add('option-selected');
        if (optionText) optionText.textContent = 'Package Only - Complete package with all services';
    } else if (optionType === 'tour') {
        if (tourCard) tourCard.classList.add('option-selected');
        if (optionText) optionText.textContent = 'Tour Only - Tours and activities without accommodation';
    }
    
    // Show selection message
    if (optionMessage) {
        optionMessage.classList.remove('d-none');
    }
    
    // Enable the Next button
    if (optionNextBtn) {
        optionNextBtn.disabled = false;
    }
    
    console.log('Booking option selected:', optionType);
};


