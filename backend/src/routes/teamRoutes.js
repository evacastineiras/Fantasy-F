const express = require('express');
const router = express.Router();
const { getMyTeam, saveAlineacion } = require('../controllers/teamController');

router.get('/myTeam/:id_usuario', getMyTeam);
router.post('/saveAlineacion', saveAlineacion);

module.exports = router;


