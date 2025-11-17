const express = require('express');
const router = express.Router();
const { login, register, forgotPassword, verifyResetCode, resetPassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;

