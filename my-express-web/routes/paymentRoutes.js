const express = require('express');
const router = express.Router();
const { uploadReceipt, createPayment, getPayments, getPaymentById, updatePayment, deletePayment } = require('../controllers/paymentController');

router.post('/payments/upload-receipt', uploadReceipt);
router.post('/payments', createPayment);
router.get('/payments', getPayments);
router.get('/payments/:id', getPaymentById);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

module.exports = router;

