const { Prayer } = require('../models');
const { deleteCloudinaryFile } = require('../utils/cloudinaryHelper');

const getAll = async (req, res) => {
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
};

const getById = async (req, res) => {
  try {
    const prayer = await Prayer.findByPk(req.params.id);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }
    res.json(prayer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTodayList = async (req, res) => {
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
};

const create = async (req, res) => {
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
};

const update = async (req, res) => {
  try {
    const { name, time, date, isActive } = req.body;
    const updateData = { name, time, date };

    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true;
    }

    const prayer = await Prayer.findByPk(req.params.id);

    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }

    if (req.file) {
      // Delete old file from Cloudinary if replacing
      await deleteCloudinaryFile(prayer.soundFile);
      updateData.soundFile = req.file.path;
    }

    await prayer.update(updateData);
    res.json(prayer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const prayer = await Prayer.findByPk(req.params.id);

    if (!prayer) {
      return res.status(404).json({ error: 'Prayer not found' });
    }

    // Delete audio file from Cloudinary
    await deleteCloudinaryFile(prayer.soundFile);

    await prayer.destroy();
    res.json({ message: 'Prayer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, getTodayList, create, update, remove };
