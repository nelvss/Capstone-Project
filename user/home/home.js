
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

  if (!priceElement || !listWithinElement || !listOutsideElement || !moreInfoButton) {
    return;
  }

  listWithinElement.innerHTML = '<li class="vehicle-rental-list-item">Fetching...</li>';
  listOutsideElement.innerHTML = '<li class="vehicle-rental-list-item">Fetching...</li>';
  moreInfoButton.dataset.info = '<strong>Van Rental</strong><br>Loading destination list...';

  try {
    const url = `${API_BASE_URL}/van-destinations`;
    console.log('🔄 Fetching van destinations from:', url);
    
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
      throw new Error(result.message || 'Failed to fetch van destinations');
    }

    const destinations = (result.destinations || []).filter(dest => {
      const name = (dest?.destination_name || '').trim();
      return name && name.toLowerCase() !== 'n/a';
    });

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
      'Island Tour': tours.find(t => t.category === 'Island Tour')
    };

    // Update Snorkeling Tour card
    updateTourCard('snorkelingTourCarousel', toursByCategory['Snorkeling Tour'], 'Snorkeling Tour');
    
    // Update Inland Tour card
    updateTourCard('inlandCarousel', toursByCategory['Inland Tour'], 'Inland Tour');
    
    // Update Island Hopping card (display name is "Island Hopping", database category is "Island Tour")
    updateTourCard('islandHoppingCarousel', toursByCategory['Island Tour'], 'Island Hopping');

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

function updateTourCard(carouselId, tour, displayName) {
  if (!tour) {
    console.warn(`⚠️ No tour data found for ${displayName}, keeping hardcoded content`);
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
    let pricingInfo = `<strong>${displayName}</strong><br>`;
    
    // Add image if available
    if (tour.images && tour.images.length > 0) {
      pricingInfo += `<img src='${tour.images[0].image_url}' alt='${displayName}' class='img-fluid rounded mb-2'><br>`;
    }
    
    // Add description from database if available
    if (tour.description && tour.description.trim()) {
      pricingInfo += `<br>${tour.description}<br>`;
    }
    
    // Add pricing tiers if available
    if (tour.pricing && tour.pricing.length > 0) {
      pricingInfo += '<br><strong>Pricing:</strong><br>';
      tour.pricing.forEach(tier => {
        if (tier.min_tourist === tier.max_tourist) {
          pricingInfo += `${tier.min_tourist} pax - ${formatCurrency(tier.price_per_head)} per pax<br>`;
        } else {
          pricingInfo += `${tier.min_tourist}-${tier.max_tourist} pax - ${formatCurrency(tier.price_per_head)} per pax<br>`;
        }
      });
    }
    
    // Keep the original inclusions info (hardcoded) as fallback or additional info
    const originalInfo = moreInfoBtn.getAttribute('data-info');
    const inclusionsMatch = originalInfo.match(/<br><br>Inclusions:.*$/s);
    if (inclusionsMatch) {
      pricingInfo += inclusionsMatch[0];
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
        const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
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
