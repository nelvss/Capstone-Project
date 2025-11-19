const nodemailer = require('nodemailer');

// Create email transporter with timeout settings
// Optimized for better performance under load:
// - maxConnections: 5 allows parallel email sending (prevents queuing delays)
// - maxMessages: 100 reduces connection overhead (connection stays open longer)
// - Increased timeouts to handle slower network conditions
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Connection timeout settings
  connectionTimeout: 15000, // 15 seconds (increased from 10)
  socketTimeout: 15000, // 15 seconds (increased from 10)
  // Enable connection pooling for better performance
  pool: true,
  maxConnections: 5, // Allow 5 parallel connections (increased from 1)
  maxMessages: 100, // Keep connection open for up to 100 messages (increased from 3)
  rateDelta: 1000, // Time to wait before sending next email in same connection (1 second)
  rateLimit: 5 // Maximum number of messages per rateDelta (5 emails per second per connection)
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
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: 'Poppins', sans-serif; color: #1f2937 !important;">
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
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: 'Poppins', sans-serif; color: #1f2937 !important;">
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
    subject: '✅ Booking Reschedule Confirmed - Your New Dates',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: 'Poppins', sans-serif; color: #1f2937 !important;">
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
                      Your booking reschedule request has been confirmed! Your booking dates have been updated as shown below.
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
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">New Arrival Date</strong>
                            <span style="color: #1f2937 !important;">${booking.arrival_date ? new Date(booking.arrival_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (booking.arrival || 'N/A')}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">New Departure Date</strong>
                            <span style="color: #1f2937 !important;">${booking.departure_date ? new Date(booking.departure_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (booking.departure || 'N/A')}</span>
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
                    
                    <!-- Confirmation Message -->
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                        <strong style="font-size: 16px;">✅ Reschedule Confirmed</strong><br>
                        Your booking has been successfully rescheduled. Please note the new dates above. If you have any questions or need further assistance, please don't hesitate to contact us.
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                      <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #1f2937;">OTG Travel and Tours Team</strong>
                      </p>
                      <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 0 0;">
                        This is a confirmation email for your rescheduled booking. Your new dates are now active.
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
  
  reschedule_cancelled: (booking) => ({
    subject: '❌ Reschedule Request Cancelled - Your Original Dates Remain',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: 'Poppins', sans-serif; color: #1f2937 !important;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                    <img src="${LOGO_URL}" alt="OTG Travel and Tours Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Reschedule Request Cancelled</h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Your original booking dates remain unchanged</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #1f2937 !important; background-color: #ffffff !important;">
                    <p style="font-size: 18px; color: #1f2937 !important; margin: 0 0 10px 0; font-weight: 600;">Dear ${booking.name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim()},</p>
                    <p style="font-size: 16px; color: #374151 !important; margin: 0 0 30px 0; line-height: 1.6;">
                      We regret to inform you that your reschedule request has been cancelled. Your booking will remain with the original dates as shown below.
                    </p>
                    
                    <!-- Original Booking Details Card -->
                    <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; padding: 25px; border-radius: 12px; margin: 30px 0;">
                      <h2 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                        <span style="background-color: #f59e0b; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-block; margin-right: 12px; font-size: 18px; line-height: 32px; text-align: center; vertical-align: middle;">📅</span>
                        Your Original Booking Details
                      </h2>
                      <table style="width: 100%; font-size: 15px; color: #1f2937 !important;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
                            <strong style="color: #92400e; display: block; margin-bottom: 4px;">Services</strong>
                            <span style="color: #1f2937 !important;">${booking.services || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
                            <strong style="color: #92400e; display: block; margin-bottom: 4px;">Vehicle Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.rental || 'N/A'}</span>
                          </td>
                        </tr>
                        ${booking.vanRental && booking.vanRental !== 'N/A' ? `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
                            <strong style="color: #92400e; display: block; margin-bottom: 4px;">Van Rental</strong>
                            <span style="color: #1f2937 !important;">${booking.vanRental}</span>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
                            <strong style="color: #92400e; display: block; margin-bottom: 4px;">Arrival Date</strong>
                            <span style="color: #1f2937 !important;">${booking.arrival_date ? new Date(booking.arrival_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (booking.arrival || 'N/A')}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
                            <strong style="color: #92400e; display: block; margin-bottom: 4px;">Departure Date</strong>
                            <span style="color: #1f2937 !important;">${booking.departure_date ? new Date(booking.departure_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (booking.departure || 'N/A')}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
                            <strong style="color: #92400e; display: block; margin-bottom: 4px;">Hotel</strong>
                            <span style="color: #1f2937 !important;">${booking.hotel || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <strong style="color: #92400e; display: block; margin-bottom: 4px;">Total Price</strong>
                            <span style="color: #f59e0b; font-size: 20px; font-weight: 600;">${booking.price || '₱0'}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    ${booking.requested_arrival_date && booking.requested_departure_date ? `
                    <!-- Cancelled Request Details -->
                    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; padding: 25px; border-radius: 12px; margin: 30px 0;">
                      <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                        <span style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-block; margin-right: 12px; font-size: 18px; line-height: 32px; text-align: center; vertical-align: middle;">✕</span>
                        Cancelled Reschedule Request
                      </h2>
                      <table style="width: 100%; font-size: 15px; color: #1f2937 !important;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Requested Arrival Date</strong>
                            <span style="color: #1f2937 !important;">${new Date(booking.requested_arrival_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <strong style="color: #991b1b; display: block; margin-bottom: 4px;">Requested Departure Date</strong>
                            <span style="color: #1f2937 !important;">${new Date(booking.requested_departure_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ` : ''}
                    
                    <!-- Information Message -->
                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                        <strong style="font-size: 16px;">ℹ️ Important Information</strong><br>
                        Your booking remains active with the original dates shown above. If you need to reschedule in the future, please submit a new reschedule request through your account. If you have any questions or concerns, please don't hesitate to contact us.
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                      <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #1f2937;">OTG Travel and Tours Team</strong>
                      </p>
                      <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 0 0;">
                        This is an automated notification email. Please do not reply directly to this message.
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

  if (!['confirm', 'cancel', 'reschedule', 'reschedule_cancelled'].includes(action)) {
    throw new Error('Invalid action type');
  }

  const template = emailTemplates[action](booking);
  
  const mailOptions = {
    from: `"OTG Puerto Galera Travel and Tours" <${process.env.EMAIL_USER}>`,
    to: booking.email || booking.customer_email,
    subject: template.subject,
    html: template.html
  };

  await transporter.sendMail(mailOptions);
  return true;
}

// Password Reset Email Template - Sends verification code
async function sendPasswordResetEmail(email, code) {
  // Create a promise with timeout to prevent hanging
  const sendEmailWithTimeout = (mailOptions, timeoutMs = 20000) => {
    return Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), timeoutMs)
      )
    ]);
  };

  // Retry logic for email sending (handles temporary network issues and rate limits)
  const sendWithRetry = async (mailOptions, maxRetries = 3, retryDelay = 2000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await sendEmailWithTimeout(mailOptions, 20000);
        if (attempt > 1) {
          console.log(`✅ Email sent successfully on attempt ${attempt} for: ${email}`);
        }
        return true;
      } catch (error) {
        lastError = error;
        const isRetryable = error.message.includes('timeout') || 
                           error.message.includes('ECONNRESET') ||
                           error.message.includes('ETIMEDOUT') ||
                           error.code === 'EAUTH' ||
                           error.responseCode >= 500;
        
        if (attempt < maxRetries && isRetryable) {
          const delay = retryDelay * attempt; // Exponential backoff
          console.log(`⚠️ Email send attempt ${attempt} failed for ${email}, retrying in ${delay}ms... Error: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  };

  const mailOptions = {
    from: `"OTG Puerto Galera Travel and Tours" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset Verification Code - OTG Travel and Tours',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa !important; font-family: 'Poppins', sans-serif; color: #1f2937 !important;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
                    <img src="${LOGO_URL}" alt="OTG Travel and Tours Logo" style="max-width: 180px; height: auto; margin-bottom: 20px; background-color: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Code</h1>
                    <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">Enter this code to verify your identity</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px; color: #1f2937 !important; background-color: #ffffff !important;">
                    <p style="font-size: 18px; color: #1f2937 !important; margin: 0 0 10px 0; font-weight: 600;">Hello,</p>
                    <p style="font-size: 16px; color: #374151 !important; margin: 0 0 30px 0; line-height: 1.6;">
                      We received a request to reset your password for your OTG Travel and Tours account. Use the verification code below to proceed with resetting your password.
                    </p>
                    
                    <!-- Verification Code Display -->
                    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                      <p style="font-size: 14px; color: #991b1b; margin: 0 0 15px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                      <div style="font-size: 48px; font-weight: 700; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 20px 0;">
                        ${code}
                      </div>
                      <p style="font-size: 12px; color: #991b1b; margin: 15px 0 0 0;">This code will expire in 10 minutes</p>
                    </div>
                    
                    <!-- Instructions -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                        <strong>📝 Next Steps:</strong><br>
                        1. Go to the password reset page<br>
                        2. Enter your email address<br>
                        3. Enter the verification code shown above<br>
                        4. Create your new password
                      </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280 !important; margin: 30px 0 0 0; line-height: 1.6;">
                      <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your account remains secure and no changes have been made.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 14px; color: #6b7280 !important; margin: 0 0 10px 0;">
                      © ${new Date().getFullYear()} OTG Puerto Galera Travel and Tours. All rights reserved.
                    </p>
                    <p style="font-size: 12px; color: #9ca3af !important; margin: 0;">
                      This is an automated email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    // Send email with retry logic (handles temporary failures and rate limits)
    await sendWithRetry(mailOptions, 3, 2000);
    return true;
  } catch (error) {
    // Enhanced error logging with more context
    const errorDetails = {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      email: email,
      timestamp: new Date().toISOString()
    };
    console.error('❌ Email sending failed after retries:', JSON.stringify(errorDetails, null, 2));
    throw error;
  }
}

module.exports = {
  transporter,
  emailTemplates,
  sendEmail,
  sendPasswordResetEmail
};

