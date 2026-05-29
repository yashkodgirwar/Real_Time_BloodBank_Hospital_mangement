const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// Billing routes
router.post('/generate-bill', billingController.generateBill);
router.get('/billing', billingController.getBilling);
router.get('/hospital-names', billingController.getHospitalNames);
router.get('/hospital-billing', billingController.getHospitalBilling);
router.get('/bloodbank-pending-bills', billingController.getBloodbankPendingBills);
router.get('/api/config/razorpay', billingController.getRazorpayConfig);
router.post('/create-razorpay-order', billingController.createRazorpayOrder);
router.post('/pay-bill', billingController.payBill);
router.get('/history', billingController.getHistory);

module.exports = router;
