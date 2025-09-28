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
      
      if (currentStep < totalSteps) {
        currentStep++;
        
        // When moving to step 3, populate the summary
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
<<<<<<< HEAD

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

=======
>>>>>>> 0f28e4bf89575cc017693aeeadfda312e83ab22b

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
