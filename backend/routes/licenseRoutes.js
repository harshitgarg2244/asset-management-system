const express = require('express');
const router = express.Router();
const { getLicenses, getLicenseStats, createLicense, assignSeat, revokeSeat } = require('../controllers/licenseController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { createLicenseValidator, seatActionValidator } = require('../validators/licenseValidators');

router.get('/', protect, getLicenses);
router.get('/stats', protect, getLicenseStats);
router.post('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), createLicenseValidator, validate, createLicense);
router.put('/:id/assign-seat', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), seatActionValidator, validate, assignSeat);
router.put('/:id/revoke-seat', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), seatActionValidator, validate, revokeSeat);

module.exports = router;
