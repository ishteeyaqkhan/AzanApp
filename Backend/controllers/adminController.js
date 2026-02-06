const login = async (req, res) => {
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
};

module.exports = { login };
