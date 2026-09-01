const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUserByAdmin,
  updateUserRole,
  terminateUser,
  reactivateUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');
const { createUserByAdminValidator, updateUserRoleValidator } = require('../validators/userValidators');

router.get('/', protect, getUsers);
router.post('/', protect, allowRoles('SUPER_ADMIN', 'AUDITOR'), createUserByAdminValidator, validate, createUserByAdmin);
router.put('/:id/role', protect, allowRoles('SUPER_ADMIN', 'AUDITOR'), updateUserRoleValidator, validate, updateUserRole);
router.put('/:id/terminate', protect, allowRoles('SUPER_ADMIN'), terminateUser);
router.put('/:id/reactivate', protect, allowRoles('SUPER_ADMIN'), reactivateUser);

module.exports = router;
