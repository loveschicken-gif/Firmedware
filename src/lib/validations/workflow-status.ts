import { z } from "zod";

const ENTITY_TYPES = ["MATTER", "TASK", "DOCUMENT_LINK", "CONTRACT"] as const;

export function createWorkflowStatusSchema(msg: (key: string) => string) {
  return z.object({
    entityType: z.enum(ENTITY_TYPES),
    name: z
      .string()
      .min(1, msg("validation.nameRequired"))
      .max(64)
      .regex(/^[a-z0-9_]+$/, msg("validation.nameFormat")),
    labelEn: z.string().min(1, msg("validation.labelEnRequired")).max(120),
    labelTh: z.string().max(120).optional(),
    color: z.string().max(32).optional(),
    sortOrder: z.coerce.number().int().min(0).max(999),
    isDefault: z.preprocess(
      (v) => v === "on" || v === "true",
      z.boolean()
    ),
    isFinal: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
    active: z.preprocess(
      (v) =>
        v === undefined || v === null || v === ""
          ? true
          : v === "on" || v === "true",
      z.boolean()
    ),
  });
}
