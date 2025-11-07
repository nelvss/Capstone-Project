const express = require('express');
const router = express.Router();
const { 
  getRevenue, 
  getBookingsCount, 
  getPopularServices,
  getBookingStatusDistribution,
  getBookingTypeComparison,
  getRevenueByStatus,
  getServicePerformance,
  getTouristVolume,
  getHotelPerformance,
  getAvgBookingValue,
  getCancellationRate,
  getPeakBookingDays,
  getVanDestinations
} = require('../controllers/analyticsController');

router.get('/analytics/revenue', getRevenue);
router.get('/analytics/bookings-count', getBookingsCount);
router.get('/analytics/popular-services', getPopularServices);
router.get('/analytics/booking-status-distribution', getBookingStatusDistribution);
router.get('/analytics/booking-type-comparison', getBookingTypeComparison);
router.get('/analytics/revenue-by-status', getRevenueByStatus);
router.get('/analytics/service-performance', getServicePerformance);
router.get('/analytics/tourist-volume', getTouristVolume);
router.get('/analytics/hotel-performance', getHotelPerformance);
router.get('/analytics/avg-booking-value', getAvgBookingValue);
router.get('/analytics/cancellation-rate', getCancellationRate);
router.get('/analytics/peak-booking-days', getPeakBookingDays);
router.get('/analytics/van-destinations', getVanDestinations);

module.exports = router;

