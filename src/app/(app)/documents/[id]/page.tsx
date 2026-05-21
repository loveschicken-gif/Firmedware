import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityType } from "@prisma/client";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { TagList } from "@/components/tag-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { DocumentReferenceActions } from "@/components/document-reference-actions";
import { logDocumentReferenceOpened } from "@/lib/security/events";
import { SensitivityBadge } from "@/components/sensitivity-badge";
import { getEntityActivityForUser, canViewEntityActivity } from "@/lib/activity-access";
import { prisma } from "@/lib/prisma";
import { canWrite, documentWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { deleteDocumentAction } from "@/lib/actions/documents";
import {
  documentProviderLabel,
  documentReferenceTypeLabel,
} from "@/lib/i18n/enums";
import { getServerI18n, getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";

function referenceValueLabelKey(
  referenceType: string
): "detail.externalLink" | "detail.folderPath" | "detail.manualReference" {
  switch (referenceType) {
    case "LOCAL_PATH":
      return "detail.folderPath";
    case "MANUAL_REFERENCE":
      return "detail.manualReference";
    default:
      return "detail.externalLink";
  }
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }, { t }, { enableEntityNotes }] = await Promise.all([
    getServerNamespaceI18n("documents", user.id),
    getServerNamespaceI18n("common", user.id),
    getServerI18n(user.id),
    getFirmFeatureFlags(),
  ]);

  const doc = await prisma.documentLink.findFirst({
    where: { id, ...documentWhereForUser(user) },
    include: {
      client: true,
      matter: true,
      tags: { include: { tag: true } },
    },
  });

  if (!doc) notFound();

  if (doc.referenceType === "EXTERNAL_URL") {
    await logDocumentReferenceOpened(
      user.id,
      {
        documentReferenceId: doc.id,
        referenceType: doc.referenceType,
        provider: doc.provider,
        clientId: doc.clientId,
        matterId: doc.matterId,
        sensitivity: doc.sensitivity,
      },
      doc.title
    );
  }

  const showActivity = await canViewEntityActivity(
    user,
    EntityType.DOCUMENT_LINK,
    id
  );
  const activity = showActivity
    ? await getEntityActivityForUser(user, EntityType.DOCUMENT_LINK, id)
    : [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{doc.title}</h1>
          <TagList tags={doc.tags} />
        </div>
        {canWrite(user) && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/documents/${id}/edit`}>{tc("edit")}</Link>
            </Button>
            <DeleteButton action={deleteDocumentAction.bind(null, id)} label={tn("archive")} />
          </div>
        )}
      </div>
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">{tc("client")}</p>
            <Link href={`/clients/${doc.client.id}`} className="hover:underline">
              {doc.client.displayName}
            </Link>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tc("matter")}</p>
            {doc.matter ? (
              <Link href={`/matters/${doc.matter.id}`} className="hover:underline">
                {doc.matter.title}
              </Link>
            ) : (
              tc("emptyValue")
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">{tn("detail.referenceType")}</p>
            <p>{documentReferenceTypeLabel(t, doc.referenceType)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tc("provider")}</p>
            <p>{documentProviderLabel(t, doc.provider, doc.providerLabel)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tn("table.sensitivity")}</p>
            <SensitivityBadge sensitivity={doc.sensitivity} />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500">
              {tn(referenceValueLabelKey(doc.referenceType))}
            </p>
            <DocumentReferenceActions
              documentId={doc.id}
              referenceType={doc.referenceType}
              referenceValue={doc.url}
            />
          </div>
          {enableEntityNotes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">{tc("notes")}</p>
              <p className="whitespace-pre-wrap">{doc.notes ?? tc("emptyValue")}</p>
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
            entityType={EntityType.DOCUMENT_LINK}
            entityId={id}
          />
        </div>
      )}
    </div>
  );
}
