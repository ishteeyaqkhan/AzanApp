const { Event, Voice, EventSchedule } = require('../models');

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
    const today = new Date().toISOString().split('T')[0];

    // Find events that are active today
    const events = await Event.findAll({
      where: { isActive: true },
      include: [
        { model: Voice, as: 'voice' },
        { model: EventSchedule, as: 'schedules' }
      ]
    });

    const todayEvents = [];
    for (const event of events) {
      let time = null;

      if (event.scheduleMode === 'daily') {
        time = event.fixedTime;
      } else {
        // date_range mode - check if today falls in range
        if (event.startDate && event.endDate && today >= event.startDate && today <= event.endDate) {
          if (event.timeMode === 'fixed') {
            time = event.fixedTime;
          } else {
            // custom mode - find schedule for today
            const schedule = event.schedules.find(s => s.date === today);
            time = schedule ? schedule.time : null;
          }
        }
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
    res.json(todayEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, type, voiceId, scheduleMode, startDate, endDate, timeMode, fixedTime, isActive, schedules } = req.body;

    const event = await Event.create({
      name,
      type,
      voiceId,
      scheduleMode,
      startDate: scheduleMode === 'date_range' ? startDate : null,
      endDate: scheduleMode === 'date_range' ? endDate : null,
      timeMode: scheduleMode === 'daily' ? 'fixed' : timeMode,
      fixedTime: (scheduleMode === 'daily' || timeMode === 'fixed') ? fixedTime : null,
      isActive: isActive !== undefined ? isActive : true
    });

    // Create custom schedules if applicable
    if (scheduleMode === 'date_range' && timeMode === 'custom' && Array.isArray(schedules)) {
      await EventSchedule.bulkCreate(
        schedules.map(s => ({ eventId: event.id, date: s.date, time: s.time }))
      );
    }

    // Re-fetch with associations
    const created = await Event.findByPk(event.id, {
      include: [
        { model: Voice, as: 'voice' },
        { model: EventSchedule, as: 'schedules' }
      ]
    });

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

    const { name, type, voiceId, scheduleMode, startDate, endDate, timeMode, fixedTime, isActive, schedules } = req.body;

    await event.update({
      name,
      type,
      voiceId,
      scheduleMode,
      startDate: scheduleMode === 'date_range' ? startDate : null,
      endDate: scheduleMode === 'date_range' ? endDate : null,
      timeMode: scheduleMode === 'daily' ? 'fixed' : timeMode,
      fixedTime: (scheduleMode === 'daily' || timeMode === 'fixed') ? fixedTime : null,
      isActive: isActive !== undefined ? isActive : true
    });

    // Replace schedules
    await EventSchedule.destroy({ where: { eventId: event.id } });
    if (scheduleMode === 'date_range' && timeMode === 'custom' && Array.isArray(schedules)) {
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
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, getTodayList, create, update, remove };
