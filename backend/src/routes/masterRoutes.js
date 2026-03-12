const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');


router.get('/getInitialData/:id_usuario', masterController.getInitialData);
router.get('/getVirtualDate', masterController.getVirtualDate);
router.post('/nextDay', masterController.nextDay);

module.exports = router; 

 