import { prismaMock } from '../setup';
import { GET as GET_BU, PUT as PUT_BU, DELETE as DELETE_BU } from '@/app/api/business-units/[businessUnitId]/route';
import { GET as GET_BUS, POST as POST_BU } from '@/app/api/business-units/route';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Business Units API', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user_123' } });
  });

  describe('GET /api/business-units', () => {
    it('returns all business units globally', async () => {
      (prismaMock as any).businessUnit.findMany.mockResolvedValue([
        { id: 'bu1', name: 'Test Business Unit' },
      ]);

      const res = await GET_BUS();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name).toBe('Test Business Unit');
      expect((prismaMock as any).businessUnit.findMany).toHaveBeenCalled();
    });

    it('returns an empty array when no business units exist', async () => {
      (prismaMock as any).businessUnit.findMany.mockResolvedValue([]);
      const res = await GET_BUS();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('handles server errors', async () => {
      (prismaMock as any).businessUnit.findMany.mockRejectedValue(new Error('DB down'));
      const res = await GET_BUS();
      expect(res.status).toBeGreaterThanOrEqual(500);
    });
  });

  describe('GET /api/business-units/:businessUnitId', () => {
    it('returns a single business unit', async () => {
      (prismaMock as any).businessUnit.findUnique.mockResolvedValue({ id: 'bu1', name: 'Test Business Unit' });
      const res = await GET_BU({} as Request, { params: Promise.resolve({ businessUnitId: 'bu1' }) as any });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Test Business Unit');
    });
  });

  describe('POST /api/business-units', () => {
    it('creates a new business unit', async () => {
      const created = { id: 'bu2', name: 'New Business Unit' };
      (prismaMock as any).businessUnit.create.mockResolvedValue(created);
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue({ id: 'acc1', userId: 'user_123' });

      const req = new Request('http://localhost/api/business-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Business Unit', description: 'Desc', companyAccountId: 'acc1' }),
      });
      const res = await POST_BU(req as any);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('New Business Unit');
      expect((prismaMock as any).businessUnit.create).toHaveBeenCalled();
    });

    it('validates required fields and returns 400', async () => {
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue({ id: 'acc1', userId: 'user_123' });
      const req = new Request('http://localhost/api/business-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyAccountId: 'acc1' }),
      });
      const res = await POST_BU(req as any);
      expect(res.status).toBe(400);
    });

    it('handles server errors', async () => {
      (prismaMock as any).businessUnit.create.mockRejectedValue(new Error('DB down'));
      (prismaMock as any).companyAccount.findFirst.mockResolvedValue({ id: 'acc1', userId: 'user_123' });
      const req = new Request('http://localhost/api/business-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New BU', companyAccountId: 'acc1' }),
      });
      const res = await POST_BU(req as any);
      expect(res.status).toBeGreaterThanOrEqual(500);
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
      const res = await PUT_BU(req as any, { params: Promise.resolve({ businessUnitId: 'bu1' }) as any });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated Business Unit');
    });
  });

  describe('DELETE /api/business-units/:businessUnitId', () => {
    it('deletes a business unit', async () => {
      (prismaMock as any).businessUnit.delete.mockResolvedValue({ id: 'bu1' });
      const res = await DELETE_BU({} as Request, { params: Promise.resolve({ businessUnitId: 'bu1' }) as any });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
    });
  });
});
