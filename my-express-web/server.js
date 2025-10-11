const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create email transporter
// Configure with your email service (Gmail, Outlook, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD // Your email password or app-specific password
  }
});

// Email templates
const emailTemplates = {
  confirm: (booking) => ({
    subject: '✅ Booking Confirmed - Your Reservation Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #10b981; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Booking Confirmed! ✅</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Dear ${booking.name},</p>
          <p style="font-size: 14px; color: #6b7280;">
            Great news! Your booking has been confirmed. We're excited to welcome you!
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Booking Details:</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 8px 0;"><strong>Services:</strong></td>
                <td style="padding: 8px 0;">${booking.services}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Rental:</strong></td>
                <td style="padding: 8px 0;">${booking.rental}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Arrival Date:</strong></td>
                <td style="padding: 8px 0;">${booking.arrival}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Departure Date:</strong></td>
                <td style="padding: 8px 0;">${booking.departure}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Hotel:</strong></td>
                <td style="padding: 8px 0;">${booking.hotel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Total Price:</strong></td>
                <td style="padding: 8px 0; color: #10b981; font-weight: bold;">${booking.price}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Contact Number:</strong></td>
                <td style="padding: 8px 0;">${booking.contact}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            If you have any questions or need to make changes, please don't hesitate to contact us.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Best regards,<br>
              <strong>Your Booking Management Team</strong>
            </p>
          </div>
        </div>
      </div>
    `
  }),
  
  cancel: (booking) => ({
    subject: '❌ Booking Cancelled - Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #ef4444; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Booking Cancelled</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Dear ${booking.name},</p>
          <p style="font-size: 14px; color: #6b7280;">
            We regret to inform you that your booking has been cancelled as requested.
          </p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #991b1b; margin-top: 0;">Cancelled Booking Details:</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 8px 0;"><strong>Services:</strong></td>
                <td style="padding: 8px 0;">${booking.services}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Rental:</strong></td>
                <td style="padding: 8px 0;">${booking.rental}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Arrival Date:</strong></td>
                <td style="padding: 8px 0;">${booking.arrival}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Departure Date:</strong></td>
                <td style="padding: 8px 0;">${booking.departure}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Hotel:</strong></td>
                <td style="padding: 8px 0;">${booking.hotel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Original Price:</strong></td>
                <td style="padding: 8px 0;">${booking.price}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            If this cancellation was made in error or you'd like to make a new booking, please contact us immediately.
          </p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 13px; color: #92400e; margin: 0;">
              <strong>⚠️ Refund Notice:</strong> Any applicable refunds will be processed within 5-7 business days according to our cancellation policy.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Best regards,<br>
              <strong>Your Booking Management Team</strong>
            </p>
          </div>
        </div>
      </div>
    `
  }),
  
  reschedule: (booking) => ({
    subject: '📅 Booking Reschedule Request Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #3b82f6; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Reschedule Request Received 📅</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Dear ${booking.name},</p>
          <p style="font-size: 14px; color: #6b7280;">
            We've received your request to reschedule your booking. Our team is reviewing your request and will contact you shortly with available options.
          </p>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Current Booking Details:</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 8px 0;"><strong>Services:</strong></td>
                <td style="padding: 8px 0;">${booking.services}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Rental:</strong></td>
                <td style="padding: 8px 0;">${booking.rental}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Current Arrival:</strong></td>
                <td style="padding: 8px 0;">${booking.arrival}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Current Departure:</strong></td>
                <td style="padding: 8px 0;">${booking.departure}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Hotel:</strong></td>
                <td style="padding: 8px 0;">${booking.hotel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Total Price:</strong></td>
                <td style="padding: 8px 0;">${booking.price}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 13px; color: #92400e; margin: 0;">
              <strong>⏰ Next Steps:</strong> Our team will reach out to you within 24 hours at ${booking.contact} or via email to discuss new dates and finalize your rescheduling.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            If you have specific dates in mind, please feel free to reply to this email with your preferences.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Best regards,<br>
              <strong>Your Booking Management Team</strong>
            </p>
          </div>
        </div>
      </div>
    `
  })
};

// API endpoint to send email
app.post('/api/send-email', async (req, res) => {
  try {
    const { action, booking } = req.body;
    
    // Validate input
    if (!action || !booking || !booking.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Validate action type
    if (!['confirm', 'cancel', 'reschedule'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action type' 
      });
    }
    
    // Get email template
    const template = emailTemplates[action](booking);
    
    // Email options
    const mailOptions = {
      from: `"Booking Management System" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: template.subject,
      html: template.html
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${booking.email} for action: ${action}`);
    
    res.json({ 
      success: true, 
      message: `Email sent successfully to ${booking.email}`,
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📧 Email service configured with: ${process.env.EMAIL_USER || 'Not configured'}`);
});
