const express = require('express');
const router = express.Router();
const { getSiteContent } = require('../controllers/settingsController');

router.get('/settings/content', getSiteContent);

module.exports = router;

