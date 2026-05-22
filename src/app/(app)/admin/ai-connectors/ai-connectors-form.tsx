"use client";

import { useActionState } from "react";
import type { FirmSettings } from "@prisma/client";
import { updateAIConnectorSettingsAction } from "@/lib/actions/ai-connectors";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n/client";
import { AI_CONNECTOR_MODES, AI_CONNECTOR_PROVIDERS } from "@/lib/ai/types";

export function AIConnectorsForm({ settings }: { settings: FirmSettings }) {
  const t = useTranslations("admin");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateAIConnectorSettingsAction,
    null
  );

  const storedProvider = settings.aiConnectorProvider ?? "";
  const isKnownProvider = AI_CONNECTOR_PROVIDERS.includes(
    storedProvider as (typeof AI_CONNECTOR_PROVIDERS)[number]
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">{t("aiConnectors.warningTitle")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t("aiConnectors.warningDisabled")}</li>
          <li>{t("aiConnectors.warningNoKeys")}</li>
          <li>{t("aiConnectors.warningNoCalls")}</li>
          <li>{t("aiConnectors.warningConfidential")}</li>
          <li>{t("aiConnectors.warningLinks")}</li>
        </ul>
      </div>

      <form
        action={formAction}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="enableAIConnectors"
            defaultChecked={settings.enableAIConnectors}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="text-sm font-medium">
              {t("aiConnectors.enableLabel")}
            </span>
            <span className="block text-xs text-slate-500">
              {t("aiConnectors.enableHint")}
            </span>
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="aiConnectorMode">{t("aiConnectors.modeLabel")}</Label>
          <select
            id="aiConnectorMode"
            name="aiConnectorMode"
            defaultValue={settings.aiConnectorMode}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            {AI_CONNECTOR_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{t("aiConnectors.modeHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiConnectorProvider">
            {t("aiConnectors.providerLabel")}
          </Label>
          <select
            id="aiConnectorProvider"
            name="aiConnectorProvider"
            defaultValue={isKnownProvider ? storedProvider : "OTHER"}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">{t("aiConnectors.providerNone")}</option>
            {AI_CONNECTOR_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            {t("aiConnectors.providerHint")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherProviderLabel">
            {t("aiConnectors.otherLabel")}
          </Label>
          <Input
            id="otherProviderLabel"
            name="otherProviderLabel"
            defaultValue={!isKnownProvider ? storedProvider : ""}
            placeholder={t("aiConnectors.otherPlaceholder")}
          />
        </div>

        {state?.success && (
          <p className="text-sm text-green-700">{t("aiConnectors.saved")}</p>
        )}
        {state && !state.success && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <SubmitButton label={t("aiConnectors.save")} />
      </form>
    </div>
  );
}
