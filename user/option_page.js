// option_page.js

// Function to handle option selection
function selectOption(optionType) {
    console.log('Selected option:', optionType);
    
    // Store the selected option in sessionStorage
    sessionStorage.setItem('bookingOption', optionType);
    
    // Add visual feedback
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(card => {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
    });
    
    // Show loading state
    const selectedCard = event.currentTarget;
    selectedCard.style.opacity = '1';
    
    const button = selectedCard.querySelector('.btn-select');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
    
    // Redirect to booking page after a short delay
    setTimeout(() => {
        if (optionType === 'package') {
            // Redirect to full booking page with all options
            window.location.href = 'booking_page.html?option=package';
        } else if (optionType === 'tour') {
            // Redirect to booking page with tour-only mode
            window.location.href = 'booking_page.html?option=tour';
        }
    }, 1000);
}

// Function to go back to home page
function goBackToHome() {
    window.location.href = 'home.html';
}

// Add hover effects and animations on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Option page loaded');
    
    // Add entrance animation
    const cards = document.querySelectorAll('.option-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Add ripple effect on card click
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.pointerEvents = 'none';
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.transform = 'translate(-50%, -50%)';
            
            card.appendChild(ripple);
            
            ripple.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: 'translate(-50%, -50%) scale(20)', opacity: 0 }
            ], {
                duration: 600,
                easing: 'ease-out'
            });
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === '1') {
            selectOption('package');
        } else if (e.key === '2') {
            selectOption('tour');
        } else if (e.key === 'Escape') {
            goBackToHome();
        }
    });
    
    // Show keyboard shortcuts hint
    console.log('Keyboard shortcuts:');
    console.log('Press 1 for Package Only');
    console.log('Press 2 for Tour Only');
    console.log('Press ESC to go back');
});
