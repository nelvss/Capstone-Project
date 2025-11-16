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
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role')
      .eq('email', normalizedEmail)
      .single();
    
    if (error || !user) {
      console.log('❌ User not found:', error?.message || 'No user found');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
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
    const { email, password, firstName, lastName } = req.body;
    
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
    
    // Create user with default role 'customer'
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        email: normalizedEmail,
        password_hash: password_hash,
        role: 'customer'
      }])
      .select('id, email, role')
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    console.log(`🔍 Password reset requested for email: ${email}`);
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .single();
    
    // Always return success message for security (don't reveal if email exists)
    if (userError || !user) {
      console.log('⚠️ Password reset requested for non-existent email:', email);
      // Still return success to prevent email enumeration
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token (JWT-like, self-contained, no database storage needed)
    const resetToken = generateResetToken(user.email);
    
    // Send password reset email
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://otgpuertogaleratravel.com'}/owner/reset-password.html?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, resetUrl);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
      // Still return success for security
    }
    
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    // Always return success for security
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent.' 
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
    
    console.log(`🔍 Password reset attempt with token`);
    
    // Verify reset token (JWT-like, self-contained, no database lookup needed)
    const tokenPayload = verifyResetToken(token);
    
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
    
    // Update password (no need to clear token since it's not stored)
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

module.exports = { login, register, forgotPassword, resetPassword };

