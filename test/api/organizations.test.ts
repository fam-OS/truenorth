import { PrismaClient } from '@prisma/client';
import { createServer, Server } from '../helpers/server';
import { createTestUser, TestUser } from '../helpers/auth';

const prisma = new PrismaClient();
let server: Server;
let testUser: TestUser;

beforeAll(async () => {
  server = await createServer();
  testUser = await createTestUser(prisma);
});

afterAll(async () => {
  await server.close();
  await prisma.$disconnect();
});

describe('Organizations API', () => {
  let testOrg: any;
  
  beforeEach(async () => {
    // Clean up before each test
    await prisma.organization.deleteMany({});
    
    // Create a test organization
    testOrg = await prisma.organization.create({
      data: {
        name: 'Test Org',
        description: 'Test Organization',
      },
    });
  });

  describe('GET /api/organizations', () => {
    it('should return all organizations', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/organizations',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Test Org');
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('should return a single organization', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/organizations/${testOrg.id}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('Test Org');
    });

    it('should return 404 for non-existent organization', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/organizations/non-existent-id',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/organizations', () => {
    it('should create a new organization', async () => {
      const newOrg = {
        name: 'New Org',
        description: 'New Organization',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/organizations',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${testUser.token}`,
        },
        payload: JSON.stringify(newOrg),
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('New Org');
      
      // Verify in database
      const orgInDb = await prisma.organization.findUnique({
        where: { id: data.id },
      });
      expect(orgInDb).toBeTruthy();
      expect(orgInDb?.name).toBe('New Org');
    });

    it('should validate required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/organizations',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${testUser.token}`,
        },
        payload: JSON.stringify({}),
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/organizations/:id', () => {
    it('should update an organization', async () => {
      const updateData = {
        name: 'Updated Org',
        description: 'Updated Description',
      };

      const response = await server.inject({
        method: 'PUT',
        url: `/api/organizations/${testOrg.id}`,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${testUser.token}`,
        },
        payload: JSON.stringify(updateData),
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('Updated Org');
      
      // Verify in database
      const updatedOrg = await prisma.organization.findUnique({
        where: { id: testOrg.id },
      });
      expect(updatedOrg?.name).toBe('Updated Org');
    });
  });

  describe('DELETE /api/organizations/:id', () => {
    it('should delete an organization', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/organizations/${testOrg.id}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(204);
      
      // Verify deleted
      const orgInDb = await prisma.organization.findUnique({
        where: { id: testOrg.id },
      });
      expect(orgInDb).toBeNull();
    });
  });
});
