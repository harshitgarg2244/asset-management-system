const mongoose = require('mongoose');

// -----------------------------------------------------------------------
// A tiny helper shared by every test file, so connecting/cleaning up the
// test database is always done the same way. We deliberately use a REAL
// local MongoDB with its own SEPARATE database name
// ("asset-management-test") rather than your real "asset-management" dev
// database - tests create and delete data constantly, and running them
// against your real data would be destructive. This does mean the tests
// need MongoDB running locally (the same one Compass connects to) - if
// you followed this project's setup, you already have that.
// -----------------------------------------------------------------------
const connect = async () => {
  // A short timeout here is deliberate: if MongoDB isn't running locally,
  // we want the test suite to fail FAST with a clear "couldn't connect"
  // error, not hang for a long default timeout and look like it's frozen.
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
};

const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

module.exports = { connect, clearDatabase, closeDatabase };
