import Link from "next/link";
import { Download } from "lucide-react";
import type { EntityType } from "@prisma/client";
import { ActivityTimeline } from "@/components/activity-timeline";
import type { ActivityLogExportRow } from "@/lib/activity-export";

function buildExportHref(entityType?: EntityType, entityId?: string) {
  const base = "/api/activity/export";
  if (entityType && entityId) {
    return `${base}?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`;
  }
  return base;
}

export function ActivityLogPanel({
  items,
  emptyLabel,
  immutableNotice,
  downloadLabel,
  entryCountLabel,
  entityType,
  entityId,
}: {
  items: ActivityLogExportRow[];
  emptyLabel: string;
  immutableNotice: string;
  downloadLabel: string;
  entryCountLabel?: string;
  entityType?: EntityType;
  entityId?: string;
}) {
  const exportHref = buildExportHref(entityType, entityId);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{immutableNotice}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {entryCountLabel ? (
          <p className="text-sm text-slate-600">{entryCountLabel}</p>
        ) : null}
        <Link
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4 shrink-0" />
          {downloadLabel}
        </Link>
      </div>
      <ActivityTimeline items={items} emptyLabel={emptyLabel} />
    </div>
  );
}
