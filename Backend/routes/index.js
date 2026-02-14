const express = require('express');
const router = express.Router();

const prayerRoutes = require('./prayerRoutes');
const voiceRoutes = require('./voiceRoutes');
const eventRoutes = require('./eventRoutes');
const adminRoutes = require('./adminRoutes');
const statsRoutes = require('./statsRoutes');
const announcementRoutes = require('./announcementRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const deviceRoutes = require('./deviceRoutes');

router.use('/prayers', prayerRoutes);
router.use('/voices', voiceRoutes);
router.use('/events', eventRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);
router.use('/announcements', announcementRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/devices', deviceRoutes);

module.exports = router;
