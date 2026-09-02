const License = require('../models/License');
const User = require('../models/User');
const writeAuditLog = require('../utils/auditLogger');

const getLicenses = async (req, res) => {
  try {
    const licenses = await License.find({}).populate('seats.user', 'name email department').sort({ name: 1 });
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/licenses/my-licenses
// -----------------------------------------------------------------------
// The employee-facing equivalent of getMyAssets: shows ONLY the licenses
// the current user personally holds a seat on, and never mentions who
// else has a seat on the same license. This is what regular Employees
// (and Auditors, under the new privacy rule) see instead of the full
// getLicenses directory above.
// -----------------------------------------------------------------------
const getMyLicenses = async (req, res) => {
  try {
    const licenses = await License.find({ 'seats.user': req.user._id }).select('name vendor renewalDate');
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLicenseStats = async (req, res) => {
  try {
    const licenses = await License.find({});
    let monthlySpend = 0, idleSeats = 0, idleCost = 0;
    licenses.forEach((lic) => {
      const used = lic.seats.length;
      const unused = Math.max(lic.totalSeats - used, 0);
      monthlySpend += used * lic.costPerSeat;
      idleSeats += unused;
      idleCost += unused * lic.costPerSeat;
    });
    res.json({ totalLicenses: licenses.length, monthlySpend, idleSeats, idleCost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLicense = async (req, res) => {
  try {
    const { name, vendor, totalSeats, costPerSeat, renewalDate } = req.body;
    const license = await License.create({ name, vendor, totalSeats, costPerSeat, renewalDate });
    await writeAuditLog({ actor: req.user._id, action: 'LICENSE_CREATED', targetEntity: 'License', entityId: license._id, from: null, to: license });
    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignSeat = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const license = await License.findById(req.params.id);
    if (!license) return res.status(404).json({ message: 'License not found' });

    const employee = await User.findOne({ _id: employeeId, status: 'ACTIVE' });
    if (!employee) return res.status(400).json({ message: 'No active employee found with that ID' });

    if (license.seats.some((s) => s.user.equals(employeeId))) {
      return res.status(400).json({ message: `${employee.name} already has a seat on this license` });
    }
    if (license.seats.length >= license.totalSeats) {
      return res.status(400).json({ message: 'No seats available - every seat on this license is already in use' });
    }

    license.seats.push({ user: employeeId });
    await license.save();

    await writeAuditLog({ actor: req.user._id, action: 'LICENSE_SEAT_ASSIGNED', targetEntity: 'License', entityId: license._id, from: null, to: { licenseName: license.name, assignedTo: employee.name } });

    const populated = await license.populate('seats.user', 'name email department');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const revokeSeat = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const license = await License.findById(req.params.id);
    if (!license) return res.status(404).json({ message: 'License not found' });

    const seatIndex = license.seats.findIndex((s) => s.user.equals(employeeId));
    if (seatIndex === -1) return res.status(400).json({ message: 'That person does not hold a seat on this license' });

    license.seats.splice(seatIndex, 1);
    await license.save();

    await writeAuditLog({ actor: req.user._id, action: 'LICENSE_SEAT_REVOKED', targetEntity: 'License', entityId: license._id, from: { revokedFrom: employeeId }, to: null });

    const populated = await license.populate('seats.user', 'name email department');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLicenses, getMyLicenses, getLicenseStats, createLicense, assignSeat, revokeSeat };
