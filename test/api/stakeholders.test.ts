import { PrismaClient } from '@prisma/client';
import { createServer, Server } from '../helpers/server';
import { createTestUser, TestUser } from '../helpers/auth';

const prisma = new PrismaClient();
let server: Server;
let testUser: TestUser;
let testOrg: any;
let testBusinessUnit: any;

beforeAll(async () => {
  server = await createServer();
  testUser = await createTestUser(prisma);
  
  // Create a test organization and business unit
  testOrg = await prisma.organization.create({
    data: {
      name: 'Test Org',
      description: 'Test Organization',
    },
  });

  testBusinessUnit = await prisma.businessUnit.create({
    data: {
      name: 'Test Business Unit',
      organizationId: testOrg.id,
    },
  });
});

afterAll(async () => {
  await server.close();
  await prisma.$disconnect();
});

describe('Stakeholders API', () => {
  let testStakeholder: any;
  
  beforeEach(async () => {
    // Clean up before each test
    await prisma.stakeholder.deleteMany({});
    
    // Create a test stakeholder
    testStakeholder = await prisma.stakeholder.create({
      data: {
        name: 'Test Stakeholder',
        email: 'test@example.com',
        businessUnitId: testBusinessUnit.id,
      },
    });
  });

  describe('GET /api/stakeholders', () => {
    it('should return all stakeholders', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/stakeholders',
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
        query: {
          businessUnitId: testBusinessUnit.id,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('Test Stakeholder');
    });
  });

  describe('GET /api/stakeholders/:stakeholderId', () => {
    it('should return a single stakeholder', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/stakeholders/${testStakeholder.id}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('Test Stakeholder');
    });
  });

  describe('POST /api/stakeholders', () => {
    it('should create a new stakeholder', async () => {
      const newStakeholder = {
        name: 'New Stakeholder',
        email: 'new@example.com',
        businessUnitId: testBusinessUnit.id,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/stakeholders',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${testUser.token}`,
        },
        payload: JSON.stringify(newStakeholder),
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('New Stakeholder');
      
      // Verify in database
      const stakeholderInDb = await prisma.stakeholder.findUnique({
        where: { id: data.id },
      });
      expect(stakeholderInDb).toBeTruthy();
      expect(stakeholderInDb?.name).toBe('New Stakeholder');
    });
  });

  describe('PUT /api/stakeholders/:stakeholderId', () => {
    it('should update a stakeholder', async () => {
      const updateData = {
        name: 'Updated Stakeholder',
        email: 'updated@example.com',
      };

      const response = await server.inject({
        method: 'PUT',
        url: `/api/stakeholders/${testStakeholder.id}`,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${testUser.token}`,
        },
        payload: JSON.stringify(updateData),
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('Updated Stakeholder');
      
      // Verify in database
      const updatedStakeholder = await prisma.stakeholder.findUnique({
        where: { id: testStakeholder.id },
      });
      expect(updatedStakeholder?.name).toBe('Updated Stakeholder');
    });
  });

  describe('DELETE /api/stakeholders/:stakeholderId', () => {
    it('should delete a stakeholder', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/stakeholders/${testStakeholder.id}`,
        headers: {
          authorization: `Bearer ${testUser.token}`,
        },
      });

      expect(response.statusCode).toBe(204);
      
      // Verify deleted
      const stakeholderInDb = await prisma.stakeholder.findUnique({
        where: { id: testStakeholder.id },
      });
      expect(stakeholderInDb).toBeNull();
    });
  });
});
