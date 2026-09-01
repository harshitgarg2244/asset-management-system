const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swaggerSpec');
const { generalLimiter } = require('./middleware/rateLimiters');

// -----------------------------------------------------------------------
// WHY THIS FILE IS SEPARATE FROM server.js:
// This file builds and exports the Express app itself - routes, middleware,
// everything - but does NOT connect to a database or start listening on a
// port. server.js does those two things.
//
// The reason for the split is testability. Our Jest tests (see tests/)
// need to send fake HTTP requests INTO the app (via supertest) without
// actually opening a network port or depending on server.js's specific
// database connection. By keeping app.js "pure" - just the app definition -
// tests can `require('./app')` and test it directly, while connecting to
// their own separate test database. This is the standard pattern for
// making an Express app testable.
// -----------------------------------------------------------------------
const app = express();

app.use(helmet());
// In development, FRONTEND_URL is unset, so cors() allows any origin -
// simplest thing while everything runs on localhost. In production, set
// FRONTEND_URL to your deployed frontend's exact URL so only YOUR site can
// call this API from a browser (a security-conscious deployment shouldn't
// leave this wide open to any website on the internet).
app.use(cors(process.env.FRONTEND_URL ? { origin: process.env.FRONTEND_URL } : {}));
app.use(express.json());
app.use(generalLimiter); // applies to every request below this line

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- API documentation ---------------------------------------------
// Visit /api-docs in a browser for an interactive Swagger UI. The raw
// OpenAPI JSON (useful for importing into Postman/Insomnia) is at
// /api-docs.json.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ---- Routes -----------------------------------------------------------
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/assets', require('./routes/assetRoutes'));
app.use('/api/v1/audit-logs', require('./routes/auditRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/role-requests', require('./routes/roleRequestRoutes'));
app.use('/api/v1/licenses', require('./routes/licenseRoutes'));
app.use('/api/v1/search', require('./routes/searchRoutes'));

// Health check - also what Render/Railway ping to confirm the service is alive.
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Asset Management API is running' });
});

// ---- Catch-all error handler ---------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

module.exports = app;
