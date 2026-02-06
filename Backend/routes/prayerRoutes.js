const express = require('express');
const router = express.Router();
const prayerController = require('../controllers/prayerController');
const upload = require('../middleware/upload');

// Today's list must come before /:id to avoid param conflict
router.get('/today/list', prayerController.getTodayList);

router.get('/', prayerController.getAll);
router.get('/:id', prayerController.getById);
router.post('/', upload.single('soundFile'), prayerController.create);
router.put('/:id', upload.single('soundFile'), prayerController.update);
router.delete('/:id', prayerController.remove);

module.exports = router;
