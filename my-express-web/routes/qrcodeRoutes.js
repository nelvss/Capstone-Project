const express = require('express');
const router = express.Router();
const { getQrcodes, createQrcode, updateQrcode, uploadQrcodeImage, deleteQrcode, getQrcodesForSettings } = require('../controllers/qrcodeController');

router.get('/qrcode', getQrcodes);
router.post('/qrcode', createQrcode);
router.put('/qrcode/:qrcodeId', updateQrcode);
router.post('/qrcode/:qrcodeId/upload-image', uploadQrcodeImage);
router.delete('/qrcode/:qrcodeId', deleteQrcode);
router.get('/settings/qr-codes', getQrcodesForSettings);

module.exports = router;

