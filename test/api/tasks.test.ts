import { prismaMock } from '../setup';
import { GET as GET_TASKS, POST } from '@/app/api/tasks/route';
import { GET as GET_SINGLE, PUT, DELETE } from '@/app/api/tasks/[id]/route';
import { POST as POST_NOTE, GET as GET_NOTES } from '@/app/api/tasks/[id]/notes/route';

const nowIso = new Date().toISOString();
const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'TODO',
  dueDate: nowIso,
  createdAt: nowIso,
  updatedAt: nowIso,
};

const mockNote = {
  id: '1',
  content: 'Test Note',
  taskId: '1',
  createdAt: nowIso,
  updatedAt: nowIso,
};

describe('Tasks API', () => {
  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      prismaMock.task.findMany.mockResolvedValue([mockTask] as any);

      const response = await GET_TASKS();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([mockTask]);
      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        include: { notes: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle errors', async () => {
      prismaMock.task.findMany.mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost/api/tasks');
      const response = await GET_TASKS();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        status: 'TODO',
        dueDate: new Date().toISOString(),
      };

      prismaMock.task.create.mockResolvedValue({ ...mockTask, ...newTask } as any);

      const req = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(newTask.title);
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
        }),
        include: { notes: true },
      });
    });

    it('should validate input', async () => {
      const req = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      // Check for either format of error response
      if (Array.isArray(data.error.issues)) {
        // Zod error format
        expect(data.error.issues.some((issue: any) => 
          issue.path && issue.path.includes('title')
        )).toBe(true);
      } else {
        // Prisma or other error format
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('Validation error');
      }
    });
  });

  describe('GET /api/tasks/[id]', () => {
    it('should return a single task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);

      const req = new Request('http://localhost/api/tasks/1');
      const response = await GET_SINGLE(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTask);
      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { notes: true },
      });
    });

    it('should return 404 for non-existent task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      const req = new Request('http://localhost/api/tasks/999');
      const response = await GET_SINGLE(req, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found');
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    it('should update a task', async () => {
      const updates = {
        title: 'Updated Task',
        status: 'IN_PROGRESS' as const,
      };

      const updatedTask = {
        ...mockTask,
        ...updates,
      };

      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);
      prismaMock.task.update.mockResolvedValue(updatedTask as any);

      const req = new Request('http://localhost/api/tasks/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const response = await PUT(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject(updates);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updates,
        include: { notes: true },
      });
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);
      prismaMock.task.delete.mockResolvedValue(mockTask as any);

      const req = new Request('http://localhost/api/tasks/1', { method: 'DELETE' });
      const response = await DELETE(req, { params: { id: '1' } });

      expect(response.status).toBe(204);
      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('POST /api/tasks/[id]/notes', () => {
    it('should add a note to a task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);
      prismaMock.note.create.mockResolvedValue(mockNote as any);

      const req = new Request('http://localhost/api/tasks/1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test note' }),
      });
      const response = await POST_NOTE(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockNote);
      expect(prismaMock.note.create).toHaveBeenCalledWith({
        data: {
          content: 'Test note',
          taskId: '1',
        },
      });
    });
  });

  describe('GET /api/tasks/[id]/notes', () => {
    it('should get all notes for a task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);
      prismaMock.note.findMany.mockResolvedValue([mockNote] as any);

      const req = new Request('http://localhost/api/tasks/1/notes');
      const response = await GET_NOTES(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toMatchObject({
        id: expect.any(String),
        content: expect.any(String),
        taskId: '1',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(prismaMock.note.findMany).toHaveBeenCalledWith({
        where: { taskId: '1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});