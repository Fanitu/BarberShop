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

// Initialize express
const app = express();


const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://resolvebar.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://barber-shop-nine-kappa.vercel.app'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS Allowed Origin:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS Blocked Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));


// Security middleware
securityMiddleware(app);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Static folder
app.use('/public', express.static(path.join(__dirname, 'public')));


// Add CORS headers manually for extra safety (optional)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://modern-barber-fe.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://barber-shop-nine-kappa.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// API Routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});


app.use('/api/auth',((req,res,next)=>{
  console.log('auth route accessed')
  next()
}), authRoutes);
app.use('/api/barbers',((req,res,next)=>{
  console.log(process.env.CLIENT_URL)
  next()
}),((req,res,next)=>{
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
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

connectDB();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});