const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');


router.get('/marketPlayers/:id_usuario', marketController.getMarketPlayers);
router.post('/modifyClause', marketController.modifyClause);
router.post('/payClause', marketController.payClause);
router.post('/marketSell', marketController.marketSell);

module.exports = router; 