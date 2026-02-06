const { Voice, Event } = require('../models');
const { deleteCloudinaryFile } = require('../utils/cloudinaryHelper');

const getAll = async (req, res) => {
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
};

const getById = async (req, res) => {
  try {
    const voice = await Voice.findByPk(req.params.id);
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }
    res.json(voice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    console.log("call ------------------>")
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
    console.log("error",error)
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
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
      // Delete old file from Cloudinary if replacing
      await deleteCloudinaryFile(voice.soundFile);
      updateData.soundFile = req.file.path;
    }
    await voice.update(updateData);
    res.json(voice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const voice = await Voice.findByPk(req.params.id);
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }
    const eventCount = await Event.count({ where: { voiceId: voice.id } });
    if (eventCount > 0) {
      return res.status(400).json({ error: `Cannot delete voice. It is used by ${eventCount} event(s).` });
    }

    // Delete audio file from Cloudinary
    await deleteCloudinaryFile(voice.soundFile);

    await voice.destroy();
    res.json({ message: 'Voice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
