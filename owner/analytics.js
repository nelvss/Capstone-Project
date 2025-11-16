// Session checking
function checkSession() {
  const userSession = localStorage.getItem('userSession');
  
  if (!userSession) {
    // No session found, redirect to login
    window.location.href = 'login.html';
    return false;
  }
  
  try {
    const session = JSON.parse(userSession);
    
    // Check if user is owner
    if (session.type !== 'owner') {
      alert('Access denied. Owner access required.');
      window.location.href = 'login.html';
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid session data
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
    return false;
  }
}

// Chart instances storage
const chartInstances = {};

// API Configuration (shared across pages)
window.API_URL = window.API_URL || 'https://api.otgpuertogaleratravel.com';
// Toggle to use API or fallback sample data (default: true to use API)
window.USE_ANALYTICS_API = (typeof window.USE_ANALYTICS_API === 'boolean') ? window.USE_ANALYTICS_API : true;

// Socket.io connection for real-time updates (use window.socket to avoid conflicts with dashboard.js)
window.socket = window.socket || null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function initializeSocketConnection() {
    if (!window.USE_ANALYTICS_API) {
        console.log('ℹ️ Socket.io disabled (API disabled)');
        return;
    }

    try {
        // Connect to Socket.io server
        window.socket = io(window.API_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
        });

        // Connection successful
        window.socket.on('connect', () => {
            console.log('✅ Socket.io connected:', window.socket.id);
            reconnectAttempts = 0;
            updateConnectionStatus(true);
        });

        // Connection error
        window.socket.on('connect_error', (error) => {
            console.warn('⚠️ Socket.io connection error:', error.message);
            reconnectAttempts++;
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.error('❌ Socket.io max reconnection attempts reached');
                updateConnectionStatus(false);
            }
        });

        // Disconnection
        window.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket.io disconnected:', reason);
            updateConnectionStatus(false);
        });

        // Listen for real-time analytics updates
        window.socket.on('analytics-refresh', () => {
            console.log('📊 Real-time analytics update received');
            showRealtimeNotification('Analytics data updated', 'info');
            refreshAnalyticsData();
        });

        // Listen for new bookings
        window.socket.on('booking-update', (data) => {
            console.log('📋 New booking update received:', data);
            if (data.type === 'new') {
                showRealtimeNotification(`New booking from ${data.customerName || 'customer'}`, 'success');
            } else {
                showRealtimeNotification('Booking updated', 'info');
            }
            refreshAnalyticsData();
        });

        // Listen for payment updates
        window.socket.on('payment-status-changed', (data) => {
            console.log('💳 Payment status changed:', data);
            showRealtimeNotification(`Payment status: ${data.status}`, 'info');
            refreshAnalyticsData();
        });

        console.log('🔌 Socket.io initialization complete');
    } catch (error) {
        console.error('❌ Failed to initialize Socket.io:', error);
    }
}

function updateConnectionStatus(isConnected) {
    const statusIndicator = document.getElementById('connection-status');
    if (statusIndicator) {
        if (isConnected) {
            statusIndicator.className = 'connection-status connected';
            statusIndicator.title = 'Real-time updates active';
        } else {
            statusIndicator.className = 'connection-status disconnected';
            statusIndicator.title = 'Real-time updates unavailable';
        }
    }
}

// Debounce timer for refresh
let refreshDebounceTimer = null;
let isRefreshing = false;
let isLoadingChartData = false;

async function refreshAnalyticsData() {
    // Clear any pending refresh
    if (refreshDebounceTimer) {
        clearTimeout(refreshDebounceTimer);
    }
    
    // Debounce: wait 2 seconds before actually refreshing
    refreshDebounceTimer = setTimeout(async () => {
        // Prevent multiple simultaneous refreshes
        if (isRefreshing) {
            console.log('⏸️ Refresh already in progress, skipping...');
            return;
        }
        
        isRefreshing = true;
        console.log('🔄 Refreshing analytics data...');
        
        try {
            // Reload data from API
            await fetchAnalyticsDataFromApi();
            
            // Update UI
            populateAnalyticsUI();
            
            // Reinitialize charts
            initializeCharts();
            
            // Show success notification
            showNotification('Analytics data updated', 'success');
        } catch (error) {
            console.error('❌ Failed to refresh analytics data:', error);
            showNotification('Failed to refresh analytics data', 'error');
        } finally {
            isRefreshing = false;
        }
    }, 2000); // Wait 2 seconds after last event before refreshing
}

// Dynamic analytics data - will be populated from API
let analyticsData = {};
let demandForecastCache = null;

// Load analytics data from API (non-blocking, handles individual endpoint failures)
async function fetchAnalyticsDataFromApi() {
    if (!window.USE_ANALYTICS_API) {
        console.warn('ℹ️ Using fallback analytics data (API disabled).');
        return false;
    }
  
    console.log('📊 Loading analytics data from API...');
    
    // Initialize with default values
    analyticsData = {
      revenue: { total_revenue: 0, total_bookings: 0, confirmed_bookings: 0 },
      counts: { total: 0, pending: 0, confirmed: 0, cancelled: 0, rescheduled: 0, completed: 0 },
      services: { tours: {}, vehicles: 0, diving: {} },
      forecast: null
    };
    
    let successCount = 0;
    
    // Load revenue data (non-blocking)
    try {
      const revenueResponse = await fetch(`${window.API_URL}/api/analytics/revenue`);
      if (revenueResponse.ok) {
        const revenueResult = await revenueResponse.json();
        if (revenueResult.success) {
          analyticsData.revenue = revenueResult.analytics;
          successCount++;
        } else {
          console.warn('⚠️ Revenue data not available');
        }
      } else {
        console.warn(`⚠️ Revenue API returned ${revenueResponse.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load revenue data:', error.message);
    }
    
    // Load booking counts (non-blocking)
    try {
      const countsResponse = await fetch(`${window.API_URL}/api/analytics/bookings-count`);
      if (countsResponse.ok) {
        const countsResult = await countsResponse.json();
        if (countsResult.success) {
          analyticsData.counts = countsResult.counts;
          successCount++;
        } else {
          console.warn('⚠️ Booking counts not available');
        }
      } else {
        console.warn(`⚠️ Booking counts API returned ${countsResponse.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load booking counts:', error.message);
    }
    
    // Load popular services (non-blocking)
    try {
      const servicesResponse = await fetch(`${window.API_URL}/api/analytics/popular-services`);
      if (servicesResponse.ok) {
        const servicesResult = await servicesResponse.json();
        if (servicesResult.success) {
          analyticsData.services = servicesResult.services;
          successCount++;
        } else {
          console.warn('⚠️ Popular services data not available');
        }
      } else {
        console.warn(`⚠️ Popular services API returned ${servicesResponse.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load popular services:', error.message);
    }
    
    // Load booking demand time-series (non-blocking)
    try {
      const params = new URLSearchParams({
        lookback_days: '365',
        horizon: '7'
      });
      const demandResponse = await fetch(`${window.API_URL}/api/analytics/booking-demand-timeseries?${params.toString()}`);
      const demandResult = await demandResponse.json();
      if (demandResponse.ok && demandResult.success) {
        analyticsData.forecast = demandResult.data;
        demandForecastCache = null;
        successCount++;
      } else {
        console.warn('⚠️ Booking demand time-series not available', demandResult?.message);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load booking demand time-series:', error.message);
    }
    
    // Load seasonal prediction (non-blocking)
    try {
      const currentYear = new Date().getFullYear();
      const seasonalParams = new URLSearchParams({
        year: currentYear.toString(),
        lookback_years: '2'
      });
      const seasonalResponse = await fetch(`${window.API_URL}/api/analytics/seasonal-prediction?${seasonalParams.toString()}`);
      const seasonalResult = await seasonalResponse.json();
      if (seasonalResponse.ok && seasonalResult.success) {
        analyticsData.seasonal_prediction = seasonalResult.data;
        successCount++;
      } else {
        console.warn('⚠️ Seasonal prediction not available', seasonalResult?.message);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load seasonal prediction:', error.message);
    }
    
    if (successCount > 0) {
      console.log(`✅ Analytics data loaded successfully (${successCount}/4 endpoints)`);
      return true;
    } else {
      console.warn('ℹ️ No analytics data loaded, using fallback. Individual charts will load their own data.');
      return false;
    }
}

// Filter data structure with weekly breakdowns (fallback data)
const weeklyData = {
    'Jan': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [70000, 68000, 72000, 70000],
        bookings: [36, 35, 38, 36],
        tourData: {
            snorkeling: [7, 8, 7, 6],
            islandHopping: [6, 7, 6, 6],
            inlandTour: [5, 4, 5, 4],
            vehicleRental: [4, 3, 4, 4],
            hotels: [8, 9, 8, 7],
            diving: [3, 2, 3, 2]
        },
        packageData: {
            package1: [7, 8, 7, 6],
            package2: [6, 7, 6, 6],
            package3: [5, 4, 5, 4],
            package4: [4, 3, 4, 4]
        }
    },
    'Feb': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [80000, 82000, 78000, 80000],
        bookings: [42, 43, 40, 42],
        tourData: {
            snorkeling: [8, 9, 7, 8],
            islandHopping: [7, 8, 6, 7],
            inlandTour: [5, 6, 4, 5],
            vehicleRental: [4, 5, 3, 4],
            hotels: [9, 10, 8, 8],
            diving: [3, 4, 2, 3]
        },
        packageData: {
            package1: [8, 9, 7, 8],
            package2: [7, 8, 6, 7],
            package3: [5, 6, 4, 5],
            package4: [4, 5, 3, 4]
        }
    },
    'Mar': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [87500, 88000, 87000, 87500],
        bookings: [47, 48, 46, 48],
        tourData: {
            snorkeling: [9, 9, 8, 9],
            islandHopping: [8, 8, 7, 7],
            inlandTour: [6, 5, 6, 5],
            vehicleRental: [5, 4, 5, 4],
            hotels: [10, 9, 10, 9],
            diving: [4, 3, 4, 3]
        },
        packageData: {
            package1: [9, 9, 8, 9],
            package2: [8, 8, 7, 7],
            package3: [6, 5, 6, 5],
            package4: [5, 4, 5, 4]
        }
    },
    'Apr': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [45000, 46000, 44000, 45000],
        bookings: [24, 25, 24, 25],
        tourData: {
            snorkeling: [6, 7, 6, 6],
            islandHopping: [6, 5, 6, 5],
            inlandTour: [4, 4, 4, 4],
            vehicleRental: [3, 3, 3, 3],
            hotels: [7, 7, 7, 7],
            diving: [2, 2, 2, 3]
        },
        packageData: {
            package1: [6, 7, 6, 6],
            package2: [6, 5, 6, 5],
            package3: [4, 4, 4, 4],
            package4: [3, 3, 3, 3]
        }
    },
    'May': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [30000, 31000, 29000, 30000],
        bookings: [17, 17, 16, 17],
        tourData: {
            snorkeling: [5, 5, 5, 5],
            islandHopping: [5, 4, 5, 4],
            inlandTour: [3, 4, 3, 3],
            vehicleRental: [3, 2, 3, 2],
            hotels: [6, 6, 6, 6],
            diving: [2, 2, 1, 2]
        },
        packageData: {
            package1: [5, 5, 5, 5],
            package2: [5, 4, 5, 4],
            package3: [3, 4, 3, 3],
            package4: [3, 2, 3, 2]
        }
    },
    'Jun': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [23750, 24000, 23500, 23750],
        bookings: [13, 14, 13, 14],
        tourData: {
            snorkeling: [5, 4, 5, 4],
            islandHopping: [4, 4, 4, 4],
            inlandTour: [3, 3, 2, 3],
            vehicleRental: [2, 2, 2, 2],
            hotels: [5, 5, 5, 5],
            diving: [2, 1, 2, 1]
        },
        packageData: {
            package1: [5, 4, 5, 4],
            package2: [4, 4, 4, 4],
            package3: [3, 3, 2, 3],
            package4: [2, 2, 2, 2]
        }
    },
    'Jul': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [27500, 28000, 27000, 27500],
        bookings: [15, 16, 15, 16],
        tourData: {
            snorkeling: [6, 5, 6, 5],
            islandHopping: [5, 5, 5, 5],
            inlandTour: [4, 3, 4, 3],
            vehicleRental: [3, 3, 2, 3],
            hotels: [6, 7, 6, 6],
            diving: [2, 2, 2, 2]
        },
        packageData: {
            package1: [6, 5, 6, 5],
            package2: [5, 5, 5, 5],
            package3: [4, 3, 4, 3],
            package4: [3, 3, 2, 3]
        }
    },
    'Aug': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [32500, 33000, 32000, 32500],
        bookings: [18, 18, 17, 18],
        tourData: {
            snorkeling: [7, 6, 7, 6],
            islandHopping: [6, 6, 6, 6],
            inlandTour: [4, 4, 4, 4],
            vehicleRental: [3, 3, 3, 4],
            hotels: [7, 8, 7, 7],
            diving: [3, 2, 3, 2]
        },
        packageData: {
            package1: [7, 6, 7, 6],
            package2: [6, 6, 6, 6],
            package3: [4, 4, 4, 4],
            package4: [3, 3, 3, 4]
        }
    },
    'Sep': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [36250, 36500, 36000, 36250],
        bookings: [21, 21, 20, 21],
        tourData: {
            snorkeling: [8, 7, 8, 7],
            islandHopping: [7, 7, 6, 7],
            inlandTour: [5, 4, 5, 4],
            vehicleRental: [4, 4, 3, 4],
            hotels: [8, 9, 8, 8],
            diving: [3, 3, 3, 3]
        },
        packageData: {
            package1: [8, 7, 8, 7],
            package2: [7, 7, 6, 7],
            package3: [5, 4, 5, 4],
            package4: [4, 4, 3, 4]
        }
    },
    'Oct': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [41250, 41500, 41000, 41250],
        bookings: [23, 24, 23, 24],
        tourData: {
            snorkeling: [8, 9, 8, 8],
            islandHopping: [7, 8, 7, 7],
            inlandTour: [5, 5, 5, 5],
            vehicleRental: [4, 4, 4, 4],
            hotels: [9, 9, 9, 9],
            diving: [3, 3, 4, 3]
        },
        packageData: {
            package1: [8, 9, 8, 8],
            package2: [7, 8, 7, 7],
            package3: [5, 5, 5, 5],
            package4: [4, 4, 4, 4]
        }
    },
    'Nov': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [55000, 55500, 54500, 55000],
        bookings: [32, 33, 31, 32],
        tourData: {
            snorkeling: [9, 9, 9, 9],
            islandHopping: [8, 8, 8, 8],
            inlandTour: [6, 5, 6, 5],
            vehicleRental: [5, 4, 5, 4],
            hotels: [10, 10, 10, 10],
            diving: [4, 4, 3, 4]
        },
        packageData: {
            package1: [9, 9, 9, 9],
            package2: [8, 8, 8, 8],
            package3: [6, 5, 6, 5],
            package4: [5, 4, 5, 4]
        }
    },
    'Dec': {
        weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [96250, 96500, 96000, 96250],
        bookings: [50, 51, 50, 50],
        tourData: {
            snorkeling: [10, 10, 10, 10],
            islandHopping: [9, 9, 8, 9],
            inlandTour: [6, 6, 6, 6],
            vehicleRental: [5, 5, 5, 5],
            hotels: [11, 12, 11, 11],
            diving: [4, 5, 4, 4]
        },
        packageData: {
            package1: [10, 10, 10, 10],
            package2: [9, 9, 8, 9],
            package3: [6, 6, 6, 6],
            package4: [5, 5, 5, 5]
        }
    }
};

// Analytics Dashboard JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    // Check session before loading analytics
    if (!checkSession()) {
        return;
    }
    
    // Initialize Socket.io connection for real-time updates
    initializeSocketConnection();
    
    // Navigation functionality - Initialize FIRST to ensure sections are ready
    initializeNavigation();
    
    // Initialize filters
    initializeFilters();
    
    // Load data from API and populate tables
    const dataLoaded = await fetchAnalyticsDataFromApi();
    
    // Populate UI metrics and initialize charts
    populateAnalyticsUI();
    initializeCharts();
    
    // Load feedback from API/localStorage
    loadFeedback();
    
    console.log('✅ Analytics Dashboard fully initialized');
});

// Sample data for analytics - fallback data
const sampleAnalyticsData = {
    overview: {
        totalBookings: 1247,
        totalRevenue: 2400000,
        activeCustomers: 892,
        averageRating: 4.8,
        trends: {
            bookings: 12.5,
            revenue: 18.2,
            customers: 7.8,
            rating: 0.3
        }
    },
    
    monthlyRevenue: [
        { month: 'Jan', revenue: 280000, bookings: 145 },
        { month: 'Feb', revenue: 320000, bookings: 167 },
        { month: 'Mar', revenue: 350000, bookings: 189 },
        { month: 'Apr', revenue: 180000, bookings: 98 },
        { month: 'May', revenue: 120000, bookings: 67 },
        { month: 'Jun', revenue: 95000, bookings: 54 },
        { month: 'Jul', revenue: 110000, bookings: 62 },
        { month: 'Aug', revenue: 130000, bookings: 71 },
        { month: 'Sep', revenue: 145000, bookings: 83 },
        { month: 'Oct', revenue: 165000, bookings: 94 },
        { month: 'Nov', revenue: 220000, bookings: 128 },
        { month: 'Dec', revenue: 385000, bookings: 201 }
    ],
    
    services: {
        snorkeling: { bookings: 324, revenue: 583200, rating: 4.9, growth: 15.2 },
        islandHopping: { bookings: 287, revenue: 516600, rating: 4.8, growth: 22.1 },
        inlandTour: { bookings: 198, revenue: 297000, rating: 4.7, growth: 8.5 },
        vehicleRental: { bookings: 156, revenue: 468000, rating: 4.6, growth: 12.3 },
        mangyanHotel: { bookings: 89, revenue: 445000, rating: 4.9, growth: 18.7 },
        southview: { bookings: 67, revenue: 402000, rating: 4.8, growth: 25.4 },
        ilaya: { bookings: 78, revenue: 312000, rating: 4.7, growth: 9.8 },
        transientHouse: { bookings: 92, revenue: 276000, rating: 4.5, growth: 6.2 },
        bliss: { bookings: 45, revenue: 135000, rating: 4.6, growth: 14.3 },
        diving: { bookings: 112, revenue: 268800, rating: 4.8, growth: 31.2 }
    },
    
    seasonal: {
        peakSeason: {
            months: ['December', 'January', 'February', 'March', 'April'],
            avgBookings: 892,
            avgRevenue: 485000,
            topServices: ['Island Hopping', 'Snorkeling', 'Hotels']
        },
        lowSeason: {
            months: ['May', 'June', 'July', 'August', 'September', 'October', 'November'],
            avgBookings: 324,
            avgRevenue: 187000,
            topServices: ['Inland Tour', 'Vehicle Rental', 'Diving']
        }
    },
    
    predictions: {
        nextSixMonths: [
            { month: 'Jan 2026', predicted: 295000, confidence: 0.85 },
            { month: 'Feb 2026', predicted: 335000, confidence: 0.82 },
            { month: 'Mar 2026', predicted: 380000, confidence: 0.79 },
            { month: 'Apr 2026', predicted: 195000, confidence: 0.76 },
            { month: 'May 2026', predicted: 135000, confidence: 0.73 },
            { month: 'Jun 2026', predicted: 110000, confidence: 0.70 }
        ]
    }
};

// Initialize analyticsData with sample data
if (typeof analyticsData === 'undefined') {
    analyticsData = sampleAnalyticsData;
} else {
    // Merge with sample data structure for missing fields
    analyticsData = { ...sampleAnalyticsData, ...analyticsData };
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.analytics-sidebar .nav-link[data-section]');
    const sections = document.querySelectorAll('.analytics-section');
    
    console.log('🔍 Found nav links:', navLinks.length);
    console.log('🔍 Found sections:', sections.length);
    
    // Ensure we have the required elements
    if (navLinks.length === 0 || sections.length === 0) {
        console.error('❌ Navigation elements not found. Retrying in 100ms...');
        setTimeout(initializeNavigation, 100);
        return;
    }
    
    // Function to show a specific section
    function showSection(sectionId) {
        console.log('📍 Showing section:', sectionId);
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to corresponding link
        const activeLink = document.querySelector(`.analytics-sidebar .nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log('✅ Active link set for:', sectionId);
        } else {
            console.warn('⚠️ No link found for section:', sectionId);
        }
        
        // Hide all sections
        sections.forEach(section => {
            section.classList.add('d-none');
            section.classList.remove('fade-in');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            console.log('✅ Displaying section:', sectionId);
            targetSection.classList.remove('d-none');
            // Force reflow for animation
            void targetSection.offsetWidth;
            targetSection.classList.add('fade-in');
            
            // Scroll to top of main content
            const mainContent = document.querySelector('.analytics-main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
        } else {
            console.error('❌ Section not found:', sectionId);
        }
    }
    
    // Handle click events
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling
            const sectionId = link.dataset.section || link.getAttribute('data-section');
            console.log('🖱️ Clicked link, section:', sectionId);
            if (sectionId) {
                showSection(sectionId);
                // Update URL hash
                window.location.hash = sectionId;
            }
        });
    });
    
    // Handle URL hash on page load
    function handleHashChange() {
        const hash = window.location.hash.substring(1); // Remove the # symbol
        console.log('🔗 URL hash:', hash);
        
        if (hash && document.getElementById(hash)) {
            showSection(hash);
        } else if (!hash) {
            // Default to overview if no hash
            showSection('overview');
        }
    }
    
    // Check hash on page load
    handleHashChange();
    
    // Listen for hash changes (back/forward buttons)
    window.addEventListener('hashchange', handleHashChange);
    
    console.log('✅ Navigation initialized successfully');
}

// Initialize all charts
function initializeCharts() {
    createDemandPredictionChart();
    createSeasonalPredictionChart();
    // New analytics charts
    createBookingTypeChart();
    createTouristVolumeChart();
    createAvgBookingValueChart();
    createPeakBookingDaysChart();
    createServicePerformanceChart();
    createVanDestinationsChart();
}

// Initialize filter dropdowns
function initializeFilters() {
    const months = Object.keys(weeklyData);
    
    // Populate all year filters
    const yearFilters = [
        'demandPredictionYearFilter',
        'bookingTypeYearFilter',
        'touristVolumeYearFilter',
        'avgBookingValueYearFilter'
    ];
    
    yearFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            // Add more years if needed
            const years = [2022, 2023, 2024, 2025, 2026];
            
            // Clear existing options except the default
            const hasDefaultOptions = select.querySelectorAll('option').length > 0;
            if (!hasDefaultOptions) {
                years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    if (year === 2025) option.selected = true;
                    select.appendChild(option);
                });
            }
            
            // Add change event listener
            select.addEventListener('change', (e) => handleYearFilter(e, filterId));
        }
    });
    
    // Populate all month filters
    const monthFilters = [
        'demandPredictionMonthFilter',
        'bookingTypeMonthFilter',
        'touristVolumeMonthFilter',
        'avgBookingValueMonthFilter'
    ];
    
    // Define all 12 months
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    monthFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            // Clear existing options
            select.innerHTML = '';
            
            // Add "All Months" option first
            const defaultOption = document.createElement('option');
            defaultOption.value = 'all';
            defaultOption.textContent = 'All Months';
            defaultOption.selected = true;
            select.appendChild(defaultOption);
            
            // Add all 12 months
            allMonths.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month;
                select.appendChild(option);
            });
            
            // Remove any existing event listeners by cloning (this removes all listeners)
            const newSelect = select.cloneNode(true);
            select.parentNode.replaceChild(newSelect, select);
            
            // Add change event listener to the new select element
            newSelect.addEventListener('change', (e) => handleMonthFilter(e, filterId));
        }
    });
    
    // Add event listeners for week filters
    const weekFilters = [
        'demandPredictionWeekFilter'
    ];
    
    weekFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            select.addEventListener('change', (e) => handleWeekFilter(e, filterId));
        }
    });
}

// Handle year filter change
function handleYearFilter(event, filterId) {
    const year = event.target.value;
    const monthFilterId = filterId.replace('YearFilter', 'MonthFilter');
    const weekFilterId = filterId.replace('YearFilter', 'WeekFilter');
    
    // Reset month and week filters
    const monthSelect = document.getElementById(monthFilterId);
    const weekSelect = document.getElementById(weekFilterId);
    
    if (monthSelect) monthSelect.value = 'all';
    if (weekSelect) {
        weekSelect.innerHTML = '<option value="all">All Weeks</option>';
    }
    
    // Update the corresponding chart
    if (monthFilterId) {
        updateChart(monthFilterId, 'all', 'all', year);
    } else {
        // For charts without month filters, reload data
        if (filterId.includes('bookingType')) {
            loadBookingTypeData();
        } else if (filterId.includes('touristVolume')) {
            loadTouristVolumeData();
        } else if (filterId.includes('avgBookingValue')) {
            loadAvgBookingValueData();
        }
    }
}

// Handle month filter change
function handleMonthFilter(event, filterId) {
    const month = event.target.value;
    const weekFilterId = filterId.replace('MonthFilter', 'WeekFilter');
    const yearFilterId = filterId.replace('MonthFilter', 'YearFilter');
    const weekSelect = document.getElementById(weekFilterId);
    const yearSelect = document.getElementById(yearFilterId);
    const year = yearSelect ? yearSelect.value : '2025';
    
    // Clear week filter
    weekSelect.innerHTML = '<option value="all">All Weeks</option>';
    
    if (month !== 'all' && weeklyData[month]) {
        // Populate week options
        weeklyData[month].weeks.forEach((week, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = week;
            weekSelect.appendChild(option);
        });
    }
    
    // Update the corresponding chart
    updateChart(filterId, month, 'all', year);
}

// Handle week filter change
function handleWeekFilter(event, filterId) {
    const week = event.target.value;
    const monthFilterId = filterId.replace('WeekFilter', 'MonthFilter');
    const yearFilterId = filterId.replace('WeekFilter', 'YearFilter');
    const monthSelect = document.getElementById(monthFilterId);
    const yearSelect = document.getElementById(yearFilterId);
    const month = monthSelect.value;
    const year = yearSelect ? yearSelect.value : '2025';
    
    // Update the corresponding chart
    updateChart(monthFilterId, month, week, year);
}

// Update chart based on filters
function updateChart(monthFilterId, month, week, year) {
    let chartKey = '';
    
    if (monthFilterId.includes('demandPrediction')) {
        chartKey = 'demandPredictionChart';
        updateDemandPredictionChart(month, week, year);
    } else if (monthFilterId.includes('bookingType')) {
        loadBookingTypeData();
    } else if (monthFilterId.includes('touristVolume')) {
        loadTouristVolumeData();
    } else if (monthFilterId.includes('avgBookingValue')) {
        loadAvgBookingValueData();
    }
}

// Update Revenue Trend Chart
function updateRevenueTrendChart(month, week, year) {
    const chart = chartInstances['revenueTrendChart'];
    if (!chart) return;
    
    // Add year label to chart title
    const yearSuffix = year ? ` (${year})` : '';
    
    if (month === 'all') {
        // Show all months
        const monthlyData = analyticsData.monthlyRevenue || sampleAnalyticsData.monthlyRevenue;
        chart.data.labels = monthlyData.map(d => d.month + yearSuffix);
        chart.data.datasets[0].data = monthlyData.map(d => d.revenue);
    } else if (week === 'all') {
        // Show selected month only
        const monthlyData = analyticsData.monthlyRevenue || sampleAnalyticsData.monthlyRevenue;
        const monthData = monthlyData.find(d => d.month === month);
        chart.data.labels = [month + yearSuffix];
        chart.data.datasets[0].data = [monthData.revenue];
    } else {
        // Show selected week
        const weekIndex = parseInt(week);
        chart.data.labels = [weeklyData[month].weeks[weekIndex] + yearSuffix];
        chart.data.datasets[0].data = [weeklyData[month].revenue[weekIndex]];
    }
    
    chart.update();
}

// Update Booking Trends Chart
function updateBookingTrendsChart(month, week, year) {
    const chart = chartInstances['bookingTrendsChart'];
    if (!chart) return;
    
    const yearSuffix = year ? ` (${year})` : '';
    
    if (month === 'all') {
        // Show all months
        const monthlyData = analyticsData.monthlyRevenue || sampleAnalyticsData.monthlyRevenue;
        chart.data.labels = monthlyData.map(d => d.month + yearSuffix);
        chart.data.datasets[0].data = monthlyData.map(d => d.bookings);
    } else if (week === 'all') {
        // Show selected month only
        const monthlyData = analyticsData.monthlyRevenue || sampleAnalyticsData.monthlyRevenue;
        const monthData = monthlyData.find(d => d.month === month);
        chart.data.labels = [month + yearSuffix];
        chart.data.datasets[0].data = [monthData.bookings];
    } else {
        // Show selected week
        const weekIndex = parseInt(week);
        chart.data.labels = [weeklyData[month].weeks[weekIndex] + yearSuffix];
        chart.data.datasets[0].data = [weeklyData[month].bookings[weekIndex]];
    }
    
    chart.update();
}

// Update Tour Only Chart
function updateTourOnlyChart(month, week, year) {
    const chart = chartInstances['tourOnlyChart'];
    if (!chart) return;
    
    const yearSuffix = year ? ` ${year}` : '';
    
    if (month === 'all') {
        // Show all months data - reset to original
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        chart.data.labels = months.map(m => m + yearSuffix);
        
        chart.data.datasets[0].data = [28, 32, 35, 25, 20, 18, 22, 26, 30, 33, 36, 40];
        chart.data.datasets[1].data = [25, 28, 30, 22, 18, 16, 20, 24, 27, 29, 32, 35];
        chart.data.datasets[2].data = [18, 20, 22, 16, 13, 11, 14, 16, 18, 20, 22, 24];
        chart.data.datasets[3].data = [15, 16, 18, 12, 10, 8, 11, 13, 15, 16, 18, 20];
        chart.data.datasets[4].data = [32, 35, 38, 28, 24, 20, 25, 29, 33, 36, 40, 45];
        chart.data.datasets[5].data = [10, 12, 14, 9, 7, 6, 8, 10, 12, 13, 15, 17];
    } else if (week === 'all') {
        // Show selected month - all weeks
        const weeks = weeklyData[month].weeks;
        chart.data.labels = weeks.map(w => w + yearSuffix);
        
        chart.data.datasets[0].data = weeklyData[month].tourData.snorkeling;
        chart.data.datasets[1].data = weeklyData[month].tourData.islandHopping;
        chart.data.datasets[2].data = weeklyData[month].tourData.inlandTour;
        chart.data.datasets[3].data = weeklyData[month].tourData.vehicleRental;
        chart.data.datasets[4].data = weeklyData[month].tourData.hotels;
        chart.data.datasets[5].data = weeklyData[month].tourData.diving;
    } else {
        // Show selected week only
        const weekIndex = parseInt(week);
        chart.data.labels = [weeklyData[month].weeks[weekIndex] + yearSuffix];
        
        chart.data.datasets[0].data = [weeklyData[month].tourData.snorkeling[weekIndex]];
        chart.data.datasets[1].data = [weeklyData[month].tourData.islandHopping[weekIndex]];
        chart.data.datasets[2].data = [weeklyData[month].tourData.inlandTour[weekIndex]];
        chart.data.datasets[3].data = [weeklyData[month].tourData.vehicleRental[weekIndex]];
        chart.data.datasets[4].data = [weeklyData[month].tourData.hotels[weekIndex]];
        chart.data.datasets[5].data = [weeklyData[month].tourData.diving[weekIndex]];
    }
    
    chart.update();
}

// Update Package Tour Chart
function updatePackageTourChart(month, week, year) {
    const chart = chartInstances['packageTourChart'];
    if (!chart) return;
    
    const yearSuffix = year ? ` ${year}` : '';
    
    if (month === 'all') {
        // Show all months data - reset to original
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        chart.data.labels = months.map(m => m + yearSuffix);
        
        chart.data.datasets[0].data = [28, 32, 35, 25, 20, 18, 22, 26, 30, 33, 36, 40];
        chart.data.datasets[1].data = [25, 28, 30, 22, 18, 16, 20, 24, 27, 29, 32, 35];
        chart.data.datasets[2].data = [18, 20, 22, 16, 13, 11, 14, 16, 18, 20, 22, 24];
        chart.data.datasets[3].data = [15, 16, 18, 12, 10, 8, 11, 13, 15, 16, 18, 20];
    } else if (week === 'all') {
        // Show selected month - all weeks
        const weeks = weeklyData[month].weeks;
        chart.data.labels = weeks.map(w => w + yearSuffix);
        
        chart.data.datasets[0].data = weeklyData[month].packageData.package1;
        chart.data.datasets[1].data = weeklyData[month].packageData.package2;
        chart.data.datasets[2].data = weeklyData[month].packageData.package3;
        chart.data.datasets[3].data = weeklyData[month].packageData.package4;
    } else {
        // Show selected week only
        const weekIndex = parseInt(week);
        chart.data.labels = [weeklyData[month].weeks[weekIndex] + yearSuffix];
        
        chart.data.datasets[0].data = [weeklyData[month].packageData.package1[weekIndex]];
        chart.data.datasets[1].data = [weeklyData[month].packageData.package2[weekIndex]];
        chart.data.datasets[2].data = [weeklyData[month].packageData.package3[weekIndex]];
        chart.data.datasets[3].data = [weeklyData[month].packageData.package4[weekIndex]];
    }
    
    chart.update();
}

function updateDemandPredictionChart(month, week, year) {
    createDemandPredictionChart({ month, week, year });
}

// Revenue Trend Chart (removed from dashboard, kept for potential future use)
function createRevenueTrendChart() {
    const canvas = document.getElementById('revenueTrendChart');
    if (!canvas) return; // Chart element removed from dashboard
    const ctx = canvas.getContext('2d');
    const monthlyData = analyticsData.monthlyRevenue || sampleAnalyticsData.monthlyRevenue;
    chartInstances['revenueTrendChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [{
                label: 'Revenue (₱)',
                data: monthlyData.map(d => d.revenue),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

// Booking Trends Chart - removed duplicate, using amCharts version below

// Daily Booking Pattern Chart
function createDailyBookingChart() {
    const ctx = document.getElementById('dailyBookingChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                label: 'Booking Pattern',
                data: [45, 38, 42, 48, 65, 89, 78],
                borderColor: '#17a2b8',
                backgroundColor: 'rgba(23, 162, 184, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Monthly Booking Volume Chart
function createMonthlyBookingChart() {
    const ctx = document.getElementById('monthlyBookingChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.monthlyRevenue.map(d => d.month),
            datasets: [{
                label: 'Bookings',
                data: analyticsData.monthlyRevenue.map(d => d.bookings),
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Popular Services Chart
function createPopularServicesChart() {
    const ctx = document.getElementById('popularServicesChart').getContext('2d');
    const serviceNames = Object.keys(analyticsData.services);
    const serviceBookings = serviceNames.map(name => analyticsData.services[name].bookings);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: serviceNames.map(formatServiceName),
            datasets: [{
                label: 'Bookings',
                data: serviceBookings,
                backgroundColor: [
                    '#dc3545', '#007bff', '#28a745', '#ffc107',
                    '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14',
                    '#20c997', '#6c757d'
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Service Revenue Chart
function createServiceRevenueChart() {
    const ctx = document.getElementById('serviceRevenueChart').getContext('2d');
    const serviceNames = Object.keys(analyticsData.services);
    const serviceRevenue = serviceNames.map(name => analyticsData.services[name].revenue);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: serviceNames.map(formatServiceName),
            datasets: [{
                data: serviceRevenue,
                backgroundColor: [
                    '#dc3545', '#007bff', '#28a745', '#ffc107',
                    '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14',
                    '#20c997', '#6c757d'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

// Seasonal Analysis Chart
function createSeasonalAnalysisChart() {
    const ctx = document.getElementById('seasonalAnalysisChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.monthlyRevenue.map(d => d.month),
            datasets: [
                {
                    label: 'Bookings',
                    data: analyticsData.monthlyRevenue.map(d => d.bookings),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue (₱K)',
                    data: analyticsData.monthlyRevenue.map(d => d.revenue / 1000),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Seasonal Services Chart
function createSeasonalServicesChart() {
    const ctx = document.getElementById('seasonalServicesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Island Hopping', 'Snorkeling', 'Hotels', 'Inland Tour', 'Vehicle Rental', 'Diving'],
            datasets: [
                {
                    label: 'Peak Season',
                    data: [89, 78, 67, 45, 34, 23],
                    backgroundColor: '#ffc107'
                },
                {
                    label: 'Low Season',
                    data: [34, 45, 23, 67, 56, 78],
                    backgroundColor: '#17a2b8'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true
                }
            }
        }
    });
}

// Weather Impact Chart
function createWeatherImpactChart() {
    const ctx = document.getElementById('weatherImpactChart').getContext('2d');
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Sunny Days',
                data: [{x: 28, y: 145}, {x: 25, y: 167}, {x: 30, y: 189}],
                backgroundColor: '#ffc107'
            }, {
                label: 'Rainy Days',
                data: [{x: 18, y: 67}, {x: 15, y: 54}, {x: 12, y: 62}],
                backgroundColor: '#17a2b8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Bookings'
                    }
                }
            }
        }
    });
}

// Seasonal Prediction Chart (Peak vs Low Seasons)
async function createSeasonalPredictionChart() {
  const canvas = document.getElementById('seasonalPredictionChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const statusEl = document.getElementById('seasonalPredictionStatus');
  if (statusEl) {
    statusEl.textContent = 'Loading seasonal forecast...';
    statusEl.className = 'small text-muted mb-2';
  }
  
  try {
    const seasonalData = analyticsData.seasonal_prediction;
    
    if (!seasonalData || !seasonalData.has_sufficient_data) {
      if (chartInstances['seasonalPredictionChart']) {
        chartInstances['seasonalPredictionChart'].destroy();
        chartInstances['seasonalPredictionChart'] = null;
      }
      if (statusEl) {
        statusEl.textContent = seasonalData?.message || 'Not enough historical data to predict seasonal patterns yet.';
        statusEl.className = 'small text-warning mb-2';
      }
      return;
    }
    
    const months = seasonalData.months || [];
    const labels = months.map(m => m.month_name);
    const predictedBookings = months.map(m => m.predicted_bookings);
    const predictedRevenue = months.map(m => m.predicted_revenue / 1000); // Convert to thousands
    
    // Color code based on season classification
    const backgroundColors = months.map(m => {
      const percentage = (m.predicted_bookings / seasonalData.average_monthly_bookings) * 100;
      if (percentage >= 125) return 'rgba(220, 53, 69, 0.7)'; // Peak - Red
      if (percentage <= 75) return 'rgba(13, 110, 253, 0.7)'; // Low - Blue
      return 'rgba(255, 193, 7, 0.7)'; // Moderate - Yellow
    });
    
    if (chartInstances['seasonalPredictionChart']) {
      chartInstances['seasonalPredictionChart'].destroy();
    }
    
    chartInstances['seasonalPredictionChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Predicted Bookings',
            data: predictedBookings,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Predicted Revenue (₱K)',
            data: predictedRevenue,
            type: 'line',
            borderColor: '#20c997',
            backgroundColor: 'rgba(32, 201, 151, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Predicted Bookings'
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Revenue (₱K)'
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (label.includes('Revenue')) {
                  return `${label}: ₱${value.toFixed(1)}K`;
                }
                return `${label}: ${Math.round(value)} bookings`;
              },
              afterLabel: (context) => {
                const monthData = months[context.dataIndex];
                if (context.datasetIndex === 0 && monthData) {
                  const percentage = monthData.percentage_of_average || 
                    ((monthData.predicted_bookings / seasonalData.average_monthly_bookings) * 100).toFixed(0);
                  return `${percentage}% of average\nTrend: ${monthData.trend}`;
                }
                return '';
              }
            }
          }
        }
      }
    });
    
    // Update status message
    if (statusEl) {
      const peakMonthsText = seasonalData.peak_months?.map(m => m.month).join(', ') || 'None';
      const lowMonthsText = seasonalData.low_months?.map(m => m.month).join(', ') || 'None';
      statusEl.innerHTML = `<strong>Peak Season:</strong> ${peakMonthsText} • <strong>Low Season:</strong> ${lowMonthsText} • Based on ${seasonalData.lookback_years} years of data`;
      statusEl.className = 'small text-info mb-2';
    }
    
  } catch (error) {
    console.error('❌ Failed to create seasonal prediction chart:', error);
    if (chartInstances['seasonalPredictionChart']) {
      chartInstances['seasonalPredictionChart'].destroy();
      chartInstances['seasonalPredictionChart'] = null;
    }
    if (statusEl) {
      statusEl.textContent = 'Unable to generate seasonal forecast. Please try again later.';
      statusEl.className = 'small text-danger mb-2';
    }
  }
}

// Demand Prediction Chart (TensorFlow.js powered)
async function createDemandPredictionChart(filters = {}) {
    const canvas = document.getElementById('demandPredictionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    setDemandPredictionStatus('Training TensorFlow.js models…', 'muted');
    
    try {
        const prepared = await prepareDemandForecastData(filters);
        
        if (!prepared.datasets.length) {
            if (chartInstances['demandPredictionChart']) {
                chartInstances['demandPredictionChart'].destroy();
                chartInstances['demandPredictionChart'] = null;
            }
            setDemandPredictionStatus('Not enough confirmed bookings to generate a forecast yet.', 'warning');
            return;
        }
        
        if (chartInstances['demandPredictionChart']) {
            chartInstances['demandPredictionChart'].destroy();
        }
        
        chartInstances['demandPredictionChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: prepared.labels,
                datasets: prepared.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Bookings'
                        }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 14
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y ?? 0;
                                return `${context.dataset.label}: ${Math.max(0, Math.round(value))} bookings`;
                            }
                        }
                    }
                }
            }
        });
        
        const statusParts = [`Forecast horizon: ${prepared.metadata.horizon} days`];
        if (prepared.metadata.averageConfidence) {
            statusParts.push(`Avg confidence ${(prepared.metadata.averageConfidence * 100).toFixed(0)}%`);
        }
        if (prepared.metadata.generatedAt) {
            statusParts.push(`Updated ${formatRelativeTime(prepared.metadata.generatedAt)}`);
        }
        setDemandPredictionStatus(statusParts.join(' • '), 'info');
    } catch (error) {
        console.error('❌ Failed to create demand prediction chart:', error);
        if (chartInstances['demandPredictionChart']) {
            chartInstances['demandPredictionChart'].destroy();
            chartInstances['demandPredictionChart'] = null;
        }
        setDemandPredictionStatus('Unable to generate forecast. Please try again later.', 'danger');
    }
}

function setDemandPredictionStatus(message, tone = 'muted') {
    const statusEl = document.getElementById('demandPredictionStatus');
    if (!statusEl) return;
    const toneMap = {
        muted: 'text-muted',
        info: 'text-primary',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger'
    };
    const toneClass = toneMap[tone] || toneMap.muted;
    statusEl.className = `small ${toneClass} mb-2`;
    statusEl.textContent = message;
}

function formatRelativeTime(value) {
    if (!value) return 'just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
}

async function prepareDemandForecastData(filters = {}) {
    if (demandForecastCache && demandForecastCache.signature === JSON.stringify(filters)) {
        return demandForecastCache.value;
    }
    
    const forecastSource = analyticsData.forecast;
    if (!forecastSource || !Array.isArray(forecastSource.services) || forecastSource.services.length === 0) {
        return {
            labels: [],
            datasets: [],
            metadata: {
                horizon: forecastSource?.horizon || 7,
                generatedAt: forecastSource?.generated_at || null,
                averageConfidence: null
            }
        };
    }
    
    const topServices = forecastSource.services
        .map((service) => {
            const historyTotal = Array.isArray(service.history)
                ? service.history.reduce((sum, point) => sum + (Number(point?.value) || 0), 0)
                : 0;
            return {
                ...service,
                historyTotal
            };
        })
        .filter((service) => service.historyTotal > 0)
        .sort((a, b) => b.historyTotal - a.historyTotal)
        .slice(0, 3);
    
    if (!topServices.length) {
        return {
            labels: [],
            datasets: [],
            metadata: {
                horizon: forecastSource.horizon || 7,
                generatedAt: forecastSource.generated_at || null,
                averageConfidence: null
            }
        };
    }
    
    await ensureTfReady();
    
    const labelSet = new Set();
    const processedServices = [];
    const confidences = [];
    
    for (const service of topServices) {
        const series = buildDailySeries(service.history);
        const hasSignal = series.values.some((value) => value > 0);
        if (!hasSignal) {
            continue;
        }
        
        const forecastResult = await trainDenseForecast(series.values, forecastSource.horizon || 7);
        confidences.push(forecastResult.confidence);
        
        const historyMap = new Map(series.dates.map((date, index) => [date, series.values[index]]));
        const forecastMap = new Map();
        let cursor = series.dates.length
            ? new Date(`${series.dates[series.dates.length - 1]}T00:00:00Z`)
            : new Date();
        
        forecastResult.forecast.forEach((value) => {
            cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
            const dateKey = cursor.toISOString().split('T')[0];
            forecastMap.set(dateKey, Math.max(0, Math.round(value)));
        });
        
        series.dates.forEach((date) => labelSet.add(date));
        forecastMap.forEach((_, date) => labelSet.add(date));
        
        processedServices.push({
            key: service.key,
            label: service.label,
            historyMap,
            forecastMap,
            lastHistoryDate: series.dates[series.dates.length - 1]
        });
    }
    
    if (!processedServices.length) {
        return {
            labels: [],
            datasets: [],
            metadata: {
                horizon: forecastSource.horizon || 7,
                generatedAt: forecastSource.generated_at || null,
                averageConfidence: null
            }
        };
    }
    
    const labels = Array.from(labelSet).sort();
    const palettes = [
        { border: '#0d6efd', background: 'rgba(13, 110, 253, 0.15)' },
        { border: '#ffa41b', background: 'rgba(255, 164, 27, 0.15)' },
        { border: '#20c997', background: 'rgba(32, 201, 151, 0.15)' }
    ];
    
    const datasets = [];
    processedServices.forEach((service, index) => {
        const palette = palettes[index % palettes.length];
        const actualData = labels.map((date) => {
            if (!service.lastHistoryDate || date > service.lastHistoryDate) {
                return null;
            }
            return service.historyMap.get(date) ?? 0;
        });
        
        const forecastData = labels.map((date) => {
            if (!service.lastHistoryDate || date <= service.lastHistoryDate) {
                return null;
            }
            return service.forecastMap.get(date) ?? null;
        });
        
        datasets.push({
            label: `${service.label} — Actual`,
            data: actualData,
            borderColor: palette.border,
            backgroundColor: palette.background,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35,
            spanGaps: true,
            fill: false
        });
        
        datasets.push({
            label: `${service.label} — Forecast`,
            data: forecastData,
            borderColor: palette.border,
            backgroundColor: palette.background,
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35,
            spanGaps: true,
            fill: false
        });
    });
    
    const prepared = {
        labels,
        datasets,
        metadata: {
            horizon: forecastSource.horizon || 7,
            generatedAt: forecastSource.generated_at || null,
            averageConfidence: confidences.length
                ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
                : null
        }
    };
    
    demandForecastCache = {
        signature: JSON.stringify(filters),
        value: prepared
    };
    
    return prepared;
}

let tfReadyPromise = null;
async function ensureTfReady() {
    if (!window.tf) {
        throw new Error('TensorFlow.js library not loaded');
    }
    if (!tfReadyPromise) {
        tfReadyPromise = window.tf.ready();
    }
    await tfReadyPromise;
}

function buildDailySeries(history, { maxPoints = 180 } = {}) {
    if (!Array.isArray(history) || history.length === 0) {
        return { dates: [], values: [] };
    }
    
    const sanitized = history
        .map((point) => ({
            date: point?.date,
            value: Number(point?.value) || 0
        }))
        .filter((point) => point.date)
        .sort((a, b) => a.date.localeCompare(b.date));
    
    if (!sanitized.length) {
        return { dates: [], values: [] };
    }
    
    const startIndex = Math.max(0, sanitized.length - maxPoints);
    const truncated = sanitized.slice(startIndex);
    const dataMap = new Map(truncated.map((point) => [point.date, point.value]));
    
    const startDate = new Date(`${truncated[0].date}T00:00:00Z`);
    const endDate = new Date(`${truncated[truncated.length - 1].date}T00:00:00Z`);
    const dates = [];
    const values = [];
    
    for (let time = startDate.getTime(); time <= endDate.getTime(); time += 24 * 60 * 60 * 1000) {
        const currentDate = new Date(time).toISOString().split('T')[0];
        dates.push(currentDate);
        values.push(dataMap.get(currentDate) || 0);
    }
    
    return { dates, values };
}

async function trainDenseForecast(values, horizon) {
    const nonZero = values.some((value) => value > 0);
    if (!nonZero) {
        return { forecast: new Array(horizon).fill(0), confidence: 0.5 };
    }
    
    const maxVal = Math.max(...values, 1);
    if (maxVal === 0) {
        return { forecast: new Array(horizon).fill(0), confidence: 0.5 };
    }
    
    const windowSize = Math.min(14, Math.max(4, Math.floor(values.length / 3)));
    if (values.length <= windowSize + 1) {
        const average = values.reduce((sum, value) => sum + value, 0) / values.length || 0;
        return { forecast: new Array(horizon).fill(Math.max(0, average)), confidence: 0.4 };
    }
    
    const sequences = [];
    const targets = [];
    for (let i = 0; i <= values.length - windowSize - 1; i++) {
        const slice = values.slice(i, i + windowSize);
        sequences.push(slice);
        targets.push(values[i + windowSize]);
    }
    
    if (sequences.length < 2) {
        const average = values.reduce((sum, value) => sum + value, 0) / values.length || 0;
        return { forecast: new Array(horizon).fill(Math.max(0, average)), confidence: 0.4 };
    }
    
    const normalizedSequences = sequences.map((seq) => seq.map((value) => value / maxVal));
    const normalizedTargets = targets.map((value) => value / maxVal);
    
    const xs = tf.tensor2d(normalizedSequences);
    const ys = tf.tensor1d(normalizedTargets);
    
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [windowSize], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
    
    const batchSize = Math.min(8, normalizedSequences.length);
    const fitResult = await model.fit(xs, ys, {
        epochs: 80,
        batchSize,
        shuffle: true,
        verbose: 0
    });
    
    xs.dispose();
    ys.dispose();
    
    const forecast = [];
    let latestWindow = values.slice(values.length - windowSize).map((value) => value / maxVal);
    
    for (let i = 0; i < horizon; i++) {
        const prediction = tf.tidy(() => {
            const inputTensor = tf.tensor2d([latestWindow]);
            const outputTensor = model.predict(inputTensor);
            const value = outputTensor.dataSync()[0];
            return Math.max(0, value);
        });
        
        const denormalized = Math.max(0, prediction * maxVal);
        forecast.push(denormalized);
        latestWindow = [...latestWindow.slice(1), prediction];
    }
    
    model.dispose();
    
    const losses = fitResult.history?.loss || [];
    const finalLoss = losses.length ? losses[losses.length - 1] : null;
    const confidence = finalLoss != null ? Math.max(0.3, Math.min(0.95, 1 / (1 + finalLoss))) : 0.6;
    
    return { forecast, confidence };
}

// Populate analytics UI with current data
function populateAnalyticsUI() {
    populateServiceMetricsTable();
    updateOverviewMetrics();
}

// Populate service metrics table
function populateServiceMetricsTable() {
    const tableBody = document.getElementById('serviceMetricsTable');
    if (!tableBody) return;
    
    const services = analyticsData.services || sampleAnalyticsData.services;
    const serviceEntries = Object.entries(services);
    
    tableBody.innerHTML = serviceEntries.map(([name, data]) => `
        <tr>
            <td><strong>${formatServiceName(name)}</strong></td>
            <td>${data.bookings}</td>
            <td>₱${(data.revenue / 1000).toFixed(0)}K</td>
            <td>
                <span class="badge bg-warning text-dark">${data.rating}</span>
            </td>
            <td>
                <span class="metric-change ${data.growth > 0 ? 'positive' : 'negative'}">
                    ${data.growth > 0 ? '+' : ''}${data.growth}%
                </span>
            </td>
            <td>
                <i class="fas fa-arrow-${data.growth > 15 ? 'up text-success' : data.growth > 0 ? 'right text-warning' : 'down text-danger'}"></i>
            </td>
        </tr>
    `).join('');
}

// Update overview metrics
function updateOverviewMetrics() {
    const overview = analyticsData.overview || sampleAnalyticsData.overview;
    
    const totalBookingsEl = document.getElementById('total-bookings');
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalCustomersEl = document.getElementById('total-customers');
    const avgRatingEl = document.getElementById('avg-rating');
    
    if (totalBookingsEl) totalBookingsEl.textContent = overview.totalBookings.toLocaleString();
    if (totalRevenueEl) totalRevenueEl.textContent = `₱${(overview.totalRevenue / 1000000).toFixed(1)}M`;
    if (totalCustomersEl) totalCustomersEl.textContent = overview.activeCustomers.toLocaleString();
    if (avgRatingEl) avgRatingEl.textContent = overview.averageRating.toFixed(1);
}

// Utility functions
function formatServiceName(name) {
    const nameMap = {
        snorkeling: 'Snorkeling Tour',
        islandHopping: 'Island Hopping',
        inlandTour: 'Inland Tour',
        vehicleRental: 'Vehicle Rental',
        mangyanHotel: 'Mangyan Grand Hotel',
        southview: 'SouthView Hotel',
        ilaya: 'Ilaya Hotel',
        transientHouse: 'Transient House',
        bliss: 'Bliss Hotel',
        diving: 'Diving Tours'
    };
    
    return nameMap[name] || name;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function showRealtimeNotification(message, type = 'info') {
    // Create real-time notification element
    const notification = document.createElement('div');
    notification.className = 'realtime-notification';
    
    const iconMap = {
        success: 'fa-check-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    const icon = iconMap[type] || iconMap.info;
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Add animation
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease';
    }, 10);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Initialize real-time updates (simulated)
function initializeRealTimeUpdates() {
    setInterval(() => {
        // Simulate real-time data updates
        const services = analyticsData.services || sampleAnalyticsData.services;
        const randomService = Object.keys(services)[Math.floor(Math.random() * Object.keys(services).length)];
        if (services[randomService]) {
            services[randomService].bookings += Math.floor(Math.random() * 3);
        }
        
        // Update display if on overview section
        const overviewSection = document.getElementById('overview');
        if (overviewSection && !overviewSection.classList.contains('d-none')) {
            updateOverviewMetrics();
        }
    }, 30000); // Update every 30 seconds
}

// Smooth page navigation with transition
function navigateWithTransition(url) {
  // Add transition class to body
  document.body.classList.add('page-transition');
  
  // Wait for transition to complete before navigating
  setTimeout(() => {
    window.location.href = url;
  }, 300); // Match the CSS transition duration
}

// Logout functionality
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userSession');
    window.location.href = 'login.html';
  }
}

// Start real-time updates
initializeRealTimeUpdates();

// Service Distribution Pie Chart using amCharts (removed from dashboard, kept for potential future use)
function createServiceDistributionChart() {
    const canvas = document.getElementById('chartdiv');
    if (!canvas) return; // Chart element removed from dashboard
    const ctx = canvas.getContext('2d');
    
    // Sample data showing trend over 12 months for Tour Only services
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    chartInstances['tourOnlyChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Snorkeling',
                    data: [28, 32, 35, 25, 20, 18, 22, 26, 30, 33, 36, 40],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Island Hopping',
                    data: [25, 28, 30, 22, 18, 16, 20, 24, 27, 29, 32, 35],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Inland Tour',
                    data: [18, 20, 22, 16, 13, 11, 14, 16, 18, 20, 22, 24],
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Vehicle Rental',
                    data: [15, 16, 18, 12, 10, 8, 11, 13, 15, 16, 18, 20],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Hotels',
                    data: [32, 35, 38, 28, 24, 20, 25, 29, 33, 36, 40, 45],
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Diving',
                    data: [10, 12, 14, 9, 7, 6, 8, 10, 12, 13, 15, 17],
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function createServiceDistributionChart2() {
    const canvas = document.getElementById('chartdiv2');
    if (!canvas) return; // Chart element removed from dashboard
    const ctx = canvas.getContext('2d');
    
    // Sample data showing trend over 12 months for Package Tours
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    chartInstances['packageTourChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Package 1',
                    data: [28, 32, 35, 25, 20, 18, 22, 26, 30, 33, 36, 40],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Package 2',
                    data: [25, 28, 30, 22, 18, 16, 20, 24, 27, 29, 32, 35],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Package 3',
                    data: [18, 20, 22, 16, 13, 11, 14, 16, 18, 20, 22, 24],
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Package 4',
                    data: [15, 16, 18, 12, 10, 8, 11, 13, 15, 16, 18, 20],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' bookings';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    },
                    title: {
                        display: true,
                        text: 'Bookings'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function createBookingTrendsChart() {
    const canvas = document.getElementById('bookingTrendsChart');
    if (!canvas) return; // Chart element removed from dashboard
    const ctx = canvas.getContext('2d');
    
    // Use data from analyticsData
    const monthlyData = analyticsData.monthlyRevenue || sampleAnalyticsData.monthlyRevenue;
    const data = monthlyData.map(d => ({
        month: d.month,
        bookings: d.bookings
    }));

    chartInstances['bookingTrendsChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                label: 'Bookings',
                data: data.map(d => d.bookings),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Bookings: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 25
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create Booking Status Distribution Chart (Doughnut)
function createBookingStatusChart() {
    const ctx = document.getElementById('bookingStatusChart');
    if (!ctx) return;
    
    chartInstances['bookingStatusChart'] = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Confirmed', 'Cancelled', 'Rescheduled', 'Completed'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#ffc107',
                    '#28a745',
                    '#dc3545',
                    '#17a2b8',
                    '#6c757d'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Load data from API
    loadBookingStatusData();
}

// Create Booking Type Comparison Chart
function createBookingTypeChart() {
    const ctx = document.getElementById('bookingTypeChart');
    if (!ctx) return;
    
    chartInstances['bookingTypeChart'] = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Package Only',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Tour Only',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
    
    // Load data from API
    loadBookingTypeData();
}

// Create Tourist Volume Chart
function createTouristVolumeChart() {
    const ctx = document.getElementById('touristVolumeChart');
    if (!ctx) return;
    
    chartInstances['touristVolumeChart'] = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tourists',
                data: [],
                borderColor: '#17a2b8',
                backgroundColor: 'rgba(23, 162, 184, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Load data from API
    loadTouristVolumeData();
}

// Create Average Booking Value Chart
function createAvgBookingValueChart() {
    const ctx = document.getElementById('avgBookingValueChart');
    if (!ctx) return;
    
    chartInstances['avgBookingValueChart'] = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Booking Value',
                data: [],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + (value / 1000).toFixed(1) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    // Load data from API
    loadAvgBookingValueData();
}

// Create Peak Booking Days Chart
function createPeakBookingDaysChart() {
    const ctx = document.getElementById('peakBookingDaysChart');
    if (!ctx) return;
    
    chartInstances['peakBookingDaysChart'] = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            datasets: [{
                label: 'Bookings',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Load data from API
    loadPeakBookingDaysData();
}

// Create Service Performance Chart
function createServicePerformanceChart() {
    const ctx = document.getElementById('servicePerformanceChart');
    if (!ctx) return;
    
    chartInstances['servicePerformanceChart'] = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Bookings',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Load data from API
    loadServicePerformanceData();
}

// Create Van Destinations Charts (Within and Outside Puerto Galera)
function createVanDestinationsChart() {
    const ctxWithin = document.getElementById('vanDestinationsWithinChart');
    const ctxOutside = document.getElementById('vanDestinationsOutsideChart');
    
    if (!ctxWithin || !ctxOutside) {
        console.error('❌ Van destinations chart canvas not found');
        return;
    }
    
    console.log('📊 Creating van destinations charts...');
    
    // Common chart configuration
    const chartConfig = {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                label: 'Bookings',
                data: [],
                backgroundColor: [
                    '#dc3545',
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#17a2b8',
                    '#6f42c1',
                    '#e83e8c',
                    '#fd7e14',
                    '#20c997',
                    '#6c757d',
                    '#ff6384',
                    '#36a2eb',
                    '#cc65fe',
                    '#ffce56',
                    '#4bc0c0',
                    '#9966ff',
                    '#ff9f40',
                    '#ff6384',
                    '#c9cbcf',
                    '#ff6384'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'bottom',
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
    
    // Create Within Puerto Galera chart
    chartInstances['vanDestinationsWithinChart'] = new Chart(ctxWithin.getContext('2d'), JSON.parse(JSON.stringify(chartConfig)));
    
    // Create Outside Puerto Galera chart
    chartInstances['vanDestinationsOutsideChart'] = new Chart(ctxOutside.getContext('2d'), JSON.parse(JSON.stringify(chartConfig)));
    
    // Load data from API after a short delay to ensure charts are fully initialized
    setTimeout(() => {
        loadVanDestinationsData();
    }, 100);
}

// Data loading functions for new charts
async function loadBookingStatusData() {
    try {
        const response = await fetch(`${window.API_URL}/api/analytics/booking-status-distribution`);
        const result = await response.json();
        
        if (result.success && result.distribution) {
            const chart = chartInstances['bookingStatusChart'];
            if (chart) {
                chart.data.datasets[0].data = [
                    result.distribution.pending || 0,
                    result.distribution.confirmed || 0,
                    result.distribution.cancelled || 0,
                    result.distribution.rescheduled || 0,
                    result.distribution.completed || 0
                ];
                chart.update();
            }
        }
    } catch (error) {
        console.error('Error loading booking status data:', error);
    }
}

async function loadBookingTypeData() {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping booking type...');
        return;
    }
    
    try {
        const yearSelect = document.getElementById('bookingTypeYearFilter');
        const monthSelect = document.getElementById('bookingTypeMonthFilter');
        const year = yearSelect ? yearSelect.value : '2025';
        const month = monthSelect ? monthSelect.value : 'all';
        
        let url = `${window.API_URL}/api/analytics/booking-type-comparison?group_by=month`;
        
        // Set date range based on year and month filters
        if (month !== 'all') {
            // Convert month name to number
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthNum = monthNames.indexOf(month) + 1;
            if (monthNum > 0) {
                const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
                const endDate = `${year}-${String(monthNum).padStart(2, '0')}-31`;
                url += `&start_date=${startDate}&end_date=${endDate}`;
            }
        } else {
            // Filter by year - show all months in the selected year
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        const response = await fetch(url);
        
        // Handle non-200 responses gracefully
        if (!response.ok) {
            console.warn(`⚠️ Booking type API returned ${response.status}`);
            const chart = chartInstances['bookingTypeChart'];
            if (chart) {
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.data.datasets[1].data = [];
                chart.update();
            }
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.comparison && Array.isArray(result.comparison)) {
            const chart = chartInstances['bookingTypeChart'];
            if (chart && result.comparison.length > 0) {
                // Format labels to show month names
                const labels = result.comparison.map(c => {
                    const parts = c.period.split('-');
                    if (parts.length >= 2) {
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const monthIdx = parseInt(parts[1]) - 1;
                        return monthNames[monthIdx] || c.period;
                    }
                    return c.period;
                });
                
                chart.data.labels = labels;
                chart.data.datasets[0].data = result.comparison.map(c => c.package_only || 0);
                chart.data.datasets[1].data = result.comparison.map(c => c.tour_only || 0);
                chart.update();
            } else if (chart) {
                // No data available
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.data.datasets[1].data = [];
                chart.update();
            }
        }
    } catch (error) {
        console.error('Error loading booking type data:', error);
        // Clear chart on error
        const chart = chartInstances['bookingTypeChart'];
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.data.datasets[1].data = [];
            chart.update();
        }
    }
}

async function loadTouristVolumeData() {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping tourist volume...');
        return;
    }
    
    try {
        const yearSelect = document.getElementById('touristVolumeYearFilter');
        const monthSelect = document.getElementById('touristVolumeMonthFilter');
        const year = yearSelect ? yearSelect.value : '2025';
        const month = monthSelect ? monthSelect.value : 'all';
        
        let url = `${window.API_URL}/api/analytics/tourist-volume?group_by=month`;
        if (month !== 'all') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthNum = monthNames.indexOf(month) + 1;
            if (monthNum > 0) {
                const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
                const endDate = `${year}-${String(monthNum).padStart(2, '0')}-31`;
                url += `&start_date=${startDate}&end_date=${endDate}`;
            }
        } else {
            // Filter by year - show all months in the selected year
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`⚠️ Tourist volume API returned ${response.status}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.volume && Array.isArray(result.volume)) {
            const chart = chartInstances['touristVolumeChart'];
            if (chart) {
                chart.data.labels = result.volume.map(v => v.period);
                chart.data.datasets[0].data = result.volume.map(v => v.tourists || 0);
                chart.update();
            }
        }
    } catch (error) {
        console.error('Error loading tourist volume data:', error);
    }
}

async function loadAvgBookingValueData() {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping avg booking value...');
        return;
    }
    
    try {
        const yearSelect = document.getElementById('avgBookingValueYearFilter');
        const monthSelect = document.getElementById('avgBookingValueMonthFilter');
        const year = yearSelect ? yearSelect.value : '2025';
        const month = monthSelect ? monthSelect.value : 'all';
        
        let url = `${window.API_URL}/api/analytics/avg-booking-value?group_by=month`;
        if (month !== 'all') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthNum = monthNames.indexOf(month) + 1;
            if (monthNum > 0) {
                const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
                const endDate = `${year}-${String(monthNum).padStart(2, '0')}-31`;
                url += `&start_date=${startDate}&end_date=${endDate}`;
            }
        } else {
            // Filter by year - show all months in the selected year
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            url += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`⚠️ Avg booking value API returned ${response.status}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.avgValues && Array.isArray(result.avgValues)) {
            const chart = chartInstances['avgBookingValueChart'];
            if (chart) {
                chart.data.labels = result.avgValues.map(v => v.period);
                chart.data.datasets[0].data = result.avgValues.map(v => v.average || 0);
                chart.update();
            }
        }
    } catch (error) {
        console.error('Error loading average booking value data:', error);
    }
}

async function loadPeakBookingDaysData() {
    try {
        const response = await fetch(`${window.API_URL}/api/analytics/peak-booking-days`);
        
        if (!response.ok) {
            console.warn(`⚠️ Peak booking days API returned ${response.status}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.peakDays && Array.isArray(result.peakDays)) {
            const chart = chartInstances['peakBookingDaysChart'];
            if (chart) {
                const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayData = new Array(7).fill(0);
                
                result.peakDays.forEach(day => {
                    const index = dayOrder.indexOf(day.day);
                    if (index !== -1) {
                        dayData[index] = day.bookings || 0;
                    }
                });
                
                chart.data.datasets[0].data = dayData;
                chart.update();
            }
        }
    } catch (error) {
        console.error('Error loading peak booking days data:', error);
    }
}

async function loadServicePerformanceData() {
    try {
        const response = await fetch(`${window.API_URL}/api/analytics/service-performance`);
        
        if (!response.ok) {
            console.warn(`⚠️ Service performance API returned ${response.status}`);
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.services) {
            const chart = chartInstances['servicePerformanceChart'];
            if (chart) {
                const labels = [];
                const data = [];
                
                // Add tour types
                if (result.services.tours && typeof result.services.tours === 'object') {
                    Object.keys(result.services.tours).forEach(tourType => {
                        labels.push(`Tour: ${tourType}`);
                        data.push(result.services.tours[tourType]);
                    });
                }
                
                // Add vehicles
                if (result.services.vehicles > 0) {
                    labels.push('Vehicle Rental');
                    data.push(result.services.vehicles);
                }
                
                // Add diving types
                if (result.services.diving && typeof result.services.diving === 'object') {
                    Object.keys(result.services.diving).forEach(divingType => {
                        labels.push(`Diving: ${divingType}`);
                        data.push(result.services.diving[divingType]);
                    });
                }
                
                // Add van rentals
                if (result.services.van_rentals > 0) {
                    labels.push('Van Rental');
                    data.push(result.services.van_rentals);
                }
                
                chart.data.labels = labels;
                chart.data.datasets[0].data = data;
                chart.update();
            }
        }
    } catch (error) {
        console.error('Error loading service performance data:', error);
    }
}

async function loadVanDestinationsData() {
    try {
        console.log('🔄 Loading van destinations data...');
        const response = await fetch(`${window.API_URL}/api/analytics/van-destinations`);
        
        if (!response.ok) {
            console.warn(`⚠️ Van destinations API returned ${response.status}`);
            const chartWithin = chartInstances['vanDestinationsWithinChart'];
            const chartOutside = chartInstances['vanDestinationsOutsideChart'];
            if (chartWithin) {
                chartWithin.data.labels = ['No Data Available'];
                chartWithin.data.datasets[0].data = [0];
                chartWithin.update();
            }
            if (chartOutside) {
                chartOutside.data.labels = ['No Data Available'];
                chartOutside.data.datasets[0].data = [0];
                chartOutside.update();
            }
            return;
        }
        
        const result = await response.json();
        console.log('📥 Van destinations API response:', result);
        
        const chartWithin = chartInstances['vanDestinationsWithinChart'];
        const chartOutside = chartInstances['vanDestinationsOutsideChart'];
        
        if (!chartWithin || !chartOutside) {
            console.error('❌ Van destinations chart instances not found');
            return;
        }
        
        if (result.success) {
            console.log('📊 Response data:', {
                withinCount: result.within?.length || 0,
                outsideCount: result.outside?.length || 0,
                within: result.within,
                outside: result.outside
            });
            
            // Handle Within Puerto Galera chart
            if (result.within && Array.isArray(result.within) && result.within.length > 0) {
                chartWithin.data.labels = result.within.map(d => d.destination || 'Unknown');
                chartWithin.data.datasets[0].data = result.within.map(d => d.bookings || 0);
                console.log('✅ Within Puerto Galera data loaded:', result.within.length, 'destinations');
            } else {
                console.log('ℹ️ No within Puerto Galera destinations data available. Result:', result.within);
                chartWithin.data.labels = ['No Data Available'];
                chartWithin.data.datasets[0].data = [0];
            }
            chartWithin.update();
            
            // Handle Outside Puerto Galera chart
            if (result.outside && Array.isArray(result.outside) && result.outside.length > 0) {
                chartOutside.data.labels = result.outside.map(d => d.destination || 'Unknown');
                chartOutside.data.datasets[0].data = result.outside.map(d => d.bookings || 0);
                console.log('✅ Outside Puerto Galera data loaded:', result.outside.length, 'destinations');
            } else {
                console.log('ℹ️ No outside Puerto Galera destinations data available. Result:', result.outside);
                chartOutside.data.labels = ['No Data Available'];
                chartOutside.data.datasets[0].data = [0];
            }
            chartOutside.update();
        } else {
            console.warn('⚠️ Invalid response structure:', result);
            if (result.message) {
                console.warn('📋 API message:', result.message);
            }
            chartWithin.data.labels = ['No Data Available'];
            chartWithin.data.datasets[0].data = [0];
            chartWithin.update();
            chartOutside.data.labels = ['No Data Available'];
            chartOutside.data.datasets[0].data = [0];
            chartOutside.update();
        }
    } catch (error) {
        console.error('❌ Error loading van destinations data:', error);
        const chartWithin = chartInstances['vanDestinationsWithinChart'];
        const chartOutside = chartInstances['vanDestinationsOutsideChart'];
        if (chartWithin) {
            chartWithin.data.labels = ['Error Loading Data'];
            chartWithin.data.datasets[0].data = [0];
            chartWithin.update();
        }
        if (chartOutside) {
            chartOutside.data.labels = ['Error Loading Data'];
            chartOutside.data.datasets[0].data = [0];
            chartOutside.update();
        }
    }
}

// Load feedback from API
async function loadFeedback() {
    const feedbackContainer = document.getElementById('feedback-container');
    if (!feedbackContainer) return;
    
    // Show loading state
    feedbackContainer.innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
            <p>Loading feedback...</p>
        </div>
    `;
    
    try {
        // Fetch feedback from API
        const response = await fetch(`${window.API_URL}/api/feedback`);
        const result = await response.json();
        
        // Clear existing feedback items
        feedbackContainer.innerHTML = '';
        
        if (!result.success || !result.feedback || result.feedback.length === 0) {
            feedbackContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No feedback messages yet.</p>
                </div>
            `;
            return;
        }
        
        // Convert Supabase feedback to the format expected by createFeedbackItem
        result.feedback.forEach((feedback) => {
            const formattedFeedback = {
                name: feedback.anonymous_name,
                message: feedback.message,
                date: new Date(feedback.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                timestamp: feedback.feedback_id
            };
            
            const feedbackItem = createFeedbackItem(formattedFeedback);
            feedbackContainer.insertAdjacentHTML('beforeend', feedbackItem);
        });
        
        // Attach event listeners
        attachFeedbackListeners();
        
    } catch (error) {
        console.error('Error loading feedback:', error);
        feedbackContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Failed to load feedback. Please try again later.</p>
            </div>
        `;
    }
}

// Create feedback item HTML
function createFeedbackItem(feedback) {
    return `
        <div class="feedback-item" data-timestamp="${feedback.timestamp}">
            <div class="feedback-header">
                <div class="feedback-info">
                    <span class="feedback-name">${feedback.name}</span>
                    <span class="feedback-date">${feedback.date}</span>
                </div>
            </div>
            <div class="feedback-message">
                ${feedback.message}
            </div>
            <div class="feedback-actions">
                <button class="btn btn-sm btn-outline-danger delete-feedback">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        </div>
    `;
}

// Attach event listeners to feedback items
function attachFeedbackListeners() {
    // Delete feedback
    document.querySelectorAll('.delete-feedback').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this feedback?')) {
                const feedbackItem = this.closest('.feedback-item');
                const timestamp = feedbackItem.dataset.timestamp;
                deleteFeedback(timestamp);
            }
        });
    });
}

// Delete feedback
async function deleteFeedback(timestamp) {
    if (!timestamp) {
        console.error('No feedback ID provided for deletion');
        alert('Error: No feedback ID provided. Please try again.');
        return;
    }
    
    try {
        const url = `${window.API_URL}/api/feedback/${timestamp}`;
        console.log('Deleting feedback:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete request failed:', response.status, errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (result.success) {
            // Show success message
            alert('Feedback deleted successfully');
            // Reload feedback to show updated list
            loadFeedback();
        } else {
            console.error('Failed to delete feedback:', result.message);
            alert(`Failed to delete feedback: ${result.message || 'Please try again.'}`);
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        alert(`Failed to delete feedback: ${error.message || 'Please try again later.'}`);
    }
}

// ============================================
// ANALYTICS CHARTS AND VISUALIZATIONS
// ============================================

// Export detailed report
function exportDetailedReport() {
    showNotification('Report export feature currently unavailable', 'info');
}
