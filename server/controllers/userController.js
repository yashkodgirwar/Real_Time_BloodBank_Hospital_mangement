const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const orders = require('../models/Order');

// 1. Get Hospitals
const getHospitals = async (req, res) => {
  try {
    const hospitals = await User.find({ type: "hospital" });
    res.json(hospitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Get Blood Banks
const getBloodBanks = async (req, res) => {
  try {
    const bloodbanks = await User.find({ type: "bloodbank" });
    res.json(bloodbanks.map(bank => ({
      ...bank.toObject(),
      inventory: Object.fromEntries(bank.inventory || [])
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Get Hospital Profile Details
const getHospitalProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ message: "Invalid Hospital ID" });
      }
      return res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
    }

    const hospital = await User.findById(req.params.id);
    if (!hospital || hospital.type !== 'hospital') {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      return res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(hospital);
    }
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
  } catch (err) {
    console.error("Get hospital error:", err);
    res.status(500).send("Server error");
  }
};

// 3b. Get Blood Bank Profile Details
const getBloodBankProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ message: "Invalid Blood Bank ID" });
      }
      return res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
    }

    const bank = await User.findById(req.params.id);
    if (!bank || bank.type !== 'bloodbank') {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({ message: "Blood bank not found" });
      }
      return res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(bank);
    }
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
  } catch (err) {
    console.error("Get bloodbank error:", err);
    res.status(500).send("Server error");
  }
};

// 4. Update Hospital Details
const updateHospital = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Hospital ID" });
    }
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (req.session.user && req.session.user._id === req.params.id) {
      req.session.user.name = updated.name;
      req.session.user.email = updated.email;
      req.session.user.address = updated.address;
      req.session.user.licenseNumber = updated.licenseNumber;
    }

    if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
      return res.json({ message: "Hospital updated successfully!" });
    }
    res.redirect(`/hospital/${req.params.id}`);
  } catch (err) {
    console.error("Update hospital error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 4b. Update Blood Bank Details
const updateBloodBank = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Blood Bank ID" });
    }
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.session.user && req.session.user._id === req.params.id) {
      req.session.user.name = updated.name;
      req.session.user.email = updated.email;
      req.session.user.address = updated.address;
      req.session.user.licenseNumber = updated.licenseNumber;
    }

    if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
      return res.json({ message: "Blood bank updated successfully!" });
    }
    res.redirect(`/bloodbank/${req.params.id}`);
  } catch (err) {
    console.error("Update blood bank error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 5. Request Hospital Deletion (29 Days Delay)
const deleteHospital = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Hospital ID" });
    }
    await User.findByIdAndUpdate(req.params.id, {
      deleteRequested: true,
      deleteDate: new Date()
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ message: "Your hospital will be deleted after 29 days." });
    }
    res.send("Your hospital will be deleted after 29 days.");
  } catch (err) {
    console.error("Delete hospital error:", err);
    res.status(500).send("Server error");
  }
};

// 5b. Request Blood Bank Deletion (29 Days Delay)
const deleteBloodBank = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Blood Bank ID" });
    }
    await User.findByIdAndUpdate(req.params.id, {
      deleteRequested: true,
      deleteDate: new Date()
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ message: "Your blood bank will be deleted after 29 days." });
    }
    res.send("Your blood bank will be deleted after 29 days.");
  } catch (err) {
    console.error("Delete blood bank error:", err);
    res.status(500).send("Server error");
  }
};

// 6. Upload Profile Image
const uploadProfileImage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    
    let profileImagePath;
    if (req.file.path && req.file.path.startsWith('http')) {
      profileImagePath = req.file.path;
    } else {
      profileImagePath = `/uploads/${req.file.filename}`;
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, {
      profileImage: profileImagePath
    }, { new: true });

    if (req.session.user && req.session.user._id === req.params.id) {
      req.session.user.profileImage = profileImagePath;
    }

    if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
      return res.json({ message: "Profile image uploaded!", profileImage: profileImagePath });
    }
    
    const redirectPath = user.type === 'bloodbank' ? `/bloodbank/${req.params.id}` : `/hospital/${req.params.id}`;
    res.redirect(redirectPath);
  } catch (err) {
    console.error("Upload profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 7. Remove Profile Image
const removeProfileImage = async (req, res) => {
  try {
    console.log("Remove clicked ✅");

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profileImage && !user.profileImage.startsWith('http')) {
      // Resolve path relative to server root only if it's a local file
      const filePath = path.join(__dirname, '..', user.profileImage);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.profileImage = "";
    await user.save();

    if (req.session.user && req.session.user._id === req.params.id) {
      req.session.user.profileImage = "";
    }

    res.json({ message: "Profile image removed successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 8. Get Hospital Analytics
const getHospitalAnalytics = async (req, res) => {
  try {
    const hospital = await User.findById(req.params.id);
    const ordersByHospital = await orders.find({ hospitalName: hospital.name });

    const grouped = await orders.aggregate([
      { $match: { hospitalName: hospital.name } },
      { $group: { _id: "$bloodGroup", total: { $sum: 1 } } }
    ]);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        hospital,
        stats: {
          labels: grouped.map(g => g._id),
          orders: grouped.map(g => g.total),
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          monthlyOrders: [ordersByHospital.length, 0, 0, 0, 0, 0],
          units: grouped.map(g => g.total * 5),
          billing: [ordersByHospital.length * 5000, 0, 0, 0, 0, 0]
        }
      });
    }
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

module.exports = {
  getHospitals,
  getBloodBanks,
  getHospitalProfile,
  getBloodBankProfile,
  updateHospital,
  updateBloodBank,
  deleteHospital,
  deleteBloodBank,
  uploadProfileImage,
  removeProfileImage,
  getHospitalAnalytics
};
