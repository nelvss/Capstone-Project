
// home.js
// Handles pop-up modal for 'More Info' buttons with enhanced image gallery

document.addEventListener('DOMContentLoaded', function () {
  
  // Image collections for each service
  const serviceImages = {
    'Snorkeling Tour': [
      { src: '../Images/coral_garden.jpg', alt: 'Coral Garden' },
      { src: '../Images/muelle_beach.jpg', alt: 'Muelle Beach' },
      { src: '../Images/giant_clamps.jpg', alt: 'Giant Clams' },
      { src: '../Images/white_beach.jpg', alt: 'White Beach' }
    ],
    'Inland Tour': [
      { src: '../Images/tamaraw_falls.jpg', alt: 'Tamaraw Falls' },
      { src: '../Images/virgin_beach.jpg', alt: 'Virgin Beach' },
      { src: '../Images/muelle_beach.jpg', alt: 'Muelle Beach' }
    ],
    'Island Hopping': [
      { src: '../Images/long_beach.jpg', alt: 'Long Beach' },
      { src: '../Images/white_beach.jpg', alt: 'White Beach' },
      { src: '../Images/giant_clamps.jpg', alt: 'Giant Clams' },
      { src: '../Images/muelle_beach.jpg', alt: 'Muelle Beach' }
    ],
    'Vehicle Rental': [
      { src: '../Images/adv_160.png', alt: 'ADV 160' },
      { src: '../Images/nmax.png', alt: 'NMAX' },
      { src: '../Images/versys_650.png', alt: 'Versys 650' },
      { src: '../Images/versys_1000.png', alt: 'Versys 1000' },
      { src: '../Images/tuktuk.png', alt: 'Tuktuk' },
      { src: '../Images/mirage.jpg', alt: 'Mirage' },
      { src: '../Images/wigo.png', alt: 'Wigo' }
    ],
    'The Mangyan Grand Hotel': [
      { src: '../Images/mangyan.jpg', alt: 'Mangyan Grand Hotel' },
      { src: '../Images/mangyan2.jpg', alt: 'Mangyan Grand Hotel 2' },
      { src: '../Images/mangyan3.jpg', alt: 'Mangyan Grand Hotel 3' },
      { src: '../Images/mangyan4.jpg', alt: 'Mangyan Grand Hotel 4' },
      { src: '../Images/mangyan5.jpg', alt: 'Mangyan Grand Hotel 5' },
      { src: '../Images/mangyan6.jpg', alt: 'Mangyan Grand Hotel 6' },
      { src: '../Images/mangyan7.jpg', alt: 'Mangyan Grand Hotel 7' },
      { src: '../Images/mangyan8.jpg', alt: 'Mangyan Grand Hotel 8' }
    ],
    'SouthView': [
      { src: '../Images/southview.jpg', alt: 'SouthView' },
      { src: '../Images/southview2.jpg', alt: 'SouthView 2' },
      { src: '../Images/southview3.jpg', alt: 'SouthView 3' },
      { src: '../Images/southview4.jpg', alt: 'SouthView 4' },
      { src: '../Images/southview5.jpg', alt: 'SouthView 5' },
      { src: '../Images/southview6.jpg', alt: 'SouthView 6' }
    ],
    'Ilaya': [
      { src: '../Images/ilaya.jpg', alt: 'Ilaya' },
      { src: '../Images/ilaya2.jpg', alt: 'Ilaya 2' },
      { src: '../Images/ilaya3.jpg', alt: 'Ilaya 3' },
      { src: '../Images/ilaya4.jpg', alt: 'Ilaya 4' }
    ],
    'Transient House': [
      { src: '../Images/tr1.jpg', alt: 'Transient House 1' },
      { src: '../Images/tr2.jpg', alt: 'Transient House 2' },
      { src: '../Images/tr3.jpg', alt: 'Transient House 3' },
      { src: '../Images/tr4.jpg', alt: 'Transient House 4' },
      { src: '../Images/tr5.jpg', alt: 'Transient House 5' },
      { src: '../Images/tr7.jpg', alt: 'Transient House 7' },
      { src: '../Images/tr8.jpg', alt: 'Transient House 8' },
      { src: '../Images/tr9.jpg', alt: 'Transient House 9' },
      { src: '../Images/tr10.jpg', alt: 'Transient House 10' },
      { src: '../Images/tr11.jpg', alt: 'Transient House 11' },
      { src: '../Images/tr12.jpg', alt: 'Transient House 12' }
    ],
    'Bliss': [
      { src: '../Images/bliss.jpg', alt: 'Bliss 1' },
      { src: '../Images/bliss2.jpg', alt: 'Bliss 2' },
      { src: '../Images/bliss3.jpg', alt: 'Bliss 3' },
      { src: '../Images/bliss4.jpg', alt: 'Bliss 4' },
      { src: '../Images/bliss5.jpg', alt: 'Bliss 5' }
    ],
    'Diving': [
      { src: '../Images/coral_garden.jpg', alt: 'Coral Garden Diving' },
      { src: '../Images/giant_clamps.jpg', alt: 'Giant Clams Diving' },
      { src: '../Images/white_beach.jpg', alt: 'White Beach Diving' }
    ]
  };

  // Delegate click for all 'More Info' buttons
  document.body.addEventListener('click', function (e) {
    if (e.target.matches('.btn-more-info')) {
      e.preventDefault();
      const title = e.target.getAttribute('data-title') || 'More Info';
      const info = e.target.getAttribute('data-info') || '';
      
      document.getElementById('popupModalLabel').textContent = title;
      
      // Add gallery button if images exist for this service
      let enhancedInfo = info;
      if (serviceImages[title] && serviceImages[title].length > 0) {
        enhancedInfo += `<br><br><button class="gallery-trigger" onclick="openImageGallery('${title}')">📸 View Image Gallery (${serviceImages[title].length} photos)</button>`;
      }
      
      document.getElementById('popupModalBody').innerHTML = enhancedInfo;
      const modal = new bootstrap.Modal(document.getElementById('popupModal'));
      modal.show();
    }
  });

  // Make images in popup clickable for lightbox view
  var popupModal = document.getElementById('popupModal');
  var popupModalBody = document.getElementById('popupModalBody');
  if (popupModal && popupModalBody) {
    popupModal.addEventListener('shown.bs.modal', function() {
      var imgs = popupModalBody.querySelectorAll('img');
      imgs.forEach(function(img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function(e) {
          e.stopPropagation();
          createLightbox(img.src, img.alt);
        });
      });
    });
    
    popupModal.addEventListener('hidden.bs.modal', function() {
      var overlays = document.querySelectorAll('.lightbox-overlay');
      overlays.forEach(function(overlay) { overlay.remove(); });
    });
  }

  // Image gallery functionality
  window.openImageGallery = function(serviceName) {
    const images = serviceImages[serviceName];
    if (!images || images.length === 0) return;
    
    // Close the more info modal
    const moreInfoModal = bootstrap.Modal.getInstance(document.getElementById('popupModal'));
    if (moreInfoModal) {
      moreInfoModal.hide();
    }
    
    // Set up gallery modal
    document.getElementById('imageGalleryModalLabel').textContent = serviceName + ' - Image Gallery';
    
    // Create carousel items
    const carouselInner = document.getElementById('galleryCarouselInner');
    carouselInner.innerHTML = '';
    
    images.forEach((image, index) => {
      const carouselItem = document.createElement('div');
      carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;
      carouselItem.innerHTML = `
        <div class="d-flex justify-content-center align-items-center position-relative" style="height: 70vh;">
          <img src="${image.src}" alt="${image.alt}" class="gallery-main-image" onclick="toggleZoom(this)">
          <div class="gallery-info">
            <p class="mb-0">${image.alt} (${index + 1} of ${images.length})</p>
          </div>
        </div>
      `;
      carouselInner.appendChild(carouselItem);
    });
    
    // Create thumbnails
    const thumbnailsContainer = document.getElementById('galleryThumbnails');
    thumbnailsContainer.innerHTML = '';
    
    images.forEach((image, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = image.src;
      thumbnail.alt = image.alt;
      thumbnail.className = `gallery-thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.onclick = () => goToSlide(index);
      thumbnailsContainer.appendChild(thumbnail);
    });
    
    // Show gallery modal
    const galleryModal = new bootstrap.Modal(document.getElementById('imageGalleryModal'));
    galleryModal.show();
  };

  // Go to specific slide
  window.goToSlide = function(index) {
    const carousel = new bootstrap.Carousel(document.getElementById('galleryCarousel'));
    carousel.to(index);
    
    // Update active thumbnail
    document.querySelectorAll('.gallery-thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  };

  // Toggle zoom on gallery images
  window.toggleZoom = function(img) {
    img.classList.toggle('zoomed');
  };

  // Create lightbox overlay
  function createLightbox(src, alt) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    var bigImg = document.createElement('img');
    bigImg.src = src;
    bigImg.alt = alt;
    overlay.appendChild(bigImg);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function() {
      overlay.remove();
    });
  }

  // Update thumbnail active state when carousel slides
  document.getElementById('galleryCarousel')?.addEventListener('slide.bs.carousel', function (event) {
    const activeIndex = event.to;
    document.querySelectorAll('.gallery-thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === activeIndex);
    });
  });

  // Auto-expand feedback textarea functionality
  const feedbackTextarea = document.getElementById('feedback');
  if (feedbackTextarea) {
    // Function to auto-resize textarea
    function autoResizeTextarea() {
      // Reset height to auto to get the correct scrollHeight
      feedbackTextarea.style.height = 'auto';
      
      // Set the new height based on content (no maximum limit)
      feedbackTextarea.style.height = feedbackTextarea.scrollHeight + 'px';
    }
    
    // Add event listeners for auto-resize
    feedbackTextarea.addEventListener('input', autoResizeTextarea);
    feedbackTextarea.addEventListener('paste', function() {
      // Small delay to allow paste content to be processed
      setTimeout(autoResizeTextarea, 10);
    });
    
    // Initial resize in case there's existing content
    autoResizeTextarea();
  }

  // Send feedback functionality
  const sendFeedbackBtn = document.getElementById('sendFeedbackBtn');
  if (sendFeedbackBtn) {
    sendFeedbackBtn.addEventListener('click', async function() {
      const feedbackText = document.getElementById('feedback').value.trim();
      
      if (!feedbackText) {
        alert('Please enter a message or feedback before sending.');
        return;
      }
      
      // Disable button to prevent multiple submissions
      sendFeedbackBtn.disabled = true;
      sendFeedbackBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SENDING...';
      
      try {
        // Send feedback to API
        const response = await fetch('http://localhost:3000/api/submit-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: feedbackText
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Clear the textarea
          document.getElementById('feedback').value = '';
          
          // Show success message
          alert('Thank you for your feedback! Your message has been sent successfully.');
        } else {
          // Show error message
          alert(`Failed to send feedback: ${result.message}`);
        }
        
      } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to send feedback. Please try again later.');
      } finally {
        // Re-enable button
        sendFeedbackBtn.disabled = false;
        sendFeedbackBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> SEND MESSAGE';
      }
    });
  }
});
