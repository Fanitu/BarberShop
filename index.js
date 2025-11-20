// server.js
const express = require('express');
const mongoose = require('mongoose');
const db_url = 'mongodb+srv://fanizig8_db_user:cFFuYuBbFr35nlDG@notebookdatabase.ugjbrbx.mongodb.net/?appName=Notebookdatabase';
const bookingRoutes = require('./Booking/bookingRoute/bookingRoute');
const barbersRoutes = require('./Barbers/barbersRoute/barbersRoute');

const app = express();
app.use(express.json());

/* // Import our models (blueprints)
const Barber = require('./Barbers/barbersModel/barbersModel');
const Booking = require('./Booking/bookingModel/bookingModel');

// 🎯 ROUTE 1: Get a barber's schedule for a specific day
app.get('/api/barbers/:barberId/schedule', async (req, res) => {
  try {
    const { barberId } = req.params; // Get barber ID from URL
    const { date } = req.query; // Get date from query parameters

    console.log(`📅 Fetching schedule for barber ${barberId} on ${date}`);

    // Find all bookings for this barber on this specific date
    const bookings = await Booking.find({
      barber: barberId,
      bookingDate: new Date(date),
      status: 'confirmed' // Only get confirmed bookings
    }).populate('user', 'name'); // Also get user's name

    // Send the bookings back to frontend
    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('❌ Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schedule'
    });
  }
}); */

// 🎯 ROUTE 2: Create a new booking
app.use('/api/bookings', bookingRoutes);

// 🎯 ROUTE 3: Get all barbers (for dropdown selection)
app.use('/api/barbers', barbersRoutes);

// Connect to MongoDB (our database)
mongoose.connect(db_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('\n✅ Connected to MongoDB!'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`\n\n🚀 Server running on http://localhost:${PORT}`);
});