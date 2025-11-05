const express = require('express');
const router = express.Router();
const { getVehicles, createVehicle, updateVehicle, uploadVehicleImage, deleteVehicle } = require('../controllers/vehicleController');

router.get('/vehicles', getVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:vehicleId', updateVehicle);
router.post('/vehicles/:vehicleId/upload-image', uploadVehicleImage);
router.delete('/vehicles/:vehicleId', deleteVehicle);

module.exports = router;

