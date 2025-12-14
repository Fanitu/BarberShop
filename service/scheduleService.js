const Schedule = require('../models/Schedule');
const Barber = require('../models/Barber');
const { generateTimeSlots } = require('../utils/timeSlots');

const generateScheduleForPeriod = async (barberId, startDate, endDate) => {
  try {
    const barber = await Barber.findById(barberId);
    if (!barber) {
      throw new Error('Barber not found');
    }

    const schedules = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      // Skip weekends (optional)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check if schedule already exists
      const existingSchedule = await Schedule.findOne({
        barber: barberId,
        date: currentDate,
      });

      if (!existingSchedule) {
        const slots = generateTimeSlots(
          barber.workingHours.start,
          barber.workingHours.end,
          barber.slotDuration,
          barber.breakStart,
          barber.breakEnd
        );

        const schedule = await Schedule.create({
          barber: barberId,
          date: new Date(currentDate),
          slots,
          isWorkingDay: true,
        });

        schedules.push(schedule);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
  } catch (error) {
    throw error;
  }
};

const getAvailableSlots = async (barberId, date) => {
  try {
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);

    let schedule = await Schedule.findOne({
      barber: barberId,
      date: scheduleDate,
    });

    if (!schedule) {
      const barber = await Barber.findById(barberId);
      if (!barber) {
        throw new Error('Barber not found');
      }

      const slots = generateTimeSlots(
        barber.workingHours.start,
        barber.workingHours.end,
        barber.slotDuration,
        barber.breakStart,
        barber.breakEnd
      );

      schedule = await Schedule.create({
        barber: barberId,
        date: scheduleDate,
        slots,
      });
    }

    // Filter available slots
    const availableSlots = schedule.slots
      .filter(slot => slot.status === 'available')
      .map((slot, index) => ({
        slotIndex: index,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: schedule.barber.slotDuration,
      }));

    return {
      date: schedule.date,
      isWorkingDay: schedule.isWorkingDay,
      slots: availableSlots,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateScheduleForPeriod,
  getAvailableSlots,
};