const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// Campaign routes
router.post('/create-campaign', campaignController.createCampaign);
router.get('/campaigns', campaignController.getCampaigns);

module.exports = router;
