const mongoose = require('mongoose');

const ordersSchema = new mongoose.Schema({
  hospitalName: String,
  bankId: String,
  hospitalEmail: String,
  bloodGroup: String,
  units: Number,
  patientName: String,
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' },
  paymentStatus: { type: String, default: 'Unpaid' },
  documentPath: String,
  isDirect: { type: Boolean, default: false }
});

const orders = mongoose.model("orders", ordersSchema);

module.exports = orders;
