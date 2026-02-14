const broadcast = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const title = req.body.title || 'Live Announcement';
    const audioUrl = req.file.path;
    const payload = {
      audioUrl,
      title,
      timestamp: new Date().toISOString(),
    };

    console.log('Broadcasting live announcement:', payload);
    req.app.get('io').emit('live:announcement', payload);

    res.json({ message: 'Announcement broadcast successfully', ...payload });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { broadcast };
