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

router.get('/my-assets', protect, getMyAssets);
router.get('/stats', protect, getAssetStats);
router.get('/export', protect, exportAssets);
router.get('/expiring-warranties', protect, getExpiringWarranties);
router.get('/', protect, getAssets);

router.post('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), upload.single('invoice'), createAssetValidator, validate, createAsset);
router.post('/import', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), upload.single('file'), importAssets);
router.put('/:id/assign', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), assignAssetValidator, validate, assignAsset);
router.put('/:id/retire', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), retireAsset);

module.exports = router;
