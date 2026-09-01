// -----------------------------------------------------------------------
// This is a hand-written OpenAPI 3.0 document, served by swagger-ui-express
// at /api-docs. We write this as a plain JS object rather than scattering
// @openapi JSDoc comments across every route file - for a project this
// size, one file that's easy to read top-to-bottom beats digging through
// eight different route files to understand the whole API surface.
//
// Not every single endpoint in the app is documented here - the ones that
// matter most for understanding how the system works (auth, the core
// asset lifecycle, licenses, users, audit logs, role requests) are covered
// in full. Extending this to a new endpoint just means adding one more
// entry to the "paths" object below, following the same shape.
// -----------------------------------------------------------------------
const bearerAuth = { bearerAuth: [] };

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AssetTrack API',
    version: '1.0.0',
    description:
      'Enterprise asset & SaaS license management API. Most endpoints require a Bearer JWT ' +
      '(obtained from POST /auth/login or /auth/register) sent as `Authorization: Bearer <token>`.',
  },
  servers: [{ url: '/api/v1', description: 'Current server' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { message: { type: 'string', example: 'Something went wrong' } },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Harshit Garg' },
          email: { type: 'string', example: 'harshit@company.com' },
          role: { type: 'string', enum: ['SUPER_ADMIN', 'IT_MANAGER', 'AUDITOR', 'EMPLOYEE'] },
          department: { type: 'string', example: 'Engineering' },
          status: { type: 'string', enum: ['ACTIVE', 'OFFBOARDED'] },
        },
      },
      AuthResponse: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          { type: 'object', properties: { token: { type: 'string', description: 'JWT to use as a Bearer token' } } },
        ],
      },
      Asset: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          assetTag: { type: 'string', example: 'LAP-0042' },
          name: { type: 'string', example: 'MacBook Pro 14"' },
          category: { type: 'string', enum: ['HARDWARE', 'SOFTWARE'] },
          serialNumber: { type: 'string' },
          assignedTo: { type: 'string', nullable: true, description: 'User ID, or null if unassigned' },
          cost: { type: 'number', example: 150000 },
          warrantyExpiry: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'] },
        },
      },
      License: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Figma' },
          vendor: { type: 'string' },
          totalSeats: { type: 'integer', example: 10 },
          costPerSeat: { type: 'number', example: 1500 },
          renewalDate: { type: 'string', format: 'date', nullable: true },
          seats: {
            type: 'array',
            items: { type: 'object', properties: { user: { type: 'string' }, assignedAt: { type: 'string', format: 'date-time' } } },
          },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          actor: { type: 'string', description: 'User ID who performed the action' },
          action: { type: 'string', example: 'ASSET_ASSIGNED' },
          targetEntity: { type: 'string', example: 'Asset' },
          entityId: { type: 'string' },
          changes: { type: 'object', properties: { from: { type: 'object' }, to: { type: 'object' } } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RoleRequest: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          user: { type: 'string' },
          requestedRole: { type: 'string', enum: ['IT_MANAGER', 'AUDITOR', 'SUPER_ADMIN'] },
          reason: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account (always created as EMPLOYEE)',
        description:
          'Public endpoint. Any "role" sent in the request body is ignored - every account created ' +
          'here becomes EMPLOYEE. Elevated access is requested afterward via POST /role-requests.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'department'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string', minLength: 6 },
                  department: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Validation error or email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: "Get the currently logged-in user's profile",
        security: [bearerAuth],
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset link',
        description:
          'Always returns the same generic message whether or not the email exists (prevents user ' +
          'enumeration). Since this project has no email service configured, the reset URL is returned ' +
          'directly in the response for testing - a production deployment would email it instead.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } } } } },
        responses: { 200: { description: 'Generic success message, plus resetUrl in this simplified build' } },
      },
    },
    '/assets': {
      get: {
        tags: ['Assets'],
        summary: 'List assets (paginated, searchable, filterable)',
        security: [bearerAuth],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Matches name, asset tag, or serial number' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'] } },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['HARDWARE', 'SOFTWARE'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Paginated asset list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    assets: { type: 'array', items: { $ref: '#/components/schemas/Asset' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Assets'],
        summary: 'Create a new asset',
        description: 'Requires SUPER_ADMIN or IT_MANAGER.',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetTag', 'name', 'category', 'cost'],
                properties: {
                  assetTag: { type: 'string' },
                  name: { type: 'string' },
                  category: { type: 'string', enum: ['HARDWARE', 'SOFTWARE'] },
                  serialNumber: { type: 'string' },
                  cost: { type: 'number' },
                  warrantyExpiry: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Asset created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } },
          403: { description: 'Not permitted for this role', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/assets/my-assets': {
      get: {
        tags: ['Assets'],
        summary: "List the current user's own assigned assets",
        security: [bearerAuth],
        responses: { 200: { description: 'Assets assigned to you', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Asset' } } } } } },
      },
    },
    '/assets/stats': {
      get: {
        tags: ['Assets'],
        summary: 'Aggregate stats for the Dashboard (totals, status breakdown, spend by department)',
        security: [bearerAuth],
        responses: { 200: { description: 'Dashboard statistics' } },
      },
    },
    '/assets/export': {
      get: {
        tags: ['Assets'],
        summary: 'Download the currently filtered asset list as a CSV file',
        security: [bearerAuth],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'CSV file', content: { 'text/csv': { schema: { type: 'string' } } } } },
      },
    },
    '/assets/{id}/assign': {
      put: {
        tags: ['Assets'],
        summary: 'Assign an asset to an employee, or unassign it',
        description: 'Requires SUPER_ADMIN or IT_MANAGER. Automatically writes an audit log entry.',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { employeeId: { type: 'string', nullable: true, description: 'Omit or send null to unassign' } } },
            },
          },
        },
        responses: { 200: { description: 'Updated asset', content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } } },
      },
    },
    '/assets/{id}/retire': {
      put: {
        tags: ['Assets'],
        summary: 'Retire an asset (marks it RETIRED and unassigns it)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated asset', content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } } },
      },
    },
    '/licenses': {
      get: {
        tags: ['Licenses'],
        summary: 'List all SaaS licenses with their current seat holders',
        security: [bearerAuth],
        responses: { 200: { description: 'License list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/License' } } } } } },
      },
      post: {
        tags: ['Licenses'],
        summary: 'Create a new license',
        description: 'Requires SUPER_ADMIN or IT_MANAGER.',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'totalSeats', 'costPerSeat'],
                properties: { name: { type: 'string' }, vendor: { type: 'string' }, totalSeats: { type: 'integer' }, costPerSeat: { type: 'number' }, renewalDate: { type: 'string', format: 'date' } },
              },
            },
          },
        },
        responses: { 201: { description: 'License created', content: { 'application/json': { schema: { $ref: '#/components/schemas/License' } } } } },
      },
    },
    '/licenses/{id}/assign-seat': {
      put: {
        tags: ['Licenses'],
        summary: 'Assign a license seat to an employee',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['employeeId'], properties: { employeeId: { type: 'string' } } } } } },
        responses: { 200: { description: 'Updated license' }, 400: { description: 'No seats available, or user already has one' } },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        security: [bearerAuth],
        parameters: [{ name: 'includeOffboarded', in: 'query', schema: { type: 'boolean' }, description: 'If true, includes terminated accounts too' }],
        responses: { 200: { description: 'User list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } },
      },
      post: {
        tags: ['Users'],
        summary: 'Directly create a user with a specific role',
        description: 'Requires SUPER_ADMIN or AUDITOR. Only a SUPER_ADMIN may grant the SUPER_ADMIN role.',
        security: [bearerAuth],
        responses: { 201: { description: 'User created' }, 403: { description: 'Not permitted' } },
      },
    },
    '/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: "Change a user's role",
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Role updated' }, 403: { description: 'Not permitted (e.g. non-admin trying to grant SUPER_ADMIN)' } },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'List the 200 most recent audit log entries',
        description: 'Requires SUPER_ADMIN or AUDITOR.',
        security: [bearerAuth],
        responses: { 200: { description: 'Audit log entries', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } } } } },
      },
    },
    '/role-requests': {
      post: {
        tags: ['Role Requests'],
        summary: 'Request elevated access for yourself',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestedRole', 'reason'],
                properties: { requestedRole: { type: 'string', enum: ['IT_MANAGER', 'AUDITOR', 'SUPER_ADMIN'] }, reason: { type: 'string', minLength: 10 } },
              },
            },
          },
        },
        responses: { 201: { description: 'Request submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleRequest' } } } } },
      },
      get: {
        tags: ['Role Requests'],
        summary: 'List all role requests (for review)',
        description: 'Requires SUPER_ADMIN or AUDITOR.',
        security: [bearerAuth],
        responses: { 200: { description: 'All role requests', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RoleRequest' } } } } } },
      },
    },
  },
};

module.exports = swaggerSpec;
