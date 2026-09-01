const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetEntity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    changes: {
      from: { type: Object },
      to: { type: Object },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
