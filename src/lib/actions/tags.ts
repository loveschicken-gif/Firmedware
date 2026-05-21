"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, EntityType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getServerI18n } from "@/lib/i18n/server";
import { requireAdmin, requireSessionUser } from "@/lib/session";
import { auditOnCreate } from "@/lib/soft-delete";
import { tagWhereActive } from "@/lib/rbac";
import { formError, type ActionResult } from "./utils";

function createTagSchema(msg: (key: string) => string) {
  return z.object({
    name: z.string().min(1, msg("error.invalidTagName")),
    color: z.string().optional(),
  });
}

export async function createTagAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const tagSchema = createTagSchema((k) => t(`admin.${k}`));

  const parsed = tagSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("admin.error.invalidTagName")
    );
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color || null,
        ...auditOnCreate(admin.id),
      },
    });
    await logActivity({
      userId: admin.id,
      entityType: EntityType.TAG,
      entityId: tag.id,
      action: ActivityAction.CREATE,
      summary: t("admin.activity.tagCreated", { name: tag.name }),
    });
    revalidatePath("/tags");
    return { success: true };
  } catch {
    return formError(t("admin.error.tagNameExists"));
  }
}

export async function getAllTags() {
  await requireSessionUser();
  return prisma.tag.findMany({
    where: tagWhereActive(),
    orderBy: { name: "asc" },
  });
}
