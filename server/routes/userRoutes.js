const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { upload } = require('../middleware/upload');

// User and Profile routes
router.get('/hospitals', userController.getHospitals);
router.get('/bloodbanks', userController.getBloodBanks);

// Hospital profile routes
router.get('/hospital/:id', userController.getHospitalProfile);
router.post('/update-hospital/:id', userController.updateHospital);
router.get('/delete-hospital/:id', userController.deleteHospital);

// Blood Bank profile routes
router.get('/bloodbank/:id', userController.getBloodBankProfile);
router.post('/update-bloodbank/:id', userController.updateBloodBank);
router.get('/delete-bloodbank/:id', userController.deleteBloodBank);

router.post('/upload-profile/:id', upload.single('profileImage'), userController.uploadProfileImage);
router.post('/remove-profile/:id', userController.removeProfileImage);
router.get('/hospital-analytics/:id', userController.getHospitalAnalytics);

module.exports = router;
