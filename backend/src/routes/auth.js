const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/editProfile', authController.editProfile);
router.delete('/deleteProfile/:id', authController.deleteProfile);
router.post('/changePassword', authController.changePassword);
router.get('/getBudgetValue/:id_usuario', authController.getBudgetValue);

module.exports = router;
