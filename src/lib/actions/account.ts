"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerI18n } from "@/lib/i18n/server";
import { requireSessionUser } from "@/lib/session";
import {
  createPasswordChangeSchema,
  createProfileUpdateSchema,
} from "@/lib/validations/account";
import { logPasswordChanged } from "@/lib/security/events";
import { formError, type ActionResult } from "./utils";

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const schema = createProfileUpdateSchema((k) => t(`account.${k}`));

  const parsed = schema.safeParse({
    name: formData.get("name"),
    preferredLanguage: formData.get("preferredLanguage"),
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      preferredLanguage: parsed.data.preferredLanguage,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/account");
  return { success: true };
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSessionUser();
  const { t } = await getServerI18n(user.id);
  const schema = createPasswordChangeSchema((k) => t(`account.${k}`));

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!dbUser) return formError(t("account.error.userNotFound"));

  const valid = await bcrypt.compare(
    parsed.data.currentPassword,
    dbUser.passwordHash
  );
  if (!valid) return formError(t("account.error.currentPasswordInvalid"));

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      failedLoginCount: 0,
    },
  });

  await logPasswordChanged(
    user.id,
    t("account.security.activity.passwordChanged")
  );

  revalidatePath("/account");
  return { success: true };
}
