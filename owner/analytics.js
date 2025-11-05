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
window.API_URL = window.API_URL || 'http://localhost:3000';
// Toggle to use API or fallback sample data
window.USE_ANALYTICS_API = (typeof window.USE_ANALYTICS_API === 'boolean') ? window.USE_ANALYTICS_API : false;

// Dynamic analytics data - will be populated from API
let analyticsData = {};

// Load analytics data from API
async function fetchAnalyticsDataFromApi() {
    if (!window.USE_ANALYTICS_API) {
        console.warn('ℹ️ Using fallback analytics data (API disabled).');
        return false;
    }
  try {
    console.log('📊 Loading analytics data from API...');
    
    // Load revenue data
    const revenueResponse = await fetch(`${window.API_URL}/api/analytics/revenue`);
    const revenueResult = await revenueResponse.json();
    
    // Load booking counts
    const countsResponse = await fetch(`${window.API_URL}/api/analytics/bookings-count`);
    const countsResult = await countsResponse.json();
    
    // Load popular services
    const servicesResponse = await fetch(`${window.API_URL}/api/analytics/popular-services`);
    const servicesResult = await servicesResponse.json();
    
    if (!revenueResult.success || !countsResult.success || !servicesResult.success) {
      throw new Error('Failed to load analytics data');
    }
    
    // Transform API data to match the expected format
    analyticsData = {
      revenue: revenueResult.analytics,
      counts: countsResult.counts,
      services: servicesResult.services
    };
    
    console.log('✅ Analytics data loaded successfully');
    return true;
    
  } catch (error) {
    console.warn('❌ Error loading analytics data, using fallback:', error);
    
    // Fallback to empty data
    analyticsData = {
      revenue: { total_revenue: 0, total_bookings: 0, confirmed_bookings: 0 },
      counts: { total: 0, pending: 0, confirmed: 0, cancelled: 0, rescheduled: 0, completed: 0 },
      services: { tours: {}, vehicles: 0, diving: {} }
    };
    
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
    
    // Navigation functionality
    initializeNavigation();
    
    // Initialize filters
    initializeFilters();
    
    // Load data from API and populate tables
    const dataLoaded = await fetchAnalyticsDataFromApi();
    
    // Populate UI metrics and initialize charts
    populateAnalyticsUI();
    initializeCharts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load feedback from API/localStorage
    loadFeedback();
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
    
    // Function to show a specific section
    function showSection(sectionId) {
        console.log('📍 Showing section:', sectionId);
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to corresponding link
        const activeLink = document.querySelector(`.analytics-sidebar .nav-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
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
        } else {
            console.error('❌ Section not found:', sectionId);
        }
    }
    
    // Handle click events
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            showSection(sectionId);
            // Update URL hash
            window.location.hash = sectionId;
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
}

// Initialize all charts
function initializeCharts() {
    createRevenueTrendChart();
    createRevenueForecastChart();
    createDemandPredictionChart();
    createServiceDistributionChart();
    createServiceDistributionChart2();
    createBookingTrendsChart();
}

// Initialize filter dropdowns
function initializeFilters() {
    const months = Object.keys(weeklyData);
    
    // Populate all year filters
    const yearFilters = [
        'revenueTrendYearFilter',
        'bookingTrendsYearFilter',
        'tourOnlyYearFilter',
        'packageTourYearFilter',
        'revenueForecastYearFilter',
        'demandPredictionYearFilter'
    ];
    
    yearFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            // Add more years if needed
            const years = [2023, 2024, 2025, 2026];
            
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
        'revenueTrendMonthFilter',
        'bookingTrendsMonthFilter',
        'tourOnlyMonthFilter',
        'packageTourMonthFilter',
        'revenueForecastMonthFilter',
        'demandPredictionMonthFilter'
    ];
    
    monthFilters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            months.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month;
                select.appendChild(option);
            });
            
            // Add change event listener
            select.addEventListener('change', (e) => handleMonthFilter(e, filterId));
        }
    });
    
    // Add event listeners for week filters
    const weekFilters = [
        'revenueTrendWeekFilter',
        'bookingTrendsWeekFilter',
        'tourOnlyWeekFilter',
        'packageTourWeekFilter',
        'revenueForecastWeekFilter',
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
    updateChart(monthFilterId, 'all', 'all', year);
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
    
    if (monthFilterId.includes('revenueTrend')) {
        chartKey = 'revenueTrendChart';
        updateRevenueTrendChart(month, week, year);
    } else if (monthFilterId.includes('bookingTrends')) {
        chartKey = 'bookingTrendsChart';
        updateBookingTrendsChart(month, week, year);
    } else if (monthFilterId.includes('tourOnly')) {
        chartKey = 'tourOnlyChart';
        updateTourOnlyChart(month, week, year);
    } else if (monthFilterId.includes('packageTour')) {
        chartKey = 'packageTourChart';
        updatePackageTourChart(month, week, year);
    } else if (monthFilterId.includes('revenueForecast')) {
        chartKey = 'revenueForecastChart';
        updateRevenueForecastChart(month, week, year);
    } else if (monthFilterId.includes('demandPrediction')) {
        chartKey = 'demandPredictionChart';
        updateDemandPredictionChart(month, week, year);
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

// Update Revenue Forecast Chart (simple version since it's predictive)
function updateRevenueForecastChart(month, week, year) {
    const chart = chartInstances['revenueForecastChart'];
    if (!chart) return;
    
    // For forecast, we'll just show filtered historical data
    // You can enhance this with actual week-by-week forecasts
    chart.update();
}

// Update Demand Prediction Chart (simple version since it's predictive)
function updateDemandPredictionChart(month, week, year) {
    const chart = chartInstances['demandPredictionChart'];
    if (!chart) return;
    
    // For predictions, we'll keep it as is
    // You can enhance this with month/week specific predictions
    chart.update();
}

// Revenue Trend Chart
function createRevenueTrendChart() {
    const ctx = document.getElementById('revenueTrendChart').getContext('2d');
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

// Booking Status Chart
function createBookingStatusChart() {
    const ctx = document.getElementById('bookingStatusChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
            datasets: [{
                data: [65, 15, 8, 12],
                backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#6c757d'],
                borderWidth: 0
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
}

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

// Revenue Forecast Chart
function createRevenueForecastChart() {
    const ctx = document.getElementById('revenueForecastChart').getContext('2d');
    const monthlyData = analyticsData.monthlyRevenue || sampleAnalyticsData.monthlyRevenue;
    const predictions = analyticsData.predictions || sampleAnalyticsData.predictions;
    const historicalData = monthlyData.slice(-6).map(d => d.revenue);
    const forecastData = predictions.nextSixMonths.map(d => d.predicted);
    
    chartInstances['revenueForecastChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [
                ...monthlyData.slice(-6).map(d => d.month),
                ...predictions.nextSixMonths.map(d => d.month)
            ],
            datasets: [
                {
                    label: 'Historical',
                    data: [...historicalData, ...new Array(6).fill(null)],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderDash: []
                },
                {
                    label: 'Predicted',
                    data: [...new Array(6).fill(null), ...forecastData],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

// Demand Prediction Chart
function createDemandPredictionChart() {
    const ctx = document.getElementById('demandPredictionChart').getContext('2d');
    const services = analyticsData.services || sampleAnalyticsData.services;
    const serviceNames = Object.keys(services).slice(0, 6);
    
    chartInstances['demandPredictionChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: serviceNames.map(formatServiceName),
            datasets: [
                {
                    label: 'Current Demand',
                    data: serviceNames.map(name => services[name].bookings),
                    backgroundColor: '#6c757d'
                },
                {
                    label: 'Predicted Demand',
                    data: serviceNames.map(name => Math.round(services[name].bookings * (1 + services[name].growth / 100))),
                    backgroundColor: '#28a745'
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
            }
        }
    });
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

// Setup event listeners
function setupEventListeners() {
    // Refresh data button
    document.getElementById('refresh-data')?.addEventListener('click', () => {
        refreshData();
    });
    
    // Export data button
    document.getElementById('export-data')?.addEventListener('click', () => {
        exportData();
    });
}

// Refresh data functionality
function refreshData() {
    const button = document.getElementById('refresh-data');
    button.classList.add('loading');
    
    // Simulate data refresh
    setTimeout(() => {
        button.classList.remove('loading');
        // Re-initialize charts with new data
        // initializeCharts();
        
        // Reload feedback messages
        loadFeedback();
        
        showNotification('Data refreshed successfully!', 'success');
    }, 2000);
}

// Export data functionality
function exportData() {
    const data = {
        overview: analyticsData.overview || sampleAnalyticsData.overview,
        services: analyticsData.services || sampleAnalyticsData.services,
        seasonal: analyticsData.seasonal || sampleAnalyticsData.seasonal,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
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

// Service Distribution Pie Chart using amCharts
function createServiceDistributionChart() {
    const ctx = document.getElementById('chartdiv').getContext('2d');
    
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
    const ctx = document.getElementById('chartdiv2').getContext('2d');
    
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
    const ctx = document.getElementById('bookingTrendsChart').getContext('2d');
    
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
                timestamp: feedback.feedback_id,
                status: 'unread' // Default status for new feedback
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
    const badgeClass = feedback.status === 'unread' ? 'bg-danger' : 'bg-secondary';
    const badgeText = feedback.status === 'unread' ? 'Unread' : 'Read';
    const actionButton = feedback.status === 'unread' 
        ? '<button class="btn btn-sm btn-outline-primary mark-read"><i class="fas fa-check me-1"></i>Mark as Read</button>'
        : '<button class="btn btn-sm btn-outline-secondary mark-unread"><i class="fas fa-envelope me-1"></i>Mark as Unread</button>';
    
    return `
        <div class="feedback-item ${feedback.status}" data-timestamp="${feedback.timestamp}">
            <div class="feedback-header">
                <div class="feedback-info">
                    <span class="feedback-name">${feedback.name}</span>
                    <span class="feedback-date">${feedback.date}</span>
                </div>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="feedback-message">
                ${feedback.message}
            </div>
            <div class="feedback-actions">
                ${actionButton}
                <button class="btn btn-sm btn-outline-danger delete-feedback">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        </div>
    `;
}

// Attach event listeners to feedback items
function attachFeedbackListeners() {
    // Mark as read
    document.querySelectorAll('.mark-read').forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackItem = this.closest('.feedback-item');
            const timestamp = feedbackItem.dataset.timestamp;
            updateFeedbackStatus(timestamp, 'read');
        });
    });
    
    // Mark as unread
    document.querySelectorAll('.mark-unread').forEach(btn => {
        btn.addEventListener('click', function() {
            const feedbackItem = this.closest('.feedback-item');
            const timestamp = feedbackItem.dataset.timestamp;
            updateFeedbackStatus(timestamp, 'unread');
        });
    });
    
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
    
    // Feedback filter buttons
    document.querySelectorAll('.btn-group[role="group"] .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Update active button
            document.querySelectorAll('.btn-group[role="group"] .btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Filter feedback items
            filterFeedback(filter);
        });
    });
}

// Update feedback status
async function updateFeedbackStatus(timestamp, status) {
    try {
        const response = await fetch(`${window.API_URL}/api/feedback/${timestamp}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Reload feedback to show updated status
            loadFeedback();
        } else {
            console.error('Failed to update feedback status:', result.message);
        }
    } catch (error) {
        console.error('Error updating feedback status:', error);
    }
}

// Delete feedback
async function deleteFeedback(timestamp) {
    try {
        const response = await fetch(`${window.API_URL}/api/feedback/${timestamp}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Reload feedback to show updated list
            loadFeedback();
        } else {
            console.error('Failed to delete feedback:', result.message);
            alert('Failed to delete feedback. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        alert('Failed to delete feedback. Please try again.');
    }
}

// Filter feedback
function filterFeedback(filter) {
    const feedbackItems = document.querySelectorAll('.feedback-item');
    
    feedbackItems.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'block';
        } else if (filter === 'unread' && item.classList.contains('unread')) {
            item.style.display = 'block';
        } else if (filter === 'read' && item.classList.contains('read')) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}
