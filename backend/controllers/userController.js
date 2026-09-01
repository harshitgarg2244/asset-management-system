const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Asset = require('../models/Asset');
const writeAuditLog = require('../utils/auditLogger');

const ROLES = ['SUPER_ADMIN', 'IT_MANAGER', 'AUDITOR', 'EMPLOYEE'];

const getUsers = async (req, res) => {
  try {
    const filter = req.query.includeOffboarded === 'true' ? {} : { status: 'ACTIVE' };
    const users = await User.find(filter).select('-passwordHash').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SAFETY RULE shared below: Super Admin AND Auditor can both manage roles,
// but ONLY a Super Admin can grant SUPER_ADMIN or change an existing Super
// Admin's role - otherwise an Auditor could promote itself all the way up.
const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, department, role } = req.body;

    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Only a Super Admin can create another Super Admin account' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'A user with this email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await User.create({ name, email, passwordHash, department, role });

    await writeAuditLog({
      actor: req.user._id,
      action: 'USER_CREATED_BY_ADMIN',
      targetEntity: 'User',
      entityId: newUser._id,
      from: null,
      to: { name: newUser.name, email: newUser.email, role: newUser.role },
    });

    res.status(201).json({ _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, department: newUser.department });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You can't change your own role" });
    }

    const isSuperAdminInvolved = role === 'SUPER_ADMIN' || targetUser.role === 'SUPER_ADMIN';
    if (isSuperAdminInvolved && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Only a Super Admin can grant or change Super Admin access' });
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await writeAuditLog({ actor: req.user._id, action: 'USER_ROLE_CHANGED', targetEntity: 'User', entityId: targetUser._id, from: { role: previousRole }, to: { role: targetUser.role } });
    res.json({ _id: targetUser._id, name: targetUser.name, role: targetUser.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SUPER_ADMIN ONLY - the most consequential action in the app. Soft-
// deletes (flips status to OFFBOARDED) rather than removing the document,
// because AuditLog/Asset history still reference this person by ID.
// Automatically returns any assets they're holding.
const terminateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser._id.equals(req.user._id)) return res.status(400).json({ message: "You can't terminate your own account" });
    if (targetUser.status === 'OFFBOARDED') return res.status(400).json({ message: 'This user is already offboarded' });

    if (targetUser.role === 'SUPER_ADMIN') {
      const activeSuperAdminCount = await User.countDocuments({ role: 'SUPER_ADMIN', status: 'ACTIVE' });
      if (activeSuperAdminCount <= 1) {
        return res.status(400).json({ message: 'You cannot terminate the last remaining Super Admin' });
      }
    }

    targetUser.status = 'OFFBOARDED';
    await targetUser.save();

    const heldAssets = await Asset.find({ assignedTo: targetUser._id });
    for (const asset of heldAssets) {
      asset.assignedTo = null;
      asset.status = 'AVAILABLE';
      await asset.save();
      await writeAuditLog({
        actor: req.user._id,
        action: 'ASSET_AUTO_UNASSIGNED_ON_TERMINATION',
        targetEntity: 'Asset',
        entityId: asset._id,
        from: { assignedTo: targetUser._id },
        to: { assignedTo: null, status: 'AVAILABLE' },
      });
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'USER_TERMINATED',
      targetEntity: 'User',
      entityId: targetUser._id,
      from: { status: 'ACTIVE' },
      to: { status: 'OFFBOARDED', assetsReturned: heldAssets.length },
    });

    res.json({ _id: targetUser._id, name: targetUser.name, status: targetUser.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reactivateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.status === 'ACTIVE') return res.status(400).json({ message: 'This user is already active' });

    targetUser.status = 'ACTIVE';
    await targetUser.save();
    await writeAuditLog({ actor: req.user._id, action: 'USER_REACTIVATED', targetEntity: 'User', entityId: targetUser._id, from: { status: 'OFFBOARDED' }, to: { status: 'ACTIVE' } });
    res.json({ _id: targetUser._id, name: targetUser.name, status: targetUser.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUserByAdmin, updateUserRole, terminateUser, reactivateUser };
