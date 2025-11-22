// Login User

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const loginButton = document.getElementById('loginButton');

    // Show loading state
    loginButton.classList.add('loading');
    loginButton.disabled = true;

    try {
        // Call Express API for authentication
        const base = (window.API_URL && window.API_URL.length > 0) ? window.API_URL : 'https://api.otgpuertogaleratravel.com';
        const response = await fetch(`${base}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed');
        }

        // Store user session
        localStorage.setItem('userSession', JSON.stringify({
            type: data.user.role,
            email: data.user.email,
            userId: data.user.id,
            firstName: data.user.firstName || null,
            lastName: data.user.lastName || null,
            contactNumber: data.user.contactNumber || null,
            loginTime: data.user.loginTime
        }));

        // Check for return URL (redirect after login)
        const returnUrl = sessionStorage.getItem('returnUrl');
        sessionStorage.removeItem('returnUrl');

        // Redirect based on role
        if (data.user.role === 'owner') {
            window.location.href = 'dashboard.html';
        } else if (data.user.role === 'staff') {
            window.location.href = '../staff/staff_dashboard.html';
        } else if (data.user.role === 'customer') {
            // Redirect customers to return URL or home page
            if (returnUrl) {
                window.location.href = returnUrl;
            } else {
                window.location.href = '../user/home/home.html';
            }
        } else {
            throw new Error('Invalid user role');
        }

    } catch (error) {
        console.error('Login error:', error);
        
        // Remove loading state and show error
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
        
        // Add visual feedback for error
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        emailField.classList.add('error');
        passwordField.classList.add('error');
        
        // Show error message
        showErrorModal('Login Error', error.message || 'Login failed. Please check your credentials.');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            emailField.classList.remove('error');
            passwordField.classList.remove('error');
        }, 3000);
    }
}

// Register User
async function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const firstName = document.getElementById('registerFirstName').value.trim();
    const lastName = document.getElementById('registerLastName').value.trim();
    const contactNumber = document.getElementById('registerContactNumber').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const registerButton = document.getElementById('registerButton');

    // Validate required fields
    if (!firstName) {
        showErrorModal('Validation Error', 'First Name is required.');
        document.getElementById('registerFirstName').classList.add('error');
        return;
    }

    if (!lastName) {
        showErrorModal('Validation Error', 'Last Name is required.');
        document.getElementById('registerLastName').classList.add('error');
        return;
    }

    if (!contactNumber) {
        showErrorModal('Validation Error', 'Contact Number is required.');
        document.getElementById('registerContactNumber').classList.add('error');
        return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        showErrorModal('Validation Error', 'Passwords do not match. Please try again.');
        document.getElementById('registerPassword').classList.add('error');
        document.getElementById('confirmPassword').classList.add('error');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showErrorModal('Validation Error', 'Password must be at least 6 characters long.');
        document.getElementById('registerPassword').classList.add('error');
        return;
    }

    // Validate terms and conditions
    const acceptTerms = document.getElementById('acceptTerms');
    if (!acceptTerms.checked) {
        showErrorModal('Validation Error', 'You must agree to the Terms and Conditions to create an account.');
        acceptTerms.classList.add('error');
        const termsWrapper = acceptTerms.closest('.terms-checkbox-wrapper');
        if (termsWrapper) {
            termsWrapper.classList.add('error');
        }
        const termsError = document.getElementById('termsError');
        if (termsError) {
            termsError.textContent = 'You must agree to the Terms and Conditions.';
        }
        return;
    }

    // Clear terms error if checkbox is checked
    acceptTerms.classList.remove('error');
    const termsWrapper = acceptTerms.closest('.terms-checkbox-wrapper');
    if (termsWrapper) {
        termsWrapper.classList.remove('error');
    }
    const termsError = document.getElementById('termsError');
    if (termsError) {
        termsError.textContent = '';
    }

    // Show loading state
    registerButton.classList.add('loading');
    registerButton.disabled = true;

    try {
        // Call Express API for registration
        const base = (window.API_URL && window.API_URL.length > 0) ? window.API_URL : 'https://api.otgpuertogaleratravel.com';
        const response = await fetch(`${base}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, firstName, lastName, contactNumber })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store user session
        localStorage.setItem('userSession', JSON.stringify({
            type: data.user.role,
            email: data.user.email,
            userId: data.user.id,
            firstName: data.user.firstName || null,
            lastName: data.user.lastName || null,
            contactNumber: data.user.contactNumber || null,
            loginTime: data.user.loginTime
        }));

        // Check for return URL
        const returnUrl = sessionStorage.getItem('returnUrl');
        sessionStorage.removeItem('returnUrl');

        // Redirect customers to return URL or home page
        if (returnUrl) {
            window.location.href = returnUrl;
        } else {
            window.location.href = '../user/home/home.html';
        }

    } catch (error) {
        console.error('Registration error:', error);
        
        // Remove loading state and show error
        registerButton.classList.remove('loading');
        registerButton.disabled = false;
        
        // Add visual feedback for error
        const emailField = document.getElementById('registerEmail');
        const firstNameField = document.getElementById('registerFirstName');
        const lastNameField = document.getElementById('registerLastName');
        const contactNumberField = document.getElementById('registerContactNumber');
        const passwordField = document.getElementById('registerPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        
        emailField.classList.add('error');
        firstNameField.classList.add('error');
        lastNameField.classList.add('error');
        contactNumberField.classList.add('error');
        passwordField.classList.add('error');
        confirmPasswordField.classList.add('error');
        
        // Show error message
        showErrorModal('Registration Error', error.message || 'Registration failed. Please try again.');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            emailField.classList.remove('error');
            firstNameField.classList.remove('error');
            lastNameField.classList.remove('error');
            contactNumberField.classList.remove('error');
            passwordField.classList.remove('error');
            confirmPasswordField.classList.remove('error');
        }, 3000);
    }
}

// Switch between login and register forms
function switchToRegister(event) {
    event.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('headerText').textContent = 'Create your account';
    updateBackArrowBehavior();
}

function switchToLogin(event) {
    event.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('headerText').textContent = 'Sign in to your account';
    updateBackArrowBehavior();
}

// Password toggle functions for registration form
function toggleRegisterPasswordVisibility() {
    const passwordInput = document.getElementById('registerPassword');
    const toggleIcon = document.getElementById('registerPasswordToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
        toggleIcon.classList.add('active');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
        toggleIcon.classList.remove('active');
    }
}

function toggleConfirmPasswordVisibility() {
    const passwordInput = document.getElementById('confirmPassword');
    const toggleIcon = document.getElementById('confirmPasswordToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
        toggleIcon.classList.add('active');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
        toggleIcon.classList.remove('active');
    }
}

// Password Toggle Function
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
        toggleIcon.classList.add('active');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
        toggleIcon.classList.remove('active');
    }
}

// Switch to Forgot Password Form
function switchToForgotPassword(event) {
    event.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('headerText').textContent = 'Reset your password';
    updateBackArrowBehavior();
}

// Handle back arrow button click
function handleBackArrow(event) {
    event.preventDefault();
    
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Check which form is currently visible
    const isRegisterVisible = registerForm.style.display === 'block';
    const isForgotPasswordVisible = forgotPasswordForm.style.display === 'block';
    const isLoginVisible = !isRegisterVisible && !isForgotPasswordVisible;
    
    // If login form is visible, go to home page
    if (isLoginVisible) {
        window.location.href = '../user/home/home.html';
    }
    // If register or forgot password form is visible, go back to login form
    else if (isRegisterVisible || isForgotPasswordVisible) {
        switchToLogin(event);
    }
}

// Update back arrow behavior based on current form
function updateBackArrowBehavior() {
    const backArrowBtn = document.getElementById('backArrowBtn');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Check which form is currently visible
    const isRegisterVisible = registerForm.style.display === 'block';
    const isForgotPasswordVisible = forgotPasswordForm.style.display === 'block';
    const isLoginVisible = !isRegisterVisible && !isForgotPasswordVisible;
    
    // If login form is visible, set title to "Back to Home"
    if (isLoginVisible) {
        backArrowBtn.title = 'Back to Home';
    }
    // If register or forgot password form is visible, set title to "Back to Login"
    else if (isRegisterVisible || isForgotPasswordVisible) {
        backArrowBtn.title = 'Back to Login';
    }
}

// Forgot Password Function
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    const forgotPasswordButton = document.getElementById('forgotPasswordButton');

    if (!email) {
        showErrorModal('Validation Error', 'Please enter your email address.');
        return;
    }

    // Show loading state
    forgotPasswordButton.classList.add('loading');
    forgotPasswordButton.disabled = true;

    try {
        // Call Express API for forgot password
        const base = (window.API_URL && window.API_URL.length > 0) ? window.API_URL : 'https://api.otgpuertogaleratravel.com';
        const response = await fetch(`${base}/api/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to send reset link');
        }

        // Show success message
        showSuccessModal('Success', 'Verification code has been sent to your email. Please check your inbox.').then(() => {
          // Redirect to verify code page with email
          window.location.href = `verify-code.html?email=${encodeURIComponent(email)}`;
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        
        // Remove loading state
        forgotPasswordButton.classList.remove('loading');
        forgotPasswordButton.disabled = false;
        
        // Add visual feedback for error
        const emailField = document.getElementById('forgotEmail');
        emailField.classList.add('error');
        
        // Show error message
        showErrorModal('Error', error.message || 'Failed to send reset link. Please try again.');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            emailField.classList.remove('error');
        }, 3000);
    }
}

// Show Terms and Conditions Modal
function showTermsModal(event) {
    event.preventDefault();
    
    // Remove existing terms modal if any
    const existingModal = document.getElementById('termsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="termsModal" tabindex="-1" aria-labelledby="termsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title" id="termsModalLabel">
                <i class="fas fa-file-contract me-2"></i>Terms and Conditions
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" style="max-height: 500px; overflow-y: auto; text-align: left;">
              <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
              <hr>
              <h5>1. Acceptance of Terms</h5>
              <p>By creating an account, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.</p>
              
              <h5>2. Account Registration</h5>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              
              <h5>3. User Responsibilities</h5>
              <p>You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.</p>
              
              <h5>4. Booking and Cancellation</h5>
              <p>All bookings are subject to availability and our cancellation policy. Please review booking details carefully before confirming.</p>
              
              <h5>5. Privacy</h5>
              <p>Your personal information will be handled in accordance with our Privacy Policy. By using our service, you consent to the collection and use of your information as described.</p>
              
              <h5>6. Limitation of Liability</h5>
              <p>We are not liable for any indirect, incidental, special, or consequential damages arising from your use of our service.</p>
              
              <h5>7. Changes to Terms</h5>
              <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </div>
            <div class="modal-footer justify-content-center">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="termsModalOkBtn">
                <i class="fas fa-check me-1"></i>I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('termsModal');
    const modal = new bootstrap.Modal(modalElement);

    // Focus OK button when modal is shown
    modalElement.addEventListener('shown.bs.modal', () => {
      document.getElementById('termsModalOkBtn').focus();
    });

    // Clean up when modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
    });

    // Show modal
    modal.show();
}

// Check URL parameters on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    // Initialize back arrow behavior
    updateBackArrowBehavior();
    
    // Clear terms error when checkbox is checked
    const acceptTermsCheckbox = document.getElementById('acceptTerms');
    if (acceptTermsCheckbox) {
        acceptTermsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                this.classList.remove('error');
                const termsError = document.getElementById('termsError');
                if (termsError) {
                    termsError.textContent = '';
                }
                const wrapper = this.closest('.terms-checkbox-wrapper');
                if (wrapper) {
                    wrapper.classList.remove('error');
                }
            }
        });
    }
    
    if (mode === 'register') {
        switchToRegister({ preventDefault: () => {} });
    }
});
