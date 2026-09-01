const { body, param } = require('express-validator');

// -----------------------------------------------------------------------
// WHY VALIDATE HERE, SEPARATELY FROM THE MONGOOSE SCHEMA: Mongoose's
// schema validation ("required: true", "enum: [...]") is the LAST line of
// defense right before saving to the database - it catches bad data no
// matter how it got there. express-validator runs FIRST, before the
// controller even starts, so obviously bad requests (a missing field, an
// email with no @, a password that's too short) get rejected immediately
// with a clear message, instead of failing deeper in the code with a
// vaguer Mongoose error.
// -----------------------------------------------------------------------
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  param('token').notEmpty().withMessage('Reset token is missing'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator };
