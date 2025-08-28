import { prismaMock } from '../setup';
import { GET as GET_LIST, POST as POST_CREATE } from '@/app/api/initiatives/route';
import { GET as GET_ONE, PUT as PUT_UPDATE, DELETE as DELETE_ONE } from '@/app/api/initiatives/[id]/route';

describe('Initiatives API', () => {
  describe('GET /api/initiatives', () => {
    it('returns initiatives filtered by orgId', async () => {
      (prismaMock as any).initiative.findMany.mockResolvedValue([
        { id: 'i1', name: 'Init 1', organizationId: 'org1', kpis: [], owner: null, organization: { id: 'org1' } },
      ]);

      const req = new Request('http://localhost/api/initiatives?orgId=org1');
      const res = await GET_LIST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].id).toBe('i1');
      expect((prismaMock as any).initiative.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org1' }) })
      );
    });
  });

  describe('POST /api/initiatives', () => {
    it('creates a new initiative', async () => {
      const payload = {
        name: 'New Initiative',
        organizationId: 'org1',
        summary: 'One-liner',
        valueProposition: 'Value',
        implementationDetails: 'Details',
        releaseDate: null,
        ownerId: null,
      };
      // Route validates the organization exists
      (prismaMock as any).organization.findUnique.mockResolvedValue({ id: 'org1', name: 'Org' });
      (prismaMock as any).initiative.create.mockResolvedValue({ id: 'i2', ...payload, owner: null, organization: { id: 'org1' } });

      const req = new Request('http://localhost/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST_CREATE(req as any);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.name).toBe('New Initiative');
      expect((prismaMock as any).initiative.create).toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      const req = new Request('http://localhost/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_CREATE(req as any);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/initiatives/:id', () => {
    it('returns a single initiative', async () => {
      (prismaMock as any).initiative.findUnique.mockResolvedValue({ id: 'i1', name: 'Init 1', kpis: [] });
      const res = await GET_ONE({} as Request, { params: { id: 'i1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe('i1');
    });

    it('returns 404 when not found', async () => {
      (prismaMock as any).initiative.findUnique.mockResolvedValue(null);
      const res = await GET_ONE({} as Request, { params: { id: 'missing' } });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/initiatives/:id', () => {
    it('updates an initiative', async () => {
      (prismaMock as any).initiative.update.mockResolvedValue({ id: 'i1', name: 'Updated' });
      const req = new Request('http://localhost/api/initiatives/i1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      const res = await PUT_UPDATE(req as any, { params: { id: 'i1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/initiatives/:id', () => {
    it('deletes an initiative', async () => {
      (prismaMock as any).initiative.delete.mockResolvedValue({ id: 'i1' });
      const req = new Request('http://localhost/api/initiatives/i1', { method: 'DELETE' });
      const res = await DELETE_ONE(req as any, { params: { id: 'i1' } });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
