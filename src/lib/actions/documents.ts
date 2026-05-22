"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ActivityAction,
  DocumentReferenceType,
  EntityType,
  Prisma,
} from "@prisma/client";
import type { DocumentProvider, DocumentSensitivity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import type { Translator } from "@/lib/i18n/messages";
import {
  canAccessClient,
  canAccessMatter,
  canWrite,
  documentWhereForUser,
} from "@/lib/rbac";
import type { SessionUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { createDocumentSchema } from "@/lib/validations/document";
import { parseTagIds } from "@/lib/validations/common";
import {
  archivedSummary,
  auditOnCreate,
  auditOnUpdate,
  notDeleted,
  softDeleteData,
} from "@/lib/soft-delete";
import { getFirmSettings } from "@/lib/firm-settings";
import { formError, type ActionResult } from "./utils";

type DocumentSchema = ReturnType<typeof createDocumentSchema>;

function documentFromForm(formData: FormData, schema: DocumentSchema) {
  const matterId = formData.get("matterId");
  const referenceType =
    (formData.get("referenceType") as DocumentReferenceType | null) ??
    "EXTERNAL_URL";
  const provider =
    referenceType === "LOCAL_PATH"
      ? "LOCAL_FOLDER"
      : referenceType === "MANUAL_REFERENCE"
        ? "OTHER"
        : formData.get("provider");

  return schema.safeParse({
    clientId: formData.get("clientId"),
    matterId: matterId && matterId !== "" ? matterId : undefined,
    title: formData.get("title"),
    referenceType,
    url: formData.get("url"),
    provider,
    providerLabel: formData.get("providerLabel") || undefined,
    notes: formData.get("notes") || undefined,
    sensitivity: formData.get("sensitivity") || "NORMAL",
  });
}

function documentReferenceActivityMeta(
  doc: {
    id: string;
    referenceType: DocumentReferenceType;
    provider: DocumentProvider;
    clientId: string;
    matterId: string | null;
    sensitivity: DocumentSensitivity;
  }
): Prisma.InputJsonValue {
  return {
    documentReferenceId: doc.id,
    referenceType: doc.referenceType,
    provider: doc.provider,
    clientId: doc.clientId,
    matterId: doc.matterId,
    sensitivity: doc.sensitivity,
  };
}

async function validateDocumentAccess(
  user: SessionUser,
  clientId: string,
  matterId: string | undefined,
  t: Translator
) {
  if (user.role === "ADMIN") return;
  if (matterId) {
    if (!(await canAccessMatter(user, matterId)))
      throw new Error(t("documents.error.matterNotFound"));
  } else if (!(await canAccessClient(user, clientId))) {
    throw new Error(t("documents.error.clientNotFound"));
  }
}

export async function createDocumentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const documentSchema = createDocumentSchema((k) => t(`documents.${k}`));

  if (!canWrite(user)) return formError(t("documents.error.noPermissionAdd"));

  const settings = await getFirmSettings();
  if (
    settings.requireDocumentPermissionConfirm &&
    formData.get("permissionConfirmed") !== "on"
  ) {
    return formError(t("documents.validation.permissionConfirmRequired"));
  }

  const parsed = documentFromForm(formData, documentSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  try {
    await validateDocumentAccess(
      user,
      parsed.data.clientId,
      parsed.data.matterId,
      t
    );
  } catch (e) {
    return formError(
      e instanceof Error ? e.message : t("common.error.accessDenied")
    );
  }

  const tagIds = parseTagIds(formData);
  const data = parsed.data;

  const doc = await prisma.documentLink.create({
    data: {
      clientId: data.clientId,
      matterId: data.matterId || null,
      title: data.title,
      url: data.url,
      referenceType: data.referenceType,
      provider: data.provider,
      providerLabel: data.providerLabel,
      sensitivity: data.sensitivity,
      notes: data.notes || null,
      ...auditOnCreate(user.id),
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.DOCUMENT_LINK,
    entityId: doc.id,
    action: ActivityAction.CREATE,
    summary: t("documents.activity.created", { name: doc.title }),
    metadata: documentReferenceActivityMeta(doc),
  });

  revalidatePath("/documents");
  redirect(`/documents/${doc.id}`);
}

export async function updateDocumentAction(
  documentId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const documentSchema = createDocumentSchema((k) => t(`documents.${k}`));

  if (!canWrite(user)) return formError(t("documents.error.noPermissionEdit"));

  const settings = await getFirmSettings();
  if (
    settings.requireDocumentPermissionConfirm &&
    formData.get("permissionConfirmed") !== "on"
  ) {
    return formError(t("documents.validation.permissionConfirmRequired"));
  }

  const parsed = documentFromForm(formData, documentSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  try {
    await validateDocumentAccess(
      user,
      parsed.data.clientId,
      parsed.data.matterId,
      t
    );
  } catch (e) {
    return formError(
      e instanceof Error ? e.message : t("common.error.accessDenied")
    );
  }

  const tagIds = parseTagIds(formData);
  const data = parsed.data;

  await prisma.$transaction([
    prisma.documentTag.deleteMany({ where: { documentId } }),
    prisma.documentLink.update({
      where: { id: documentId },
      data: {
        clientId: data.clientId,
        matterId: data.matterId || null,
        title: data.title,
        url: data.url,
        referenceType: data.referenceType,
        provider: data.provider,
        providerLabel: data.providerLabel,
        sensitivity: data.sensitivity,
        notes: data.notes || null,
        ...auditOnUpdate(user.id),
        tags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    }),
  ]);

  const updated = await prisma.documentLink.findUniqueOrThrow({
    where: { id: documentId },
    select: {
      id: true,
      referenceType: true,
      provider: true,
      clientId: true,
      matterId: true,
      sensitivity: true,
    },
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.DOCUMENT_LINK,
    entityId: documentId,
    action: ActivityAction.UPDATE,
    summary: t("documents.activity.updated", { name: data.title }),
    metadata: documentReferenceActivityMeta(updated),
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  return { success: true };
}

export async function deleteDocumentAction(documentId: string): Promise<void> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);

  if (!canWrite(user))
    throw new Error(t("documents.error.noPermissionDelete"));

  const doc = await prisma.documentLink.findFirst({
    where: { id: documentId, ...notDeleted, ...documentWhereForUser(user) },
  });
  if (!doc) throw new Error(t("documents.error.notFoundOrDenied"));

  await prisma.documentLink.update({
    where: { id: documentId },
    data: softDeleteData(user.id),
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.DOCUMENT_LINK,
    entityId: documentId,
    action: ActivityAction.DELETE,
    summary: archivedSummary(t, t("documents.title"), doc.title),
    metadata: documentReferenceActivityMeta(doc),
  });

  revalidatePath("/documents");
  redirect("/documents");
}

export async function getDocumentsForUser() {
  const user = await requireSessionUser();
  return prisma.documentLink.findMany({
    where: documentWhereForUser(user),
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { id: true, displayName: true } },
      matter: { select: { id: true, title: true } },
      tags: { include: { tag: true } },
    },
  });
}
