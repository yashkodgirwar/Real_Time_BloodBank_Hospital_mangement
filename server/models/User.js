const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  type: String,
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  address: String,
  licenseNumber: { type: String, required: true, unique: true },
  bankAccountNumber: String,
  bankIFSCCode: String,
  status: { type: String, default: 'under review' },
  licenses: [String],
  profileImage: String,
  deleteRequested: Boolean,
  deleteDate: Date,
  inventory: {
    type: Map,
    of: Number,
    default: {
      "A+": 0, "A-": 0, "B+": 0, "B-": 0,
      "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
    }
  },
  resetToken: String,
  resetTokenExpiry: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;
