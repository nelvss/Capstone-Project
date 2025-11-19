/**
 * Modal Utility Functions
 * Reusable functions for showing error and confirmation modals
 * Replaces browser alert() and confirm() dialogs
 */

/**
 * Show an error modal
 * @param {string} title - Modal title (default: "Error")
 * @param {string} message - Error message to display
 * @returns {Promise} Resolves when modal is closed
 */
function showErrorModal(title = 'Error', message) {
  return new Promise((resolve) => {
    // Remove existing error modal if any
    const existingModal = document.getElementById('errorModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title" id="errorModalLabel">
                <i class="fas fa-exclamation-circle me-2"></i>${title}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <div class="mb-3">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="fs-5">${message}</p>
              </div>
            </div>
            <div class="modal-footer justify-content-center">
              <button type="button" class="btn btn-danger" data-bs-dismiss="modal" id="errorModalOkBtn">
                <i class="fas fa-check me-1"></i>OK
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('errorModal');
    const modal = new bootstrap.Modal(modalElement);

    // Focus OK button when modal is shown
    modalElement.addEventListener('shown.bs.modal', () => {
      document.getElementById('errorModalOkBtn').focus();
    });

    // Clean up and resolve when modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
      resolve();
    });

    // Show modal
    modal.show();
  });
}

/**
 * Show a confirmation modal
 * @param {string} title - Modal title (default: "Confirm")
 * @param {string} message - Confirmation message to display
 * @param {Function} onConfirm - Callback function when user confirms
 * @param {Function} onCancel - Optional callback function when user cancels
 * @returns {Promise} Resolves with true if confirmed, false if cancelled
 */
function showConfirmModal(title = 'Confirm', message, onConfirm = null, onCancel = null) {
  return new Promise((resolve) => {
    // Remove existing confirm modal if any
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="confirmModalLabel">
                <i class="fas fa-question-circle me-2"></i>${title}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <div class="mb-4">
                <i class="fas fa-question-circle fa-3x text-warning mb-3"></i>
                <p class="fs-5">${message}</p>
              </div>
            </div>
            <div class="modal-footer justify-content-center">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="confirmModalCancelBtn">
                <i class="fas fa-times me-1"></i>Cancel
              </button>
              <button type="button" class="btn btn-danger" id="confirmModalConfirmBtn">
                <i class="fas fa-check me-1"></i>Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('confirmModal');
    const modal = new bootstrap.Modal(modalElement);

    // Handle confirm button click
    document.getElementById('confirmModalConfirmBtn').addEventListener('click', () => {
      modal.hide();
      if (onConfirm) {
        onConfirm();
      }
      resolve(true);
    });

    // Handle cancel button click and backdrop/close
    const handleCancel = () => {
      if (onCancel) {
        onCancel();
      }
      resolve(false);
    };

    document.getElementById('confirmModalCancelBtn').addEventListener('click', handleCancel);
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
      if (!modalElement.classList.contains('show')) {
        handleCancel();
      }
    });

    // Show modal
    modal.show();
  });
}

/**
 * Show a success modal
 * @param {string} title - Modal title (default: "Success")
 * @param {string} message - Success message to display
 * @returns {Promise} Resolves when modal is closed
 */
function showSuccessModal(title = 'Success', message) {
  return new Promise((resolve) => {
    // Remove existing success modal if any
    const existingModal = document.getElementById('successModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title" id="successModalLabel">
                <i class="fas fa-check-circle me-2"></i>${title}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <div class="mb-3">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <p class="fs-5">${message}</p>
              </div>
            </div>
            <div class="modal-footer justify-content-center">
              <button type="button" class="btn btn-success" data-bs-dismiss="modal" id="successModalOkBtn">
                <i class="fas fa-check me-1"></i>OK
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('successModal');
    const modal = new bootstrap.Modal(modalElement);

    // Focus OK button when modal is shown
    modalElement.addEventListener('shown.bs.modal', () => {
      document.getElementById('successModalOkBtn').focus();
    });

    // Clean up and resolve when modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
      resolve();
    });

    // Show modal
    modal.show();
  });
}

