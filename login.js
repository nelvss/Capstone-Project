// Login User

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginButton = document.getElementById('loginButton');

    // Show loading state
    loginButton.classList.add('loading');
    loginButton.disabled = true;

    const ownerUser = { username : "owner", password : "owner123"  };
    const staffUser = { username : "staff", password : "staff123"  };

    // Simulate loading delay for better UX
    setTimeout(() => {
        if (username === ownerUser.username && password === ownerUser.password) {
            // Successful login - redirect to dashboard
            window.location.href = 'dashboard.html';
        }
        else if (username === staffUser.username && password === staffUser.password) {
            // Successful login - redirect to dashboard
            window.location.href = 'staff_dashboard.html';
        }
        else {
            // Invalid credentials - remove loading state and show error
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
            
            // Add visual feedback for error
            const usernameField = document.getElementById('username');
            const passwordField = document.getElementById('password');
            
            usernameField.classList.add('error');
            passwordField.classList.add('error');
            
            // Remove error styling after 3 seconds
            setTimeout(() => {
                usernameField.classList.remove('error');
                passwordField.classList.remove('error');
            }, 3000);
        }
    }, 1500); // 1.5 second loading delay
}

// Forgot Password Function
function handleForgotPassword(event) {
    event.preventDefault();
    alert('Please contact the administrator to reset your password.\n\nOwner credentials: username: owner, password: owner123\nStaff credentials: username: staff, password: staff123');
}
