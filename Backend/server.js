const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// PostgreSQL Connection with Sequelize
const isProduction = process.env.NODE_ENV === 'production';
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/azan_db', {
  dialect: 'postgres',
  logging: isProduction ? false : console.log,
  dialectOptions: isProduction ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

// Multer configuration for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Prayer Model
const Prayer = sequelize.define('Prayer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.ENUM('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'),
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false
  },
  soundFile: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'sound_file'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'prayers',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Voice Model
const Voice = sequelize.define('Voice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  soundFile: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'sound_file'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'voices',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Event Model
const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  voiceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'voice_id',
    references: {
      model: 'voices',
      key: 'id'
    }
  },
  scheduleMode: {
    type: DataTypes.ENUM('daily', 'date_range'),
    allowNull: false,
    defaultValue: 'daily',
    field: 'schedule_mode'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date'
  },
  timeMode: {
    type: DataTypes.ENUM('fixed', 'custom'),
    allowNull: false,
    defaultValue: 'fixed',
    field: 'time_mode'
  },
  fixedTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fixed_time'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'events',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// EventSchedule Model (per-day custom times)
const EventSchedule = sequelize.define('EventSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'event_id',
    references: {
      model: 'events',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'event_schedules',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Voice.hasMany(Event, { foreignKey: 'voice_id', as: 'events' });
Event.belongsTo(Voice, { foreignKey: 'voice_id', as: 'voice' });
Event.hasMany(EventSchedule, { foreignKey: 'event_id', as: 'schedules', onDelete: 'CASCADE' });
EventSchedule.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Admin Model
const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'admins',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Sync database (creates tables if they don't exist)
sequelize.sync({ alter: !isProduction })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database sync error:', err));

// Routes

// Get all prayers
app.get('/api/prayers', async (req, res) => {
  try {
    const { date } = req.query;
    const whereClause = {};

    if (date) {
      whereClause.date = date;
    }

    const prayers = await Prayer.findAll({
      where: whereClause,
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    res.json(prayers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prayer by ID
app.get('/api/prayers/:id', async (req, res) => {
  try {
    const prayer = await Prayer.findByPk(req.params.id);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    res.json(prayer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new prayer
app.post('/api/prayers', upload.single('soundFile'), async (req, res) => {
  try {
    const { name, time, date, isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Sound file is required' });
    }

    const prayer = await Prayer.create({
      name,
      time,
      date,
      soundFile: req.file.path,
      isActive: isActive === 'true' || isActive === true
    });

    res.status(201).json(prayer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update prayer
app.put('/api/prayers/:id', upload.single('soundFile'), async (req, res) => {
  try {
    const { name, time, date, isActive } = req.body;
    const updateData = { name, time, date };

    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true;
    }

    if (req.file) {
      updateData.soundFile = req.file.path;
    }

    const prayer = await Prayer.findByPk(req.params.id);

    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }

    await prayer.update(updateData);
    res.json(prayer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete prayer
app.delete('/api/prayers/:id', async (req, res) => {
  try {
    const prayer = await Prayer.findByPk(req.params.id);

    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }

    await prayer.destroy();
    res.json({ message: 'Prayer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's prayers
app.get('/api/prayers/today/list', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const prayers = await Prayer.findAll({
      where: {
        date: today,
        isActive: true
      },
      order: [['time', 'ASC']]
    });

    res.json(prayers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Voice CRUD Routes =====

// Get all voices
app.get('/api/voices', async (req, res) => {
  try {
    const whereClause = {};
    if (req.query.active === 'true') {
      whereClause.isActive = true;
    }
    const voices = await Voice.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    res.json(voices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single voice
app.get('/api/voices/:id', async (req, res) => {
  try {
    const voice = await Voice.findByPk(req.params.id);
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }
    res.json(voice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create voice (multipart, audio upload)
app.post('/api/voices', upload.single('soundFile'), async (req, res) => {
  try {
    const { name, isActive } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    const voice = await Voice.create({
      name,
      soundFile: req.file.path,
      isActive: isActive === 'true' || isActive === true
    });
    res.status(201).json(voice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update voice (optional audio replacement)
app.put('/api/voices/:id', upload.single('soundFile'), async (req, res) => {
  try {
    const voice = await Voice.findByPk(req.params.id);
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    if (req.file) {
      updateData.soundFile = req.file.path;
    }
    await voice.update(updateData);
    res.json(voice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete voice (blocked if used by events)
app.delete('/api/voices/:id', async (req, res) => {
  try {
    const voice = await Voice.findByPk(req.params.id);
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }
    const eventCount = await Event.count({ where: { voiceId: voice.id } });
    if (eventCount > 0) {
      return res.status(400).json({ error: `Cannot delete voice. It is used by ${eventCount} event(s).` });
    }
    await voice.destroy();
    res.json({ message: 'Voice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Event CRUD Routes =====

// Get today's active events with resolved times (defined BEFORE /api/events/:id)
app.get('/api/events/today/list', async (req, res) => {
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
});

// Get all events with voice + schedules
app.get('/api/events', async (req, res) => {
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
});

// Get single event with associations
app.get('/api/events/:id', async (req, res) => {
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
});

// Create event (JSON body, includes schedules array)
app.post('/api/events', async (req, res) => {
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
});

// Update event (replaces schedules if custom mode)
app.put('/api/events/:id', async (req, res) => {
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
});

// Delete event (cascades to schedules)
app.delete('/api/events/:id', async (req, res) => {
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
});

// ===== Dashboard Stats =====
app.get('/api/stats', async (req, res) => {
  try {
    const totalVoices = await Voice.count();
    const activeVoices = await Voice.count({ where: { isActive: true } });
    const totalEvents = await Event.count();
    const activeEvents = await Event.count({ where: { isActive: true } });
    res.json({ totalVoices, activeVoices, totalEvents, activeEvents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin login (simplified - add proper JWT auth in production)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // For demo purposes - in production use proper password hashing
    if (username === 'admin' && password === 'admin123') {
      res.json({
        success: true,
        token: 'demo-token',
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cron job to check and trigger azan (placeholder for notification service)
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
