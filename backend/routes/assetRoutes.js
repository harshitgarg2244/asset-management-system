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
// PRIVACY RULE: only SUPER_ADMIN and IT_MANAGER can see the full Asset
// Directory (which shows WHO has WHAT). Everyone else - including
// Auditors and regular Employees - can only see their OWN assets via
// /my-assets below. Export carries the same "who has what" information as
// the directory table, so it gets the same restriction.
// -----------------------------------------------------------------------
router.get('/my-assets', protect, getMyAssets);
router.get('/stats', protect, getAssetStats); // aggregate numbers only, no individual assignee identity
router.get('/export', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), exportAssets);
router.get('/expiring-warranties', protect, getExpiringWarranties); // no assignee identity in the response - see controller
router.get('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), getAssets);

router.post('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), upload.single('invoice'), createAssetValidator, validate, createAsset);
router.post('/import', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), upload.single('file'), importAssets);
router.put('/:id/assign', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), assignAssetValidator, validate, assignAsset);
router.put('/:id/retire', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), retireAsset);

module.exports = router;
