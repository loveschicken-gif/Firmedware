"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActivityAction, EntityType, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import { canWrite, taskWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { createTaskSchema } from "@/lib/validations/task";
import { resolveSprintWeekStart } from "@/lib/sprint";
import {
  archivedSummary,
  auditOnCreate,
  auditOnUpdate,
  notDeleted,
  softDeleteData,
} from "@/lib/soft-delete";
import { formError, type ActionResult } from "./utils";

type TaskSchema = ReturnType<typeof createTaskSchema>;

function taskFromForm(formData: FormData, schema: TaskSchema) {
  const clientId = formData.get("clientId");
  const matterId = formData.get("matterId");
  const assigneeId = formData.get("assigneeId");
  return schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    dueAt: formData.get("dueAt") || undefined,
    deadlineType: formData.get("deadlineType") || undefined,
    clientId: clientId && clientId !== "" ? clientId : undefined,
    matterId: matterId && matterId !== "" ? matterId : undefined,
    assigneeId: assigneeId && assigneeId !== "" ? assigneeId : undefined,
  });
}

function resolveTaskSprint(formData: FormData, dueAt: Date | null) {
  const sprintWeekInput = (formData.get("sprintWeekStart") as string) || "";
  const useAutoSprint = formData.get("useAutoSprint") === "true";
  if (useAutoSprint || !sprintWeekInput) {
    return resolveSprintWeekStart(dueAt ?? undefined, null, undefined);
  }
  return resolveSprintWeekStart(dueAt ?? undefined, null, sprintWeekInput);
}

export async function createTaskAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const taskSchema = createTaskSchema((k) => t(`tasks.${k}`));

  if (!canWrite(user)) return formError(t("tasks.error.noPermissionCreate"));

  const parsed = taskFromForm(formData, taskSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const data = parsed.data;
  const dueAt = data.dueAt ? new Date(data.dueAt) : null;
  const sprintWeekStart = resolveTaskSprint(formData, dueAt);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status,
      dueAt,
      deadlineType: data.deadlineType?.trim() || null,
      sprintWeekStart,
      clientId: data.clientId || null,
      matterId: data.matterId || null,
      assigneeId: data.assigneeId || null,
      ...auditOnCreate(user.id),
    },
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.TASK,
    entityId: task.id,
    action: ActivityAction.CREATE,
    summary: t("tasks.activity.created", { name: task.title }),
  });

  revalidatePath("/tasks");
  redirect(`/tasks/${task.id}`);
}

export async function updateTaskAction(
  taskId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const taskSchema = createTaskSchema((k) => t(`tasks.${k}`));

  if (!canWrite(user)) return formError(t("tasks.error.noPermissionEdit"));

  const parsed = taskFromForm(formData, taskSchema);
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const existing = await prisma.task.findFirst({
    where: { id: taskId, ...notDeleted, ...taskWhereForUser(user) },
  });
  if (!existing) return formError(t("tasks.error.notFoundOrDenied"));

  const data = parsed.data;
  const dueAt = data.dueAt ? new Date(data.dueAt) : null;
  const sprintWeekStart = resolveTaskSprint(formData, dueAt);

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status,
      dueAt,
      deadlineType: data.deadlineType?.trim() || null,
      sprintWeekStart,
      clientId: data.clientId || null,
      matterId: data.matterId || null,
      assigneeId: data.assigneeId || null,
      ...auditOnUpdate(user.id),
    },
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.TASK,
    entityId: taskId,
    action: ActivityAction.UPDATE,
    summary: t("tasks.activity.updated", { name: data.title }),
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);

  if (!canWrite(user)) throw new Error(t("tasks.error.noPermissionDelete"));

  const task = await prisma.task.findFirst({
    where: { id: taskId, ...notDeleted, ...taskWhereForUser(user) },
  });
  if (!task) throw new Error(t("tasks.error.notFoundOrDenied"));

  await prisma.task.update({
    where: { id: taskId },
    data: softDeleteData(user.id),
  });

  await logActivity({
    userId: user.id,
    entityType: EntityType.TASK,
    entityId: taskId,
    action: ActivityAction.DELETE,
    summary: archivedSummary(t, t("tasks.title"), task.title),
  });

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function getTasksForUser(filter?: string) {
  const user = await requireSessionUser();
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let extra: Record<string, unknown> = {};
  if (filter === "overdue") {
    extra = {
      dueAt: { lt: now },
      status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
    };
  } else if (filter === "week") {
    extra = {
      dueAt: { gte: now, lte: weekAhead },
      status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
    };
  }

  return prisma.task.findMany({
    where: { ...taskWhereForUser(user), ...extra },
    orderBy: [
      { sprintWeekStart: "asc" },
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      client: { select: { id: true, displayName: true } },
      matter: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
}
