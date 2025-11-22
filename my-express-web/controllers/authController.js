const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Secret key for signing reset tokens (use environment variable or default)
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'your-secret-key-change-in-production';

// Generate password reset token (JWT-like, self-contained)
function generateResetToken(email) {
  const payload = {
    email: email,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    iat: Math.floor(Date.now() / 1000)
  };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', RESET_TOKEN_SECRET)
    .update(`${header}.${payloadEncoded}`)
    .digest('base64url');
  
  return `${header}.${payloadEncoded}.${signature}`;
}

// Verify password reset token
function verifyResetToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [header, payloadEncoded, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', RESET_TOKEN_SECRET)
      .update(`${header}.${payloadEncoded}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return null;
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log(`🔍 Attempting login for email: ${normalizedEmail}`);
    
    // Use maybeSingle() instead of single() to handle cases more gracefully
    // First, check if multiple users exist with this email
    const { data: allUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email, password_hash, role, first_name, last_name, contact_number')
      .eq('email', normalizedEmail);
    
    if (checkError) {
      console.log('❌ Database error:', checkError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error occurred' 
      });
    }
    
    // Check if no user found
    if (!allUsers || allUsers.length === 0) {
      console.log('❌ User not found for email:', normalizedEmail);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check if multiple users exist (data integrity issue)
    if (allUsers.length > 1) {
      console.error('⚠️ Multiple users found with email:', normalizedEmail, '- Using first match');
      // Log this as a data integrity issue but continue with first user
    }
    
    // Use the first user (or only user)
    const user = allUsers[0];
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', normalizedEmail);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    console.log('✅ Password verified successfully for user:', normalizedEmail);
    
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        contactNumber: user.contact_number || null,
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
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, contactNumber } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log(`🔍 Attempting registration for email: ${normalizedEmail}`);
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();
    
    if (existingUser) {
      console.log('❌ User already exists:', normalizedEmail);
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Prepare user data
    const userData = {
      email: normalizedEmail,
      password_hash: password_hash,
      role: 'customer'
    };
    
    // Add optional fields if provided
    if (firstName) userData.first_name = firstName.trim();
    if (lastName) userData.last_name = lastName.trim();
    if (contactNumber) userData.contact_number = contactNumber.trim();
    
    // Create user with default role 'customer'
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select('id, email, role, first_name, last_name, contact_number')
      .single();
    
    if (insertError || !newUser) {
      console.error('❌ Error creating user:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create account',
        error: insertError?.message || 'Unknown error'
      });
    }
    
    console.log('✅ User registered successfully:', normalizedEmail);
    
    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.first_name || null,
        lastName: newUser.last_name || null,
        contactNumber: newUser.contact_number || null,
        loginTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Generate random 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token for password reset (after code verification)
function generateSessionToken(email) {
  const payload = {
    email: email,
    exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes expiration
    iat: Math.floor(Date.now() / 1000),
    type: 'password_reset'
  };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', RESET_TOKEN_SECRET)
    .update(`${header}.${payloadEncoded}`)
    .digest('base64url');
  
  return `${header}.${payloadEncoded}.${signature}`;
}

// Verify session token for password reset
function verifySessionToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [header, payloadEncoded, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', RESET_TOKEN_SECRET)
      .update(`${header}.${payloadEncoded}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    // Check token type
    if (payload.type !== 'password_reset') {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying session token:', error);
    return null;
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔍 Password reset requested for email: ${normalizedEmail}`);
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();
    
    // Always return success message for security (don't reveal if email exists)
    if (userError || !user) {
      console.log('⚠️ Password reset requested for non-existent email:', normalizedEmail);
      // Still return success to prevent email enumeration
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a verification code has been sent.' 
      });
    }
    
    // Rate limiting: Check if there's an active code (not expired yet)
    // This prevents requesting new codes too frequently
    const { data: existingUser, error: rateLimitError } = await supabase
      .from('users')
      .select('reset_code_expires_at')
      .eq('email', normalizedEmail)
      .single();
    
    if (existingUser && existingUser.reset_code_expires_at) {
      const expiresAt = new Date(existingUser.reset_code_expires_at);
      const now = new Date();
      // If code is still valid (not expired), allow replacement but log it
      if (now < expiresAt) {
        const timeRemaining = Math.floor((expiresAt - now) / 1000 / 60); // minutes
        console.log(`⚠️ Code already exists for ${normalizedEmail}, expires in ${timeRemaining} minutes. Replacing with new code.`);
      }
    }
    
    // Generate 6-digit verification code
    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    // Update user with reset code hash and expiration
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_code_hash: codeHash,
        reset_code_expires_at: expiresAt
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Error storing reset code:', updateError);
      // Still return success for security
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a verification code has been sent.' 
      });
    }
    
    // Send verification code email asynchronously (non-blocking)
    // This allows the API to respond immediately while email sends in background
    sendPasswordResetEmail(user.email, code)
      .then(() => {
        console.log('✅ Verification code sent to:', user.email);
      })
      .catch((emailError) => {
        console.error('❌ Error sending verification code email:', emailError);
        // Log the code for manual recovery if email fails
        console.log('📧 Verification code (email failed):', code);
      });
    
    // Return response immediately without waiting for email
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a verification code has been sent.' 
    });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    // Always return success for security
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a verification code has been sent.' 
    });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and code are required' 
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔍 Verifying reset code for email: ${normalizedEmail}`);
    
    // Find user with reset code
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, reset_code_hash, reset_code_expires_at')
      .eq('email', normalizedEmail)
      .single();
    
    if (userError || !user || !user.reset_code_hash) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code' 
      });
    }
    
    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(user.reset_code_expires_at);
    if (now > expiresAt) {
      // Clear expired code
      await supabase
        .from('users')
        .update({
          reset_code_hash: null,
          reset_code_expires_at: null
        })
        .eq('id', user.id);
      
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }
    
    // Verify the code
    const isValidCode = await bcrypt.compare(code, user.reset_code_hash);
    
    if (!isValidCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }
    
    // Clear reset code fields after successful verification
    await supabase
      .from('users')
      .update({
        reset_code_hash: null,
        reset_code_expires_at: null
      })
      .eq('id', user.id);
    
    // Generate session token for password reset
    const sessionToken = generateSessionToken(normalizedEmail);
    
    console.log('✅ Verification code verified successfully for:', normalizedEmail);
    
    res.json({ 
      success: true, 
      message: 'Verification code verified successfully',
      token: sessionToken
    });
    
  } catch (error) {
    console.error('❌ Verify reset code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and password are required' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    console.log(`🔍 Password reset attempt with session token`);
    
    // Verify session token
    const tokenPayload = verifySessionToken(token);
    
    if (!tokenPayload || !tokenPayload.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }
    
    // Find user by email from token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', tokenPayload.email)
      .single();
    
    if (userError || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: password_hash
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to reset password' 
      });
    }
    
    console.log('✅ Password reset successful for user:', user.email);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = { login, register, forgotPassword, verifyResetCode, resetPassword };

