const mongoose = require('mongoose');

const billsSchema = new mongoose.Schema({
  hospitalName: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});

const bills = mongoose.model("bills", billsSchema);

module.exports = bills;
