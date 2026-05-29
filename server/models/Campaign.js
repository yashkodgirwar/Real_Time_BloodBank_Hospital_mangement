const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  organizerName: String,
  location: String,
  startDate: Date,
  endDate: Date,
  date: Date,
  contact: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});

const Campaign = mongoose.model('campaigns', campaignSchema);

module.exports = Campaign;
