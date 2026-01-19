const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');


router.get('/marketPlayers/:id_usuario', marketController.getMarketPlayers);

module.exports = router; 