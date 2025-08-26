import { prismaMock } from '../setup';
import { GET as GET_ORGS, POST as POST_ORG } from '@/app/api/organizations/route';
import { GET as GET_ORG, PUT as PUT_ORG, DELETE as DELETE_ORG } from '@/app/api/organizations/[organizationId]/route';

describe('Organizations API', () => {
  describe('GET /api/organizations', () => {
    it('returns all organizations', async () => {
      (prismaMock as any).organization.findMany.mockResolvedValue([
        { id: 'org1', name: 'Test Org', description: 'Test Organization', businessUnits: [] },
      ]);

      const res = await GET_ORGS();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name).toBe('Test Org');
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('returns a single organization', async () => {
      (prismaMock as any).organization.findUnique.mockResolvedValue({ id: 'org1', name: 'Test Org', businessUnits: [] });
      const res = await GET_ORG({} as Request, { params: { organizationId: 'org1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Test Org');
    });

    it('returns 404 for non-existent organization', async () => {
      (prismaMock as any).organization.findUnique.mockResolvedValue(null);
      const res = await GET_ORG({} as Request, { params: { organizationId: 'missing' } });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/organizations', () => {
    it('creates a new organization', async () => {
      const newOrg = { id: 'org2', name: 'New Org', description: 'New Organization' };
      (prismaMock as any).organization.create.mockResolvedValue(newOrg);

      const req = new Request('http://localhost/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Org', description: 'New Organization' }),
      });

      const res = await POST_ORG(req as any);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('New Org');
    });

    it('validates required fields', async () => {
      const req = new Request('http://localhost/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_ORG(req as any);
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/organizations/:id', () => {
    it('updates an organization', async () => {
      (prismaMock as any).organization.update.mockResolvedValue({ id: 'org1', name: 'Updated Org' });
      const req = new Request('http://localhost/api/organizations/org1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Org', description: 'Updated Description' }),
      });
      const res = await PUT_ORG(req as any, { params: { organizationId: 'org1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated Org');
    });
  });

  describe('DELETE /api/organizations/:id', () => {
    it('deletes an organization', async () => {
      (prismaMock as any).organization.delete.mockResolvedValue({ id: 'org1' });
      const req = new Request('http://localhost/api/organizations/org1', { method: 'DELETE' });
      const res = await DELETE_ORG(req as any, { params: { organizationId: 'org1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
    });
  });
});
