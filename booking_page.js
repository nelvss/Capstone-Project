// booking_page.js
(() => {
    // ----------------------------
    // STEP HANDLER (8-step wizard)
    // ----------------------------
    let currentStep = 1;
    const totalSteps = 8;
  
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
      const islandContainer = document.getElementById("island-tours-container");
      if (islandTours.length > 0) {
        islandList.innerHTML = "";
        islandTours.forEach(tour => {
          const li = document.createElement("li");
          li.innerHTML = `${tour.value}`;
          islandList.appendChild(li);
        });
        islandContainer.style.display = "block";
      } else {
        islandContainer.style.display = "none";
      }

      // Inland Tours
      const inlandTours = document.querySelectorAll(".inland-option:checked");
      const inlandList = document.getElementById("summary-inland-tours");
      const inlandContainer = document.getElementById("inland-tours-container");
      if (inlandTours.length > 0) {
        inlandList.innerHTML = "";
        inlandTours.forEach(tour => {
          const li = document.createElement("li");
          li.innerHTML = `${tour.value}`;
          inlandList.appendChild(li);
        });
        inlandContainer.style.display = "block";
      } else {
        inlandContainer.style.display = "none";
      }

      // Snorkeling Tours
      const snorkelTours = document.querySelectorAll(".snorkel-option:checked");
      const snorkelList = document.getElementById("summary-snorkel-tours");
      const snorkelContainer = document.getElementById("snorkel-tours-container");
      if (snorkelTours.length > 0) {
        snorkelList.innerHTML = "";
        snorkelTours.forEach(tour => {
          const li = document.createElement("li");
          li.innerHTML = `${tour.value}`;
          snorkelList.appendChild(li);
        });
        snorkelContainer.style.display = "block";
      } else {
        snorkelContainer.style.display = "none";
      }

      // Show/Hide "No tours selected" message and adjust layout
      const anyToursSelected = islandTours.length > 0 || inlandTours.length > 0 || snorkelTours.length > 0;
      const noToursMessage = document.getElementById("no-tours-message");
      const tourPackagesContainer = document.getElementById("tour-packages-container");
      
      if (anyToursSelected) {
        noToursMessage.style.display = "none";
        // Adjust column sizes based on number of selected tour types
        const visibleTourTypes = [islandTours.length > 0, inlandTours.length > 0, snorkelTours.length > 0].filter(Boolean).length;
        const colClass = visibleTourTypes === 1 ? "col-12" : visibleTourTypes === 2 ? "col-md-6" : "col-md-4";
        
        // Update column classes for responsive layout
        if (islandContainer.style.display !== "none") {
          islandContainer.className = `${colClass}`;
        }
        if (inlandContainer.style.display !== "none") {
          inlandContainer.className = `${colClass}`;
        }
        if (snorkelContainer.style.display !== "none") {
          snorkelContainer.className = `${colClass}`;
        }
      } else {
        noToursMessage.style.display = "block";
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
  
    // STEP 2 VALIDATION
    function validateStep2() {
      // Check if at least one tour option is selected from any category
      const islandOptions = document.querySelectorAll('.island-option:checked');
      const inlandOptions = document.querySelectorAll('.inland-option:checked');
      const snorkelOptions = document.querySelectorAll('.snorkel-option:checked');
      const divingOptions = document.querySelectorAll('.diving-option:checked');
      
      // Check if any option is selected
      const hasSelection = islandOptions.length > 0 || 
                          inlandOptions.length > 0 || 
                          snorkelOptions.length > 0 || 
                          divingOptions.length > 0;
      
      if (!hasSelection) {
        showStep2Error();
        return false;
      }
      
      return true;
    }
    
    function showStep2Error() {
      // Create or show error message
      let errorContainer = document.getElementById('step2-error-container');
      
      if (!errorContainer) {
        // Create error container if it doesn't exist
        errorContainer = document.createElement('div');
        errorContainer.id = 'step2-error-container';
        errorContainer.className = 'alert alert-danger mt-3';
        errorContainer.innerHTML = `
          <div class="d-flex align-items-center">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Please select at least one tour option to proceed.</strong>
          </div>
        `;
        
        // Insert the error after the form content but before navigation buttons
        const step2Form = document.querySelector('#form-step-2 .card-body');
        const navigationRow = step2Form.querySelector('.row:last-child');
        step2Form.insertBefore(errorContainer, navigationRow);
      } else {
        // Show existing error container
        errorContainer.style.display = 'block';
      }
      
      // Scroll to error message
      errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function hideStep2Error() {
      const errorContainer = document.getElementById('step2-error-container');
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }

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
  // Hotels
  wireMultiSelect("hotels-select-all", "hotels-options", "hotels-option", null);
  
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
    touristCountInput.addEventListener("input", updatePackagePrice);
    
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
function updateDaysVisibility() {
  const daysGroup = document.getElementById("daysGroup"); // Make sure to add id="daysGroup" to the days input container
  const hotelSelected = document.querySelector(".hotels-option:checked");
  
  if (daysGroup) {
    if (hotelSelected) {
      daysGroup.style.display = "block";
      calculateDuration(); // Update days when showing
    } else {
      daysGroup.style.display = "none";
      const daysInput = document.getElementById("days");
      if (daysInput) daysInput.value = ""; // Clear days when hiding
    }
  }
}

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
    // Personal Information
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('emailAddress').value;
    const contact = document.getElementById('contactNo').value;
    const arrival = document.getElementById('arrivalDate').value;
    const departure = document.getElementById('departureDate').value;
    const tourists = document.getElementById('touristCount').value;

    document.getElementById('summary-name').textContent = firstName + ' ' + lastName;
    document.getElementById('summary-email').textContent = email || '-';
    document.getElementById('summary-contact').textContent = contact || '-';
    document.getElementById('summary-arrival').textContent = formatDate(arrival) || '-';
    document.getElementById('summary-departure').textContent = formatDate(departure) || '-';
    document.getElementById('summary-tourists').textContent = tourists || '-';

    // Tour Packages
    populateTourSummary('island', 'summary-island-tours');
    populateTourSummary('inland', 'summary-inland-tours');
    populateTourSummary('snorkel', 'summary-snorkel-tours');

    // Package Amount - remove ₱ symbol from display value since it's already formatted
    const packageAmount = document.getElementById('amountOfPackage').value;
    document.getElementById('summary-package-amount').textContent = packageAmount || '₱0.00';

    // Hotel Information
    populateHotelSummary();

    // Vehicle Information
    populateVehicleSummary();

    // Diving Information
    populateDivingSummary();

    // Calculate and display total amount
    calculateTotalAmount();
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

// Function to calculate total amount for summary
function calculateTotalAmount() {
    let total = 0;
    
    // Get package amount
    const packageAmountText = document.getElementById('amountOfPackage').value;
    if (packageAmountText) {
        const packageAmount = parseFloat(packageAmountText.replace(/[₱,]/g, '')) || 0;
        total += packageAmount;
    }
    
    // Get hotel amount
    const hotelAmountText = document.getElementById('hotelPrice').value;
    if (hotelAmountText) {
        const hotelAmount = parseFloat(hotelAmountText.replace(/[₱,]/g, '')) || 0;
        total += hotelAmount;
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
    
    // Update total amount fields
    const totalAmountInput = document.getElementById('totalAmount');
    const summaryTotalElement = document.getElementById('summary-total-amount');
    
    if (total > 0) {
        const formattedTotal = `₱${total.toLocaleString()}.00`;
        if (totalAmountInput) totalAmountInput.value = formattedTotal;
        if (summaryTotalElement) summaryTotalElement.textContent = formattedTotal;
    } else {
        if (totalAmountInput) totalAmountInput.value = '';
        if (summaryTotalElement) summaryTotalElement.textContent = '₱0.00';
    }
}

function populateTourSummary(type, elementId) {
    const options = document.querySelectorAll(`.${type}-option:checked`);
    const summaryElement = document.getElementById(elementId);
    
    if (options.length > 0) {
        summaryElement.innerHTML = '';
        options.forEach(option => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>${option.value}`;
            summaryElement.appendChild(li);
        });
    } else {
        const typeDisplay = type === 'island' ? 'island' : type === 'inland' ? 'inland' : 'snorkeling';
        summaryElement.innerHTML = `<li class="text-muted">No ${typeDisplay} tours selected</li>`;
    }
}

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

function populateVehicleSummary() {
    const vehicleOptions = document.querySelectorAll('.rental-option:checked');
    const vehicleSection = document.getElementById('vehicle-section');
    
    if (vehicleOptions.length > 0) {
        vehicleSection.style.display = 'block';
        
        // Display all selected vehicles
        const selectedVehicles = Array.from(vehicleOptions).map(option => option.value);
        document.getElementById('summary-vehicle').textContent = selectedVehicles.join(', ');
        
        // Get vehicle rental days - you may need to add this input field
        document.getElementById('summary-vehicle-days').textContent = '-';
        
        const vehicleAmount = document.getElementById('amountOfVehicle').value;
        document.getElementById('summary-vehicle-amount').textContent = vehicleAmount || '₱0.00';
    } else {
        vehicleSection.style.display = 'none';
    }
}

function populateDivingSummary() {
    const divingOptions = document.querySelectorAll('.diving-option:checked');
    const divingSection = document.getElementById('diving-section');
    
    if (divingOptions.length > 0) {
        divingSection.style.display = 'block';
        
        const divers = document.getElementById('numberOfDiver').value;
        document.getElementById('summary-divers').textContent = divers || '-';
        
        const divingAmount = document.getElementById('amountOfDiving').value;
        document.getElementById('summary-diving-amount').textContent = divingAmount || '₱0.00';
    } else {
        divingSection.style.display = 'none';
    }
}

// ----------------------------
// PAYMENT OPTIONS FUNCTIONALITY
// ----------------------------

function setupPaymentOptions() {
    // Get the total amount from the summary
    const summaryTotalElement = document.getElementById('summary-total-amount');
    const paymentTotalElement = document.getElementById('payment-total-amount');
    
    if (summaryTotalElement && paymentTotalElement) {
        const totalAmount = summaryTotalElement.textContent;
        paymentTotalElement.textContent = totalAmount;
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
                
                // Set default down payment to minimum (1000)
                downPaymentAmountInput.value = 1000;
                updateRemainingBalance();
            }
        });
        
        // Update remaining balance when down payment amount changes
        if (downPaymentAmountInput) {
            downPaymentAmountInput.addEventListener('input', updateRemainingBalance);
        }
    }
}

function updateRemainingBalance() {
    const paymentTotalElement = document.getElementById('payment-total-amount');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    const remainingBalanceElement = document.getElementById('remainingBalance');
    
    if (paymentTotalElement && downPaymentAmountInput && remainingBalanceElement) {
        const totalText = paymentTotalElement.textContent.replace(/[₱,]/g, '');
        const totalAmount = parseFloat(totalText) || 0;
        const downPaymentAmount = parseFloat(downPaymentAmountInput.value) || 0;
        
        // Validate minimum down payment
        if (downPaymentAmount < 1000 && downPaymentAmount > 0) {
            downPaymentAmountInput.value = 1000;
        }
        
        // Calculate remaining balance
        const remainingAmount = totalAmount - (parseFloat(downPaymentAmountInput.value) || 0);
        remainingBalanceElement.textContent = `₱${remainingAmount.toLocaleString()}.00`;
    }
}

// Expose payment validation function
window.validatePaymentOptions = function() {
    const downPaymentRadio = document.getElementById('downPayment');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    
    if (downPaymentRadio && downPaymentRadio.checked) {
        const downPaymentAmount = parseFloat(downPaymentAmountInput.value) || 0;
        
        if (downPaymentAmount < 1000) {
            alert('Please enter a down payment of at least ₱1,000.');
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
    const method = paymentMethods[paymentType];
    if (!method) return;
    
    // Update modal content based on payment method
    const modal = document.getElementById('paymentQRModal');
    const modalTitle = document.getElementById('paymentQRModalLabel');
    const paymentIcon = document.getElementById('paymentIcon');
    const paymentMethodName = document.getElementById('paymentMethodName');
    const modalPaymentAmount = document.getElementById('modalPaymentAmount');
    const instructionApp = document.getElementById('instructionApp');
    
    // Set payment method details
    modalTitle.innerHTML = `<i class="fas fa-qrcode me-2"></i>${method.name} Payment`;
    paymentIcon.className = `${method.icon} fa-3x`;
    paymentIcon.style.color = method.color;
    paymentMethodName.textContent = method.name;
    paymentMethodName.style.color = method.color;
    instructionApp.textContent = method.app;
    
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
    
    modalPaymentAmount.textContent = amountToPay;
    
    // Generate QR code placeholder (in real implementation, you'd generate actual QR code)
    generateQRCodePlaceholder(method, amountToPay);
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Generate QR code placeholder
function generateQRCodePlaceholder(method, amount) {
    const qrContainer = document.querySelector('.qr-code-container');
    
    // In a real implementation, you would generate an actual QR code here
    // For now, we'll show a styled placeholder
    qrContainer.innerHTML = `
        <div class="text-center">
            <div style="width: 160px; height: 160px; background: linear-gradient(45deg, #f0f0f0 25%, #fff 25%, #fff 75%, #f0f0f0 75%), linear-gradient(45deg, #f0f0f0 25%, #fff 25%, #fff 75%, #f0f0f0 75%); background-size: 20px 20px; background-position: 0 0, 10px 10px; border: 2px solid ${method.color}; margin: 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <div>
                    <i class="${method.icon}" style="font-size: 2rem; color: ${method.color}; margin-bottom: 8px;"></i>
                    <div style="font-size: 0.7rem; color: #666; font-weight: bold;">${method.name}</div>
                    <div style="font-size: 0.6rem; color: #888;">${amount}</div>
                </div>
            </div>
            <p class="text-muted small mt-2 mb-0">Scan to pay with ${method.app}</p>
        </div>
    `;
}

// Confirm payment completion
function confirmPayment() {
    // Show success message
    if (confirm('Have you completed the payment successfully?')) {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentQRModal'));
        modal.hide();
        
        // Store payment method info for receipt page
        const paymentMethodName = document.getElementById('paymentMethodName').textContent;
        const paidAmount = document.getElementById('modalPaymentAmount').textContent;
        
        // Move to receipt upload step
        currentStep = 6;
        setupReceiptUpload(paymentMethodName, paidAmount);
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
        
        console.log('Moving to receipt upload page');
    }
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
    window.location.href = 'home.html';
}

// ----------------------------
// NAVIGATION FUNCTIONALITY
// ----------------------------

// Go back to home page
function goBackToHome() {
    window.location.href = 'home.html';
}

// Expose functions globally
window.showPaymentQR = showPaymentQR;
window.confirmPayment = confirmPayment;
window.handleFileUpload = handleFileUpload;
window.removeFile = removeFile;
window.submitBooking = submitBooking;
window.goBackToHome = goBackToHome;
window.goToHomePage = goToHomePage;


