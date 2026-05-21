import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityAction, EntityType } from "@prisma/client";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { TagList } from "@/components/tag-list";
import { ClientStatusBadge } from "@/components/status-badges";
import { MatterStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logActivity } from "@/lib/activity";
import { getEntityActivityForUser, canViewEntityActivity } from "@/lib/activity-access";
import { prisma } from "@/lib/prisma";
import { canAccessClient, canWrite, clientWhereForUser, matterWhereForUser } from "@/lib/rbac";
import { notDeleted } from "@/lib/soft-delete";
import { requireSessionUser } from "@/lib/session";
import { deleteClientAction } from "@/lib/actions/clients";
import { DeleteButton } from "@/components/delete-button";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";
import { getBillingForClient } from "@/lib/actions/billing";
import { BillingListSection } from "@/components/billing-list-section";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }, { tn: tb }, { enableEntityNotes, enableBilling }] =
    await Promise.all([
      getServerNamespaceI18n("clients", user.id),
      getServerNamespaceI18n("common", user.id),
      getServerNamespaceI18n("billing", user.id),
      getFirmFeatureFlags(),
    ]);

  const billingRecords = enableBilling ? await getBillingForClient(id) : [];

  const client = await prisma.client.findFirst({
    where: { id, ...clientWhereForUser(user) },
    include: {
      tags: { include: { tag: true } },
      matters: {
        where: matterWhereForUser(user),
        orderBy: { updatedAt: "desc" },
      },
      documentLinks: {
        where: notDeleted,
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
      tasks: { where: notDeleted, orderBy: { dueAt: "asc" }, take: 20 },
    },
  });

  if (!client) notFound();

  if (!(await canAccessClient(user, id)) && user.role !== "ADMIN") {
    notFound();
  }

  await logActivity({
    userId: user.id,
    entityType: EntityType.CLIENT,
    entityId: id,
    action: ActivityAction.VIEW,
    summary: `Viewed client "${client.displayName}"`,
  });

  const showActivity = await canViewEntityActivity(user, EntityType.CLIENT, id);
  const activity = showActivity
    ? await getEntityActivityForUser(user, EntityType.CLIENT, id)
    : [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{client.displayName}</h1>
          {client.companyName && (
            <p className="text-slate-500">{client.companyName}</p>
          )}
          <div className="mt-2 flex gap-2">
            <ClientStatusBadge status={client.status} />
            <TagList tags={client.tags} />
          </div>
        </div>
        {canWrite(user) && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/clients/${id}/edit`}>{tc("edit")}</Link>
            </Button>
            <DeleteButton action={deleteClientAction.bind(null, id)} label={tn("archive")} />
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{tc("overview")}</TabsTrigger>
          <TabsTrigger value="matters">{tn("tab.matters", { count: client.matters.length })}</TabsTrigger>
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
                <p className="text-xs text-slate-500">{tc("email")}</p>
                <p>{client.email ?? tc("emptyValue")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{tc("phone")}</p>
                <p>{client.phone ?? tc("emptyValue")}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">{tc("address")}</p>
                <p>{client.address ?? tc("emptyValue")}</p>
              </div>
              {enableEntityNotes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">{tc("notes")}</p>
                  <p className="whitespace-pre-wrap">{client.notes ?? tc("emptyValue")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="matters">
          <div className="mb-4">
            {canWrite(user) && (
              <Button asChild size="sm">
                <Link href={`/matters/new?clientId=${id}`}>{tn("newMatter")}</Link>
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {client.matters.map((m) => (
              <li key={m.id}>
                <Link href={`/matters/${m.id}`} className="flex items-center gap-2 hover:underline">
                  <span className="font-medium">{m.title}</span>
                  <MatterStatusBadge status={m.status} />
                </Link>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="documents">
          <div className="mb-4">
            {canWrite(user) && (
              <Button asChild size="sm">
                <Link href={`/documents/new?clientId=${id}`}>{tn("addDocumentLink")}</Link>
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {client.documentLinks.map((d) => (
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
            {client.tasks.map((t) => (
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
              viewAllHref={`/billing?clientId=${id}`}
              viewAllLabel={tb("section.viewAll")}
              newHref={`/billing/new?clientId=${id}`}
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
              entityType={EntityType.CLIENT}
              entityId={id}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
