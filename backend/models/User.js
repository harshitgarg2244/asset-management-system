const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'IT_MANAGER', 'AUDITOR', 'EMPLOYEE'],
      default: 'EMPLOYEE',
    },
    department: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'OFFBOARDED'], default: 'ACTIVE' },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
