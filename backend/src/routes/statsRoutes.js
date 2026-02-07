const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');


router.get('/getTopStats/:criterio', statsController.getTopStats);

module.exports = router; 