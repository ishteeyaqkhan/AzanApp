const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// Today's list must come before /:id to avoid param conflict
router.get('/today/list', eventController.getTodayList);

router.get('/', eventController.getAll);
router.get('/:id', eventController.getById);
router.post('/', eventController.create);
router.put('/:id', eventController.update);
router.delete('/:id', eventController.remove);

module.exports = router;
