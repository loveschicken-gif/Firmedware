import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityAction, EntityType } from "@prisma/client";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { TagList } from "@/components/tag-list";
import { MatterStatusBadge } from "@/components/status-badges";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteButton } from "@/components/delete-button";
import { logActivity } from "@/lib/activity";
import {
  getEntityActivityForUser,
  canViewEntityActivity,
} from "@/lib/activity-access";
import { canWrite } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { deleteMatterAction } from "@/lib/actions/matters";
import { getMatterForUser } from "@/lib/matters";
import { formatDate } from "@/lib/utils";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { roleLabel } from "@/lib/i18n/enums";
import { getServerI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";
import { CommentsPlaceholder } from "@/components/comments-placeholder";
import { getBillingForMatter } from "@/lib/actions/billing";
import { BillingListSection } from "@/components/billing-list-section";

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }, { tn: tb }, { t }, { enableEntityNotes, enableComments, enableBilling }] =
    await Promise.all([
      getServerNamespaceI18n("matters", user.id),
      getServerNamespaceI18n("common", user.id),
      getServerNamespaceI18n("billing", user.id),
      getServerI18n(user.id),
      getFirmFeatureFlags(),
    ]);

  const matter = await getMatterForUser(user, id);
  const billingRecords =
    enableBilling && matter ? await getBillingForMatter(id) : [];

  if (!matter) notFound();

  await logActivity({
    userId: user.id,
    entityType: EntityType.MATTER,
    entityId: id,
    action: ActivityAction.VIEW,
    summary: `Viewed matter "${matter.title}"`,
  });

  const showActivity = await canViewEntityActivity(user, EntityType.MATTER, id);
  const activity = showActivity
    ? await getEntityActivityForUser(user, EntityType.MATTER, id)
    : [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{matter.title}</h1>
          <p className="text-slate-500">
            <Link href={`/clients/${matter.client.id}`} className="hover:underline">
              {matter.client.displayName}
            </Link>
            {matter.caseNumber && ` · ${matter.caseNumber}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {matter.workflowStatus ? (
              <WorkflowStatusBadge status={matter.workflowStatus} />
            ) : (
              <MatterStatusBadge status={matter.status} />
            )}
            <TagList tags={matter.tags} />
          </div>
        </div>
        {canWrite(user) && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/matters/${id}/edit`}>{tc("edit")}</Link>
            </Button>
            <DeleteButton action={deleteMatterAction.bind(null, id)} label={tn("archive")} />
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{tc("overview")}</TabsTrigger>
          <TabsTrigger value="documents">{tn("tab.documents")}</TabsTrigger>
          <TabsTrigger value="tasks">{tn("tab.tasks")}</TabsTrigger>
          {enableBilling && (
            <TabsTrigger value="billing">{tb("section.title")}</TabsTrigger>
          )}
          {showActivity && <TabsTrigger value="activity">{tc("activity")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">{tn("detail.opened")}</p>
                <p>{formatDate(matter.openedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{tn("detail.closed")}</p>
                <p>{formatDate(matter.closedAt)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">{tn("detail.assignedUsers")}</p>
                <p>
                  {matter.assignments.map((a) => `${a.user.name} (${roleLabel(t, a.user.role)})`).join(", ") || tc("emptyValue")}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">{tn("detail.assignedGroups")}</p>
                {matter.groupAssignments.length === 0 ? (
                  <p>{tc("emptyValue")}</p>
                ) : (
                  <ul className="space-y-2">
                    {matter.groupAssignments.map((ga) => (
                      <li key={ga.id} className="text-sm">
                        <span className="font-medium">{ga.label}</span>
                        <span className="text-slate-500"> ({ga.group.name})</span>
                        {ga.directoryPath && (
                          <span className="block text-slate-500">{ga.directoryPath}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {enableEntityNotes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">{tc("notes")}</p>
                  <p className="whitespace-pre-wrap">{matter.notes ?? tc("emptyValue")}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {enableComments && (
            <div className="mt-4">
              <CommentsPlaceholder
                title={tn("comments.placeholderTitle")}
                description={tn("comments.placeholderDescription")}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="documents">
          <div className="mb-4">
            {canWrite(user) && (
              <Button asChild size="sm">
                <Link href={`/documents/new?clientId=${matter.clientId}&matterId=${id}`}>
                  {tn("addDocumentLink")}
                </Link>
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {matter.documentLinks.map((d) => (
              <li key={d.id}>
                <Link href={`/documents/${d.id}`} className="font-medium hover:underline">
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="tasks">
          <ul className="space-y-2">
            {matter.tasks.map((t) => (
              <li key={t.id}>
                <Link href={`/tasks/${t.id}`} className="hover:underline">{t.title}</Link>
              </li>
            ))}
          </ul>
        </TabsContent>
        {enableBilling && (
          <TabsContent value="billing">
            <BillingListSection
              records={billingRecords}
              title={tb("section.title")}
              emptyLabel={tb("section.empty")}
              viewAllHref="/billing"
              viewAllLabel={tb("section.viewAll")}
              newHref={`/billing/new?clientId=${matter.clientId}&matterId=${id}`}
              newLabel={tb("addRecord")}
              canAdd={canWrite(user)}
            />
          </TabsContent>
        )}
        {showActivity && (
          <TabsContent value="activity">
            <ActivityLogPanel
              items={activity}
              emptyLabel={tc("activityLog.empty")}
              immutableNotice={tc("activityLog.immutableNotice")}
              downloadLabel={tc("activityLog.downloadCsv")}
              entryCountLabel={tc("activityLog.entryCount", {
                count: String(activity.length),
              })}
              entityType={EntityType.MATTER}
              entityId={id}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
