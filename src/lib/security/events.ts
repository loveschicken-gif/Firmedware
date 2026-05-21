import {
  ActivityAction,
  ActivityCategory,
  DocumentReferenceType,
  DocumentProvider,
  DocumentSensitivity,
  EntityType,
  Prisma,
} from "@prisma/client";
import { logActivity } from "@/lib/activity";

const SETTINGS_ID = "default";

export type DocumentReferenceActivityMeta = {
  documentReferenceId: string;
  referenceType: DocumentReferenceType;
  provider: DocumentProvider;
  clientId: string;
  matterId: string | null;
  sensitivity: DocumentSensitivity;
};

export async function logPasswordChanged(
  userId: string,
  summary: string
) {
  await logActivity({
    userId,
    entityType: EntityType.USER,
    entityId: userId,
    category: ActivityCategory.SECURITY,
    action: ActivityAction.UPDATE,
    summary,
  });
}

export async function logUserDeactivated(
  adminId: string,
  targetUserId: string,
  summary: string
) {
  await logActivity({
    userId: adminId,
    entityType: EntityType.USER,
    entityId: targetUserId,
    category: ActivityCategory.SECURITY,
    action: ActivityAction.UPDATE,
    summary,
  });
}

export async function logRoleChanged(
  adminId: string,
  targetUserId: string,
  summary: string,
  metadata: Prisma.InputJsonValue
) {
  await logActivity({
    userId: adminId,
    entityType: EntityType.USER,
    entityId: targetUserId,
    category: ActivityCategory.SECURITY,
    action: ActivityAction.UPDATE,
    summary,
    metadata,
  });
}

export async function logSecuritySettingsUpdated(
  adminId: string,
  summary: string
) {
  await logActivity({
    userId: adminId,
    entityType: EntityType.FIRM_SETTINGS,
    entityId: SETTINGS_ID,
    category: ActivityCategory.SECURITY,
    action: ActivityAction.UPDATE,
    summary,
  });
}

export async function logDocumentReferenceOpened(
  userId: string,
  meta: DocumentReferenceActivityMeta,
  title: string
) {
  await logActivity({
    userId,
    entityType: EntityType.DOCUMENT_LINK,
    entityId: meta.documentReferenceId,
    category: ActivityCategory.DOCUMENT,
    action: ActivityAction.VIEW,
    summary: `Opened external document reference "${title}"`,
    metadata: meta as unknown as Prisma.InputJsonValue,
  });
}

/** @deprecated Use logDocumentReferenceOpened */
export async function logDocumentLinkOpened(
  userId: string,
  documentId: string,
  title: string
) {
  await logDocumentReferenceOpened(userId, {
    documentReferenceId: documentId,
    referenceType: "EXTERNAL_URL",
    provider: "OTHER",
    clientId: "",
    matterId: null,
    sensitivity: "NORMAL",
  }, title);
}

export async function logDocumentReferenceCopied(
  userId: string,
  meta: DocumentReferenceActivityMeta,
  summary: string
) {
  await logActivity({
    userId,
    entityType: EntityType.DOCUMENT_LINK,
    entityId: meta.documentReferenceId,
    category: ActivityCategory.DOCUMENT,
    action: ActivityAction.VIEW,
    summary,
    metadata: meta as unknown as Prisma.InputJsonValue,
  });
}

export async function logBillingExternalLinkOpened(
  userId: string,
  billingId: string,
  title: string
) {
  await logActivity({
    userId,
    entityType: EntityType.BILLING_RECORD,
    entityId: billingId,
    category: ActivityCategory.DOCUMENT,
    action: ActivityAction.VIEW,
    summary: `Opened external invoice link "${title}"`,
  });
}

export async function logActivityExported(
  userId: string,
  summary: string,
  metadata?: Prisma.InputJsonValue
) {
  await logActivity({
    userId,
    entityType: EntityType.USER,
    entityId: userId,
    category: ActivityCategory.SECURITY,
    action: ActivityAction.VIEW,
    summary,
    metadata,
  });
}
