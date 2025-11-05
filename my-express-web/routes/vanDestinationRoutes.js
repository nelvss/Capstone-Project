const express = require('express');
const router = express.Router();
const { getVanDestinations, createVanDestination, updateVanDestination, deleteVanDestination } = require('../controllers/vanDestinationController');

router.get('/van-destinations', getVanDestinations);
router.post('/van-destinations', createVanDestination);
router.put('/van-destinations/:destinationId', updateVanDestination);
router.delete('/van-destinations/:destinationId', deleteVanDestination);

module.exports = router;

