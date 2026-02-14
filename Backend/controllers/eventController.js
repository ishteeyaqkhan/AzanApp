const { Event, Voice, EventSchedule } = require('../models');
const { sendSilentPushToAll } = require('../services/pushService');

const getAll = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        { model: Voice, as: 'voice' },
        { model: EventSchedule, as: 'schedules', order: [['date', 'ASC']] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Voice, as: 'voice' },
        { model: EventSchedule, as: 'schedules', order: [['date', 'ASC']] }
      ]
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTodayList = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todayWeekday = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday

    const events = await Event.findAll({
      where: { isActive: true },
      include: [
        { model: Voice, as: 'voice' },
        { model: EventSchedule, as: 'schedules' }
      ]
    });

    const todayEvents = [];
    for (const event of events) {
      // Skip if today's weekday is in inactiveDays
      const inactiveDays = event.inactiveDays || [];
      if (inactiveDays.includes(todayWeekday)) continue;

      let applicable = false;

      if (event.scheduleMode === 'daily') {
        applicable = true;
      } else if (event.scheduleMode === 'weekly') {
        const weekdays = event.weekdays || [];
        if (!weekdays.includes(todayWeekday)) continue;
        // Optional date bounds for weekly
        if (event.startDate && event.endDate) {
          applicable = today >= event.startDate && today <= event.endDate;
        } else {
          applicable = true;
        }
      } else if (event.scheduleMode === 'date_range') {
        if (event.startDate && event.endDate) {
          applicable = today >= event.startDate && today <= event.endDate;
        }
      }

      if (!applicable) continue;

      // Resolve time
      let time = null;
      if (event.timeMode === 'custom') {
        const schedule = event.schedules.find(s => s.date === today);
        time = schedule ? schedule.time : event.fixedTime; // fallback to fixedTime
      } else {
        time = event.fixedTime;
      }

      if (time) {
        todayEvents.push({
          id: event.id,
          name: event.name,
          type: event.type,
          time,
          voiceName: event.voice ? event.voice.name : null,
          soundFile: event.voice ? event.voice.soundFile : null
        });
      }
    }

    todayEvents.sort((a, b) => a.time.localeCompare(b.time));
    console.log(`todays events ------------------>`, todayEvents);
    res.json(todayEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, type, voiceId, scheduleMode, startDate, endDate, timeMode, fixedTime, isActive, weekdays, inactiveDays, schedules } = req.body;

    const event = await Event.create({
      name,
      type,
      voiceId,
      scheduleMode,
      weekdays: scheduleMode === 'weekly' ? weekdays : null,
      inactiveDays: Array.isArray(inactiveDays) && inactiveDays.length > 0 ? inactiveDays : null,
      startDate: (scheduleMode === 'date_range' || scheduleMode === 'weekly') ? startDate : null,
      endDate: (scheduleMode === 'date_range' || scheduleMode === 'weekly') ? endDate : null,
      timeMode,
      fixedTime: fixedTime || null,
      isActive: isActive !== undefined ? isActive : true
    });

    // Create custom schedules for any mode with custom timeMode
    if (timeMode === 'custom' && Array.isArray(schedules)) {
      await EventSchedule.bulkCreate(
        schedules.map(s => ({ eventId: event.id, date: s.date, time: s.time }))
      );
    }

    const created = await Event.findByPk(event.id, {
      include: [
        { model: Voice, as: 'voice' },
        { model: EventSchedule, as: 'schedules' }
      ]
    });

    req.app.get('io').emit('data:updated', { type: 'event' });
    sendSilentPushToAll({ type: 'data_updated', entity: 'event' })
      .catch(err => console.error('Silent push error:', err));
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { name, type, voiceId, scheduleMode, startDate, endDate, timeMode, fixedTime, isActive, weekdays, inactiveDays, schedules } = req.body;

    await event.update({
      name,
      type,
      voiceId,
      scheduleMode,
      weekdays: scheduleMode === 'weekly' ? weekdays : null,
      inactiveDays: Array.isArray(inactiveDays) && inactiveDays.length > 0 ? inactiveDays : null,
      startDate: (scheduleMode === 'date_range' || scheduleMode === 'weekly') ? startDate : null,
      endDate: (scheduleMode === 'date_range' || scheduleMode === 'weekly') ? endDate : null,
      timeMode,
      fixedTime: fixedTime || null,
      isActive: isActive !== undefined ? isActive : true
    });

    // Replace schedules
    await EventSchedule.destroy({ where: { eventId: event.id } });
    if (timeMode === 'custom' && Array.isArray(schedules)) {
      await EventSchedule.bulkCreate(
        schedules.map(s => ({ eventId: event.id, date: s.date, time: s.time }))
      );
    }

    const updated = await Event.findByPk(event.id, {
      include: [
        { model: Voice, as: 'voice' },
        { model: EventSchedule, as: 'schedules' }
      ]
    });

    req.app.get('io').emit('data:updated', { type: 'event' });
    sendSilentPushToAll({ type: 'data_updated', entity: 'event' })
      .catch(err => console.error('Silent push error:', err));
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    await EventSchedule.destroy({ where: { eventId: event.id } });
    await event.destroy();
    req.app.get('io').emit('data:updated', { type: 'event' });
    sendSilentPushToAll({ type: 'data_updated', entity: 'event' })
      .catch(err => console.error('Silent push error:', err));
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, getTodayList, create, update, remove };
