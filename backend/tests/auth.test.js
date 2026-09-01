const request = require('supertest');
const app = require('../app');
const { connect, clearDatabase, closeDatabase } = require('./db');

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  department: 'Engineering',
};

describe('POST /api/v1/auth/register', () => {
  test('creates a new account and returns a token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe(validUser.email);
  });

  // This is the exact vulnerability we deliberately closed: a public
  // registration form must never be able to grant itself admin access.
  test('ignores any "role" sent in the request body and forces EMPLOYEE', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...validUser, role: 'SUPER_ADMIN' });
    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe('EMPLOYEE');
  });

  test('rejects a request missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'incomplete@example.com' });
    expect(res.statusCode).toBe(400);
  });

  test('rejects an invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...validUser, email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
  });

  test('rejects a password shorter than 6 characters', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...validUser, password: '123' });
    expect(res.statusCode).toBe(400);
  });

  test('rejects registering the same email twice', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app).post('/api/v1/auth/register').send(validUser);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
  });

  test('logs in successfully with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: validUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects an incorrect password with a vague error message', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: validUser.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    // Deliberately vague - see authController.js comments on why this
    // message must NOT reveal whether the email exists.
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('rejects a login for an email that was never registered', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: 'whatever123' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  test('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('returns the logged-in user with a valid token', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${registerRes.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(validUser.email);
  });
});
