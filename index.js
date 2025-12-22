const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const securityMiddleware = require('./middleware/securityMiddleware');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./auth/authroutes');
const barberRoutes = require('./Barbers/barbersRoute/barbersRoute');
const bookingRoutes = require('./Booking/bookingRoute/bookingRoute');
const scheduleRoutes = require('./schedule/scheduleroute');
const adminRoutes = require('./Admin/adminRoutes');


const availabilityRoutes = require('./Availability/availabilityRoutes');

// Import jobs
const { bookingReminderJob, cleanupOldBookings } = require('./Jobs/BppkingReminder');

// Connect to database
connectDB();

// Initialize express
const app = express();

// Security middleware
securityMiddleware(app);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Morgan for logging
/* if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} */

// Rate limiting
app.use(generalLimiter);

// Static folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth',((req,res,next)=>{
  console.log('auth route accessed')
  next()
}), authRoutes);
app.use('/api/barbers',((req,res,next)=>{
  console.log('barbers route accessed')
  next()
}),barberRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/availability',((req,res,next)=>
  {
    console.log("index avai accessed")
    next()
  }),availabilityRoutes);
app.use('/api/admin', adminRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start jobs in production
if (process.env.NODE_ENV === 'production') {
  bookingReminderJob.start();
  cleanupOldBookings.start();
  cleanupPendingPayments.start();
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});