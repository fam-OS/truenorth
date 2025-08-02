import { z } from 'zod';

export const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  dueDate: z.string().optional().transform((str) => str ? new Date(str) : null),
  status: TaskStatus.default('TODO'),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;