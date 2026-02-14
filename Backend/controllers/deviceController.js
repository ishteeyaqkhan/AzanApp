const { DeviceToken } = require('../models');

const register = async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const [device, created] = await DeviceToken.findOrCreate({
      where: { token },
      defaults: { token, platform: platform || 'android' }
    });

    if (!created && device.platform !== platform) {
      await device.update({ platform });
    }

    res.json({ message: created ? 'Device registered' : 'Device already registered', device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const unregister = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const deleted = await DeviceToken.destroy({ where: { token } });
    res.json({ message: deleted ? 'Device unregistered' : 'Token not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, unregister };
