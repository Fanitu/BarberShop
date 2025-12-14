// utils/availabilityCalculator.js
/**
 * 🎯 SMART AVAILABILITY CALCULATOR
 * Calculates available time windows for ANY service duration
 * Handles: Working hours, breaks, existing bookings, buffers
 */

const { parseTimeToMinutes, formatMinutesToTime} = require('./timeSlot');

class AvailabilityCalculator {
  /**
   * @param {Object} barber - Barber document with workingHours, break times
   * @param {Object} schedule - Schedule document with bookings
   * @param {Array} bookings - Array of existing Booking documents
   * @param {number} bufferMinutes - Buffer between appointments (default: 5)
   */
  constructor(barber, schedule = { bookings: [] }, bookings = [], bufferMinutes = 5) {
    this.barber = barber;
    this.schedule = schedule;
    this.bookings = [...(schedule.bookings || []), ...bookings];
    this.bufferMinutes = bufferMinutes;
    this.minuteIncrement = barber.minimumSlotDuration || 15;
  }

  /**
   * Get all available time windows for a specific service duration
   * @param {number} serviceDuration - Duration in minutes
   * @returns {Array} Available time windows with start/end times
   */
  getAvailableWindows(serviceDuration) {
    // Convert times to minutes for calculation
    const dayStart = this.barber.workingHours?.start ? 
      parseTimeToMinutes(this.barber.workingHours.start) : 540; // Default 9:00 AM
    const dayEnd = this.barber.workingHours?.end ? 
      parseTimeToMinutes(this.barber.workingHours.end) : 1080; // Default 6:00 PM
    
    const breakStart = this.barber.breakStart ? parseTimeToMinutes(this.barber.breakStart) : null;
    const breakEnd = this.barber.breakEnd ? parseTimeToMinutes(this.barber.breakEnd) : null;
    
    const availableWindows = [];
    
    // Check every increment (e.g., every 15 minutes)
    for (let windowStart = dayStart; 
         windowStart + serviceDuration <= dayEnd; 
         windowStart += this.minuteIncrement) {
      
      const windowEnd = windowStart + serviceDuration;
      
      // 🚫 Check 1: Overlaps with break time?
      if (this.overlapsBreak(windowStart, windowEnd, breakStart, breakEnd)) {
        // Skip to after break
        windowStart = (breakEnd || windowStart) - this.minuteIncrement;
        continue;
      }
      
      // 🚫 Check 2: Overlaps with existing bookings (with buffer)?
      if (!this.isTimeAvailable(windowStart, windowEnd)) {
        continue; // Skip this window
      }
      
      // 🚫 Check 3: Outside barber's custom hours for this day?
      if (this.schedule.customHours) {
        const customStart = parseTimeToMinutes(this.schedule.customHours.start || this.barber.workingHours.start);
        const customEnd = parseTimeToMinutes(this.schedule.customHours.end || this.barber.workingHours.end);
        
        if (windowStart < customStart || windowEnd > customEnd) {
          continue; // Outside custom hours
        }
      }
      
      // 🚫 Check 4: Is this a non-working day?
      if (this.schedule.isWorkingDay === false) {
        continue; // Barber not working
      }
      
      // ✅ ALL CHECKS PASSED - Window is available!
      availableWindows.push({
        startTime: formatMinutesToTime(windowStart),
        endTime: formatMinutesToTime(windowEnd),
        startMinutes: windowStart,
        endMinutes: windowEnd,
        duration: serviceDuration,
      });
    }
    
    return availableWindows;
  }

  /**
   * Check if time window overlaps with existing bookings (with buffer)
   * @param {number} windowStart - Start time in minutes
   * @param {number} windowEnd - End time in minutes
   * @returns {boolean} True if available, false if overlaps
   */
  isTimeAvailable(windowStart, windowEnd) {
    for (const booking of this.bookings) {
      if(!booking.startTime || !booking.endTime) break;
      const bookingStart = parseTimeToMinutes(booking.startTime);
      const bookingEnd = parseTimeToMinutes(booking.endTime);
      
      // Add buffer before and after existing bookings
      const bookingStartWithBuffer = bookingStart - this.bufferMinutes;
      const bookingEndWithBuffer = bookingEnd + this.bufferMinutes;
      
      // Check for ANY overlap (with buffers)
      if (windowStart < bookingEndWithBuffer && windowEnd > bookingStartWithBuffer) {
        return false; // ❌ Overlap detected
      }
    }
    
    return true; // ✅ No overlap
  }

  /**
   * Check if time window overlaps with break time
   * @param {number} windowStart - Start time in minutes
   * @param {number} windowEnd - End time in minutes
   * @param {number|null} breakStart - Break start in minutes
   * @param {number|null} breakEnd - Break end in minutes
   * @returns {boolean} True if overlaps with break
   */
  overlapsBreak(windowStart, windowEnd, breakStart, breakEnd) {
    if (!breakStart || !breakEnd) return false;
    return windowStart < breakEnd && windowEnd > breakStart;
  }

  /**
   * Get next available time slot (for quick suggestions)
   * @param {number} serviceDuration - Duration in minutes
   * @returns {Object|null} Next available slot or null
   */
  getNextAvailableSlot(serviceDuration) {
    const windows = this.getAvailableWindows(serviceDuration);
    return windows.length > 0 ? windows[0] : null;
  }

  /**
   * Get day summary - how many slots available per hour
   * @param {number} serviceDuration - Duration in minutes
   * @returns {Object} Summary by hour
   */
  getDaySummary(serviceDuration) {
    const windows = this.getAvailableWindows(serviceDuration);
    const summary = {};
    
    windows.forEach(window => {
      const hour = Math.floor(window.startMinutes / 60);
      if (!summary[hour]) summary[hour] = 0;
      summary[hour]++;
    });
    
    return summary;
  }

  /**
   * Check specific time (for validation before booking)
   * @param {string} startTime - "HH:MM" format
   * @param {number} serviceDuration - Duration in minutes
   * @returns {Object} Validation result
   */
  validateTime(startTime, serviceDuration) {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = startMinutes + serviceDuration;
    
    const isAvailable = this.isTimeAvailable(startMinutes, endMinutes);
    const breaks = this.barber.breakStart && this.barber.breakEnd ? 
      this.overlapsBreak(startMinutes, endMinutes, 
        parseTimeToMinutes(this.barber.breakStart), 
        parseTimeToMinutes(this.barber.breakEnd)) : false;
    
    const withinHours = startMinutes >= parseTimeToMinutes(this.barber.workingHours.start) &&
                       endMinutes <= parseTimeToMinutes(this.barber.workingHours.end);
    const value = isAvailable && !breaks && withinHours
    
    return {
      valid: value,
      isAvailable,
      breaks,
      withinHours,
      message: !withinHours ? 'Outside working hours' :
               breaks ? 'Overlaps with break time' :
               !isAvailable ? 'Time already booked' :
               'Time is available'
    };
  }
}

module.exports = AvailabilityCalculator;