// Verify Code Function
async function handleVerifyCode(event) {
    event.preventDefault();

    const email = document.getElementById('verifyEmail').value.trim().toLowerCase();
    const code = document.getElementById('verificationCode').value.trim();
    const verifyCodeButton = document.getElementById('verifyCodeButton');

    if (!email) {
        alert('Email is required.');
        return;
    }

    if (!code || code.length !== 6) {
        alert('Please enter a valid 6-digit verification code.');
        document.getElementById('verificationCode').classList.add('error');
        return;
    }

    // Show loading state
    verifyCodeButton.classList.add('loading');
    verifyCodeButton.disabled = true;

    try {
        // Call Express API to verify code
        const base = (window.API_URL && window.API_URL.length > 0) ? window.API_URL : 'https://api.otgpuertogaleratravel.com';
        const response = await fetch(`${base}/api/verify-reset-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to verify code');
        }

        // Show success message
        alert('Code verified successfully! Redirecting to password reset page...');
        
        // Redirect to reset password page with session token
        window.location.href = `reset-password.html?token=${encodeURIComponent(data.token)}`;

    } catch (error) {
        console.error('Verify code error:', error);
        
        // Remove loading state
        verifyCodeButton.classList.remove('loading');
        verifyCodeButton.disabled = false;
        
        // Add visual feedback for error
        const codeField = document.getElementById('verificationCode');
        codeField.classList.add('error');
        
        // Show error message
        alert(error.message || 'Invalid or expired verification code. Please try again or request a new code.');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
            codeField.classList.remove('error');
        }, 3000);
    }
}

// Resend Code Function
async function handleResendCode(event) {
    event.preventDefault();

    const email = document.getElementById('verifyEmail').value.trim().toLowerCase();

    if (!email) {
        alert('Email is required.');
        return;
    }

    const resendLink = event.target;
    const originalText = resendLink.textContent;
    resendLink.textContent = 'Sending...';
    resendLink.style.pointerEvents = 'none';

    try {
        // Call Express API to resend code
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
            throw new Error(data.message || 'Failed to resend code');
        }

        // Show success message
        alert('A new verification code has been sent to your email. Please check your inbox.');

    } catch (error) {
        console.error('Resend code error:', error);
        alert(error.message || 'Failed to resend code. Please try again.');
    } finally {
        resendLink.textContent = originalText;
        resendLink.style.pointerEvents = 'auto';
    }
}

// Initialize page - Get email from URL params
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    if (email) {
        document.getElementById('verifyEmail').value = email;
    } else {
        // If no email in URL, redirect back to login
        alert('Email is required. Redirecting to login page...');
        window.location.href = 'login.html';
    }
});

// Auto-format code input (only numbers, max 6 digits)
document.addEventListener('DOMContentLoaded', function() {
    const codeInput = document.getElementById('verificationCode');
    
    codeInput.addEventListener('input', function(e) {
        // Remove any non-numeric characters
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        
        // Limit to 6 digits
        if (e.target.value.length > 6) {
            e.target.value = e.target.value.slice(0, 6);
        }
    });
    
    // Focus on code input when page loads
    if (codeInput) {
        setTimeout(() => {
            codeInput.focus();
        }, 100);
    }
});

