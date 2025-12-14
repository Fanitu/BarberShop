const cron = require('node-cron');
const Booking = require('../Booking/bookingModel/bookingModel');
const { sendReminderEmail } = require('../service/emailService');

// Run every minute to check for upcoming bookings
const bookingReminderJob = cron.schedule('* * * * *', async () => {
  try {
    console.log('Running booking reminder job...');
    
   
    
    // --- STEP 1: Correct the Date Range Query ---
    // Get start of today (midnight)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // Get start of tomorrow (midnight)
    const endofToday = new Date(startOfToday);
    endofToday.setUTCDate(startOfToday.getUTCDate() + 1);

    // Find all confirmed bookings for today that haven't sent a reminder
    const bookings = await Booking.find({
      bookingdate: {
        $gte: startOfToday, // Today at 00:00:00.000
        $lte: endofToday, // Tomorrow at 00:00:00.000
      },
      status: 'confirmed',
      reminderSent: false,
    }).populate('client').populate({
      path: 'barber',
      populate: {
        path: 'user',
        select: 'name',
      },
    });
    
    console.log(`Found ${bookings.length} potential bookings for reminder.`);
    // --- END STEP 1 ---

    for (const booking of bookings) {
      try {
        // --- STEP 2: Calculate the Exact Booking DateTime ---
        // Start with the bookingDate (which is today's date at midnight)
        const bookingDateTime = new Date(booking.bookingdate);
        
        // Add the time from the startTime string (e.g., "10:00")
        const [hours, minutes] = booking.startTime.split(':');
        bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const now = new Date();

        
        
        // Calculate difference
        const timeDiff = bookingDateTime - now;
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        // Check if the booking is between 9 and 10 minutes away (more robust)
        if (minutesDiff >= 9 && minutesDiff <= 10) {
        
          await sendReminderEmail({
            to: booking.client.email,
            clientName: booking.client.name,
            barberName: booking.barber.user.name,
            bookingDate: booking.bookingdate,
            startTime: booking.startTime,
            // Assuming service is an object with a 'name' property
            service: booking.service ? booking.service.name : 'Service', 
          });
          
          // Mark reminder as sent
          booking.reminderSent = true;
          await booking.save();
          
          console.log(`Sent reminder for booking ${booking._id} to ${booking.client.email}`);
        }
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in booking reminder job:', error);
  }
});

// Cleanup job for old bookings
const cleanupOldBookings = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running cleanup job for old bookings...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Archive or delete old completed/cancelled bookings
    const result = await Booking.deleteMany({
      bookingDate: { $lt: thirtyDaysAgo },
      status: { $in: ['completed', 'cancelled', 'no-show'] },
    });
    
    console.log(`Cleaned up ${result.deletedCount} old bookings`);
  } catch (error) {
    console.error('Error in cleanup job:', error);
  }
});

module.exports = { bookingReminderJob, cleanupOldBookings };