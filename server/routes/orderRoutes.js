const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { upload } = require('../middleware/upload');

// Helper to handle multer errors in order upload route
const uploadMiddlewareWrapper = (req, res, next) => {
  upload.array('approvalDoc', 5)(req, res, err => {
    if (err) {
      const multer = require('multer');
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File too large. Max is 15 MB.' });
      } else {
        return res.status(400).json({ message: err.message });
      }
    }
    next();
  });
};

// Order and request routes
router.post('/order-blood', uploadMiddlewareWrapper, orderController.orderBlood);
router.post('/check-availability', orderController.checkAvailability);
router.get('/dashboard-requests', orderController.getDashboardRequests);
router.get('/request-status', orderController.getRequestStatus);
router.post('/approve-request/:id', orderController.approveRequest);
router.get('/suggestions', orderController.getSuggestions);
router.get('/api/campaign-suggestions', orderController.getCampaignSuggestions);

module.exports = router;
