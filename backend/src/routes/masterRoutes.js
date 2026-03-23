const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');


router.get('/getInitialData/:id_usuario', masterController.getInitialData);
router.get('/getVirtualDate', masterController.getVirtualDate);
router.post('/nextDay', masterController.nextDay);
router.post('/importarJornada',        masterController.upload.single('file'), masterController.importarJornada);
router.post('/calcularPuntos/:numero', masterController.calcularPuntosJornada);
router.get('/mercado-estado', masterController.getMercadoEstado);
router.get('/calendario/:mes/:anyo', masterController.getCalendario);

module.exports = router; 

 