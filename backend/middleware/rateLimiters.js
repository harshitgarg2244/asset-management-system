const rateLimit = require('express-rate-limit');

// -----------------------------------------------------------------------
// TWO limiters, not one, because "how much traffic is normal" is different
// for different endpoints:
//
// generalLimiter: applied to the whole API. Generous, because a logged-in
// user's dashboard legitimately fires off several requests per page load
// (stats + assets + licenses, etc). This mostly exists to blunt a runaway
// script or basic scraping, not to bother real users.
//
// authLimiter: applied ONLY to login/register/forgot-password. Much
// stricter, because these are exactly the endpoints someone would hammer
// to brute-force a password or spam account creation. A real user only
// hits these a handful of times; a script trying every password in a list
// would hit them hundreds of times per minute.
// -----------------------------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again shortly.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
});

module.exports = { generalLimiter, authLimiter };
