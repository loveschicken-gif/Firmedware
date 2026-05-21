"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActivityAction, EntityType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import { auditOnCreate, auditOnUpdate, notDeleted } from "@/lib/soft-delete";
import { formError, type ActionResult } from "./utils";

function createGroupSchema(msg: (key: string) => string) {
  return z.object({
    name: z.string().min(1, msg("validation.groupNameRequired")),
    description: z.string().optional(),
    active: z.boolean(),
  });
}

function parseMemberIds(formData: FormData): string[] {
  const raw = formData.getAll("memberIds");
  return raw.filter((v): v is string => typeof v === "string" && v.length > 0);
}

async function syncMembers(groupId: string, memberIds: string[]) {
  await prisma.userGroupMember.deleteMany({ where: { groupId } });
  if (memberIds.length) {
    await prisma.userGroupMember.createMany({
      data: memberIds.map((userId) => ({ groupId, userId })),
    });
  }
}

export async function createGroupAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const groupSchema = createGroupSchema((k) => t(`admin.${k}`));

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    active: formData.get("active") !== "false",
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const memberIds = parseMemberIds(formData);

  try {
    const group = await prisma.userGroup.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        active: parsed.data.active,
        ...auditOnCreate(admin.id),
      },
    });
    await syncMembers(group.id, memberIds);

    await logActivity({
      userId: admin.id,
      entityType: EntityType.USER_GROUP,
      entityId: group.id,
      action: ActivityAction.CREATE,
      summary: t("admin.activity.groupCreated", { name: group.name }),
    });

    revalidatePath("/admin/groups");
    redirect("/admin/groups");
  } catch {
    return formError(t("admin.error.groupNameExists"));
  }
}

export async function updateGroupAction(
  groupId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const groupSchema = createGroupSchema((k) => t(`admin.${k}`));

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    active: formData.get("active") === "true",
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const memberIds = parseMemberIds(formData);

  try {
    const group = await prisma.userGroup.update({
      where: { id: groupId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        active: parsed.data.active,
        ...auditOnUpdate(admin.id),
      },
    });
    await syncMembers(groupId, memberIds);

    await logActivity({
      userId: admin.id,
      entityType: EntityType.USER_GROUP,
      entityId: groupId,
      action: ActivityAction.UPDATE,
      summary: t("admin.activity.groupUpdated", { name: group.name }),
    });

    revalidatePath("/admin/groups");
    return { success: true };
  } catch {
    return formError(t("admin.error.groupNameExists"));
  }
}

export async function getGroupsForAdmin() {
  await requireAdmin();
  return prisma.userGroup.findMany({
    where: notDeleted,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true, matterLinks: true } },
    },
  });
}
