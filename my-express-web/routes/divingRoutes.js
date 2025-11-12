const express = require('express');
const router = express.Router();
const { getDiving, createDiving, updateDiving, uploadDivingImage, deleteDiving, deleteDivingImage } = require('../controllers/divingController');

router.get('/diving', getDiving);
router.post('/diving', createDiving);
router.put('/diving/:divingId', updateDiving);
router.post('/diving/:divingId/upload-image', uploadDivingImage);
router.delete('/diving/:divingId/images/:imageId', deleteDivingImage);
router.delete('/diving/:divingId', deleteDiving);

module.exports = router;


