const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { clUpload } = require('../middleware/upload');

// Authentication routes
router.post('/register', clUpload.array('licenses', 10), authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/logout', authController.logoutUser);
router.get('/profile', authController.checkProfile);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.serveResetPasswordView);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
