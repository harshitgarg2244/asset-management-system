const express = require('express');
const router = express.Router();
const { getLicenses, getMyLicenses, getLicenseStats, createLicense, assignSeat, revokeSeat } = require('../controllers/licenseController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { createLicenseValidator, seatActionValidator } = require('../validators/licenseValidators');

// -----------------------------------------------------------------------
// PRIVACY RULE (same as assets): only SUPER_ADMIN and IT_MANAGER can see
// the full License directory showing WHO holds every seat. Everyone else
// only sees their own seats via /my-licenses.
// -----------------------------------------------------------------------
router.get('/my-licenses', protect, getMyLicenses);
router.get('/stats', protect, getLicenseStats); // aggregate spend numbers only, no individual identity
router.get('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), getLicenses);

router.post('/', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), createLicenseValidator, validate, createLicense);
router.put('/:id/assign-seat', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), seatActionValidator, validate, assignSeat);
router.put('/:id/revoke-seat', protect, allowRoles('SUPER_ADMIN', 'IT_MANAGER'), seatActionValidator, validate, revokeSeat);

module.exports = router;
