import { prismaMock } from '../setup';
import { GET as GET_ITEMS, POST as POST_ITEM } from '@/app/api/ops-reviews/[id]/items/route';

const mockItem = {
  id: 'item1',
  title: 'Revenue',
  description: 'Rev growth',
  targetMetric: 100,
  actualMetric: 95,
  quarter: 'Q1',
  year: 2025,
  opsReviewId: 'rev1',
  teamId: 'team1',
  ownerId: 'member1',
};

describe('Ops Review Items API', () => {
  describe('GET /api/ops-reviews/[id]/items', () => {
    it('lists items for a review', async () => {
      (prismaMock as any).opsReviewItem.findMany.mockResolvedValue([mockItem]);
      const req = new Request('http://localhost/api/ops-reviews/rev1/items');
      const res = await GET_ITEMS(req as any, { params: { id: 'rev1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([mockItem]);
      expect((prismaMock as any).opsReviewItem.findMany).toHaveBeenCalledWith({
        where: { opsReviewId: 'rev1' },
        include: { owner: true, team: true, opsReview: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('POST /api/ops-reviews/[id]/items', () => {
    it('creates an item under the review', async () => {
      (prismaMock as any).opsReviewItem.create.mockResolvedValue(mockItem);
      const payload = {
        title: 'Revenue',
        description: 'Rev growth',
        targetMetric: 100,
        actualMetric: 95,
        quarter: 'Q1',
        year: 2025,
        teamId: 'team1',
        ownerId: 'member1',
      };
      const req = new Request('http://localhost/api/ops-reviews/rev1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res = await POST_ITEM(req as any, { params: { id: 'rev1' } });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data).toEqual(mockItem);
      expect((prismaMock as any).opsReviewItem.create).toHaveBeenCalled();
    });

    it('validates input', async () => {
      const req = new Request('http://localhost/api/ops-reviews/rev1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_ITEM(req as any, { params: { id: 'rev1' } });
      expect(res.status).toBe(400);
    });
  });
});
