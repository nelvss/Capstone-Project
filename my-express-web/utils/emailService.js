const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Logo URL - Configured for Hostinger deployment
// For Hostinger: Logo should be accessible at your domain root/Images/logo.png
// You can override this via LOGO_URL environment variable in your .env file
// Example: LOGO_URL=https://www.otgpuertogaleratravel.com/Images/logo.png
const LOGO_URL = process.env.LOGO_URL || 'https://otgpuertogaleratravel.com/Images/logo.png';

// Email templates
const emailTemplates = {
  confirm: (booking) => ({
    subject: '✅ Booking Confirmed - Your Reservation Details',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937 !important;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <img src="${LOGO_URL}" alt="OTG Travel and Tours Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Booking Confirmed!</h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Your reservation is ready</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #1f2937 !important; background-color: #ffffff !important;">
                    <p style="font-size: 18px; color: #1f2937 !important; margin: 0 0 10px 0; font-weight: 600;">Dear ${booking.name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()},</p>
                    <p style="font-size: 16px; color: #374151 !important; margin: 0 0 30px 0; line-height: 1.6;">
                      Great news! Your booking has been confirmed. We're excited to welcome you to Puerto Galera!
                    </p>
                    
                    <!-- Booking Details Card -->
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; padding: 25px; border-radius: 12px; margin: 30px 0;">
                      <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                        <span style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-block; margin-right: 12px; font-size: 18px; line-height: 32px; text-align: center; vertical-align: middle;">✓</span>
                        Booking Details
                      </h2>
                      <table style="width: 100%; font-size: 15px; color: #1f2937 !important;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Services</strong>
                            <span style="color: #1f2937 !important;">${booking.services || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Vehicle Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.rental || 'N/A'}</span>
                          </td>
                        </tr>
                        ${booking.vanRental && booking.vanRental !== 'N/A' ? `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Van Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.vanRental}</span>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Arrival Date</strong>
                            <span style="color: #1f2937 !important;">${booking.arrival || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Departure Date</strong>
                            <span style="color: #1f2937 !important;">${booking.departure || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Hotel</strong>
                            <span style="color: #1f2937 !important;">${booking.hotel || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Contact Number</strong>
                            <span style="color: #1f2937 !important;">${booking.contact || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <strong style="color: #065f46; display: block; margin-bottom: 4px;">Total Price</strong>
                            <span style="color: #10b981; font-size: 24px; font-weight: 700;">${booking.price || '₱0'}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Info Box -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                        <strong>💡 Need Help?</strong><br>
                        If you have any questions or need to make changes, please don't hesitate to contact us. We're here to make your experience perfect!
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                      <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #1f2937;">OTG Travel and Tours Team</strong>
                      </p>
                      <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 0 0;">
                        This is an automated confirmation email. Please do not reply directly to this message.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }),
  
  cancel: (booking) => ({
    subject: '❌ Booking Cancelled - Confirmation',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937 !important;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                    <img src="${LOGO_URL}" alt="OTG Travel and Tours Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Booking Cancelled</h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Cancellation confirmed</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #1f2937 !important; background-color: #ffffff !important;">
                    <p style="font-size: 18px; color: #1f2937 !important; margin: 0 0 10px 0; font-weight: 600;">Dear ${booking.name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()},</p>
                    <p style="font-size: 16px; color: #374151 !important; margin: 0 0 30px 0; line-height: 1.6;">
                      We regret to inform you that your booking has been cancelled as requested.
                    </p>
                    
                    <!-- Cancelled Booking Details Card -->
                    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; padding: 25px; border-radius: 12px; margin: 30px 0;">
                      <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                        <span style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-block; margin-right: 12px; font-size: 18px; line-height: 32px; text-align: center; vertical-align: middle;">✕</span>
                        Cancelled Booking Details
                      </h2>
                      <table style="width: 100%; font-size: 15px; color: #1f2937 !important;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Services</strong>
                            <span style="color: #1f2937 !important;">${booking.services || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Vehicle Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.rental || 'N/A'}</span>
                          </td>
                        </tr>
                        ${booking.vanRental && booking.vanRental !== 'N/A' ? `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Van Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.vanRental}</span>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Arrival Date</strong>
                            <span style="color: #1f2937 !important;">${booking.arrival || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Departure Date</strong>
                            <span style="color: #1f2937 !important;">${booking.departure || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Hotel</strong>
                            <span style="color: #1f2937 !important;">${booking.hotel || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Original Price</strong>
                            <span style="color: #ef4444; font-size: 20px; font-weight: 600;">${booking.price || '₱0'}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Refund Notice -->
                    <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong style="font-size: 16px;">⚠️ Refund Notice</strong><br>
                        Any applicable refunds will be processed within 5-7 business days according to our cancellation policy. You will receive a confirmation email once the refund has been initiated.
                      </p>
                    </div>
                    
                    <!-- Rebooking CTA -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                        <strong>🔄 Want to Rebook?</strong><br>
                        If this cancellation was made in error or you'd like to make a new booking, please contact us immediately. We'd be happy to help you plan your perfect trip!
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                      <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #1f2937;">OTG Travel and Tours Team</strong>
                      </p>
                      <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 0 0;">
                        This is an automated cancellation confirmation email. Please do not reply directly to this message.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }),
  
  reschedule: (booking) => ({
    subject: '📅 Booking Reschedule Request Received',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937 !important;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                    <img src="${LOGO_URL}" alt="OTG Travel and Tours Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Reschedule Request Received</h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">We're reviewing your request</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #1f2937 !important; background-color: #ffffff !important;">
                    <p style="font-size: 18px; color: #1f2937 !important; margin: 0 0 10px 0; font-weight: 600;">Dear ${booking.name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()},</p>
                    <p style="font-size: 16px; color: #374151 !important; margin: 0 0 30px 0; line-height: 1.6;">
                      We've received your request to reschedule your booking. Our team is reviewing your request and will contact you shortly with available options.
                    </p>
                    
                    <!-- Current Booking Details Card -->
                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 25px; border-radius: 12px; margin: 30px 0;">
                      <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                        <span style="background-color: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-block; margin-right: 12px; font-size: 18px; line-height: 32px; text-align: center; vertical-align: middle;">📅</span>
                        Current Booking Details
                      </h2>
                      <table style="width: 100%; font-size: 15px; color: #1f2937 !important;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Services</strong>
                            <span style="color: #1f2937 !important;">${booking.services || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Vehicle Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.rental || 'N/A'}</span>
                          </td>
                        </tr>
                        ${booking.vanRental && booking.vanRental !== 'N/A' ? `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Van Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.vanRental}</span>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Current Arrival</strong>
                            <span style="color: #1f2937 !important;">${booking.arrival || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Current Departure</strong>
                            <span style="color: #1f2937 !important;">${booking.departure || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Hotel</strong>
                            <span style="color: #1f2937 !important;">${booking.hotel || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Total Price</strong>
                            <span style="color: #3b82f6; font-size: 20px; font-weight: 600;">${booking.price || '₱0'}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Next Steps -->
                    <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                        <strong style="font-size: 16px;">⏰ Next Steps</strong><br>
                        Our team will reach out to you within 24 hours at <strong>${booking.contact || 'your contact number'}</strong> or via email to discuss new dates and finalize your rescheduling.
                      </p>
                    </div>
                    
                    <!-- Additional Info -->
                    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                        <strong>💡 Have Specific Dates in Mind?</strong><br>
                        If you have preferred dates, please feel free to reply to this email with your preferences. This will help us process your reschedule request faster!
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                      <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #1f2937;">OTG Travel and Tours Team</strong>
                      </p>
                      <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 0 0;">
                        This is an automated reschedule acknowledgment email. Our team will contact you soon to finalize your new dates.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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

