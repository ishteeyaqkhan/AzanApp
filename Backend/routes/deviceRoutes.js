const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.post('/register', deviceController.register);
router.post('/unregister', deviceController.unregister);

module.exports = router;
