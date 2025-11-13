
// home.js
// Handles pop-up modal for 'More Info' buttons with enhanced image gallery
// + Dynamic content loading from database

// API Base URL resolution order:
// 1) If <meta name="api-base" content="..."> is present, use it (best for Hostinger/prod)
// 2) Always use production API URL as fallback (https://api.otgpuertogaleratravel.com/api)
function getApiBaseUrl() {
  // Try to get from meta tag (best option)
  const apiBaseFromMeta = document.querySelector('meta[name="api-base"]')?.getAttribute('content')?.trim();
  if (apiBaseFromMeta && apiBaseFromMeta.length > 0) {
    console.log('✅ Using API base from meta tag:', apiBaseFromMeta);
    return apiBaseFromMeta;
  }
  
  // Fallback to production API
  const productionApi = 'https://api.otgpuertogaleratravel.com/api';
  console.log('⚠️ Meta tag not found, using production API fallback:', productionApi);
  return productionApi;
}

// Initialize API_BASE_URL - will be re-evaluated on DOMContentLoaded to ensure meta tag is available
let API_BASE_URL = getApiBaseUrl();
console.log('🔗 API_BASE_URL initially set to:', API_BASE_URL);

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '₱—';
  }

  return `₱${number.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Load dynamic content from database
async function loadDynamicContent() {
  try {
    // Load site content (mission, vision)
    const contentResponse = await fetch(`${API_BASE_URL}/settings/content`);
    const contentResult = await contentResponse.json();
    
    if (contentResult.success) {
      const content = {};
      contentResult.content.forEach(item => {
        content[item.section_key] = item.content;
      });
      
      // Update Mission
      const missionElement = document.querySelector('#mission-vision .card:first-child .card-text');
      if (missionElement && content.mission) {
        missionElement.textContent = content.mission;
      }
      
      // Update Vision
      const visionElement = document.querySelector('#mission-vision .card:last-child .card-text');
      if (visionElement && content.vision) {
        visionElement.textContent = content.vision;
      }
      
      console.log('✅ Site content loaded dynamically');
    }
  } catch (error) {
    console.error('Error loading dynamic content:', error);
    // Fail silently - use hardcoded content as fallback
  }
}

async function loadVehicleRental() {
  const priceElement = document.getElementById('vehicleRentalPrice');
  const listElement = document.getElementById('vehicleRentalList');
  const carouselInner = document.getElementById('vehicleRentalCarouselInner');
  const moreInfoButton = document.getElementById('vehicleRentalMoreInfo');

  if (!priceElement || !listElement || !carouselInner || !moreInfoButton) {
    return;
  }

  const placeholderSlide = `
    <div class="carousel-item active h-100">
      <img src="../../Images/logo.png" class="d-block w-100 h-100 object-fit-cover" alt="Vehicle rental placeholder">
    </div>
  `;

  priceElement.textContent = 'Loading latest rates...';
  listElement.innerHTML = '<li class="vehicle-rental-list-item">Fetching vehicles from Supabase...</li>';
  carouselInner.innerHTML = placeholderSlide;
  moreInfoButton.dataset.info = '<strong>Vehicle Rental</strong><br>Loading vehicle list...';

  try {
    const url = `${API_BASE_URL}/vehicles`;
    console.log('🔄 Fetching vehicles from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch vehicles');
    }

    const vehicles = (result.vehicles || []).filter(vehicle => {
      const name = (vehicle?.name || '').trim().toLowerCase();
      return name && name !== 'n/a';
    });

    if (vehicles.length === 0) {
      priceElement.textContent = 'Currently unavailable';
      listElement.innerHTML = '<li class="vehicle-rental-list-item">Vehicle rental options will appear here once available.</li>';
      carouselInner.innerHTML = placeholderSlide;
      moreInfoButton.dataset.info = '<strong>Vehicle Rental</strong><br>No vehicles are currently available. Please check back later.';
      serviceImages['Vehicle Rental'] = [];
      return;
    }

    vehicles.sort((a, b) => {
      const priceA = Number(a.price_per_day);
      const priceB = Number(b.price_per_day);
      if (!Number.isFinite(priceA)) {
        return 1;
      }
      if (!Number.isFinite(priceB)) {
        return -1;
      }
      return priceA - priceB;
    });

    const minPricedVehicle = vehicles.find(vehicle => Number.isFinite(Number(vehicle.price_per_day)));
    priceElement.textContent = minPricedVehicle
      ? `Starting at ${formatCurrency(minPricedVehicle.price_per_day)}`
      : 'Contact us for rates';

    listElement.innerHTML = '';

    vehicles.forEach(vehicle => {
      const listItem = document.createElement('li');
      listItem.className = 'vehicle-rental-list-item';

      const vehicleName = vehicle.name || 'Vehicle';
      const vehiclePrice = formatCurrency(vehicle.price_per_day);

      listItem.innerHTML = `
        <div class="vehicle-rental-item-header">
          <span>${vehicleName}</span>
          <span>${vehiclePrice}</span>
        </div>
      `;

      listElement.appendChild(listItem);
    });

    carouselInner.innerHTML = '';

    vehicles.forEach((vehicle, index) => {
      const carouselItem = document.createElement('div');
      carouselItem.className = `carousel-item h-100 ${index === 0 ? 'active' : ''}`;
      const imageUrl = vehicle.vehicle_image || '../../Images/logo.png';
      const altText = vehicle.name || 'Vehicle rental';
      carouselItem.innerHTML = `
        <img src="${imageUrl}" class="d-block w-100 h-100 object-fit-cover" alt="${altText}">
      `;
      carouselInner.appendChild(carouselItem);
    });

    if (carouselInner.children.length === 0) {
      carouselInner.innerHTML = placeholderSlide;
    }

    const infoRows = vehicles.map(vehicle => {
      const vehicleName = vehicle.name || 'Vehicle';
      const vehiclePrice = formatCurrency(vehicle.price_per_day);
      const description = vehicle.description ? vehicle.description : '';
      return `
        <tr>
          <td>${vehicleName}</td>
          <td>${vehiclePrice}</td>
          <td>${description}</td>
        </tr>
      `;
    }).join('');

    const infoHtml = `
      <strong>Vehicle Rental Rates</strong>
      <br>
      <table class='table table-sm table-striped mt-2'>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Price / Day</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>${infoRows}</tbody>
      </table>
      <small>All vehicles are for use within Puerto Galera only.</small>
    `;

    moreInfoButton.dataset.info = infoHtml;

    const galleryImages = vehicles
      .filter(vehicle => vehicle.vehicle_image)
      .map(vehicle => ({
        src: vehicle.vehicle_image,
        alt: vehicle.name || 'Vehicle rental'
      }));

    if (galleryImages.length > 0) {
      serviceImages['Vehicle Rental'] = galleryImages;
    }
  } catch (error) {
    console.error('❌ Error loading vehicle rentals:', error);
    console.error('Error details:', {
      message: error.message,
      url: `${API_BASE_URL}/vehicles`,
      stack: error.stack
    });
    priceElement.textContent = 'Unable to load rates';
    listElement.innerHTML = '<li class="vehicle-rental-list-item">We could not load vehicle data. Please try again later.</li>';
    carouselInner.innerHTML = placeholderSlide;
    moreInfoButton.dataset.info = '<strong>Vehicle Rental</strong><br>We were unable to load vehicle information at this time. Please check your console for details.';
    serviceImages['Vehicle Rental'] = [];
  }
}

async function loadVanRental() {
  const priceElement = document.getElementById('vanRentalPrice');
  const listWithinElement = document.getElementById('vanRentalListWithin');
  const listOutsideElement = document.getElementById('vanRentalListOutside');
  const moreInfoButton = document.getElementById('vanRentalMoreInfo');
  const carouselInner = document.getElementById('vanRentalCarouselInner');

  if (!priceElement || !listWithinElement || !listOutsideElement || !moreInfoButton || !carouselInner) {
    return;
  }

  const placeholderSlide = `
    <div class="carousel-item active h-100">
      <img src="../../Images/Commuter.jpg" class="d-block w-100 h-100 object-fit-cover" alt="Van rental placeholder">
    </div>
  `;

  listWithinElement.innerHTML = '<li class="vehicle-rental-list-item">Fetching...</li>';
  listOutsideElement.innerHTML = '<li class="vehicle-rental-list-item">Fetching...</li>';
  moreInfoButton.dataset.info = '<strong>Van Rental</strong><br>Loading destination list...';
  carouselInner.innerHTML = placeholderSlide;

  try {
    // Load van destinations
    const destUrl = `${API_BASE_URL}/van-destinations`;
    console.log('🔄 Fetching van destinations from:', destUrl);
    
    const destResponse = await fetch(destUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    if (!destResponse.ok) {
      throw new Error(`HTTP ${destResponse.status}: ${destResponse.statusText}`);
    }

    const destResult = await destResponse.json();

    if (!destResult.success) {
      throw new Error(destResult.message || 'Failed to fetch van destinations');
    }

    const destinations = (destResult.destinations || []).filter(dest => {
      const name = (dest?.destination_name || '').trim();
      return name && name.toLowerCase() !== 'n/a';
    });

    // Load van images
    const imagesUrl = `${API_BASE_URL}/van-images`;
    console.log('🔄 Fetching van images from:', imagesUrl);
    
    const imagesResponse = await fetch(imagesUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    let vanImages = [];
    if (imagesResponse.ok) {
      const imagesResult = await imagesResponse.json();
      if (imagesResult.success) {
        vanImages = imagesResult.images || [];
      }
    }

    // Update carousel with van images
    if (vanImages.length > 0) {
      carouselInner.innerHTML = '';
      vanImages.forEach((image, index) => {
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item h-100 ${index === 0 ? 'active' : ''}`;
        carouselItem.innerHTML = `
          <img src="${image.image_url}" class="d-block w-100 h-100 object-fit-cover" alt="Van rental">
        `;
        carouselInner.appendChild(carouselItem);
      });

      // Update service images for gallery
      serviceImages['Van Rental'] = vanImages.map(img => ({
        src: img.image_url,
        alt: 'Van rental'
      }));
    } else {
      // No images in database - show placeholder message
      carouselInner.innerHTML = `
        <div class="carousel-item active h-100">
          <div class="d-flex align-items-center justify-content-center h-100 bg-light">
            <div class="text-center p-4">
              <i class="fas fa-image fa-3x text-muted mb-3"></i>
              <p class="text-muted">No images available</p>
            </div>
          </div>
        </div>
      `;
      // Clear service images for gallery
      serviceImages['Van Rental'] = [];
    }

    // Separate destinations by location type
    const withinDestinations = destinations.filter(dest => {
      const locationType = (dest?.location_type || '').trim();
      return locationType === 'Within Puerto Galera';
    }).sort((a, b) => {
      const nameA = (a.destination_name || '').toLowerCase();
      const nameB = (b.destination_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const outsideDestinations = destinations.filter(dest => {
      const locationType = (dest?.location_type || '').trim();
      return locationType === 'Outside Puerto Galera';
    }).sort((a, b) => {
      const nameA = (a.destination_name || '').toLowerCase();
      const nameB = (b.destination_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    if (destinations.length === 0) {
      priceElement.textContent = 'Currently unavailable';
      listWithinElement.innerHTML = '<li class="vehicle-rental-list-item">No destinations available.</li>';
      listOutsideElement.innerHTML = '<li class="vehicle-rental-list-item">No destinations available.</li>';
      moreInfoButton.dataset.info = '<strong>Van Rental</strong><br>No destinations are currently available. Please check back later.';
      return;
    }

    // Find minimum price for display
    let minPrice = null;
    destinations.forEach(dest => {
      const oneway = Number(dest.oneway_price);
      const roundtrip = Number(dest.roundtrip_price);
      
      if (Number.isFinite(oneway) && oneway > 0) {
        if (minPrice === null || oneway < minPrice) {
          minPrice = oneway;
        }
      }
      if (Number.isFinite(roundtrip) && roundtrip > 0) {
        if (minPrice === null || roundtrip < minPrice) {
          minPrice = roundtrip;
        }
      }
    });

    priceElement.textContent = minPrice !== null
      ? `Starting at ${formatCurrency(minPrice)}`
      : 'Contact us for rates';

    // Populate Within Puerto Galera column
    listWithinElement.innerHTML = '';
    if (withinDestinations.length === 0) {
      listWithinElement.innerHTML = '<li class="vehicle-rental-list-item small text-muted">None</li>';
    } else {
      withinDestinations.forEach(dest => {
        const listItem = document.createElement('li');
        listItem.className = 'vehicle-rental-list-item';

        const destinationName = dest.destination_name || 'Destination';

        listItem.innerHTML = `
          <div class="vehicle-rental-item-header">
            <span>${destinationName}</span>
          </div>
        `;

        listWithinElement.appendChild(listItem);
      });
    }

    // Populate Outside Puerto Galera column
    listOutsideElement.innerHTML = '';
    if (outsideDestinations.length === 0) {
      listOutsideElement.innerHTML = '<li class="vehicle-rental-list-item small text-muted">None</li>';
    } else {
      outsideDestinations.forEach(dest => {
        const listItem = document.createElement('li');
        listItem.className = 'vehicle-rental-list-item';

        const destinationName = dest.destination_name || 'Destination';

        listItem.innerHTML = `
          <div class="vehicle-rental-item-header">
            <span>${destinationName}</span>
          </div>
        `;

        listOutsideElement.appendChild(listItem);
      });
    }

    const allDestinationNames = destinations.map(d => d.destination_name).join(', ');
    moreInfoButton.dataset.info = `<strong>Van Rental</strong><br>Available destinations: ${allDestinationNames}`;
  } catch (error) {
    console.error('❌ Error loading van rentals:', error);
    console.error('Error details:', {
      message: error.message,
      url: `${API_BASE_URL}/van-destinations`,
      stack: error.stack
    });
    priceElement.textContent = 'Unable to load rates';
    listWithinElement.innerHTML = '<li class="vehicle-rental-list-item">Error loading data.</li>';
    listOutsideElement.innerHTML = '<li class="vehicle-rental-list-item">Error loading data.</li>';
    moreInfoButton.dataset.info = '<strong>Van Rental</strong><br>We were unable to load destination information at this time. Please check your console for details.';
  }
}

async function loadTourOnly() {
  try {
    const url = `${API_BASE_URL}/tours`;
    console.log('🔄 Fetching tours from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch tours');
    }

    const tours = result.tours || [];
    
    // Map tours by category
    const toursByCategory = {
      'Snorkeling Tour': tours.find(t => t.category === 'Snorkeling Tour'),
      'Inland Tour': tours.find(t => t.category === 'Inland Tour'),
      'Island Hopping': tours.find(t => t.category === 'Island Hopping')
    };

    // Update Snorkeling Tour card
    updateTourCard('snorkelingTourCarousel', toursByCategory['Snorkeling Tour'], 'Snorkeling Tour');
    
    // Update Inland Tour card
    updateTourCard('inlandCarousel', toursByCategory['Inland Tour'], 'Inland Tour');
    
    // Update Island Hopping card
    updateTourCard('islandHoppingCarousel', toursByCategory['Island Hopping'], 'Island Hopping');

    console.log('✅ Tours loaded dynamically from database');
  } catch (error) {
    console.error('❌ Error loading tours:', error);
    console.error('Error details:', {
      message: error.message,
      url: `${API_BASE_URL}/tours`,
      stack: error.stack
    });
    // Keep hardcoded content as fallback
  }
}

async function loadDiving() {
  try {
    const url = `${API_BASE_URL}/diving`;
    console.log('🔄 Fetching diving data from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch diving data');
    }

    const divingRecords = (result.diving || []).filter(diving => {
      const name = (diving?.name || '').trim().toLowerCase();
      return name && name !== 'n/a';
    });

    if (divingRecords.length === 0) {
      console.log('ℹ️ No diving records found, using hardcoded content as fallback');
      return;
    }

    // Use the first diving record (or you can choose based on specific criteria)
    const diving = divingRecords[0];

    // Update diving card carousel with images
    const divingCarouselInner = document.querySelector('#divingCarousel .carousel-inner');
    if (divingCarouselInner) {
      const images = diving.images && diving.images.length > 0 
        ? diving.images 
        : (diving.diving_image ? [{ image_url: diving.diving_image }] : []);
      
      if (images.length > 0) {
        divingCarouselInner.innerHTML = '';
        images.forEach((image, index) => {
          const carouselItem = document.createElement('div');
          carouselItem.className = `carousel-item h-100 ${index === 0 ? 'active' : ''}`;
          carouselItem.innerHTML = `
            <img src="${image.image_url}" class="d-block w-100 h-100 object-fit-cover" alt="${diving.name}">
          `;
          divingCarouselInner.appendChild(carouselItem);
        });
      } else {
        // Show default logo.png if no images
        divingCarouselInner.innerHTML = `
          <div class="carousel-item active h-100">
            <img src="../../Images/logo.png" class="d-block w-100 h-100 object-fit-cover" alt="${diving.name}">
          </div>
        `;
      }
    }

    // Update price display
    const divingPriceTag = document.querySelector('#divingCarousel').closest('.card').querySelector('.price-tag div');
    if (divingPriceTag && diving.price_per_head) {
      divingPriceTag.textContent = formatCurrency(diving.price_per_head);
    }

    // Update "More Info" button with dynamic data
    const divingMoreInfoBtn = document.querySelector('#divingCarousel').closest('.card').querySelector('.btn-more-info');
    if (divingMoreInfoBtn) {
      let infoHtml = '';
      
      // Add first image if available, otherwise use logo
      const images = diving.images && diving.images.length > 0 
        ? diving.images 
        : (diving.diving_image ? [{ image_url: diving.diving_image }] : []);
      
      if (images.length > 0) {
        infoHtml += `<img src='${images[0].image_url}' alt='${diving.name}' class='img-fluid rounded mb-2'>`;
      } else {
        infoHtml += `<img src='../../Images/logo.png' alt='${diving.name}' class='img-fluid rounded mb-2'>`;
      }
      
      // Add title
      infoHtml += `<br><strong>${diving.name}</strong>`;
      
      // Add description from database if available
      if (diving.description && diving.description.trim()) {
        infoHtml += `
          <div class="description-section">
            <p><i class="bi bi-info-circle me-2"></i>${diving.description}</p>
          </div>
        `;
      }
      
      // Add price
      if (diving.price_per_head) {
        infoHtml += `
          <div class="pricing-section">
            <div class="pricing-title"><i class="bi bi-currency-dollar"></i>Pricing</div>
            <div class="pricing-item">
              <span class="pricing-cost">${formatCurrency(diving.price_per_head)} per person</span>
            </div>
          </div>
        `;
      }
      
      // Add hardcoded inclusions as additional info
      infoHtml += `
        <div class="inclusions-section">
          <div class="inclusions-title"><i class="bi bi-check-circle"></i>Inclusions</div>
          <div class="inclusion-item">
            <i class="bi bi-check2"></i>
            <span>Diving Equipment</span>
          </div>
          <div class="inclusion-item">
            <i class="bi bi-check2"></i>
            <span>Certified Instructor</span>
          </div>
          <div class="inclusion-item">
            <i class="bi bi-check2"></i>
            <span>Safety First</span>
          </div>
        </div>
      `;
      
      divingMoreInfoBtn.setAttribute('data-info', infoHtml);
      divingMoreInfoBtn.setAttribute('data-title', diving.name);
    }

    // Update service images for gallery - support multiple images
    const images = diving.images && diving.images.length > 0 
      ? diving.images 
      : (diving.diving_image ? [{ image_url: diving.diving_image }] : []);
    
    if (images.length > 0) {
      serviceImages['Diving'] = images.map(img => ({
        src: img.image_url,
        alt: diving.name
      }));
    } else {
      // Use logo.png as default
      serviceImages['Diving'] = [
        { src: '../../Images/logo.png', alt: diving.name }
      ];
    }

    console.log('✅ Diving data loaded dynamically from database');
  } catch (error) {
    console.error('❌ Error loading diving data:', error);
    console.error('Error details:', {
      message: error.message,
      url: `${API_BASE_URL}/diving`,
      stack: error.stack
    });
    // Keep hardcoded content as fallback
  }
}

function updateTourCard(carouselId, tour, displayName) {
  if (!tour) {
    console.log(`ℹ️ No tour data found for ${displayName}, using hardcoded content as fallback`);
    return;
  }

  // Update carousel images if available
  const carouselInner = document.querySelector(`#${carouselId} .carousel-inner`);
  if (carouselInner && tour.images && tour.images.length > 0) {
    carouselInner.innerHTML = '';
    tour.images.forEach((image, index) => {
      const carouselItem = document.createElement('div');
      carouselItem.className = `carousel-item h-100 ${index === 0 ? 'active' : ''}`;
      carouselItem.innerHTML = `
        <img src="${image.image_url}" class="d-block w-100 h-100 object-fit-cover" alt="${displayName}">
      `;
      carouselInner.appendChild(carouselItem);
    });
  }

  // Update pricing display
  const priceTag = document.querySelector(`#${carouselId}`).closest('.card').querySelector('.price-tag');
  if (priceTag && tour.pricing && tour.pricing.length > 0) {
    // Find the lowest price from pricing tiers
    const prices = tour.pricing.map(p => p.price_per_head).filter(p => p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      priceTag.querySelector('div').textContent = formatCurrency(minPrice);
    }
  }

  // Update "More Info" button with dynamic pricing tiers and description
  const moreInfoBtn = document.querySelector(`#${carouselId}`).closest('.card').querySelector('.btn-more-info');
  if (moreInfoBtn) {
    let pricingInfo = '';
    
    // Add image if available
    if (tour.images && tour.images.length > 0) {
      pricingInfo += `<img src='${tour.images[0].image_url}' alt='${displayName}' class='img-fluid'>`;
    }
    
    // Add description from database if available in a styled section
    if (tour.description && tour.description.trim()) {
      pricingInfo += `
        <div class="description-section">
          <p><i class="bi bi-info-circle me-2"></i>${tour.description}</p>
        </div>
      `;
    }
    
    // Add pricing tiers in a styled section if available
    if (tour.pricing && tour.pricing.length > 0) {
      pricingInfo += `
        <div class="pricing-section">
          <div class="pricing-title"><i class="bi bi-currency-dollar"></i>Pricing</div>
      `;
      tour.pricing.forEach(tier => {
        const paxRange = tier.min_tourist === tier.max_tourist 
          ? `${tier.min_tourist} pax` 
          : `${tier.min_tourist}-${tier.max_tourist} pax`;
        
        pricingInfo += `
          <div class="pricing-item">
            <span class="pricing-pax"><i class="bi bi-people-fill"></i>${paxRange}</span>
            <span class="pricing-cost">${formatCurrency(tier.price_per_head)} per pax</span>
          </div>
        `;
      });
      pricingInfo += '</div>';
    }
    
    // Keep the original inclusions info (hardcoded) as fallback or additional info in a styled section
    const originalInfo = moreInfoBtn.getAttribute('data-info');
    const inclusionsMatch = originalInfo.match(/Inclusions:(.*)$/s);
    if (inclusionsMatch) {
      const inclusionsText = inclusionsMatch[1].trim();
      if (inclusionsText) {
        // Parse inclusions and format them nicely
        const inclusionsList = inclusionsText.split('<br>').filter(item => item.trim());
        if (inclusionsList.length > 0) {
          pricingInfo += `
            <div class="inclusions-section">
              <div class="inclusions-title"><i class="bi bi-check-circle"></i>Inclusions</div>
          `;
          inclusionsList.forEach(item => {
            const cleanItem = item.trim();
            if (cleanItem) {
              pricingInfo += `
                <div class="inclusion-item">
                  <i class="bi bi-check2"></i>
                  <span>${cleanItem}</span>
                </div>
              `;
            }
          });
          pricingInfo += '</div>';
        }
      }
    }
    
    moreInfoBtn.setAttribute('data-info', pricingInfo);
    moreInfoBtn.setAttribute('data-title', displayName);
  }

  // Update image gallery for modal
  if (tour.images && tour.images.length > 0) {
    serviceImages[displayName] = tour.images.map(img => ({
      src: img.image_url,
      alt: displayName
    }));
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Re-evaluate API_BASE_URL to ensure meta tag is available
  API_BASE_URL = getApiBaseUrl();
  console.log('🔗 API_BASE_URL re-evaluated on DOMContentLoaded:', API_BASE_URL);
  
  // Load dynamic content first
  loadDynamicContent();
  loadVehicleRental();
  loadVanRental();
  loadTourOnly();
  loadDiving();

  // Navbar scroll behavior (shrink + shadow)
  const navbar = document.querySelector('nav.navbar');
  const offcanvasElement = document.getElementById('offcanvasNavbar');

  function hideOffcanvasMenu() {
    if (!offcanvasElement) return;
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
  }

  function updateNavbarOnScroll() {
    if (!navbar) return;
    const shouldBeScrolled = window.scrollY > 10;
    navbar.classList.toggle('scrolled', shouldBeScrolled);
  }
  updateNavbarOnScroll();
  window.addEventListener('scroll', updateNavbarOnScroll, { passive: true });

  // Smooth scroll for in-page nav links with offset handling
  const offset = 120; // approximate navbar height

  function setActiveNavLink(targetHref) {
    if (!targetHref) return;
    document.querySelectorAll('a.nav-link.slant.active').forEach((el) => el.classList.remove('active'));
    const link = document.querySelector(`a.nav-link.slant[href='${targetHref}']`);
    if (link) {
      link.classList.add('active');
    }
  }

  document.querySelectorAll('a.nav-link.slant[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      // Skip if this is a more info button
      if (this.classList.contains('btn-more-info')) return;
      
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();

      setActiveNavLink(targetId);

      const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
      const top = Math.max(elementPosition - offset, 0);
      window.scrollTo({ top, behavior: 'smooth' });
      hideOffcanvasMenu();
    });
  });

  document.querySelectorAll('#offcanvasNavbar .nav-link, #offcanvasNavbar .btn').forEach((el) => {
    el.addEventListener('click', hideOffcanvasMenu);
  });

  // Active link highlight based on current section
  const sectionIds = ['#home', '#mission-vision', '#services', '#contact-us'];
  const idToLink = new Map();
  sectionIds.forEach((id) => {
    const link = document.querySelector(`a.nav-link.slant[href='${id}']`);
    if (link) idToLink.set(id, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = `#${entry.target.id}`;
        const link = idToLink.get(id);
        if (!link) return;
        if (entry.isIntersecting) {
          setActiveNavLink(id);
        }
      });
    },
    {
      root: null,
      rootMargin: '-40% 0px -55% 0px', // focus middle of viewport
      threshold: 0.01
    }
  );

  sectionIds.forEach((id) => {
    const section = document.querySelector(id);
    if (section) observer.observe(section);
  });

  function handleScrollActiveState() {
    if (window.scrollY < offset * 0.6) {
      setActiveNavLink('#home');
    }
  }
  handleScrollActiveState();
  window.addEventListener('scroll', handleScrollActiveState, { passive: true });

  // Delegate click for all 'More Info' buttons
  document.body.addEventListener('click', function (e) {
    const button = e.target.closest('.btn-more-info');
    if (button) {
      e.preventDefault();
      e.stopPropagation();
      const title = button.getAttribute('data-title') || 'More Info';
      const info = button.getAttribute('data-info') || '';
      
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

  // Star Rating Functionality
  let selectedRating = 0;
  const starRating = document.getElementById('starRating');
  const ratingText = document.getElementById('ratingText');
  
  if (starRating) {
    const stars = starRating.querySelectorAll('i');
    
    // Hover effect
    stars.forEach((star, index) => {
      star.addEventListener('mouseenter', function() {
        stars.forEach((s, i) => {
          if (i <= index) {
            s.classList.remove('far');
            s.classList.add('fas');
          } else {
            s.classList.remove('fas');
            s.classList.add('far');
          }
        });
      });
    });
    
    // Mouse leave - reset to selected rating
    starRating.addEventListener('mouseleave', function() {
      stars.forEach((s, i) => {
        if (i < selectedRating) {
          s.classList.remove('far');
          s.classList.add('fas');
        } else {
          s.classList.remove('fas');
          s.classList.add('far');
        }
      });
    });
    
    // Click to select rating
    stars.forEach((star, index) => {
      star.addEventListener('click', function() {
        selectedRating = index + 1;
        const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        ratingText.textContent = `You rated: ${selectedRating} star${selectedRating > 1 ? 's' : ''} - ${ratingLabels[index]}`;
        ratingText.style.color = '#ffc107';
        ratingText.style.fontWeight = '600';
      });
    });
  }

  // Image upload handling - support multiple images
  let selectedImageFiles = [];
  let selectedImageDataArray = [];
  let imageIdCounter = 0;

  // Image selection button
  const selectImageBtn = document.getElementById('selectImageBtn');
  const feedbackImageInput = document.getElementById('feedbackImage');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreviewGrid = document.getElementById('imagePreviewGrid');
  const removeAllImagesBtn = document.getElementById('removeAllImagesBtn');

  function updateImagePreviews() {
    if (selectedImageFiles.length === 0) {
      imagePreviewContainer.style.display = 'none';
      if (selectImageBtn) selectImageBtn.textContent = 'Choose Images';
      return;
    }

    imagePreviewContainer.style.display = 'block';
    if (selectImageBtn) selectImageBtn.textContent = `Add More Images (${selectedImageFiles.length} selected)`;
    
    // Clear existing previews
    imagePreviewGrid.innerHTML = '';
    
    // Add preview for each image
    selectedImageFiles.forEach((file, index) => {
      const imageId = file.imageId || `img-${imageIdCounter++}`;
      file.imageId = imageId;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'col-6 col-md-4 col-lg-3';
        previewDiv.innerHTML = `
          <div class="position-relative">
            <img src="${event.target.result}" alt="Preview ${index + 1}" 
                 class="img-thumbnail w-100" style="height: 150px; object-fit: cover;">
            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 remove-single-image" 
                    data-image-id="${imageId}" style="opacity: 0.9;">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
        imagePreviewGrid.appendChild(previewDiv);
        
        // Add remove button handler
        const removeBtn = previewDiv.querySelector('.remove-single-image');
        removeBtn.addEventListener('click', () => {
          removeImage(imageId);
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(imageId) {
    const fileIndex = selectedImageFiles.findIndex(f => f.imageId === imageId);
    if (fileIndex !== -1) {
      selectedImageFiles.splice(fileIndex, 1);
      selectedImageDataArray.splice(fileIndex, 1);
      updateImagePreviews();
    }
  }

  function removeAllImages() {
    selectedImageFiles = [];
    selectedImageDataArray = [];
    if (feedbackImageInput) feedbackImageInput.value = '';
    updateImagePreviews();
  }

  if (selectImageBtn && feedbackImageInput) {
    selectImageBtn.addEventListener('click', () => {
      feedbackImageInput.click();
    });

    feedbackImageInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      
      if (files.length === 0) return;
      
      // Validate each file
      const validFiles = [];
      const invalidFiles = [];
      
      files.forEach((file, index) => {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (too large)`);
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} (not an image)`);
          return;
        }

        validFiles.push(file);
      });
      
      if (invalidFiles.length > 0) {
        alert('Some files were skipped:\n' + invalidFiles.join('\n') + '\n\nPlease ensure files are images under 5MB each.');
      }
      
      if (validFiles.length > 0) {
        // Add valid files to arrays
        const startIndex = selectedImageFiles.length;
        validFiles.forEach((file, fileIndex) => {
          // Assign unique ID to file
          if (!file.imageId) {
            file.imageId = `img-${imageIdCounter++}`;
          }
          const arrayIndex = startIndex + fileIndex;
          selectedImageFiles.push(file);
          
          // Initialize placeholder in data array
          selectedImageDataArray.push(null);
          
          // Convert to base64
          const reader = new FileReader();
          reader.onload = (event) => {
            selectedImageDataArray[arrayIndex] = {
              data: event.target.result,
              fileName: file.name
            };
            
            // Update previews when all files are loaded
            const allLoaded = selectedImageDataArray.every(item => item !== null);
            if (allLoaded && selectedImageDataArray.length === selectedImageFiles.length) {
              updateImagePreviews();
            }
          };
          reader.readAsDataURL(file);
        });
      }
    });

    if (removeAllImagesBtn) {
      removeAllImagesBtn.addEventListener('click', () => {
        removeAllImages();
      });
    }
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
        // Send feedback to API (include rating and image if selected)
        const feedbackData = {
          message: feedbackText
        };
        
        // Add rating only if user selected one
        if (selectedRating > 0) {
          feedbackData.rating = selectedRating;
        }
        
        // Add images if selected (filter out null values)
        const validImages = selectedImageDataArray.filter(img => img !== null);
        if (validImages.length > 0) {
          feedbackData.images = validImages;
        }
        
        const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Clear the form
          document.getElementById('feedback').value = '';
          
          // Reset images
          selectedImageFiles = [];
          selectedImageDataArray = [];
          if (feedbackImageInput) feedbackImageInput.value = '';
          if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
          if (selectImageBtn) selectImageBtn.textContent = 'Choose Images';
          
          // Reset star rating
          selectedRating = 0;
          if (starRating) {
            const stars = starRating.querySelectorAll('i');
            stars.forEach(s => {
              s.classList.remove('fas');
              s.classList.add('far');
            });
            ratingText.textContent = 'Click to rate (optional)';
            ratingText.style.color = '';
            ratingText.style.fontWeight = '';
          }
          
          // Show success message
          alert('Thank you for your feedback! Your message has been submitted successfully.');
          
          // Reload feedback to show the new one
          loadFeedback();
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

  // Load and display feedback
  loadFeedback();
});

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load and display feedback
async function loadFeedback() {
  const feedbackContainer = document.getElementById('feedbackContainer');
  const feedbackLoader = document.getElementById('feedbackLoader');
  
  if (!feedbackContainer) return;
  
  try {
    if (feedbackLoader) feedbackLoader.style.display = 'block';
    
    const response = await fetch(`${API_BASE_URL}/feedback`);
    const result = await response.json();
    
    if (result.success && result.feedback) {
      if (feedbackLoader) feedbackLoader.style.display = 'none';
      
      if (result.feedback.length === 0) {
        feedbackContainer.innerHTML = `
          <div class="col-12 text-center">
            <p class="text-muted">No feedback yet. Be the first to share your experience!</p>
          </div>
        `;
        return;
      }
      
      feedbackContainer.innerHTML = result.feedback.map((fb, index) => {
        const date = new Date(fb.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        const stars = fb.rating ? Array.from({ length: 5 }, (_, i) => 
          i < fb.rating ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-warning"></i>'
        ).join('') : '';
        
        // Parse image URLs (can be single string or JSON array)
        let imageUrls = [];
        if (fb.image_url) {
          try {
            // Try to parse as JSON array
            const parsed = JSON.parse(fb.image_url);
            imageUrls = Array.isArray(parsed) ? parsed : [fb.image_url];
          } catch (e) {
            // If not JSON, treat as single URL string
            imageUrls = [fb.image_url];
          }
        }
        
        // Debug: Log if images are found
        if (imageUrls.length > 0) {
          console.log(`Feedback ${index + 1} has ${imageUrls.length} image(s)`, imageUrls);
        }
        
        // Use feedback_id if available, otherwise use index as fallback
        const uniqueId = fb.feedback_id || fb.id || `feedback-${index}`;
        
        const imagesHtml = imageUrls.length > 0 ? `
          <div class="feedback-images-container">
            ${imageUrls.length === 1 ? `
              <img src="${escapeHtml(imageUrls[0])}" class="card-img-top feedback-image" alt="Feedback image" 
                   style="height: 200px; object-fit: cover; cursor: pointer;"
                   onclick="window.open('${escapeHtml(imageUrls[0])}', '_blank')"
                   onerror="this.style.display='none'; console.error('Failed to load feedback image');">
            ` : `
              <div id="carousel-${uniqueId}" class="carousel slide" data-bs-ride="false">
                <div class="carousel-inner">
                  ${imageUrls.map((url, idx) => `
                    <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                      <img src="${escapeHtml(url)}" class="d-block w-100 feedback-image" alt="Feedback image ${idx + 1}" 
                           style="height: 200px; object-fit: cover; cursor: pointer;"
                           onclick="window.open('${escapeHtml(url)}', '_blank')"
                           onerror="this.style.display='none'; console.error('Failed to load feedback image ${idx + 1}');">
                    </div>
                  `).join('')}
                </div>
                ${imageUrls.length > 1 ? `
                  <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${uniqueId}" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#carousel-${uniqueId}" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                  </button>
                  <div class="carousel-indicators">
                    ${imageUrls.map((_, idx) => `
                      <button type="button" data-bs-target="#carousel-${uniqueId}" data-bs-slide-to="${idx}" 
                              class="${idx === 0 ? 'active' : ''}" aria-current="${idx === 0 ? 'true' : 'false'}" 
                              aria-label="Slide ${idx + 1}"></button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `}
          </div>
        ` : '';
        
        return `
          <div class="col-md-6 col-lg-4">
            <div class="card feedback-card h-100 shadow-sm">
              ${imagesHtml}
              <div class="card-body d-flex flex-column">
                <div class="mb-2">
                  ${stars}
                </div>
                <p class="card-text flex-grow-1">${escapeHtml(fb.message)}</p>
                <div class="mt-auto">
                  <small class="text-muted">
                    <i class="fas fa-user me-1"></i>${escapeHtml(fb.anonymous_name || 'Anonymous')}
                    <span class="ms-3">
                      <i class="fas fa-calendar me-1"></i>${formattedDate}
                    </span>
                  </small>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      // Initialize Bootstrap carousels after rendering
      setTimeout(() => {
        result.feedback.forEach((fb, index) => {
          // Parse image URLs for this feedback item
          let imageUrls = [];
          if (fb.image_url) {
            try {
              const parsed = JSON.parse(fb.image_url);
              imageUrls = Array.isArray(parsed) ? parsed : [fb.image_url];
            } catch (e) {
              imageUrls = [fb.image_url];
            }
          }
          
          if (imageUrls.length > 1) {
            const uniqueId = fb.feedback_id || fb.id || `feedback-${index}`;
            const carouselElement = document.getElementById(`carousel-${uniqueId}`);
            if (carouselElement) {
              try {
                new bootstrap.Carousel(carouselElement, {
                  ride: false,
                  interval: false
                });
              } catch (e) {
                console.warn('Could not initialize carousel:', e);
              }
            }
          }
        });
      }, 100);
    } else {
      throw new Error(result.message || 'Failed to load feedback');
    }
  } catch (error) {
    console.error('Error loading feedback:', error);
    if (feedbackLoader) feedbackLoader.style.display = 'none';
    feedbackContainer.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-danger">Failed to load feedback. Please try again later.</p>
      </div>
    `;
  }
}

// Image collections for each service
const serviceImages = {
  'Snorkeling Tour': [
    { src: '../../Images/coral_garden.jpg', alt: 'Coral Garden' },
    { src: '../../Images/muelle_beach.jpg', alt: 'Muelle Beach' },
    { src: '../../Images/giant_clamps.jpg', alt: 'Giant Clams' },
    { src: '../../Images/white_beach.jpg', alt: 'White Beach' }
  ],
  'Inland Tour': [
    { src: '../../Images/tamaraw_falls.jpg', alt: 'Tamaraw Falls' },
    { src: '../../Images/virgin_beach.jpg', alt: 'Virgin Beach' },
    { src: '../../Images/muelle_beach.jpg', alt: 'Muelle Beach' }
  ],
  'Island Hopping': [
    { src: '../../Images/long_beach.jpg', alt: 'Long Beach' },
    { src: '../../Images/white_beach.jpg', alt: 'White Beach' },
    { src: '../../Images/giant_clamps.jpg', alt: 'Giant Clams' },
    { src: '../../Images/muelle_beach.jpg', alt: 'Muelle Beach' }
  ],
  'Vehicle Rental': [
    { src: '../../Images/adv_160.png', alt: 'ADV 160' },
    { src: '../../Images/nmax.png', alt: 'NMAX' },
    { src: '../../Images/versys_650.png', alt: 'Versys 650' },
    { src: '../../Images/versys_1000.png', alt: 'Versys 1000' },
    { src: '../../Images/tuktuk.png', alt: 'Tuktuk' },
    { src: '../../Images/mirage.jpg', alt: 'Mirage' },
    { src: '../../Images/wigo.png', alt: 'Wigo' }
  ],
  'The Mangyan Grand Hotel': [
    { src: '../../Images/mangyan.jpg', alt: 'Mangyan Grand Hotel' },
    { src: '../../Images/mangyan2.jpg', alt: 'Mangyan Grand Hotel 2' },
    { src: '../../Images/mangyan3.jpg', alt: 'Mangyan Grand Hotel 3' },
    { src: '../../Images/mangyan4.jpg', alt: 'Mangyan Grand Hotel 4' },
    { src: '../../Images/mangyan5.jpg', alt: 'Mangyan Grand Hotel 5' },
    { src: '../../Images/mangyan6.jpg', alt: 'Mangyan Grand Hotel 6' },
    { src: '../../Images/mangyan7.jpg', alt: 'Mangyan Grand Hotel 7' },
    { src: '../../Images/mangyan8.jpg', alt: 'Mangyan Grand Hotel 8' }
  ],
  'SouthView': [
    { src: '../../Images/southview.jpg', alt: 'SouthView' },
    { src: '../../Images/southview2.jpg', alt: 'SouthView 2' },
    { src: '../../Images/southview3.jpg', alt: 'SouthView 3' },
    { src: '../../Images/southview4.jpg', alt: 'SouthView 4' },
    { src: '../../Images/southview5.jpg', alt: 'SouthView 5' },
    { src: '../../Images/southview6.jpg', alt: 'SouthView 6' }
  ],
  'Ilaya': [
    { src: '../../Images/ilaya.jpg', alt: 'Ilaya' },
    { src: '../../Images/ilaya2.jpg', alt: 'Ilaya 2' },
    { src: '../../Images/ilaya3.jpg', alt: 'Ilaya 3' },
    { src: '../../Images/ilaya4.jpg', alt: 'Ilaya 4' }
  ],
  'Transient House': [
    { src: '../../Images/tr1.jpg', alt: 'Transient House 1' },
    { src: '../../Images/tr2.jpg', alt: 'Transient House 2' },
    { src: '../../Images/tr3.jpg', alt: 'Transient House 3' },
    { src: '../../Images/tr4.jpg', alt: 'Transient House 4' },
    { src: '../../Images/tr5.jpg', alt: 'Transient House 5' },
    { src: '../../Images/tr7.jpg', alt: 'Transient House 7' },
    { src: '../../Images/tr8.jpg', alt: 'Transient House 8' },
    { src: '../../Images/tr9.jpg', alt: 'Transient House 9' },
    { src: '../../Images/tr10.jpg', alt: 'Transient House 10' },
    { src: '../../Images/tr11.jpg', alt: 'Transient House 11' },
    { src: '../../Images/tr12.jpg', alt: 'Transient House 12' }
  ],
  'Bliss': [
    { src: '../../Images/bliss.jpg', alt: 'Bliss 1' },
    { src: '../../Images/bliss2.jpg', alt: 'Bliss 2' },
    { src: '../../Images/bliss3.jpg', alt: 'Bliss 3' },
    { src: '../../Images/bliss4.jpg', alt: 'Bliss 4' },
    { src: '../../Images/bliss5.jpg', alt: 'Bliss 5' }
  ],
  'Diving': [
    { src: '../../Images/coral_garden.jpg', alt: 'Coral Garden Diving' },
    { src: '../../Images/giant_clamps.jpg', alt: 'Giant Clams Diving' },
    { src: '../../Images/white_beach.jpg', alt: 'White Beach Diving' }
  ]
};
// Note: Tour images (Snorkeling Tour, Inland Tour, Island Hopping) will be dynamically updated from database
