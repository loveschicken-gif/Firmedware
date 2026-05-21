import type { WorkflowEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";

export async function getActiveWorkflowStatuses(
  entityType: WorkflowEntityType
) {
  return prisma.workflowStatus.findMany({
    where: { entityType, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getDefaultWorkflowStatus(
  entityType: WorkflowEntityType
) {
  return prisma.workflowStatus.findFirst({
    where: { entityType, active: true, isDefault: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function resolveMatterStatusId(
  statusId: string | null | undefined
) {
  if (statusId) {
    const ws = await prisma.workflowStatus.findFirst({
      where: { id: statusId, entityType: "MATTER", active: true },
    });
    if (ws) return ws;
  }
  return getDefaultWorkflowStatus("MATTER");
}

export async function mattersIncludeStatus() {
  return {
    workflowStatus: true,
    client: { select: { displayName: true } },
  } as const;
}

export function matterListWhere() {
  return notDeleted;
}
