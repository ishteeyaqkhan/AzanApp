const cron = require('node-cron');
const { Op } = require('sequelize');
const { Prayer, Event, Voice, EventSchedule } = require('../models');

function startAzanScheduler() {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    try {
      // Check legacy Prayer model
      const prayers = await Prayer.findAll({
        where: {
          time: currentTime,
          isActive: true,
          date: today
        }
      });

      if (prayers.length > 0) {
        console.log(`Azan time for: ${prayers.map(p => p.name).join(', ')}`);
      }

      // Check new Event model
      // 1. Daily events with fixed time
      const dailyEvents = await Event.findAll({
        where: {
          isActive: true,
          scheduleMode: 'daily',
          fixedTime: currentTime
        },
        include: [{ model: Voice, as: 'voice' }]
      });

      // 2. Date range events with fixed time
      const rangeFixedEvents = await Event.findAll({
        where: {
          isActive: true,
          scheduleMode: 'date_range',
          timeMode: 'fixed',
          fixedTime: currentTime,
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today }
        },
        include: [{ model: Voice, as: 'voice' }]
      });

      // 3. Date range events with custom per-day times
      const customSchedules = await EventSchedule.findAll({
        where: {
          date: today,
          time: currentTime
        },
        include: [{
          model: Event,
          as: 'event',
          where: { isActive: true },
          include: [{ model: Voice, as: 'voice' }]
        }]
      });

      const triggeredEvents = [
        ...dailyEvents,
        ...rangeFixedEvents,
        ...customSchedules.map(s => s.event)
      ];

      if (triggeredEvents.length > 0) {
        console.log(`Event time for: ${triggeredEvents.map(e => `${e.name} (${e.type})`).join(', ')}`);
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
}

module.exports = startAzanScheduler;
