const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Inventory routes
router.get('/inventory/:bankId', inventoryController.getInventoryDetails);
router.get('/inventory', inventoryController.getInventoryFallback);
router.post('/update-inventory', inventoryController.updateInventory);

module.exports = router;
