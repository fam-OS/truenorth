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
      const mockDbReview = {
        ...mockReview,
        team_id: 'team1',
        team_name: 'Test Team',
        owner_id: 'member1',
        owner_name: 'Test User',
        item_count: 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };
      
      (prismaMock as any).$queryRaw.mockResolvedValue([mockDbReview]);
      
      const req = new Request('http://localhost/api/ops-reviews?orgId=org1&teamId=team1&quarter=Q1&year=2025');
      const res = await GET_LIST(req as any);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toEqual([{
        ...mockDbReview,
        item_count: 0
      }]);
      expect((prismaMock as any).$queryRaw).toHaveBeenCalled();
    });

    it('lists reviews without any filters', async () => {
      (prismaMock as any).$queryRaw.mockResolvedValue([]);
      const req = new Request('http://localhost/api/ops-reviews');
      const res = await GET_LIST(req as any);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/ops-reviews', () => {
    it('creates a review', async () => {
      const mockDbReview = {
        ...mockReview,
        team_id: 'team1',
        team_name: 'Test Team',
        owner_id: 'member1',
        owner_name: 'Test User',
        item_count: 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };
      
      (prismaMock as any).$queryRaw.mockResolvedValue([mockDbReview]);
      
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
      expect(data).toEqual(mockDbReview);
      expect((prismaMock as any).$queryRaw).toHaveBeenCalled();
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
      // Mock the raw SQL query response with the exact field names from the SQL query
      const mockDbResponse = {
        id: 'rev1',
        title: 'Q1 Review',
        description: 'Summary',
        quarter: 'Q1',
        year: 2025,
        month: 3,
        teamId: 'team1',
        ownerId: 'member1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team_id: 'team1',
        team_name: 'Test Team',
        owner_id: 'member1',
        owner_name: 'Test User',
        item_count: 0
      };
      
      // Mock the raw SQL query response with logging
      (prismaMock as any).$queryRaw.mockImplementation(async (strings: TemplateStringsArray, ...values: any[]) => {
        console.log('SQL Query:', strings);
        console.log('Query Values:', values);
        return [mockDbResponse];
      });
      
      // Create a mock params object that matches what the API expects
      const params = { id: 'rev1' };
      
      try {
        // Call the handler directly with the params
        const res = await GET_ONE({} as Request, { params });
        const data = await res.json();
        
        console.log('Response status:', res.status);
        console.log('Response data:', data);
        
        expect(res.status).toBe(200);
        expect(data.id).toBe('rev1');
        expect((prismaMock as any).$queryRaw).toHaveBeenCalled();
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
    });

    it('returns 404 when missing', async () => {
      (prismaMock as any).opsReview.findUnique.mockResolvedValue(null);
      const req = new Request('http://localhost/api/ops-reviews/missing');
      const res = await GET_ONE(req as any, { params: { id: 'missing' } });
      expect(res.status).toBe(404);
    });

    it('updates one', async () => {
      const updatedReview = {
        ...mockReview,
        title: 'Updated',
        team_id: 'team1',
        team_name: 'Test Team',
        owner_id: 'member1',
        owner_name: 'Test User',
        item_count: 0,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };
      
      (prismaMock as any).$queryRaw.mockResolvedValue([updatedReview]);
      
      const req = new Request('http://localhost/api/ops-reviews/rev1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });
      
      const res = await PUT_UPDATE(req as any, { params: { id: 'rev1' } });
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.title).toBe('Updated');
      expect((prismaMock as any).$queryRaw).toHaveBeenCalled();
    });

    it('deletes one', async () => {
      (prismaMock as any).opsReview.delete.mockResolvedValue(mockReview);
      
      const req = new Request('http://localhost/api/ops-reviews/rev1', { 
        method: 'DELETE' 
      });
      
      const res = await DELETE_ONE(req as any, { params: { id: 'rev1' } });
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect((prismaMock as any).opsReview.delete).toHaveBeenCalledWith({ 
        where: { id: 'rev1' } 
      });
    });

    it('returns 404 on delete when not found', async () => {
      (prismaMock as any).opsReview.delete.mockRejectedValue({ code: 'P2025' });
      const req = new Request('http://localhost/api/ops-reviews/missing', { method: 'DELETE' });
      const res = await DELETE_ONE(req as any, { params: { id: 'missing' } });
      expect(res.status).toBe(404);
    });
  });
});
