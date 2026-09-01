const Asset = require('../models/Asset');

// -----------------------------------------------------------------------
// SIMPLIFICATION FROM THE BLUEPRINT: the original design used a BullMQ job
// on Upstash Redis, then emailed IT via Resend when something was expiring.
// That's the right shape for a multi-server production system - but it
// needs a queue service AND an email service configured before you'd ever
// see it do anything.
//
// This version keeps the same IDEA (check once a day, flag anything
// expiring soon) using nothing but a plain setInterval inside this same
// Node process - no extra services, no extra dependencies. The trade-off:
// on multiple servers, EACH one would run this (a queue exists partly to
// prevent that) - a non-issue for a single-server app like this one.
//
// The results are ALSO exposed as a real API endpoint
// (GET /api/v1/assets/expiring-warranties) that the Dashboard reads
// directly, so the on-screen alert is always fresh, independent of when
// this background check last ran.
// -----------------------------------------------------------------------
const WARRANTY_WINDOW_DAYS = 30;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

const checkExpiringWarranties = async () => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + WARRANTY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const expiringAssets = await Asset.find({
      warrantyExpiry: { $gte: now, $lte: windowEnd },
      status: { $ne: 'RETIRED' },
    }).select('assetTag name warrantyExpiry');

    if (expiringAssets.length > 0) {
      console.log(`[Warranty Check] ${expiringAssets.length} asset(s) have a warranty expiring within ${WARRANTY_WINDOW_DAYS} days:`);
      expiringAssets.forEach((a) => {
        console.log(`  - ${a.assetTag} (${a.name}) expires ${a.warrantyExpiry.toLocaleDateString()}`);
      });
    } else {
      console.log('[Warranty Check] No assets expiring soon.');
    }
  } catch (error) {
    console.error('[Warranty Check] Failed to run:', error.message);
  }
};

const startWarrantyScheduler = () => {
  setTimeout(checkExpiringWarranties, 5000);
  setInterval(checkExpiringWarranties, CHECK_INTERVAL_MS);
};

module.exports = { startWarrantyScheduler, checkExpiringWarranties, WARRANTY_WINDOW_DAYS };
