const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback, updateFeedbackStatus, deleteFeedback } = require('../controllers/feedbackController');

router.post('/submit-feedback', submitFeedback);
router.get('/feedback', getFeedback);
router.put('/feedback/:id/status', updateFeedbackStatus);
router.delete('/feedback/:id', deleteFeedback);

module.exports = router;

