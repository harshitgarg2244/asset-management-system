const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetTag: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['HARDWARE', 'SOFTWARE'], required: true },
    serialNumber: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cost: { type: Number, required: true },
    warrantyExpiry: { type: Date },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'],
      default: 'AVAILABLE',
    },
    documents: [{ title: String, url: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Asset', assetSchema);
