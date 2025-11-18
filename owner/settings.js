// Settings Page JavaScript - Connected to Owner Dashboard

const API_BASE_URL = (window.API_BASE_URL && window.API_BASE_URL.length > 0)
  ? window.API_BASE_URL
  : 'https://api.otgpuertogaleratravel.com/api';

// Hotel mapping for Package Only tab
const HOTEL_NAME_TO_ID = {
  'Ilaya': '08e190f4-60da-4188-9c8b-de535ef3fcf2',
  'Casa de Honcho': '11986747-1a86-4d88-a952-a66b69c7e3ec',
  'Bliss': '2da89c09-1c3d-4cd5-817d-637c1c0289de',
  'SouthView': '7c071f4b-5ced-4f34-8864-755e5a4d5c38',
  'The Mangyan Grand Hotel': 'd824f56b-db62-442c-9cf4-26f4c0cc83d0'
};

const HOTEL_ID_TO_NAME = Object.fromEntries(
  Object.entries(HOTEL_NAME_TO_ID).map(([k, v]) => [v, k])
);

const PACKAGE_CATEGORIES = ['Package 1', 'Package 2', 'Package 3', 'Package 4'];

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
    window.location.href = '../user/home/home.html';
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

function compressImage(file, maxSizeMB = 2) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with quality 0.8 and reduce if needed
        let quality = 0.8;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Check size and reduce quality if necessary
        while (compressedDataUrl.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        console.log(`🖼️ Image compressed: Original size ~${(file.size / 1024).toFixed(0)}KB, Compressed ~${(compressedDataUrl.length / 1024 / 1.37).toFixed(0)}KB, Quality: ${quality.toFixed(1)}`);
        
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Unable to read the selected file'));
    };
    
    reader.readAsDataURL(file);
  });
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

function renderDivingImages(container, images, divingId) {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!Array.isArray(images) || images.length === 0) {
    container.innerHTML = '<p class="text-muted small mb-0">No images uploaded yet</p>';
    return;
  }

  images.forEach(image => {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'tour-image-wrapper';
    imageWrapper.style.position = 'relative';
    imageWrapper.style.display = 'inline-block';
    imageWrapper.style.marginRight = '10px';
    imageWrapper.style.marginBottom = '10px';

    const img = document.createElement('img');
    img.src = image.image_url;
    img.alt = 'Diving image';
    img.style.width = '100px';
    img.style.height = '100px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '4px';
    img.style.display = 'block';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '5px';
    deleteBtn.style.right = '5px';
    deleteBtn.style.padding = '2px 6px';
    deleteBtn.style.fontSize = '12px';

    const inlineStatus = document.createElement('small');
    inlineStatus.className = 'vehicle-inline-status';
    inlineStatus.style.display = 'none';
    inlineStatus.style.position = 'absolute';
    inlineStatus.style.bottom = '5px';
    inlineStatus.style.left = '5px';
    inlineStatus.style.right = '5px';
    inlineStatus.style.fontSize = '10px';
    inlineStatus.style.padding = '2px 4px';
    inlineStatus.style.borderRadius = '3px';
    inlineStatus.style.backgroundColor = 'rgba(0,0,0,0.7)';
    inlineStatus.style.color = 'white';
    inlineStatus.style.textAlign = 'center';

    const card = container.closest('.vehicle-card');
    const statusTag = card?.querySelector('.vehicle-status-tag');

    deleteBtn.addEventListener('click', () => {
      handleDivingImageDelete({
        divingId,
        imageId: image.image_id,
        imageWrapper,
        inlineStatus,
        statusTag
      });
    });

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(deleteBtn);
    imageWrapper.appendChild(inlineStatus);
    container.appendChild(imageWrapper);
  });
}

async function handleDivingImageDelete({ divingId, imageId, imageWrapper, inlineStatus, statusTag }) {
  const confirmed = confirm('Are you sure you want to delete this image?');
  
  if (!confirmed) {
    return;
  }

  if (inlineStatus) {
    inlineStatus.textContent = 'Deleting...';
    inlineStatus.style.display = 'block';
  }

  if (statusTag) {
    setStatusTag(statusTag, 'Deleting image...', 'default');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/diving/${divingId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete diving image');
    }

    const updatedDiving = result.diving;
    updateDivingInState(updatedDiving);

    if (imageWrapper && imageWrapper.parentElement) {
      imageWrapper.style.opacity = '0';
      imageWrapper.style.transform = 'scale(0.8)';
      imageWrapper.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        imageWrapper.remove();

        const gallery = imageWrapper.parentElement;
        if (gallery && (!updatedDiving?.images || updatedDiving.images.length === 0)) {
          gallery.innerHTML = '<p class="text-muted small mb-0">No images uploaded yet</p>';
        }
      }, 300);
    }

    if (statusTag) {
      setStatusTag(statusTag, 'Image deleted', 'success');
    }

    showSuccessMessage('Image deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting diving image:', error);
    
    if (inlineStatus) {
      inlineStatus.textContent = 'Delete failed';
      inlineStatus.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
    }

    if (statusTag) {
      setStatusTag(statusTag, 'Delete failed', 'error');
    }

    alert(`Failed to delete image: ${error.message}`);
  } finally {
    if (inlineStatus) {
      setTimeout(() => {
        inlineStatus.style.display = 'none';
      }, 3000);
    }
  }
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
  const imagesGallery = fragment.querySelector('.diving-images-gallery');
  const uploadButton = fragment.querySelector('.diving-upload-image-btn');
  const fileInput = fragment.querySelector('.diving-file-input');
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

  if (imagesGallery) {
    renderDivingImages(imagesGallery, diving?.images || [], id);
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
        imagesGallery,
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

async function handleDivingImageUpload({ divingId, file, uploadButton, inlineStatus, statusTag, imagesGallery, fileInput }) {
  showInlineStatus(inlineStatus, 'Uploading image...');
  setStatusTag(statusTag, 'Uploading...', 'default');

  if (uploadButton) {
    uploadButton.disabled = true;
  }

  try {
    const imageData = await compressImage(file, 2); // Compress to max 2MB

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

    if (imagesGallery) {
      renderDivingImages(imagesGallery, updatedDiving?.images || [], divingId);
    }

    showInlineStatus(inlineStatus, 'Image uploaded successfully', 'success');
    setStatusTag(statusTag, 'Image uploaded', 'success');
    showSuccessMessage(`${updatedDiving?.name || 'Diving record'} image uploaded!`);
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

// Tour management state
const tourState = {
  data: [],
  byId: new Map(),
  lastSynced: null,
  isLoading: false
};

const tourUI = {
  list: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  template: null
};

function resolveTourId(tour) {
  return tour?.tour_only_id ?? tour?.id ?? null;
}

function setTourData(tours) {
  const filteredTours = (Array.isArray(tours) ? tours : []).filter(tour => {
    const category = (tour?.category || '').trim();
    return category && ['Inland Tour', 'Snorkeling Tour', 'Island Hopping'].includes(category);
  });

  tourState.data = filteredTours;
  tourState.byId = new Map();

  tourState.data.forEach(tour => {
    const id = resolveTourId(tour);
    if (id !== null && id !== undefined) {
      tourState.byId.set(String(id), tour);
    }
  });
}

function getTourFromState(tourId) {
  return tourState.byId.get(String(tourId));
}

function updateTourInState(tour) {
  const id = resolveTourId(tour);
  if (id === null || id === undefined) {
    return;
  }

  tourState.byId.set(String(id), tour);
  tourState.data = tourState.data.map(item => (resolveTourId(item) === id ? tour : item));
}

function setTourLoading(isLoading) {
  tourState.isLoading = isLoading;

  if (tourUI.refreshBtn) {
    tourUI.refreshBtn.disabled = isLoading;
  }

  if (tourUI.list) {
    tourUI.list.setAttribute('aria-busy', String(isLoading));
  }
}

function setTourError(message = '') {
  if (!tourUI.error) {
    return;
  }

  if (message) {
    tourUI.error.textContent = message;
    tourUI.error.hidden = false;
  } else {
    tourUI.error.textContent = '';
    tourUI.error.hidden = true;
  }
}

function updateTourSyncStatus() {
  if (!tourUI.syncStatus) {
    return;
  }

  if (!tourState.lastSynced) {
    tourUI.syncStatus.textContent = 'Last synced: waiting...';
    return;
  }

  tourUI.syncStatus.textContent = `Last synced: ${formatSyncTimestamp(tourState.lastSynced)}`;
}

async function loadTours() {
  if (!tourUI.list || !tourUI.template) {
    return;
  }

  setTourError('');
  setTourLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/tours`);
    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load tours');
    }

    setTourData(result.tours || []);
    tourState.lastSynced = new Date();
    updateTourSyncStatus();
    renderTours();
  } catch (error) {
    console.error('❌ Failed to load tours:', error);
    setTourData([]);
    if (tourUI.list) {
      tourUI.list.innerHTML = '';
      tourUI.list.hidden = true;
    }
    setTourError(`Failed to load tours: ${error.message}`);
  } finally {
    setTourLoading(false);
  }
}

function renderTours() {
  if (!tourUI.list) {
    return;
  }

  tourUI.list.innerHTML = '';

  const tours = tourState.data;
  const hasTours = tours.length > 0;

  tourUI.list.hidden = !hasTours;

  if (!hasTours) {
    return;
  }

  tours.forEach(tour => {
    const card = createTourCard(tour);
    tourUI.list.appendChild(card);
  });
}

function createTourCard(tour) {
  const id = resolveTourId(tour);
  const fragment = tourUI.template.content.cloneNode(true);
  const card = fragment.querySelector('.vehicle-card');
  const categoryElement = fragment.querySelector('.tour-category');
  const idElement = fragment.querySelector('.vehicle-id');
  const statusTag = fragment.querySelector('.vehicle-status-tag');
  const categoryReadonly = fragment.querySelector('.tour-category-readonly');
  const saveButton = fragment.querySelector('.tour-save-btn');
  const inlineStatus = fragment.querySelector('.vehicle-inline-status');
  const deleteButton = fragment.querySelector('.tour-delete-btn');
  const imagesGallery = fragment.querySelector('.tour-images-gallery');
  const uploadButton = fragment.querySelector('.tour-upload-image-btn');
  const fileInput = fragment.querySelector('.tour-file-input');
  const pricingList = fragment.querySelector('.tour-pricing-list');
  const addPricingButton = fragment.querySelector('.tour-add-pricing-btn');
  const toggleBtn = fragment.querySelector('.tour-toggle-pricing-btn');
  const pricingContent = fragment.querySelector('.tour-pricing-content');

  if (card) {
    card.dataset.tourId = id;
  }

  if (categoryElement) {
    categoryElement.textContent = tour?.category || `Tour ${id}`;
  }

  if (idElement) {
    idElement.textContent = `ID: ${id}`;
  }

  if (statusTag) {
    setStatusTag(statusTag, 'Synced');
  }

  if (categoryReadonly) {
    categoryReadonly.value = tour?.category || '';
  }

  // Render images
  if (imagesGallery) {
    renderTourImages(imagesGallery, tour?.images || [], id);
  }

  // Render pricing tiers
  if (pricingList) {
    renderTourPricing(pricingList, tour?.pricing || [], id);
  }

  // Toggle pricing tiers visibility
  if (toggleBtn && pricingContent) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = pricingContent.classList.contains('show');
      const toggleIcon = toggleBtn.querySelector('.toggle-icon');
      if (isExpanded) {
        pricingContent.classList.remove('show');
        toggleBtn.classList.remove('expanded');
        if (toggleIcon) toggleIcon.textContent = '▼';
        toggleBtn.innerHTML = '<span class="toggle-icon">▼</span> Show Pricing Tiers';
      } else {
        pricingContent.classList.add('show');
        toggleBtn.classList.add('expanded');
        if (toggleIcon) toggleIcon.textContent = '▲';
        toggleBtn.innerHTML = '<span class="toggle-icon">▲</span> Hide Pricing Tiers';
      }
    });
  }

  // Setup save button to save all pricing changes
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      handleTourSaveAllPricing({
        tourId: id,
        pricingList,
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

      handleTourImageUpload({
        tourId: id,
        file,
        uploadButton,
        inlineStatus,
        statusTag,
        imagesGallery,
        fileInput
      });
    });
  }

  if (addPricingButton && pricingList) {
    addPricingButton.addEventListener('click', () => {
      handleAddPricingTier({
        tourId: id,
        pricingList,
        inlineStatus,
        statusTag
      });
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      handleTourDelete({
        tourId: id,
        tourCategory: tour?.category || `Tour ${id}`,
        deleteButton,
        card,
        inlineStatus,
        statusTag
      });
    });
  }

  return fragment;
}

function renderTourImages(container, images, tourId) {
  container.innerHTML = '';

  if (!images || images.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; font-size: 0.875rem;">No images uploaded yet.</p>';
    return;
  }

  images.forEach(image => {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'tour-image-item';
    imageWrapper.style.cssText = 'position: relative; display: inline-block; margin: 0.5rem;';
    
    const img = document.createElement('img');
    img.src = image.image_url || '../Images/logo.png';
    img.alt = 'Tour image';
    img.style.cssText = 'width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = '🗑️';
    deleteBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; padding: 4px 8px; font-size: 0.75rem;';
    deleteBtn.addEventListener('click', () => {
      handleTourImageDelete({
        tourId,
        imageId: image.image_id,
        imageWrapper,
        inlineStatus: container.closest('.vehicle-card').querySelector('.vehicle-inline-status'),
        statusTag: container.closest('.vehicle-card').querySelector('.vehicle-status-tag')
      });
    });
    
    imageWrapper.appendChild(img);
    imageWrapper.appendChild(deleteBtn);
    container.appendChild(imageWrapper);
  });
}

function renderTourPricing(container, pricing, tourId) {
  container.innerHTML = '';

  if (!pricing || pricing.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; font-size: 0.875rem;">No pricing tiers added yet.</p>';
    return;
  }

  pricing.forEach(tier => {
    console.log('🔍 Tour pricing tier:', tier);
    const tierWrapper = document.createElement('div');
    tierWrapper.className = 'tour-pricing-tier';
    tierWrapper.style.cssText = 'border: 1px solid #e5e7eb; padding: 1rem; margin: 0.5rem 0; border-radius: 8px; background: #f9fafb;';
    // Use the correct pricing ID field name
    const pricingId = tier.tour_pricing_id || tier.pricing_id || tier.id;
    console.log('📋 Pricing ID for tier:', pricingId);
    tierWrapper.dataset.pricingId = pricingId;

    tierWrapper.innerHTML = `
      <div>
        <label class="form-field">
          <span>Min Tourist</span>
          <input type="number" min="1" class="pricing-min-tourist" value="${tier.min_tourist || ''}">
        </label>
        <label class="form-field">
          <span>Max Tourist</span>
          <input type="number" min="1" class="pricing-max-tourist" value="${tier.max_tourist || ''}">
        </label>
        <label class="form-field">
          <span>Price per Head (₱)</span>
          <input type="number" min="0" step="0.01" class="pricing-price-per-head" value="${tier.price_per_head || ''}">
        </label>
        <div style="display: flex; gap: 0.5rem; align-items: flex-end;">
          <button type="button" class="btn-danger pricing-delete-btn" style="padding: 0.5rem;">🗑️</button>
        </div>
      </div>
    `;

    const deleteBtn = tierWrapper.querySelector('.pricing-delete-btn');
    const inlineStatus = container.closest('.vehicle-card').querySelector('.vehicle-inline-status');
    const statusTag = container.closest('.vehicle-card').querySelector('.vehicle-status-tag');

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        handlePricingDelete({
          tourId,
          pricingId: pricingId,
          tierWrapper,
          inlineStatus,
          statusTag
        });
      });
    }

    container.appendChild(tierWrapper);
  });
}

async function handleTourSave({ tourId, categorySelect, saveButton, inlineStatus, statusTag }) {
  const existing = getTourFromState(tourId) || {};
  const categoryValue = categorySelect?.value?.trim() ?? '';

  if (!categoryValue) {
    showInlineStatus(inlineStatus, 'Select a category.', 'error');
    setStatusTag(statusTag, 'Validation error', 'error');
    return;
  }

  if (categoryValue === existing.category) {
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
    const response = await fetch(`${API_BASE_URL}/tours/${tourId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ category: categoryValue }),
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update tour');
    }

    const updatedTour = result.tour;
    updateTourInState(updatedTour);

    if (categorySelect && updatedTour?.category !== undefined) {
      categorySelect.value = updatedTour.category;
    }

    const categoryElement = document.querySelector(`[data-tour-id="${tourId}"] .tour-category`);
    if (categoryElement) {
      categoryElement.textContent = updatedTour.category;
    }

    showInlineStatus(inlineStatus, 'Changes saved!', 'success');
    setStatusTag(statusTag, 'Saved just now', 'success');
    showSuccessMessage(`Tour updated successfully!`);
  } catch (error) {
    console.error('❌ Error saving tour:', error);
    showInlineStatus(inlineStatus, `Save failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Save failed', 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }

    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleTourDelete({ tourId, tourCategory, deleteButton, card, inlineStatus, statusTag }) {
  const confirmed = confirm(`Are you sure you want to delete "${tourCategory}"?\n\nThis action cannot be undone. The tour and all its pricing tiers and images will be removed from Supabase.`);
  
  if (!confirmed) {
    return;
  }

  showInlineStatus(inlineStatus, 'Deleting tour...');
  setStatusTag(statusTag, 'Deleting...', 'default');

  if (deleteButton) {
    deleteButton.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tours/${tourId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete tour');
    }

    const filtered = tourState.data.filter(t => resolveTourId(t) !== tourId);
    setTourData(filtered);

    if (card && card.parentElement) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        card.remove();
      }, 300);
    }

    showSuccessMessage(`${tourCategory} deleted successfully!`);
    renderTours();
  } catch (error) {
    console.error('❌ Error deleting tour:', error);
    showInlineStatus(inlineStatus, `Delete failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Delete failed', 'error');
    
    if (deleteButton) {
      deleteButton.disabled = false;
    }
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleTourImageUpload({ tourId, file, uploadButton, inlineStatus, statusTag, imagesGallery, fileInput }) {
  showInlineStatus(inlineStatus, 'Uploading image...');
  setStatusTag(statusTag, 'Uploading...', 'default');

  if (uploadButton) {
    uploadButton.disabled = true;
  }

  try {
    const imageData = await readFileAsBase64(file);

    const response = await fetch(`${API_BASE_URL}/tours/${tourId}/upload-image`, {
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
      throw new Error(result.message || 'Failed to upload tour image');
    }

    // Reload all tours to get updated images
    await loadTours();
    
    // Find and update the specific tour's image gallery
    const updatedTour = getTourFromState(tourId);
    if (updatedTour && imagesGallery) {
      renderTourImages(imagesGallery, updatedTour.images || [], tourId);
    }

    showInlineStatus(inlineStatus, 'Image uploaded successfully', 'success');
    setStatusTag(statusTag, 'Image uploaded', 'success');
    showSuccessMessage('Tour image uploaded!');
  } catch (error) {
    console.error('❌ Error uploading tour image:', error);
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

async function handleTourImageDelete({ tourId, imageId, imageWrapper, inlineStatus, statusTag }) {
  showInlineStatus(inlineStatus, 'Deleting image...');
  setStatusTag(statusTag, 'Deleting...', 'default');

  try {
    const response = await fetch(`${API_BASE_URL}/tours/${tourId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete tour image');
    }

    // Remove image from DOM
    if (imageWrapper && imageWrapper.parentElement) {
      imageWrapper.remove();
    }

    // Reload all tours to update state
    await loadTours();
    
    // Find and update the specific tour's image gallery
    const updatedTour = getTourFromState(tourId);
    const card = document.querySelector(`[data-tour-id="${tourId}"]`);
    const imagesGallery = card?.querySelector('.tour-images-gallery');
    if (updatedTour && imagesGallery) {
      renderTourImages(imagesGallery, updatedTour.images || [], tourId);
    }

    showInlineStatus(inlineStatus, 'Image deleted successfully', 'success');
    setStatusTag(statusTag, 'Image deleted', 'success');
  } catch (error) {
    console.error('❌ Error deleting tour image:', error);
    showInlineStatus(inlineStatus, `Delete failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Delete failed', 'error');
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleAddPricingTier({ tourId, pricingList, inlineStatus, statusTag }) {
  const minTourist = prompt('Enter minimum number of tourists:');
  if (minTourist === null) return;

  const maxTourist = prompt('Enter maximum number of tourists:');
  if (maxTourist === null) return;

  const pricePerHead = prompt('Enter price per head (₱):');
  if (pricePerHead === null) return;

  const minTouristNum = parseInt(minTourist);
  const maxTouristNum = parseInt(maxTourist);
  const pricePerHeadNum = parseFloat(pricePerHead);

  if (Number.isNaN(minTouristNum) || minTouristNum < 1) {
    showInlineStatus(inlineStatus, 'Invalid minimum tourists value.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  if (Number.isNaN(maxTouristNum) || maxTouristNum < 1) {
    showInlineStatus(inlineStatus, 'Invalid maximum tourists value.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  if (minTouristNum > maxTouristNum) {
    showInlineStatus(inlineStatus, 'Minimum tourists must be less than or equal to maximum tourists.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  if (Number.isNaN(pricePerHeadNum) || pricePerHeadNum < 0) {
    showInlineStatus(inlineStatus, 'Invalid price per head value.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  showInlineStatus(inlineStatus, 'Adding pricing tier...');
  setStatusTag(statusTag, 'Adding...', 'default');

  try {
    const response = await fetch(`${API_BASE_URL}/tours/${tourId}/pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        min_tourist: minTouristNum,
        max_tourist: maxTouristNum,
        price_per_head: pricePerHeadNum
      }),
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to add pricing tier');
    }

    // Reload all tours to get updated pricing
    await loadTours();
    
    // Find and update the specific tour's pricing list
    const updatedTour = getTourFromState(tourId);
    if (updatedTour && pricingList) {
      renderTourPricing(pricingList, updatedTour.pricing || [], tourId);
    }

    showInlineStatus(inlineStatus, 'Pricing tier added successfully', 'success');
    setStatusTag(statusTag, 'Tier added', 'success');
    showSuccessMessage('Pricing tier added!');
  } catch (error) {
    console.error('❌ Error adding pricing tier:', error);
    showInlineStatus(inlineStatus, `Failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Failed', 'error');
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleTourSaveAllPricing({ tourId, pricingList, saveButton, inlineStatus, statusTag }) {
  const allTiers = pricingList.querySelectorAll('.tour-pricing-tier');
  
  if (allTiers.length === 0) {
    showInlineStatus(inlineStatus, 'No pricing tiers to save.', 'info');
    setTimeout(() => clearInlineStatus(inlineStatus), 2500);
    return;
  }

  // Validate all tiers first
  const tiersData = [];
  for (const tierWrapper of allTiers) {
    const pricingId = tierWrapper.dataset.pricingId;
    const minTouristInput = tierWrapper.querySelector('.pricing-min-tourist');
    const maxTouristInput = tierWrapper.querySelector('.pricing-max-tourist');
    const pricePerHeadInput = tierWrapper.querySelector('.pricing-price-per-head');

    const minTourist = parseInt(minTouristInput?.value || '0');
    const maxTourist = parseInt(maxTouristInput?.value || '0');
    const pricePerHead = parseFloat(pricePerHeadInput?.value || '0');

    if (Number.isNaN(minTourist) || minTourist < 1) {
      showInlineStatus(inlineStatus, 'Invalid minimum tourists value.', 'error');
      setTimeout(() => clearInlineStatus(inlineStatus), 3000);
      return;
    }

    if (Number.isNaN(maxTourist) || maxTourist < 1) {
      showInlineStatus(inlineStatus, 'Invalid maximum tourists value.', 'error');
      setTimeout(() => clearInlineStatus(inlineStatus), 3000);
      return;
    }

    if (minTourist > maxTourist) {
      showInlineStatus(inlineStatus, 'Min tourists must be ≤ max tourists.', 'error');
      setTimeout(() => clearInlineStatus(inlineStatus), 3000);
      return;
    }

    if (Number.isNaN(pricePerHead) || pricePerHead < 0) {
      showInlineStatus(inlineStatus, 'Invalid price per head value.', 'error');
      setTimeout(() => clearInlineStatus(inlineStatus), 3000);
      return;
    }

    if (!pricingId) {
      showInlineStatus(inlineStatus, 'Pricing tier missing ID. Please refresh.', 'error');
      setTimeout(() => clearInlineStatus(inlineStatus), 3000);
      return;
    }

    tiersData.push({
      pricingId,
      minTourist,
      maxTourist,
      pricePerHead
    });
  }

  showInlineStatus(inlineStatus, 'Saving all pricing tiers...');
  setStatusTag(statusTag, 'Saving...', 'default');

  if (saveButton) {
    saveButton.disabled = true;
  }

  try {
    // Update all pricing tiers
    console.log('📤 Updating pricing tiers:', tiersData);
    const updatePromises = tiersData.map(tier => {
      console.log(`🔄 Updating pricing: tourId=${tourId}, pricingId=${tier.pricingId}`);
      return fetch(`${API_BASE_URL}/tours/${tourId}/pricing/${tier.pricingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          min_tourist: tier.minTourist,
          max_tourist: tier.maxTourist,
          price_per_head: tier.pricePerHead
        }),
        cache: 'no-cache'
      });
    });

    const responses = await Promise.all(updatePromises);
    
    // Check if all requests succeeded
    for (const response of responses) {
      if (!response.ok) {
        const result = await parseJsonResponse(response);
        throw new Error(result.message || 'Failed to update pricing tier');
      }
    }

    // Reload all tours to get updated pricing
    await loadTours();
    
    // Find and update the specific tour's pricing list
    const updatedTour = getTourFromState(tourId);
    if (updatedTour && pricingList) {
      renderTourPricing(pricingList, updatedTour.pricing || [], tourId);
    }

    showInlineStatus(inlineStatus, 'All pricing tiers saved successfully', 'success');
    setStatusTag(statusTag, 'Saved', 'success');
    showSuccessMessage('Tour pricing updated!');
  } catch (error) {
    console.error('❌ Error saving pricing tiers:', error);
    showInlineStatus(inlineStatus, `Failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Failed', 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handlePricingUpdate({ tourId, pricingId, tierWrapper, inlineStatus, statusTag }) {
  console.log('🔍 Updating tour pricing:', { tourId, pricingId });
  
  const minTouristInput = tierWrapper.querySelector('.pricing-min-tourist');
  const maxTouristInput = tierWrapper.querySelector('.pricing-max-tourist');
  const pricePerHeadInput = tierWrapper.querySelector('.pricing-price-per-head');

  const minTourist = parseInt(minTouristInput?.value || '0');
  const maxTourist = parseInt(maxTouristInput?.value || '0');
  const pricePerHead = parseFloat(pricePerHeadInput?.value || '0');

  if (Number.isNaN(minTourist) || minTourist < 1) {
    showInlineStatus(inlineStatus, 'Invalid minimum tourists value.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  if (Number.isNaN(maxTourist) || maxTourist < 1) {
    showInlineStatus(inlineStatus, 'Invalid maximum tourists value.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  if (minTourist > maxTourist) {
    showInlineStatus(inlineStatus, 'Minimum tourists must be less than or equal to maximum tourists.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  if (Number.isNaN(pricePerHead) || pricePerHead < 0) {
    showInlineStatus(inlineStatus, 'Invalid price per head value.', 'error');
    setTimeout(() => clearInlineStatus(inlineStatus), 3000);
    return;
  }

  showInlineStatus(inlineStatus, 'Updating pricing tier...');
  setStatusTag(statusTag, 'Updating...', 'default');

  try {
    const response = await fetch(`${API_BASE_URL}/tours/${tourId}/pricing/${pricingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        min_tourist: minTourist,
        max_tourist: maxTourist,
        price_per_head: pricePerHead
      }),
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update pricing tier');
    }

    // Reload all tours to get updated pricing
    await loadTours();
    
    // Find and update the specific tour's pricing list
    const updatedTour = getTourFromState(tourId);
    const card = tierWrapper.closest('[data-tour-id]');
    const pricingListContainer = card?.querySelector('.tour-pricing-list');
    if (updatedTour && pricingListContainer) {
      renderTourPricing(pricingListContainer, updatedTour.pricing || [], tourId);
    }

    showInlineStatus(inlineStatus, 'Pricing tier updated successfully', 'success');
    setStatusTag(statusTag, 'Tier updated', 'success');
    showSuccessMessage('Pricing tier updated!');
  } catch (error) {
    console.error('❌ Error updating pricing tier:', error);
    showInlineStatus(inlineStatus, `Failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Failed', 'error');
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handlePricingDelete({ tourId, pricingId, tierWrapper, inlineStatus, statusTag }) {
  const confirmed = confirm('Are you sure you want to delete this pricing tier?');
  
  if (!confirmed) {
    return;
  }

  showInlineStatus(inlineStatus, 'Deleting pricing tier...');
  setStatusTag(statusTag, 'Deleting...', 'default');

  try {
    const response = await fetch(`${API_BASE_URL}/tours/${tourId}/pricing/${pricingId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete pricing tier');
    }

    // Remove tier from DOM
    if (tierWrapper && tierWrapper.parentElement) {
      tierWrapper.remove();
    }

    // Reload all tours to update state
    await loadTours();

    showInlineStatus(inlineStatus, 'Pricing tier deleted successfully', 'success');
    setStatusTag(statusTag, 'Tier deleted', 'success');
  } catch (error) {
    console.error('❌ Error deleting pricing tier:', error);
    showInlineStatus(inlineStatus, `Delete failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Delete failed', 'error');
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

function initializeTourManager() {
  tourUI.list = document.getElementById('tour-list');
  tourUI.error = document.getElementById('tour-error');
  tourUI.syncStatus = document.getElementById('tour-sync-status');
  tourUI.refreshBtn = document.getElementById('tour-refresh-btn');
  tourUI.template = document.getElementById('tour-card-template');

  if (!tourUI.list || !tourUI.template) {
    return;
  }

  updateTourSyncStatus();

  if (tourUI.refreshBtn) {
    tourUI.refreshBtn.addEventListener('click', () => {
      loadTours();
    });
  }

  loadTours();
}

// QRCode management state
const qrcodeState = {
  data: [],
  byId: new Map(),
  lastSynced: null,
  isLoading: false
};

let newQrcodeImageFile = null;

const qrcodeUI = {
  list: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  template: null
};

function resolveQrcodeId(qrcode) {
  return qrcode?.qrcode_id ?? qrcode?.id ?? null;
}

function setQrcodeData(qrcodeRecords) {
  const filteredQrcode = (Array.isArray(qrcodeRecords) ? qrcodeRecords : []).filter(qrcode => {
    const name = (qrcode?.name || '').trim();
    return name && ['GCash', 'Paymaya', 'Online Banking'].includes(name);
  });

  qrcodeState.data = filteredQrcode;
  qrcodeState.byId = new Map();

  qrcodeState.data.forEach(qrcode => {
    const id = resolveQrcodeId(qrcode);
    if (id !== null && id !== undefined) {
      qrcodeState.byId.set(String(id), qrcode);
    }
  });
}

function getQrcodeFromState(qrcodeId) {
  return qrcodeState.byId.get(String(qrcodeId));
}

function updateQrcodeInState(qrcode) {
  const id = resolveQrcodeId(qrcode);
  if (id === null || id === undefined) {
    return;
  }

  qrcodeState.byId.set(String(id), qrcode);
  qrcodeState.data = qrcodeState.data.map(item => (resolveQrcodeId(item) === id ? qrcode : item));
}

function setQrcodeLoading(isLoading) {
  qrcodeState.isLoading = isLoading;

  if (qrcodeUI.refreshBtn) {
    qrcodeUI.refreshBtn.disabled = isLoading;
  }

  if (qrcodeUI.list) {
    qrcodeUI.list.setAttribute('aria-busy', String(isLoading));
  }
}

function setQrcodeError(message = '') {
  if (!qrcodeUI.error) {
    return;
  }

  if (message) {
    qrcodeUI.error.textContent = message;
    qrcodeUI.error.hidden = false;
  } else {
    qrcodeUI.error.textContent = '';
    qrcodeUI.error.hidden = true;
  }
}

function updateQrcodeSyncStatus() {
  if (!qrcodeUI.syncStatus) {
    return;
  }

  if (!qrcodeState.lastSynced) {
    qrcodeUI.syncStatus.textContent = 'Last synced: waiting...';
    return;
  }

  qrcodeUI.syncStatus.textContent = `Last synced: ${formatSyncTimestamp(qrcodeState.lastSynced)}`;
}

async function loadQrcode() {
  if (!qrcodeUI.list || !qrcodeUI.template) {
    return;
  }

  setQrcodeError('');
  setQrcodeLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/qrcode`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Please ensure the server is running and the endpoint exists.`);
    }
    
    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load QRCode records');
    }

    setQrcodeData(result.qrcode || []);
    qrcodeState.lastSynced = new Date();
    updateQrcodeSyncStatus();
    renderQrcode();
  } catch (error) {
    console.error('❌ Failed to load QRCode records:', error);
    setQrcodeData([]);
    if (qrcodeUI.list) {
      qrcodeUI.list.innerHTML = '';
      qrcodeUI.list.hidden = true;
    }
    setQrcodeError(`Failed to load QRCode records: ${error.message}`);
  } finally {
    setQrcodeLoading(false);
  }
}

function renderQrcode() {
  if (!qrcodeUI.list) {
    return;
  }

  qrcodeUI.list.innerHTML = '';

  const qrcodeRecords = qrcodeState.data;
  const hasQrcode = qrcodeRecords.length > 0;

  qrcodeUI.list.hidden = !hasQrcode;

  if (!hasQrcode) {
    return;
  }

  qrcodeRecords.forEach(qrcode => {
    const card = createQrcodeCard(qrcode);
    qrcodeUI.list.appendChild(card);
  });
}

function createQrcodeCard(qrcode) {
  const id = resolveQrcodeId(qrcode);
  const fragment = qrcodeUI.template.content.cloneNode(true);
  const card = fragment.querySelector('.vehicle-card');
  const nameElement = fragment.querySelector('.vehicle-name');
  const idElement = fragment.querySelector('.vehicle-id');
  const statusTag = fragment.querySelector('.vehicle-status-tag');
  const nameSelect = fragment.querySelector('.qrcode-name-select');
  const saveButton = fragment.querySelector('.qrcode-save-btn');
  const inlineStatus = fragment.querySelector('.vehicle-inline-status');
  const imageElement = fragment.querySelector('.vehicle-image');
  const uploadButton = fragment.querySelector('.vehicle-upload-btn');
  const fileInput = fragment.querySelector('.vehicle-file-input');
  const deleteButton = fragment.querySelector('.qrcode-delete-btn');

  if (card) {
    card.dataset.qrcodeId = id;
  }

  if (nameElement) {
    nameElement.textContent = qrcode?.name || `QRCode ${id}`;
  }

  if (idElement) {
    idElement.textContent = `ID: ${id}`;
  }

  if (statusTag) {
    setStatusTag(statusTag, 'Synced');
  }

  if (nameSelect) {
    nameSelect.value = qrcode?.name || '';
  }

  if (imageElement) {
    const imageUrl = qrcode?.qrcode_image;
    imageElement.src = (imageUrl && imageUrl.trim() !== '') ? imageUrl : '../Images/logo.png';
    imageElement.alt = `${qrcode?.name || 'QRCode'} preview`;
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      handleQrcodeSave({
        qrcodeId: id,
        nameSelect,
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

      handleQrcodeImageUpload({
        qrcodeId: id,
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
    deleteButton.addEventListener('click', function() {
      // Get the ID from the actual card element in the DOM (not fragment)
      // Use 'this' to get the actual button that was clicked in the DOM
      const actualCard = this.closest('.vehicle-card');
      let cardId = id; // Use the ID from closure as default
      
      if (actualCard) {
        // Try different ways to get the ID
        cardId = actualCard.dataset.qrcodeId || 
                 actualCard.getAttribute('data-qrcode-id') ||
                 id;
      }
      
      console.log('🗑️ Delete clicked - ID:', cardId, 'from card:', actualCard?.dataset.qrcodeId);
      
      handleQrcodeDelete({
        qrcodeId: cardId,
        qrcodeName: qrcode?.name || `QRCode ${cardId}`,
        deleteButton: this,
        card: actualCard || card,
        inlineStatus,
        statusTag
      });
    });
  }

  return fragment;
}

async function handleQrcodeSave({ qrcodeId, nameSelect, saveButton, inlineStatus, statusTag }) {
  const existing = getQrcodeFromState(qrcodeId) || {};

  const nameValue = nameSelect?.value?.trim() ?? '';
  const payload = {};

  if (!nameValue) {
    showInlineStatus(inlineStatus, 'Select a payment method.', 'error');
    setStatusTag(statusTag, 'Validation error', 'error');
    return;
  }

  const validNames = ['GCash', 'Paymaya', 'Online Banking'];
  if (!validNames.includes(nameValue)) {
    showInlineStatus(inlineStatus, 'Invalid payment method.', 'error');
    setStatusTag(statusTag, 'Validation error', 'error');
    return;
  }

  if (nameValue !== (existing.name || '')) {
    payload.name = nameValue;
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
    const response = await fetch(`${API_BASE_URL}/qrcode/${qrcodeId}`, {
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
      throw new Error(result.message || 'Failed to update QRCode record');
    }

    const updatedQrcode = result.qrcode;
    updateQrcodeInState(updatedQrcode);

    if (nameSelect && updatedQrcode?.name !== undefined) {
      nameSelect.value = updatedQrcode.name;
    }

    const nameElement = document.querySelector(`[data-qrcode-id="${qrcodeId}"] .vehicle-name`);
    if (nameElement) {
      nameElement.textContent = updatedQrcode.name;
    }

    showInlineStatus(inlineStatus, 'Changes saved!', 'success');
    setStatusTag(statusTag, 'Saved just now', 'success');
    showSuccessMessage(`${updatedQrcode?.name || 'QRCode record'} updated successfully!`);
  } catch (error) {
    console.error('❌ Error saving QRCode record:', error);
    showInlineStatus(inlineStatus, `Save failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Save failed', 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }

    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

async function handleQrcodeImageUpload({ qrcodeId, file, uploadButton, inlineStatus, statusTag, imageElement, fileInput }) {
  showInlineStatus(inlineStatus, 'Uploading image...');
  setStatusTag(statusTag, 'Uploading...', 'default');

  if (uploadButton) {
    uploadButton.disabled = true;
  }

  try {
    const imageData = await readFileAsBase64(file);

    const response = await fetch(`${API_BASE_URL}/qrcode/${qrcodeId}/upload-image`, {
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
      const errorMessage = result.message || result.error || 'Failed to upload QRCode image';
      console.error('❌ Upload failed:', {
        status: response.status,
        message: errorMessage,
        details: result.error
      });
      
      // Check for bucket error
      if (errorMessage.includes('bucket') || errorMessage.includes('Bucket')) {
        throw new Error('Storage bucket "qrcode-image" not found. Please create it in Supabase Storage → Storage → Create bucket (name: qrcode-image, set as Public).');
      }
      
      throw new Error(errorMessage);
    }

    const updatedQrcode = result.qrcode;
    updateQrcodeInState(updatedQrcode);

    if (imageElement && result.imageUrl) {
      imageElement.src = result.imageUrl;
    } else if (imageElement && updatedQrcode?.qrcode_image) {
      imageElement.src = updatedQrcode.qrcode_image;
    }

    showInlineStatus(inlineStatus, 'Image updated successfully', 'success');
    setStatusTag(statusTag, 'Image updated', 'success');
    showSuccessMessage(`${updatedQrcode?.name || 'QRCode record'} image updated!`);
  } catch (error) {
    console.error('❌ Error uploading QRCode image:', error);
    const errorMsg = error.message || 'Upload failed. Please check server logs.';
    showInlineStatus(inlineStatus, errorMsg, 'error');
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

async function handleQrcodeDelete({ qrcodeId, qrcodeName, deleteButton, card, inlineStatus, statusTag }) {
  // Get the ID from card element if qrcodeId is invalid
  let actualId = qrcodeId;
  
  // Try multiple ways to get the ID
  if (!actualId || actualId === 'null' || actualId === 'undefined') {
    if (card) {
      actualId = card.dataset.qrcodeId || 
                 card.getAttribute('data-qrcode-id');
    }
    
    // If still no ID, try to get it from the delete button's parent card
    if ((!actualId || actualId === 'null' || actualId === 'undefined') && deleteButton) {
      const parentCard = deleteButton.closest('.vehicle-card');
      if (parentCard) {
        actualId = parentCard.dataset.qrcodeId || 
                   parentCard.getAttribute('data-qrcode-id');
      }
    }
  }

  console.log('🔍 Delete attempt - qrcodeId param:', qrcodeId, 'actualId:', actualId, 'card:', card?.dataset?.qrcodeId);

  // Validate ID - convert to string and check
  const idString = String(actualId || '').trim();
  if (!idString || idString === 'null' || idString === 'undefined' || idString === '') {
    console.error('❌ Invalid QRCode ID after all attempts:', {
      qrcodeId,
      actualId,
      cardId: card?.dataset?.qrcodeId,
      cardAttr: card?.getAttribute('data-qrcode-id')
    });
    showInlineStatus(inlineStatus, 'Error: Invalid QRCode ID. Please refresh the page.', 'error');
    setStatusTag(statusTag, 'Error', 'error');
    return;
  }
  
  actualId = idString; // Use the validated string ID

  const confirmed = confirm(`Are you sure you want to delete "${qrcodeName}"?\n\nThis action cannot be undone. The QRCode will be removed from Supabase and will no longer appear on the home page.`);
  
  if (!confirmed) {
    return;
  }

  showInlineStatus(inlineStatus, 'Deleting QRCode record...');
  setStatusTag(statusTag, 'Deleting...', 'default');

  if (deleteButton) {
    deleteButton.disabled = true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/qrcode/${actualId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete QRCode record');
    }

    // Remove from state
    const filtered = qrcodeState.data.filter(q => {
      const qId = resolveQrcodeId(q);
      return String(qId) !== String(actualId);
    });
    setQrcodeData(filtered);

    if (card && card.parentElement) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        card.remove();
      }, 300);
    }

    showSuccessMessage(`${qrcodeName} deleted successfully!`);
    
    renderQrcode();
  } catch (error) {
    console.error('❌ Error deleting QRCode record:', error);
    showInlineStatus(inlineStatus, `Delete failed: ${error.message}`, 'error');
    setStatusTag(statusTag, 'Delete failed', 'error');
    
    if (deleteButton) {
      deleteButton.disabled = false;
    }
    
    setTimeout(() => clearInlineStatus(inlineStatus), 4000);
  }
}

function showNewQrcodeCard() {
  const newCard = document.getElementById('qrcode-new-card');
  const listContainer = qrcodeUI.list?.parentElement;

  if (!newCard || !listContainer) {
    return;
  }

  if (newCard.parentElement !== listContainer) {
    listContainer.insertBefore(newCard, qrcodeUI.list);
  }

  newCard.hidden = false;
  newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideNewQrcodeCard() {
  const newCard = document.getElementById('qrcode-new-card');
  if (newCard) {
    newCard.hidden = true;
  }
}

function clearNewQrcodeForm() {
  const nameInput = document.getElementById('new-qrcode-name');
  const statusEl = document.getElementById('new-qrcode-status');
  const fileInput = document.getElementById('new-qrcode-file-input');
  const imageElement = document.querySelector('#qrcode-new-card .vehicle-image');

  if (nameInput) {
    nameInput.value = '';
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
  
  newQrcodeImageFile = null;
}

async function handleCreateQrcode() {
  const nameInput = document.getElementById('new-qrcode-name');
  const statusEl = document.getElementById('new-qrcode-status');
  const saveBtn = document.getElementById('new-qrcode-save-btn');
  const cancelBtn = document.getElementById('new-qrcode-cancel-btn');

  if (!nameInput || !statusEl || !saveBtn || !cancelBtn) {
    return;
  }

  const name = (nameInput.value || '').trim();

  if (!name) {
    showInlineStatus(statusEl, 'Select a payment method.', 'error');
    setTimeout(() => clearInlineStatus(statusEl), 3000);
    return;
  }

  const validNames = ['GCash', 'Paymaya', 'Online Banking'];
  if (!validNames.includes(name)) {
    showInlineStatus(statusEl, 'Invalid payment method.', 'error');
    setTimeout(() => clearInlineStatus(statusEl), 3000);
    return;
  }

  const payload = {
    name
  };

  showInlineStatus(statusEl, 'Creating QRCode record...');
  saveBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/qrcode`, {
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
      throw new Error(result.message || 'Failed to create QRCode record');
    }

    const newQrcode = result.qrcode;
    
    setQrcodeData([...qrcodeState.data, newQrcode]);
    
    const newCardFragment = createQrcodeCard(newQrcode);
    let newCard = null;
    if (qrcodeUI.list && newCardFragment) {
      qrcodeUI.list.appendChild(newCardFragment);
      const qrcodeId = newQrcode.qrcode_id;
      newCard = qrcodeUI.list.querySelector(`[data-qrcode-id="${qrcodeId}"]`);
    } else {
      renderQrcode();
    }
    
    if (newQrcodeImageFile && newQrcode.qrcode_id) {
      showInlineStatus(statusEl, 'Uploading image...');
      console.log('📤 Starting image upload for QRCode:', newQrcode.qrcode_id);
      
      try {
        const imageData = await readFileAsBase64(newQrcodeImageFile);
        console.log('📦 Image data prepared, size:', imageData.length, 'chars');
        
        const imageResponse = await fetch(`${API_BASE_URL}/qrcode/${newQrcode.qrcode_id}/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            imageData,
            fileName: newQrcodeImageFile.name
          }),
          cache: 'no-cache'
        });
        
        const imageResult = await parseJsonResponse(imageResponse);
        console.log('📥 Image upload response:', {
          ok: imageResponse.ok,
          success: imageResult.success,
          imageUrl: imageResult.imageUrl,
          qrcode_image: imageResult.qrcode?.qrcode_image
        });
        
        if (imageResponse.ok && imageResult.success && imageResult.qrcode) {
          Object.assign(newQrcode, imageResult.qrcode);
          
          updateQrcodeInState(newQrcode);
          
          if (!newCard) {
            const qrcodeId = newQrcode.qrcode_id;
            newCard = qrcodeUI.list?.querySelector(`[data-qrcode-id="${qrcodeId}"]`);
          }
          
          if (newCard) {
            const imageElement = newCard.querySelector('.vehicle-image');
            if (imageElement) {
              const imageUrl = imageResult.imageUrl || imageResult.qrcode?.qrcode_image || newQrcode.qrcode_image;
              if (imageUrl) {
                imageElement.src = imageUrl;
                imageElement.alt = `${newQrcode.name || 'QRCode'} preview`;
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
    
    hideNewQrcodeCard();
    clearNewQrcodeForm();
    showSuccessMessage(`${newQrcode.name || 'QRCode record'} created successfully!`);
  } catch (error) {
    console.error('❌ Error creating QRCode record:', error);
    showInlineStatus(statusEl, `Creation failed: ${error.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    setTimeout(() => clearInlineStatus(statusEl), 4000);
  }
}

function initializeQrcodeManager() {
  qrcodeUI.list = document.getElementById('qrcode-list');
  qrcodeUI.error = document.getElementById('qrcode-error');
  qrcodeUI.syncStatus = document.getElementById('qrcode-sync-status');
  qrcodeUI.refreshBtn = document.getElementById('qrcode-refresh-btn');
  qrcodeUI.template = document.getElementById('qrcode-card-template');

  if (!qrcodeUI.list || !qrcodeUI.template) {
    return;
  }

  updateQrcodeSyncStatus();

  const addBtn = document.getElementById('qrcode-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showNewQrcodeCard();
      document.getElementById('new-qrcode-name')?.focus();
    });
  }

  const cancelBtn = document.getElementById('new-qrcode-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideNewQrcodeCard();
      clearNewQrcodeForm();
    });
  }

  const saveBtn = document.getElementById('new-qrcode-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleCreateQrcode);
  }

  const uploadBtn = document.getElementById('new-qrcode-upload-btn');
  const fileInput = document.getElementById('new-qrcode-file-input');
  const newImageElement = document.querySelector('#qrcode-new-card .vehicle-image');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const [file] = fileInput.files || [];
      if (!file) {
        return;
      }

      newQrcodeImageFile = file;

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

  if (qrcodeUI.refreshBtn) {
    qrcodeUI.refreshBtn.addEventListener('click', () => {
      loadQrcode();
    });
  }

  loadQrcode();
}

// =============================
// PACKAGE ONLY MANAGEMENT
// =============================

const packageState = {
  data: [],
  byId: new Map(),
  lastSynced: null,
  isLoading: false
};

const packageUI = {
  list: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  template: null
};

function resolvePackageId(pkg) {
  return pkg?.package_only_id ?? pkg?.id ?? null;
}

function setPackageData(packages) {
  const rows = Array.isArray(packages) ? packages : [];
  packageState.data = rows;
  packageState.byId = new Map();
  rows.forEach(p => {
    const id = resolvePackageId(p);
    if (id !== null && id !== undefined) {
      packageState.byId.set(String(id), p);
    }
  });
}

function getPackageFromState(id) {
  return packageState.byId.get(String(id));
}

function updatePackageInState(pkg) {
  const id = resolvePackageId(pkg);
  if (id === null || id === undefined) return;
  packageState.byId.set(String(id), pkg);
  packageState.data = packageState.data.map(x => (resolvePackageId(x) === id ? pkg : x));
}

function setPackageLoading(isLoading) {
  packageState.isLoading = isLoading;
  if (packageUI.refreshBtn) packageUI.refreshBtn.disabled = isLoading;
  if (packageUI.list) packageUI.list.setAttribute('aria-busy', String(isLoading));
}

function setPackageError(message = '') {
  if (!packageUI.error) return;
  if (message) {
    packageUI.error.textContent = message;
    packageUI.error.hidden = false;
  } else {
    packageUI.error.textContent = '';
    packageUI.error.hidden = true;
  }
}

function updatePackageSyncStatus() {
  if (!packageUI.syncStatus) return;
  if (!packageState.lastSynced) {
    packageUI.syncStatus.textContent = 'Last synced: waiting...';
    return;
  }
  packageUI.syncStatus.textContent = `Last synced: ${formatSyncTimestamp(packageState.lastSynced)}`;
}

function createPricingRow({ min = '', max = '', price = '' } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tour-pricing-tier';
  wrapper.innerHTML = `
    <div>
      <label>
        <span>Min Tourist</span>
        <input type="number" min="1" class="tier-min" placeholder="e.g., 3" value="${min}">
      </label>
      <label>
        <span>Max Tourist</span>
        <input type="number" min="1" class="tier-max" placeholder="e.g., 5" value="${max}">
      </label>
      <label>
        <span>Price per head (₱)</span>
        <input type="number" min="0" step="0.01" class="tier-price" placeholder="0.00" value="${price}">
      </label>
      <button type="button" class="btn-danger tier-remove-btn">🗑️ Remove</button>
    </div>
  `;
  const removeBtn = wrapper.querySelector('.tier-remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => wrapper.remove());
  }
  return wrapper;
}

function readPricingList(container) {
  const rows = Array.from(container?.querySelectorAll('.tour-pricing-tier') || []);
  return rows.map(r => ({
    min_tourist: Number(r.querySelector('.tier-min')?.value || 0),
    max_tourist: Number(r.querySelector('.tier-max')?.value || 0),
    price_per_head: Number(r.querySelector('.tier-price')?.value || 0)
  })).filter(t => Number.isFinite(t.min_tourist) && Number.isFinite(t.max_tourist) && Number.isFinite(t.price_per_head));
}

function validatePackagePayload({ description, category, hotelName, pricing }) {
  if (!description || !category || !hotelName) return 'Description, category, and hotel are required.';
  if (!PACKAGE_CATEGORIES.includes(category)) return 'Invalid category.';
  const hotel_id = HOTEL_NAME_TO_ID[hotelName];
  if (!hotel_id) return 'Invalid hotel.';
  if (!Array.isArray(pricing) || pricing.length === 0) return 'Add at least one pricing tier.';
  for (const t of pricing) {
    if (t.min_tourist < 1 || t.max_tourist < t.min_tourist || t.price_per_head < 0) return 'Invalid pricing tier values.';
  }
  // Optional: check overlapping tiers
  const sorted = [...pricing].sort((a, b) => a.min_tourist - b.min_tourist);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min_tourist <= sorted[i - 1].max_tourist) return 'Pricing tiers overlap.';
  }
  return null;
}

async function loadPackages() {
  if (!packageUI.list || !packageUI.template) return;
  setPackageError('');
  setPackageLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/package-only?include=pricing`, { cache: 'no-cache' });
    const result = await parseJsonResponse(response);
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load packages');
    }
    setPackageData(result.packages || []);
    packageState.lastSynced = new Date();
    updatePackageSyncStatus();
    renderPackages();
  } catch (err) {
    console.error('❌ Failed to load packages:', err);
    setPackageData([]);
    if (packageUI.list) {
      packageUI.list.innerHTML = '';
      packageUI.list.hidden = true;
    }
    setPackageError(`Failed to load packages: ${err.message}`);
  } finally {
    setPackageLoading(false);
  }
}

function renderPackages() {
  if (!packageUI.list) return;
  packageUI.list.innerHTML = '';
  const items = packageState.data;
  const has = items.length > 0;
  packageUI.list.hidden = !has;
  if (!has) return;
  items.forEach(pkg => packageUI.list.appendChild(createPackageCard(pkg)));
  applyPackageFilters();
}

function applyPackageFilters() {
  if (!packageUI.list) return;
  const hotelFilter = document.getElementById('package-hotel-filter');
  const categoryFilter = document.getElementById('package-category-filter');
  
  const selectedHotel = hotelFilter?.value || '';
  const selectedCategory = categoryFilter?.value || '';
  
  const cards = packageUI.list.querySelectorAll('.vehicle-card');
  let visibleCount = 0;
  
  cards.forEach(card => {
    const cardHotel = card.dataset.hotel || '';
    const cardCategory = card.dataset.category || '';
    
    const hotelMatch = !selectedHotel || cardHotel === selectedHotel;
    const categoryMatch = !selectedCategory || cardCategory === selectedCategory;
    
    const shouldShow = hotelMatch && categoryMatch;
    card.dataset.filtered = shouldShow ? 'true' : 'false';
    if (shouldShow) visibleCount++;
  });
  
  // Hide the list if no packages match the filters
  packageUI.list.hidden = visibleCount === 0;
}

function createPackageCard(pkg) {
  const id = resolvePackageId(pkg);
  const frag = packageUI.template.content.cloneNode(true);
  const card = frag.querySelector('.vehicle-card');
  const title = frag.querySelector('.package-description');
  const idEl = frag.querySelector('.vehicle-id');
  const statusTag = frag.querySelector('.vehicle-status-tag');
  const descInput = frag.querySelector('.package-description-input');
  const categoryReadonly = frag.querySelector('.package-category-readonly');
  const hotelReadonly = frag.querySelector('.package-hotel-readonly');
  const pricingList = frag.querySelector('.package-pricing-list');
  const addTierBtn = frag.querySelector('.package-add-pricing-btn');
  const toggleBtn = frag.querySelector('.package-toggle-pricing-btn');
  const pricingContent = frag.querySelector('.package-pricing-content');
  const saveBtn = frag.querySelector('.package-save-btn');
  const deleteBtn = frag.querySelector('.package-delete-btn');
  const inlineStatus = frag.querySelector('.vehicle-inline-status');

  if (card) {
    card.dataset.packageId = id;
    // Add data attributes for filtering
    card.dataset.hotel = HOTEL_ID_TO_NAME[pkg?.hotel_id] || '';
    card.dataset.category = pkg?.category || '';
    card.dataset.filtered = 'true';
  }
  if (title) title.textContent = pkg?.description || 'Package';
  if (idEl) idEl.textContent = `ID: ${id}`;
  if (statusTag) setStatusTag(statusTag, 'Synced');
  if (descInput) descInput.value = pkg?.description || '';
  if (categoryReadonly) categoryReadonly.value = pkg?.category || '';
  if (hotelReadonly) hotelReadonly.value = HOTEL_ID_TO_NAME[pkg?.hotel_id] || '';

  if (pricingList) {
    (pkg?.pricing || []).forEach(t => {
      pricingList.appendChild(createPricingRow({ min: t.min_tourist, max: t.max_tourist, price: t.price_per_head }));
    });
  }
  if (addTierBtn && pricingList) {
    addTierBtn.addEventListener('click', () => pricingList.appendChild(createPricingRow()));
  }

  // Toggle pricing tiers visibility
  if (toggleBtn && pricingContent) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = pricingContent.classList.contains('show');
      const toggleIcon = toggleBtn.querySelector('.toggle-icon');
      if (isExpanded) {
        pricingContent.classList.remove('show');
        toggleBtn.classList.remove('expanded');
        if (toggleIcon) toggleIcon.textContent = '▼';
        toggleBtn.innerHTML = '<span class="toggle-icon">▼</span> Show Pricing Tiers';
      } else {
        pricingContent.classList.add('show');
        toggleBtn.classList.add('expanded');
        if (toggleIcon) toggleIcon.textContent = '▲';
        toggleBtn.innerHTML = '<span class="toggle-icon">▲</span> Hide Pricing Tiers';
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const description = descInput?.value?.trim() || '';
      const pricing = readPricingList(pricingList);
      // Validate tiers only; category and hotel are fixed from Supabase
      const validationError = (() => {
        if (!Array.isArray(pricing) || pricing.length === 0) return 'Add at least one pricing tier.';
        for (const t of pricing) {
          if (t.min_tourist < 1 || t.max_tourist < t.min_tourist || t.price_per_head < 0) return 'Invalid pricing tier values.';
        }
        const sorted = [...pricing].sort((a, b) => a.min_tourist - b.min_tourist);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].min_tourist <= sorted[i - 1].max_tourist) return 'Pricing tiers overlap.';
        }
        return null;
      })();
      if (validationError) {
        showInlineStatus(inlineStatus, validationError, 'error');
        setStatusTag(statusTag, 'Validation error', 'error');
        return;
      }
      showInlineStatus(inlineStatus, 'Saving changes...');
      setStatusTag(statusTag, 'Saving...', 'default');
      saveBtn.disabled = true;
      try {
        const payload = { description, pricing };
        const response = await fetch(`${API_BASE_URL}/package-only/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-cache'
        });
        const result = await parseJsonResponse(response);
        if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update package');
        const updated = result.package;
        updatePackageInState(updated);
        showInlineStatus(inlineStatus, 'Changes saved!', 'success');
        setStatusTag(statusTag, 'Saved just now', 'success');
        const titleEl = card.querySelector('.package-description');
        if (titleEl) titleEl.textContent = updated.description || 'Package';
        showSuccessMessage(`${updated.description || 'Package'} updated successfully!`);
      } catch (e) {
        console.error('❌ Error saving package:', e);
        showInlineStatus(inlineStatus, `Save failed: ${e.message}`, 'error');
        setStatusTag(statusTag, 'Save failed', 'error');
      } finally {
        saveBtn.disabled = false;
        setTimeout(() => clearInlineStatus(inlineStatus), 4000);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const name = descInput?.value?.trim() || 'this package';
      if (!confirm(`Delete ${name}? This action cannot be undone.`)) return;
      showInlineStatus(inlineStatus, 'Deleting...');
      setStatusTag(statusTag, 'Deleting...', 'default');
      deleteBtn.disabled = true;
      try {
        const response = await fetch(`${API_BASE_URL}/package-only/${id}`, { method: 'DELETE', cache: 'no-cache' });
        const result = await parseJsonResponse(response);
        if (!response.ok || !result.success) throw new Error(result.message || 'Delete failed');
        const el = packageUI.list?.querySelector(`[data-package-id="${id}"]`);
        el?.remove();
        packageState.data = packageState.data.filter(x => resolvePackageId(x) !== id);
        packageState.byId.delete(String(id));
        showInlineStatus(inlineStatus, 'Deleted', 'success');
        setStatusTag(statusTag, 'Deleted', 'success');
        showSuccessMessage(`${name} deleted successfully!`);
      } catch (e) {
        console.error('❌ Error deleting package:', e);
        showInlineStatus(inlineStatus, `Delete failed: ${e.message}`, 'error');
        setStatusTag(statusTag, 'Delete failed', 'error');
      } finally {
        deleteBtn.disabled = false;
        setTimeout(() => clearInlineStatus(inlineStatus), 3000);
      }
    });
  }

  return frag;
}

function showNewPackageCard() {
  document.getElementById('package-new-card')?.removeAttribute('hidden');
}

function hideNewPackageCard() {
  document.getElementById('package-new-card')?.setAttribute('hidden', '');
}

function clearNewPackageForm() {
  const descEl = document.getElementById('new-package-description');
  if (descEl) descEl.value = '';
  const catEl = document.getElementById('new-package-category');
  if (catEl) catEl.value = '';
  const hotelEl = document.getElementById('new-package-hotel');
  if (hotelEl) hotelEl.value = '';
  const list = document.getElementById('new-package-pricing-list');
  if (list) list.innerHTML = '';
}

async function handleCreatePackage() {
  const saveBtn = document.getElementById('new-package-save-btn');
  const cancelBtn = document.getElementById('new-package-cancel-btn');
  const statusEl = document.getElementById('new-package-status');
  const desc = document.getElementById('new-package-description');
  const category = document.getElementById('new-package-category');
  const hotel = document.getElementById('new-package-hotel');
  const pricingList = document.getElementById('new-package-pricing-list');

  if (saveBtn) saveBtn.disabled = true;
  if (cancelBtn) cancelBtn.disabled = true;
  showInlineStatus(statusEl, 'Creating package...');

  try {
    const description = desc?.value?.trim() || '';
    const categoryValue = category?.value || '';
    const hotelName = hotel?.value || '';
    const pricing = readPricingList(pricingList);
    const validationError = validatePackagePayload({ description, category: categoryValue, hotelName, pricing });
    if (validationError) {
      showInlineStatus(statusEl, validationError, 'error');
      return;
    }
    const payload = {
      description,
      category: categoryValue,
      hotel_id: HOTEL_NAME_TO_ID[hotelName],
      pricing
    };
    const response = await fetch(`${API_BASE_URL}/package-only`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-cache'
    });
    const result = await parseJsonResponse(response);
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to create package');
    }
    const created = result.package;
    packageState.data.unshift(created);
    packageState.byId.set(String(resolvePackageId(created)), created);
    hideNewPackageCard();
    clearNewPackageForm();
    renderPackages();
    showSuccessMessage(`${created.description || 'Package'} created successfully!`);
  } catch (err) {
    console.error('❌ Error creating package:', err);
    showInlineStatus(statusEl, `Creation failed: ${err.message}`, 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
    setTimeout(() => clearInlineStatus(statusEl), 4000);
  }
}

function initializePackageManager() {
  packageUI.list = document.getElementById('package-list');
  packageUI.error = document.getElementById('package-error');
  packageUI.syncStatus = document.getElementById('package-sync-status');
  packageUI.refreshBtn = document.getElementById('package-refresh-btn');
  packageUI.template = document.getElementById('package-card-template');

  if (!packageUI.list || !packageUI.template) return;

  updatePackageSyncStatus();

  const addBtn = document.getElementById('package-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showNewPackageCard();
      const list = document.getElementById('new-package-pricing-list');
      if (list && list.children.length === 0) list.appendChild(createPricingRow());
      document.getElementById('new-package-description')?.focus();
    });
  }

  const addTierBtn = document.getElementById('new-package-add-pricing-btn');
  if (addTierBtn) {
    addTierBtn.addEventListener('click', () => {
      const list = document.getElementById('new-package-pricing-list');
      if (list) list.appendChild(createPricingRow());
    });
  }

  const cancelBtn = document.getElementById('new-package-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => { hideNewPackageCard(); clearNewPackageForm(); });

  const saveBtn = document.getElementById('new-package-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleCreatePackage);

  if (packageUI.refreshBtn) packageUI.refreshBtn.addEventListener('click', () => loadPackages());

  // Add filter event listeners
  const hotelFilter = document.getElementById('package-hotel-filter');
  const categoryFilter = document.getElementById('package-category-filter');
  
  if (hotelFilter) {
    hotelFilter.addEventListener('change', applyPackageFilters);
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyPackageFilters);
  }

  loadPackages();
}

// Van Images management state and functions
const vanImagesState = {
  data: [],
  lastSynced: null,
  isLoading: false
};

const vanImagesUI = {
  gallery: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  uploadBtn: null,
  fileInput: null
};

function setVanImagesError(message = '') {
  if (!vanImagesUI.error) {
    return;
  }

  if (message) {
    vanImagesUI.error.textContent = message;
    vanImagesUI.error.hidden = false;
  } else {
    vanImagesUI.error.textContent = '';
    vanImagesUI.error.hidden = true;
  }
}

function updateVanImagesSyncStatus() {
  if (!vanImagesUI.syncStatus) {
    return;
  }

  if (!vanImagesState.lastSynced) {
    vanImagesUI.syncStatus.textContent = 'Images: waiting...';
    return;
  }

  const count = vanImagesState.data.length;
  vanImagesUI.syncStatus.textContent = `Images: ${count} photo${count !== 1 ? 's' : ''}`;
}

async function loadVanImages() {
  if (!vanImagesUI.gallery) {
    return;
  }

  setVanImagesError('');
  vanImagesState.isLoading = true;

  try {
    const response = await fetch(`${API_BASE_URL}/van-images`);
    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load van images');
    }

    vanImagesState.data = result.images || [];
    vanImagesState.lastSynced = new Date();
    updateVanImagesSyncStatus();
    renderVanImages();
  } catch (error) {
    console.error('❌ Failed to load van images:', error);
    vanImagesState.data = [];
    setVanImagesError(`Failed to load van images: ${error.message}`);
  } finally {
    vanImagesState.isLoading = false;
  }
}

function renderVanImages() {
  if (!vanImagesUI.gallery) {
    return;
  }

  vanImagesUI.gallery.innerHTML = '';

  if (vanImagesState.data.length === 0) {
    vanImagesUI.gallery.innerHTML = '<p class="text-muted">No images uploaded yet. Click "Upload Image" to add photos.</p>';
    return;
  }

  vanImagesState.data.forEach(image => {
    const imageCard = document.createElement('div');
    imageCard.className = 'tour-image-card';
    imageCard.innerHTML = `
      <img src="${image.image_url}" alt="Van rental image" class="tour-image-preview">
      <button type="button" class="tour-image-delete-btn" data-image-id="${image.van_images_id}">🗑️</button>
    `;

    const deleteBtn = imageCard.querySelector('.tour-image-delete-btn');
    deleteBtn.addEventListener('click', () => {
      handleDeleteVanImage(image.van_images_id, imageCard);
    });

    vanImagesUI.gallery.appendChild(imageCard);
  });
}

async function handleUploadVanImage(file) {
  if (!file) {
    return;
  }

  if (vanImagesUI.uploadBtn) {
    vanImagesUI.uploadBtn.disabled = true;
    vanImagesUI.uploadBtn.textContent = '⏳ Uploading...';
  }

  setVanImagesError('');

  try {
    // Compress image before uploading to avoid payload size issues
    const imageData = await compressImage(file, 2); // Compress to max 2MB

    const response = await fetch(`${API_BASE_URL}/van-images/upload`, {
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
      throw new Error(result.message || 'Failed to upload van image');
    }

    // Add new image to state
    vanImagesState.data.push(result.image);
    updateVanImagesSyncStatus();
    renderVanImages();

    showSuccessMessage('Van image uploaded successfully!');
  } catch (error) {
    console.error('❌ Error uploading van image:', error);
    setVanImagesError(`Upload failed: ${error.message}`);
  } finally {
    if (vanImagesUI.uploadBtn) {
      vanImagesUI.uploadBtn.disabled = false;
      vanImagesUI.uploadBtn.textContent = '📷 Upload Image';
    }

    if (vanImagesUI.fileInput) {
      vanImagesUI.fileInput.value = '';
    }
  }
}

async function handleDeleteVanImage(imageId, imageCard) {
  const confirmed = confirm('Are you sure you want to delete this van image?\n\nThis action cannot be undone.');

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/van-images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-cache'
    });

    const result = await parseJsonResponse(response);

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete van image');
    }

    // Remove from state
    vanImagesState.data = vanImagesState.data.filter(img => img.van_images_id !== imageId);
    updateVanImagesSyncStatus();

    // Remove card from DOM with animation
    if (imageCard && imageCard.parentElement) {
      imageCard.style.opacity = '0';
      imageCard.style.transform = 'scale(0.95)';
      imageCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      setTimeout(() => {
        imageCard.remove();
        // Re-render if no images left
        if (vanImagesState.data.length === 0) {
          renderVanImages();
        }
      }, 300);
    }

    showSuccessMessage('Van image deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting van image:', error);
    setVanImagesError(`Delete failed: ${error.message}`);
  }
}

function initializeVanImagesManager() {
  vanImagesUI.gallery = document.getElementById('van-images-gallery');
  vanImagesUI.error = document.getElementById('van-images-error');
  vanImagesUI.syncStatus = document.getElementById('van-images-sync-status');
  vanImagesUI.refreshBtn = document.getElementById('van-images-refresh-btn');
  vanImagesUI.uploadBtn = document.getElementById('van-upload-image-btn');
  vanImagesUI.fileInput = document.getElementById('van-image-file-input');

  if (!vanImagesUI.gallery) {
    return;
  }

  updateVanImagesSyncStatus();

  if (vanImagesUI.uploadBtn && vanImagesUI.fileInput) {
    vanImagesUI.uploadBtn.addEventListener('click', () => {
      vanImagesUI.fileInput.click();
    });

    vanImagesUI.fileInput.addEventListener('change', () => {
      const [file] = vanImagesUI.fileInput.files || [];
      if (file) {
        handleUploadVanImage(file);
      }
    });
  }

  if (vanImagesUI.refreshBtn) {
    vanImagesUI.refreshBtn.addEventListener('click', () => {
      loadVanImages();
    });
  }

  loadVanImages();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  if (!checkSession()) {
    return;
  }

  initializePackageManager();
  initializeVehicleManager();
  initializeDivingManager();
  initializeVanDestinationManager();
  initializeVanImagesManager();
  initializeTourManager();
  initializeQrcodeManager();
  console.log('Settings page ready');
});