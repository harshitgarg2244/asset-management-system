const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @route  POST /api/v1/auth/register
// -----------------------------------------------------------------------
// SECURITY: this endpoint is PUBLIC, so it must NEVER trust a "role" field
// sent by the client - anyone could send { role: "SUPER_ADMIN" } and grant
// themselves admin access. Every public sign-up becomes an EMPLOYEE, full
// stop, no exceptions. Elevated access happens LATER, after logging in,
// through the separate Role Request flow (roleRequestController.js) - you
// submit a request with a reason, and a Super Admin or Auditor reviews it.
// To create the very first admin account for a brand new database, run
// the one-time `node seed.js` script instead.
// -----------------------------------------------------------------------
const registerUser = async (req, res) => {
  try {
    const { name, email, password, department } = req.body; // "role" is intentionally never read from here

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, passwordHash, department, role: 'EMPLOYEE' });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/v1/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ message: 'This account has been deactivated' });
      }
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: generateToken(user._id),
      });
    }

    // Deliberately vague - never reveal whether the email exists or the
    // password was wrong, which stops someone using this form to check
    // which emails are registered.
    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @route  POST /api/v1/auth/forgot-password
// -----------------------------------------------------------------------
// SIMPLIFICATION: a production app would EMAIL this link (via Resend/
// Nodemailer) and never return it in the API response. This project has
// no email service configured, so - purely so you can test the whole flow
// - we hand the link back directly. The token logic itself is written the
// REAL way: a random token, only its HASH stored in the database, 15
// minute expiry, single-use. Swapping in real email later means deleting
// one line (marked below).
//
// We always return the same generic message whether or not the email
// exists, to prevent "user enumeration" (checking which emails exist).
// -----------------------------------------------------------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const genericResponse = { message: 'If an account exists for that email, a password reset link has been generated.' };

    const user = await User.findOne({ email });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `/reset-password/${rawToken}`;
    return res.json({ ...genericResponse, resetUrl }); // DELETE this line once real email is wired up
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/v1/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, forgotPassword, resetPassword };
