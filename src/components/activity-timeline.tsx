"use client";

import { formatDateTime } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/client";
import type { ActivityLog } from "@prisma/client";

type ActivityWithUser = ActivityLog & {
  actorName?: string;
  actorEmail?: string;
  user?: { name: string; email?: string } | null;
};

export function ActivityTimeline({
  items,
  emptyLabel,
}: {
  items: ActivityWithUser[];
  emptyLabel?: string;
}) {
  const t = useTranslations("common");

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {emptyLabel ?? t("activityLog.empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const actor =
          item.actorName ?? item.user?.name ?? t("activityLog.unknownActor");
        return (
          <li
            key={item.id}
            className="flex gap-3 border-l-2 border-slate-200 pl-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-900">{item.summary}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {actor} · {item.action} · {formatDateTime(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
