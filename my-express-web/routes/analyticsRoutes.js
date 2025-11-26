const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Validate that all required functions are exported
const requiredFunctions = [
  'getRevenue', 
  'getBookingsCount', 
  'getPopularServices',
  'getBookingStatusDistribution',
  'getBookingTypeComparison',
  'getPackageDistribution',
  'getTourDistribution',
  'getRevenueByStatus',
  'getServicePerformance',
  'getTouristVolume',
  'getHotelPerformance',
  'getAvgBookingValue',
  'getCancellationRate',
  'getPeakBookingDays',
  'getVanDestinations',
  'getBookingDemandTimeseries',
  'getSeasonalPrediction',
  'interpretChart'
];

// Check for missing functions and log warnings
const missingFunctions = requiredFunctions.filter(fn => typeof analyticsController[fn] !== 'function');
if (missingFunctions.length > 0) {
  console.error('❌ Missing functions in analyticsController:', missingFunctions);
  console.error('❌ Make sure analyticsController.js has module.exports with all functions');
}

// Helper to get function or return error handler
const getHandler = (fnName) => {
  const handler = analyticsController[fnName];
  if (typeof handler === 'function') {
    return handler;
  }
  console.error(`❌ ${fnName} is not a function in analyticsController`);
  return (req, res) => res.status(500).json({ 
    success: false,
    error: `${fnName} function not available. Check server logs.` 
  });
};

// Get all handlers
const getRevenue = getHandler('getRevenue');
const getBookingsCount = getHandler('getBookingsCount');
const getPopularServices = getHandler('getPopularServices');
const getBookingStatusDistribution = getHandler('getBookingStatusDistribution');
const getBookingTypeComparison = getHandler('getBookingTypeComparison');
const getPackageDistribution = getHandler('getPackageDistribution');
const getTourDistribution = getHandler('getTourDistribution');
const getRevenueByStatus = getHandler('getRevenueByStatus');
const getServicePerformance = getHandler('getServicePerformance');
const getTouristVolume = getHandler('getTouristVolume');
const getHotelPerformance = getHandler('getHotelPerformance');
const getAvgBookingValue = getHandler('getAvgBookingValue');
const getCancellationRate = getHandler('getCancellationRate');
const getPeakBookingDays = getHandler('getPeakBookingDays');
const getVanDestinations = getHandler('getVanDestinations');
const getBookingDemandTimeseries = getHandler('getBookingDemandTimeseries');
const getSeasonalPrediction = getHandler('getSeasonalPrediction');
const interpretChart = getHandler('interpretChart');

router.get('/analytics/revenue', getRevenue);
router.get('/analytics/bookings-count', getBookingsCount);
router.get('/analytics/popular-services', getPopularServices);
router.get('/analytics/booking-status-distribution', getBookingStatusDistribution);
router.get('/analytics/booking-type-comparison', getBookingTypeComparison);
router.get('/analytics/package-distribution', getPackageDistribution);
router.get('/analytics/tour-distribution', getTourDistribution);
router.get('/analytics/revenue-by-status', getRevenueByStatus);
router.get('/analytics/service-performance', getServicePerformance);
router.get('/analytics/tourist-volume', getTouristVolume);
router.get('/analytics/hotel-performance', getHotelPerformance);
router.get('/analytics/avg-booking-value', getAvgBookingValue);
router.get('/analytics/cancellation-rate', getCancellationRate);
router.get('/analytics/peak-booking-days', getPeakBookingDays);
router.get('/analytics/van-destinations', getVanDestinations);
router.get('/analytics/booking-demand-timeseries', getBookingDemandTimeseries);
router.get('/analytics/seasonal-prediction', getSeasonalPrediction);
router.post('/analytics/interpret-chart', interpretChart);

module.exports = router;

