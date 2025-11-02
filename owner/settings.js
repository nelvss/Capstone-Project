// Settings Page JavaScript - Connected to Owner Dashboard

const API_BASE_URL = 'http://localhost:3000/api';

const vehicleState = {
  data: [],
  byId: new Map(),
  lastSynced: null,
  isLoading: false
};

let newVehicleImageFile = null;

const vehicleUI = {
  list: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  template: null
};

// Tab switching functionality
function showTab(event, tabName) {
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => tab.classList.remove('active'));

  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));

  const activeTab = document.getElementById(`${tabName}-tab`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  const trigger = event?.currentTarget || document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (trigger) {
    trigger.classList.add('active');
  }
}

// Show success message (available for future integrations)
function showSuccessMessage(message = 'Settings saved successfully!') {
  const successMsg = document.getElementById('success-message');
  if (!successMsg) {
    return;
  }

  const successText = successMsg.querySelector('.success-text');
  if (successText) {
    successText.textContent = message;
  }

  successMsg.classList.add('show');

  setTimeout(() => {
    successMsg.classList.remove('show');
  }, 3000);
}

// Sidebar toggle functionality (same as dashboard)
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  sidebar?.classList.toggle('collapsed');
  mainContent?.classList.toggle('expanded');
}

// Smooth page navigation with transition
function navigateWithTransition(url) {
  document.body.classList.add('page-transition');

  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// Logout functionality (same as dashboard)
function handleLogout() {
  if (confirm('Are you sure you want to logout? Any unsaved changes will be lost.')) {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
  }
}

// Session checking
function checkSession() {
  const userSession = localStorage.getItem('userSession');

  if (!userSession) {
    window.location.href = 'login.html';
    return false;
  }

  try {
    const session = JSON.parse(userSession);

    if (session.type !== 'owner') {
      alert('Access denied. Owner access required.');
      window.location.href = 'login.html';
      return false;
    }

    return true;
  } catch (error) {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
    return false;
  }
}

function resolveVehicleId(vehicle) {
  return vehicle?.vehicle_id ?? vehicle?.id ?? null;
}

function getPriceDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue.toFixed(2);
  }

  return value;
}

function setStatusTag(tagElement, text, variant = 'default') {
  if (!tagElement) {
    return;
  }

  tagElement.textContent = text;
  tagElement.classList.remove('success', 'error');

  if (variant === 'success') {
    tagElement.classList.add('success');
  } else if (variant === 'error') {
    tagElement.classList.add('error');
  }
}

function showInlineStatus(element, message, variant = 'info') {
  if (!element) {
    return;
  }

  element.textContent = message;

  if (variant === 'success') {
    element.dataset.status = 'success';
  } else if (variant === 'error') {
    element.dataset.status = 'error';
  } else {
    delete element.dataset.status;
  }
}

function clearInlineStatus(element) {
  if (!element) {
    return;
  }
  element.textContent = '';
  delete element.dataset.status;
}

function setVehicleData(vehicles) {
  const filteredVehicles = (Array.isArray(vehicles) ? vehicles : []).filter(vehicle => {
    const name = (vehicle?.name || '').trim().toLowerCase();
    return name && name !== 'n/a';
  });

  vehicleState.data = filteredVehicles;
  vehicleState.byId = new Map();

  vehicleState.data.forEach(vehicle => {
    const id = resolveVehicleId(vehicle);
    if (id !== null && id !== undefined) {
      vehicleState.byId.set(String(id), vehicle);
    }
  });
}

function getVehicleFromState(vehicleId) {
  return vehicleState.byId.get(String(vehicleId));
}

function updateVehicleInState(vehicle) {
  const id = resolveVehicleId(vehicle);
  if (id === null || id === undefined) {
    return;
  }

  vehicleState.byId.set(String(id), vehicle);
  vehicleState.data = vehicleState.data.map(item => (resolveVehicleId(item) === id ? vehicle : item));
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    const snippet = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    throw new Error(`HTTP ${response.status}: ${snippet}`);
  }
}

function setVehicleLoading(isLoading) {
  vehicleState.isLoading = isLoading;

  if (vehicleUI.refreshBtn) {
    vehicleUI.refreshBtn.disabled = isLoading;
  }

  if (vehicleUI.list) {
    vehicleUI.list.setAttribute('aria-busy', String(isLoading));
  }
}

function setVehicleError(message = '') {
  if (!vehicleUI.error) {
    return;
  }

  if (message) {
    vehicleUI.error.textContent = message;
    vehicleUI.error.hidden = false;
  } else {
    vehicleUI.error.textContent = '';
    vehicleUI.error.hidden = true;
  }
}

function formatSyncTimestamp(date) {
  if (!(date instanceof Date)) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function updateVehicleSyncStatus() {
  if (!vehicleUI.syncStatus) {
    return;
  }

  if (!vehicleState.lastSynced) {
    vehicleUI.syncStatus.textContent = 'Last synced: waiting...';
    return;
  }

  vehicleUI.syncStatus.textContent = `Last synced: ${formatSyncTimestamp(vehicleState.lastSynced)}`;
}

async function loadVehicles() {
  if (!vehicleUI.list || !vehicleUI.template) {
    return;
  }

  setVehicleError('');
  setVehicleLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load vehicles');
    }

    setVehicleData(result.vehicles || []);
    vehicleState.lastSynced = new Date();
    updateVehicleSyncStatus();
    renderVehicles();
  } catch (error) {
    console.error('❌ Failed to load vehicles:', error);
    setVehicleData([]);
    if (vehicleUI.list) {
      vehicleUI.list.innerHTML = '';
      vehicleUI.list.hidden = true;
    }
    setVehicleError(`Failed to load vehicles: ${error.message}`);
  } finally {
    setVehicleLoading(false);
  }
}

function renderVehicles() {
  if (!vehicleUI.list) {
    return;
  }

  vehicleUI.list.innerHTML = '';

  const vehicles = vehicleState.data;
  const hasVehicles = vehicles.length > 0;

  vehicleUI.list.hidden = !hasVehicles;

  if (!hasVehicles) {
    return;
  }

  vehicles.forEach(vehicle => {
    const card = createVehicleCard(vehicle);
    vehicleUI.list.appendChild(card);
  });
}

function createVehicleCard(vehicle) {
  const id = resolveVehicleId(vehicle);
  const fragment = vehicleUI.template.content.cloneNode(true);
  const card = fragment.querySelector('.vehicle-card');
  const nameElement = fragment.querySelector('.vehicle-name');
  const idElement = fragment.querySelector('.vehicle-id');
  const statusTag = fragment.querySelector('.vehicle-status-tag');
  const priceInput = fragment.querySelector('.vehicle-price');
  const descriptionInput = fragment.querySelector('.vehicle-description');
  const saveButton = fragment.querySelector('.vehicle-save-btn');
  const inlineStatus = fragment.querySelector('.vehicle-inline-status');
  const imageElement = fragment.querySelector('.vehicle-image');
  const uploadButton = fragment.querySelector('.vehicle-upload-btn');
  const fileInput = fragment.querySelector('.vehicle-file-input');
  const deleteButton = fragment.querySelector('.vehicle-delete-btn');

  if (card) {
    card.dataset.vehicleId = id;
  }

  if (nameElement) {
    nameElement.textContent = vehicle?.name || `Vehicle ${id}`;
  }

  if (idElement) {
    idElement.textContent = `ID: ${id}`;
  }

  if (statusTag) {
    setStatusTag(statusTag, 'Synced');
  }

  if (priceInput) {
    priceInput.value = getPriceDisplayValue(vehicle?.price_per_day);
  }

  if (descriptionInput) {
    descriptionInput.value = vehicle?.description || '';
  }

  if (imageElement) {
    // Handle empty strings, null, undefined - all should show placeholder
    const imageUrl = vehicle?.vehicle_image;
    imageElement.src = (imageUrl && imageUrl.trim() !== '') ? imageUrl : '../Images/logo.png';
    imageElement.alt = `${vehicle?.name || 'Vehicle'} preview`;
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      handleVehicleSave({
        vehicleId: id,
        priceInput,
        descriptionInput,
        saveButton,
        inlineStatus,
        statusTag
      });
    });
  }

  if (uploadButton && fileInput) {
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const [file] = fileInput.files || [];
      if (!file) {
        return;
      }

      handleVehicleImageUpload({
        vehicleId: id,
        file,
        uploadButton,
        inlineStatus,
        statusTag,
        imageElement,
        fileInput
      });
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      handleVehicleDelete({
        vehicleId: id,
        vehicleName: vehicle?.name || `Vehicle ${id}`,
        deleteButton,
        card,
        inlineStatus,
        statusTag
      });
    });
  }

  return fragment;
}

async function handleVehicleSave({ vehicleId, priceInput, descriptionInput, saveButton, inlineStatus, statusTag }) {
  const existing = getVehicleFromState(vehicleId) || {};

  const priceValue = priceInput?.value ?? '';
  const descriptionValue = descriptionInput?.value?.trim() ?? '';
  const payload = {};

  if (priceValue !== '') {
    const parsedPrice = Number(priceValue);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showInlineStatus(inlineStatus, 'Enter a valid non-negative price.', 'error');
      setStatusTag(statusTag, 'Validation error', 'error');
      return;
    }

    if (Number(existing.price_per_day) !== parsedPrice) {
      payload.price_per_day = parsedPrice;
    }
  }

  if ((existing.description || '').trim() !== descriptionValue) {
    payload.description = descriptionValue;
  }

  if (Object.keys(payload).length === 0) {
    showInlineStatus(inlineStatus, 'No changes to save.', 'info');
    setTimeout(() => clearInlineStatus(inlineStatus), 2500);
    return;
  }

  showInlineStatus(inlineStatus, 'Saving changes...');
  setStatusTag(statusTag, 'Saving...', 'default');

  if (saveButton) {
    saveButton.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update vehicle');
    }

    const updatedVehicle = result.vehicle;
    updateVehicleInState(updatedVehicle);

    if (priceInput && updatedVehicle?.price_per_day !== undefined) {
      priceInput.value = getPriceDisplayValue(updatedVehicle.price_per_day);
    }

    if (descriptionInput && updatedVehicle?.description !== undefined) {
      descriptionInput.value = updatedVehicle.description || '';
    }

    showInlineStatus(inlineStatus, 'Changes saved!', 'success');
    setStatusTag(statusTag, 'Saved just now', 'success');
    showSuccessMessage(`${updatedVehicle?.name || 'Vehicle'} updated successfully!`);
  } catch (error) {
    console.error('❌ Error saving vehicle:', error);
    showInlineStatus(inlineStatus, `Save failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Save failed', 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }

    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleVehicleImageUpload({ vehicleId, file, uploadButton, inlineStatus, statusTag, imageElement, fileInput }) {
  showInlineStatus(inlineStatus, 'Uploading image...');
  setStatusTag(statusTag, 'Uploading...', 'default');

  if (uploadButton) {
    uploadButton.disabled = true;
  }

  try {
    const imageData = await readFileAsBase64(file);

    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        imageData,
        fileName: file.name
      }),
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to upload vehicle image');
    }

    const updatedVehicle = result.vehicle;
    updateVehicleInState(updatedVehicle);

    if (imageElement && result.imageUrl) {
      imageElement.src = result.imageUrl;
    }

    showInlineStatus(inlineStatus, 'Image updated successfully', 'success');
    setStatusTag(statusTag, 'Image updated', 'success');
    showSuccessMessage(`${updatedVehicle?.name || 'Vehicle'} image updated!`);
  } catch (error) {
    console.error('❌ Error uploading vehicle image:', error);
    showInlineStatus(inlineStatus, `Upload failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Upload failed', 'error');
  } finally {
    if (uploadButton) {
      uploadButton.disabled = false;
    }

    if (fileInput) {
      fileInput.value = '';
    }

    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleVehicleDelete({ vehicleId, vehicleName, deleteButton, card, inlineStatus, statusTag }) {
  const confirmed = confirm(`Are you sure you want to delete "${vehicleName}"?\n\nThis action cannot be undone. The vehicle will be removed from Supabase and will no longer appear on the home page.`);
  
  if (!confirmed) {
    return;
  }

  showInlineStatus(inlineStatus, 'Deleting vehicle...');
  setStatusTag(statusTag, 'Deleting...', 'default');

  if (deleteButton) {
    deleteButton.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete vehicle');
    }

    // Remove from state
    const filtered = vehicleState.data.filter(v => resolveVehicleId(v) !== vehicleId);
    setVehicleData(filtered);

    // Remove card from DOM
    if (card && card.parentElement) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        card.remove();
      }, 300);
    }

    showSuccessMessage(`${vehicleName} deleted successfully!`);
    
    // Re-render to ensure UI is in sync
    renderVehicles();
  } catch (error) {
    console.error('❌ Error deleting vehicle:', error);
    showInlineStatus(inlineStatus, `Delete failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Delete failed', 'error');
    
    if (deleteButton) {
      deleteButton.disabled = false;
    }
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Unable to read the selected file'));
    };

    reader.readAsDataURL(file);
  });
}

function showNewVehicleCard() {
  const newCard = document.getElementById('vehicle-new-card');
  const listContainer = vehicleUI.list?.parentElement;

  if (!newCard || !listContainer) {
    return;
  }

  if (newCard.parentElement !== listContainer) {
    listContainer.insertBefore(newCard, vehicleUI.list);
  }

  newCard.hidden = false;
  newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideNewVehicleCard() {
  const newCard = document.getElementById('vehicle-new-card');
  if (newCard) {
    newCard.hidden = true;
  }
}

function clearNewVehicleForm() {
  const nameInput = document.getElementById('new-vehicle-name');
  const priceInput = document.getElementById('new-vehicle-price');
  const descInput = document.getElementById('new-vehicle-description');
  const statusEl = document.getElementById('new-vehicle-status');
  const fileInput = document.getElementById('new-vehicle-file-input');
  const imageElement = document.querySelector('#vehicle-new-card .vehicle-image');

  if (nameInput) {
    nameInput.value = '';
  }
  if (priceInput) {
    priceInput.value = '';
  }
  if (descInput) {
    descInput.value = '';
  }
  if (fileInput) {
    fileInput.value = '';
  }
  if (imageElement) {
    imageElement.src = '../Images/logo.png';
  }
  if (statusEl) {
    statusEl.textContent = '';
    delete statusEl.dataset.status;
  }
  
  newVehicleImageFile = null;
}

async function handleCreateVehicle() {
  const nameInput = document.getElementById('new-vehicle-name');
  const priceInput = document.getElementById('new-vehicle-price');
  const descInput = document.getElementById('new-vehicle-description');
  const statusEl = document.getElementById('new-vehicle-status');
  const saveBtn = document.getElementById('new-vehicle-save-btn');
  const cancelBtn = document.getElementById('new-vehicle-cancel-btn');

  if (!nameInput || !priceInput || !descInput || !statusEl || !saveBtn || !cancelBtn) {
    return;
  }

  const name = (nameInput.value || '').trim();
  const priceValue = priceInput.value || '';
  const description = (descInput.value || '').trim();

  if (!name) {
    showInlineStatus(statusEl, 'Enter a vehicle name.', 'error');
    setTimeout(() => clearInlineStatus(statusEl), 3000);
    return;
  }

  if (!priceValue) {
    showInlineStatus(statusEl, 'Enter a price per day.', 'error');
    setTimeout(() => clearInlineStatus(statusEl), 3000);
    return;
  }

  const parsedPrice = Number(priceValue);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    showInlineStatus(statusEl, 'Enter a valid non-negative price.', 'error');
    setTimeout(() => clearInlineStatus(statusEl), 3000);
    return;
  }

  const payload = {
    name,
    price_per_day: parsedPrice,
    description
  };

  showInlineStatus(statusEl, 'Creating vehicle...');
  saveBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to create vehicle');
    }

    const newVehicle = result.vehicle;
    
    // Add new vehicle to state first (without image yet)
    setVehicleData([...vehicleState.data, newVehicle]);
    
    // Append new vehicle card first (will show placeholder initially)
    const newCardFragment = createVehicleCard(newVehicle);
    let newCard = null;
    if (vehicleUI.list && newCardFragment) {
      vehicleUI.list.appendChild(newCardFragment);
      // After appending, query for the card
      const vehicleId = newVehicle.vehicle_id;
      newCard = vehicleUI.list.querySelector(`[data-vehicle-id="${vehicleId}"]`);
    } else {
      // Fallback to full re-render if append fails
      renderVehicles();
    }
    
    // Upload image if one was selected (after card is created)
    if (newVehicleImageFile && newVehicle.vehicle_id) {
      showInlineStatus(statusEl, 'Uploading image...');
      console.log('📤 Starting image upload for vehicle:', newVehicle.vehicle_id);
      
      try {
        const imageData = await readFileAsBase64(newVehicleImageFile);
        console.log('📦 Image data prepared, size:', imageData.length, 'chars');
        
        const imageResponse = await fetch(`${API_BASE_URL}/vehicles/${newVehicle.vehicle_id}/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            imageData,
            fileName: newVehicleImageFile.name
          }),
          cache: 'no-cache'
        });
        
        const imageResult = await parseJsonResponse(imageResponse);
        console.log('📥 Image upload response:', {
          ok: imageResponse.ok,
          success: imageResult.success,
          imageUrl: imageResult.imageUrl,
          vehicle_image: imageResult.vehicle?.vehicle_image
        });
        
        if (imageResponse.ok && imageResult.success && imageResult.vehicle) {
          // Use the updated vehicle from the server which includes the image URL
          Object.assign(newVehicle, imageResult.vehicle);
          
          // Update vehicle in state with the image URL
          updateVehicleInState(newVehicle);
          
          // Update the card's image
          if (!newCard) {
            const vehicleId = newVehicle.vehicle_id;
            newCard = vehicleUI.list?.querySelector(`[data-vehicle-id="${vehicleId}"]`);
          }
          
          if (newCard) {
            const imageElement = newCard.querySelector('.vehicle-image');
            if (imageElement) {
              // Use imageUrl from response, or fallback to vehicle_image from vehicle object
              const imageUrl = imageResult.imageUrl || imageResult.vehicle?.vehicle_image || newVehicle.vehicle_image;
              if (imageUrl) {
                imageElement.src = imageUrl;
                imageElement.alt = `${newVehicle.name || 'Vehicle'} preview`;
                console.log('✅ Image updated on card:', imageUrl);
              } else {
                console.warn('⚠️ No image URL found in response');
              }
            } else {
              console.warn('⚠️ Image element not found in card');
            }
          } else {
            console.warn('⚠️ Card not found after image upload');
          }
        } else {
          console.warn('⚠️ Image upload failed:', imageResult.message || 'Unknown error');
          showInlineStatus(statusEl, 'Image upload failed', 'error');
        }
      } catch (imageError) {
        console.error('❌ Error uploading image:', imageError);
        showInlineStatus(statusEl, `Image upload error: ${imageError.message}`, 'error');
      }
    }
    
    hideNewVehicleCard();
    clearNewVehicleForm();
    showSuccessMessage(`${newVehicle.name || 'Vehicle'} created successfully!`);
  } catch (error) {
    console.error('❌ Error creating vehicle:', error);
    showInlineStatus(statusEl, `Creation failed: ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    setTimeout(() => clearInlineStatus(statusEl), 4000);
  }
}

function initializeVehicleManager() {
  vehicleUI.list = document.getElementById('vehicle-list');
  vehicleUI.error = document.getElementById('vehicle-error');
  vehicleUI.syncStatus = document.getElementById('vehicle-sync-status');
  vehicleUI.refreshBtn = document.getElementById('vehicle-refresh-btn');
  vehicleUI.template = document.getElementById('vehicle-card-template');

  if (!vehicleUI.list || !vehicleUI.template) {
    return;
  }

  updateVehicleSyncStatus();

  const addBtn = document.getElementById('vehicle-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showNewVehicleCard();
      document.getElementById('new-vehicle-name')?.focus();
    });
  }

  const cancelBtn = document.getElementById('new-vehicle-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideNewVehicleCard();
      clearNewVehicleForm();
    });
  }

  const saveBtn = document.getElementById('new-vehicle-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleCreateVehicle);
  }

  const uploadBtn = document.getElementById('new-vehicle-upload-btn');
  const fileInput = document.getElementById('new-vehicle-file-input');
  const newImageElement = document.querySelector('#vehicle-new-card .vehicle-image');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const [file] = fileInput.files || [];
      if (!file) {
        return;
      }

      newVehicleImageFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        if (newImageElement) {
          newImageElement.src = reader.result;
        }
      };
      reader.onerror = () => {
        console.error('❌ Error reading image file');
      };
      reader.readAsDataURL(file);
    });
  }

  if (vehicleUI.refreshBtn) {
    vehicleUI.refreshBtn.addEventListener('click', () => {
      loadVehicles();
    });
  }

  loadVehicles();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  if (!checkSession()) {
    return;
  }

  initializeVehicleManager();
  console.log('Settings page ready');
});