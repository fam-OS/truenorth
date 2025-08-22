import { prismaMock } from '../setup';
import { GET as GET_ORG_TEAMS, POST as POST_ORG_TEAM } from '@/app/api/organizations/[organizationId]/teams/route';
import { GET as GET_TEAM, PUT as PUT_TEAM, DELETE as DELETE_TEAM } from '@/app/api/teams/[teamId]/route';

const mockTeam = {
  id: 'team1',
  name: 'Platform',
  description: 'Platform engineering',
  organizationId: 'org1',
};

describe('Teams API', () => {
  describe('GET /api/organizations/[organizationId]/teams', () => {
    it('returns teams for organization', async () => {
      prismaMock.team.findMany.mockResolvedValue([mockTeam] as any);
      const req = new Request('http://localhost/api/organizations/org1/teams');
      const res = await GET_ORG_TEAMS(req as any, { params: Promise.resolve({ organizationId: 'org1' }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([mockTeam]);
      expect(prismaMock.team.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        orderBy: { name: 'asc' },
        include: { members: true },
      });
    });
  });

  describe('POST /api/organizations/[organizationId]/teams', () => {
    it('creates a team', async () => {
      prismaMock.team.create.mockResolvedValue(mockTeam as any);
      const payload = { name: 'Platform', description: 'Platform engineering' };
      const req = new Request('http://localhost/api/organizations/org1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res = await POST_ORG_TEAM(req as any, { params: Promise.resolve({ organizationId: 'org1' }) });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data).toEqual(mockTeam);
      expect(prismaMock.team.create).toHaveBeenCalledWith({
        data: { name: 'Platform', description: 'Platform engineering', organizationId: 'org1' },
      });
    });

    it('validates input', async () => {
      const req = new Request('http://localhost/api/organizations/org1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST_ORG_TEAM(req as any, { params: Promise.resolve({ organizationId: 'org1' }) });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/teams/[teamId]', () => {
    it('returns a team by id', async () => {
      prismaMock.team.findUnique.mockResolvedValue({ ...mockTeam, organization: {}, members: [] } as any);
      const req = new Request('http://localhost/api/teams/team1');
      const res = await GET_TEAM(req as any, { params: { teamId: 'team1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe('team1');
      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({ where: { id: 'team1' }, include: { organization: true, members: true } });
    });
  });

  describe('PUT /api/teams/[teamId]', () => {
    it('updates a team', async () => {
      prismaMock.team.update.mockResolvedValue({ ...mockTeam, name: 'Core Platform' } as any);
      const req = new Request('http://localhost/api/teams/team1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Core Platform', description: 'desc' }),
      });
      const res = await PUT_TEAM(req as any, { params: { teamId: 'team1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.name).toBe('Core Platform');
      expect(prismaMock.team.update).toHaveBeenCalledWith({
        where: { id: 'team1' },
        data: { name: 'Core Platform', description: 'desc' },
      });
    });
  });

  describe('DELETE /api/teams/[teamId]', () => {
    it('deletes a team', async () => {
      prismaMock.team.delete.mockResolvedValue(mockTeam as any);
      const req = new Request('http://localhost/api/teams/team1', { method: 'DELETE' });
      const res = await DELETE_TEAM(req as any, { params: { teamId: 'team1' } });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(prismaMock.team.delete).toHaveBeenCalledWith({ where: { id: 'team1' } });
    });
  });
});
