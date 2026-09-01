const { validationResult } = require('express-validator');

// -----------------------------------------------------------------------
// Runs AFTER a route's list of express-validator rules (e.g. body('email')
// .isEmail()). Those rules just COLLECT problems; this middleware is what
// actually checks whether any were found and stops the request here with
// a clean 400 error instead of letting bad data reach the controller or
// crash against a Mongoose schema validator with a confusing message.
// -----------------------------------------------------------------------
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg, // the first error, for a simple one-line message
      errors: errors.array(), // the full list, in case the frontend wants to highlight every field
    });
  }
  next();
};

module.exports = validate;
