/**
 * Modal Utility Functions
 * Reusable functions for showing error and confirmation modals
 * Replaces browser alert() and confirm() dialogs
 */

/**
 * Inject shared styles for the confirmation modal once
 */
function ensureConfirmModalStyles() {
  if (document.getElementById('confirmModalStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'confirmModalStyles';
  style.textContent = `
    .confirm-modal .modal-dialog {
      display: flex !important;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }

    .confirm-modal .modal-content {
      width: min(480px, calc(100% - 32px));
      margin: 0 auto;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
      border: none;
    }

    .confirm-modal .modal-header {
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      padding: 20px 24px 12px;
    }

    .confirm-modal .modal-body {
      padding: 12px 24px 8px;
    }

    .confirm-modal .modal-footer {
      padding: 0 24px 20px;
      gap: 12px;
    }

    @media (max-width: 576px) {
      .confirm-modal .modal-content {
        width: calc(100% - 24px);
      }
    }
  `;

  document.head.appendChild(style);
}

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
    ensureConfirmModalStyles();

    // Remove existing confirm modal if any
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div class="modal fade confirm-modal" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel" aria-hidden="true">
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
    let resolved = false;

    const finish = (value, callback) => {
      if (resolved) {
        return;
      }
      resolved = true;
      if (callback) {
        callback();
      }
      resolve(value);
    };

    // Handle confirm button click
    document.getElementById('confirmModalConfirmBtn').addEventListener('click', () => {
      modal.hide();
      finish(true, onConfirm);
    });

    // Handle cancel button click and backdrop/close
    const handleCancel = () => finish(false, onCancel);

    document.getElementById('confirmModalCancelBtn').addEventListener('click', handleCancel);
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
      handleCancel();
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

