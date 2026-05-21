"use server";

import { DocumentReferenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { documentWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import {
  logDocumentReferenceCopied,
  type DocumentReferenceActivityMeta,
} from "@/lib/security/events";
import { getServerI18n } from "@/lib/i18n/server";
import { notDeleted } from "@/lib/soft-delete";

function referenceMeta(doc: {
  id: string;
  referenceType: DocumentReferenceType;
  provider: DocumentReferenceActivityMeta["provider"];
  clientId: string;
  matterId: string | null;
  sensitivity: DocumentReferenceActivityMeta["sensitivity"];
}): DocumentReferenceActivityMeta {
  return {
    documentReferenceId: doc.id,
    referenceType: doc.referenceType,
    provider: doc.provider,
    clientId: doc.clientId,
    matterId: doc.matterId,
    sensitivity: doc.sensitivity,
  };
}

export async function logDocumentPathCopiedAction(documentId: string) {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);

  const doc = await prisma.documentLink.findFirst({
    where: { id: documentId, ...notDeleted, ...documentWhereForUser(user) },
    select: {
      id: true,
      title: true,
      referenceType: true,
      provider: true,
      clientId: true,
      matterId: true,
      sensitivity: true,
    },
  });

  if (!doc || doc.referenceType !== "LOCAL_PATH") {
    return { success: false as const };
  }

  await logDocumentReferenceCopied(
    user.id,
    referenceMeta(doc),
    t("documents.activity.pathCopied", { name: doc.title })
  );

  return { success: true as const };
}

export async function logManualReferenceCopiedAction(documentId: string) {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);

  const doc = await prisma.documentLink.findFirst({
    where: { id: documentId, ...notDeleted, ...documentWhereForUser(user) },
    select: {
      id: true,
      title: true,
      referenceType: true,
      provider: true,
      clientId: true,
      matterId: true,
      sensitivity: true,
    },
  });

  if (!doc || doc.referenceType !== "MANUAL_REFERENCE") {
    return { success: false as const };
  }

  await logDocumentReferenceCopied(
    user.id,
    referenceMeta(doc),
    t("documents.activity.referenceCopied", { name: doc.title })
  );

  return { success: true as const };
}
