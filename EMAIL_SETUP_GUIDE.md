# Email Notification System Setup Guide

This guide will help you set up the email notification system for your booking management dashboard.

## 📋 Prerequisites

- Node.js installed on your computer
- A Gmail account (or other email service)

## 🚀 Setup Instructions

### Step 1: Install Dependencies

Open PowerShell in the `my-express-web` folder and run:

```powershell
cd "c:\Users\catap\OneDrive\Desktop\Capstone Project\my-express-web"
npm install
```

This will install all required packages:
- express (web server)
- nodemailer (email sending)
- cors (cross-origin requests)
- dotenv (environment variables)

### Step 2: Configure Email Settings

1. **Create a `.env` file** in the `my-express-web` folder (copy from `.env.example`):
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   PORT=3000
   ```

2. **For Gmail users**, you need to create an App Password:
   - Go to your Google Account: https://myaccount.google.com/
   - Navigate to **Security** → **2-Step Verification** (enable if not already)
   - Scroll down to **App passwords**
   - Select app: **Mail**
   - Select device: **Other** (Custom name) → Enter "Booking System"
   - Click **Generate**
   - Copy the 16-character password (no spaces)
   - Paste it in your `.env` file as `EMAIL_PASSWORD`

3. **For other email services**:
   - **Outlook/Hotmail**: Change service to `'outlook'` in server.js
   - **Yahoo**: Change service to `'yahoo'` in server.js
   - **Custom SMTP**: Configure with host, port, and auth settings

### Step 3: Start the Server

In PowerShell, run:

```powershell
npm start
```

Or for development with auto-restart:

```powershell
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:3000
📧 Email service configured with: your-email@gmail.com
```

### Step 4: Open the Dashboard

1. Open `owner/dashboard.html` in your browser
2. The dashboard will connect to the server at `http://localhost:3000`

## 🎯 How It Works

### When you click a button:

1. **Confirm Button** (Green):
   - Sends a confirmation email to the customer
   - Email includes all booking details
   - Button changes to "✓ Confirmed"

2. **Cancel Button** (Red):
   - Sends a cancellation notice to the customer
   - Includes refund information
   - Button changes to "✓ Cancelled"

3. **Reschedule Button** (Blue):
   - Sends a reschedule request acknowledgment
   - Tells customer they'll be contacted within 24 hours
   - Button changes to "✓ Rescheduled"

## 📧 Email Templates

Each action sends a professionally formatted HTML email:

- **Confirm**: Green theme with ✅ icon
- **Cancel**: Red theme with ❌ icon and refund info
- **Reschedule**: Blue theme with 📅 icon

All emails include:
- Personalized greeting with customer name
- Complete booking details
- Appropriate action-specific information
- Professional signature

## 🔧 Troubleshooting

### Server won't start
- Make sure you're in the correct directory
- Check if port 3000 is already in use
- Verify all dependencies are installed with `npm install`

### Emails not sending
- Verify your `.env` file has correct credentials
- For Gmail: Ensure 2-Step Verification is enabled
- Check if App Password is correct (16 characters, no spaces)
- Look at server console for error messages

### "Failed to connect to email server"
- Make sure the server is running (`npm start`)
- Check that the API_URL in `dashboard.js` is correct (`http://localhost:3000`)
- Verify CORS is enabled in server.js

### Button doesn't respond
- Open browser console (F12) to check for errors
- Ensure server is running
- Check network tab for failed API requests

## 🌐 Production Deployment

When deploying to production:

1. Update `API_URL` in `dashboard.js` to your production server URL
2. Use environment variables for sensitive data
3. Consider using a dedicated email service (SendGrid, AWS SES, etc.)
4. Enable HTTPS for secure communication
5. Set up proper error logging

## 📝 Customization

### Change Email Templates
Edit the `emailTemplates` object in `server.js` to customize:
- Email subject lines
- HTML content and styling
- Colors and branding
- Additional information

### Add More Actions
1. Add a new template in `emailTemplates`
2. Create a handler function in `dashboard.js`
3. Add the button to the HTML template
4. Add event listener in `renderTable()`

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use App Passwords instead of your main email password
- Keep your API server secure and up-to-date
- Validate all user inputs on the server side

## 📞 Support

If you encounter issues:
1. Check the server console for error messages
2. Check the browser console (F12) for client-side errors
3. Verify your email credentials are correct
4. Ensure all dependencies are installed

---

**Note**: Keep the server running while using the dashboard. Stop it with `Ctrl+C` when done.
