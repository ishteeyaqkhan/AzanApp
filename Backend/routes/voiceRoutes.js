const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const upload = require('../middleware/upload');

router.get('/', voiceController.getAll);
router.get('/:id', voiceController.getById);
router.post('/', upload.single('soundFile'), voiceController.create);
router.put('/:id', upload.single('soundFile'), voiceController.update);
router.delete('/:id', voiceController.remove);

module.exports = router;
