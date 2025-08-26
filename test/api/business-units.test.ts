import { PrismaClient } from '@prisma/client';
import { createServer, Server } from '../helpers/server';
import { createTestUser, TestUser } from '../helpers/auth';

const prisma = new PrismaClient();
let server: Server;
let testUser: TestUser;
let testOrg: any;

beforeAll(async () => {
  server = await createServer();
  testUser = await createTestUser(prisma);
  
  // Create a test organization
  testOrg = await prisma.organization.create({
    data: {
      name: 'Test Org',
      description: 'Test Organization',
    },
  });
});

afterAll(async () => {
  await server.close();
  await prisma.$disconnect();
});

describe('Business Units API', () => {
  let testBusinessUnit: any;
  
  beforeEach(async () => {
    // Clean up before each test
    await prisma.businessUnit.deleteMany({});
    
    // Create a test business unit
    testBusinessUnit = await prisma.businessUnit.create({
      data: {
        name: 'Test Business Unit',
        description: 'Test Business Unit Description',
        organizationId: testOrg.id,
      },
    });
  });

  describe('GET /api/organizations/:organizationId/business-units', () => {
    it('should return all business units for an organization', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/organizations/${testOrg.id}/business-units`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Test Business Unit');
    });
  });

  describe('GET /api/business-units/:businessUnitId', () => {
    it('should return a single business unit', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/business-units/${testBusinessUnit.id}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('Test Business Unit');
    });
  });

  describe('POST /api/organizations/:organizationId/business-units', () => {
    it('should create a new business unit', async () => {
      const newBU = {
        name: 'New Business Unit',
        description: 'New Business Unit Description',
      };

      const response = await server.inject({
        method: 'POST',
        url: `/api/organizations/${testOrg.id}/business-units`,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${testUser.token}`,
        },
        payload: JSON.stringify(newBU),
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('New Business Unit');
      
      // Verify in database
      const buInDb = await prisma.businessUnit.findUnique({
        where: { id: data.id },
      });
      expect(buInDb).toBeTruthy();
      expect(buInDb?.name).toBe('New Business Unit');
    });
  });

  describe('PUT /api/business-units/:businessUnitId', () => {
    it('should update a business unit', async () => {
      const updateData = {
        name: 'Updated Business Unit',
        description: 'Updated Description',
      };

      const response = await server.inject({
        method: 'PUT',
        url: `/api/business-units/${testBusinessUnit.id}`,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${testUser.token}`,
        },
        payload: JSON.stringify(updateData),
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('Updated Business Unit');
      
      // Verify in database
      const updatedBU = await prisma.businessUnit.findUnique({
        where: { id: testBusinessUnit.id },
      });
      expect(updatedBU?.name).toBe('Updated Business Unit');
    });
  });

  describe('DELETE /api/business-units/:businessUnitId', () => {
    it('should delete a business unit', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/business-units/${testBusinessUnit.id}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(204);
      
      // Verify deleted
      const buInDb = await prisma.businessUnit.findUnique({
        where: { id: testBusinessUnit.id },
      });
      expect(buInDb).toBeNull();
    });
  });
});
