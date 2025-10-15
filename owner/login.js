// Login User

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginButton = document.getElementById('loginButton');

    // Show loading state
    loginButton.classList.add('loading');
    loginButton.disabled = true;

    const ownerUser = { email : "owner@example.com", password : "owner123"  };
    const staffUser = { email : "staff@example.com", password : "staff123"  };

    // Simulate loading delay for better UX
    setTimeout(() => {
        if (email === ownerUser.email && password === ownerUser.password) {
            // Store owner session
            localStorage.setItem('userSession', JSON.stringify({
                type: 'owner',
                email: email,
                loginTime: new Date().toISOString()
            }));
            // Successful login - redirect to owner dashboard
            window.location.href = 'dashboard.html';
        }
        else if (email === staffUser.email && password === staffUser.password) {
            // Store staff session
            localStorage.setItem('userSession', JSON.stringify({
                type: 'staff',
                email: email,
                loginTime: new Date().toISOString()
            }));
            // Successful login - redirect to staff dashboard
            window.location.href = '../staff/staff_dashboard.html';
        }
        else {
            // Invalid credentials - remove loading state and show error
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
    }, 1500); // 1.5 second loading delay
}

// Forgot Password Function
function handleForgotPassword(event) {
    event.preventDefault();
    alert('Please contact the administrator to reset your password.\n\nOwner credentials: email: owner@example.com, password: owner123\nStaff credentials: email: staff@example.com, password: staff123');
}
