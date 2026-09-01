const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    vendor: { type: String },
    totalSeats: { type: Number, required: true },
    costPerSeat: { type: Number, required: true },
    renewalDate: { type: Date },
    seats: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('License', licenseSchema);
