const AuditLog = require('../models/AuditLog');

const writeAuditLog = async ({ actor, action, targetEntity, entityId, from, to }) => {
  await AuditLog.create({ actor, action, targetEntity, entityId, changes: { from, to } });
};

module.exports = writeAuditLog;
