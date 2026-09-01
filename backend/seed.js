// -----------------------------------------------------------------------
// ONE-TIME SETUP SCRIPT
// Run this ONCE, manually, to create your very first Super Admin account.
//
// USAGE (run from inside the backend folder):
//   node seed.js "Your Name" you@company.com yourPassword123 Engineering
//
// After this account exists, log in with it and use "User Management" in
// the app to create/promote any further Admin, IT Manager, or Auditor
// accounts - you should never need to run this script again.
// -----------------------------------------------------------------------
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
  const [, , name, email, password, department] = process.argv;

  if (!name || !email || !password || !department) {
    console.log('\nUsage: node seed.js "Your Name" you@company.com yourPassword123 Engineering\n');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with the email "${email}" already exists. Nothing was created.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, passwordHash, department, role: 'SUPER_ADMIN' });

  console.log(`\nSuper Admin account created successfully:`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role:  ${user.role}\n`);
  console.log('You can now log in with this account at /login.\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed script failed:', err.message);
  process.exit(1);
});
