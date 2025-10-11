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

// Analytics Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check session before loading analytics
    if (!checkSession()) {
        return;
    }
    
    // Navigation functionality
    initializeNavigation();
    
    // Initialize charts
    initializeCharts();
    
    // Load data and populate tables
    loadAnalyticsData();
    
    // Setup event listeners
    setupEventListeners();
});

// Sample data for analytics
const analyticsData = {
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

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.analytics-sidebar .nav-link[data-section]');
    const sections = document.querySelectorAll('.analytics-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.add('d-none'));
            
            // Show target section
            const targetSection = document.getElementById(link.dataset.section);
            if (targetSection) {
                targetSection.classList.remove('d-none');
                targetSection.classList.add('fade-in');
            }
        });
    });
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

// Revenue Trend Chart
function createRevenueTrendChart() {
    const ctx = document.getElementById('revenueTrendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.monthlyRevenue.map(d => d.month),
            datasets: [{
                label: 'Revenue (₱)',
                data: analyticsData.monthlyRevenue.map(d => d.revenue),
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
    const historicalData = analyticsData.monthlyRevenue.slice(-6).map(d => d.revenue);
    const forecastData = analyticsData.predictions.nextSixMonths.map(d => d.predicted);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [
                ...analyticsData.monthlyRevenue.slice(-6).map(d => d.month),
                ...analyticsData.predictions.nextSixMonths.map(d => d.month)
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
    const serviceNames = Object.keys(analyticsData.services).slice(0, 6);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: serviceNames.map(formatServiceName),
            datasets: [
                {
                    label: 'Current Demand',
                    data: serviceNames.map(name => analyticsData.services[name].bookings),
                    backgroundColor: '#6c757d'
                },
                {
                    label: 'Predicted Demand',
                    data: serviceNames.map(name => Math.round(analyticsData.services[name].bookings * (1 + analyticsData.services[name].growth / 100))),
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

// Load analytics data and populate tables
function loadAnalyticsData() {
    populateServiceMetricsTable();
    updateOverviewMetrics();
}

// Populate service metrics table
function populateServiceMetricsTable() {
    const tableBody = document.getElementById('serviceMetricsTable');
    if (!tableBody) return;
    
    const serviceEntries = Object.entries(analyticsData.services);
    
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
    const overview = analyticsData.overview;
    
    document.getElementById('total-bookings').textContent = overview.totalBookings.toLocaleString();
    document.getElementById('total-revenue').textContent = `₱${(overview.totalRevenue / 1000000).toFixed(1)}M`;
    document.getElementById('total-customers').textContent = overview.activeCustomers.toLocaleString();
    document.getElementById('avg-rating').textContent = overview.averageRating.toFixed(1);
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
        showNotification('Data refreshed successfully!', 'success');
    }, 2000);
}

// Export data functionality
function exportData() {
    const data = {
        overview: analyticsData.overview,
        services: analyticsData.services,
        seasonal: analyticsData.seasonal,
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
        const randomService = Object.keys(analyticsData.services)[Math.floor(Math.random() * Object.keys(analyticsData.services).length)];
        analyticsData.services[randomService].bookings += Math.floor(Math.random() * 3);
        
        // Update display if on overview section
        if (!document.getElementById('overview').classList.contains('d-none')) {
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
    
    new Chart(ctx, {
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
    
    new Chart(ctx, {
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
    const data = analyticsData.monthlyRevenue.map(d => ({
        month: d.month,
        bookings: d.bookings
    }));

    new Chart(ctx, {
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

// Feedback/Messages Section Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter feedback items
            const filter = this.dataset.filter;
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
        });
    });
    
    // Mark as Read functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.mark-read')) {
            const feedbackItem = e.target.closest('.feedback-item');
            feedbackItem.classList.remove('unread');
            feedbackItem.classList.add('read');
            
            const badge = feedbackItem.querySelector('.badge');
            badge.classList.remove('bg-danger');
            badge.classList.add('bg-secondary');
            badge.textContent = 'Read';
            
            // Replace button
            const button = e.target.closest('.mark-read');
            button.outerHTML = `
                <button class="btn btn-sm btn-outline-secondary mark-unread">
                    <i class="fas fa-envelope me-1"></i>Mark as Unread
                </button>
            `;
        }
    });
    
    // Mark as Unread functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.mark-unread')) {
            const feedbackItem = e.target.closest('.feedback-item');
            feedbackItem.classList.remove('read');
            feedbackItem.classList.add('unread');
            
            const badge = feedbackItem.querySelector('.badge');
            badge.classList.remove('bg-secondary');
            badge.classList.add('bg-danger');
            badge.textContent = 'Unread';
            
            // Replace button
            const button = e.target.closest('.mark-unread');
            button.outerHTML = `
                <button class="btn btn-sm btn-outline-primary mark-read">
                    <i class="fas fa-check me-1"></i>Mark as Read
                </button>
            `;
        }
    });
    
    // Delete feedback functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-feedback')) {
            if (confirm('Are you sure you want to delete this feedback?')) {
                const feedbackItem = e.target.closest('.feedback-item');
                feedbackItem.style.transition = 'all 0.3s ease';
                feedbackItem.style.opacity = '0';
                feedbackItem.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    feedbackItem.remove();
                    
                    // Check if there are any feedback items left
                    const remainingItems = document.querySelectorAll('.feedback-item');
                    if (remainingItems.length === 0) {
                        const container = document.getElementById('feedback-container');
                        container.innerHTML = `
                            <div class="feedback-empty">
                                <i class="fas fa-inbox"></i>
                                <p>No feedback messages</p>
                            </div>
                        `;
                    }
                }, 300);
            }
        }
    });
});