"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActivityAction, EntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import { canAccessClient, canWrite, clientWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { createClientSchema } from "@/lib/validations/client";
import { parseTagIds } from "@/lib/validations/common";
import {
  archivedSummary,
  auditOnCreate,
  auditOnUpdate,
  notDeleted,
  softDeleteData,
} from "@/lib/soft-delete";
import { formError, type ActionResult } from "./utils";

export async function createClientAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const clientSchema = createClientSchema(
    (k) => t(`clients.${k}`),
    (k) => t(`common.${k}`)
  );

  if (!canWrite(user)) return formError(t("clients.error.noPermissionCreate"));

  const parsed = clientSchema.safeParse({
    displayName: formData.get("displayName"),
    companyName: formData.get("companyName") || undefined,
    clientType: formData.get("clientType"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const tagIds = parseTagIds(formData);
  const data = parsed.data;

  const client = await prisma.client.create({
    data: {
      ...data,
      ...auditOnCreate(user.id),
      companyName: data.companyName || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.CLIENT,
    entityId: client.id,
    action: ActivityAction.CREATE,
    summary: t("clients.activity.created", { name: client.displayName }),
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const clientSchema = createClientSchema(
    (k) => t(`clients.${k}`),
    (k) => t(`common.${k}`)
  );

  if (!canWrite(user)) return formError(t("clients.error.noPermissionEdit"));
  if (!(await canAccessClient(user, clientId)) && user.role !== "ADMIN") {
    return formError(t("clients.error.notFoundOrDenied"));
  }

  const parsed = clientSchema.safeParse({
    displayName: formData.get("displayName"),
    companyName: formData.get("companyName") || undefined,
    clientType: formData.get("clientType"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const tagIds = parseTagIds(formData);
  const data = parsed.data;

  await prisma.$transaction([
    prisma.clientTag.deleteMany({ where: { clientId } }),
    prisma.client.update({
      where: { id: clientId },
      data: {
        ...data,
        ...auditOnUpdate(user.id),
        companyName: data.companyName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        tags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    }),
  ]);

  await logActivity({
    userId: user.id,
    entityType: EntityType.CLIENT,
    entityId: clientId,
    action: ActivityAction.UPDATE,
    summary: t("clients.activity.updated", { name: data.displayName }),
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClientAction(clientId: string): Promise<void> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);

  if (!canWrite(user)) throw new Error(t("clients.error.noPermissionDelete"));
  if (!(await canAccessClient(user, clientId)) && user.role !== "ADMIN") {
    throw new Error(t("clients.error.notFoundOrDenied"));
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, ...notDeleted, ...clientWhereForUser(user) },
  });
  if (!client) throw new Error(t("clients.error.notFound"));

  await prisma.client.update({
    where: { id: clientId },
    data: softDeleteData(user.id),
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.CLIENT,
    entityId: clientId,
    action: ActivityAction.DELETE,
    summary: archivedSummary(t, t("common.client"), client.displayName),
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function getClientsForUser() {
  const user = await requireSessionUser();
  return prisma.client.findMany({
    where: clientWhereForUser(user),
    orderBy: { displayName: "asc" },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { matters: true } },
    },
  });
}
