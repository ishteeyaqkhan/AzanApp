const { Voice, Event, User } = require('../models');

const getStats = async (req, res) => {
  try {
    const totalVoices = await Voice.count();
    const activeVoices = await Voice.count({ where: { isActive: true } });
    const totalEvents = await Event.count();
    const activeEvents = await Event.count({ where: { isActive: true } });
    const totalUsers = await User.count();
    res.json({ totalVoices, activeVoices, totalEvents, activeEvents, totalUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStats };
