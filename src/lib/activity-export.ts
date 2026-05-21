import type { ActivityLog, EntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/rbac";
import { isAdmin } from "@/lib/rbac";
import {
  getActivityLogsForAssignee,
  getEntityActivityForUser,
} from "@/lib/activity-access";

export type ActivityLogExportRow = ActivityLog & {
  user?: { name: string; email: string } | null;
};

const EXPORT_LIMIT = 10_000;

function escapeCsvCell(value: string): string {
  let cell = value;
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = `'${cell}`;
  }
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function activityLogsToCsv(rows: ActivityLogExportRow[]): string {
  const header = [
    "id",
    "createdAt",
    "category",
    "actorName",
    "actorEmail",
    "action",
    "entityType",
    "entityId",
    "summary",
    "metadata",
  ];
  const lines = [
    header.join(","),
    ...rows.map((row) => {
      const actorName = row.actorName ?? row.user?.name ?? "";
      const actorEmail = row.actorEmail ?? row.user?.email ?? "";
      return [
        row.id,
        row.createdAt.toISOString(),
        row.category,
        escapeCsvCell(actorName),
        escapeCsvCell(actorEmail),
        row.action,
        row.entityType,
        row.entityId,
        escapeCsvCell(row.summary),
        escapeCsvCell(
          row.metadata != null ? JSON.stringify(row.metadata) : ""
        ),
      ].join(",");
    }),
  ];
  return lines.join("\n");
}

export function activityExportFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}

/** Firm-wide (admin) or matter-scoped activity for export. */
export async function getActivityLogsForExport(
  user: SessionUser,
  options?: {
    entityType?: EntityType;
    entityId?: string;
    limit?: number;
  }
) {
  const limit = options?.limit ?? EXPORT_LIMIT;

  if (options?.entityType && options?.entityId) {
    return getEntityActivityForUser(
      user,
      options.entityType,
      options.entityId,
      limit
    );
  }

  if (isAdmin(user)) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    });
  }

  return getActivityLogsForAssignee(user, limit);
}
