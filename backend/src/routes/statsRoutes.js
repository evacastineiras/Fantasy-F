const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');


router.get('/getTopStats/:criterio', statsController.getTopStats);
router.get('/getMyTeamStats/:id_usuario', statsController.getMyTeamStats);
router.get('/getFeed/:id', statsController.getFeed );
router.get('/getPersonalFeed/:id_usuario', statsController.getPersonalFeed);
router.get('/getUnreadCount/:id_usuario', statsController.getUnreadCount);
router.post('/getPlayerInfo', statsController.getPlayerInfo);
router.post('/markAsRead', statsController.markAsRead);
router.post('/getPlayerValueHistory', statsController.getPlayerValueHistory);

module.exports = router; 