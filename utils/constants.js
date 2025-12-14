module.exports = {
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no-show',
  },
  
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PARTIAL: 'partial',
    COMPLETED: 'completed',
    REFUNDED: 'refunded',
  },
  
  PAYMENT_TYPE: {
    DOWN_PAYMENT: 'down-payment',
    REMAINING: 'remaining',
    FULL: 'full',
  },
  
  SLOT_STATUS: {
    AVAILABLE: 'available',
    BOOKED: 'booked',
    BREAK: 'break',
    UNAVAILABLE: 'unavailable',
  },
  
  ROLES: {
    CLIENT: 'client',
    BARBER: 'barber',
    ADMIN: 'admin',
  },
  
  SPECIALIZATIONS: [
    'haircut',
    'beard-trim',
    'shaving',
    'hair-color',
    'facial',
    'hair-treatment',
  ],
  
  DEFAULT_WORKING_HOURS: {
    START: '09:00',
    END: '18:00',
    BREAK_START: '13:00',
    BREAK_END: '14:00',
  },
  
  SLOT_DURATIONS: [30, 60, 90, 120],
  
  DOWN_PAYMENT_PERCENTAGE: 0.2,
  
  CANCELLATION_WINDOW_HOURS: 2,
  
  REMINDER_MINUTES_BEFORE: 10,
};