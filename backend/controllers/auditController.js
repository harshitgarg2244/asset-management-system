const AuditLog = require('../models/AuditLog');
const { arrayToCsv } = require('../utils/csv');

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({}).populate('actor', 'name email role').sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({}).populate('actor', 'name email role').sort({ createdAt: -1 }).limit(200);
    const csv = arrayToCsv(
      [
        { label: 'Timestamp', value: (l) => new Date(l.createdAt).toLocaleString() },
        { label: 'Actor', value: (l) => (l.actor ? l.actor.name : 'Unknown') },
        { label: 'Actor Email', value: (l) => (l.actor ? l.actor.email : '') },
        { label: 'Action', value: (l) => l.action },
        { label: 'Entity Type', value: (l) => l.targetEntity },
        { label: 'Entity ID', value: (l) => l.entityId?.toString() || '' },
      ],
      logs
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs, exportAuditLogs };
