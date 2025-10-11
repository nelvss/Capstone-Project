// Test Email Configuration Script
// Run this to verify your email settings work correctly

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('='.repeat(50));
console.log('📧 Email Configuration Test');
console.log('='.repeat(50));
console.log('');

// Check if environment variables are set
console.log('1️⃣ Checking environment variables...');
if (!process.env.EMAIL_USER) {
  console.log('   ❌ EMAIL_USER is not set in .env file');
  process.exit(1);
}
if (!process.env.EMAIL_PASSWORD) {
  console.log('   ❌ EMAIL_PASSWORD is not set in .env file');
  process.exit(1);
}
console.log('   ✅ Environment variables found');
console.log('   📧 Email:', process.env.EMAIL_USER);
console.log('');

// Create transporter
console.log('2️⃣ Creating email transporter...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
console.log('   ✅ Transporter created');
console.log('');

// Verify connection
console.log('3️⃣ Verifying email server connection...');
transporter.verify(function(error, success) {
  if (error) {
    console.log('   ❌ Connection failed!');
    console.log('   Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('   • For Gmail: Make sure you are using an App Password');
    console.log('   • Enable 2-Step Verification in your Google Account');
    console.log('   • Go to: https://myaccount.google.com/apppasswords');
    console.log('   • Create a new App Password for "Mail"');
    console.log('   • Update EMAIL_PASSWORD in .env file');
    process.exit(1);
  } else {
    console.log('   ✅ Server connection successful!');
    console.log('');
    
    // Send test email
    console.log('4️⃣ Sending test email...');
    const mailOptions = {
      from: `"Booking Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '🧪 Test Email - Your Email Server is Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f9ff;">
          <div style="background-color: #3b82f6; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Email Test Successful!</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">
              Congratulations! Your email server is configured correctly.
            </p>
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Configuration Details:</h3>
              <p style="margin: 5px 0;"><strong>Email Service:</strong> Gmail</p>
              <p style="margin: 5px 0;"><strong>From Address:</strong> ${process.env.EMAIL_USER}</p>
              <p style="margin: 5px 0;"><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Your booking notification system is now ready to send emails for:
            </p>
            <ul style="color: #374151;">
              <li>✅ Booking Confirmations</li>
              <li>❌ Booking Cancellations</li>
              <li>📅 Reschedule Requests</li>
            </ul>
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 13px; color: #166534; margin: 0;">
                <strong>✅ Next Step:</strong> Start your server with <code>npm start</code> and test the dashboard!
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log('   ❌ Test email failed to send');
        console.log('   Error:', error.message);
        process.exit(1);
      } else {
        console.log('   ✅ Test email sent successfully!');
        console.log('   📬 Check your inbox:', process.env.EMAIL_USER);
        console.log('   📝 Message ID:', info.messageId);
        console.log('');
        console.log('='.repeat(50));
        console.log('🎉 All tests passed! Your email system is ready!');
        console.log('='.repeat(50));
        console.log('');
        console.log('Next steps:');
        console.log('  1. Check your email inbox');
        console.log('  2. Start the server: npm start');
        console.log('  3. Open dashboard and test the buttons');
      }
    });
  }
});
