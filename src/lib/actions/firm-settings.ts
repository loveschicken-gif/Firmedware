"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import { createFirmSettingsSchema } from "@/lib/validations/firm-settings";
import { formError, type ActionResult } from "./utils";

const SETTINGS_ID = "default";

export async function updateFirmSettingsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);
  const schema = createFirmSettingsSchema((k) => t(`admin.${k}`));

  const parsed = schema.safeParse({
    firmName: formData.get("firmName"),
    timezone: formData.get("timezone"),
    defaultLanguage: formData.get("defaultLanguage"),
    enableEntityNotes: formData.get("enableEntityNotes"),
    enableComments: formData.get("enableComments"),
    enableBilling: formData.get("enableBilling"),
  });
  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ?? t("common.validation.invalidInput")
    );
  }

  await prisma.firmSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      firmName: parsed.data.firmName,
      timezone: parsed.data.timezone,
      defaultLanguage: parsed.data.defaultLanguage,
      enableEntityNotes: parsed.data.enableEntityNotes,
      enableComments: parsed.data.enableComments,
      enableBilling: parsed.data.enableBilling,
    },
    update: {
      firmName: parsed.data.firmName,
      timezone: parsed.data.timezone,
      defaultLanguage: parsed.data.defaultLanguage,
      enableEntityNotes: parsed.data.enableEntityNotes,
      enableComments: parsed.data.enableComments,
      enableBilling: parsed.data.enableBilling,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/account");
  return { success: true };
}
