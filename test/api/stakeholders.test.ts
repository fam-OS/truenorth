import { prismaMock } from '../setup';
import { GET as GET_STAKEHOLDERS, POST as POST_STAKEHOLDER } from '@/app/api/stakeholders/route';
import { POST as POST_BU_STAKEHOLDER } from '@/app/api/business-units/[businessUnitId]/stakeholders/route';

describe('Stakeholders API', () => {
  describe('GET /api/stakeholders', () => {
    it('returns all stakeholders', async () => {
      (prismaMock as any).stakeholder.findMany.mockResolvedValue([
        { id: 's1', name: 'Test Stakeholder', email: 'test@example.com', businessUnitId: null },
      ]);

      const req = new Request('http://localhost/api/stakeholders');
      const res = await GET_STAKEHOLDERS(req as any);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name).toBe('Test Stakeholder');
    });

    it('filters unassigned when unassigned=true', async () => {
      (prismaMock as any).stakeholder.findMany.mockResolvedValue([
        { id: 's1', name: 'A', businessUnitId: null },
        { id: 's2', name: 'B', businessUnitId: 'bu1' },
      ]);
      const req = new Request('http://localhost/api/stakeholders?unassigned=true');
      const res = await GET_STAKEHOLDERS(req as any);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].id).toBe('s1');
    });
  });

  describe('POST /api/stakeholders', () => {
    it('creates a new global stakeholder (no BU)', async () => {
      const created = { id: 's2', name: 'New Stakeholder', role: 'Manager', email: 'new@example.com' };
      (prismaMock as any).stakeholder.create.mockResolvedValue(created);

      const req = new Request('http://localhost/api/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Stakeholder', role: 'Manager', email: 'new@example.com' }),
      });
      const res = await POST_STAKEHOLDER(req as any);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('New Stakeholder');
    });

    it('validates required fields', async () => {
      const req = new Request('http://localhost/api/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_STAKEHOLDER(req as any);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/business-units/:businessUnitId/stakeholders', () => {
    it('links existing stakeholder to BU when stakeholderId provided', async () => {
      (prismaMock as any).stakeholder.update.mockResolvedValue({ id: 's1', name: 'A', businessUnitId: 'bu1' });
      const req = new Request('http://localhost/api/business-units/bu1/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakeholderId: 's1' }),
      });
      const res = await POST_BU_STAKEHOLDER(req as any, { params: { businessUnitId: 'bu1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.businessUnitId).toBe('bu1');
    });

    it('creates a new stakeholder under BU when name/role provided', async () => {
      (prismaMock as any).stakeholder.create.mockResolvedValue({ id: 's3', name: 'C', role: 'Lead', businessUnitId: 'bu1' });
      const req = new Request('http://localhost/api/business-units/bu1/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'C', role: 'Lead', email: 'c@example.com' }),
      });
      const res = await POST_BU_STAKEHOLDER(req as any, { params: { businessUnitId: 'bu1' } });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('C');
    });
  });
});
