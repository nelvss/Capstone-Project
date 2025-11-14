// booking_form.js - Standalone Booking Form JavaScript
(() => {
    // ----------------------------
    // VALIDATION UTILITIES
    // ----------------------------
    
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

    // ----------------------------
    // FORM VALIDATION
    // ----------------------------
    
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

        // Contact: numeric only (no length restriction)
        const digits = contactNo.value.replace(/\D/g, "");
        if (!digits) {
            setError(contactNo, `${FIELD_LABELS.contactNo} is required.`);
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

    // ----------------------------
    // NAVIGATION FUNCTIONS
    // ----------------------------
    
    window.goBackToHome = function() {
        window.location.href = '../home/home.html';
    };

    window.nextStep = function() {
        // Validate form before proceeding
        const isValid = validateStep1();
        if (!isValid) {
            console.log("Form validation failed");
            const firstInvalid = document.querySelector(".form-control.is-invalid");
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        console.log("Form is valid, proceeding to next step");

        // Store form data in sessionStorage
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            emailAddress: document.getElementById('emailAddress').value,
            contactNo: document.getElementById('contactNo').value,
            arrivalDate: document.getElementById('arrivalDate').value,
            departureDate: document.getElementById('departureDate').value
        };
        
        sessionStorage.setItem('bookingFormData', JSON.stringify(formData));
        
        // Redirect to option page (booking_page.html starting at step 2)
        window.location.href = '../option/option_page.html';
    };

    // ----------------------------
    // FORM ENHANCEMENTS
    // ----------------------------
    
    // Auto-format contact number as user types
    const contactNoInput = document.getElementById('contactNo');
    if (contactNoInput) {
        contactNoInput.addEventListener('input', function() {
            // Remove all non-numeric characters
            let value = this.value.replace(/\D/g, '');
            
            // Update input value (no length restriction)
            this.value = value;
            
            // Clear error if user has typed something valid
            if (value.length > 0) {
                setError(this, "");
            }
        });

        // Prevent non-numeric input
        contactNoInput.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) {
                e.preventDefault();
            }
        });
    }

    // Clear errors on input for other fields
    ['firstName', 'lastName', 'emailAddress', 'arrivalDate', 'departureDate'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (this.value.trim() !== "") {
                    setError(this, "");
                }
            });
        }
    });

    // Set minimum date for arrival and departure to today
    const today = new Date().toISOString().split('T')[0];
    const arrivalDateInput = document.getElementById('arrivalDate');
    const departureDateInput = document.getElementById('departureDate');
    
    if (arrivalDateInput) {
        arrivalDateInput.setAttribute('min', today);
        
        // When arrival date changes, update minimum departure date
        arrivalDateInput.addEventListener('change', function() {
            if (departureDateInput && this.value) {
                const arrivalDate = new Date(this.value);
                const minDepartureDate = new Date(arrivalDate);
                minDepartureDate.setDate(arrivalDate.getDate() + 1);
                
                departureDateInput.setAttribute('min', minDepartureDate.toISOString().split('T')[0]);
                
                // Clear departure date if it's now invalid
                if (departureDateInput.value && new Date(departureDateInput.value) <= arrivalDate) {
                    departureDateInput.value = '';
                }
            }
            
            // Clear error when date is selected
            if (this.value) {
                setError(this, "");
            }
        });
    }
    
    if (departureDateInput) {
        departureDateInput.setAttribute('min', today);
        
        departureDateInput.addEventListener('change', function() {
            // Clear error when date is selected
            if (this.value) {
                setError(this, "");
            }
        });
    }

    // ----------------------------
    // INITIALIZATION
    // ----------------------------
    
    // Load any existing form data from sessionStorage (in case user returns to this page)
    function loadExistingFormData() {
        const formDataString = sessionStorage.getItem('bookingFormData');
        if (formDataString) {
            try {
                const formData = JSON.parse(formDataString);
                
                // Populate form fields
                Object.keys(formData).forEach(key => {
                    const input = document.getElementById(key);
                    if (input && formData[key]) {
                        input.value = formData[key];
                    }
                });
                
                console.log('Loaded existing form data:', formData);
            } catch (error) {
                console.error('Error loading form data:', error);
            }
        }
    }

    // Initialize the form
    document.addEventListener('DOMContentLoaded', function() {
        loadExistingFormData();
        console.log("Booking form initialized successfully!");
    });

})();
