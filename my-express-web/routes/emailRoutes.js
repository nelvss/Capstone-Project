const express = require('express');
const router = express.Router();
const { sendEmailToCustomer } = require('../controllers/emailController');

router.post('/send-email', sendEmailToCustomer);

module.exports = router;

