require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const sequelize = require('./config/database');
require('./models'); // Load all models and associations

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const mechanicRoutes = require('./routes/mechanics');
const vehicleRoutes = require('./routes/vehicles');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const invoiceRoutes = require('./routes/invoices');
const miscRoutes = require('./routes/misc');

const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow configured origins and any Vercel preview deployments
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'VSM API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api', miscRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize DB and start server
const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
};

// In Vercel serverless, we don't call listen().
// DB init happens on first request (cold start).
if (!process.env.VERCEL) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`🚗 VSM Server running on http://localhost:${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV}`);
    });
  }).catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
} else {
  // For Vercel: init DB but don't listen
  initDb().catch((err) => {
    console.error('❌ Vercel DB init failed:', err.message);
  });
}

module.exports = app;

