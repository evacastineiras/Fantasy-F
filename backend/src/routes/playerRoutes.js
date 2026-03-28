const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const masterController = require('../controllers/masterController')


router.get('/marketPlayers/:id_usuario', marketController.getMarketPlayers);
router.post('/modifyClause', marketController.modifyClause);
router.post('/payClause', marketController.payClause);
router.post('/marketSell', marketController.marketSell);
router.post('/makeOffer', marketController.makeOffer);
router.post('/acceptOffer', marketController.acceptOffer);
router.post('/rejectOffer', marketController.rejectOffer);
router.get('/presupuesto/:id_usuario/:id_liga', marketController.getPresupuesto);
router.post('/puja-libre', marketController.placeBidFree);
router.get('/mercadoEstado', masterController.getMercadoEstado);

module.exports = router; 