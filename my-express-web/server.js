const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Load .env from this backend directory explicitly (works regardless of CWD)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Test if dotenv is working
console.log('🔍 Dotenv test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT from env:', process.env.PORT);
console.log('Current working directory:', process.cwd());

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase configuration
// Using SUPABASE_KEY for backend server-side operations
// This allows the server to perform operations without Row Level Security restrictions
// The service role key is kept secure on the server and never exposed to clients
const rawSupabaseUrl = process.env.SUPABASE_URL || '';
// Trim and remove accidental surrounding quotes from env values
const supabaseUrl = rawSupabaseUrl.trim().replace(/^['"]|['"]$/g, '');
const supabaseKey = (process.env.SUPABASE_KEY || '').trim();

// Debug environment variables
console.log('🔍 Environment check:');
console.log('SUPABASE_URL from env:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_KEY from env:', process.env.SUPABASE_KEY ? '✅ Present' : '❌ Missing');
console.log('Using fallback values:', !process.env.SUPABASE_URL || !supabaseKey ? '✅ Yes' : '❌ No');

// List which SUPABASE key will be used (do not print the actual keys)
console.log('Supabase client will use: SUPABASE_KEY from environment (server-side only)');

// Validate Supabase configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL ERROR: Missing Supabase configuration!');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
  process.exit(1);
}

// Validate URL format early to avoid cryptic errors inside the client
try {
  const parsed = new URL(supabaseUrl);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error('URL must start with http:// or https://');
  }
} catch (e) {
  console.error('❌ Invalid SUPABASE_URL value.');
  console.error('Received:', JSON.stringify(supabaseUrl));
  console.error('Hint: It should look like https://your-project-ref.supabase.co');
  console.error('Details:', e.message);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection on startup
console.log('🔗 Testing Supabase connection...');
supabase
  .from('users')
  .select('count')
  .limit(1)
  .then(() => {
    console.log('✅ Supabase connection successful');
  })
  .catch((error) => {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('⚠️ Server will continue but database operations may fail');
  });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file hosting for frontend assets
const projectRootDir = path.resolve(__dirname, '..');
const userDir = path.join(projectRootDir, 'user');
const ownerDir = path.join(projectRootDir, 'owner');

// Serve user and owner folders so CSS/JS/images load with their relative paths
app.use('/user', express.static(userDir));
// Expose the home subfolder at root so '/home.css' resolves to 'user/home/home.css'
const userHomeDir = path.join(userDir, 'home');
app.use('/', express.static(userHomeDir));

// Map common asset folders used by home.html absolute paths like '/Images/...'
// Map asset folders from the project root (actual locations per repo structure)
app.use('/Images', express.static(path.join(projectRootDir, 'Images')));
app.use('/Video', express.static(path.join(projectRootDir, 'Video')));
app.use('/owner', express.static(ownerDir));

// Serve the main homepage on root
app.get('/', (req, res) => {
  res.sendFile(path.join(userHomeDir, 'home.html'));
});

// Utility helpers
function sanitizeIdentifier(value, fallback = 'file') {
  if (!value) {
    return fallback;
  }
  const cleaned = value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned || fallback;
}

function sanitizeFileStem(fileName) {
  if (!fileName) {
    return 'image';
  }
  const stem = fileName
    .toString()
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return stem || 'image';
}

async function uploadImageToStorage({
  imageData,
  fileName,
  bucket,
  keyPrefix = '',
  identifier = 'file'
}) {
  if (!imageData || !fileName) {
    const error = new Error('Missing image data or filename');
    error.statusCode = 400;
    throw error;
  }

  let mimeType = 'application/octet-stream';
  const mimeMatch = imageData.match(/^data:(.*?);base64,/);
  if (mimeMatch && mimeMatch[1]) {
    mimeType = mimeMatch[1].toLowerCase();
  }

  const base64Data = imageData.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const fileExtension = (fileName.split('.').pop() || '').toLowerCase();
  const extensionToMime = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    heic: 'image/heic',
    heif: 'image/heif'
  };
  const mimeToExtension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  };

  if (mimeType === 'image/jpg') {
    mimeType = 'image/jpeg';
  }

  const allowedMimes = new Set(Object.keys(mimeToExtension));
  if (!allowedMimes.has(mimeType)) {
    const mapped = extensionToMime[fileExtension];
    if (mapped) {
      mimeType = mapped;
    }
  }

  let finalExtension = fileExtension || 'bin';
  if (allowedMimes.has(mimeType)) {
    finalExtension = mimeToExtension[mimeType] || finalExtension;
  }

  const sanitizedIdentifier = sanitizeIdentifier(identifier, 'file');
  const sanitizedStem = sanitizeFileStem(fileName);
  const prefix = keyPrefix ? `${keyPrefix.replace(/\/+$/, '')}/` : '';
  const uniqueFileName = `${prefix}${sanitizedIdentifier}-${sanitizedStem}-${Date.now()}.${finalExtension}`;

  console.log(`📤 Uploading image to bucket "${bucket}" as ${uniqueFileName} (MIME: ${mimeType})`);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(uniqueFileName, buffer, {
      contentType: mimeType,
      upsert: false
    });

  if (uploadError) {
    console.error('❌ Storage upload error:', uploadError);
    const error = new Error('Failed to upload image to storage');
    error.statusCode = 500;
    error.details = uploadError;
    throw error;
  }

  const { data: urlData, error: urlError } = supabase.storage
    .from(bucket)
    .getPublicUrl(uniqueFileName);

  if (urlError) {
    console.error('❌ Error retrieving public URL:', urlError);
    const error = new Error('Failed to retrieve public URL for image');
    error.statusCode = 500;
    error.details = urlError;
    throw error;
  }

  console.log('✅ Image uploaded successfully');

  return {
    publicUrl: urlData.publicUrl,
    filePath: uniqueFileName,
    mimeType
  };
}

function normalizeVehicleId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) ? numericId : null;
  }

  return trimmed;
}

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

// Helper to generate a unique booking ID with format YY-XXXX
async function generateNextBookingId() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `${currentYear}-`;

  // Fetch latest booking_id for current year, order desc to get the highest counter
  const { data: rows, error } = await supabase
    .from('bookings')
    .select('booking_id')
    .ilike('booking_id', `${prefix}%`)
    .order('booking_id', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('⚠️ Could not query latest booking_id, defaulting to 001:', error.message);
  }

  let nextCounter = 1;
  if (rows && rows.length > 0) {
    const latestId = rows[0].booking_id || '';
    const match = latestId.match(/^(\d{2})-(\d{4,})$/);
    if (match) {
      const lastCounter = parseInt(match[2], 10) || 0;
      nextCounter = lastCounter + 1;
    }
  }

  const padded = String(nextCounter).padStart(4, '0');
  return `${prefix}${padded}`;
}

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
      booking_id, // Optional booking ID from frontend
      status = 'pending'
    } = req.body;
    
    console.log('📝 Creating new booking:', { customer_first_name, customer_last_name, customer_email, arrival_date, departure_date });
    console.log('📝 Booking ID from frontend:', booking_id);
    
    // Validate required fields based on actual schema
    if (!customer_first_name || !customer_last_name || !customer_email || !customer_contact || 
        !booking_type || !booking_preferences || !arrival_date || !departure_date || !number_of_tourist) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: customer_first_name, customer_last_name, customer_email, customer_contact, booking_type, booking_preferences, arrival_date, departure_date, number_of_tourist' 
      });
    }
    
    // Validate booking_type
    if (!['package_only', 'tour_only'].includes(booking_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking_type. Must be either "package_only" or "tour_only"' 
      });
    }
    
    // Resolve booking_id (prefer frontend value; otherwise generate)
    let resolvedBookingId = booking_id && String(booking_id).trim() ? String(booking_id).trim() : await generateNextBookingId();

    // Build booking object matching the actual database schema
    const bookingDataBase = {
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
    const optionalFields = {};
    if (package_only_id) optionalFields.package_only_id = package_only_id;
    if (hotel_id) optionalFields.hotel_id = hotel_id;
    if (hotel_nights) optionalFields.hotel_nights = hotel_nights;

    // Try insert, on duplicate key generate a new server-side ID and retry a few times
    let attempt = 0;
    const maxAttempts = 5;
    while (attempt < maxAttempts) {
      attempt += 1;
      const bookingData = { booking_id: resolvedBookingId, ...bookingDataBase, ...optionalFields };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (!error) {
        console.log('✅ Booking created successfully:', data[0]);
        return res.json({ 
          success: true, 
          message: 'Booking created successfully',
          booking: data[0]
        });
      }

      // If duplicate key, generate next ID and retry
      if (error && error.code === '23505') {
        console.warn(`⚠️ Duplicate booking_id (${resolvedBookingId}). Generating a new one and retrying...`);
        resolvedBookingId = await generateNextBookingId();
        continue;
      }

      console.error('❌ Error creating booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create booking', 
        error: error.message 
      });
    }

    return res.status(409).json({
      success: false,
      message: 'Could not allocate a unique booking ID after several attempts'
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
    
    // Get vehicle bookings for all bookings
    const bookingIds = bookings.map(b => b.booking_id);
    let vehicleBookingsData = {};
    if (bookingIds.length > 0) {
      const { data: vehicleBookings, error: vehicleBookingsError } = await supabase
        .from('booking_vehicles')
        .select('booking_id, vehicle_id, vehicle_name, rental_days, total_amount')
        .in('booking_id', bookingIds);
      
      if (!vehicleBookingsError && vehicleBookings) {
        // Get unique vehicle IDs
        const vehicleIds = [...new Set(vehicleBookings.map(vb => vb.vehicle_id).filter(id => id))];
        
        // Fetch vehicle data for all unique vehicle IDs
        let vehiclesData = {};
        if (vehicleIds.length > 0) {
          const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('vehicle_id, name, price_per_day')
            .in('vehicle_id', vehicleIds);
          
          if (!vehiclesError && vehicles) {
            vehiclesData = vehicles.reduce((acc, vehicle) => {
              acc[vehicle.vehicle_id] = vehicle;
              return acc;
            }, {});
          }
        }
        
        // Group vehicle bookings by booking_id and merge with vehicle data
        vehicleBookingsData = vehicleBookings.reduce((acc, vb) => {
          if (!acc[vb.booking_id]) {
            acc[vb.booking_id] = [];
          }
          acc[vb.booking_id].push({
            ...vb,
            vehicle: vb.vehicle_id ? vehiclesData[vb.vehicle_id] : null
          });
          return acc;
        }, {});
      }
    }
    
    // Get van rental bookings for all bookings
    let vanRentalBookingsData = {};
    if (bookingIds.length > 0) {
      // Ensure booking IDs are strings and trimmed
      const normalizedBookingIds = bookingIds.map(id => String(id).trim()).filter(id => id);
      console.log('🔍 Fetching van rental bookings for booking IDs:', normalizedBookingIds);
      
      // Also fetch all van rental bookings to debug
      const { data: allVanRentals, error: allVanRentalsError } = await supabase
        .from('bookings_van_rental')
        .select('booking_id, van_destination_id, number_of_days, total_amount, trip_type, choose_destination')
        .limit(100);
      
      if (!allVanRentalsError && allVanRentals) {
        console.log('📋 All van rental bookings in database:', allVanRentals.length);
        const uniqueBookingIds = [...new Set(allVanRentals.map(vr => vr.booking_id))];
        console.log('📋 Unique booking IDs in van_rental table:', uniqueBookingIds);
        console.log('📋 Booking IDs from bookings table:', normalizedBookingIds);
      }
      
      const { data: vanRentalBookings, error: vanRentalError } = await supabase
        .from('bookings_van_rental')
        .select('booking_id, van_destination_id, number_of_days, total_amount, trip_type, choose_destination')
        .in('booking_id', normalizedBookingIds);
      
      if (vanRentalError) {
        console.error('❌ Error fetching van rental bookings:', vanRentalError);
      } else {
        console.log('📦 Van rental bookings fetched:', vanRentalBookings?.length || 0, 'records');
        if (vanRentalBookings && vanRentalBookings.length > 0) {
          console.log('📋 Sample van rental booking:', vanRentalBookings[0]);
        }
      }
      
      if (!vanRentalError && vanRentalBookings) {
        // Get unique van destination IDs
        const vanDestinationIds = [...new Set(vanRentalBookings.map(vrb => vrb.van_destination_id).filter(id => id))];
        
        // Fetch van destination data for all unique destination IDs
        let vanDestinationsData = {};
        if (vanDestinationIds.length > 0) {
          const { data: vanDestinations, error: vanDestinationsError } = await supabase
            .from('van_destinations')
            .select('van_destination_id, destination_name')
            .in('van_destination_id', vanDestinationIds);
          
          if (!vanDestinationsError && vanDestinations) {
            vanDestinationsData = vanDestinations.reduce((acc, dest) => {
              acc[dest.van_destination_id] = dest;
              return acc;
            }, {});
          }
        }
        
        // Group van rental bookings by booking_id and merge with destination data
        // Normalize booking_id keys to ensure matching
        vanRentalBookingsData = vanRentalBookings.reduce((acc, vrb) => {
          const normalizedKey = String(vrb.booking_id).trim();
          if (!acc[normalizedKey]) {
            acc[normalizedKey] = [];
          }
          acc[normalizedKey].push({
            ...vrb,
            destination: vrb.van_destination_id ? vanDestinationsData[vrb.van_destination_id] : null
          });
          return acc;
        }, {});
        
        console.log('✅ Van rental bookings grouped by booking_id:', Object.keys(vanRentalBookingsData));
      }
    }
    
    // Get payment data for all bookings to fetch total_booking_amount
    let paymentsData = {};
    if (bookingIds.length > 0) {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('booking_id, total_booking_amount, payment_date')
        .in('booking_id', bookingIds)
        .order('payment_date', { ascending: false });
      
      if (!paymentsError && payments) {
        // Group payments by booking_id and get the latest payment's total_booking_amount
        // Since all payments for the same booking should have the same total_booking_amount,
        // we'll use the latest one
        paymentsData = payments.reduce((acc, payment) => {
          // Only store if we haven't already stored a payment for this booking
          // (since we ordered by payment_date desc, the first one we encounter is the latest)
          if (!acc[payment.booking_id]) {
            acc[payment.booking_id] = payment.total_booking_amount;
          }
          return acc;
        }, {});
      }
    }
    
    // Merge hotel, vehicle, van rental, and payment data with bookings
    const bookingsWithDetails = bookings.map(booking => {
      // Normalize booking_id for lookup
      const normalizedBookingId = String(booking.booking_id).trim();
      const vanRentals = vanRentalBookingsData[normalizedBookingId] || [];
      
      // Try without normalization as fallback
      const vanRentalsFallback = vanRentals.length === 0 ? (vanRentalBookingsData[booking.booking_id] || []) : vanRentals;
      
      if (vanRentalsFallback.length > 0) {
        console.log(`📌 Booking ${booking.booking_id} (normalized: ${normalizedBookingId}) has ${vanRentalsFallback.length} van rental(s):`, vanRentalsFallback);
      } else {
        // Debug why no match
        const availableKeys = Object.keys(vanRentalBookingsData);
        if (availableKeys.length > 0) {
          console.log(`⚠️ Booking ${booking.booking_id} (normalized: ${normalizedBookingId}) not found in van rentals. Available keys:`, availableKeys);
        }
      }
      
      return {
        ...booking,
        hotels: booking.hotel_id ? hotelsData[booking.hotel_id] : null,
        vehicle_bookings: vehicleBookingsData[booking.booking_id] || [],
        van_rental_bookings: vanRentalsFallback,
        total_booking_amount: paymentsData[booking.booking_id] || null
      };
    });
    
    console.log('✅ Bookings fetched successfully:', bookingsWithDetails?.length || 0, 'bookings');
    
    res.json({ 
      success: true, 
      bookings: bookingsWithDetails || []
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
    
    // Fetch vehicle bookings for this booking
    let vehicleBookingsData = [];
    const { data: vehicleBookings, error: vehicleBookingsError } = await supabase
      .from('booking_vehicles')
      .select('booking_id, vehicle_id, vehicle_name, rental_days, total_amount')
      .eq('booking_id', booking.booking_id);
    
    if (!vehicleBookingsError && vehicleBookings && vehicleBookings.length > 0) {
      // Get unique vehicle IDs
      const vehicleIds = [...new Set(vehicleBookings.map(vb => vb.vehicle_id).filter(id => id))];
      
      // Fetch vehicle data for all unique vehicle IDs
      let vehiclesData = {};
      if (vehicleIds.length > 0) {
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('vehicle_id, name, price_per_day')
          .in('vehicle_id', vehicleIds);
        
        if (!vehiclesError && vehicles) {
          vehiclesData = vehicles.reduce((acc, vehicle) => {
            acc[vehicle.vehicle_id] = vehicle;
            return acc;
          }, {});
        }
      }
      
      // Merge vehicle data with vehicle bookings
      vehicleBookingsData = vehicleBookings.map(vb => ({
        ...vb,
        vehicle: vb.vehicle_id ? vehiclesData[vb.vehicle_id] : null
      }));
    }
    
    // Merge hotel and vehicle data with booking
    const bookingWithDetails = {
      ...booking,
      hotels: hotelData,
      vehicle_bookings: vehicleBookingsData
    };
    
    console.log('✅ Booking details fetched successfully');
    
    res.json({ 
      success: true, 
      booking: bookingWithDetails
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
    
    // FIXED: Use 'booking_id' instead of 'id' to match actual table schema
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('booking_id', id);
    
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
      vehicle_id,
      vehicle_name, 
      rental_days,
      total_amount
    } = req.body;
    
    console.log('📝 Creating vehicle booking:', { booking_id, vehicle_id, vehicle_name, rental_days });
    
    // Debug: Log the vehicle_id value
    if (vehicle_id) {
      console.log('✅ Vehicle ID provided:', vehicle_id);
    } else {
      console.log('⚠️ No vehicle_id provided, using vehicle_name fallback');
    }
    
    if (!booking_id || !rental_days) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, rental_days' 
      });
    }
    
    // Require vehicle_id to be provided (NOT NULL constraint)
    if (!vehicle_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'vehicle_id is required - vehicle must be found in database' 
      });
    }
    
    // Build booking data - vehicle_id is required
    const bookingData = {
      booking_id,
      vehicle_id, // Required - will always be provided
      rental_days,
      total_amount: total_amount || 0
    };
    
    // Always include vehicle_name for reference
    if (vehicle_name) {
      bookingData.vehicle_name = vehicle_name;
    }
    
    console.log('✅ Storing vehicle_id:', vehicle_id);
    
    const { data, error } = await supabase
      .from('booking_vehicles')
      .insert([bookingData])
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
      van_destination_id,
      number_of_days,
      rental_days, 
      total_amount,
      total_price,
      trip_type,
      choose_destination,
      rental_start_date,
      rental_end_date,
      notes
    } = req.body;
    
    console.log('📝 Van rental booking request received');
    console.log('📦 Request body:', req.body);
    
    // Support both old format (destination_id) and new format (van_destination_id)
    const finalDestinationId = van_destination_id || destination_id;
    const finalDays = number_of_days || rental_days;
    const finalAmount = total_amount || total_price || 0;
    
    console.log('🔑 Parsed values:', { 
      booking_id, 
      van_destination_id: finalDestinationId, 
      number_of_days: finalDays, 
      total_amount: finalAmount 
    });
    
    if (!booking_id || !finalDestinationId || !finalDays) {
      console.error('❌ Missing required fields');
      console.error('Validation:', { 
        has_booking_id: !!booking_id, 
        has_destination_id: !!finalDestinationId, 
        has_days: !!finalDays 
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, van_destination_id (or destination_id), number_of_days (or rental_days)',
        received: { booking_id, van_destination_id: finalDestinationId, number_of_days: finalDays }
      });
    }
    
    const insertData = {
      booking_id,
      van_destination_id: finalDestinationId,
      number_of_days: finalDays,
      total_amount: finalAmount,
      trip_type: trip_type || 'oneway',
      choose_destination: choose_destination || ''
    };
    
    console.log('📤 Inserting to database:', insertData);
    
    const { data, error } = await supabase
      .from('bookings_van_rental')
      .insert([insertData])
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create van rental booking', 
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details
      });
    }
    
    console.log('✅ Van rental booking created successfully:', data[0]);
    
    res.json({ 
      success: true, 
      message: 'Van rental booking created successfully',
      van_rental_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Van rental booking creation error:', error);
    console.error('Error stack:', error.stack);
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

// Helper function to fix vehicle image URLs to include vehicles/ folder
function fixVehicleImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return url;
  }
  
  // If URL already contains /vehicles/, return as is
  if (url.includes('/vehicles/')) {
    return url;
  }
  
  // Extract the filename from the URL
  // Format: https://...supabase.co/storage/v1/object/public/vehicle-rental/filename.jpg
  // Should become: https://...supabase.co/storage/v1/object/public/vehicle-rental/vehicles/filename.jpg
  const bucketName = 'vehicle-rental';
  const bucketPattern = new RegExp(`/${bucketName}/([^/]+)$`);
  const match = url.match(bucketPattern);
  
  if (match && match[1]) {
    const filename = match[1];
    // Reconstruct URL with vehicles/ folder
    const baseUrl = url.substring(0, url.indexOf(`/${bucketName}/`));
    const newUrl = `${baseUrl}/${bucketName}/vehicles/${filename}`;
    return newUrl;
  }
  
  // If pattern doesn't match, return original URL
  return url;
}

// Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    console.log('📊 Fetching vehicles...');
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching vehicles:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch vehicles', 
        error: error.message 
      });
    }
    
    // Fix image URLs to include vehicles/ folder path
    const vehicles = (data || []).map(vehicle => {
      if (vehicle.vehicle_image) {
        vehicle.vehicle_image = fixVehicleImageUrl(vehicle.vehicle_image);
      }
      return vehicle;
    });
    
    if (vehicles.length > 0) {
      console.log('✅ Vehicles fetched successfully:', vehicles.length, 'vehicles');
    } else {
      console.log('✅ Vehicles fetched successfully: 0 vehicles');
    }
    
    res.json({ 
      success: true, 
      vehicles: vehicles
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

// Create new vehicle
app.post('/api/vehicles', async (req, res) => {
  try {
    const { name, price_per_day, description } = req.body;

    console.log('➕ Creating vehicle:', { name, price_per_day, description });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle name is required'
      });
    }

    if (price_per_day === undefined || price_per_day === null) {
      return res.status(400).json({
        success: false,
        message: 'Price per day is required'
      });
    }

    const parsedPrice = parseFloat(price_per_day);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'price_per_day must be a non-negative number'
      });
    }

    const insertData = {
      name: name.trim(),
      price_per_day: parsedPrice,
      vehicle_image: '' // Provide empty string as default to satisfy NOT NULL constraint
    };

    if (description !== undefined && description !== null) {
      insertData.description = description;
    }

    console.log('📝 Inserting vehicle:', insertData);

    const { data, error } = await supabase
      .from('vehicles')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create vehicle',
        error: error.message
      });
    }

    console.log('✅ Vehicle created successfully:', data[0]);

    res.json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle: data[0]
    });
  } catch (error) {
    console.error('❌ Vehicle creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update vehicle details
app.put('/api/vehicles/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const normalizedVehicleId = normalizeVehicleId(vehicleId);

    if (normalizedVehicleId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const { name, price_per_day, description, vehicle_image } = req.body;
    const updates = {};

    if (name !== undefined) {
      updates.name = name.toString().trim();
    }

    if (price_per_day !== undefined) {
      const parsedPrice = parseFloat(price_per_day);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'price_per_day must be a non-negative number'
        });
      }
      updates.price_per_day = parsedPrice;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (vehicle_image !== undefined) {
      updates.vehicle_image = vehicle_image;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const filterColumn = 'vehicle_id';
    const filterValue = normalizedVehicleId;

    console.log('🛠️ Updating vehicle:', normalizedVehicleId, updates, `(filter column: ${filterColumn})`);

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq(filterColumn, filterValue)
      .select('*');

    if (error) {
      console.error('❌ Error updating vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update vehicle',
        error: error.message
      });
    }

    console.log('✅ Vehicle update result:', data);

    // Fix image URL if present
    const updatedVehicle = data[0];
    if (updatedVehicle && updatedVehicle.vehicle_image) {
      updatedVehicle.vehicle_image = fixVehicleImageUrl(updatedVehicle.vehicle_image);
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    console.error('❌ Vehicle update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Upload vehicle image and persist URL
app.post('/api/vehicles/:vehicleId/upload-image', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const normalizedVehicleId = normalizeVehicleId(vehicleId);
    const { imageData, fileName } = req.body;

    if (normalizedVehicleId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    const filterColumn = 'vehicle_id';
    const filterValue = normalizedVehicleId;

    const { publicUrl, filePath } = await uploadImageToStorage({
      imageData,
      fileName,
      bucket: 'vehicle-rental',
      keyPrefix: 'vehicles',
      identifier: `vehicle-${normalizedVehicleId}`
    });

    const { data, error } = await supabase
      .from('vehicles')
      .update({ vehicle_image: publicUrl })
      .eq(filterColumn, filterValue)
      .select('*');

    if (error) {
      console.error('❌ Error saving vehicle image URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store vehicle image URL',
        error: error.message
      });
    }

    console.log('✅ Vehicle image update result:', data);

    res.json({
      success: true,
      message: 'Vehicle image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      vehicle: data[0]
    });
  } catch (error) {
    console.error('❌ Vehicle image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
});

// Delete vehicle
app.delete('/api/vehicles/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const normalizedVehicleId = normalizeVehicleId(vehicleId);

    if (normalizedVehicleId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const filterColumn = 'vehicle_id';
    const filterValue = normalizedVehicleId;

    console.log('🗑️ Deleting vehicle:', normalizedVehicleId);

    // First, check if vehicle exists and get its image URL for cleanup
    const { data: existingVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('vehicle_id, vehicle_image, name')
      .eq(filterColumn, filterValue)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking vehicle existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify vehicle before deletion',
        error: fetchError.message
      });
    }

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Delete the vehicle
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq(filterColumn, filterValue);

    if (deleteError) {
      console.error('❌ Error deleting vehicle:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle',
        error: deleteError.message
      });
    }

    // Optionally delete the image from storage (commented out for safety)
    // If you want to delete images when vehicle is deleted, uncomment this:
    /*
    if (existingVehicle.vehicle_image) {
      try {
        const imagePath = existingVehicle.vehicle_image.split('/').slice(-2).join('/');
        await supabase.storage
          .from('vehicle-rental')
          .remove([imagePath]);
      } catch (storageError) {
        console.warn('⚠️ Could not delete vehicle image from storage:', storageError);
      }
    }
    */

    console.log('✅ Vehicle deleted successfully:', existingVehicle.name || normalizedVehicleId);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      deletedVehicle: {
        vehicle_id: existingVehicle.vehicle_id,
        name: existingVehicle.name
      }
    });
  } catch (error) {
    console.error('❌ Vehicle deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Helper function to fix diving image URLs to include diving/ folder
function fixDivingImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return url;
  }
  
  // If URL already contains /diving/, return as is
  if (url.includes('/diving/')) {
    return url;
  }
  
  // Extract the filename from the URL
  // Format: https://...supabase.co/storage/v1/object/public/diving-image/filename.jpg
  // Should become: https://...supabase.co/storage/v1/object/public/diving-image/diving/filename.jpg
  const bucketName = 'diving-image';
  const bucketPattern = new RegExp(`/${bucketName}/([^/]+)$`);
  const match = url.match(bucketPattern);
  
  if (match && match[1]) {
    const filename = match[1];
    // Reconstruct URL with diving/ folder
    const baseUrl = url.substring(0, url.indexOf(`/${bucketName}/`));
    const newUrl = `${baseUrl}/${bucketName}/diving/${filename}`;
    return newUrl;
  }
  
  // If pattern doesn't match, return original URL
  return url;
}

// Helper function to normalize diving ID (similar to normalizeVehicleId)
function normalizeDivingId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) ? numericId : null;
  }

  return trimmed;
}

// Get all diving records
app.get('/api/diving', async (req, res) => {
  try {
    console.log('📊 Fetching diving records...');
    
    const { data, error } = await supabase
      .from('diving')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching diving records:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch diving records', 
        error: error.message 
      });
    }
    
    // Fix image URLs to include diving/ folder path
    const divingRecords = (data || []).map(diving => {
      if (diving.diving_image) {
        diving.diving_image = fixDivingImageUrl(diving.diving_image);
      }
      return diving;
    });
    
    if (divingRecords.length > 0) {
      console.log('✅ Diving records fetched successfully:', divingRecords.length, 'records');
    } else {
      console.log('✅ Diving records fetched successfully: 0 records');
    }
    
    res.json({ 
      success: true, 
      diving: divingRecords
    });
    
  } catch (error) {
    console.error('❌ Diving records fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create new diving record
app.post('/api/diving', async (req, res) => {
  try {
    const { name, price_per_head } = req.body;

    console.log('➕ Creating diving record:', { name, price_per_head });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Diving name is required'
      });
    }

    if (price_per_head === undefined || price_per_head === null) {
      return res.status(400).json({
        success: false,
        message: 'Price per head is required'
      });
    }

    const parsedPrice = parseFloat(price_per_head);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'price_per_head must be a non-negative number'
      });
    }

    const insertData = {
      name: name.trim(),
      price_per_head: parsedPrice,
      diving_image: '' // Provide empty string as default to satisfy NOT NULL constraint
    };

    console.log('📝 Inserting diving record:', insertData);

    const { data, error } = await supabase
      .from('diving')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating diving record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create diving record',
        error: error.message
      });
    }

    console.log('✅ Diving record created successfully:', data[0]);

    res.json({
      success: true,
      message: 'Diving record created successfully',
      diving: data[0]
    });
  } catch (error) {
    console.error('❌ Diving record creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update diving record details
app.put('/api/diving/:divingId', async (req, res) => {
  try {
    const { divingId } = req.params;
    const normalizedDivingId = normalizeDivingId(divingId);

    if (normalizedDivingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving ID'
      });
    }

    const { name, price_per_head, diving_image } = req.body;
    const updates = {};

    if (name !== undefined) {
      updates.name = name.toString().trim();
    }

    if (price_per_head !== undefined) {
      const parsedPrice = parseFloat(price_per_head);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'price_per_head must be a non-negative number'
        });
      }
      updates.price_per_head = parsedPrice;
    }

    if (diving_image !== undefined) {
      updates.diving_image = diving_image;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const filterColumn = 'diving_id';
    const filterValue = normalizedDivingId;

    console.log('🛠️ Updating diving record:', normalizedDivingId, updates, `(filter column: ${filterColumn})`);

    const { data, error } = await supabase
      .from('diving')
      .update(updates)
      .eq(filterColumn, filterValue)
      .select('*');

    if (error) {
      console.error('❌ Error updating diving record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update diving record',
        error: error.message
      });
    }

    console.log('✅ Diving record update result:', data);

    // Fix image URL if present
    const updatedDiving = data[0];
    if (updatedDiving && updatedDiving.diving_image) {
      updatedDiving.diving_image = fixDivingImageUrl(updatedDiving.diving_image);
    }

    res.json({
      success: true,
      message: 'Diving record updated successfully',
      diving: updatedDiving
    });
  } catch (error) {
    console.error('❌ Diving record update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Upload diving image and persist URL
app.post('/api/diving/:divingId/upload-image', async (req, res) => {
  try {
    const { divingId } = req.params;
    const normalizedDivingId = normalizeDivingId(divingId);
    const { imageData, fileName } = req.body;

    if (normalizedDivingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving ID'
      });
    }

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    const filterColumn = 'diving_id';
    const filterValue = normalizedDivingId;

    const { publicUrl, filePath } = await uploadImageToStorage({
      imageData,
      fileName,
      bucket: 'diving-image',
      keyPrefix: 'diving',
      identifier: `diving-${normalizedDivingId}`
    });

    const { data, error } = await supabase
      .from('diving')
      .update({ diving_image: publicUrl })
      .eq(filterColumn, filterValue)
      .select('*');

    if (error) {
      console.error('❌ Error saving diving image URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store diving image URL',
        error: error.message
      });
    }

    console.log('✅ Diving image update result:', data);

    res.json({
      success: true,
      message: 'Diving image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      diving: data[0]
    });
  } catch (error) {
    console.error('❌ Diving image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
});

// Delete diving record
app.delete('/api/diving/:divingId', async (req, res) => {
  try {
    const { divingId } = req.params;
    const normalizedDivingId = normalizeDivingId(divingId);

    if (normalizedDivingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving ID'
      });
    }

    const filterColumn = 'diving_id';
    const filterValue = normalizedDivingId;

    console.log('🗑️ Deleting diving record:', normalizedDivingId);

    // First, check if diving record exists and get its image URL for cleanup
    const { data: existingDiving, error: fetchError } = await supabase
      .from('diving')
      .select('diving_id, diving_image, name')
      .eq(filterColumn, filterValue)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking diving record existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify diving record before deletion',
        error: fetchError.message
      });
    }

    if (!existingDiving) {
      return res.status(404).json({
        success: false,
        message: 'Diving record not found'
      });
    }

    // Delete the diving record
    const { error: deleteError } = await supabase
      .from('diving')
      .delete()
      .eq(filterColumn, filterValue);

    if (deleteError) {
      console.error('❌ Error deleting diving record:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete diving record',
        error: deleteError.message
      });
    }

    console.log('✅ Diving record deleted successfully:', existingDiving.name || normalizedDivingId);

    res.json({
      success: true,
      message: 'Diving record deleted successfully',
      deletedDiving: {
        diving_id: existingDiving.diving_id,
        name: existingDiving.name
      }
    });
  } catch (error) {
    console.error('❌ Diving record deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

function normalizeQrcodeId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(trimmed)) {
    return trimmed; // Return UUID as-is
  }

  // Also support numeric IDs if they exist
  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  }

  return null;
}

// Get all QRCode records
app.get('/api/qrcode', async (req, res) => {
  try {
    console.log('📊 Fetching QRCode records...');
    
    const { data, error } = await supabase
      .from('qrcode')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching QRCode records:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch QRCode records', 
        error: error.message 
      });
    }
    
    if (data && data.length > 0) {
      console.log('✅ QRCode records fetched successfully:', data.length, 'records');
    } else {
      console.log('✅ QRCode records fetched successfully: 0 records');
    }
    
    res.json({ 
      success: true, 
      qrcode: data || []
    });
    
  } catch (error) {
    console.error('❌ QRCode records fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create new QRCode record
app.post('/api/qrcode', async (req, res) => {
  try {
    const { name } = req.body;

    console.log('➕ Creating QRCode record:', { name });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const validNames = ['GCash', 'Paymaya', 'Online Banking'];
    if (!validNames.includes(name)) {
      return res.status(400).json({
        success: false,
        message: `Name must be one of: ${validNames.join(', ')}`
      });
    }

    const insertData = {
      name: name.trim(),
      qrcode_image: '' // Provide empty string as default to satisfy NOT NULL constraint
    };

    console.log('📝 Inserting QRCode record:', insertData);

    const { data, error } = await supabase
      .from('qrcode')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating QRCode record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create QRCode record',
        error: error.message
      });
    }

    console.log('✅ QRCode record created successfully:', data[0]);

    res.json({
      success: true,
      message: 'QRCode record created successfully',
      qrcode: data[0]
    });
  } catch (error) {
    console.error('❌ QRCode record creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update QRCode record details
app.put('/api/qrcode/:qrcodeId', async (req, res) => {
  try {
    const { qrcodeId } = req.params;
    const normalizedQrcodeId = normalizeQrcodeId(qrcodeId);

    if (normalizedQrcodeId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QRCode ID'
      });
    }

    const { name, qrcode_image } = req.body;
    const updates = {};

    if (name !== undefined) {
      const validNames = ['GCash', 'Paymaya', 'Online Banking'];
      if (!validNames.includes(name)) {
        return res.status(400).json({
          success: false,
          message: `Name must be one of: ${validNames.join(', ')}`
        });
      }
      updates.name = name.toString().trim();
    }

    if (qrcode_image !== undefined) {
      updates.qrcode_image = qrcode_image;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const filterColumn = 'qrcode_id';
    const filterValue = normalizedQrcodeId;

    console.log('🛠️ Updating QRCode record:', normalizedQrcodeId, updates, `(filter column: ${filterColumn})`);

    const { data, error } = await supabase
      .from('qrcode')
      .update(updates)
      .eq(filterColumn, filterValue)
      .select('*');

    if (error) {
      console.error('❌ Error updating QRCode record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update QRCode record',
        error: error.message
      });
    }

    console.log('✅ QRCode record update result:', data);

    res.json({
      success: true,
      message: 'QRCode record updated successfully',
      qrcode: data[0]
    });
  } catch (error) {
    console.error('❌ QRCode record update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Upload QRCode image and persist URL
app.post('/api/qrcode/:qrcodeId/upload-image', async (req, res) => {
  try {
    const { qrcodeId } = req.params;
    const normalizedQrcodeId = normalizeQrcodeId(qrcodeId);
    const { imageData, fileName } = req.body;

    console.log('📤 QRCode image upload request:', {
      qrcodeId,
      normalizedQrcodeId,
      fileName: fileName || 'missing',
      hasImageData: !!imageData
    });

    if (normalizedQrcodeId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QRCode ID'
      });
    }

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    // Verify QRCode exists before uploading
    const { data: existingQrcode, error: checkError } = await supabase
      .from('qrcode')
      .select('qrcode_id, name')
      .eq('qrcode_id', normalizedQrcodeId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking QRCode existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify QRCode record',
        error: checkError.message
      });
    }

    if (!existingQrcode) {
      return res.status(404).json({
        success: false,
        message: 'QRCode record not found'
      });
    }

    console.log('✅ QRCode record found:', existingQrcode.name);

    const filterColumn = 'qrcode_id';
    const filterValue = normalizedQrcodeId;

    let publicUrl, filePath;
    try {
      const uploadResult = await uploadImageToStorage({
        imageData,
        fileName,
        bucket: 'qrcode-image',
        keyPrefix: 'qrcode',
        identifier: `qrcode-${normalizedQrcodeId}`
      });
      publicUrl = uploadResult.publicUrl;
      filePath = uploadResult.filePath;
      console.log('✅ Image uploaded to storage:', { publicUrl, filePath });
    } catch (uploadError) {
      console.error('❌ Storage upload failed:', uploadError);
      
      // Check if it's a bucket error
      if (uploadError.details?.message?.includes('Bucket') || uploadError.message?.includes('Bucket')) {
        return res.status(500).json({
          success: false,
          message: 'Storage bucket "qrcode-image" not found. Please create it in Supabase Storage with public access.',
          error: uploadError.details?.message || uploadError.message
        });
      }
      
      throw uploadError;
    }

    const { data, error } = await supabase
      .from('qrcode')
      .update({ qrcode_image: publicUrl })
      .eq(filterColumn, filterValue)
      .select('*');

    if (error) {
      console.error('❌ Error saving QRCode image URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store QRCode image URL in database',
        error: error.message
      });
    }

    console.log('✅ QRCode image update result:', data);

    res.json({
      success: true,
      message: 'QRCode image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      qrcode: data[0]
    });
  } catch (error) {
    console.error('❌ QRCode image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
});

// Delete QRCode record
app.delete('/api/qrcode/:qrcodeId', async (req, res) => {
  try {
    const { qrcodeId } = req.params;
    const normalizedQrcodeId = normalizeQrcodeId(qrcodeId);

    if (normalizedQrcodeId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QRCode ID'
      });
    }

    const filterColumn = 'qrcode_id';
    const filterValue = normalizedQrcodeId;

    console.log('🗑️ Deleting QRCode record:', normalizedQrcodeId);

    // First, check if QRCode record exists and get its name for response
    const { data: existingQrcode, error: fetchError } = await supabase
      .from('qrcode')
      .select('qrcode_id, name')
      .eq(filterColumn, filterValue)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking QRCode record existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify QRCode record before deletion',
        error: fetchError.message
      });
    }

    if (!existingQrcode) {
      return res.status(404).json({
        success: false,
        message: 'QRCode record not found'
      });
    }

    // Delete the QRCode record
    const { error: deleteError } = await supabase
      .from('qrcode')
      .delete()
      .eq(filterColumn, filterValue);

    if (deleteError) {
      console.error('❌ Error deleting QRCode record:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete QRCode record',
        error: deleteError.message
      });
    }

    console.log('✅ QRCode record deleted successfully:', existingQrcode.name || normalizedQrcodeId);

    res.json({
      success: true,
      message: 'QRCode record deleted successfully',
      deletedQrcode: {
        qrcode_id: existingQrcode.qrcode_id,
        name: existingQrcode.name
      }
    });
  } catch (error) {
    console.error('❌ QRCode record deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get QR codes for payment methods (settings endpoint for frontend)
app.get('/api/settings/qr-codes', async (req, res) => {
  try {
    console.log('📊 Fetching QR codes for payment methods...');
    
    const { data, error } = await supabase
      .from('qrcode')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching QR codes:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch QR codes', 
        error: error.message 
      });
    }
    
    // Map QRCode table data to expected frontend format
    // Map: 'GCash' -> 'gcash', 'Paymaya' -> 'paymaya', 'Online Banking' -> 'banking'
    const nameToPaymentMethod = {
      'GCash': 'gcash',
      'Paymaya': 'paymaya',
      'Online Banking': 'banking'
    };
    
    const qrCodes = (data || []).map(qrcode => ({
      payment_method: nameToPaymentMethod[qrcode.name] || qrcode.name.toLowerCase(),
      qr_image_url: qrcode.qrcode_image || '',
      name: qrcode.name,
      qrcode_id: qrcode.qrcode_id
    }));
    
    console.log('✅ QR codes fetched successfully:', qrCodes.length, 'codes');
    
    res.json({ 
      success: true, 
      qr_codes: qrCodes
    });
    
  } catch (error) {
    console.error('❌ QR codes fetch error:', error);
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

// Create van destination
app.post('/api/van-destinations', async (req, res) => {
  try {
    const { location_type, destination_name, oneway_price, roundtrip_price } = req.body;

    console.log('➕ Creating van destination:', { location_type, destination_name, oneway_price, roundtrip_price });

    if (!destination_name) {
      return res.status(400).json({
        success: false,
        message: 'Destination name is required'
      });
    }

    const insertData = {
      destination_name: destination_name.trim()
    };

    // Validate and add one-way price (default to 0 if not provided)
    if (oneway_price !== undefined && oneway_price !== null && oneway_price !== '') {
      const parsedOnewayPrice = parseFloat(oneway_price);
      if (Number.isNaN(parsedOnewayPrice) || parsedOnewayPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'oneway_price must be a non-negative number'
        });
      }
      insertData.oneway_price = parsedOnewayPrice;
    } else {
      // Set to 0 if no input provided
      insertData.oneway_price = 0;
    }

    // Validate and add round-trip price (default to 0 if not provided)
    if (roundtrip_price !== undefined && roundtrip_price !== null && roundtrip_price !== '') {
      const parsedRoundtripPrice = parseFloat(roundtrip_price);
      if (Number.isNaN(parsedRoundtripPrice) || parsedRoundtripPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'roundtrip_price must be a non-negative number'
        });
      }
      insertData.roundtrip_price = parsedRoundtripPrice;
    } else {
      // Set to 0 if no input provided
      insertData.roundtrip_price = 0;
    }

    if (location_type !== undefined && location_type !== null) {
      insertData.location_type = location_type.trim();
    }

    console.log('📝 Inserting van destination:', insertData);

    const { data, error } = await supabase
      .from('van_destinations')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating van destination:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create van destination',
        error: error.message
      });
    }

    console.log('✅ Van destination created successfully:', data[0]);

    res.json({
      success: true,
      message: 'Van destination created successfully',
      destination: data[0]
    });
  } catch (error) {
    console.error('❌ Van destination creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update van destination
app.put('/api/van-destinations/:destinationId', async (req, res) => {
  try {
    const { destinationId } = req.params;

    if (!destinationId || destinationId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid van destination ID'
      });
    }

    const { location_type, destination_name, oneway_price, roundtrip_price } = req.body;
    const updates = {};

    if (location_type !== undefined) {
      updates.location_type = location_type !== null ? location_type.toString().trim() : null;
    }

    if (destination_name !== undefined) {
      updates.destination_name = destination_name.toString().trim();
    }

    if (oneway_price !== undefined) {
      const parsedPrice = parseFloat(oneway_price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'oneway_price must be a non-negative number'
        });
      }
      updates.oneway_price = parsedPrice;
    }

    if (roundtrip_price !== undefined) {
      const parsedPrice = parseFloat(roundtrip_price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'roundtrip_price must be a non-negative number'
        });
      }
      updates.roundtrip_price = parsedPrice;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const filterColumn = 'van_destination_id';
    const filterValue = destinationId.trim();

    console.log('🛠️ Updating van destination:', filterValue, updates);

    const { data, error } = await supabase
      .from('van_destinations')
      .update(updates)
      .eq(filterColumn, filterValue)
      .select('*');

    if (error) {
      console.error('❌ Error updating van destination:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update van destination',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Van destination not found'
      });
    }

    console.log('✅ Van destination update result:', data);

    res.json({
      success: true,
      message: 'Van destination updated successfully',
      destination: data[0]
    });
  } catch (error) {
    console.error('❌ Van destination update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete van destination
app.delete('/api/van-destinations/:destinationId', async (req, res) => {
  try {
    const { destinationId } = req.params;

    if (!destinationId || destinationId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid van destination ID'
      });
    }

    const filterColumn = 'van_destination_id';
    const filterValue = destinationId.trim();

    console.log('🗑️ Deleting van destination:', filterValue);

    // First, check if destination exists
    const { data: existingDestination, error: fetchError } = await supabase
      .from('van_destinations')
      .select('van_destination_id, destination_name')
      .eq(filterColumn, filterValue)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking van destination existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify van destination before deletion',
        error: fetchError.message
      });
    }

    if (!existingDestination) {
      return res.status(404).json({
        success: false,
        message: 'Van destination not found'
      });
    }

    // Delete the destination
    const { error: deleteError } = await supabase
      .from('van_destinations')
      .delete()
      .eq(filterColumn, filterValue);

    if (deleteError) {
      console.error('❌ Error deleting van destination:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete van destination',
        error: deleteError.message
      });
    }

    console.log('✅ Van destination deleted successfully:', existingDestination.destination_name || filterValue);

    res.json({
      success: true,
      message: 'Van destination deleted successfully',
      deletedDestination: {
        van_destination_id: existingDestination.van_destination_id,
        destination_name: existingDestination.destination_name
      }
    });
  } catch (error) {
    console.error('❌ Van destination deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Helper function to normalize tour ID
function normalizeTourId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) ? numericId : null;
  }

  return trimmed;
}

// Get all tours with pricing and images
app.get('/api/tours', async (req, res) => {
  try {
    console.log('📊 Fetching tours...');
    
    const { data: tours, error: toursError } = await supabase
      .from('tour_only')
      .select('*')
      .order('category', { ascending: true });
    
    if (toursError) {
      console.error('❌ Error fetching tours:', toursError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tours', 
        error: toursError.message 
      });
    }
    
    if (!tours || tours.length === 0) {
      console.log('✅ Tours fetched successfully: 0 tours');
      return res.json({ 
        success: true, 
        tours: []
      });
    }
    
    // Fetch pricing and images for each tour
    const tourIds = tours.map(t => t.tour_only_id);
    
    const { data: pricing, error: pricingError } = await supabase
      .from('tour_pricing')
      .select('*')
      .in('tour_only_id', tourIds)
      .order('min_tourist', { ascending: true });
    
    if (pricingError) {
      console.error('❌ Error fetching tour pricing:', pricingError);
    }
    
    const { data: images, error: imagesError } = await supabase
      .from('tour_images')
      .select('*')
      .in('tour_only_id', tourIds)
      .order('image_id', { ascending: true });
    
    if (imagesError) {
      console.error('❌ Error fetching tour images:', imagesError);
    }
    
    // Group pricing and images by tour_only_id
    const pricingByTour = {};
    (pricing || []).forEach(p => {
      if (!pricingByTour[p.tour_only_id]) {
        pricingByTour[p.tour_only_id] = [];
      }
      pricingByTour[p.tour_only_id].push(p);
    });
    
    const imagesByTour = {};
    (images || []).forEach(img => {
      if (!imagesByTour[img.tour_only_id]) {
        imagesByTour[img.tour_only_id] = [];
      }
      imagesByTour[img.tour_only_id].push(img);
    });
    
    // Combine tours with their pricing and images
    const toursWithDetails = tours.map(tour => ({
      ...tour,
      pricing: pricingByTour[tour.tour_only_id] || [],
      images: imagesByTour[tour.tour_only_id] || []
    }));
    
    console.log('✅ Tours fetched successfully:', toursWithDetails.length, 'tours');
    
    res.json({ 
      success: true, 
      tours: toursWithDetails
    });
    
  } catch (error) {
    console.error('❌ Tours fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create new tour
app.post('/api/tours', async (req, res) => {
  try {
    const { category } = req.body;

    console.log('➕ Creating tour:', { category });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const validCategories = ['Inland Tour', 'Snorkeling Tour', 'Island Tour'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    const insertData = {
      category: category.trim()
    };

    console.log('📝 Inserting tour:', insertData);

    const { data, error } = await supabase
      .from('tour_only')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating tour:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create tour',
        error: error.message
      });
    }

    const newTour = data[0];
    
    // Return tour with empty pricing and images arrays
    const tourWithDetails = {
      ...newTour,
      pricing: [],
      images: []
    };

    console.log('✅ Tour created successfully:', newTour.tour_only_id);

    res.json({
      success: true,
      message: 'Tour created successfully',
      tour: tourWithDetails
    });
  } catch (error) {
    console.error('❌ Tour creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update tour category
app.put('/api/tours/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const { category } = req.body;

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const validCategories = ['Inland Tour', 'Snorkeling Tour', 'Island Tour'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    console.log('🛠️ Updating tour:', normalizedTourId, { category });

    const { data, error } = await supabase
      .from('tour_only')
      .update({ category: category.trim() })
      .eq('tour_only_id', normalizedTourId)
      .select('*');

    if (error) {
      console.error('❌ Error updating tour:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update tour',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const updatedTour = data[0];

    // Fetch related pricing and images
    const { data: pricing } = await supabase
      .from('tour_pricing')
      .select('*')
      .eq('tour_only_id', normalizedTourId)
      .order('min_tourist', { ascending: true });

    const { data: images } = await supabase
      .from('tour_images')
      .select('*')
      .eq('tour_only_id', normalizedTourId)
      .order('image_id', { ascending: true });

    const tourWithDetails = {
      ...updatedTour,
      pricing: pricing || [],
      images: images || []
    };

    console.log('✅ Tour updated successfully');

    res.json({
      success: true,
      message: 'Tour updated successfully',
      tour: tourWithDetails
    });
  } catch (error) {
    console.error('❌ Tour update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete tour (cascade delete pricing and images)
app.delete('/api/tours/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }

    console.log('🗑️ Deleting tour:', normalizedTourId);

    // First, check if tour exists
    const { data: existingTour, error: fetchError } = await supabase
      .from('tour_only')
      .select('tour_only_id, category')
      .eq('tour_only_id', normalizedTourId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking tour existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify tour before deletion',
        error: fetchError.message
      });
    }

    if (!existingTour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Delete related pricing and images first (cascade)
    const { error: deletePricingError } = await supabase
      .from('tour_pricing')
      .delete()
      .eq('tour_only_id', normalizedTourId);

    if (deletePricingError) {
      console.warn('⚠️ Error deleting tour pricing:', deletePricingError);
    }

    const { error: deleteImagesError } = await supabase
      .from('tour_images')
      .delete()
      .eq('tour_only_id', normalizedTourId);

    if (deleteImagesError) {
      console.warn('⚠️ Error deleting tour images:', deleteImagesError);
    }

    // Delete the tour
    const { error: deleteError } = await supabase
      .from('tour_only')
      .delete()
      .eq('tour_only_id', normalizedTourId);

    if (deleteError) {
      console.error('❌ Error deleting tour:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete tour',
        error: deleteError.message
      });
    }

    console.log('✅ Tour deleted successfully:', normalizedTourId);

    res.json({
      success: true,
      message: 'Tour deleted successfully',
      deletedTour: {
        tour_only_id: existingTour.tour_only_id,
        category: existingTour.category
      }
    });
  } catch (error) {
    console.error('❌ Tour deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add pricing tier to tour
app.post('/api/tours/:tourId/pricing', async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const { min_tourist, max_tourist, price_per_head } = req.body;

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }

    if (min_tourist === undefined || max_tourist === undefined || price_per_head === undefined) {
      return res.status(400).json({
        success: false,
        message: 'min_tourist, max_tourist, and price_per_head are required'
      });
    }

    const minTourist = parseInt(min_tourist);
    const maxTourist = parseInt(max_tourist);
    const pricePerHead = parseFloat(price_per_head);

    if (Number.isNaN(minTourist) || minTourist < 1) {
      return res.status(400).json({
        success: false,
        message: 'min_tourist must be a positive integer'
      });
    }

    if (Number.isNaN(maxTourist) || maxTourist < 1) {
      return res.status(400).json({
        success: false,
        message: 'max_tourist must be a positive integer'
      });
    }

    if (minTourist > maxTourist) {
      return res.status(400).json({
        success: false,
        message: 'min_tourist must be less than or equal to max_tourist'
      });
    }

    if (Number.isNaN(pricePerHead) || pricePerHead < 0) {
      return res.status(400).json({
        success: false,
        message: 'price_per_head must be a non-negative number'
      });
    }

    const insertData = {
      tour_only_id: normalizedTourId,
      min_tourist: minTourist,
      max_tourist: maxTourist,
      price_per_head: pricePerHead
    };

    console.log('📝 Adding pricing tier:', insertData);

    const { data, error } = await supabase
      .from('tour_pricing')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error adding pricing tier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add pricing tier',
        error: error.message
      });
    }

    console.log('✅ Pricing tier added successfully');

    res.json({
      success: true,
      message: 'Pricing tier added successfully',
      pricing: data[0]
    });
  } catch (error) {
    console.error('❌ Pricing tier addition error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update pricing tier
app.put('/api/tours/:tourId/pricing/:pricingId', async (req, res) => {
  try {
    const { tourId, pricingId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const normalizedPricingId = normalizeTourId(pricingId);
    const { min_tourist, max_tourist, price_per_head } = req.body;

    if (normalizedTourId === null || normalizedPricingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID or pricing ID'
      });
    }

    const updates = {};

    if (min_tourist !== undefined) {
      const minTourist = parseInt(min_tourist);
      if (Number.isNaN(minTourist) || minTourist < 1) {
        return res.status(400).json({
          success: false,
          message: 'min_tourist must be a positive integer'
        });
      }
      updates.min_tourist = minTourist;
    }

    if (max_tourist !== undefined) {
      const maxTourist = parseInt(max_tourist);
      if (Number.isNaN(maxTourist) || maxTourist < 1) {
        return res.status(400).json({
          success: false,
          message: 'max_tourist must be a positive integer'
        });
      }
      updates.max_tourist = maxTourist;
    }

    if (price_per_head !== undefined) {
      const pricePerHead = parseFloat(price_per_head);
      if (Number.isNaN(pricePerHead) || pricePerHead < 0) {
        return res.status(400).json({
          success: false,
          message: 'price_per_head must be a non-negative number'
        });
      }
      updates.price_per_head = pricePerHead;
    }

    // Validate min <= max if both are being updated
    if (updates.min_tourist !== undefined && updates.max_tourist !== undefined) {
      if (updates.min_tourist > updates.max_tourist) {
        return res.status(400).json({
          success: false,
          message: 'min_tourist must be less than or equal to max_tourist'
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    console.log('🛠️ Updating pricing tier:', normalizedPricingId, updates);

    const { data, error } = await supabase
      .from('tour_pricing')
      .update(updates)
      .eq('tour_pricing_id', normalizedPricingId)
      .eq('tour_only_id', normalizedTourId)
      .select('*');

    if (error) {
      console.error('❌ Error updating pricing tier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update pricing tier',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing tier not found'
      });
    }

    console.log('✅ Pricing tier updated successfully');

    res.json({
      success: true,
      message: 'Pricing tier updated successfully',
      pricing: data[0]
    });
  } catch (error) {
    console.error('❌ Pricing tier update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete pricing tier
app.delete('/api/tours/:tourId/pricing/:pricingId', async (req, res) => {
  try {
    const { tourId, pricingId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const normalizedPricingId = normalizeTourId(pricingId);

    if (normalizedTourId === null || normalizedPricingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID or pricing ID'
      });
    }

    console.log('🗑️ Deleting pricing tier:', normalizedPricingId);

    const { error } = await supabase
      .from('tour_pricing')
      .delete()
      .eq('tour_pricing_id', normalizedPricingId)
      .eq('tour_only_id', normalizedTourId);

    if (error) {
      console.error('❌ Error deleting pricing tier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete pricing tier',
        error: error.message
      });
    }

    console.log('✅ Pricing tier deleted successfully');

    res.json({
      success: true,
      message: 'Pricing tier deleted successfully'
    });
  } catch (error) {
    console.error('❌ Pricing tier deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Upload tour image
app.post('/api/tours/:tourId/upload-image', async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const { imageData, fileName } = req.body;

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    const { publicUrl, filePath } = await uploadImageToStorage({
      imageData,
      fileName,
      bucket: 'tour-images',
      keyPrefix: 'tours',
      identifier: `tour-${normalizedTourId}`
    });

    // Insert image record
    const { data, error } = await supabase
      .from('tour_images')
      .insert([{
        tour_only_id: normalizedTourId,
        image_url: publicUrl
      }])
      .select('*');

    if (error) {
      console.error('❌ Error saving tour image URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store tour image URL',
        error: error.message
      });
    }

    console.log('✅ Tour image uploaded successfully');

    res.json({
      success: true,
      message: 'Tour image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      image: data[0]
    });
  } catch (error) {
    console.error('❌ Tour image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
});

// Delete tour image
app.delete('/api/tours/:tourId/images/:imageId', async (req, res) => {
  try {
    const { tourId, imageId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const normalizedImageId = normalizeTourId(imageId);

    if (normalizedTourId === null || normalizedImageId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID or image ID'
      });
    }

    console.log('🗑️ Deleting tour image:', normalizedImageId);

    const { error } = await supabase
      .from('tour_images')
      .delete()
      .eq('image_id', normalizedImageId)
      .eq('tour_only_id', normalizedTourId);

    if (error) {
      console.error('❌ Error deleting tour image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete tour image',
        error: error.message
      });
    }

    console.log('✅ Tour image deleted successfully');

    res.json({
      success: true,
      message: 'Tour image deleted successfully'
    });
  } catch (error) {
    console.error('❌ Tour image deletion error:', error);
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
// PACKAGE ONLY SETTINGS API ENDPOINTS
// ========================================

// List package_only with optional hotel filter and include pricing tiers
app.get('/api/package-only', async (req, res) => {
  try {
    const { hotel_id, include = 'pricing' } = req.query;

    let query = supabase
      .from('package_only')
      .select('*');

    if (hotel_id) {
      query = query.eq('hotel_id', hotel_id);
    }

    const { data: packages, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch packages', error: error.message });
    }

    if (include === 'pricing') {
      const ids = (packages || []).map(p => p.package_only_id);
      if (ids.length > 0) {
        const { data: tiers, error: tiersError } = await supabase
          .from('package_pricing')
          .select('*')
          .in('package_only_id', ids)
          .order('min_tourist');
        if (tiersError) {
          return res.status(500).json({ success: false, message: 'Failed to fetch pricing tiers', error: tiersError.message });
        }
        const grouped = new Map();
        tiers.forEach(t => {
          const key = t.package_only_id;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key).push(t);
        });
        (packages || []).forEach(p => {
          p.pricing = grouped.get(p.package_only_id) || [];
        });
      }
    }

    res.json({ success: true, packages: packages || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// Create package_only with optional pricing tiers
app.post('/api/package-only', async (req, res) => {
  try {
    const { description, category, hotel_id, pricing = [] } = req.body;
    if (!description || !category || !hotel_id) {
      return res.status(400).json({ success: false, message: 'description, category, hotel_id are required' });
    }

    const { data: inserted, error } = await supabase
      .from('package_only')
      .insert([{ description, category, hotel_id }])
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to create package', error: error.message });
    }

    let createdPricing = [];
    if (Array.isArray(pricing) && pricing.length > 0) {
      const rows = pricing.map(t => ({
        package_only_id: inserted.package_only_id,
        hotel_id,
        min_tourist: Number(t.min_tourist),
        max_tourist: Number(t.max_tourist),
        price_per_head: Number(t.price_per_head)
      }));
      const { data: tiers, error: tiersError } = await supabase
        .from('package_pricing')
        .insert(rows)
        .select('*');
      if (tiersError) {
        return res.status(500).json({ success: false, message: 'Package created, but failed to create pricing tiers', error: tiersError.message });
      }
      createdPricing = tiers;
    }

    res.json({ success: true, package: { ...inserted, pricing: createdPricing } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// Get single package_only with pricing
app.get('/api/package-only/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: pkg, error } = await supabase
      .from('package_only')
      .select('*')
      .eq('package_only_id', id)
      .single();
    if (error) {
      return res.status(404).json({ success: false, message: 'Package not found', error: error.message });
    }
    const { data: pricing, error: tiersError } = await supabase
      .from('package_pricing')
      .select('*')
      .eq('package_only_id', id)
      .order('min_tourist');
    if (tiersError) {
      return res.status(500).json({ success: false, message: 'Failed to fetch pricing tiers', error: tiersError.message });
    }
    res.json({ success: true, package: { ...pkg, pricing: pricing || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// Update package_only and replace pricing tiers
app.put('/api/package-only/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, category, hotel_id, pricing = [] } = req.body;

    const updates = {};
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (hotel_id !== undefined) updates.hotel_id = hotel_id;
    if (Object.keys(updates).length === 0 && !Array.isArray(pricing)) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    let updated;
    if (Object.keys(updates).length) {
      const { data, error } = await supabase
        .from('package_only')
        .update(updates)
        .eq('package_only_id', id)
        .select('*')
        .single();
      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to update package', error: error.message });
      }
      updated = data;
    } else {
      const { data } = await supabase
        .from('package_only')
        .select('*')
        .eq('package_only_id', id)
        .single();
      updated = data;
    }

    // Replace pricing tiers
    if (Array.isArray(pricing)) {
      await supabase.from('package_pricing').delete().eq('package_only_id', id);
      if (pricing.length > 0) {
        const rows = pricing.map(t => ({
          package_only_id: id,
          hotel_id: (hotel_id || updated.hotel_id),
          min_tourist: Number(t.min_tourist),
          max_tourist: Number(t.max_tourist),
          price_per_head: Number(t.price_per_head)
        }));
        const { error: tiersError } = await supabase
          .from('package_pricing')
          .insert(rows);
        if (tiersError) {
          return res.status(500).json({ success: false, message: 'Failed to update pricing tiers', error: tiersError.message });
        }
      }
    }

    const { data: newPricing } = await supabase
      .from('package_pricing')
      .select('*')
      .eq('package_only_id', id)
      .order('min_tourist');

    res.json({ success: true, package: { ...updated, pricing: newPricing || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

// Delete package_only and its pricing tiers
app.delete('/api/package-only/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('package_pricing').delete().eq('package_only_id', id);
    const { error } = await supabase
      .from('package_only')
      .delete()
      .eq('package_only_id', id);
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete package', error: error.message });
    }
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
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

// Upload receipt image
app.post('/api/payments/upload-receipt', async (req, res) => {
  try {
    const { imageData, fileName, bookingId } = req.body;

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    const { publicUrl, filePath } = await uploadImageToStorage({
      imageData,
      fileName,
      bucket: 'receipts',
      keyPrefix: 'receipts',
      identifier: bookingId || 'unknown'
    });

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath
    });
  } catch (error) {
    console.error('❌ Receipt upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
});

// Record payment
app.post('/api/payments', async (req, res) => {
  try {
    const { 
      booking_id,
      payment_method,
      total_booking_amount,
      paid_amount,
      payment_option,
      receipt_image_url
    } = req.body;
    
    console.log('💰 Recording payment:', { booking_id, payment_method, total_booking_amount, paid_amount });
    
    // Validate required fields
    if (!booking_id || !payment_method || total_booking_amount === undefined || paid_amount === undefined || !payment_option) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, payment_method, total_booking_amount, paid_amount, payment_option' 
      });
    }
    
    // Calculate remaining balance
    const remaining_balance = parseFloat(total_booking_amount) - parseFloat(paid_amount);
    
    // Build payment data with new schema
    const paymentData = {
      booking_id,
      payment_method,
      total_booking_amount: parseFloat(total_booking_amount),
      paid_amount: parseFloat(paid_amount),
      remaining_balance,
      payment_option,
      payment_date: new Date().toISOString()
    };
    
    // Add receipt image URL if provided
    if (receipt_image_url) {
      paymentData.receipt_image_url = receipt_image_url;
    }
    
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
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
    const { booking_id, payment_method, start_date, end_date, limit = 100, offset = 0 } = req.query;
    
    console.log('💰 Fetching payment history:', { booking_id, payment_method, start_date, end_date, limit, offset });
    
    let query = supabase
      .from('payments')
      .select(`
        *,
        bookings:booking_id (
          customer_first_name,
          customer_last_name,
          customer_email,
          arrival_date,
          departure_date
        )
      `)
      .order('payment_date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    // Filter by booking_id if provided
    if (booking_id) {
      query = query.eq('booking_id', booking_id);
    }
    
    // Filter by payment_method if provided
    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }
    
    // Filter by date range if provided
    if (start_date) {
      query = query.gte('payment_date', start_date);
    }
    if (end_date) {
      query = query.lte('payment_date', end_date);
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

// Get single payment by ID
app.get('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('💰 Fetching payment details for ID:', id);
    
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings:booking_id (
          customer_first_name,
          customer_last_name,
          customer_email,
          customer_contact,
          arrival_date,
          departure_date
        )
      `)
      .eq('payment_id', id)
      .single();
    
    if (error) {
      console.error('❌ Error fetching payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payment details', 
        error: error.message 
      });
    }
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    console.log('✅ Payment details fetched successfully');
    
    res.json({ 
      success: true, 
      payment
    });
    
  } catch (error) {
    console.error('❌ Payment fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Update payment record
app.put('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      paid_amount,
      receipt_image_url,
      payment_method,
      payment_option
    } = req.body;
    
    console.log(`📝 Updating payment ID: ${id}`, { paid_amount, receipt_image_url, payment_method, payment_option });
    
    // Fetch existing payment to calculate remaining balance
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', id)
      .single();
    
    if (fetchError || !existingPayment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Build update data
    const updateData = {};
    
    if (paid_amount !== undefined) {
      updateData.paid_amount = parseFloat(paid_amount);
      // Recalculate remaining balance
      updateData.remaining_balance = existingPayment.total_booking_amount - parseFloat(paid_amount);
    }
    
    if (receipt_image_url !== undefined) {
      updateData.receipt_image_url = receipt_image_url;
    }
    
    if (payment_method !== undefined) {
      updateData.payment_method = payment_method;
    }
    
    if (payment_option !== undefined) {
      updateData.payment_option = payment_option;
    }
    
    // Update payment
    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('payment_id', id)
      .select();
    
    if (error) {
      console.error('❌ Error updating payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update payment', 
        error: error.message 
      });
    }
    
    console.log('✅ Payment updated successfully');
    
    res.json({ 
      success: true, 
      message: 'Payment updated successfully',
      payment: data[0]
    });
    
  } catch (error) {
    console.error('❌ Payment update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Delete payment record
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Deleting payment with ID: ${id}`);
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('payment_id', id);
    
    if (error) {
      console.error('❌ Error deleting payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete payment', 
        error: error.message 
      });
    }
    
    console.log('✅ Payment deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Payment deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Payment deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ========================================
// SETTINGS API ENDPOINTS
// ========================================

// Get site content (mission, vision, etc.)
app.get('/api/settings/content', async (req, res) => {
  try {
    console.log('📊 Fetching site content...');
    
    const { data, error } = await supabase
      .from('site_content')
      .select('section_key, content')
      .order('section_key');
    
    if (error) {
      // If table doesn't exist, return empty array instead of error
      // This allows the frontend to work with hardcoded fallback content
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('Could not find the table') ||
          (error.message?.includes('relation') && error.message?.includes('does not exist'))) {
        console.warn('⚠️ site_content table does not exist. Returning empty array. Please run database_settings_schema.sql in Supabase.');
        return res.json({ 
          success: true, 
          content: []
        });
      }
      
      console.error('❌ Error fetching site content:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch site content', 
        error: error.message 
      });
    }
    
    console.log('✅ Site content fetched successfully:', data?.length || 0, 'sections');
    
    res.json({ 
      success: true, 
      content: data || []
    });
    
  } catch (error) {
    console.error('❌ Site content fetch error:', error);
    // Return empty array on any error to prevent frontend breakage
    res.json({ 
      success: true, 
      content: []
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
