const mongoose = require('mongoose');
const fs = require('fs');
const Asset = require('../models/Asset');
const User = require('../models/User');
const writeAuditLog = require('../utils/auditLogger');
const { arrayToCsv, parseCsv } = require('../utils/csv');
const { WARRANTY_WINDOW_DAYS } = require('../utils/warrantyScheduler');

const buildAssetQuery = ({ search, status, category }) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { assetTag: { $regex: search, $options: 'i' } },
      { serialNumber: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.status = status;
  if (category) query.category = category;
  return query;
};

// @route  GET /api/v1/assets
const getAssets = async (req, res) => {
  try {
    const { search, status, category } = req.query;
    const query = buildAssetQuery({ search, status, category });

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      Asset.find(query).populate('assignedTo', 'name email department').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Asset.countDocuments(query),
    ]);

    res.json({ assets, total, page, totalPages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/assets/stats
const getAssetStats = async (req, res) => {
  try {
    const assets = await Asset.find({}).populate('assignedTo', 'department');
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, a) => sum + a.cost, 0);
    const statusCounts = { AVAILABLE: 0, ASSIGNED: 0, MAINTENANCE: 0, RETIRED: 0 };
    const spendByDeptMap = {};

    assets.forEach((asset) => {
      statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1;
      if (asset.assignedTo?.department) {
        const dept = asset.assignedTo.department;
        spendByDeptMap[dept] = (spendByDeptMap[dept] || 0) + asset.cost;
      }
    });

    const spendByDepartment = Object.entries(spendByDeptMap).map(([department, total]) => ({ department, total }));
    res.json({ totalAssets, totalValue, statusCounts, spendByDepartment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/assets/export
const exportAssets = async (req, res) => {
  try {
    const { search, status, category } = req.query;
    const query = buildAssetQuery({ search, status, category });
    const assets = await Asset.find(query).populate('assignedTo', 'name department').sort({ createdAt: -1 });

    const csv = arrayToCsv(
      [
        { label: 'Asset Tag', value: (a) => a.assetTag },
        { label: 'Name', value: (a) => a.name },
        { label: 'Category', value: (a) => a.category },
        { label: 'Serial Number', value: (a) => a.serialNumber || '' },
        { label: 'Assigned To', value: (a) => a.assignedTo?.name || '' },
        { label: 'Department', value: (a) => a.assignedTo?.department || '' },
        { label: 'Status', value: (a) => a.status },
        { label: 'Cost', value: (a) => a.cost },
        { label: 'Warranty Expiry', value: (a) => (a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString() : '') },
      ],
      assets
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="assets.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/assets/expiring-warranties
const getExpiringWarranties = async (req, res) => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + WARRANTY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const assets = await Asset.find({
      warrantyExpiry: { $gte: now, $lte: windowEnd },
      status: { $ne: 'RETIRED' },
    }).populate('assignedTo', 'name').sort({ warrantyExpiry: 1 });

    res.json({ windowDays: WARRANTY_WINDOW_DAYS, assets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/v1/assets/import
const importAssets = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }
  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const rows = parseCsv(fileContent);
    fs.unlink(req.file.path, () => {});

    if (rows.length === 0) {
      return res.status(400).json({ message: 'The uploaded file has no data rows' });
    }

    const existingTags = new Set((await Asset.find({}).select('assetTag')).map((a) => a.assetTag));
    const created = [];
    const errors = [];
    let skippedDuplicates = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = rows[i];

      const assetTag = row['Asset Tag'] || row['assetTag'];
      const name = row['Name'] || row['name'];
      const category = (row['Category'] || row['category'] || '').toUpperCase();
      const serialNumber = row['Serial Number'] || row['serialNumber'] || '';
      const costRaw = row['Cost'] || row['cost'];
      const warrantyRaw = row['Warranty Expiry'] || row['warrantyExpiry'] || '';

      if (!assetTag || !name) {
        errors.push({ row: rowNumber, reason: 'Missing Asset Tag or Name' });
        continue;
      }
      if (!['HARDWARE', 'SOFTWARE'].includes(category)) {
        errors.push({ row: rowNumber, reason: `Category must be HARDWARE or SOFTWARE, got "${category}"` });
        continue;
      }
      const cost = Number(costRaw);
      if (costRaw === undefined || costRaw === '' || Number.isNaN(cost)) {
        errors.push({ row: rowNumber, reason: `Cost must be a number, got "${costRaw}"` });
        continue;
      }
      if (existingTags.has(assetTag)) {
        skippedDuplicates++;
        continue;
      }

      const warrantyExpiry = warrantyRaw ? new Date(warrantyRaw) : undefined;
      if (warrantyRaw && Number.isNaN(warrantyExpiry?.getTime())) {
        errors.push({ row: rowNumber, reason: `Could not understand warranty date "${warrantyRaw}"` });
        continue;
      }

      created.push({ assetTag, name, category, serialNumber, cost, warrantyExpiry });
      existingTags.add(assetTag);
    }

    let insertedAssets = [];
    if (created.length > 0) {
      insertedAssets = await Asset.insertMany(created);
    }

    await writeAuditLog({
      actor: req.user._id,
      action: 'ASSET_BULK_IMPORTED',
      targetEntity: 'Asset',
      entityId: req.user._id,
      from: null,
      to: { created: insertedAssets.length, skippedDuplicates, errorCount: errors.length },
    });

    res.json({ created: insertedAssets.length, skippedDuplicates, errors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/v1/assets/my-assets
const getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/v1/assets
const createAsset = async (req, res) => {
  try {
    const { assetTag, name, category, serialNumber, cost, warrantyExpiry } = req.body;

    const duplicateTag = await Asset.findOne({ assetTag });
    if (duplicateTag) {
      return res.status(400).json({ message: `An asset with tag "${assetTag}" already exists` });
    }

    const asset = await Asset.create({
      assetTag,
      name,
      category,
      serialNumber,
      cost,
      warrantyExpiry,
      documents: req.file ? [{ title: req.file.originalname, url: `/uploads/${req.file.filename}` }] : [],
    });

    await writeAuditLog({ actor: req.user._id, action: 'ASSET_CREATED', targetEntity: 'Asset', entityId: asset._id, from: null, to: asset });
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/v1/assets/:id/assign
const assignAsset = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ message: 'That is not a valid employee ID' });
      }
      const employeeExists = await User.exists({ _id: employeeId, status: 'ACTIVE' });
      if (!employeeExists) {
        return res.status(400).json({ message: 'No active employee found with that ID' });
      }
    }

    const previousState = { assignedTo: asset.assignedTo, status: asset.status };
    asset.assignedTo = employeeId || null;
    asset.status = employeeId ? 'ASSIGNED' : 'AVAILABLE';
    await asset.save();

    await writeAuditLog({
      actor: req.user._id,
      action: employeeId ? 'ASSET_ASSIGNED' : 'ASSET_UNASSIGNED',
      targetEntity: 'Asset',
      entityId: asset._id,
      from: previousState,
      to: { assignedTo: asset.assignedTo, status: asset.status },
    });

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/v1/assets/:id/retire
const retireAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const previousStatus = asset.status;
    asset.status = 'RETIRED';
    asset.assignedTo = null;
    await asset.save();

    await writeAuditLog({ actor: req.user._id, action: 'ASSET_RETIRED', targetEntity: 'Asset', entityId: asset._id, from: { status: previousStatus }, to: { status: 'RETIRED' } });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAssets,
  getAssetStats,
  exportAssets,
  importAssets,
  getExpiringWarranties,
  getMyAssets,
  createAsset,
  assignAsset,
  retireAsset,
};
