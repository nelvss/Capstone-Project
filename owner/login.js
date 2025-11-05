// Login User

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginButton = document.getElementById('loginButton');

    // Show loading state
    loginButton.classList.add('loading');
    loginButton.disabled = true;

    try {
        // Call Express API for authentication
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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

        // Redirect based on role
        if (data.user.role === 'owner') {
            window.location.href = 'dashboard.html';
        } else if (data.user.role === 'staff') {
            window.location.href = '../staff/staff_dashboard.html';
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
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            emailField.classList.remove('error');
            passwordField.classList.remove('error');
        }, 3000);
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

// Forgot Password Function
function handleForgotPassword(event) {
    event.preventDefault();
    alert('Please contact the administrator to reset your password.\n\nOwner credentials: email: owner@example.com, password: owner123\nStaff credentials: email: staff@example.com, password: staff123');
}
