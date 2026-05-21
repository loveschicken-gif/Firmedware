"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActivityAction, ActivityCategory, EntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import { createWorkflowStatusSchema } from "@/lib/validations/workflow-status";
import { formError, type ActionResult } from "./utils";

function parseForm(formData: FormData) {
  return {
    entityType: formData.get("entityType"),
    name: formData.get("name"),
    labelEn: formData.get("labelEn"),
    labelTh: formData.get("labelTh") || undefined,
    color: formData.get("color") || undefined,
    sortOrder: formData.get("sortOrder"),
    isDefault: formData.get("isDefault"),
    isFinal: formData.get("isFinal"),
    active: formData.get("active"),
  };
}

async function clearOtherDefaults(
  entityType: string,
  excludeId?: string
) {
  await prisma.workflowStatus.updateMany({
    where: {
      entityType: entityType as "MATTER",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function createWorkflowStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const schema = createWorkflowStatusSchema((k) => t(`admin.workflow.${k}`));
  const parsed = schema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const data = parsed.data;
  if (data.isDefault) await clearOtherDefaults(data.entityType);

  const status = await prisma.workflowStatus.create({ data });

  await logActivity({
    userId: admin.id,
    entityType: EntityType.MATTER,
    entityId: status.id,
    category: ActivityCategory.ADMIN,
    action: ActivityAction.CREATE,
    summary: t("admin.workflow.activity.created", { name: data.labelEn }),
  });

  revalidatePath("/admin/workflow-statuses");
  redirect("/admin/workflow-statuses");
}

export async function updateWorkflowStatusAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const schema = createWorkflowStatusSchema((k) => t(`admin.workflow.${k}`));
  const parsed = schema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const data = parsed.data;
  if (data.isDefault) await clearOtherDefaults(data.entityType, id);

  await prisma.workflowStatus.update({
    where: { id },
    data: {
      entityType: data.entityType,
      name: data.name,
      labelEn: data.labelEn,
      labelTh: data.labelTh || null,
      color: data.color || null,
      sortOrder: data.sortOrder,
      isDefault: data.isDefault,
      isFinal: data.isFinal,
      active: data.active,
    },
  });

  await logActivity({
    userId: admin.id,
    entityType: EntityType.MATTER,
    entityId: id,
    category: ActivityCategory.ADMIN,
    action: ActivityAction.UPDATE,
    summary: t("admin.workflow.activity.updated", { name: data.labelEn }),
  });

  revalidatePath("/admin/workflow-statuses");
  return { success: true };
}

export async function deactivateWorkflowStatusAction(id: string) {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const status = await prisma.workflowStatus.update({
    where: { id },
    data: { active: false, isDefault: false },
  });

  await logActivity({
    userId: admin.id,
    entityType: EntityType.MATTER,
    entityId: id,
    category: ActivityCategory.ADMIN,
    action: ActivityAction.UPDATE,
    summary: t("admin.workflow.activity.deactivated", {
      name: status.labelEn ?? status.name,
    }),
  });

  revalidatePath("/admin/workflow-statuses");
}
