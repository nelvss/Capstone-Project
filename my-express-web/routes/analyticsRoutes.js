const express = require('express');
const router = express.Router();
const { getRevenue, getBookingsCount, getPopularServices } = require('../controllers/analyticsController');

router.get('/analytics/revenue', getRevenue);
router.get('/analytics/bookings-count', getBookingsCount);
router.get('/analytics/popular-services', getPopularServices);

module.exports = router;

