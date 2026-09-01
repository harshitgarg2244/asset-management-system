// Runs before Jest even loads the test framework (via "setupFiles" in
// package.json). Setting these here, before anything requires app.js,
// means dotenv.config() inside server.js's imports won't override them -
// dotenv never overwrites a variable that's already set.
process.env.JWT_SECRET = 'test_secret_key_for_jest_only';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/asset-management-test';
