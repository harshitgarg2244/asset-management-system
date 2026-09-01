const { body } = require('express-validator');

const createAssetValidator = [
  body('assetTag').trim().notEmpty().withMessage('Asset Tag is required'),
  body('name').trim().notEmpty().withMessage('Asset name is required'),
  body('category').isIn(['HARDWARE', 'SOFTWARE']).withMessage('Category must be HARDWARE or SOFTWARE'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('serialNumber').optional({ checkFalsy: true }).trim(),
  body('warrantyExpiry').optional({ checkFalsy: true }).isISO8601().withMessage('Warranty expiry must be a valid date'),
];

const assignAssetValidator = [
  body('employeeId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('That is not a valid employee ID'),
];

module.exports = { createAssetValidator, assignAssetValidator };
