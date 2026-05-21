"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AI_CONNECTOR_MODES, AI_CONNECTOR_PROVIDERS } from "@/lib/ai/types";
import { getServerI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import { formError, type ActionResult } from "./utils";

const SETTINGS_ID = "default";

function parseCheckbox(value: unknown) {
  return value === "on" || value === "true";
}

export async function updateAIConnectorSettingsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { t } = await getServerI18n(admin.id);

  const schema = z.object({
    enableAIConnectors: z.preprocess(parseCheckbox, z.boolean()),
    aiConnectorMode: z.enum(AI_CONNECTOR_MODES),
    aiConnectorProvider: z
      .string()
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    otherProviderLabel: z.string().max(120).optional(),
  });

  const parsed = schema.safeParse({
    enableAIConnectors: formData.get("enableAIConnectors"),
    aiConnectorMode: formData.get("aiConnectorMode"),
    aiConnectorProvider: formData.get("aiConnectorProvider") ?? "",
    otherProviderLabel: formData.get("otherProviderLabel") ?? undefined,
  });

  if (!parsed.success) {
    return formError(
      parsed.error.issues[0]?.message ??
        t("common.validation.invalidInput")
    );
  }

  const { enableAIConnectors, aiConnectorMode, aiConnectorProvider, otherProviderLabel } =
    parsed.data;

  let providerValue: string | null = aiConnectorProvider;
  if (aiConnectorProvider === "OTHER") {
    providerValue = otherProviderLabel?.trim() || null;
  }

  await prisma.firmSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      enableAIConnectors,
      aiConnectorMode: enableAIConnectors ? aiConnectorMode : "DISABLED",
      aiConnectorProvider: providerValue,
    },
    update: {
      enableAIConnectors,
      aiConnectorMode: enableAIConnectors ? aiConnectorMode : "DISABLED",
      aiConnectorProvider: providerValue,
    },
  });

  revalidatePath("/admin/ai-connectors");
  revalidatePath("/admin/settings");
  return { success: true };
}
