const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Test if dotenv is working
console.log('🔍 Dotenv test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT from env:', process.env.PORT);
console.log('Current working directory:', process.cwd());

// Middleware
app.use(cors({
  origin: [
    "https://otgpuertogaleratravel.com",
    "https://www.otgpuertogaleratravel.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Expires', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.options('*', cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API root endpoint - returns JSON only
app.get('/', (req, res) => {
  res.json({
    message: 'API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      documentation: 'All API endpoints are under /api/*'
    }
  });
});

// Routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/emailRoutes'));
app.use('/api', require('./routes/feedbackRoutes'));
app.use('/api', require('./routes/hotelRoutes'));
app.use('/api', require('./routes/bookingRoutes'));
app.use('/api', require('./routes/vehicleRoutes'));
app.use('/api', require('./routes/divingRoutes'));
app.use('/api', require('./routes/tourRoutes'));
app.use('/api', require('./routes/paymentRoutes'));
app.use('/api', require('./routes/analyticsRoutes'));
app.use('/api', require('./routes/packageRoutes'));
app.use('/api', require('./routes/qrcodeRoutes'));
app.use('/api', require('./routes/vanDestinationRoutes'));
app.use('/api', require('./routes/settingsRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
console.log(`📧 Email service configured with: ${process.env.EMAIL_USER || 'Not configured'}`);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📧 Email service configured with: ${process.env.EMAIL_USER || 'Not configured'}`);
});
