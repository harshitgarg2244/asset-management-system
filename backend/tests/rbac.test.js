const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');
const { connect, clearDatabase, closeDatabase } = require('./db');

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const createUserDirectly = async ({ name, email, password, department, role }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name, email, passwordHash, department, role });
};

const loginAs = async (email, password) => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.token;
};

let adminToken, auditorToken, itManagerToken, employeeToken;

beforeEach(async () => {
  await createUserDirectly({ name: 'Admin', email: 'admin@test.com', password: 'password123', department: 'IT', role: 'SUPER_ADMIN' });
  await createUserDirectly({ name: 'Auditor', email: 'auditor@test.com', password: 'password123', department: 'Compliance', role: 'AUDITOR' });
  await createUserDirectly({ name: 'ITMgr', email: 'itmgr@test.com', password: 'password123', department: 'IT', role: 'IT_MANAGER' });
  await createUserDirectly({ name: 'Employee', email: 'employee@test.com', password: 'password123', department: 'Sales', role: 'EMPLOYEE' });

  adminToken = await loginAs('admin@test.com', 'password123');
  auditorToken = await loginAs('auditor@test.com', 'password123');
  itManagerToken = await loginAs('itmgr@test.com', 'password123');
  employeeToken = await loginAs('employee@test.com', 'password123');
});

describe('GET /api/v1/audit-logs - restricted to SUPER_ADMIN and AUDITOR', () => {
  test('Super Admin can view audit logs', async () => {
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('Auditor can view audit logs', async () => {
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', `Bearer ${auditorToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('IT Manager CANNOT view audit logs', async () => {
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', `Bearer ${itManagerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Employee CANNOT view audit logs', async () => {
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', `Bearer ${employeeToken}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/v1/users - creating accounts with a specific role', () => {
  const newUser = { name: 'New Hire', email: 'newhire@test.com', password: 'password123', department: 'Sales', role: 'IT_MANAGER' };

  test('Employee cannot create a user at all', async () => {
    const res = await request(app).post('/api/v1/users').set('Authorization', `Bearer ${employeeToken}`).send(newUser);
    expect(res.statusCode).toBe(403);
  });

  test('Auditor can create an IT Manager account', async () => {
    const res = await request(app).post('/api/v1/users').set('Authorization', `Bearer ${auditorToken}`).send(newUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('IT_MANAGER');
  });

  // This is the specific safeguard from userController.js: an Auditor can
  // manage most roles, but granting SUPER_ADMIN is Super-Admin-only.
  test('Auditor CANNOT create a Super Admin account', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${auditorToken}`)
      .send({ ...newUser, email: 'sneaky@test.com', role: 'SUPER_ADMIN' });
    expect(res.statusCode).toBe(403);
  });

  test('Super Admin CAN create a Super Admin account', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newUser, email: 'newadmin@test.com', role: 'SUPER_ADMIN' });
    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('SUPER_ADMIN');
  });
});

describe('PUT /api/v1/users/:id/terminate - Super Admin only', () => {
  test('IT Manager cannot terminate an account', async () => {
    const employee = await User.findOne({ email: 'employee@test.com' });
    const res = await request(app).put(`/api/v1/users/${employee._id}/terminate`).set('Authorization', `Bearer ${itManagerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Auditor cannot terminate an account (stricter than role changes)', async () => {
    const employee = await User.findOne({ email: 'employee@test.com' });
    const res = await request(app).put(`/api/v1/users/${employee._id}/terminate`).set('Authorization', `Bearer ${auditorToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Super Admin can terminate an account, and it can no longer log in', async () => {
    const employee = await User.findOne({ email: 'employee@test.com' });
    const terminateRes = await request(app).put(`/api/v1/users/${employee._id}/terminate`).set('Authorization', `Bearer ${adminToken}`);
    expect(terminateRes.statusCode).toBe(200);

    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'employee@test.com', password: 'password123' });
    expect(loginRes.statusCode).toBe(403);
  });
});
