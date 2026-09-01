const { body } = require('express-validator');

const createLicenseValidator = [
  body('name').trim().notEmpty().withMessage('License name is required'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be a whole number of at least 1'),
  body('costPerSeat').isFloat({ min: 0 }).withMessage('Cost per seat must be a positive number'),
  body('renewalDate').optional({ checkFalsy: true }).isISO8601().withMessage('Renewal date must be a valid date'),
];

const seatActionValidator = [
  body('employeeId').isMongoId().withMessage('A valid employee ID is required'),
];

module.exports = { createLicenseValidator, seatActionValidator };
