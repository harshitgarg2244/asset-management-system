const express = require('express');
const router = express.Router();
const {
  getAssets,
  getAssetStats,
  exportAssets,
  importAssets,
  getExpiringWarranties,
  getMyAssets,
  createAsset,
  assignAsset,
  retireAsset,
} = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');
const { createAssetValidator, assignAssetValidator } = require('../validators/assetValidators');

// -----------------------------------------------------------------------
// PRIVACY RULE: the full Asset Directory (who has WHAT) is visible to
// SUPER_ADMIN, IT_MANAGER, and AUDITOR (read-only, for compliance review -
// this matches the original blueprint's "View Only + Audit Flagging"
// permission for that role). Regular Employees still only ever see their
// OWN assets via /my-assets below - never the full company-wide list.
//
// Creating, assigning, and retiring assets stays SUPER_ADMIN / IT_MANAGER
// ONLY - an Auditor can look, but never touch.
// -----------------------------------------------------------------------
router.get('/my-assets', protect, getMyAssets);
router.get('/stats', protect, getAssetStats); // aggregate numbers only, no individual assignee identity
router.get('/export', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER', 'AUDITOR'), exportAssets);
router.get('/expiring-warranties', protect, getExpiringWarranties); // no assignee identity in the response - see controller
router.get('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER', 'AUDITOR'), getAssets);

router.post('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), upload.single('invoice'), createAssetValidator, validate, createAsset);
router.post('/import', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), upload.single('file'), importAssets);
router.put('/:id/assign', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), assignAssetValidator, validate, assignAsset);
router.put('/:id/retire', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), retireAsset);

module.exports = router;
