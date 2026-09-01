const Asset = require('../models/Asset');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Powers the sidebar's "Search everything" box. Audit log results are only
// included for SUPER_ADMIN / AUDITOR, matching who can view the Audit
// Trail page at all.
const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ assets: [], users: [], auditLogs: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [assets, users] = await Promise.all([
      Asset.find({ $or: [{ name: regex }, { assetTag: regex }, { serialNumber: regex }] }).select('assetTag name category status').limit(5),
      User.find({ $or: [{ name: regex }, { email: regex }], status: 'ACTIVE' }).select('name email department role').limit(5),
    ]);

    let auditLogs = [];
    if (['SUPER_ADMIN', 'AUDITOR'].includes(req.user.role)) {
      auditLogs = await AuditLog.find({ action: regex }).populate('actor', 'name').sort({ createdAt: -1 }).limit(5);
    }

    res.json({ assets, users, auditLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { globalSearch };
