const express = require('express');
const router = express.Router();
const { 
  getVanDestinations, 
  createVanDestination, 
  updateVanDestination, 
  deleteVanDestination,
  getVanImages,
  uploadVanImage,
  deleteVanImage
} = require('../controllers/vanDestinationController');

router.get('/van-destinations', getVanDestinations);
router.post('/van-destinations', createVanDestination);
router.put('/van-destinations/:destinationId', updateVanDestination);
router.delete('/van-destinations/:destinationId', deleteVanDestination);

// Van images routes
router.get('/van-images', getVanImages);
router.post('/van-images/upload', uploadVanImage);
router.delete('/van-images/:imageId', deleteVanImage);

module.exports = router;

