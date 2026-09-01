const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const writeAuditLog = require('../utils/auditLogger');

// @route  POST /api/v1/role-requests
// Any logged-in user can request elevated access for themselves - this is
// how someone actually GETS a Role Request into the review queue.
const createRequest = async (req, res) => {
  try {
    const { requestedRole, reason } = req.body;

    if (requestedRole === req.user.role) {
      return res.status(400).json({ message: `You already have ${requestedRole.replace('_', ' ')} access` });
    }

    const existingPending = await RoleRequest.findOne({ user: req.user._id, status: 'PENDING' });
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending request. Please wait for it to be reviewed.' });
    }

    const request = await RoleRequest.create({ user: req.user._id, requestedRole, reason });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/role-requests/mine
const getMyRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/role-requests
// SUPER_ADMIN / AUDITOR only - returns everything (pending + resolved);
// the frontend filters down to PENDING for the review queue and can show
// history separately if needed.
const getAllRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({})
      .populate('user', 'name email department')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Shared guard: only a Super Admin can approve/reject a request FOR Super
// Admin access - same principle as everywhere else an Auditor is allowed
// to manage roles except granting the top one.
const canReviewRequest = (reviewer, requestedRole) => {
  if (requestedRole === 'SUPER_ADMIN' && reviewer.role !== 'SUPER_ADMIN') return false;
  return true;
};

// @route  PUT /api/v1/role-requests/:id/approve
const approveRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'This request has already been reviewed' });
    if (!canReviewRequest(req.user, request.requestedRole)) {
      return res.status(403).json({ message: 'Only a Super Admin can approve a Super Admin request' });
    }

    const targetUser = await User.findById(request.user);
    if (!targetUser) return res.status(404).json({ message: 'The requesting user no longer exists' });

    const previousRole = targetUser.role;
    targetUser.role = request.requestedRole;
    await targetUser.save();

    request.status = 'APPROVED';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await writeAuditLog({
      actor: req.user._id,
      action: 'ACCESS_REQUEST_APPROVED',
      targetEntity: 'User',
      entityId: targetUser._id,
      from: { role: previousRole },
      to: { role: targetUser.role },
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/v1/role-requests/:id/reject
const rejectRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'This request has already been reviewed' });
    if (!canReviewRequest(req.user, request.requestedRole)) {
      return res.status(403).json({ message: 'Only a Super Admin can reject a Super Admin request' });
    }

    request.status = 'REJECTED';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await writeAuditLog({
      actor: req.user._id,
      action: 'ACCESS_REQUEST_REJECTED',
      targetEntity: 'User',
      entityId: request.user,
      from: { requestedRole: request.requestedRole },
      to: null,
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest };
