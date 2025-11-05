const express = require('express');
const router = express.Router();
const {
  getPackagePricing,
  getTourPricing,
  getPackages,
  createPackage,
  getPackageById,
  updatePackage,
  deletePackage
} = require('../controllers/packageController');

router.get('/package-pricing', getPackagePricing);
router.get('/tour-pricing', getTourPricing);
router.get('/package-only', getPackages);
router.post('/package-only', createPackage);
router.get('/package-only/:id', getPackageById);
router.put('/package-only/:id', updatePackage);
router.delete('/package-only/:id', deletePackage);

module.exports = router;

