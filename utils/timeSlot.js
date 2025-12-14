const generateTimeSlots = (startTime, endTime, slotDuration, breakStart, breakEnd) => {
  const slots = [];
  
  // Convert times to minutes
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Break times
  const breakStartMinutes = breakStart ? breakStart.split(':').map(Number)[0] * 60 + breakStart.split(':').map(Number)[1] : null;
  const breakEndMinutes = breakEnd ? breakEnd.split(':').map(Number)[0] * 60 + breakEnd.split(':').map(Number)[1] : null;
  
  while (currentMinutes + slotDuration <= endMinutes) {
    const slotStartMinutes = currentMinutes;
    const slotEndMinutes = currentMinutes + slotDuration;
    
    // Check if slot overlaps with break
    const overlapsBreak = breakStartMinutes && breakEndMinutes &&
      ((slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes));
    
    if (overlapsBreak) {
      // Skip to after break
      currentMinutes = breakEndMinutes;
      continue;
    }
    
    // Format times
    const startHourFormatted = Math.floor(slotStartMinutes / 60).toString().padStart(2, '0');
    const startMinuteFormatted = (slotStartMinutes % 60).toString().padStart(2, '0');
    const endHourFormatted = Math.floor(slotEndMinutes / 60).toString().padStart(2, '0');
    const endMinuteFormatted = (slotEndMinutes % 60).toString().padStart(2, '0');
    
    slots.push({
      startTime: `${startHourFormatted}:${startMinuteFormatted}`,
      endTime: `${endHourFormatted}:${endMinuteFormatted}`,
      status: 'available',
    });
    
    currentMinutes += slotDuration;
  }
  
  return slots;
};

const parseTimeToMinutes = (timeString) => {
  if(!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const getAvailableTimeSlots = (schedule) => {
  return schedule.slots
    .filter(slot => slot.status === 'available')
    .map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
};

const isTimeSlotAvailable = (schedule, startTime) => {
  const slot = schedule.slots.find(s => s.startTime === startTime);
  return slot && slot.status === 'available';
};

const formatTimeForDisplay = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const calculateDuration = (startTime, endTime) => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

module.exports = {
  generateTimeSlots,
  parseTimeToMinutes,
  formatMinutesToTime,
  getAvailableTimeSlots,
  isTimeSlotAvailable,
  formatTimeForDisplay,
  calculateDuration
};