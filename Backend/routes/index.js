const express = require('express');
const router = express.Router();

const prayerRoutes = require('./prayerRoutes');
const voiceRoutes = require('./voiceRoutes');
const eventRoutes = require('./eventRoutes');
const adminRoutes = require('./adminRoutes');
const statsRoutes = require('./statsRoutes');

router.use('/prayers', prayerRoutes);
router.use('/voices', voiceRoutes);
router.use('/events', eventRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
