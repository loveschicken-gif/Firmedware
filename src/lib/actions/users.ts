"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { ActivityAction, EntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  logPasswordChanged,
  logRoleChanged,
  logUserDeactivated,
} from "@/lib/security/events";
import { getServerI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import {
  createUserCreateSchema,
  createUserUpdateSchema,
} from "@/lib/validations/user";
import { formError, type ActionResult } from "./utils";

function preferredLanguageFromForm(formData: FormData) {
  const raw = formData.get("preferredLanguage");
  return raw && typeof raw === "string" && raw !== "" ? raw : undefined;
}

export async function createUserAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const userCreateSchema = createUserCreateSchema(
    (k) => t(`admin.${k}`),
    (k) => t(`common.${k}`)
  );

  const parsed = userCreateSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
    preferredLanguage: preferredLanguageFromForm(formData),
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return formError(t("admin.error.emailInUse"));

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
      ...(parsed.data.preferredLanguage
        ? { preferredLanguage: parsed.data.preferredLanguage }
        : {}),
    },
  });

  await logActivity({
    userId: admin.id,
    entityType: EntityType.USER,
    entityId: user.id,
    action: ActivityAction.CREATE,
    summary: t("admin.activity.userCreated", {
      name: user.name,
      role: user.role,
    }),
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAction(
  userId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const userUpdateSchema = createUserUpdateSchema(
    (k) => t(`admin.${k}`),
    (k) => t(`common.${k}`)
  );

  const parsed = userUpdateSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    active: formData.get("active") === "true",
    password: formData.get("password") || "",
    preferredLanguage: preferredLanguageFromForm(formData),
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const updateData: {
    name: string;
    role: typeof parsed.data.role;
    active: boolean;
    passwordHash?: string;
    preferredLanguage?: string;
  } = {
    name: parsed.data.name,
    role: parsed.data.role,
    active: parsed.data.active,
  };

  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }
  if (parsed.data.preferredLanguage) {
    updateData.preferredLanguage = parsed.data.preferredLanguage;
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, active: true, name: true },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      ...(parsed.data.password
        ? { passwordChangedAt: new Date(), failedLoginCount: 0 }
        : {}),
    },
  });

  await logActivity({
    userId: admin.id,
    entityType: EntityType.USER,
    entityId: userId,
    action: ActivityAction.UPDATE,
    summary: t("admin.activity.userUpdated", { name: user.name }),
  });

  if (before && !parsed.data.active && before.active) {
    await logUserDeactivated(
      admin.id,
      userId,
      t("admin.security.activity.userDeactivated", { name: user.name })
    );
  }
  if (before && parsed.data.role !== before.role) {
    await logRoleChanged(
      admin.id,
      userId,
      t("admin.security.activity.roleChanged", {
        name: user.name,
        from: before.role,
        to: parsed.data.role,
      }),
      { from: before.role, to: parsed.data.role }
    );
  }
  if (parsed.data.password) {
    await logPasswordChanged(
      admin.id,
      t("admin.security.activity.passwordReset", { name: user.name })
    );
  }

  revalidatePath("/admin/users");
  return { success: true };
}
