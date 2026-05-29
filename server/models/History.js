const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  hospitalName: String,
  bankId: String,
  bloodGroup: String,
  units: Number,
  patientName: String,
  amount: Number,
  documentPath: String,
  date: { type: Date, default: Date.now },
  status: String,
  isDirect: { type: Boolean, default: false }
});

const History = mongoose.model('history', historySchema);

module.exports = History;
