import { prismaMock } from '../setup';
import { GET, POST } from '@/app/api/tasks/route';
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

      const response = await GET();
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
      const response = await GET(req);
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
        data: expect.objectContaining(newTask),
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
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET /api/tasks/[id]', () => {
    it('should return a single task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);

      const req = new Request('http://localhost/api/tasks/1');
      const response = await GET_SINGLE(req, { params: Promise.resolve({ id: '1' }) });
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
        status: 'IN_PROGRESS',
      };

      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);
      prismaMock.task.update.mockResolvedValue({ ...mockTask, ...updates } as any);

      const req = new Request('http://localhost/api/tasks/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const response = await PUT(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe(updates.title);
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining(updates),
        include: { notes: true },
      });
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(mockTask as any);
      prismaMock.task.delete.mockResolvedValue(mockTask as any);

      const req = new Request('http://localhost/api/tasks/1', {
        method: 'DELETE',
      });

      const response = await DELETE(req, { params: Promise.resolve({ id: '1' }) });

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
        body: JSON.stringify({ content: 'Test Note' }),
      });

      const response = await POST_NOTE(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockNote);
      expect(prismaMock.note.create).toHaveBeenCalledWith({
        data: {
          content: 'Test Note',
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
      const response = await GET_NOTES(req, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([mockNote]);
      expect(prismaMock.note.findMany).toHaveBeenCalledWith({
        where: { taskId: '1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});