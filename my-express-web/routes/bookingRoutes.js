const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  createTourBooking,
  createVehicleBooking,
  createDivingBooking,
  createVanRentalBooking,
  createPackageBooking
} = require('../controllers/bookingController');

router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.get('/bookings/:id', getBookingById);
router.put('/bookings/:id/status', updateBookingStatus);
router.delete('/bookings/:id', deleteBooking);

// Specialized booking endpoints
router.post('/booking-tour', createTourBooking);
router.post('/booking-vehicles', createVehicleBooking);
router.post('/booking-diving', createDivingBooking);
router.post('/booking-van-rental', createVanRentalBooking);
router.post('/package-booking', createPackageBooking);

module.exports = router;

