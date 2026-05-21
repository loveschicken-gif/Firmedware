/** Prisma filter: record has not been soft-deleted */
export const notDeleted = { deletedAt: null } as const;

export function softDeleteData(userId: string) {
  return {
    deletedAt: new Date(),
    deletedById: userId,
    updatedById: userId,
  };
}

export function auditOnCreate(userId: string) {
  return {
    createdById: userId,
    updatedById: userId,
  };
}

export function auditOnUpdate(userId: string) {
  return {
    updatedById: userId,
  };
}

import type { Translator } from "@/lib/i18n/messages";

/** Activity log summary for soft-delete (action remains DELETE) */
export function archivedSummary(
  t: Translator,
  entityLabel: string,
  name: string
) {
  return t("common.activityLog.archived", { entity: entityLabel, name });
}
