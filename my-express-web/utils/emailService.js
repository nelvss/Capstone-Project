const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
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
          <p style="font-size: 16px; color: #374151;">Dear ${booking.name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()},</p>
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
          <p style="font-size: 16px; color: #374151;">Dear ${booking.name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()},</p>
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
          <p style="font-size: 16px; color: #374151;">Dear ${booking.name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()},</p>
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

async function sendEmail(action, booking) {
  if (!action || !booking || (!booking.email && !booking.customer_email)) {
    throw new Error('Missing required fields');
  }

  if (!['confirm', 'cancel', 'reschedule'].includes(action)) {
    throw new Error('Invalid action type');
  }

  const template = emailTemplates[action](booking);
  
  const mailOptions = {
    from: `"Booking Management System" <${process.env.EMAIL_USER}>`,
    to: booking.email || booking.customer_email,
    subject: template.subject,
    html: template.html
  };

  await transporter.sendMail(mailOptions);
  return true;
}

module.exports = {
  transporter,
  emailTemplates,
  sendEmail
};

