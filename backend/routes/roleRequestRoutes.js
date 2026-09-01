const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/roleRequestController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { createRoleRequestValidator } = require('../validators/roleRequestValidators');

router.post('/', protect, createRoleRequestValidator, validate, createRequest); // any logged-in user can request
router.get('/mine', protect, getMyRequests); // any logged-in user sees their own history

router.get('/', protect, allowRoles('SUPER_ADMIN', 'AUDITOR'), getAllRequests);
router.put('/:id/approve', protect, allowRoles('SUPER_ADMIN', 'AUDITOR'), approveRequest);
router.put('/:id/reject', protect, allowRoles('SUPER_ADMIN', 'AUDITOR'), rejectRequest);

module.exports = router;
