const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + duration * 60000);
  return formatTime(endDate);
};

const generateBookingId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BB-${timestamp}-${random}`.toUpperCase();
};

const calculateDownPayment = (totalAmount, percentage = 0.2) => {
  return parseFloat((totalAmount * percentage).toFixed(2));
};

const isWithinWorkingHours = (time, workingHours) => {
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  const [startHours, startMinutes] = workingHours.start.split(':').map(Number);
  const startInMinutes = startHours * 60 + startMinutes;
  
  const [endHours, endMinutes] = workingHours.end.split(':').map(Number);
  const endInMinutes = endHours * 60 + endMinutes;
  
  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    page,
    limit,
    total: array.length,
    totalPages: Math.ceil(array.length / limit),
  };
};

module.exports = {
  formatTime,
  formatDate,
  calculateEndTime,
  generateBookingId,
  calculateDownPayment,
  isWithinWorkingHours,
  validateEmail,
  validatePhone,
  paginate,
};