const express = require('express');
const router = express.Router();
const { getAuditLogs, exportAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.get('/export', protect, allowRoles('SUPER_ADMIN', 'AUDITOR'), exportAuditLogs);
router.get('/', protect, allowRoles('SUPER_ADMIN', 'AUDITOR'), getAuditLogs);

module.exports = router;
