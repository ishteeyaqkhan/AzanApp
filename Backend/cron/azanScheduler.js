const cron = require('node-cron');
const { Op } = require('sequelize');
const { Prayer, Event, Voice, EventSchedule } = require('../models');
const { sendPushToAll } = require('../services/pushService');
const { getLocalNow } = require('../utils/timezone');

function getFullAudioUrl(soundFile) {
  if (!soundFile) return null;
  if (soundFile.startsWith('http')) return soundFile;
  const base = (process.env.SERVER_URL || '').replace(/\/+$/, '');
  return `${base}/${soundFile}`;
}

function startAzanScheduler(io) {
  const startInfo = getLocalNow();
  console.log(`[Cron] Azan scheduler started. APP_TIMEZONE=${startInfo.timezone}, time=${startInfo.time}, date=${startInfo.date}`);
  cron.schedule('* * * * *', async () => {
    const local = getLocalNow();
    const currentTime = local.time;
    const today = local.date;
    const todayWeekday = local.weekday;
    console.log(`[Cron] Checking at ${currentTime} on ${today} (weekday: ${todayWeekday}, tz: ${local.timezone})`);

    try {
      // Check legacy Prayer model
      const prayers = await Prayer.findAll({
        where: {
          time: currentTime,
          isActive: true,
          date: today
        }
      });

      for (const prayer of prayers) {
        const payload = {
          id: prayer.id,
          name: prayer.name,
          time: prayer.time,
          soundFile: prayer.soundFile || null,
          type: 'prayer',
          triggeredAt: new Date().toISOString(),
        };
        console.log(`Emitting azan:trigger for prayer: ${prayer.name}`);
        io.emit('azan:trigger', payload);

        const prayerSoundUrl = getFullAudioUrl(prayer.soundFile);
        console.log(`[Push] Sending to all devices for prayer: ${prayer.name}, soundFile: ${prayerSoundUrl}`);
        sendPushToAll(`Azan - ${prayer.name}`, `It's time for ${prayer.name}`, {
          type: 'azan',
          eventId: prayer.id,
          name: prayer.name,
          time: prayer.time,
          soundFile: prayerSoundUrl,
        }).catch(err => console.error('Push error (prayer):', err));
      }

      // --- Event model queries ---

      // 1. Daily + fixed time
      const dailyFixedEvents = await Event.findAll({
        where: {
          isActive: true,
          scheduleMode: 'daily',
          timeMode: 'fixed',
          fixedTime: currentTime
        },
        include: [{ model: Voice, as: 'voice' }]
      });

      // 2. Daily + custom time (lookup via EventSchedule)
      const dailyCustomSchedules = await EventSchedule.findAll({
        where: {
          date: today,
          time: currentTime
        },
        include: [{
          model: Event,
          as: 'event',
          where: {
            isActive: true,
            scheduleMode: 'daily',
            timeMode: 'custom'
          },
          include: [{ model: Voice, as: 'voice' }]
        }]
      });

      // 3. Weekly + fixed time
      const weeklyFixedEvents = await Event.findAll({
        where: {
          isActive: true,
          scheduleMode: 'weekly',
          timeMode: 'fixed',
          fixedTime: currentTime
        },
        include: [{ model: Voice, as: 'voice' }]
      });

      // 4. Weekly + custom time (lookup via EventSchedule)
      const weeklyCustomSchedules = await EventSchedule.findAll({
        where: {
          date: today,
          time: currentTime
        },
        include: [{
          model: Event,
          as: 'event',
          where: {
            isActive: true,
            scheduleMode: 'weekly',
            timeMode: 'custom'
          },
          include: [{ model: Voice, as: 'voice' }]
        }]
      });

      // 5. Date range + fixed time
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

      // 6. Date range + custom time (lookup via EventSchedule)
      const rangeCustomSchedules = await EventSchedule.findAll({
        where: {
          date: today,
          time: currentTime
        },
        include: [{
          model: Event,
          as: 'event',
          where: {
            isActive: true,
            scheduleMode: 'date_range',
            timeMode: 'custom'
          },
          include: [{ model: Voice, as: 'voice' }]
        }]
      });

      // Combine all triggered events
      const allEvents = [
        ...dailyFixedEvents,
        ...dailyCustomSchedules.map(s => s.event),
        ...weeklyFixedEvents.filter(e => {
          const weekdays = e.weekdays || [];
          return weekdays.includes(todayWeekday);
        }),
        ...weeklyCustomSchedules.map(s => s.event).filter(e => {
          const weekdays = e.weekdays || [];
          return weekdays.includes(todayWeekday);
        }),
        ...rangeFixedEvents,
        ...rangeCustomSchedules.map(s => s.event)
      ];

      console.log(`[Cron] Found: ${prayers.length} prayers, ${dailyFixedEvents.length} dailyFixed, ${dailyCustomSchedules.length} dailyCustom, ${weeklyFixedEvents.length} weeklyFixed, ${weeklyCustomSchedules.length} weeklyCustom, ${rangeFixedEvents.length} rangeFixed, ${rangeCustomSchedules.length} rangeCustom`);

      // Filter out inactiveDays + deduplicate by event ID
      const seenIds = new Set();
      const triggeredEvents = [];
      for (const event of allEvents) {
        if (seenIds.has(event.id)) continue;
        const inactiveDays = event.inactiveDays || [];
        if (inactiveDays.includes(todayWeekday)) continue;
        seenIds.add(event.id);
        triggeredEvents.push(event);
      }

      console.log(`[Cron] ${triggeredEvents.length} event(s) to trigger at ${currentTime}`);

      for (const event of triggeredEvents) {
        if (!event.voice || !event.voice.soundFile) {
          console.warn(`[Cron] WARNING: Event "${event.name}" has NO voice/soundFile — audio won't play!`);
        }
        const payload = {
          id: event.id,
          name: event.name,
          time: event.fixedTime || currentTime,
          soundFile: event.voice ? event.voice.soundFile : null,
          type: event.type || 'azan',
          triggeredAt: new Date().toISOString(),
        };
        console.log(`[Cron] Emitting azan:trigger for event: ${event.name} (type=${event.type}), voice=${event.voice?.name || 'NONE'}, soundFile=${payload.soundFile || 'NONE'}`);
        io.emit('azan:trigger', payload);

        const eventSoundUrl = getFullAudioUrl(event.voice ? event.voice.soundFile : null);
        console.log(`[Push] Sending to all devices for event: ${event.name}, soundFile: ${eventSoundUrl}`);
        sendPushToAll(`Azan - ${event.name}`, `It's time for ${event.name}`, {
          type: 'azan',
          eventId: event.id,
          name: event.name,
          time: event.fixedTime || currentTime,
          soundFile: eventSoundUrl,
        }).catch(err => console.error('Push error (event):', err));
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
}

module.exports = startAzanScheduler;
