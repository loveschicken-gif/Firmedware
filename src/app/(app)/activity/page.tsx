import { PageHeader } from "@/components/page-header";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { getActivityForUser } from "@/lib/search";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

const DISPLAY_LIMIT = 200;

export default async function ActivityPage() {
  const user = await requireAdmin();
  const [{ tn }, { tn: tc }] = await Promise.all([
    getServerNamespaceI18n("admin", user.id),
    getServerNamespaceI18n("common", user.id),
  ]);
  const activity = await getActivityForUser(user, DISPLAY_LIMIT);

  return (
    <div>
      <PageHeader
        title={tn("activity.title")}
        description={tn("activity.description")}
      />
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <ActivityLogPanel
          items={activity}
          emptyLabel={tc("activityLog.empty")}
          immutableNotice={tc("activityLog.immutableNotice")}
          downloadLabel={tc("activityLog.downloadCsv")}
          entryCountLabel={tc("activityLog.entryCount", {
            count: activity.length,
          })}
        />
      </div>
    </div>
  );
}
