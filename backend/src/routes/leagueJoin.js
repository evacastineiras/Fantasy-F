const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');

router.post('/createLeague', leagueController.createLeague);
router.post('/privateLeague', leagueController.joinPrivateLeague);
router.post('/publicLeague', leagueController.joinRandomLeague);
router.post('/changeLeague', leagueController.changeLeague);
router.get('/getClasificacion/:id_usuario', leagueController.getClasificacion);
router.post('/updateName', leagueController.updateLeagueName);


module.exports = router; 