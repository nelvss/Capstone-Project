// Reset Password Function
async function handleResetPassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();
    const resetPasswordButton = document.getElementById('resetPasswordButton');

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
        alert('Passwords do not match. Please try again.');
        document.getElementById('newPassword').classList.add('error');
        document.getElementById('confirmNewPassword').classList.add('error');
        return;
    }

    // Validate password length
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long.');
        document.getElementById('newPassword').classList.add('error');
        return;
    }

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('Invalid reset link. Please request a new password reset.');
        window.location.href = 'login.html';
        return;
    }

    // Show loading state
    resetPasswordButton.classList.add('loading');
    resetPasswordButton.disabled = true;

    try {
        // Call Express API for password reset
        const base = (window.API_URL && window.API_URL.length > 0) ? window.API_URL : 'https://api.otgpuertogaleratravel.com';
        const response = await fetch(`${base}/api/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ token, password: newPassword })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to reset password');
        }

        // Show success message
        alert('Password has been reset successfully! You can now login with your new password.');
        
        // Redirect to login page
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Reset password error:', error);
        
        // Remove loading state
        resetPasswordButton.classList.remove('loading');
        resetPasswordButton.disabled = false;
        
        // Add visual feedback for error
        const newPasswordField = document.getElementById('newPassword');
        const confirmNewPasswordField = document.getElementById('confirmNewPassword');
        
        newPasswordField.classList.add('error');
        confirmNewPasswordField.classList.add('error');
        
        // Show error message
        alert(error.message || 'Failed to reset password. The link may have expired. Please request a new one.');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            newPasswordField.classList.remove('error');
            confirmNewPasswordField.classList.remove('error');
        }, 3000);
    }
}

// Password toggle functions
function toggleNewPasswordVisibility() {
    const passwordInput = document.getElementById('newPassword');
    const toggleIcon = document.getElementById('newPasswordToggle');
    
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

function toggleConfirmNewPasswordVisibility() {
    const passwordInput = document.getElementById('confirmNewPassword');
    const toggleIcon = document.getElementById('confirmNewPasswordToggle');
    
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

// Check if token exists on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        alert('Invalid reset link. Please request a new password reset.');
        window.location.href = 'login.html';
    }
});

