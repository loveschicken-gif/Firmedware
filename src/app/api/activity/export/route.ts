import { EntityType } from "@prisma/client";
import {
  activityExportFilename,
  activityLogsToCsv,
  getActivityLogsForExport,
} from "@/lib/activity-export";
import { canViewEntityActivity } from "@/lib/activity-access";
import { getServerI18n } from "@/lib/i18n/server";
import { logActivityExported } from "@/lib/security/events";
import { getSessionUser } from "@/lib/session";

const ENTITY_TYPES = new Set<string>(Object.values(EntityType));

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityTypeRaw = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (entityTypeRaw && entityId) {
    if (!ENTITY_TYPES.has(entityTypeRaw)) {
      return new Response("Invalid entity type", { status: 400 });
    }
    const entityType = entityTypeRaw as EntityType;
    const allowed = await canViewEntityActivity(user, entityType, entityId);
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }
    const logs = await getActivityLogsForExport(user, { entityType, entityId });
    const csv = activityLogsToCsv(logs);
    const { t } = await getServerI18n(user.id);
    await logActivityExported(user.id, t("common.activityLog.exported"), {
      entityType,
      entityId,
      count: logs.length,
    });
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${activityExportFilename(`activity-${entityType.toLowerCase()}-${entityId.slice(0, 8)}`)}"`,
      },
    });
  }

  const logs = await getActivityLogsForExport(user);
  const prefix = user.role === "ADMIN" ? "activity-firm" : "activity-matters";
  const csv = activityLogsToCsv(logs);
  const { t } = await getServerI18n(user.id);
  await logActivityExported(user.id, t("common.activityLog.exported"), {
    scope: prefix,
    count: logs.length,
  });
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${activityExportFilename(prefix)}"`,
    },
  });
}
