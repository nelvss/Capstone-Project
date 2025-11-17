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
        alert(error.message || 'Login failed. Please check your credentials.');
        
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
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const registerButton = document.getElementById('registerButton');

    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        document.getElementById('registerPassword').classList.add('error');
        document.getElementById('confirmPassword').classList.add('error');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        document.getElementById('registerPassword').classList.add('error');
        return;
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
            body: JSON.stringify({ email, password })
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
        const passwordField = document.getElementById('registerPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        
        emailField.classList.add('error');
        passwordField.classList.add('error');
        confirmPasswordField.classList.add('error');
        
        // Show error message
        alert(error.message || 'Registration failed. Please try again.');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            emailField.classList.remove('error');
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
}

function switchToLogin(event) {
    event.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('headerText').textContent = 'Sign in to your account';
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
}

// Forgot Password Function
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    const forgotPasswordButton = document.getElementById('forgotPasswordButton');

    if (!email) {
        alert('Please enter your email address.');
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
        alert('Verification code has been sent to your email. Please check your inbox.');
        
        // Redirect to verify code page with email
        window.location.href = `verify-code.html?email=${encodeURIComponent(email)}`;

    } catch (error) {
        console.error('Forgot password error:', error);
        
        // Remove loading state
        forgotPasswordButton.classList.remove('loading');
        forgotPasswordButton.disabled = false;
        
        // Add visual feedback for error
        const emailField = document.getElementById('forgotEmail');
        emailField.classList.add('error');
        
        // Show error message
        alert(error.message || 'Failed to send reset link. Please try again.');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            emailField.classList.remove('error');
        }, 3000);
    }
}

// Check URL parameters on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'register') {
        switchToRegister({ preventDefault: () => {} });
    }
});
