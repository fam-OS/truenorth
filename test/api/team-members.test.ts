import { prismaMock } from '../setup';
import { GET as GET_MEMBERS, POST as POST_MEMBER } from '@/app/api/teams/[teamId]/members/route';
import { GET as GET_MEMBER, PUT as PUT_MEMBER, DELETE as DELETE_MEMBER } from '@/app/api/team-members/[memberId]/route';

const mockMember = {
  id: 'm1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'Engineer',
  teamId: 'team1',
};

describe('Team Members API', () => {
  describe('GET /api/teams/[teamId]/members', () => {
    it('returns members for a team', async () => {
      prismaMock.teamMember.findMany.mockResolvedValue([mockMember] as any);
      const req = new Request('http://localhost/api/teams/team1/members');
      const res = await GET_MEMBERS(req as any, { params: Promise.resolve({ teamId: 'team1' }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([mockMember]);
      expect(prismaMock.teamMember.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team1', isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('POST /api/teams/[teamId]/members', () => {
    it('creates a member with name only (empty optional fields)', async () => {
      prismaMock.teamMember.create.mockResolvedValue({ ...mockMember, email: null, role: null } as any);
      const payload = { name: 'Alice', email: '', role: '' };
      const req = new Request('http://localhost/api/teams/team1/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res = await POST_MEMBER(req as any, { params: Promise.resolve({ teamId: 'team1' }) });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.name).toBe('Alice');
      expect(prismaMock.teamMember.create).toHaveBeenCalledWith({
        data: { name: 'Alice', teamId: 'team1' },
      });
    });

    it('validates input', async () => {
      const req = new Request('http://localhost/api/teams/team1/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_MEMBER(req as any, { params: Promise.resolve({ teamId: 'team1' }) });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/team-members/[memberId]', () => {
    it('returns a member by id', async () => {
      prismaMock.teamMember.findUnique.mockResolvedValue(mockMember as any);
      const req = new Request('http://localhost/api/team-members/m1');
      const res = await GET_MEMBER(req as any, { params: Promise.resolve({ memberId: 'm1' }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual(mockMember);
      expect(prismaMock.teamMember.findUnique).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });

    it('returns 404 when not found', async () => {
      prismaMock.teamMember.findUnique.mockResolvedValue(null as any);
      const req = new Request('http://localhost/api/team-members/m404');
      const res = await GET_MEMBER(req as any, { params: Promise.resolve({ memberId: 'm404' }) });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe('Team member not found');
    });
  });

  describe('PUT /api/team-members/[memberId]', () => {
    it('updates name and clears email/role when empty strings provided', async () => {
      prismaMock.teamMember.update.mockResolvedValue({ ...mockMember, name: 'Alice B', email: null, role: null } as any);
      const req = new Request('http://localhost/api/team-members/m1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice B', email: '', role: '' }),
      });
      const res = await PUT_MEMBER(req as any, { params: Promise.resolve({ memberId: 'm1' }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Alice B');
      expect(prismaMock.teamMember.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { name: 'Alice B', email: null, role: null },
      });
    });
  });

  describe('DELETE /api/team-members/[memberId]', () => {
    it('deletes a member', async () => {
      prismaMock.teamMember.delete.mockResolvedValue(mockMember as any);
      const req = new Request('http://localhost/api/team-members/m1', { method: 'DELETE' });
      const res = await DELETE_MEMBER(req as any, { params: Promise.resolve({ memberId: 'm1' }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(prismaMock.teamMember.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    });
  });
});
