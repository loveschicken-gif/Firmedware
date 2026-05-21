"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import { logSecuritySettingsUpdated } from "@/lib/security/events";
import { createSecuritySettingsSchema } from "@/lib/validations/security-settings";
import { formError, type ActionResult } from "./utils";

const SETTINGS_ID = "default";

export async function updateSecuritySettingsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const schema = createSecuritySettingsSchema((k) => t(`admin.security.${k}`));

  const parsed = schema.safeParse({
    confidentialityNoticeEnabled: formData.get("confidentialityNoticeEnabled"),
    requireDocumentPermissionConfirm: formData.get(
      "requireDocumentPermissionConfirm"
    ),
    failedLoginLockoutThreshold: formData.get("failedLoginLockoutThreshold"),
    failedLoginLockoutMinutes: formData.get("failedLoginLockoutMinutes"),
  });

  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  await prisma.firmSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...parsed.data },
    update: parsed.data,
  });

  await logSecuritySettingsUpdated(
    admin.id,
    t("admin.security.activity.settingsUpdated")
  );

  revalidatePath("/admin/security");
  revalidatePath("/", "layout");
  return { success: true };
}
