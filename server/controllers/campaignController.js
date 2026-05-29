const Campaign = require('../models/Campaign');

// 1. Create Blood Campaign
const createCampaign = async (req, res) => {
  try {
    const { organizerName, location, startDate, endDate, contact, details } = req.body;

    if (!organizerName || !location || !startDate || !endDate || !contact || !details) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Apply regex validations
    // Contact: accepts 10-15 digit phone (optional +) or standard email address
    const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!phoneRegex.test(contact) && !emailRegex.test(contact)) {
      return res.status(400).json({ message: 'Contact details must be a valid phone number (10-15 digits) or email address.' });
    }

    // Location: 5 to 100 characters, alphanumeric, spaces, and basic punctuation
    const locationRegex = /^[a-zA-Z0-9\s.,'()\-]{5,100}$/;
    if (!locationRegex.test(location)) {
      return res.status(400).json({ message: 'Location must be between 5 to 100 characters and contain only letters, numbers, spaces, or basic symbols.' });
    }

    // Details/Description: at least 5 characters
    if (details.trim().length < 5) {
      return res.status(400).json({ message: 'Campaign description must be at least 5 characters long.' });
    }

    // Date range validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end date.' });
    }
    if (end < start) {
      return res.status(400).json({ message: 'End date must be greater than or equal to start date.' });
    }

    const newCampaign = new Campaign({ 
      organizerName, 
      location, 
      startDate, 
      endDate, 
      date: startDate, // Set date to startDate for backward compatibility
      contact, 
      details 
    });
    await newCampaign.save();

    res.status(201).json({ message: 'Campaign created successfully!' });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Fetch All Campaigns
const getCampaigns = async (req, res) => {
  try {
    const all = await Campaign.find({}).sort({ startDate: -1 });
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching campaigns' });
  }
};

module.exports = {
  createCampaign,
  getCampaigns
};
