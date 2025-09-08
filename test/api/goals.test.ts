import { prismaMock } from '../setup';
import { POST as POST_GOAL } from '@/app/api/business-units/[businessUnitId]/goals/route';
import { PUT as PUT_GOAL } from '@/app/api/business-units/[businessUnitId]/goals/[goalId]/route';

const mockBusinessUnit = {
  id: 'bu1',
  name: 'Engineering',
  description: 'Engineering team',
  orgId: 'org1',
};

const mockStakeholder = {
  id: 'stakeholder1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Manager',
  businessUnitId: 'bu1',
};

const mockGoal = {
  id: 'goal1',
  title: 'Improve performance',
  description: 'Optimize system performance',
  quarter: 'Q1',
  year: 2025,
  status: 'IN_PROGRESS',
  stakeholderId: 'stakeholder1',
  progressNotes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGoalWithStakeholder = {
  ...mockGoal,
  stakeholder: {
    ...mockStakeholder,
    businessUnit: mockBusinessUnit,
    businessUnitId: 'bu1',
  },
};

describe('Goals API', () => {
  describe('POST /api/business-units/[businessUnitId]/goals', () => {
    it('creates a goal successfully', async () => {
      prismaMock.businessUnit.findUnique.mockResolvedValue(mockBusinessUnit as any);
      prismaMock.stakeholder.findUnique.mockResolvedValue(mockStakeholder as any);
      prismaMock.goal.create.mockResolvedValue(mockGoal as any);

      const payload = {
        title: 'Improve performance',
        description: 'Optimize system performance',
        quarter: 'Q1',
        year: 2025,
        status: 'IN_PROGRESS',
        stakeholderId: 'stakeholder1',
        progressNotes: null,
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST_GOAL(req as any, { params: Promise.resolve({ businessUnitId: 'bu1' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.title).toBe('Improve performance');
      expect(prismaMock.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Improve performance',
            description: 'Optimize system performance',
            quarter: 'Q1',
            year: 2025,
            status: 'IN_PROGRESS',
            stakeholderId: 'stakeholder1',
            progressNotes: null,
          }),
        })
      );
    });

    it('creates a goal with optional description', async () => {
      prismaMock.businessUnit.findUnique.mockResolvedValue(mockBusinessUnit as any);
      prismaMock.stakeholder.findUnique.mockResolvedValue(mockStakeholder as any);
      prismaMock.goal.create.mockResolvedValue({ ...mockGoal, description: null } as any);

      const payload = {
        title: 'Improve performance',
        quarter: 'Q1',
        year: 2025,
        stakeholderId: 'stakeholder1',
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST_GOAL(req as any, { params: Promise.resolve({ businessUnitId: 'bu1' }) });
      
      expect(res.status).toBe(200);
      expect(prismaMock.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Improve performance',
            description: null,
            quarter: 'Q1',
            year: 2025,
            stakeholderId: 'stakeholder1',
            progressNotes: null,
          }),
        })
      );
    });

    it('returns 404 when business unit not found', async () => {
      prismaMock.businessUnit.findUnique.mockResolvedValue(null);

      const payload = {
        title: 'Test goal',
        stakeholderId: 'stakeholder1',
        quarter: 'Q1',
        year: 2025,
      };

      const req = new Request('http://localhost/api/business-units/nonexistent/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST_GOAL(req as any, { params: Promise.resolve({ businessUnitId: 'nonexistent' }) });
      
      expect(res.status).toBe(404);
    });

    it('returns 400 when stakeholder not found', async () => {
      prismaMock.businessUnit.findUnique.mockResolvedValue(mockBusinessUnit as any);
      prismaMock.stakeholder.findUnique.mockResolvedValue(null);

      const payload = {
        title: 'Test goal',
        stakeholderId: 'nonexistent',
        quarter: 'Q1',
        year: 2025,
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST_GOAL(req as any, { params: Promise.resolve({ businessUnitId: 'bu1' }) });
      
      expect(res.status).toBe(400);
    });

    it('creates a goal when stakeholderId is missing (optional)', async () => {
      prismaMock.businessUnit.findUnique.mockResolvedValue(mockBusinessUnit as any);
      prismaMock.goal.create.mockResolvedValue({ ...mockGoal, stakeholderId: null } as any);

      const payload = {
        title: 'Test goal',
        quarter: 'Q1',
        year: 2025,
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST_GOAL(req as any, { params: Promise.resolve({ businessUnitId: 'bu1' }) });
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.stakeholderId).toBeNull();
      expect(prismaMock.goal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stakeholderId: null,
          }),
        })
      );
    });
  });

  describe('PUT /api/business-units/[businessUnitId]/goals/[goalId]', () => {
    it('updates a goal successfully', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockGoalWithStakeholder as any);
      prismaMock.goal.update.mockResolvedValue(mockGoalWithStakeholder as any);

      const updatePayload = {
        title: 'Updated performance goal',
        description: 'Updated description',
        quarter: 'Q2',
        year: 2025,
        status: 'COMPLETED',
        progressNotes: 'Great progress made',
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals/goal1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const res = await PUT_GOAL(req as any, { 
        params: Promise.resolve({ businessUnitId: 'bu1', goalId: 'goal1' }) 
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(prismaMock.goal.update).toHaveBeenCalledWith({
        where: { id: 'goal1' },
        data: {
          title: 'Updated performance goal',
          description: 'Updated description',
          quarter: 'Q2',
          year: 2025,
          status: 'COMPLETED',
          progressNotes: 'Great progress made',
        },
        include: {
          stakeholder: true,
        },
      });
    });

    it('updates a goal with optional description', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockGoalWithStakeholder as any);
      prismaMock.goal.update.mockResolvedValue(mockGoalWithStakeholder as any);

      const updatePayload = {
        title: 'Updated performance goal',
        quarter: 'Q2',
        year: 2025,
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals/goal1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const res = await PUT_GOAL(req as any, { 
        params: Promise.resolve({ businessUnitId: 'bu1', goalId: 'goal1' }) 
      });

      expect(res.status).toBe(200);
      expect(prismaMock.goal.update).toHaveBeenCalledWith({
        where: { id: 'goal1' },
        data: {
          title: 'Updated performance goal',
          description: null,
          quarter: 'Q2',
          year: 2025,
          progressNotes: null,
        },
        include: {
          stakeholder: true,
        },
      });
    });

    it('returns 404 when goal not found', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(null);

      const updatePayload = {
        title: 'Updated goal',
        quarter: 'Q2',
        year: 2025,
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const res = await PUT_GOAL(req as any, { 
        params: Promise.resolve({ businessUnitId: 'bu1', goalId: 'nonexistent' }) 
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when goal belongs to different business unit', async () => {
      const goalFromDifferentBU = {
        ...mockGoalWithStakeholder,
        stakeholder: {
          ...mockStakeholder,
          businessUnit: { ...mockBusinessUnit, id: 'different-bu' },
          businessUnitId: 'different-bu',
        },
      };

      prismaMock.goal.findUnique.mockResolvedValue(goalFromDifferentBU as any);

      const updatePayload = {
        title: 'Updated goal',
        quarter: 'Q2',
        year: 2025,
      };

      const req = new Request('http://localhost/api/business-units/bu1/goals/goal1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const res = await PUT_GOAL(req as any, { 
        params: Promise.resolve({ businessUnitId: 'bu1', goalId: 'goal1' }) 
      });

      expect(res.status).toBe(403);
    });
  });
});
