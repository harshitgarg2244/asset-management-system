const { body } = require('express-validator');

const createRoleRequestValidator = [
  body('requestedRole').isIn(['IT_MANAGER', 'AUDITOR', 'SUPER_ADMIN']).withMessage('Invalid requested role'),
  body('reason').trim().isLength({ min: 10 }).withMessage('Please provide a reason of at least 10 characters'),
];

module.exports = { createRoleRequestValidator };
