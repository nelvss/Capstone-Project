const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ─── Security: Helmet (hides X-Powered-By, sets secure HTTP headers) ─────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from Supabase CDN
  contentSecurityPolicy: false // keep flexible for now; enable & tune in production
}));

// ─── Security: Rate Limiting ──────────────────────────────────────────────────
// Global rate limit — 150 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Strict limiter for auth routes (login, register) — prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' }
});

// Public data limiter (vehicles, tours, diving) — allow scrape bursts but cap them
const publicDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

app.use(globalLimiter);

// ─── Allowed origins ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://otgpuertogaleratravel.com',
  'https://www.otgpuertogaleratravel.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman in dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Expires',
    'X-Requested-With',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  // Socket connected (ID kept internal, not logged to avoid leaking session info)
  socket.on('disconnect', () => {});

  socket.on('new-booking', (data) => {
    io.emit('booking-update', data);
  });

  socket.on('payment-update', (data) => {
    io.emit('payment-status-changed', data);
  });

  socket.on('analytics-update', () => {
    io.emit('analytics-refresh');
  });
});

app.set('io', io);

// ─── API root ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'OTG API', version: '1.0.0' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// Apply strict limiter on auth endpoints
app.use('/api/login',    authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/auth',     authLimiter);

// Apply public data limiter on read-heavy public endpoints
app.use('/api/vehicles',        publicDataLimiter);
app.use('/api/tours',           publicDataLimiter);
app.use('/api/diving',          publicDataLimiter);
app.use('/api/van-destinations', publicDataLimiter);
app.use('/api/packages',        publicDataLimiter);
app.use('/api/feedback',        publicDataLimiter);
app.use('/api/settings',        publicDataLimiter);

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO enabled`);
  console.log(`🛡️  Helmet + rate limiting active`);
});
