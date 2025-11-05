const express = require('express');
const router = express.Router();
const {
  getTours,
  createTour,
  updateTour,
  deleteTour,
  addTourPricing,
  updateTourPricing,
  deleteTourPricing,
  uploadTourImage,
  deleteTourImage
} = require('../controllers/tourController');

router.get('/tours', getTours);
router.post('/tours', createTour);
router.put('/tours/:tourId', updateTour);
router.delete('/tours/:tourId', deleteTour);
router.post('/tours/:tourId/pricing', addTourPricing);
router.put('/tours/:tourId/pricing/:pricingId', updateTourPricing);
router.delete('/tours/:tourId/pricing/:pricingId', deleteTourPricing);
router.post('/tours/:tourId/upload-image', uploadTourImage);
router.delete('/tours/:tourId/images/:imageId', deleteTourImage);

module.exports = router;

