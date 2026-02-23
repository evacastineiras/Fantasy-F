const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');


router.get('/getTopStats/:criterio', statsController.getTopStats);
router.get('/getFeed/:id', statsController.getFeed );
router.post('/getPlayerInfo', statsController.getPlayerInfo);

module.exports = router; 