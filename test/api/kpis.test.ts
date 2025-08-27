import { prismaMock } from '../setup';
import { GET as GET_LIST, POST as POST_CREATE } from '@/app/api/kpis/route';
import { GET as GET_ONE, PUT as PUT_UPDATE, DELETE as DELETE_ONE } from '@/app/api/kpis/[id]/route';

describe('KPIs API', () => {
  describe('GET /api/kpis', () => {
    it('returns KPIs filtered by orgId and initiativeId', async () => {
      (prismaMock as any).kpi.findMany.mockResolvedValue([
        {
          id: 'k1',
          name: 'Revenue Growth',
          organizationId: 'org1',
          teamId: 't1',
          initiativeId: 'i1',
          quarter: 'Q3',
          year: 2025,
          targetMetric: 10,
          actualMetric: 8,
          team: { id: 't1', name: 'Sales' },
          initiative: { id: 'i1', name: 'Market Expansion' },
        },
      ]);

      const req = new Request('http://localhost/api/kpis?orgId=org1&initiativeId=i1');
      const res = await GET_LIST(req as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].id).toBe('k1');
      expect((prismaMock as any).kpi.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org1', initiativeId: 'i1' }) })
      );
    });
  });

  describe('POST /api/kpis', () => {
    it('creates a new KPI', async () => {
      const payload = {
        name: 'NPS',
        organizationId: 'org1',
        teamId: 't1',
        quarter: 'Q1',
        year: 2025,
        targetMetric: 60,
        actualMetric: 55,
        initiativeId: null,
      } as any;

      (prismaMock as any).kpi.create.mockResolvedValue({ id: 'k2', ...payload, team: { id: 't1' }, initiative: null });

      const req = new Request('http://localhost/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST_CREATE(req as any);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.name).toBe('NPS');
      expect((prismaMock as any).kpi.create).toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      const req = new Request('http://localhost/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_CREATE(req as any);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/kpis/:id', () => {
    it('returns a single KPI', async () => {
      (prismaMock as any).kpi.findUnique.mockResolvedValue({ id: 'k1', name: 'Revenue Growth' });
      const res = await GET_ONE({} as Request, { params: { id: 'k1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe('k1');
    });

    it('returns 404 when not found', async () => {
      (prismaMock as any).kpi.findUnique.mockResolvedValue(null);
      const res = await GET_ONE({} as Request, { params: { id: 'missing' } });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/kpis/:id', () => {
    it('updates a KPI', async () => {
      (prismaMock as any).kpi.update.mockResolvedValue({ id: 'k1', name: 'Updated KPI' });
      const req = new Request('http://localhost/api/kpis/k1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated KPI' }),
      });
      const res = await PUT_UPDATE(req as any, { params: { id: 'k1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated KPI');
    });
  });

  describe('DELETE /api/kpis/:id', () => {
    it('deletes a KPI', async () => {
      (prismaMock as any).kpi.delete.mockResolvedValue({ id: 'k1' });
      const req = new Request('http://localhost/api/kpis/k1', { method: 'DELETE' });
      const res = await DELETE_ONE(req as any, { params: { id: 'k1' } });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
