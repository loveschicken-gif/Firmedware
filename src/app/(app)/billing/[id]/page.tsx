import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityAction, EntityType } from "@prisma/client";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { BillingExternalLink } from "@/components/billing-external-link";
import { BillingStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { BillingForm } from "@/app/(app)/billing/billing-form";
import { logActivity } from "@/lib/activity";
import {
  getEntityActivityForUser,
  canViewEntityActivity,
} from "@/lib/activity-access";
import {
  deleteBillingAction,
  getClientsForBillingForm,
  getMattersForBillingForm,
} from "@/lib/actions/billing";
import { requireBillingEnabled } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { billingWhereForUser, canWrite, isAdmin } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getServerI18n, getServerNamespaceI18n } from "@/lib/i18n/server";
import type { BillingStatus } from "@/lib/billing-status";

export default async function BillingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireBillingEnabled();
  const { id } = await params;
  const { edit } = await searchParams;
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }, { t }] = await Promise.all([
    getServerNamespaceI18n("billing", user.id),
    getServerNamespaceI18n("common", user.id),
    getServerI18n(user.id),
  ]);

  const record = await prisma.billingRecord.findFirst({
    where: { id, ...billingWhereForUser(user) },
    include: {
      client: true,
      matter: true,
    },
  });

  if (!record) notFound();

  if (edit === "1" && canWrite(user)) {
    const [clients, matters] = await Promise.all([
      getClientsForBillingForm(),
      getMattersForBillingForm(),
    ]);
    return (
      <div>
        <PageHeader title={tn("form.save")} />
        <BillingForm record={record} clients={clients} matters={matters} />
      </div>
    );
  }

  await logActivity({
    userId: user.id,
    entityType: EntityType.BILLING_RECORD,
    entityId: id,
    action: ActivityAction.VIEW,
    summary: t("billing.activity.viewed", { name: record.title }),
  });

  const showActivity = await canViewEntityActivity(
    user,
    EntityType.BILLING_RECORD,
    id
  );
  const activity = showActivity
    ? await getEntityActivityForUser(user, EntityType.BILLING_RECORD, id)
    : [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{record.title}</h1>
          {record.invoiceNumber && (
            <p className="text-slate-500">{record.invoiceNumber}</p>
          )}
          <div className="mt-2">
            <BillingStatusBadge status={record.status as BillingStatus} />
          </div>
        </div>
        <div className="flex gap-2">
          {canWrite(user) && (
            <Button variant="outline" asChild>
              <Link href={`/billing/${id}?edit=1`}>{tc("edit")}</Link>
            </Button>
          )}
          {isAdmin(user) && (
            <DeleteButton
              action={deleteBillingAction.bind(null, id)}
              label={tn("archive")}
            />
          )}
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600">{tn("detail.disclaimer")}</p>
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">{tc("client")}</p>
            <Link href={`/clients/${record.client.id}`} className="hover:underline">
              {record.client.displayName}
            </Link>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tc("matter")}</p>
            {record.matter ? (
              <Link href={`/matters/${record.matter.id}`} className="hover:underline">
                {record.matter.title}
              </Link>
            ) : (
              tc("emptyValue")
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">{tn("detail.amount")}</p>
            <p className="font-medium">
              {formatCurrency(record.amount, record.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tn("detail.issueDate")}</p>
            <p>{formatDate(record.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tn("detail.dueDate")}</p>
            <p>{formatDate(record.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tn("detail.paidAt")}</p>
            <p>{formatDate(record.paidAt)}</p>
          </div>
          {record.externalLink && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">{tn("detail.externalLink")}</p>
              <BillingExternalLink
                href={record.externalLink}
                billingId={id}
                title={record.title}
                label={tn("detail.openExternal")}
                ariaLabel={tn("detail.openExternalAria")}
              />
            </div>
          )}
          {record.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">{tn("detail.description")}</p>
              <p className="whitespace-pre-wrap">{record.description}</p>
            </div>
          )}
          {record.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">{tc("notes")}</p>
              <p className="whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      {showActivity && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">{tc("activity")}</h2>
          <ActivityLogPanel
            items={activity}
            emptyLabel={tc("activityLog.empty")}
            immutableNotice={tc("activityLog.immutableNotice")}
            downloadLabel={tc("activityLog.downloadCsv")}
            entryCountLabel={tc("activityLog.entryCount", {
              count: String(activity.length),
            })}
            entityType={EntityType.BILLING_RECORD}
            entityId={id}
          />
        </div>
      )}
    </div>
  );
}
