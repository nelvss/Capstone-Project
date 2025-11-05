# Email Notification System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER CLICKS BUTTON ON DASHBOARD                 │
│                       (Confirm / Cancel / Reschedule)                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DASHBOARD.JS (Frontend)                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  1. Show confirmation dialog                                  │  │
│  │  2. User confirms action                                      │  │
│  │  3. Disable button & show "Sending..." state                  │  │
│  │  4. Get booking data (name, email, dates, etc.)               │  │
│  │  5. Call sendEmail(action, booking) function                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTP POST Request
                                 │ URL: http://localhost:3000/api/send-email
                                 │ Body: { action: "confirm", booking: {...} }
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER.JS (Backend)                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  API Endpoint: POST /api/send-email                           │  │
│  │                                                                │  │
│  │  1. Receive request with action & booking data                │  │
│  │  2. Validate input (check email exists, valid action type)    │  │
│  │  3. Select appropriate email template:                        │  │
│  │     • "confirm"    → Green confirmation email                 │  │
│  │     • "cancel"     → Red cancellation email                   │  │
│  │     • "reschedule" → Blue reschedule email                    │  │
│  │  4. Populate template with booking details                    │  │
│  │  5. Prepare email with:                                       │  │
│  │     - From: Your configured email                             │  │
│  │     - To: Customer email from booking                         │  │
│  │     - Subject: Based on action type                           │  │
│  │     - Body: Professional HTML template                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Uses Nodemailer
                                 │ with SMTP credentials from .env
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EMAIL SERVICE (Gmail)                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  1. Authenticate using EMAIL_USER & EMAIL_PASSWORD            │  │
│  │  2. Validate sender and recipient                             │  │
│  │  3. Process HTML content                                      │  │
│  │  4. Send email through Gmail's SMTP server                    │  │
│  │  5. Return success/failure status                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Email Delivered
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER'S EMAIL INBOX                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  📧 Professional HTML Email Received                          │  │
│  │                                                                │  │
│  │  ✅ CONFIRM: Green-themed with booking details                │  │
│  │     - Welcoming confirmation message                          │  │
│  │     - Complete reservation details                            │  │
│  │     - Contact information                                     │  │
│  │                                                                │  │
│  │  ❌ CANCEL: Red-themed with cancellation notice               │  │
│  │     - Cancellation confirmation                               │  │
│  │     - Refund information (5-7 days)                           │  │
│  │     - Support contact details                                 │  │
│  │                                                                │  │
│  │  📅 RESCHEDULE: Blue-themed with acknowledgment               │  │
│  │     - Reschedule request received                             │  │
│  │     - Current booking details                                 │  │
│  │     - Promise to contact within 24 hours                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Response sent back
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DASHBOARD.JS (Frontend)                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  1. Receive success/error response from server                │  │
│  │  2. Show success message: "Email sent to customer@email.com"  │  │
│  │  3. Update button state:                                      │  │
│  │     • Change text to "✓ Confirmed/Cancelled/Rescheduled"      │  │
│  │     • Change button color to match action                     │  │
│  │     • Keep button disabled                                    │  │
│  │  4. Log action completion                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
┌────────────────────┐
│   .env FILE        │
│                    │
│  EMAIL_USER        │────┐
│  EMAIL_PASSWORD    │    │
│  PORT=3000         │    │
└────────────────────┘    │
                          │ Loaded by dotenv
                          │
                          ▼
                    ┌────────────────────┐
                    │   SERVER.JS        │
                    │                    │
                    │  Creates SMTP      │
                    │  Transporter with  │
                    │  your credentials  │
                    └────────────────────┘
```

## Data Flow Example

```
CONFIRM BUTTON CLICKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Booking Data:
┌──────────────────────────────────────────┐
│ name: "Elizabeth Lopez"                  │
│ email: "elopez@yahoo.com"                │
│ services: "Hotel Booking, Car Rental"    │
│ arrival: "2023-10-01"                    │
│ departure: "2023-10-05"                  │
│ hotel: "Grand Hotel"                     │
│ price: "$500"                            │
│ contact: "123-456-7890"                  │
└──────────────────────────────────────────┘
         │
         ▼
🌐 API Request:
POST http://localhost:3000/api/send-email
Content-Type: application/json
{
  "action": "confirm",
  "booking": { ...all data above... }
}
         │
         ▼
🔧 Server Processing:
1. Validate action = "confirm" ✓
2. Validate email exists ✓
3. Select email template (Green/Confirm)
4. Populate with booking data
5. Create email object
         │
         ▼
📧 Email Sent:
From: "Booking Management" <your-email@gmail.com>
To: elopez@yahoo.com
Subject: ✅ Booking Confirmed - Your Reservation Details
Body: [Professional HTML with green theme]
         │
         ▼
✅ Success Response:
{
  "success": true,
  "message": "Email sent successfully to elopez@yahoo.com",
  "action": "confirm"
}
         │
         ▼
🎉 UI Update:
Button text: "✓ Confirmed"
Button color: Dark Green
Alert: "✅ Confirmation email sent successfully to elopez@yahoo.com"
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                         │
└─────────────────────────────────────────────────────────────────┘

1. Environment Variables (.env)
   ├── Credentials stored outside code
   ├── .gitignore prevents committing
   └── Only accessible on server

2. App Passwords (Gmail)
   ├── Not your main Gmail password
   ├── Can be revoked anytime
   └── Limited to mail access only

3. CORS Protection
   ├── Only allowed origins can call API
   ├── Prevents unauthorized access
   └── Configurable in server.js

4. Input Validation
   ├── Server validates all inputs
   ├── Checks email format
   └── Verifies action types

5. Error Handling
   ├── Doesn't expose sensitive info
   ├── Logs errors server-side
   └── Generic messages to client
```

## File Structure

```
Capstone Project/
│
├── owner/
│   ├── dashboard.html         ← Frontend UI
│   ├── dashboard.js           ← Email sending logic (MODIFIED)
│   └── dashboard.css
│
├── my-express-web/
│   ├── server.js              ← Email server (NEW)
│   ├── test-email.js          ← Test script (NEW)
│   ├── package.json           ← Dependencies (MODIFIED)
│   ├── .env                   ← Your config (NEW) ⚠️ SECRET
│   ├── .env.example           ← Config template (NEW)
│   ├── .gitignore             ← Security (NEW)
│   ├── start-server.ps1       ← Quick start (NEW)
│   └── node_modules/          ← Installed packages
│
├── SETUP_INSTRUCTIONS.html    ← Visual guide (NEW)
├── EMAIL_SETUP_GUIDE.md       ← Detailed docs (NEW)
├── IMPLEMENTATION_SUMMARY.md  ← Overview (NEW)
├── QUICK_START.txt            ← Quick reference (NEW)
└── ARCHITECTURE.md            ← This file (NEW)
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  • HTML5 (dashboard.html)                                    │
│  • JavaScript ES6+ (dashboard.js)                            │
│  • CSS3 (dashboard.css)                                      │
│  • Fetch API (for HTTP requests)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                             │
├─────────────────────────────────────────────────────────────┤
│  • Node.js (JavaScript runtime)                              │
│  • Express.js (Web framework)                                │
│  • Nodemailer (Email sending)                                │
│  • CORS (Cross-origin requests)                              │
│  • dotenv (Environment variables)                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      EMAIL SERVICE                           │
├─────────────────────────────────────────────────────────────┤
│  • Gmail SMTP (email delivery)                               │
│  • HTML Email Templates (professional styling)               │
│  • App Passwords (secure authentication)                     │
└─────────────────────────────────────────────────────────────┘
```

## Process Timeline

```
Time: 0ms
│ User clicks button on dashboard
│
Time: 10ms
│ Confirmation dialog appears
│
Time: 1000ms (user confirms)
│ Button disabled, shows "Sending..."
│
Time: 1050ms
│ JavaScript makes API call to server
│
Time: 1080ms
│ Server receives request
│ Validates data
│ Selects email template
│
Time: 1100ms
│ Server connects to Gmail SMTP
│
Time: 2500ms (network delay)
│ Email sent through Gmail
│
Time: 2550ms
│ Server sends success response
│
Time: 2600ms
│ Frontend receives response
│ Shows success message
│ Updates button state
│
Time: 3000ms
│ Email arrives in customer's inbox
│
Total Time: ~3 seconds from click to delivery
```

---

**Created:** October 11, 2025  
**Status:** ✅ Fully Implemented  
**Version:** 1.0.0
