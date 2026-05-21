import { z } from "zod";

export function createTaskSchema(msg: (key: string) => string) {
  return z.object({
    title: z.string().min(1, msg("validation.titleRequired")),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
    dueAt: z.string().optional(),
    deadlineType: z.string().max(64).optional(),
    clientId: z.string().optional(),
    matterId: z.string().optional(),
    assigneeId: z.string().optional(),
  });
}

export type TaskFormData = z.infer<ReturnType<typeof createTaskSchema>>;
