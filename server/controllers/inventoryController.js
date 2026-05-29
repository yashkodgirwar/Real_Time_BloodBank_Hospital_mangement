const path = require('path');
const User = require('../models/User');

// 1. Get Inventory Details for Specific Bank
const getInventoryDetails = (req, res) => {
  const bankId = req.params.bankId;
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({
      bankId,
      userType: req.session && req.session.user ? req.session.user.type : null
    });
  }
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
};

// 2. Fallback Inventory query routing
const getInventoryFallback = (req, res) => {
  const bankId = req.query.bankId;
  if (bankId) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ bankId });
    }
    res.redirect(`/inventory/${bankId}`);
  } else {
    res.status(400).json({ message: "Bank ID is required." });
  }
};

// 3. Update Inventory (Add units of blood groups)
const updateInventory = async (req, res) => {
  const {
    bankId,
    Aplus, Aminus, Bplus, Bminus,
    ABplus, ABminus, Oplus, Ominus
  } = req.body;

  try {
    const bloodBank = await User.findById(bankId);

    if (!bloodBank || bloodBank.type !== "bloodbank") {
      return res.status(404).send("Blood bank not found.");
    }

    const inventory = bloodBank.inventory;
    if (Aplus) inventory.set("A+", (inventory.get("A+") || 0) + parseInt(Aplus));
    if (Aminus) inventory.set("A-", (inventory.get("A-") || 0) + parseInt(Aminus));
    if (Bplus) inventory.set("B+", (inventory.get("B+") || 0) + parseInt(Bplus));
    if (Bminus) inventory.set("B-", (inventory.get("B-") || 0) + parseInt(Bminus));
    if (ABplus) inventory.set("AB+", (inventory.get("AB+") || 0) + parseInt(ABplus));
    if (ABminus) inventory.set("AB-", (inventory.get("AB-") || 0) + parseInt(ABminus));
    if (Oplus) inventory.set("O+", (inventory.get("O+") || 0) + parseInt(Oplus));
    if (Ominus) inventory.set("O-", (inventory.get("O-") || 0) + parseInt(Ominus));

    await bloodBank.save();

    if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
      return res.json({ message: "Inventory updated successfully!", inventory: Object.fromEntries(bloodBank.inventory || []) });
    }
    res.redirect('/?show=lists');

  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).send("Server error.");
  }
};

module.exports = {
  getInventoryDetails,
  getInventoryFallback,
  updateInventory
};
