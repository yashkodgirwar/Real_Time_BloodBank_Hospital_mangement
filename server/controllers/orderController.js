const mongoose = require('mongoose');
const path = require('path');
const { spawn } = require('child_process');
const orders = require('../models/Order');
const User = require('../models/User');
const bills = require('../models/Bill');
const History = require('../models/History');
const sendEmail = require('../mailer');

// Deterministic coordinate generator based on address string hash
function getCoordinates(address) {
  if (!address) return { lat: 19.0760, lon: 72.8777 }; // default Mumbai
  const addr = address.toLowerCase();
  let baseLat = 19.0760; // Mumbai default
  let baseLon = 72.8777;

  if (addr.includes('pune')) {
    baseLat = 18.5204;
    baseLon = 73.8567;
  } else if (addr.includes('delhi') || addr.includes('noida') || addr.includes('gurgaon')) {
    baseLat = 28.7041;
    baseLon = 77.1025;
  } else if (addr.includes('bangalore') || addr.includes('bengaluru')) {
    baseLat = 12.9716;
    baseLon = 77.5946;
  } else if (addr.includes('hyderabad')) {
    baseLat = 17.3850;
    baseLon = 78.4867;
  } else if (addr.includes('chennai')) {
    baseLat = 13.0827;
    baseLon = 80.2707;
  } else if (addr.includes('kolkata')) {
    baseLat = 22.5726;
    baseLon = 88.3639;
  }

  // Deterministic hash code generator
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Deterministic offsets (roughly -0.05 to +0.05 degrees, ~5-10km range)
  const latOffset = ((hash & 0xFFFF) / 65535 - 0.5) * 0.1;
  const lonOffset = (((hash >> 16) & 0xFFFF) / 65535 - 0.5) * 0.1;

  return {
    lat: baseLat + latOffset,
    lon: baseLon + lonOffset
  };
}

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 1. Submit Blood Order
const orderBlood = async (req, res) => {
  const { hospitalEmail, bankId, bloodGroup, units, patientName, amount, isDirect } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'At least one approval document is required.' });
  }
  const documentNames = req.files.map(f => f.filename).join(',');

  try {
    const hospital = await User.findOne({ email: hospitalEmail, type: "hospital" });
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const isDirectVal = isDirect === 'true' || isDirect === true;

    const newOrder = new orders({
      hospitalName: hospital.name,
      hospitalEmail: hospital.email,
      bankId: bankId.toString(),
      bloodGroup,
      units,
      patientName,
      documentPath: documentNames,
      status: 'Pending',
      isDirect: isDirectVal
    });
    await newOrder.save();

    const newBill = new bills({ hospitalName: hospital.name, amount, date: new Date() });
    await newBill.save();

    await History.create({
      hospitalName: hospital.name,
      bankId,
      bloodGroup,
      units,
      patientName,
      amount,
      documentPath: documentNames,
      status: 'Pending',
      date: new Date(),
      isDirect: isDirectVal
    });

    res.status(201).json({ message: 'Order placed and document uploaded successfully.' });

  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Check Availability
const checkAvailability = async (req, res) => {
  const { bloodGroup, units, hospitalEmail } = req.body;

  try {
    const banks = await User.find({
      type: 'bloodbank',
      [`inventory.${bloodGroup}`]: { $gte: parseInt(units) }
    });

    let hospitalAddress = '';
    if (hospitalEmail) {
      const hospital = await User.findOne({ email: hospitalEmail, type: 'hospital' });
      if (hospital) {
        hospitalAddress = hospital.address || '';
      }
    } else if (req.session.user && req.session.user.type === 'hospital') {
      hospitalAddress = req.session.user.address || '';
    }

    const hospCoords = getCoordinates(hospitalAddress);

    // Map through banks, calculate distance, and sort
    const mappedBanks = banks.map(bank => {
      const bankCoords = getCoordinates(bank.address);
      const dist = calculateDistance(hospCoords.lat, hospCoords.lon, bankCoords.lat, bankCoords.lon);
      
      const bankObj = bank.toObject();
      bankObj.distance = dist;
      return bankObj;
    });

    // Sort by distance ascending
    mappedBanks.sort((a, b) => a.distance - b.distance);

    res.json(mappedBanks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Get Dashboard Requests (Blood Bank Incoming Pending Requests)
const getDashboardRequests = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const user = req.session.user;

    if (user.type !== "bloodbank") {
      return res.json([]);
    }

    const bank = await User.findOne({ email: user.email });
    if (!bank) return res.status(404).json({ message: "Bank not found" });

    const requests = await orders.find({
      bankId: bank._id.toString(),
      status: "Pending"
    });

    res.json(requests);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Get Request Status (All Pending/Approved list for Hospital / Bloodbank)
const getRequestStatus = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');

    if (!req.session.user) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ message: "Not logged in" });
      }
      return res.redirect('/login');
    }

    const user = req.session.user;

    let hospitalRequests;
    let pendingRequests;
    let bloodBank = null;

    if (user.type === "hospital") {
      hospitalRequests = await orders.find({
        hospitalEmail: user.email,
        status: 'Approved'
      });

      pendingRequests = await orders.find({
        hospitalEmail: user.email,
        status: 'Pending'
      });

    } else {
      bloodBank = await User.findOne({ email: user.email });
      if (!bloodBank) return res.status(404).send("Blood bank not found");
      console.log("DEBUG /request-status: bloodBank._id =", String(bloodBank._id));

      hospitalRequests = await orders.find({
        bankId: String(bloodBank._id),
        status: 'Approved'
      });
      console.log("DEBUG /request-status: hospitalRequests found =", hospitalRequests.length);

      pendingRequests = await orders.find({
        status: 'Pending',
        isDirect: { $ne: true }
      });
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        hospitalRequests,
        pendingRequests,
        userType: user.type,
        bloodBank: user.type === 'bloodbank' ? {
          _id: bloodBank._id,
          name: bloodBank.name,
          email: bloodBank.email,
          inventory: Object.fromEntries(bloodBank.inventory || [])
        } : null
      });
    }
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// 5. Approve Request
const approveRequest = async (req, res) => {
  try {
    const order = await orders.findById(req.params.id);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (!req.session.user || req.session.user.type !== "bloodbank") {
      return res.status(403).send("Unauthorized to approve");
    }
    const bloodBank = await User.findOne({ email: req.session.user.email });

    if (!bloodBank) {
      return res.status(404).send("Blood bank not found");
    }

    const bloodGroup = order.bloodGroup;
    const units = order.units;

    const availableUnits = bloodBank.inventory.get(bloodGroup) || 0;

    if (availableUnits < units) {
      return res.status(400).send("Not enough blood units available");
    }

    bloodBank.inventory.set(bloodGroup, availableUnits - units);
    await bloodBank.save();

    order.bankId = bloodBank._id.toString();
    order.status = 'Approved';
    await order.save();

    const hospital = await User.findOne({ name: order.hospitalName, type: "hospital" });

    if (hospital && bloodBank) {
      sendEmail(
        hospital.email,
        `🩸 Blood Request Approved by ${bloodBank.name}`,
        `
        <div style="font-family: Arial, sans-serif; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
          <h2 style="color: #d32f2f;">BloodLink Notification</h2>
          <p>Hello <strong>${hospital.name}</strong>,</p>
          <p>Your request for <strong>${order.units} units</strong> of <strong>${order.bloodGroup}</strong> blood has been 
          <span style="color: green;"><strong>approved</strong></span> by <strong>${bloodBank.name}</strong>.</p>
          <p>You can now proceed with collection at <strong>${bloodBank.name}</strong>.</p>
          <hr style="border: none; border-top: 1px solid #ccc;">
          <p style="font-size: 12px; color: #777;">This is an automated message. Please do not reply.</p>
          <p style="font-size: 14px;">— BloodLink Team</p>
        </div>
        `
      ).catch(emailErr => {
        console.error("Failed to send approval email:", emailErr);
      });
    }

    if ((req.headers.accept && req.headers.accept.includes('application/json')) || req.headers['content-type'] === 'application/json') {
      return res.json({ message: "Request approved successfully!" });
    }
    res.redirect('/request-status');

  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).send("Server error");
  }
};

// 6. Suggestions
const getSuggestions = (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ user: req.session.user || null });
  }
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
};

// 7. Get Campaign Suggestions (ML predict)
const getCampaignSuggestions = async (req, res) => {
  try {
    const allOrders = await orders.find({});

    let demandMap = {};
    allOrders.forEach(o => {
      const loc = o.hospitalName || "Central Area";
      const bg = o.bloodGroup;
      if (!loc || !bg) return;
      const key = `${loc}_${bg}`;

      if (!demandMap[key]) {
        demandMap[key] = { Location: loc, Blood_Group: bg, Approved_Requests: 0, Pending_Requests: 0 };
      }
      if (o.status === 'Approved') {
        demandMap[key].Approved_Requests += o.units || 1;
      } else {
        demandMap[key].Pending_Requests += o.units || 1;
      }
    });

    const dataList = Object.values(demandMap);
    if (dataList.length === 0) {
      dataList.push({ Location: "Central Area", Blood_Group: "O+", Approved_Requests: 0, Pending_Requests: 10 });
    }

    const pythonProcess = spawn('python', [path.join(__dirname, '..', 'ml_models', 'predict_campaign.py'), JSON.stringify(dataList)]);

    let modelResult = '';
    let errorResult = '';

    pythonProcess.stdout.on('data', (data) => {
      modelResult += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorResult += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script error: ${errorResult}`);
        return res.status(500).json({ message: "Error running ML model", details: errorResult });
      }
      try {
        const suggestion = JSON.parse(modelResult);
        res.json(suggestion);
      } catch (e) {
        console.error("Parse Error:", e, "Raw Output:", modelResult);
        res.status(500).json({ message: "Invalid ML response" });
      }
    });

  } catch (err) {
    console.error("AI Suggestion Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  orderBlood,
  checkAvailability,
  getDashboardRequests,
  getRequestStatus,
  approveRequest,
  getSuggestions,
  getCampaignSuggestions
};
