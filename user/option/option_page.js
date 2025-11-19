// option_page.js - Standalone Option Page JavaScript
(() => {
    // ----------------------------
    // OPTION SELECTION FUNCTIONS
    // ----------------------------
    
    window.selectBookingOption = function(optionType) {
        console.log('Selected booking option:', optionType);
        
        // Store the selected option
        window.selectedBookingOption = optionType;
        
        // Get the option cards
        const packageCard = document.getElementById('packageOption');
        const tourCard = document.getElementById('tourOption');
        const optionNextBtn = document.getElementById('optionNextBtn');
        const optionMessage = document.getElementById('optionSelectedMessage');
        const optionText = document.getElementById('selectedOptionText');
        
        // Remove selected class from both cards
        if (packageCard) packageCard.classList.remove('option-selected');
        if (tourCard) tourCard.classList.remove('option-selected');
        
        // Add selected class to the chosen card
        if (optionType === 'package') {
            if (packageCard) packageCard.classList.add('option-selected');
            if (optionText) optionText.textContent = 'Package Only - Complete package with all services';
        } else if (optionType === 'tour') {
            if (tourCard) tourCard.classList.add('option-selected');
            if (optionText) optionText.textContent = 'Tour Only - Tours and activities without accommodation';
        }
        
        // Show selection message
        if (optionMessage) {
            optionMessage.classList.remove('d-none');
        }
        
        // Enable the Next button
        if (optionNextBtn) {
            optionNextBtn.disabled = false;
        }
        
        console.log('Booking option selected:', optionType);
    };
    
    // Navigation function to proceed to next step
    window.proceedToBooking = function() {
        if (!window.selectedBookingOption) {
            showErrorModal('Validation Error', 'Please select a booking option first.');
            return;
        }
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem('bookingOption', window.selectedBookingOption);
        
        // Redirect based on option
        if (window.selectedBookingOption === 'tour') {
            window.location.href = '../tour/tour_only.html';
        } else {
            window.location.href = '../package/package_only.html';
        }
    };
    
    // Function to go back to home page
    window.goBackToHome = function() {
        window.location.href = '../home/home.html';
    };

    // Initialize the page when loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Option page loaded');
        
        // Check for previously selected option
        const savedOption = sessionStorage.getItem('bookingOption');
        if (savedOption) {
            selectBookingOption(savedOption);
        }
        
        // Add click handlers to option cards
        const packageCard = document.getElementById('packageOption');
        const tourCard = document.getElementById('tourOption');
        
        if (packageCard) {
            packageCard.addEventListener('click', () => selectBookingOption('package'));
        }
        
        if (tourCard) {
            tourCard.addEventListener('click', () => selectBookingOption('tour'));
        }
        
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
                selectBookingOption('package');
            } else if (e.key === '2') {
                selectBookingOption('tour');
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
})();
