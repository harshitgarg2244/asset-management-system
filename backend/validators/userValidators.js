const { body } = require('express-validator');

const ROLES = ['SUPER_ADMIN', 'IT_MANAGER', 'AUDITOR', 'EMPLOYEE'];

const createUserByAdminValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('role').isIn(ROLES).withMessage('Invalid role'),
];

const updateUserRoleValidator = [
  body('role').isIn(ROLES).withMessage('Invalid role'),
];

module.exports = { createUserByAdminValidator, updateUserRoleValidator };
