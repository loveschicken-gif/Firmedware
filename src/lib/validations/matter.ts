import { z } from "zod";

export function createMatterSchema(msg: (key: string) => string) {
  return z.object({
    clientId: z.string().min(1, msg("validation.clientRequired")),
    title: z.string().min(1, msg("validation.titleRequired")),
    caseNumber: z.string().optional(),
    statusId: z.string().min(1, msg("validation.statusRequired")),
    notes: z.string().optional(),
    openedAt: z.string().optional(),
    closedAt: z.string().optional(),
  });
}

export type MatterFormData = z.infer<ReturnType<typeof createMatterSchema>>;
