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

// Diving management state
const divingState = {
  data: [],
  byId: new Map(),
  lastSynced: null,
  isLoading: false
};

let newDivingImageFile = null;

const divingUI = {
  list: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  template: null
};

function resolveDivingId(diving) {
  return diving?.diving_id ?? diving?.id ?? null;
}

function setDivingData(divingRecords) {
  const filteredDiving = (Array.isArray(divingRecords) ? divingRecords : []).filter(diving => {
    const name = (diving?.name || '').trim().toLowerCase();
    return name && name !== 'n/a';
  });

  divingState.data = filteredDiving;
  divingState.byId = new Map();

  divingState.data.forEach(diving => {
    const id = resolveDivingId(diving);
    if (id !== null && id !== undefined) {
      divingState.byId.set(String(id), diving);
    }
  });
}

function getDivingFromState(divingId) {
  return divingState.byId.get(String(divingId));
}

function updateDivingInState(diving) {
  const id = resolveDivingId(diving);
  if (id === null || id === undefined) {
    return;
  }

  divingState.byId.set(String(id), diving);
  divingState.data = divingState.data.map(item => (resolveDivingId(item) === id ? diving : item));
}

function setDivingLoading(isLoading) {
  divingState.isLoading = isLoading;

  if (divingUI.refreshBtn) {
    divingUI.refreshBtn.disabled = isLoading;
  }

  if (divingUI.list) {
    divingUI.list.setAttribute('aria-busy', String(isLoading));
  }
}

function setDivingError(message = '') {
  if (!divingUI.error) {
    return;
  }

  if (message) {
    divingUI.error.textContent = message;
    divingUI.error.hidden = false;
  } else {
    divingUI.error.textContent = '';
    divingUI.error.hidden = true;
  }
}

function updateDivingSyncStatus() {
  if (!divingUI.syncStatus) {
    return;
  }

  if (!divingState.lastSynced) {
    divingUI.syncStatus.textContent = 'Last synced: waiting...';
    return;
  }

  divingUI.syncStatus.textContent = `Last synced: ${formatSyncTimestamp(divingState.lastSynced)}`;
}

async function loadDiving() {
  if (!divingUI.list || !divingUI.template) {
    return;
  }

  setDivingError('');
  setDivingLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/diving`);
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Please ensure the server is running and the endpoint exists.`);
    }
    
    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load diving records');
    }

    setDivingData(result.diving || []);
    divingState.lastSynced = new Date();
    updateDivingSyncStatus();
    renderDiving();
  } catch (error) {
    console.error('❌ Failed to load diving records:', error);
    setDivingData([]);
    if (divingUI.list) {
      divingUI.list.innerHTML = '';
      divingUI.list.hidden = true;
    }
    setDivingError(`Failed to load diving records: ${error.message}`);
  } finally {
    setDivingLoading(false);
  }
}

function renderDiving() {
  if (!divingUI.list) {
    return;
  }

  divingUI.list.innerHTML = '';

  const divingRecords = divingState.data;
  const hasDiving = divingRecords.length > 0;

  divingUI.list.hidden = !hasDiving;

  if (!hasDiving) {
    return;
  }

  divingRecords.forEach(diving => {
    const card = createDivingCard(diving);
    divingUI.list.appendChild(card);
  });
}

function createDivingCard(diving) {
  const id = resolveDivingId(diving);
  const fragment = divingUI.template.content.cloneNode(true);
  const card = fragment.querySelector('.vehicle-card');
  const nameElement = fragment.querySelector('.vehicle-name');
  const idElement = fragment.querySelector('.vehicle-id');
  const statusTag = fragment.querySelector('.vehicle-status-tag');
  const priceInput = fragment.querySelector('.vehicle-price');
  const saveButton = fragment.querySelector('.vehicle-save-btn');
  const inlineStatus = fragment.querySelector('.vehicle-inline-status');
  const imageElement = fragment.querySelector('.vehicle-image');
  const uploadButton = fragment.querySelector('.vehicle-upload-btn');
  const fileInput = fragment.querySelector('.vehicle-file-input');
  const deleteButton = fragment.querySelector('.vehicle-delete-btn');

  if (card) {
    card.dataset.divingId = id;
  }

  if (nameElement) {
    nameElement.textContent = diving?.name || `Diving ${id}`;
  }

  if (idElement) {
    idElement.textContent = `ID: ${id}`;
  }

  if (statusTag) {
    setStatusTag(statusTag, 'Synced');
  }

  if (priceInput) {
    priceInput.value = getPriceDisplayValue(diving?.price_per_head);
  }

  if (imageElement) {
    const imageUrl = diving?.diving_image;
    imageElement.src = (imageUrl && imageUrl.trim() !== '') ? imageUrl : '../Images/logo.png';
    imageElement.alt = `${diving?.name || 'Diving'} preview`;
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      handleDivingSave({
        divingId: id,
        priceInput,
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

      handleDivingImageUpload({
        divingId: id,
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
      handleDivingDelete({
        divingId: id,
        divingName: diving?.name || `Diving ${id}`,
        deleteButton,
        card,
        inlineStatus,
        statusTag
      });
    });
  }

  return fragment;
}

async function handleDivingSave({ divingId, priceInput, saveButton, inlineStatus, statusTag }) {
  const existing = getDivingFromState(divingId) || {};

  const priceValue = priceInput?.value ?? '';
  const payload = {};

  if (priceValue !== '') {
    const parsedPrice = Number(priceValue);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showInlineStatus(inlineStatus, 'Enter a valid non-negative price.', 'error');
      setStatusTag(statusTag, 'Validation error', 'error');
      return;
    }

    if (Number(existing.price_per_head) !== parsedPrice) {
      payload.price_per_head = parsedPrice;
    }
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
    const response = await fetch(`${API_BASE_URL}/diving/${divingId}`, {
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
      throw new Error(result.message || 'Failed to update diving record');
    }

    const updatedDiving = result.diving;
    updateDivingInState(updatedDiving);

    if (priceInput && updatedDiving?.price_per_head !== undefined) {
      priceInput.value = getPriceDisplayValue(updatedDiving.price_per_head);
    }

    showInlineStatus(inlineStatus, 'Changes saved!', 'success');
    setStatusTag(statusTag, 'Saved just now', 'success');
    showSuccessMessage(`${updatedDiving?.name || 'Diving record'} updated successfully!`);
  } catch (error) {
    console.error('❌ Error saving diving record:', error);
    showInlineStatus(inlineStatus, `Save failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Save failed', 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }

    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleDivingImageUpload({ divingId, file, uploadButton, inlineStatus, statusTag, imageElement, fileInput }) {
  showInlineStatus(inlineStatus, 'Uploading image...');
  setStatusTag(statusTag, 'Uploading...', 'default');

  if (uploadButton) {
    uploadButton.disabled = true;
  }

  try {
    const imageData = await readFileAsBase64(file);

    const response = await fetch(`${API_BASE_URL}/diving/${divingId}/upload-image`, {
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
      throw new Error(result.message || 'Failed to upload diving image');
    }

    const updatedDiving = result.diving;
    updateDivingInState(updatedDiving);

    if (imageElement && result.imageUrl) {
      imageElement.src = result.imageUrl;
    }

    showInlineStatus(inlineStatus, 'Image updated successfully', 'success');
    setStatusTag(statusTag, 'Image updated', 'success');
    showSuccessMessage(`${updatedDiving?.name || 'Diving record'} image updated!`);
  } catch (error) {
    console.error('❌ Error uploading diving image:', error);
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

async function handleDivingDelete({ divingId, divingName, deleteButton, card, inlineStatus, statusTag }) {
  const confirmed = confirm(`Are you sure you want to delete "${divingName}"?\n\nThis action cannot be undone. The diving record will be removed from Supabase and will no longer appear on the home page.`);
  
  if (!confirmed) {
    return;
  }

  showInlineStatus(inlineStatus, 'Deleting diving record...');
  setStatusTag(statusTag, 'Deleting...', 'default');

  if (deleteButton) {
    deleteButton.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/diving/${divingId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete diving record');
    }

    // Remove from state
    const filtered = divingState.data.filter(d => resolveDivingId(d) !== divingId);
    setDivingData(filtered);

    // Remove card from DOM
    if (card && card.parentElement) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        card.remove();
      }, 300);
    }

    showSuccessMessage(`${divingName} deleted successfully!`);
    
    // Re-render to ensure UI is in sync
    renderDiving();
  } catch (error) {
    console.error('❌ Error deleting diving record:', error);
    showInlineStatus(inlineStatus, `Delete failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Delete failed', 'error');
    
    if (deleteButton) {
      deleteButton.disabled = false;
    }
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

function showNewDivingCard() {
  const newCard = document.getElementById('diving-new-card');
  const listContainer = divingUI.list?.parentElement;

  if (!newCard || !listContainer) {
    return;
  }

  if (newCard.parentElement !== listContainer) {
    listContainer.insertBefore(newCard, divingUI.list);
  }

  newCard.hidden = false;
  newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideNewDivingCard() {
  const newCard = document.getElementById('diving-new-card');
  if (newCard) {
    newCard.hidden = true;
  }
}

function clearNewDivingForm() {
  const nameInput = document.getElementById('new-diving-name');
  const priceInput = document.getElementById('new-diving-price');
  const statusEl = document.getElementById('new-diving-status');
  const fileInput = document.getElementById('new-diving-file-input');
  const imageElement = document.querySelector('#diving-new-card .vehicle-image');

  if (nameInput) {
    nameInput.value = '';
  }
  if (priceInput) {
    priceInput.value = '';
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
  
  newDivingImageFile = null;
}

async function handleCreateDiving() {
  const nameInput = document.getElementById('new-diving-name');
  const priceInput = document.getElementById('new-diving-price');
  const statusEl = document.getElementById('new-diving-status');
  const saveBtn = document.getElementById('new-diving-save-btn');
  const cancelBtn = document.getElementById('new-diving-cancel-btn');

  if (!nameInput || !priceInput || !statusEl || !saveBtn || !cancelBtn) {
    return;
  }

  const name = (nameInput.value || '').trim();
  const priceValue = priceInput.value || '';

  if (!name) {
    showInlineStatus(statusEl, 'Enter a diving name.', 'error');
    setTimeout(() => clearInlineStatus(statusEl), 3000);
    return;
  }

  if (!priceValue) {
    showInlineStatus(statusEl, 'Enter a price per head.', 'error');
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
    price_per_head: parsedPrice
  };

  showInlineStatus(statusEl, 'Creating diving record...');
  saveBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/diving`, {
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
      throw new Error(result.message || 'Failed to create diving record');
    }

    const newDiving = result.diving;
    
    // Add new diving to state first (without image yet)
    setDivingData([...divingState.data, newDiving]);
    
    // Append new diving card first (will show placeholder initially)
    const newCardFragment = createDivingCard(newDiving);
    let newCard = null;
    if (divingUI.list && newCardFragment) {
      divingUI.list.appendChild(newCardFragment);
      const divingId = newDiving.diving_id;
      newCard = divingUI.list.querySelector(`[data-diving-id="${divingId}"]`);
    } else {
      renderDiving();
    }
    
    // Upload image if one was selected (after card is created)
    if (newDivingImageFile && newDiving.diving_id) {
      showInlineStatus(statusEl, 'Uploading image...');
      console.log('📤 Starting image upload for diving:', newDiving.diving_id);
      
      try {
        const imageData = await readFileAsBase64(newDivingImageFile);
        console.log('📦 Image data prepared, size:', imageData.length, 'chars');
        
        const imageResponse = await fetch(`${API_BASE_URL}/diving/${newDiving.diving_id}/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            imageData,
            fileName: newDivingImageFile.name
          }),
          cache: 'no-cache'
        });
        
        const imageResult = await parseJsonResponse(imageResponse);
        console.log('📥 Image upload response:', {
          ok: imageResponse.ok,
          success: imageResult.success,
          imageUrl: imageResult.imageUrl,
          diving_image: imageResult.diving?.diving_image
        });
        
        if (imageResponse.ok && imageResult.success && imageResult.diving) {
          Object.assign(newDiving, imageResult.diving);
          
          updateDivingInState(newDiving);
          
          if (!newCard) {
            const divingId = newDiving.diving_id;
            newCard = divingUI.list?.querySelector(`[data-diving-id="${divingId}"]`);
          }
          
          if (newCard) {
            const imageElement = newCard.querySelector('.vehicle-image');
            if (imageElement) {
              const imageUrl = imageResult.imageUrl || imageResult.diving?.diving_image || newDiving.diving_image;
              if (imageUrl) {
                imageElement.src = imageUrl;
                imageElement.alt = `${newDiving.name || 'Diving'} preview`;
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
    
    hideNewDivingCard();
    clearNewDivingForm();
    showSuccessMessage(`${newDiving.name || 'Diving record'} created successfully!`);
  } catch (error) {
    console.error('❌ Error creating diving record:', error);
    showInlineStatus(statusEl, `Creation failed: ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    setTimeout(() => clearInlineStatus(statusEl), 4000);
  }
}

function initializeDivingManager() {
  divingUI.list = document.getElementById('diving-list');
  divingUI.error = document.getElementById('diving-error');
  divingUI.syncStatus = document.getElementById('diving-sync-status');
  divingUI.refreshBtn = document.getElementById('diving-refresh-btn');
  divingUI.template = document.getElementById('diving-card-template');

  if (!divingUI.list || !divingUI.template) {
    return;
  }

  updateDivingSyncStatus();

  const addBtn = document.getElementById('diving-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showNewDivingCard();
      document.getElementById('new-diving-name')?.focus();
    });
  }

  const cancelBtn = document.getElementById('new-diving-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideNewDivingCard();
      clearNewDivingForm();
    });
  }

  const saveBtn = document.getElementById('new-diving-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleCreateDiving);
  }

  const uploadBtn = document.getElementById('new-diving-upload-btn');
  const fileInput = document.getElementById('new-diving-file-input');
  const newImageElement = document.querySelector('#diving-new-card .vehicle-image');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const [file] = fileInput.files || [];
      if (!file) {
        return;
      }

      newDivingImageFile = file;

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

  if (divingUI.refreshBtn) {
    divingUI.refreshBtn.addEventListener('click', () => {
      loadDiving();
    });
  }

  loadDiving();
}

// Van destination management state
const vanDestinationState = {
  data: [],
  byId: new Map(),
  lastSynced: null,
  isLoading: false
};

const vanDestinationUI = {
  list: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  template: null
};

function resolveVanDestinationId(destination) {
  return destination?.van_destination_id ?? destination?.id ?? null;
}

function setVanDestinationData(destinations) {
  const filteredDestinations = (Array.isArray(destinations) ? destinations : []).filter(dest => {
    const name = (dest?.destination_name || '').trim().toLowerCase();
    return name && name !== 'n/a';
  });

  vanDestinationState.data = filteredDestinations;
  vanDestinationState.byId = new Map();

  vanDestinationState.data.forEach(dest => {
    const id = resolveVanDestinationId(dest);
    if (id !== null && id !== undefined) {
      vanDestinationState.byId.set(String(id), dest);
    }
  });
}

function getVanDestinationFromState(destinationId) {
  return vanDestinationState.byId.get(String(destinationId));
}

function updateVanDestinationInState(destination) {
  const id = resolveVanDestinationId(destination);
  if (id === null || id === undefined) {
    return;
  }

  vanDestinationState.byId.set(String(id), destination);
  vanDestinationState.data = vanDestinationState.data.map(item => (resolveVanDestinationId(item) === id ? destination : item));
}

function setVanDestinationLoading(isLoading) {
  vanDestinationState.isLoading = isLoading;

  if (vanDestinationUI.refreshBtn) {
    vanDestinationUI.refreshBtn.disabled = isLoading;
  }

  if (vanDestinationUI.list) {
    vanDestinationUI.list.setAttribute('aria-busy', String(isLoading));
  }
}

function setVanDestinationError(message = '') {
  if (!vanDestinationUI.error) {
    return;
  }

  if (message) {
    vanDestinationUI.error.textContent = message;
    vanDestinationUI.error.hidden = false;
  } else {
    vanDestinationUI.error.textContent = '';
    vanDestinationUI.error.hidden = true;
  }
}

function updateVanDestinationSyncStatus() {
  if (!vanDestinationUI.syncStatus) {
    return;
  }

  if (!vanDestinationState.lastSynced) {
    vanDestinationUI.syncStatus.textContent = 'Last synced: waiting...';
    return;
  }

  vanDestinationUI.syncStatus.textContent = `Last synced: ${formatSyncTimestamp(vanDestinationState.lastSynced)}`;
}

async function loadVanDestinations() {
  if (!vanDestinationUI.list || !vanDestinationUI.template) {
    return;
  }

  setVanDestinationError('');
  setVanDestinationLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/van-destinations`);
    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load van destinations');
    }

    setVanDestinationData(result.destinations || []);
    vanDestinationState.lastSynced = new Date();
    updateVanDestinationSyncStatus();
    renderVanDestinations();
  } catch (error) {
    console.error('❌ Failed to load van destinations:', error);
    setVanDestinationData([]);
    if (vanDestinationUI.list) {
      vanDestinationUI.list.innerHTML = '';
      vanDestinationUI.list.hidden = true;
    }
    setVanDestinationError(`Failed to load van destinations: ${error.message}`);
  } finally {
    setVanDestinationLoading(false);
  }
}

function renderVanDestinations() {
  if (!vanDestinationUI.list) {
    return;
  }

  vanDestinationUI.list.innerHTML = '';

  const destinations = vanDestinationState.data;
  const hasDestinations = destinations.length > 0;

  vanDestinationUI.list.hidden = !hasDestinations;

  if (!hasDestinations) {
    return;
  }

  destinations.forEach(destination => {
    const card = createVanDestinationCard(destination);
    vanDestinationUI.list.appendChild(card);
  });
}

function createVanDestinationCard(destination) {
  const id = resolveVanDestinationId(destination);
  const fragment = vanDestinationUI.template.content.cloneNode(true);
  const card = fragment.querySelector('.vehicle-card');
  const nameElement = fragment.querySelector('.vehicle-name');
  const idElement = fragment.querySelector('.vehicle-id');
  const statusTag = fragment.querySelector('.vehicle-status-tag');
  const locationTypeInput = fragment.querySelector('.van-location-type');
  const destinationNameInput = fragment.querySelector('.van-destination-name');
  const onewayPriceInput = fragment.querySelector('.van-oneway-price');
  const roundtripPriceInput = fragment.querySelector('.van-roundtrip-price');
  const saveButton = fragment.querySelector('.van-save-btn');
  const inlineStatus = fragment.querySelector('.vehicle-inline-status');
  const deleteButton = fragment.querySelector('.van-delete-btn');

  if (card) {
    card.dataset.vanDestinationId = id;
  }

  if (nameElement) {
    nameElement.textContent = destination?.destination_name || `Destination ${id}`;
  }

  if (idElement) {
    idElement.textContent = `ID: ${id}`;
  }

  if (statusTag) {
    setStatusTag(statusTag, 'Synced');
  }

  if (locationTypeInput) {
    locationTypeInput.value = destination?.location_type || '';
    // Ensure the option exists, if not, set to empty
    if (locationTypeInput.value && !Array.from(locationTypeInput.options).some(opt => opt.value === locationTypeInput.value)) {
      locationTypeInput.value = '';
    }
  }

  if (destinationNameInput) {
    destinationNameInput.value = destination?.destination_name || '';
  }

  if (onewayPriceInput) {
    onewayPriceInput.value = getPriceDisplayValue(destination?.oneway_price);
  }

  if (roundtripPriceInput) {
    roundtripPriceInput.value = getPriceDisplayValue(destination?.roundtrip_price);
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      handleVanDestinationSave({
        destinationId: id,
        locationTypeInput,
        destinationNameInput,
        onewayPriceInput,
        roundtripPriceInput,
        saveButton,
        inlineStatus,
        statusTag
      });
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      // Get the card element from the actual DOM (not fragment)
      const actualCard = deleteButton.closest('.vehicle-card');
      const cardId = actualCard ? actualCard.dataset.vanDestinationId : id;
      
      handleVanDestinationDelete({
        destinationId: cardId || id,
        destinationName: destination?.destination_name || `Destination ${cardId || id}`,
        deleteButton,
        card: actualCard || card,
        inlineStatus,
        statusTag
      });
    });
  }

  return fragment;
}

async function handleVanDestinationSave({ destinationId, locationTypeInput, destinationNameInput, onewayPriceInput, roundtripPriceInput, saveButton, inlineStatus, statusTag }) {
  const existing = getVanDestinationFromState(destinationId) || {};

  const locationTypeValue = locationTypeInput?.value?.trim() ?? '';
  const destinationNameValue = destinationNameInput?.value?.trim() ?? '';
  const onewayPriceValue = onewayPriceInput?.value ?? '';
  const roundtripPriceValue = roundtripPriceInput?.value ?? '';
  const payload = {};

  if (locationTypeValue !== (existing.location_type || '')) {
    payload.location_type = locationTypeValue || null;
  }

  if (destinationNameValue !== (existing.destination_name || '')) {
    payload.destination_name = destinationNameValue;
  }

  if (onewayPriceValue !== '') {
    const parsedPrice = Number(onewayPriceValue);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showInlineStatus(inlineStatus, 'Enter a valid non-negative one-way price.', 'error');
      setStatusTag(statusTag, 'Validation error', 'error');
      return;
    }

    if (Number(existing.oneway_price) !== parsedPrice) {
      payload.oneway_price = parsedPrice;
    }
  }

  if (roundtripPriceValue !== '') {
    const parsedPrice = Number(roundtripPriceValue);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showInlineStatus(inlineStatus, 'Enter a valid non-negative round-trip price.', 'error');
      setStatusTag(statusTag, 'Validation error', 'error');
      return;
    }

    if (Number(existing.roundtrip_price) !== parsedPrice) {
      payload.roundtrip_price = parsedPrice;
    }
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
    const response = await fetch(`${API_BASE_URL}/van-destinations/${destinationId}`, {
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
      throw new Error(result.message || 'Failed to update van destination');
    }

    const updatedDestination = result.destination;
    updateVanDestinationInState(updatedDestination);

    // Update the card's name element if destination name changed
    if (updatedDestination?.destination_name) {
      const cardElement = document.querySelector(`[data-van-destination-id="${destinationId}"]`);
      if (cardElement) {
        const nameEl = cardElement.querySelector('.vehicle-name');
        if (nameEl) {
          nameEl.textContent = updatedDestination.destination_name;
        }
      }
    }

    if (locationTypeInput && updatedDestination?.location_type !== undefined) {
      locationTypeInput.value = updatedDestination.location_type || '';
    }

    if (destinationNameInput && updatedDestination?.destination_name !== undefined) {
      destinationNameInput.value = updatedDestination.destination_name || '';
    }

    if (onewayPriceInput && updatedDestination?.oneway_price !== undefined) {
      onewayPriceInput.value = getPriceDisplayValue(updatedDestination.oneway_price);
    }

    if (roundtripPriceInput && updatedDestination?.roundtrip_price !== undefined) {
      roundtripPriceInput.value = getPriceDisplayValue(updatedDestination.roundtrip_price);
    }

    showInlineStatus(inlineStatus, 'Changes saved!', 'success');
    setStatusTag(statusTag, 'Saved just now', 'success');
    showSuccessMessage(`${updatedDestination?.destination_name || 'Van destination'} updated successfully!`);
  } catch (error) {
    console.error('❌ Error saving van destination:', error);
    showInlineStatus(inlineStatus, `Save failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Save failed', 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }

    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleVanDestinationDelete({ destinationId, destinationName, deleteButton, card, inlineStatus, statusTag }) {
  // Get the ID from card element if destinationId is invalid
  let actualId = destinationId;
  if (!actualId && card) {
    actualId = card.getAttribute('data-van-destination-id');
  }

  // Validate ID
  if (!actualId || actualId === 'null' || actualId === 'undefined') {
    console.error('❌ Invalid destination ID:', actualId);
    showInlineStatus(inlineStatus, 'Error: Invalid destination ID. Please refresh the page.', 'error');
    setStatusTag(statusTag, 'Error', 'error');
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete "${destinationName}"?\n\nThis action cannot be undone. The destination will be removed from Supabase and will no longer appear in van rental bookings.`);
  
  if (!confirmed) {
    return;
  }

  showInlineStatus(inlineStatus, 'Deleting destination...');
  setStatusTag(statusTag, 'Deleting...', 'default');

  if (deleteButton) {
    deleteButton.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/van-destinations/${actualId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete van destination');
    }

    // Remove from state
    const filtered = vanDestinationState.data.filter(d => {
      const dId = resolveVanDestinationId(d);
      return String(dId) !== String(actualId);
    });
    setVanDestinationData(filtered);

    // Remove card from DOM
    if (card && card.parentElement) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        card.remove();
      }, 300);
    }

    showSuccessMessage(`${destinationName} deleted successfully!`);
    
    // Re-render to ensure UI is in sync
    renderVanDestinations();
  } catch (error) {
    console.error('❌ Error deleting van destination:', error);
    showInlineStatus(inlineStatus, `Delete failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Delete failed', 'error');
    
    if (deleteButton) {
      deleteButton.disabled = false;
    }
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

function showNewVanDestinationCard() {
  const newCard = document.getElementById('van-new-card');
  const listContainer = vanDestinationUI.list?.parentElement;

  if (!newCard || !listContainer) {
    return;
  }

  if (newCard.parentElement !== listContainer) {
    listContainer.insertBefore(newCard, vanDestinationUI.list);
  }

  newCard.hidden = false;
  newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideNewVanDestinationCard() {
  const newCard = document.getElementById('van-new-card');
  if (newCard) {
    newCard.hidden = true;
  }
}

function clearNewVanDestinationForm() {
  const locationTypeInput = document.getElementById('new-van-location-type');
  const destinationNameInput = document.getElementById('new-van-destination-name');
  const onewayPriceInput = document.getElementById('new-van-oneway-price');
  const roundtripPriceInput = document.getElementById('new-van-roundtrip-price');
  const statusEl = document.getElementById('new-van-status');

  if (locationTypeInput) {
    locationTypeInput.value = '';
  }
  if (destinationNameInput) {
    destinationNameInput.value = '';
  }
  if (onewayPriceInput) {
    onewayPriceInput.value = '';
  }
  if (roundtripPriceInput) {
    roundtripPriceInput.value = '';
  }
  if (statusEl) {
    statusEl.textContent = '';
    delete statusEl.dataset.status;
  }
}

async function handleCreateVanDestination() {
  const locationTypeInput = document.getElementById('new-van-location-type');
  const destinationNameInput = document.getElementById('new-van-destination-name');
  const onewayPriceInput = document.getElementById('new-van-oneway-price');
  const roundtripPriceInput = document.getElementById('new-van-roundtrip-price');
  const statusEl = document.getElementById('new-van-status');
  const saveBtn = document.getElementById('new-van-save-btn');
  const cancelBtn = document.getElementById('new-van-cancel-btn');

  if (!destinationNameInput || !onewayPriceInput || !roundtripPriceInput || !statusEl || !saveBtn || !cancelBtn) {
    return;
  }

  const locationType = (locationTypeInput?.value || '').trim();
  const destinationName = (destinationNameInput.value || '').trim();
  const onewayPriceValue = onewayPriceInput.value || '';
  const roundtripPriceValue = roundtripPriceInput.value || '';

  if (!destinationName) {
    showInlineStatus(statusEl, 'Enter a destination name.', 'error');
    setTimeout(() => clearInlineStatus(statusEl), 3000);
    return;
  }

  const payload = {
    destination_name: destinationName
  };

  // Validate and add one-way price (default to 0 if empty)
  if (onewayPriceValue !== '') {
    const parsedOnewayPrice = Number(onewayPriceValue);
    if (!Number.isFinite(parsedOnewayPrice) || parsedOnewayPrice < 0) {
      showInlineStatus(statusEl, 'Enter a valid non-negative one-way price.', 'error');
      setTimeout(() => clearInlineStatus(statusEl), 3000);
      return;
    }
    payload.oneway_price = parsedOnewayPrice;
  } else {
    // Set to 0 if no input provided
    payload.oneway_price = 0;
  }

  // Validate and add round-trip price (default to 0 if empty)
  if (roundtripPriceValue !== '') {
    const parsedRoundtripPrice = Number(roundtripPriceValue);
    if (!Number.isFinite(parsedRoundtripPrice) || parsedRoundtripPrice < 0) {
      showInlineStatus(statusEl, 'Enter a valid non-negative round-trip price.', 'error');
      setTimeout(() => clearInlineStatus(statusEl), 3000);
      return;
    }
    payload.roundtrip_price = parsedRoundtripPrice;
  } else {
    // Set to 0 if no input provided
    payload.roundtrip_price = 0;
  }

  if (locationType) {
    payload.location_type = locationType;
  }

  showInlineStatus(statusEl, 'Creating destination...');
  saveBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/van-destinations`, {
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
      throw new Error(result.message || 'Failed to create van destination');
    }

    const newDestination = result.destination;
    
    // Add new destination to state
    setVanDestinationData([...vanDestinationState.data, newDestination]);
    
    // Append new destination card
    const newCardFragment = createVanDestinationCard(newDestination);
    if (vanDestinationUI.list && newCardFragment) {
      vanDestinationUI.list.appendChild(newCardFragment);
    } else {
      // Fallback to full re-render if append fails
      renderVanDestinations();
    }
    
    hideNewVanDestinationCard();
    clearNewVanDestinationForm();
    showSuccessMessage(`${newDestination.destination_name || 'Van destination'} created successfully!`);
  } catch (error) {
    console.error('❌ Error creating van destination:', error);
    showInlineStatus(statusEl, `Creation failed: ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    setTimeout(() => clearInlineStatus(statusEl), 4000);
  }
}

function initializeVanDestinationManager() {
  vanDestinationUI.list = document.getElementById('van-list');
  vanDestinationUI.error = document.getElementById('van-error');
  vanDestinationUI.syncStatus = document.getElementById('van-sync-status');
  vanDestinationUI.refreshBtn = document.getElementById('van-refresh-btn');
  vanDestinationUI.template = document.getElementById('van-card-template');

  if (!vanDestinationUI.list || !vanDestinationUI.template) {
    return;
  }

  updateVanDestinationSyncStatus();

  const addBtn = document.getElementById('van-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showNewVanDestinationCard();
      document.getElementById('new-van-destination-name')?.focus();
    });
  }

  const cancelBtn = document.getElementById('new-van-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideNewVanDestinationCard();
      clearNewVanDestinationForm();
    });
  }

  const saveBtn = document.getElementById('new-van-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleCreateVanDestination);
  }

  if (vanDestinationUI.refreshBtn) {
    vanDestinationUI.refreshBtn.addEventListener('click', () => {
      loadVanDestinations();
    });
  }

  loadVanDestinations();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  if (!checkSession()) {
    return;
  }

  initializeVehicleManager();
  initializeDivingManager();
  initializeVanDestinationManager();
  console.log('Settings page ready');
});