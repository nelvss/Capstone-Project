
// home.js
// Handles pop-up modal for 'More Info' buttons

document.addEventListener('DOMContentLoaded', function () {
  // Delegate click for all 'More Info' buttons
  document.body.addEventListener('click', function (e) {
    if (e.target.matches('.btn-more-info')) {
      e.preventDefault();
      const info = e.target.getAttribute('data-info') || '';
      document.getElementById('popupModalLabel').textContent = e.target.getAttribute('data-title') || 'More Info';
      document.getElementById('popupModalBody').innerHTML = info;
      const modal = new bootstrap.Modal(document.getElementById('popupModal'));
      modal.show();
    }
  });

  // Enhance modal images: make them clickable for lightbox view
  var popupModal = document.getElementById('popupModal');
  var popupModalBody = document.getElementById('popupModalBody');
  if (popupModal && popupModalBody) {
    popupModal.addEventListener('shown.bs.modal', function() {
      // Find all images in the modal body
      var imgs = popupModalBody.querySelectorAll('img');
      imgs.forEach(function(img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function(e) {
          e.stopPropagation();
          // Create overlay
          var overlay = document.createElement('div');
          overlay.className = 'lightbox-overlay';
          var bigImg = document.createElement('img');
          bigImg.src = img.src;
          bigImg.alt = img.alt;
          overlay.appendChild(bigImg);
          document.body.appendChild(overlay);
          // Remove overlay on click
          overlay.addEventListener('click', function() {
            overlay.remove();
          });
        });
      });
    });
    // Clean up overlays if modal is closed
    popupModal.addEventListener('hidden.bs.modal', function() {
      var overlays = document.querySelectorAll('.lightbox-overlay');
      overlays.forEach(function(overlay) { overlay.remove(); });
    });
  }
});
