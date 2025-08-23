import { prismaMock } from '../setup';
import { GET as GET_LIST, POST as POST_CREATE } from '@/app/api/ops-reviews/route';
import { GET as GET_ONE, PUT as PUT_UPDATE, DELETE as DELETE_ONE } from '@/app/api/ops-reviews/[id]/route';

const mockReview = {
  id: 'rev1',
  title: 'Q1 Review',
  description: 'Summary',
  quarter: 'Q1',
  month: 3,
  year: 2025,
  teamId: 'team1',
  ownerId: 'member1',
};

describe('Ops Reviews API', () => {
  describe('GET /api/ops-reviews', () => {
    it('lists reviews with optional filters', async () => {
      (prismaMock as any).opsReview.findMany.mockResolvedValue([mockReview]);
      const req = new Request('http://localhost/api/ops-reviews?teamId=team1&quarter=Q1&year=2025');
      const res = await GET_LIST(req as any);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([mockReview]);
      expect((prismaMock as any).opsReview.findMany).toHaveBeenCalled();
    });
  });

  describe('POST /api/ops-reviews', () => {
    it('creates a review', async () => {
      (prismaMock as any).opsReview.create.mockResolvedValue(mockReview);
      const payload = {
        title: 'Q1 Review',
        description: 'Summary',
        quarter: 'Q1',
        month: 3,
        year: 2025,
        teamId: 'team1',
        ownerId: 'member1',
      };
      const req = new Request('http://localhost/api/ops-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res = await POST_CREATE(req as any);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data).toEqual(mockReview);
      expect((prismaMock as any).opsReview.create).toHaveBeenCalled();
    });

    it('validates input', async () => {
      const req = new Request('http://localhost/api/ops-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_CREATE(req as any);
      expect(res.status).toBe(400);
    });
  });

  describe('resource /api/ops-reviews/[id]', () => {
    it('gets one', async () => {
      (prismaMock as any).opsReview.findUnique.mockResolvedValue({ ...mockReview, items: [], team: {}, owner: {} });
      const req = new Request('http://localhost/api/ops-reviews/rev1');
      const res = await GET_ONE(req as any, { params: { id: 'rev1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe('rev1');
    });

    it('returns 404 when missing', async () => {
      (prismaMock as any).opsReview.findUnique.mockResolvedValue(null);
      const req = new Request('http://localhost/api/ops-reviews/missing');
      const res = await GET_ONE(req as any, { params: { id: 'missing' } });
      expect(res.status).toBe(404);
    });

    it('updates one', async () => {
      (prismaMock as any).opsReview.update.mockResolvedValue({ ...mockReview, title: 'Updated' });
      const req = new Request('http://localhost/api/ops-reviews/rev1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });
      const res = await PUT_UPDATE(req as any, { params: { id: 'rev1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.title).toBe('Updated');
      expect((prismaMock as any).opsReview.update).toHaveBeenCalled();
    });

    it('deletes one', async () => {
      (prismaMock as any).opsReview.delete.mockResolvedValue(mockReview);
      const req = new Request('http://localhost/api/ops-reviews/rev1', { method: 'DELETE' });
      const res = await DELETE_ONE(req as any, { params: { id: 'rev1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect((prismaMock as any).opsReview.delete).toHaveBeenCalledWith({ where: { id: 'rev1' } });
    });
  });
});
