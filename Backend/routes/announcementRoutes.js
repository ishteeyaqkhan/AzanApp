const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const upload = require('../middleware/upload');

router.post('/', upload.single('audioFile'), announcementController.broadcast);

module.exports = router;
