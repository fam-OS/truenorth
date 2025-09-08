import { prismaMock } from '../setup';
import { GET as GET_STATUSES, POST as POST_STATUS } from '@/app/api/kpis/[id]/statuses/route';
import { PUT as PUT_STATUS, DELETE as DELETE_STATUS } from '@/app/api/kpis/[id]/statuses/[statusId]/route';

const KPI_ID = 'kpi1';

describe('KPI Status API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/kpis/[id]/statuses', () => {
    it('lists statuses for a KPI', async () => {
      const rows = [
        { id: 's1', kpiId: KPI_ID, year: 2025, quarter: 'Q1', amount: 100 },
        { id: 's2', kpiId: KPI_ID, year: 2025, quarter: 'Q2', amount: 200 },
      ];
      (prismaMock as any).kpiStatus.findMany.mockResolvedValue(rows);

      const req = new Request(`http://localhost/api/kpis/${KPI_ID}/statuses`);
      const res = await GET_STATUSES(req as any, { params: { id: KPI_ID } } as any);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect((prismaMock as any).kpiStatus.findMany).toHaveBeenCalledWith({
        where: { kpiId: KPI_ID },
        orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
      });
    });
  });

  describe('POST /api/kpis/[id]/statuses', () => {
    it('creates a status and recomputes KPI totals', async () => {
      const payload = { year: 2025, quarter: 'Q1', amount: 150 };
      const created = { id: 's1', kpiId: KPI_ID, ...payload };

      (prismaMock as any).kpiStatus.create.mockResolvedValue(created);
      (prismaMock as any).kpiStatus.aggregate.mockResolvedValue({ _sum: { amount: 150 } });
      (prismaMock as any).kpi.findUnique.mockResolvedValue({ targetMetric: 200 });
      (prismaMock as any).kpi.update.mockResolvedValue({ id: KPI_ID });

      const req = new Request(`http://localhost/api/kpis/${KPI_ID}/statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res = await POST_STATUS(req as any, { params: { id: KPI_ID } } as any);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data).toEqual(created);
      expect((prismaMock as any).kpiStatus.create).toHaveBeenCalledWith({
        data: { kpiId: KPI_ID, ...payload },
      });
      // Recompute applied
      expect((prismaMock as any).kpi.update).toHaveBeenCalledWith({
        where: { id: KPI_ID },
        data: { actualMetric: 150, metTarget: false, metTargetPercent: 75 },
      });
    });

    it('validates input', async () => {
      const req = new Request(`http://localhost/api/kpis/${KPI_ID}/statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_STATUS(req as any, { params: { id: KPI_ID } } as any);
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/kpis/[id]/statuses/[statusId]', () => {
    it('updates a status and recomputes KPI', async () => {
      (prismaMock as any).kpiStatus.update.mockResolvedValue({ id: 's1', kpiId: KPI_ID, year: 2025, quarter: 'Q1', amount: 100 });
      (prismaMock as any).kpiStatus.aggregate.mockResolvedValue({ _sum: { amount: 300 } });
      (prismaMock as any).kpi.findUnique.mockResolvedValue({ targetMetric: 200 });
      (prismaMock as any).kpi.update.mockResolvedValue({ id: KPI_ID });

      const req = new Request(`http://localhost/api/kpis/${KPI_ID}/statuses/s1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 300 }),
      });
      const res = await PUT_STATUS(req as any, { params: { id: KPI_ID, statusId: 's1' } } as any);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toMatchObject({ id: 's1' });
      expect((prismaMock as any).kpi.update).toHaveBeenCalledWith({
        where: { id: KPI_ID },
        data: { actualMetric: 300, metTarget: true, metTargetPercent: 150 },
      });
    });
  });

  describe('DELETE /api/kpis/[id]/statuses/[statusId]', () => {
    it('deletes a status and recomputes KPI', async () => {
      (prismaMock as any).kpiStatus.delete.mockResolvedValue({});
      (prismaMock as any).kpiStatus.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      (prismaMock as any).kpi.findUnique.mockResolvedValue({ targetMetric: 100 });
      (prismaMock as any).kpi.update.mockResolvedValue({ id: KPI_ID });

      const req = new Request(`http://localhost/api/kpis/${KPI_ID}/statuses/s1`, { method: 'DELETE' });
      const res = await DELETE_STATUS(req as any, { params: { id: KPI_ID, statusId: 's1' } } as any);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect((prismaMock as any).kpi.update).toHaveBeenCalledWith({
        where: { id: KPI_ID },
        data: { actualMetric: 0, metTarget: false, metTargetPercent: 0 },
      });
    });
  });
});
