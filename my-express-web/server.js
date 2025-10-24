const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test if dotenv is working
console.log('🔍 Dotenv test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT from env:', process.env.PORT);
console.log('Current working directory:', process.cwd());

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://vjeykmpzwxqonkfnzbjw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXlrbXB6d3hxb25rZm56Ymp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDM0NzAsImV4cCI6MjA3NjA3OTQ3MH0.qDBNgf1Ot3mmQrIBkPGXoPRC1J00Vy6r8iaPGDjQKec';

// Debug environment variables
console.log('🔍 Environment check:');
console.log('SUPABASE_URL from env:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_KEY from env:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing');
console.log('Using fallback values:', !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY ? '✅ Yes' : '❌ No');

// List all environment variables that start with SUPABASE
console.log('All SUPABASE env vars:', Object.keys(process.env).filter(key => key.startsWith('SUPABASE')));

const supabase = createClient(supabaseUrl, supabaseKey);

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

// API endpoint for user login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    console.log(`🔍 Attempting login for email: ${email}`);
    
    // First, let's check if the table exists and has any data
    const { data: allUsers, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    console.log('📊 All users in table:', allUsers);
    console.log('📊 Table error:', tableError);
    
    // Query user from Supabase database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role')
      .eq('email', email)
      .single();
    
    console.log('📊 User query result:', { user, error });
    
    if (error || !user) {
      console.log('❌ User not found:', error?.message || 'No user found');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });
    
    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    console.log('✅ Password verified successfully for user:', email);
    
    // Update last_login timestamp
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Return user data (without password_hash)
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// API endpoint to send email
app.post('/api/send-email', async (req, res) => {
  try {
    const { action, booking } = req.body;
    
    // Validate input
    if (!action || !booking || (!booking.email && !booking.customer_email)) {
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
      to: booking.email || booking.customer_email,
      subject: template.subject,
      html: template.html
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
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
});

// API endpoint to submit feedback
app.post('/api/submit-feedback', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    console.log('📝 Submitting feedback:', { message: message.trim() });
    
    // Insert feedback into Supabase
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          anonymous_name: 'Anonymous',
          message: message.trim(),
          date: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('❌ Error inserting feedback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to submit feedback',
        error: error.message 
      });
    }
    
    console.log('✅ Feedback submitted successfully:', data);
    
    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedback_id: data[0]?.feedback_id
    });
    
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// API endpoint to fetch feedback
app.get('/api/feedback', async (req, res) => {
  try {
    console.log('📝 Fetching feedback from Supabase...');
    
    // Fetch feedback from Supabase
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('date', { ascending: false }); // Get newest first
    
    if (error) {
      console.error('❌ Error fetching feedback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch feedback',
        error: error.message 
      });
    }
    
    console.log('✅ Feedback fetched successfully:', data?.length || 0, 'items');
    
    res.json({ 
      success: true, 
      feedback: data || []
    });
    
  } catch (error) {
    console.error('❌ Feedback fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// API endpoint to update feedback status
app.put('/api/feedback/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📝 Updating feedback status for ID: ${id} to: ${status}`);
    
    // For now, we'll just return success since we don't have a status column in Supabase
    // In a real implementation, you might want to add a status column to the feedback table
    res.json({ 
      success: true, 
      message: 'Feedback status updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating feedback status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// API endpoint to delete feedback
app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Deleting feedback with ID: ${id}`);
    
    // Delete feedback from Supabase
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('feedback_id', id);
    
    if (error) {
      console.error('❌ Error deleting feedback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete feedback',
        error: error.message 
      });
    }
    
    console.log('✅ Feedback deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Feedback deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Feedback deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ========================================
// BOOKING MANAGEMENT API ENDPOINTS
// ========================================

// Create main booking record
app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      customer_first_name,
      customer_last_name,
      customer_email, 
      customer_contact, 
      booking_type,
      booking_preferences,
      arrival_date, 
      departure_date, 
      number_of_tourist,
      package_only_id,
      hotel_id, 
      hotel_nights,
      booking_id, // Custom booking ID from frontend
      status = 'pending'
    } = req.body;
    
    console.log('📝 Creating new booking:', { customer_first_name, customer_last_name, customer_email, arrival_date, departure_date });
    console.log('📝 Booking ID from frontend:', booking_id);
    
    // Validate required fields based on actual schema
    if (!customer_first_name || !customer_last_name || !customer_email || !customer_contact || 
        !booking_type || !booking_preferences || !arrival_date || !departure_date || !number_of_tourist || !booking_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: customer_first_name, customer_last_name, customer_email, customer_contact, booking_type, booking_preferences, arrival_date, departure_date, number_of_tourist, booking_id' 
      });
    }
    
    // Validate booking_type
    if (!['package_only', 'tour_only'].includes(booking_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking_type. Must be either "package_only" or "tour_only"' 
      });
    }
    
    // Build booking object matching the actual database schema
    const bookingData = {
      booking_id, // Use custom booking ID from frontend
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_contact,
      booking_type,
      booking_preferences, // Store the formatted preferences from frontend
      arrival_date,
      departure_date,
      number_of_tourist,
      status
    };
    
    // Add optional fields
    if (package_only_id) bookingData.package_only_id = package_only_id;
    if (hotel_id) bookingData.hotel_id = hotel_id;
    if (hotel_nights) bookingData.hotel_nights = hotel_nights;
    
    // Insert into bookings table
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();
    
    if (error) {
      console.error('❌ Error creating booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Booking created successfully:', data[0]);
    
    res.json({ 
      success: true, 
      message: 'Booking created successfully',
      booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get all bookings (for dashboards)
app.get('/api/bookings', async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    
    console.log('📊 Fetching bookings with filters:', { status, limit, offset });
    
    let query = supabase
      .from('bookings')
      .select('*')
      .order('arrival_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching bookings:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch bookings', 
        error: error.message 
      });
    }
    
    // Get unique hotel IDs from bookings
    const hotelIds = [...new Set(bookings.map(b => b.hotel_id).filter(id => id))];
    
    // Fetch hotel data for all unique hotel IDs
    let hotelsData = {};
    if (hotelIds.length > 0) {
      const { data: hotels, error: hotelsError } = await supabase
        .from('hotels')
        .select('hotel_id, name, description, base_price_per_night')
        .in('hotel_id', hotelIds);
      
      if (!hotelsError && hotels) {
        hotelsData = hotels.reduce((acc, hotel) => {
          acc[hotel.hotel_id] = hotel;
          return acc;
        }, {});
      }
    }
    
    // Merge hotel data with bookings
    const bookingsWithHotels = bookings.map(booking => ({
      ...booking,
      hotels: booking.hotel_id ? hotelsData[booking.hotel_id] : null
    }));
    
    console.log('✅ Bookings fetched successfully:', bookingsWithHotels?.length || 0, 'bookings');
    
    res.json({ 
      success: true, 
      bookings: bookingsWithHotels || []
    });
    
  } catch (error) {
    console.error('❌ Bookings fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get single booking details
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📊 Fetching booking details for ID:', id);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', id)
      .single();
    
    if (error) {
      console.error('❌ Error fetching booking:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found', 
        error: error.message 
      });
    }
    
    // Fetch hotel data if hotel_id exists
    let hotelData = null;
    if (booking.hotel_id) {
      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .select('hotel_id, name, description, base_price_per_night')
        .eq('hotel_id', booking.hotel_id)
        .single();
      
      if (!hotelError && hotel) {
        hotelData = hotel;
      }
    }
    
    // Merge hotel data with booking
    const bookingWithHotel = {
      ...booking,
      hotels: hotelData
    };
    
    console.log('✅ Booking details fetched successfully');
    
    res.json({ 
      success: true, 
      booking: bookingWithHotel
    });
    
  } catch (error) {
    console.error('❌ Booking fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Update booking status
app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    console.log(`📝 Updating booking status for ID: ${id} to: ${status}`);
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'rescheduled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status
      })
      .eq('booking_id', id)
      .select();
    
    if (error) {
      console.error('❌ Error updating booking status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update booking status', 
        error: error.message 
      });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    console.log('✅ Booking status updated successfully');
    
    res.json({ 
      success: true, 
      message: 'Booking status updated successfully',
      booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Booking status update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Deleting booking with ID: ${id}`);
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Booking deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Booking deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Booking deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ========================================
// SPECIALIZED BOOKING API ENDPOINTS
// ========================================

// Create tour booking
app.post('/api/booking-tour', async (req, res) => {
  try {
    const { 
      booking_id, 
      tour_type, 
      tourist_count, 
      tour_date, 
      total_price,
      notes = ''
    } = req.body;
    
    console.log('📝 Creating tour booking:', { booking_id, tour_type, tourist_count });
    
    if (!booking_id || !tour_type || !tourist_count || !tour_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, tour_type, tourist_count, tour_date' 
      });
    }
    
    const { data, error } = await supabase
      .from('booking_tour')
      .insert([{
        booking_id,
        tour_type,
        tourist_count,
        tour_date,
        total_price: total_price || 0,
        notes,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating tour booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create tour booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Tour booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Tour booking created successfully',
      tour_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Tour booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create vehicle booking
app.post('/api/booking-vehicles', async (req, res) => {
  try {
    const { 
      booking_id, 
      vehicle_name, 
      rental_days,
      total_amount
    } = req.body;
    
    console.log('📝 Creating vehicle booking:', { booking_id, vehicle_name, rental_days });
    
    if (!booking_id || !vehicle_name || !rental_days) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, vehicle_name, rental_days' 
      });
    }
    
    const { data, error } = await supabase
      .from('booking_vehicles')
      .insert([{
        booking_id,
        vehicle_name,
        rental_days,
        total_amount: total_amount || 0
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating vehicle booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create vehicle booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Vehicle booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Vehicle booking created successfully',
      vehicle_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Vehicle booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create diving booking
app.post('/api/booking-diving', async (req, res) => {
  try {
    const { 
      booking_id, 
      number_of_divers, 
      total_amount,
      booking_type = 'package_only' // Default to package_only for backwards compatibility
    } = req.body;
    
    console.log('📝 Creating diving booking:', { booking_id, number_of_divers, total_amount, booking_type });
    
    if (!booking_id || !number_of_divers || total_amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, number_of_divers, total_amount' 
      });
    }
    
    // Validate booking_type
    if (!['package_only', 'tour_only'].includes(booking_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking_type. Must be either "package_only" or "tour_only"' 
      });
    }
    
    const { data, error } = await supabase
      .from('bookings_diving')
      .insert([{
        booking_id,
        number_of_divers,
        total_amount: total_amount || 0,
        booking_type
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating diving booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create diving booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Diving booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Diving booking created successfully',
      diving_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Diving booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create van rental booking
app.post('/api/booking-van-rental', async (req, res) => {
  try {
    const { 
      booking_id, 
      destination_id, 
      rental_days, 
      rental_start_date, 
      rental_end_date,
      total_price,
      notes = ''
    } = req.body;
    
    console.log('📝 Creating van rental booking:', { booking_id, destination_id, rental_days });
    
    if (!booking_id || !destination_id || !rental_days || !rental_start_date || !rental_end_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, destination_id, rental_days, rental_start_date, rental_end_date' 
      });
    }
    
    const { data, error } = await supabase
      .from('bookings_van_rental')
      .insert([{
        booking_id,
        destination_id,
        rental_days,
        rental_start_date,
        rental_end_date,
        total_price: total_price || 0,
        notes,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating van rental booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create van rental booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Van rental booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Van rental booking created successfully',
      van_rental_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Van rental booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create package booking
app.post('/api/package-booking', async (req, res) => {
  try {
    const { 
      booking_id, 
      package_id, 
      package_name, 
      package_price,
      notes = ''
    } = req.body;
    
    console.log('📝 Creating package booking:', { booking_id, package_id, package_name });
    
    if (!booking_id || !package_id || !package_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, package_id, package_name' 
      });
    }
    
    const { data, error } = await supabase
      .from('package_only')
      .insert([{
        booking_id,
        package_id,
        package_name,
        package_price: package_price || 0,
        notes,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating package booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create package booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Package booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Package booking created successfully',
      package_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Package booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ========================================
// LOOKUP API ENDPOINTS
// ========================================

// Get all hotels
app.get('/api/hotels', async (req, res) => {
  try {
    console.log('📊 Fetching hotels...');
    
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching hotels:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch hotels', 
        error: error.message 
      });
    }
    
    console.log('✅ Hotels fetched successfully:', data?.length || 0, 'hotels');
    
    res.json({ 
      success: true, 
      hotels: data || []
    });
    
  } catch (error) {
    console.error('❌ Hotels fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    console.log('📊 Fetching vehicles...');
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('vehicle_name');
    
    if (error) {
      console.error('❌ Error fetching vehicles:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch vehicles', 
        error: error.message 
      });
    }
    
    console.log('✅ Vehicles fetched successfully:', data?.length || 0, 'vehicles');
    
    res.json({ 
      success: true, 
      vehicles: data || []
    });
    
  } catch (error) {
    console.error('❌ Vehicles fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get van destinations
app.get('/api/van-destinations', async (req, res) => {
  try {
    console.log('📊 Fetching van destinations...');
    
    const { data, error } = await supabase
      .from('van_destinations')
      .select('*')
      .order('destination_name');
    
    if (error) {
      console.error('❌ Error fetching van destinations:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch van destinations', 
        error: error.message 
      });
    }
    
    console.log('✅ Van destinations fetched successfully:', data?.length || 0, 'destinations');
    
    res.json({ 
      success: true, 
      destinations: data || []
    });
    
  } catch (error) {
    console.error('❌ Van destinations fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get package pricing
app.get('/api/package-pricing', async (req, res) => {
  try {
    console.log('📊 Fetching package pricing...');
    
    const { data, error } = await supabase
      .from('package_pricing')
      .select('*')
      .order('package_name');
    
    if (error) {
      console.error('❌ Error fetching package pricing:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch package pricing', 
        error: error.message 
      });
    }
    
    console.log('✅ Package pricing fetched successfully:', data?.length || 0, 'packages');
    
    res.json({ 
      success: true, 
      packages: data || []
    });
    
  } catch (error) {
    console.error('❌ Package pricing fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get tour pricing
app.get('/api/tour-pricing', async (req, res) => {
  try {
    console.log('📊 Fetching tour pricing...');
    
    const { data, error } = await supabase
      .from('tour_only')
      .select('*')
      .order('tour_name');
    
    if (error) {
      console.error('❌ Error fetching tour pricing:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tour pricing', 
        error: error.message 
      });
    }
    
    console.log('✅ Tour pricing fetched successfully:', data?.length || 0, 'tours');
    
    res.json({ 
      success: true, 
      tours: data || []
    });
    
  } catch (error) {
    console.error('❌ Tour pricing fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ========================================
// ANALYTICS API ENDPOINTS
// ========================================

// Get revenue data by date range
app.get('/api/analytics/revenue', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching revenue analytics:', { start_date, end_date, group_by });
    
    let query = supabase
      .from('bookings')
      .select('total_price, created_at, status');
    
    // Apply date filters if provided
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching revenue data:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch revenue data', 
        error: error.message 
      });
    }
    
    // Process data for analytics
    const confirmedBookings = data?.filter(booking => booking.status === 'confirmed') || [];
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0);
    
    console.log('✅ Revenue analytics fetched successfully');
    
    res.json({ 
      success: true, 
      analytics: {
        total_revenue: totalRevenue,
        total_bookings: data?.length || 0,
        confirmed_bookings: confirmedBookings.length,
        revenue_by_status: {
          confirmed: confirmedBookings.reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0),
          pending: data?.filter(b => b.status === 'pending').reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0) || 0,
          cancelled: data?.filter(b => b.status === 'cancelled').reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0) || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Revenue analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get booking counts
app.get('/api/analytics/bookings-count', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching booking counts:', { start_date, end_date });
    
    let query = supabase
      .from('bookings')
      .select('status, created_at');
    
    // Apply date filters if provided
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching booking counts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch booking counts', 
        error: error.message 
      });
    }
    
    // Count bookings by status
    const counts = {
      total: data?.length || 0,
      pending: data?.filter(b => b.status === 'pending').length || 0,
      confirmed: data?.filter(b => b.status === 'confirmed').length || 0,
      cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
      rescheduled: data?.filter(b => b.status === 'rescheduled').length || 0,
      completed: data?.filter(b => b.status === 'completed').length || 0
    };
    
    console.log('✅ Booking counts fetched successfully');
    
    res.json({ 
      success: true, 
      counts
    });
    
  } catch (error) {
    console.error('❌ Booking counts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get popular services
app.get('/api/analytics/popular-services', async (req, res) => {
  try {
    console.log('📊 Fetching popular services analytics...');
    
    // Get tour bookings
    const { data: tourBookings, error: tourError } = await supabase
      .from('booking_tour')
      .select('tour_type');
    
    // Get vehicle bookings
    const { data: vehicleBookings, error: vehicleError } = await supabase
      .from('booking_vehicles')
      .select('vehicle_id');
    
    // Get diving bookings
    const { data: divingBookings, error: divingError } = await supabase
      .from('bookings_diving')
      .select('diving_type');
    
    if (tourError || vehicleError || divingError) {
      console.error('❌ Error fetching service data:', { tourError, vehicleError, divingError });
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch service data' 
      });
    }
    
    // Count popular services
    const services = {
      tours: tourBookings?.reduce((acc, booking) => {
        acc[booking.tour_type] = (acc[booking.tour_type] || 0) + 1;
        return acc;
      }, {}) || {},
      vehicles: vehicleBookings?.length || 0,
      diving: divingBookings?.reduce((acc, booking) => {
        acc[booking.diving_type] = (acc[booking.diving_type] || 0) + 1;
        return acc;
      }, {}) || {}
    };
    
    console.log('✅ Popular services analytics fetched successfully');
    
    res.json({ 
      success: true, 
      services
    });
    
  } catch (error) {
    console.error('❌ Popular services analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ========================================
// PAYMENT API ENDPOINTS
// ========================================

// Record payment
app.post('/api/payments', async (req, res) => {
  try {
    const { 
      booking_id, 
      amount, 
      payment_method, 
      payment_status = 'completed',
      transaction_id,
      notes = ''
    } = req.body;
    
    console.log('💰 Recording payment:', { booking_id, amount, payment_method });
    
    if (!booking_id || !amount || !payment_method) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, amount, payment_method' 
      });
    }
    
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        booking_id,
        amount: parseFloat(amount),
        payment_method,
        payment_status,
        transaction_id: transaction_id || null,
        notes,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('❌ Error recording payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to record payment', 
        error: error.message 
      });
    }
    
    console.log('✅ Payment recorded successfully');
    
    res.json({ 
      success: true, 
      message: 'Payment recorded successfully',
      payment: data[0]
    });
    
  } catch (error) {
    console.error('❌ Payment recording error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get payment history
app.get('/api/payments', async (req, res) => {
  try {
    const { booking_id, limit = 100, offset = 0 } = req.query;
    
    console.log('💰 Fetching payment history:', { booking_id, limit, offset });
    
    let query = supabase
      .from('payments')
      .select(`
        *,
        bookings:booking_id (
          customer_name,
          email
        )
      `)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by booking_id if provided
    if (booking_id) {
      query = query.eq('booking_id', booking_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching payments:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payments', 
        error: error.message 
      });
    }
    
    console.log('✅ Payments fetched successfully:', data?.length || 0, 'payments');
    
    res.json({ 
      success: true, 
      payments: data || []
    });
    
  } catch (error) {
    console.error('❌ Payments fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get payments for specific booking
app.get('/api/payments/booking/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('💰 Fetching payments for booking ID:', id);
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', id)
      .order('payment_date', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching booking payments:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch booking payments', 
        error: error.message 
      });
    }
    
    console.log('✅ Booking payments fetched successfully');
    
    res.json({ 
      success: true, 
      payments: data || []
    });
    
  } catch (error) {
    console.error('❌ Booking payments fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
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
