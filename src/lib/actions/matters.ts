"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActivityAction, EntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import {
  canAccessMatter,
  canWrite,
  matterWhereForUser,
} from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { createMatterSchema } from "@/lib/validations/matter";
import {
  parseTagIds,
  parseAssigneeIds,
  parseGroupIds,
  parseGroupAssignments,
} from "@/lib/validations/common";
import {
  archivedSummary,
  auditOnCreate,
  auditOnUpdate,
  notDeleted,
  softDeleteData,
} from "@/lib/soft-delete";
import { groupWhereActive } from "@/lib/rbac";
import { legacyMatterStatusFromWorkflow } from "@/lib/workflow-labels";
import { resolveMatterStatusId } from "@/lib/workflow";
import { formError, type ActionResult } from "./utils";

type MatterSchema = ReturnType<typeof createMatterSchema>;

function matterFromForm(formData: FormData, schema: MatterSchema) {
  return schema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    caseNumber: formData.get("caseNumber") || undefined,
    statusId: formData.get("statusId"),
    notes: formData.get("notes") || undefined,
    openedAt: formData.get("openedAt") || undefined,
    closedAt: formData.get("closedAt") || undefined,
  });
}

async function syncAssignments(matterId: string, assigneeIds: string[]) {
  await prisma.matterAssignment.deleteMany({ where: { matterId } });
  if (assigneeIds.length) {
    await prisma.matterAssignment.createMany({
      data: assigneeIds.map((userId) => ({ matterId, userId })),
    });
  }
}

async function syncGroupAssignments(
  matterId: string,
  formData: FormData,
  groupIds: string[]
) {
  await prisma.matterGroupAssignment.deleteMany({ where: { matterId } });
  if (!groupIds.length) return;

  const groups = await prisma.userGroup.findMany({
    where: { id: { in: groupIds }, ...groupWhereActive() },
    select: { id: true, name: true },
  });
  const nameMap = new Map(groups.map((g) => [g.id, g.name]));
  const assignments = parseGroupAssignments(formData, groupIds, nameMap);

  await prisma.matterGroupAssignment.createMany({
    data: assignments.map((a) => ({
      matterId,
      groupId: a.groupId,
      label: a.label,
      directoryPath: a.directoryPath,
    })),
  });
}

export async function createMatterAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const matterSchema = createMatterSchema((k) => t(`matters.${k}`));

  if (!canWrite(user)) return formError(t("matters.error.noPermissionCreate"));

  const parsed = matterFromForm(formData, matterSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const tagIds = parseTagIds(formData);
  const assigneeIds = parseAssigneeIds(formData);
  const groupIds = parseGroupIds(formData);
  const data = parsed.data;

  // Creator is always assigned so they can see the matter (RBAC requires assignment for non-admins)
  const finalAssigneeIds = [...new Set([...assigneeIds, user.id])];

  const workflowStatus = await resolveMatterStatusId(data.statusId);
  if (!workflowStatus) {
    return formError(t("matters.error.invalidStatus"));
  }

  const matter = await prisma.matter.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      caseNumber: data.caseNumber || null,
      status: legacyMatterStatusFromWorkflow(workflowStatus),
      statusId: workflowStatus.id,
      notes: data.notes || null,
      openedAt: data.openedAt ? new Date(data.openedAt) : new Date(),
      closedAt: data.closedAt ? new Date(data.closedAt) : null,
      ...auditOnCreate(user.id),
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  await syncAssignments(matter.id, finalAssigneeIds);
  await syncGroupAssignments(matter.id, formData, groupIds);

  await logActivity({
    userId: user.id,
    entityType: EntityType.MATTER,
    entityId: matter.id,
    action: ActivityAction.CREATE,
    summary: t("matters.activity.created", { name: matter.title }),
  });

  revalidatePath("/matters");
  redirect(`/matters/${matter.id}`);
}

export async function updateMatterAction(
  matterId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const matterSchema = createMatterSchema((k) => t(`matters.${k}`));

  if (!canWrite(user)) return formError(t("matters.error.noPermissionEdit"));
  if (!(await canAccessMatter(user, matterId)))
    return formError(t("matters.error.notFoundOrDenied"));

  const parsed = matterFromForm(formData, matterSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const tagIds = parseTagIds(formData);
  const assigneeIds = parseAssigneeIds(formData);
  const groupIds = parseGroupIds(formData);
  const data = parsed.data;
  const workflowStatus = await resolveMatterStatusId(data.statusId);
  if (!workflowStatus) {
    return formError(t("matters.error.invalidStatus"));
  }

  await prisma.$transaction([
    prisma.matterTag.deleteMany({ where: { matterId } }),
    prisma.matter.update({
      where: { id: matterId },
      data: {
        clientId: data.clientId,
        title: data.title,
        caseNumber: data.caseNumber || null,
        status: legacyMatterStatusFromWorkflow(workflowStatus),
        statusId: workflowStatus.id,
        notes: data.notes || null,
        openedAt: data.openedAt ? new Date(data.openedAt) : undefined,
        closedAt: data.closedAt ? new Date(data.closedAt) : null,
        ...auditOnUpdate(user.id),
        tags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    }),
  ]);

  await syncAssignments(matterId, assigneeIds);
  await syncGroupAssignments(matterId, formData, groupIds);

  await logActivity({
    userId: user.id,
    entityType: EntityType.MATTER,
    entityId: matterId,
    action: ActivityAction.UPDATE,
    summary: t("matters.activity.updated", { name: data.title }),
  });

  revalidatePath(`/matters/${matterId}`);
  revalidatePath("/matters");
  return { success: true };
}

export async function deleteMatterAction(matterId: string): Promise<void> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);

  if (!canWrite(user)) throw new Error(t("matters.error.noPermissionDelete"));
  if (!(await canAccessMatter(user, matterId)))
    throw new Error(t("matters.error.notFoundOrDenied"));

  const matter = await prisma.matter.findFirst({
    where: { id: matterId, ...notDeleted, ...matterWhereForUser(user) },
  });
  if (!matter) throw new Error(t("matters.error.notFound"));

  await prisma.matter.update({
    where: { id: matterId },
    data: softDeleteData(user.id),
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.MATTER,
    entityId: matterId,
    action: ActivityAction.DELETE,
    summary: archivedSummary(t, t("common.matter"), matter.title),
  });

  revalidatePath("/matters");
  redirect("/matters");
}

export async function getMattersForUser() {
  const user = await requireSessionUser();
  return prisma.matter.findMany({
    where: matterWhereForUser(user),
    orderBy: { updatedAt: "desc" },
    include: {
      client: { select: { id: true, displayName: true } },
      workflowStatus: true,
      tags: { include: { tag: true } },
      assignments: { include: { user: { select: { id: true, name: true } } } },
      groupAssignments: {
        include: { group: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getActiveGroups() {
  await requireSessionUser();
  return prisma.userGroup.findMany({
    where: groupWhereActive(),
    orderBy: { name: "asc" },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}
