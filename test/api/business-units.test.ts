import { prismaMock } from '../setup';
import { GET as GET_BU, PUT as PUT_BU, DELETE as DELETE_BU } from '@/app/api/business-units/[businessUnitId]/route';
import { GET as GET_ORG_BUs, POST as POST_ORG_BU } from '@/app/api/organizations/[organizationId]/business-units/route';

describe('Business Units API', () => {
  describe('GET /api/organizations/:organizationId/business-units', () => {
    it('returns all business units for an organization', async () => {
      (prismaMock as any).businessUnit.findMany.mockResolvedValue([
        { id: 'bu1', name: 'Test Business Unit' },
      ]);

      const res = await GET_ORG_BUs({} as Request, { params: { organizationId: 'org1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name).toBe('Test Business Unit');
    });
  });

  describe('GET /api/business-units/:businessUnitId', () => {
    it('returns a single business unit', async () => {
      (prismaMock as any).businessUnit.findUnique.mockResolvedValue({ id: 'bu1', name: 'Test Business Unit' });
      const res = await GET_BU({} as Request, { params: { businessUnitId: 'bu1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Test Business Unit');
    });
  });

  describe('POST /api/organizations/:organizationId/business-units', () => {
    it('creates a new business unit', async () => {
      const created = { id: 'bu2', name: 'New Business Unit' };
      (prismaMock as any).businessUnit.create.mockResolvedValue(created);

      const req = new Request('http://localhost/api/organizations/org1/business-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Business Unit', description: 'Desc' }),
      });
      const res = await POST_ORG_BU(req as any, { params: { organizationId: 'org1' } });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('New Business Unit');
    });
  });

  describe('PUT /api/business-units/:businessUnitId', () => {
    it('updates a business unit', async () => {
      (prismaMock as any).businessUnit.update.mockResolvedValue({ id: 'bu1', name: 'Updated Business Unit' });
      const req = new Request('http://localhost/api/business-units/bu1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Business Unit', description: 'Updated Description' }),
      });
      const res = await PUT_BU(req as any, { params: { businessUnitId: 'bu1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated Business Unit');
    });
  });

  describe('DELETE /api/business-units/:businessUnitId', () => {
    it('deletes a business unit', async () => {
      (prismaMock as any).businessUnit.delete.mockResolvedValue({ id: 'bu1' });
      const res = await DELETE_BU({} as Request, { params: { businessUnitId: 'bu1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
    });
  });
});
