const { sendEmail } = require('../utils/emailService');

const sendEmailToCustomer = async (req, res) => {
  try {
    const { action, booking } = req.body;
    
    if (!action || !booking || (!booking.email && !booking.customer_email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    if (!['confirm', 'cancel', 'reschedule', 'reschedule_cancelled'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action type' 
      });
    }
    
    await sendEmail(action, booking);
    
    console.log(`✅ Email sent successfully to ${booking.email || booking.customer_email} for action: ${action}`);
    
    res.json({ 
      success: true, 
      message: `Email sent successfully to ${booking.email || booking.customer_email}`,
      action: action
    });
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error.message 
    });
  }
};

module.exports = { sendEmailToCustomer };

