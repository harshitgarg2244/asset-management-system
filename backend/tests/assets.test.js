const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');
const { connect, clearDatabase, closeDatabase } = require('./db');

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

// Registration always forces EMPLOYEE (by design - see auth.test.js), so
// to test admin-only behavior we create privileged users directly through
// the User model here, exactly the way seed.js does for the real app's
// very first Super Admin account.
const createUserDirectly = async ({ name, email, password, department, role }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name, email, passwordHash, department, role });
};

const loginAs = async (email, password) => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.token;
};

let adminToken;
let employeeToken;
let employeeId;

beforeEach(async () => {
  await createUserDirectly({ name: 'Admin', email: 'admin@test.com', password: 'password123', department: 'IT', role: 'SUPER_ADMIN' });
  const employee = await createUserDirectly({ name: 'Employee', email: 'employee@test.com', password: 'password123', department: 'Sales', role: 'EMPLOYEE' });
  employeeId = employee._id.toString();
  adminToken = await loginAs('admin@test.com', 'password123');
  employeeToken = await loginAs('employee@test.com', 'password123');
});

const validAsset = { assetTag: 'LAP-0001', name: 'Test Laptop', category: 'HARDWARE', cost: 50000 };

describe('POST /api/v1/assets - RBAC enforcement', () => {
  test('blocks an unauthenticated request', async () => {
    const res = await request(app).post('/api/v1/assets').send(validAsset);
    expect(res.statusCode).toBe(401);
  });

  test('blocks an Employee from creating an asset', async () => {
    const res = await request(app).post('/api/v1/assets').set('Authorization', `Bearer ${employeeToken}`).send(validAsset);
    expect(res.statusCode).toBe(403);
  });

  test('allows a Super Admin to create an asset', async () => {
    const res = await request(app).post('/api/v1/assets').set('Authorization', `Bearer ${adminToken}`).send(validAsset);
    expect(res.statusCode).toBe(201);
    expect(res.body.assetTag).toBe(validAsset.assetTag);
    expect(res.body.status).toBe('AVAILABLE');
  });

  test('rejects an asset with an invalid category', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validAsset, assetTag: 'LAP-0002', category: 'NOT_A_REAL_CATEGORY' });
    expect(res.statusCode).toBe(400);
  });

  test('rejects a negative cost', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validAsset, assetTag: 'LAP-0003', cost: -500 });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/v1/assets/:id/assign', () => {
  let assetId;

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/assets').set('Authorization', `Bearer ${adminToken}`).send(validAsset);
    assetId = res.body._id;
  });

  test('assigns the asset and flips its status to ASSIGNED', async () => {
    const res = await request(app)
      .put(`/api/v1/assets/${assetId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ASSIGNED');
    expect(res.body.assignedTo).toBe(employeeId);
  });

  test('rejects an obviously malformed employee ID with a clean error, not a raw DB crash', async () => {
    const res = await request(app)
      .put(`/api/v1/assets/${assetId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: 'not-a-real-id' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/valid employee/i);
  });

  test('writes an audit log entry when an asset is assigned', async () => {
    await request(app).put(`/api/v1/assets/${assetId}/assign`).set('Authorization', `Bearer ${adminToken}`).send({ employeeId });

    const logsRes = await request(app).get('/api/v1/audit-logs').set('Authorization', `Bearer ${adminToken}`);
    expect(logsRes.statusCode).toBe(200);
    expect(logsRes.body.some((log) => log.action === 'ASSET_ASSIGNED')).toBe(true);
  });

  test('an Employee cannot assign an asset, even to themselves', async () => {
    const res = await request(app)
      .put(`/api/v1/assets/${assetId}/assign`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ employeeId });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/v1/assets - pagination', () => {
  beforeEach(async () => {
    for (let i = 1; i <= 15; i++) {
      await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetTag: `BULK-${i}`, name: `Bulk Asset ${i}`, category: 'HARDWARE', cost: 1000 * i });
    }
  });

  test('defaults to 10 results per page', async () => {
    const res = await request(app).get('/api/v1/assets').set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.assets.length).toBe(10);
    expect(res.body.total).toBe(15);
    expect(res.body.totalPages).toBe(2);
  });

  test('returns the remaining results on page 2', async () => {
    const res = await request(app).get('/api/v1/assets?page=2').set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.assets.length).toBe(5);
  });
});
