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
      showErrorModal('Access Denied', 'Owner access required.').then(() => {
        window.location.href = 'login.html';
      });
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

// Helper function to generate grayscale colors for charts
function generateGrayscaleColors(count, startLightness = 240, endLightness = 96) {
  const colors = [];
  const rgbaColors = [];
  const step = (startLightness - endLightness) / Math.max(count - 1, 1);
  
  for (let i = 0; i < count; i++) {
    const lightness = Math.round(startLightness - (step * i));
    // Convert to hex
    const hex = '#' + lightness.toString(16).padStart(2, '0').repeat(3);
    colors.push(hex);
    // Also create rgba version with opacity
    rgbaColors.push(`rgba(${lightness}, ${lightness}, ${lightness}, 0.8)`);
  }
  
  return { hex: colors, rgba: rgbaColors };
}

// Predefined red monochrome arrays for common use cases
const grayscalePalette = {
  // For 10+ segments (light to dark red)
  extended: ['#ffcccc', '#ffb3b3', '#ff9999', '#ff8080', '#ff6666', 
             '#ff4d4d', '#ff3333', '#ff1a1a', '#ff0000', '#e60000',
             '#cc0000', '#b30000', '#990000'],
  // For 2 series
  twoSeries: {
    light: 'rgba(255, 153, 153, 0.8)',
    dark: 'rgba(204, 0, 0, 0.8)',
    lightBorder: 'rgba(255, 153, 153, 1)',
    darkBorder: 'rgba(204, 0, 0, 1)'
  },
  // For single series
  single: {
    color: '#dc3545',
    rgba: 'rgba(220, 53, 69, 1)',
    background: 'rgba(220, 53, 69, 0.1)'
  },
  // For medium single series (lines)
  medium: {
    color: '#ff0000',
    rgba: 'rgba(255, 0, 0, 1)',
    background: 'rgba(255, 0, 0, 0.1)'
  }
};

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
      const seasonalResponse = await fetch(`${window.API_URL}/api/analytics/seasonal-prediction`);
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
    
    // Add AI Insights button after charts are initialized
    setTimeout(() => {
      addAIIntepretationButton();
    }, 500); // Small delay to ensure DOM is fully ready
    
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
    createSeasonalPredictionBookingsChart();
    createSeasonalPredictionRevenueChart();
    // New analytics charts
    createBookingTypeChart();
    createPackageDistributionChart();
    createTourDistributionChart();
    createTouristVolumeChart();
    createAvgBookingValueChart();
    createPeakBookingDaysChart();
    createServicePerformanceChart();
}

// Initialize filter dropdowns
function initializeFilters() {
    const months = Object.keys(weeklyData);
    
    // Populate all month filters
    const monthFilters = [
        'bookingTypeMonthFilter',
        'packageDistributionMonthFilter',
        'tourDistributionMonthFilter',
        'touristVolumeMonthFilter',
        'avgBookingValueMonthFilter'
    ];
    
    // Populate all year filters
    const yearFilters = [
        'bookingTypeYearFilter',
        'packageDistributionYearFilter',
        'tourDistributionYearFilter',
        'touristVolumeYearFilter',
        'avgBookingValueYearFilter'
    ];
    
    // Define all 12 months
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Define years from 2019 to 2025
    const allYears = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    
    // Populate year filters
    yearFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            // Clear existing options
            select.innerHTML = '';
            
            // Add "All Years" option first
            const defaultOption = document.createElement('option');
            defaultOption.value = 'all';
            defaultOption.textContent = 'All Years';
            defaultOption.selected = true;
            select.appendChild(defaultOption);
            
            // Add all years
            allYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            });
            
            // Remove any existing event listeners by cloning (this removes all listeners)
            const newSelect = select.cloneNode(true);
            select.parentNode.replaceChild(newSelect, select);
            
            // Add change event listener to the new select element
            newSelect.addEventListener('change', (e) => handleYearFilter(e, filterId));
        }
    });
    
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
    const weekFilters = [];
    
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
    const baseId = filterId.replace('YearFilter', '');
    const monthFilterId = baseId + 'MonthFilter';
    const monthSelect = document.getElementById(monthFilterId);
    const month = monthSelect ? monthSelect.value : 'all';
    
    // Update the corresponding chart
    updateChart(monthFilterId, month, 'all', year);
}

// Handle month filter change
function handleMonthFilter(event, filterId) {
    const month = event.target.value;
    const weekFilterId = filterId.replace('MonthFilter', 'WeekFilter');
    const weekSelect = document.getElementById(weekFilterId);
    
    // Get year filter value
    const baseId = filterId.replace('MonthFilter', '');
    const yearFilterId = baseId + 'YearFilter';
    const yearSelect = document.getElementById(yearFilterId);
    const year = yearSelect ? yearSelect.value : 'all';
    
    // Clear week filter only if it exists
    if (weekSelect) {
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
    }
    
    // Update the corresponding chart
    updateChart(filterId, month, 'all', year);
}

// Handle week filter change
function handleWeekFilter(event, filterId) {
    const week = event.target.value;
    const monthFilterId = filterId.replace('WeekFilter', 'MonthFilter');
    const monthSelect = document.getElementById(monthFilterId);
    const month = monthSelect.value;
    
    // Update the corresponding chart
    updateChart(monthFilterId, month, week);
}

// Update chart based on filters
function updateChart(monthFilterId, month, week, year) {
    let chartKey = '';
    
    if (monthFilterId.includes('bookingType')) {
        loadBookingTypeData(month, year);
    } else if (monthFilterId.includes('packageDistribution')) {
        loadPackageDistributionData(month, year);
    } else if (monthFilterId.includes('tourDistribution')) {
        loadTourDistributionData(month, year);
    } else if (monthFilterId.includes('touristVolume')) {
        loadTouristVolumeData(month, year);
    } else if (monthFilterId.includes('avgBookingValue')) {
        loadAvgBookingValueData(month, year);
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
                borderColor: '#cc0000',
                backgroundColor: 'rgba(204, 0, 0, 0.1)',
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
                borderColor: '#ff0000',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
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
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
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
                    '#ffcccc', '#ffb3b3', '#ff9999', '#ff8080',
                    '#ff6666', '#ff4d4d', '#ff3333', '#ff1a1a',
                    '#ff0000', '#e60000'
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
                    '#ffcccc', '#ffb3b3', '#ff9999', '#ff8080',
                    '#ff6666', '#ff4d4d', '#ff3333', '#ff1a1a',
                    '#ff0000', '#e60000'
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
                    borderColor: '#cc0000',
                    backgroundColor: 'rgba(204, 0, 0, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue (₱K)',
                    data: analyticsData.monthlyRevenue.map(d => d.revenue / 1000),
                    borderColor: '#ff0000',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
                    backgroundColor: '#ff6666'
                },
                {
                    label: 'Low Season',
                    data: [34, 45, 23, 67, 56, 78],
                    backgroundColor: '#ff0000'
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
                backgroundColor: '#ff6666'
            }, {
                label: 'Rainy Days',
                data: [{x: 18, y: 67}, {x: 15, y: 54}, {x: 12, y: 62}],
                backgroundColor: '#ff0000'
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

// Seasonal Prediction Chart - Bookings (Bar Chart)
async function createSeasonalPredictionBookingsChart() {
  const canvas = document.getElementById('seasonalPredictionBookingsChart');
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
      if (chartInstances['seasonalPredictionBookingsChart']) {
        chartInstances['seasonalPredictionBookingsChart'].destroy();
        chartInstances['seasonalPredictionBookingsChart'] = null;
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
    
    // Color code based on season classification (red monochrome)
    const backgroundColors = months.map(m => {
      const percentage = (m.predicted_bookings / seasonalData.average_monthly_bookings) * 100;
      if (percentage >= 125) return 'rgba(153, 0, 0, 0.7)'; // Peak - Dark red
      if (percentage <= 75) return 'rgba(255, 153, 153, 0.7)'; // Low - Light red
      return 'rgba(255, 0, 0, 0.7)'; // Moderate - Medium red
    });
    
    if (chartInstances['seasonalPredictionBookingsChart']) {
      chartInstances['seasonalPredictionBookingsChart'].destroy();
    }
    
    chartInstances['seasonalPredictionBookingsChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Predicted Bookings',
            data: predictedBookings,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 2
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
                return `Predicted Bookings: ${Math.round(context.parsed.y)} bookings`;
              },
              afterLabel: (context) => {
                const monthData = months[context.dataIndex];
                if (monthData) {
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
    console.error('❌ Failed to create seasonal prediction bookings chart:', error);
    if (chartInstances['seasonalPredictionBookingsChart']) {
      chartInstances['seasonalPredictionBookingsChart'].destroy();
      chartInstances['seasonalPredictionBookingsChart'] = null;
    }
    if (statusEl) {
      statusEl.textContent = 'Unable to generate seasonal forecast. Please try again later.';
      statusEl.className = 'small text-danger mb-2';
    }
  }
}

// Seasonal Prediction Chart - Revenue (Line Chart)
async function createSeasonalPredictionRevenueChart() {
  const canvas = document.getElementById('seasonalPredictionRevenueChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  try {
    const seasonalData = analyticsData.seasonal_prediction;
    
    if (!seasonalData || !seasonalData.has_sufficient_data) {
      if (chartInstances['seasonalPredictionRevenueChart']) {
        chartInstances['seasonalPredictionRevenueChart'].destroy();
        chartInstances['seasonalPredictionRevenueChart'] = null;
      }
      return;
    }
    
    const months = seasonalData.months || [];
    const labels = months.map(m => m.month_name);
    const predictedRevenue = months.map(m => m.predicted_revenue / 1000); // Convert to thousands
    
    if (chartInstances['seasonalPredictionRevenueChart']) {
      chartInstances['seasonalPredictionRevenueChart'].destroy();
    }
    
    chartInstances['seasonalPredictionRevenueChart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Predicted Revenue (₱K)',
            data: predictedRevenue,
            borderColor: '#ff0000',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4
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
              text: 'Revenue (₱K)'
            },
            beginAtZero: true
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
                return `Predicted Revenue (₱K): ₱${context.parsed.y.toFixed(1)}K`;
              }
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to create seasonal prediction revenue chart:', error);
    if (chartInstances['seasonalPredictionRevenueChart']) {
      chartInstances['seasonalPredictionRevenueChart'].destroy();
      chartInstances['seasonalPredictionRevenueChart'] = null;
    }
  }
}

// Load seasonal prediction data for all historical data
async function loadSeasonalPredictionData() {
  try {
    const seasonalResponse = await fetch(`${window.API_URL}/api/analytics/seasonal-prediction`);
    const seasonalResult = await seasonalResponse.json();
    if (seasonalResponse.ok && seasonalResult.success) {
      analyticsData.seasonal_prediction = seasonalResult.data;
      createSeasonalPredictionBookingsChart();
      createSeasonalPredictionRevenueChart();
    }
  } catch (error) {
    console.error('Failed to load seasonal prediction:', error);
  }
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
  localStorage.removeItem('userSession');
  window.location.href = '../user/home/home.html';
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
                    borderColor: 'rgba(255, 204, 204, 1)',
                    backgroundColor: 'rgba(255, 204, 204, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Island Hopping',
                    data: [25, 28, 30, 22, 18, 16, 20, 24, 27, 29, 32, 35],
                    borderColor: 'rgba(255, 179, 179, 1)',
                    backgroundColor: 'rgba(255, 179, 179, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Inland Tour',
                    data: [18, 20, 22, 16, 13, 11, 14, 16, 18, 20, 22, 24],
                    borderColor: 'rgba(255, 128, 128, 1)',
                    backgroundColor: 'rgba(255, 128, 128, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Vehicle Rental',
                    data: [15, 16, 18, 12, 10, 8, 11, 13, 15, 16, 18, 20],
                    borderColor: 'rgba(255, 77, 77, 1)',
                    backgroundColor: 'rgba(255, 77, 77, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Hotels',
                    data: [32, 35, 38, 28, 24, 20, 25, 29, 33, 36, 40, 45],
                    borderColor: 'rgba(255, 26, 26, 1)',
                    backgroundColor: 'rgba(255, 26, 26, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Diving',
                    data: [10, 12, 14, 9, 7, 6, 8, 10, 12, 13, 15, 17],
                    borderColor: 'rgba(204, 0, 0, 1)',
                    backgroundColor: 'rgba(204, 0, 0, 1)',
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
                    borderColor: 'rgba(255, 204, 204, 1)',
                    backgroundColor: 'rgba(255, 204, 204, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Package 2',
                    data: [25, 28, 30, 22, 18, 16, 20, 24, 27, 29, 32, 35],
                    borderColor: 'rgba(255, 128, 128, 1)',
                    backgroundColor: 'rgba(255, 128, 128, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Package 3',
                    data: [18, 20, 22, 16, 13, 11, 14, 16, 18, 20, 22, 24],
                    borderColor: 'rgba(255, 26, 26, 1)',
                    backgroundColor: 'rgba(255, 26, 26, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Package 4',
                    data: [15, 16, 18, 12, 10, 8, 11, 13, 15, 16, 18, 20],
                    borderColor: 'rgba(179, 0, 0, 1)',
                    backgroundColor: 'rgba(179, 0, 0, 1)',
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
                    'rgba(255, 204, 204, 0.8)',
                    'rgba(255, 179, 179, 0.8)',
                    'rgba(255, 153, 153, 0.8)',
                    'rgba(255, 128, 128, 0.8)',
                    'rgba(255, 102, 102, 0.8)',
                    'rgba(255, 77, 77, 0.8)',
                    'rgba(255, 51, 51, 0.8)',
                    'rgba(255, 26, 26, 0.8)',
                    'rgba(255, 0, 0, 0.8)',
                    'rgba(230, 0, 0, 0.8)',
                    'rgba(204, 0, 0, 0.8)',
                    'rgba(179, 0, 0, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 204, 204, 1)',
                    'rgba(255, 179, 179, 1)',
                    'rgba(255, 153, 153, 1)',
                    'rgba(255, 128, 128, 1)',
                    'rgba(255, 102, 102, 1)',
                    'rgba(255, 77, 77, 1)',
                    'rgba(255, 51, 51, 1)',
                    'rgba(255, 26, 26, 1)',
                    'rgba(255, 0, 0, 1)',
                    'rgba(230, 0, 0, 1)',
                    'rgba(204, 0, 0, 1)',
                    'rgba(179, 0, 0, 1)'
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
                    '#ffcccc',
                    '#ff9999',
                    '#ff6666',
                    '#ff3333',
                    '#cc0000'
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
                    backgroundColor: 'rgba(255, 153, 153, 0.8)',
                    borderColor: 'rgba(255, 153, 153, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Tour Only',
                    data: [],
                    backgroundColor: 'rgba(204, 0, 0, 0.8)',
                    borderColor: 'rgba(204, 0, 0, 1)',
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

// Create Package Distribution Chart
function createPackageDistributionChart() {
    const ctx = document.getElementById('packageDistributionChart');
    if (!ctx) return;
    
    chartInstances['packageDistributionChart'] = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Package 1', 'Package 2', 'Package 3', 'Package 4'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 204, 204, 0.8)',
                    'rgba(255, 128, 128, 0.8)',
                    'rgba(255, 26, 26, 0.8)',
                    'rgba(179, 0, 0, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 204, 204, 1)',
                    'rgba(255, 128, 128, 1)',
                    'rgba(255, 26, 26, 1)',
                    'rgba(179, 0, 0, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
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
    });
    
    // Load data from API
    loadPackageDistributionData();
}

// Create Tour Distribution Chart
function createTourDistributionChart() {
    const ctx = document.getElementById('tourDistributionChart');
    if (!ctx) return;
    
    chartInstances['tourDistributionChart'] = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Island Hopping', 'Inland Tour', 'Snorkeling Tour'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(255, 128, 128, 0.8)',
                    'rgba(255, 51, 51, 0.8)',
                    'rgba(204, 0, 0, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 128, 128, 1)',
                    'rgba(255, 51, 51, 1)',
                    'rgba(204, 0, 0, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
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
    });
    
    // Load data from API
    loadTourDistributionData();
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
                borderColor: '#ff0000',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
                    'rgba(255, 204, 204, 0.8)',
                    'rgba(255, 179, 179, 0.8)',
                    'rgba(255, 153, 153, 0.8)',
                    'rgba(255, 128, 128, 0.8)',
                    'rgba(255, 77, 77, 0.8)',
                    'rgba(255, 26, 26, 0.8)',
                    'rgba(204, 0, 0, 0.8)'
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
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                borderColor: 'rgba(255, 0, 0, 1)',
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

// Helper function to format period labels based on year selection
function formatPeriodLabel(period, year) {
    const parts = period.split('-');
    if (parts.length === 2) {
        // Monthly format: YYYY-MM
        if (year === 'all') {
            // Show full date format when viewing all years
            return period;
        } else {
            // Show only month name when specific year is selected
            const monthNum = parseInt(parts[1], 10);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (monthNum >= 1 && monthNum <= 12) {
                return monthNames[monthNum - 1];
            }
            return period;
        }
    } else if (parts.length === 3 && period.includes('W')) {
        // Weekly format: YYYY-Www (e.g., 2025-W20)
        return period;
    }
    return period;
}

async function loadBookingTypeData(month = 'all', year = 'all') {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping booking type...');
        return;
    }
    
    try {
        // Build URL with filters
        let url = `${window.API_URL}/api/analytics/booking-type-comparison?group_by=month`;
        
        // Add date filters based on year and month selection
        if (year !== 'all' && month !== 'all') {
            // Specific year and month - get data for that specific month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            url += `&start_date=${year}-${monthStr}-01&end_date=${year}-${monthStr}-31`;
        } else if (year !== 'all') {
            // Specific year, all months - get data for entire year
            url += `&start_date=${year}-01-01&end_date=${year}-12-31`;
        } else if (month !== 'all') {
            // All years, specific month - get data for that month across all years
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            // Get data for this month from 2019-2025
            url += `&start_date=2019-${monthStr}-01&end_date=2025-${monthStr}-31`;
        }
        // If both are 'all', fetch all historical data (no date filters)
        
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
                // Format labels based on year selection
                const labels = result.comparison.map(c => formatPeriodLabel(c.period, year));
                
                chart.data.labels = labels;
                chart.data.datasets[0].data = result.comparison.map(c => c.package_only || 0);
                chart.data.datasets[1].data = result.comparison.map(c => c.tour_only || 0);
                chart.update();
                console.log('✅ Booking Type chart updated:', labels.length, 'data points');
                // Generate AI insights for this chart
                generateChartInsights('bookingTypeChart');
            } else if (chart) {
                // No data available
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.data.datasets[1].data = [];
                chart.update();
                console.log('⚠️ No booking type data available');
                generateChartInsights('bookingTypeChart');
            }
        } else {
            console.log('⚠️ Invalid booking type response:', result);
            generateChartInsights('bookingTypeChart');
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
        generateChartInsights('bookingTypeChart');
    }
}

async function loadPackageDistributionData(month = 'all', year = 'all') {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping package distribution...');
        return;
    }
    
    try {
        // Build URL with filters
        let url = `${window.API_URL}/api/analytics/package-distribution?`;
        const params = [];
        
        // Add date filters based on year and month selection
        if (year !== 'all' && month !== 'all') {
            // Specific year and month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            params.push(`start_date=${year}-${monthStr}-01`);
            params.push(`end_date=${year}-${monthStr}-31`);
        } else if (year !== 'all') {
            // Specific year, all months
            params.push(`start_date=${year}-01-01`);
            params.push(`end_date=${year}-12-31`);
        } else if (month !== 'all') {
            // All years, specific month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            params.push(`start_date=2019-${monthStr}-01`);
            params.push(`end_date=2025-${monthStr}-31`);
        }
        
        url += params.join('&');
        const response = await fetch(url);
        
        // Handle non-200 responses gracefully
        if (!response.ok) {
            console.warn(`⚠️ Package distribution API returned ${response.status}`);
            const chart = chartInstances['packageDistributionChart'];
            if (chart) {
                chart.data.datasets[0].data = [0, 0, 0, 0];
                chart.update();
            }
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.distribution) {
            const chart = chartInstances['packageDistributionChart'];
            if (chart) {
                const dist = result.distribution;
                chart.data.datasets[0].data = [
                    dist.package1 || 0,
                    dist.package2 || 0,
                    dist.package3 || 0,
                    dist.package4 || 0
                ];
                chart.update();
                console.log('✅ Package Distribution chart updated');
                generateChartInsights('packageDistributionChart');
            }
        } else {
            console.log('⚠️ Invalid package distribution response:', result);
            const chart = chartInstances['packageDistributionChart'];
            if (chart) {
                chart.data.datasets[0].data = [0, 0, 0, 0];
                chart.update();
            }
            generateChartInsights('packageDistributionChart');
        }
    } catch (error) {
        console.error('Error loading package distribution data:', error);
        // Clear chart on error
        const chart = chartInstances['packageDistributionChart'];
        if (chart) {
            chart.data.datasets[0].data = [0, 0, 0, 0];
            chart.update();
        }
        generateChartInsights('packageDistributionChart');
    }
}

async function loadTourDistributionData(month = 'all', year = 'all') {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping tour distribution...');
        return;
    }
    
    try {
        // Build URL with filters
        let url = `${window.API_URL}/api/analytics/tour-distribution?`;
        const params = [];
        
        // Add date filters based on year and month selection
        if (year !== 'all' && month !== 'all') {
            // Specific year and month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            params.push(`start_date=${year}-${monthStr}-01`);
            params.push(`end_date=${year}-${monthStr}-31`);
        } else if (year !== 'all') {
            // Specific year, all months
            params.push(`start_date=${year}-01-01`);
            params.push(`end_date=${year}-12-31`);
        } else if (month !== 'all') {
            // All years, specific month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            params.push(`start_date=2019-${monthStr}-01`);
            params.push(`end_date=2025-${monthStr}-31`);
        }
        
        url += params.join('&');
        const response = await fetch(url);
        
        // Handle non-200 responses gracefully
        if (!response.ok) {
            console.warn(`⚠️ Tour distribution API returned ${response.status}`);
            const chart = chartInstances['tourDistributionChart'];
            if (chart) {
                chart.data.datasets[0].data = [0, 0, 0];
                chart.update();
            }
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.distribution) {
            const chart = chartInstances['tourDistributionChart'];
            if (chart) {
                const dist = result.distribution;
                chart.data.datasets[0].data = [
                    dist.islandHopping || 0,
                    dist.inlandTour || 0,
                    dist.snorkelingTour || 0
                ];
                chart.update();
                console.log('✅ Tour Distribution chart updated');
                generateChartInsights('tourDistributionChart');
            }
        } else {
            console.log('⚠️ Invalid tour distribution response:', result);
            const chart = chartInstances['tourDistributionChart'];
            if (chart) {
                chart.data.datasets[0].data = [0, 0, 0];
                chart.update();
            }
            generateChartInsights('tourDistributionChart');
        }
    } catch (error) {
        console.error('Error loading tour distribution data:', error);
        // Clear chart on error
        const chart = chartInstances['tourDistributionChart'];
        if (chart) {
            chart.data.datasets[0].data = [0, 0, 0];
            chart.update();
        }
        generateChartInsights('tourDistributionChart');
    }
}

async function loadTouristVolumeData(month = 'all', year = 'all') {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping tourist volume...');
        return;
    }
    
    try {
        // Build URL with filters
        let url = `${window.API_URL}/api/analytics/tourist-volume?group_by=month`;
        
        // Add date filters based on year and month selection
        if (year !== 'all' && month !== 'all') {
            // Specific year and month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            url += `&start_date=${year}-${monthStr}-01&end_date=${year}-${monthStr}-31`;
        } else if (year !== 'all') {
            // Specific year, all months
            url += `&start_date=${year}-01-01&end_date=${year}-12-31`;
        } else if (month !== 'all') {
            // All years, specific month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            url += `&start_date=2019-${monthStr}-01&end_date=2025-${monthStr}-31`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`⚠️ Tourist volume API returned ${response.status}`);
            generateChartInsights('touristVolumeChart');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.volume && Array.isArray(result.volume)) {
            const chart = chartInstances['touristVolumeChart'];
            if (chart && result.volume.length > 0) {
                // Format labels based on year selection
                const labels = result.volume.map(v => formatPeriodLabel(v.period, year));
                
                chart.data.labels = labels;
                chart.data.datasets[0].data = result.volume.map(v => v.tourists || 0);
                chart.update();
                console.log('✅ Tourist Volume chart updated:', labels.length, 'data points');
                generateChartInsights('touristVolumeChart');
            } else if (chart) {
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.update();
                console.log('⚠️ No tourist volume data available');
                generateChartInsights('touristVolumeChart');
            }
        } else {
            console.log('⚠️ Invalid tourist volume response:', result);
            generateChartInsights('touristVolumeChart');
        }
    } catch (error) {
        console.error('Error loading tourist volume data:', error);
        generateChartInsights('touristVolumeChart');
    }
}

async function loadAvgBookingValueData(month = 'all', year = 'all') {
    // Prevent multiple simultaneous loads
    if (isLoadingChartData) {
        console.log('⏸️ Chart data already loading, skipping avg booking value...');
        return;
    }
    
    try {
        // Build URL with filters
        let url = `${window.API_URL}/api/analytics/avg-booking-value?group_by=month`;
        
        // Add date filters based on year and month selection
        if (year !== 'all' && month !== 'all') {
            // Specific year and month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            url += `&start_date=${year}-${monthStr}-01&end_date=${year}-${monthStr}-31`;
        } else if (year !== 'all') {
            // Specific year, all months
            url += `&start_date=${year}-01-01&end_date=${year}-12-31`;
        } else if (month !== 'all') {
            // All years, specific month
            const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
            const monthStr = monthNum.toString().padStart(2, '0');
            url += `&start_date=2019-${monthStr}-01&end_date=2025-${monthStr}-31`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`⚠️ Avg booking value API returned ${response.status}`);
            generateChartInsights('avgBookingValueChart');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.avgValues && Array.isArray(result.avgValues)) {
            const chart = chartInstances['avgBookingValueChart'];
            if (chart && result.avgValues.length > 0) {
                // Format labels based on year selection
                const labels = result.avgValues.map(v => formatPeriodLabel(v.period, year));
                
                chart.data.labels = labels;
                chart.data.datasets[0].data = result.avgValues.map(v => v.average || 0);
                chart.update();
                console.log('✅ Average Booking Value chart updated:', labels.length, 'data points');
                generateChartInsights('avgBookingValueChart');
            } else if (chart) {
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.update();
                console.log('⚠️ No average booking value data available');
                generateChartInsights('avgBookingValueChart');
            }
        } else {
            console.log('⚠️ Invalid average booking value response:', result);
            generateChartInsights('avgBookingValueChart');
        }
    } catch (error) {
        console.error('Error loading average booking value data:', error);
        generateChartInsights('avgBookingValueChart');
    }
}

async function loadPeakBookingDaysData() {
    try {
        const response = await fetch(`${window.API_URL}/api/analytics/peak-booking-days`);
        
        if (!response.ok) {
            console.warn(`⚠️ Peak booking days API returned ${response.status}`);
            generateChartInsights('peakBookingDaysChart');
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
                generateChartInsights('peakBookingDaysChart');
            }
        }
    } catch (error) {
        console.error('Error loading peak booking days data:', error);
        generateChartInsights('peakBookingDaysChart');
    }
}

async function loadServicePerformanceData() {
    try {
        const response = await fetch(`${window.API_URL}/api/analytics/service-performance`);
        
        if (!response.ok) {
            console.warn(`⚠️ Service performance API returned ${response.status}`);
            generateChartInsights('servicePerformanceChart');
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
                generateChartInsights('servicePerformanceChart');
            }
        }
    } catch (error) {
        console.error('Error loading service performance data:', error);
        generateChartInsights('servicePerformanceChart');
    }
}

// ============================================
// ANALYTICS CHARTS AND VISUALIZATIONS
// ============================================

// ============================================
// AI CHART INTERPRETATION (Google Gemini)
// ============================================

/**
 * Extract chart data from Chart.js instance for AI interpretation
 * @param {string} chartId - The ID of the chart to extract data from
 * @returns {Object|null} Chart data object or null if chart not found
 */
function extractChartData(chartId) {
  const chart = chartInstances[chartId];
  if (!chart) {
    console.warn(`Chart ${chartId} not found in chartInstances`);
    return null;
  }
  
  try {
    return {
      type: chart.config.type,
      labels: chart.data.labels || [],
      datasets: chart.data.datasets.map(ds => ({
        label: ds.label || 'Unnamed Series',
        data: ds.data || []
      }))
    };
  } catch (error) {
    console.error(`Error extracting data from chart ${chartId}:`, error);
    return null;
  }
}

// Cache last payload per chart to avoid redundant AI calls
const lastInsightsPayload = {};

// Map chart IDs to their corresponding insights container IDs
const chartInsightsElementMap = {
  bookingTypeChart: 'bookingTypeChartInsights',
  packageDistributionChart: 'packageDistributionChartInsights',
  tourDistributionChart: 'tourDistributionChartInsights',
  touristVolumeChart: 'touristVolumeChartInsights',
  avgBookingValueChart: 'avgBookingValueChartInsights',
  peakBookingDaysChart: 'peakBookingDaysChartInsights',
  servicePerformanceChart: 'servicePerformanceChartInsights'
};

/**
 * Generate and display AI insights for a specific chart in its side-card.
 * This uses the existing interpretChartWithAI helper and updates the
 * corresponding insights container with loading / success / error states.
 * @param {string} chartId
 */
async function generateChartInsights(chartId) {
  const insightsElementId = chartInsightsElementMap[chartId];
  if (!insightsElementId) {
    return;
  }

  const insightsEl = document.getElementById(insightsElementId);
  if (!insightsEl) {
    return;
  }

  // If analytics API (and thus AI) is disabled, show a friendly message
  if (window.USE_ANALYTICS_API === false) {
    insightsEl.classList.remove('text-danger');
    insightsEl.classList.add('text-muted');
    insightsEl.innerHTML = '<i class="fas fa-info-circle me-1"></i>AI insights are disabled while using sample data.';
    return;
  }

  const chartData = extractChartData(chartId);
  if (!chartData) {
    insightsEl.classList.remove('text-danger');
    insightsEl.classList.add('text-muted');
    insightsEl.innerHTML = '<i class="fas fa-info-circle me-1"></i>No chart data available to analyze.';
    return;
  }

  const hasLabels = Array.isArray(chartData.labels) && chartData.labels.length > 0;
  const hasAnyValues = Array.isArray(chartData.datasets) && chartData.datasets.some(ds =>
    Array.isArray(ds.data) && ds.data.some(v => typeof v === 'number' && v !== 0)
  );

  if (!hasLabels || !hasAnyValues) {
    insightsEl.classList.remove('text-danger');
    insightsEl.classList.add('text-muted');
    insightsEl.innerHTML = '<i class="fas fa-info-circle me-1"></i>No data available to analyze for this period.';
    return;
  }

  // Avoid repeated calls if payload hasn't changed
  const payloadKey = JSON.stringify({
    type: chartData.type,
    labels: chartData.labels,
    datasets: chartData.datasets.map(ds => ds.data)
  });

  if (lastInsightsPayload[chartId] === payloadKey) {
    // Data unchanged since last insights; skip re-calculation
    return;
  }

  lastInsightsPayload[chartId] = payloadKey;

  // Show loading state
  insightsEl.classList.remove('text-danger');
  insightsEl.classList.add('text-muted');
  insightsEl.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    Generating insights...
  `;

  const result = await interpretChartWithAI(chartId);

  if (!result.success) {
    insightsEl.classList.remove('text-muted');
    insightsEl.classList.add('text-danger');
    insightsEl.innerHTML = `
      <i class="fas fa-exclamation-triangle me-1"></i>
      Unable to load insights. ${result.error ? `(${result.error})` : 'Please try again later.'}
    `;
    return;
  }

  const paragraphs = (result.interpretation || '')
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p class="mb-2">${p}</p>`)
    .join('');

  insightsEl.classList.remove('text-danger', 'text-muted');
  insightsEl.innerHTML = `
    <div class="ai-insights-text">
      ${paragraphs}
      <p class="mt-2 small text-muted">
        <i class="fas fa-magic me-1"></i>Powered by AI insights.
      </p>
    </div>
  `;
}

/**
 * Get AI interpretation of a single chart
 * @param {string} chartId - The ID of the chart to interpret
 * @param {string} chartTitle - Optional title for the chart
 * @returns {Promise<Object>} Interpretation result with success status and interpretation text
 */
async function interpretChartWithAI(chartId, chartTitle = '') {
  const chartData = extractChartData(chartId);
  if (!chartData) {
    return { 
      success: false, 
      error: 'Chart not found or unable to extract data',
      chartId: chartId
    };
  }
  
  // Get chart title from DOM if not provided
  if (!chartTitle) {
    const canvas = document.getElementById(chartId);
    if (canvas) {
      const cardTitle = canvas.closest('.card')?.querySelector('.card-title');
      if (cardTitle) {
        chartTitle = cardTitle.textContent.trim();
      }
    }
    if (!chartTitle) {
      // Generate title from chartId
      chartTitle = chartId.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
    }
  }
  
  try {
    const response = await fetch(`${window.API_URL}/api/analytics/interpret-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        chartType: chartData.type,
        labels: chartData.labels,
        datasets: chartData.datasets,
        chartTitle: chartTitle
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to generate interpretation',
        chartId: chartId,
        chartTitle: chartTitle
      };
    }
    
    return {
      success: true,
      interpretation: data.interpretation,
      chartId: chartId,
      chartTitle: chartTitle
    };
  } catch (error) {
    console.error(`Error interpreting chart ${chartId}:`, error);
    return {
      success: false,
      error: error.message || 'Network error occurred',
      chartId: chartId,
      chartTitle: chartTitle
    };
  }
}

/**
 * Interpret all visible charts on the page
 * @returns {Promise<Object>} Object with chartId as keys and interpretation results as values
 */
async function interpretAllCharts() {
  const interpretations = {};
  
  // List of all chart IDs that might be present
  const chartIds = [
    'seasonalPredictionBookingsChart',
    'seasonalPredictionRevenueChart',
    'bookingTypeChart',
    'packageDistributionChart',
    'tourDistributionChart',
    'touristVolumeChart',
    'avgBookingValueChart',
    'peakBookingDaysChart',
    'servicePerformanceChart'
  ];
  
  // Process charts sequentially to avoid overwhelming the API
  for (const chartId of chartIds) {
    if (chartInstances[chartId]) {
      console.log(`Analyzing chart: ${chartId}`);
      interpretations[chartId] = await interpretChartWithAI(chartId);
      // Small delay between requests to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return interpretations;
}

/**
 * Display AI insights in a modal
 * @param {Object} interpretations - Object with chartId as keys and interpretation results as values
 */
function displayAIInsights(interpretations) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('aiInsightsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'aiInsightsModal';
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'aiInsightsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="aiInsightsModalLabel">
              <i class="fas fa-robot me-2"></i>AI Chart Insights
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="aiInsightsContent">
            <!-- Content will be inserted here -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  const content = document.getElementById('aiInsightsContent');
  const successfulInterpretations = Object.entries(interpretations).filter(([_, result]) => result.success);
  const failedInterpretations = Object.entries(interpretations).filter(([_, result]) => !result.success);
  
  if (successfulInterpretations.length === 0) {
    content.innerHTML = `
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>No insights available</strong>
        <p class="mb-0 mt-2">Unable to generate insights for any charts. ${failedInterpretations.length > 0 ? 'Please check your connection and try again.' : ''}</p>
      </div>
    `;
  } else {
    let html = '';
    
    successfulInterpretations.forEach(([chartId, result]) => {
      const chartTitle = result.chartTitle || chartId.replace(/([A-Z])/g, ' $1').trim();
      html += `
        <div class="mb-4 pb-3 border-bottom">
          <h6 class="text-primary mb-2">
            <i class="fas fa-chart-${result.chartId.includes('Revenue') ? 'line' : result.chartId.includes('Distribution') ? 'pie' : 'bar'} me-2"></i>
            ${chartTitle}
          </h6>
          <div class="ai-insight-text">
            ${result.interpretation.split('\n').map(para => para.trim() ? `<p>${para}</p>` : '').join('')}
          </div>
        </div>
      `;
    });
    
    if (failedInterpretations.length > 0) {
      html += `
        <div class="alert alert-info mt-3">
          <i class="fas fa-info-circle me-2"></i>
          <strong>Note:</strong> ${failedInterpretations.length} chart(s) could not be analyzed.
        </div>
      `;
    }
    
    content.innerHTML = html;
  }
  
  // Show modal using Bootstrap
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

/**
 * Handle AI insights button click
 */
async function handleGetAIInsights() {
  const button = document.getElementById('aiInterpretBtn');
  if (!button) return;
  
  // Disable button and show loading state
  const originalHTML = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing Charts...';
  
  try {
    console.log('Starting AI chart interpretation...');
    const interpretations = await interpretAllCharts();
    console.log('AI interpretation complete:', interpretations);
    
    displayAIInsights(interpretations);
  } catch (error) {
    console.error('Error getting AI insights:', error);
    
    // Show error in modal
    const errorInterpretations = { error: { success: false, error: error.message } };
    displayAIInsights(errorInterpretations);
  } finally {
    // Re-enable button
    button.disabled = false;
    button.innerHTML = originalHTML;
  }
}

/**
 * Add AI Insights button to the analytics page header
 */
function addAIIntepretationButton() {
  const header = document.querySelector('.analytics-main-content .d-flex.justify-content-between');
  if (!header) {
    console.warn('Analytics header not found');
    return;
  }
  
  const buttonContainer = header.querySelector('.d-flex.align-items-center.gap-3');
  if (!buttonContainer) {
    console.warn('Button container not found');
    return;
  }
  
  // Check if button already exists
  if (document.getElementById('aiInterpretBtn')) {
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'aiInterpretBtn';
  button.className = 'btn btn-primary';
  button.innerHTML = '<i class="fas fa-robot me-2"></i>Get AI Insights';
  button.onclick = handleGetAIInsights;
  button.title = 'Get AI-powered insights for all charts';
  
  buttonContainer.appendChild(button);
}

// Export detailed report
function exportDetailedReport() {
    showNotification('Report export feature currently unavailable', 'info');
}
