const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');

router.post('/createLeague', leagueController.createLeague);
router.post('/privateLeague', leagueController.joinPrivateLeague);
router.post('/publicLeague', leagueController.joinRandomLeague);
router.post('/changeLeague', leagueController.changeLeague);

module.exports = router; 