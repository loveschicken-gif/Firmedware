"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { ActivityAction, EntityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import type { Translator } from "@/lib/i18n/messages";
import { isBillingEnabled, requireBillingEnabled } from "@/lib/billing";
import {
  billingWhereForUser,
  canAccessBillingRecord,
  canAccessClient,
  canAccessMatter,
  canWrite,
  clientWhereForUser,
  isAdmin,
  matterWhereForUser,
} from "@/lib/rbac";
import type { SessionUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { createBillingSchema } from "@/lib/validations/billing";
import {
  archivedSummary,
  auditOnCreate,
  auditOnUpdate,
  notDeleted,
  softDeleteData,
} from "@/lib/soft-delete";
import { formError, type ActionResult } from "./utils";

type BillingSchema = ReturnType<typeof createBillingSchema>;

function billingFromForm(formData: FormData, schema: BillingSchema) {
  const matterId = formData.get("matterId");
  return schema.safeParse({
    clientId: formData.get("clientId"),
    matterId: matterId && matterId !== "" ? matterId : undefined,
    invoiceNumber: formData.get("invoiceNumber") || undefined,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
    currency: formData.get("currency") || "THB",
    issueDate: formData.get("issueDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    paidAt: formData.get("paidAt") || undefined,
    status: formData.get("status"),
    externalLink: formData.get("externalLink") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

function parseOptionalDate(value: string | undefined) {
  if (!value || value.trim() === "") return null;
  return new Date(value);
}

async function validateBillingAccess(
  user: SessionUser,
  clientId: string,
  matterId: string | undefined,
  t: Translator
) {
  if (user.role === "ADMIN") return;
  if (matterId) {
    if (!(await canAccessMatter(user, matterId)))
      throw new Error(t("billing.error.matterNotFound"));
  } else if (!(await canAccessClient(user, clientId))) {
    throw new Error(t("billing.error.clientNotFound"));
  }
}

function billingDataFromParsed(
  data: z.infer<BillingSchema>,
  userId: string,
  audit: ReturnType<typeof auditOnCreate> | ReturnType<typeof auditOnUpdate>
) {
  return {
    clientId: data.clientId,
    matterId: data.matterId || null,
    invoiceNumber: data.invoiceNumber?.trim() || null,
    title: data.title,
    description: data.description?.trim() || null,
    amount: new Prisma.Decimal(data.amount),
    currency: data.currency.trim().toUpperCase(),
    issueDate: parseOptionalDate(data.issueDate),
    dueDate: parseOptionalDate(data.dueDate),
    paidAt: parseOptionalDate(data.paidAt),
    status: data.status,
    externalLink: data.externalLink || null,
    notes: data.notes?.trim() || null,
    ...audit,
  };
}

export async function createBillingAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireBillingEnabled();
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const billingSchema = createBillingSchema((k) => t(`billing.${k}`));

  if (!canWrite(user)) return formError(t("billing.error.noPermissionCreate"));

  const parsed = billingFromForm(formData, billingSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  try {
    await validateBillingAccess(
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

  const record = await prisma.billingRecord.create({
    data: billingDataFromParsed(parsed.data, user.id, auditOnCreate(user.id)),
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.BILLING_RECORD,
    entityId: record.id,
    action: ActivityAction.CREATE,
    summary: t("billing.activity.created", { name: record.title }),
  });

  revalidatePath("/billing");
  redirect(`/billing/${record.id}`);
}

export async function updateBillingAction(
  billingId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireBillingEnabled();
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const billingSchema = createBillingSchema((k) => t(`billing.${k}`));

  if (!canWrite(user)) return formError(t("billing.error.noPermissionEdit"));
  if (!(await canAccessBillingRecord(user, billingId)))
    return formError(t("billing.error.notFoundOrDenied"));

  const existing = await prisma.billingRecord.findFirst({
    where: { id: billingId, ...notDeleted, ...billingWhereForUser(user) },
    select: { status: true, title: true },
  });
  if (!existing) return formError(t("billing.error.notFound"));

  const parsed = billingFromForm(formData, billingSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  try {
    await validateBillingAccess(
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

  const data = billingDataFromParsed(parsed.data, user.id, auditOnUpdate(user.id));

  await prisma.billingRecord.update({
    where: { id: billingId },
    data,
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.BILLING_RECORD,
    entityId: billingId,
    action: ActivityAction.UPDATE,
    summary: t("billing.activity.updated", { name: parsed.data.title }),
  });

  if (existing.status !== parsed.data.status) {
    await logActivity({
      userId: user.id,
      entityType: EntityType.BILLING_RECORD,
      entityId: billingId,
      action: ActivityAction.UPDATE,
      summary: t("billing.activity.statusChanged", {
        name: parsed.data.title,
        from: existing.status,
        to: parsed.data.status,
      }),
      metadata: {
        previousStatus: existing.status,
        newStatus: parsed.data.status,
      },
    });
  }

  revalidatePath(`/billing/${billingId}`);
  revalidatePath("/billing");
  return { success: true };
}

export async function deleteBillingAction(billingId: string): Promise<void> {
  await requireBillingEnabled();
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);

  if (!isAdmin(user))
    throw new Error(t("billing.error.noPermissionDelete"));

  const record = await prisma.billingRecord.findFirst({
    where: { id: billingId, ...notDeleted },
  });
  if (!record) throw new Error(t("billing.error.notFound"));

  await prisma.billingRecord.update({
    where: { id: billingId },
    data: softDeleteData(user.id),
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.BILLING_RECORD,
    entityId: billingId,
    action: ActivityAction.DELETE,
    summary: archivedSummary(t, t("billing.entityLabel"), record.title),
  });

  revalidatePath("/billing");
  redirect("/billing");
}

export async function getBillingRecordsForUser() {
  await requireBillingEnabled();
  const user = await requireSessionUser();
  return prisma.billingRecord.findMany({
    where: billingWhereForUser(user),
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { id: true, displayName: true } },
      matter: { select: { id: true, title: true } },
    },
  });
}

export async function getBillingForClient(clientId: string, limit = 20) {
  const user = await requireSessionUser();
  if (!(await isBillingEnabled())) return [];
  return prisma.billingRecord.findMany({
    where: {
      clientId,
      ...billingWhereForUser(user),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      matter: { select: { id: true, title: true } },
    },
  });
}

export async function getBillingForMatter(matterId: string, limit = 20) {
  const user = await requireSessionUser();
  if (!(await isBillingEnabled())) return [];
  return prisma.billingRecord.findMany({
    where: {
      matterId,
      ...billingWhereForUser(user),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getBillingDashboardStats(user: SessionUser) {
  const where = billingWhereForUser(user);
  const [outstanding, overdue, paidThisMonth] = await Promise.all([
    prisma.billingRecord.count({
      where: {
        ...where,
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),
    prisma.billingRecord.count({
      where: { ...where, status: "OVERDUE" },
    }),
    prisma.billingRecord.count({
      where: {
        ...where,
        status: "PAID",
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);
  return { outstanding, overdue, paidThisMonth };
}

export async function logBillingExternalLinkAction(
  billingId: string,
  title: string
) {
  await requireBillingEnabled();
  const user = await requireSessionUser();
  if (!(await canAccessBillingRecord(user, billingId))) return;

  const { logBillingExternalLinkOpened } = await import("@/lib/security/events");
  await logBillingExternalLinkOpened(user.id, billingId, title);
}

export async function getClientsForBillingForm() {
  const user = await requireSessionUser();
  return prisma.client.findMany({
    where: clientWhereForUser(user),
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });
}

export async function getMattersForBillingForm() {
  const user = await requireSessionUser();
  return prisma.matter.findMany({
    where: matterWhereForUser(user),
    orderBy: { title: "asc" },
    select: { id: true, title: true, clientId: true },
  });
}
