"use client";

import { useActionState } from "react";
import type { FirmSettings } from "@prisma/client";
import { updateFirmSettingsAction } from "@/lib/actions/firm-settings";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/lib/i18n/client";

const COMMON_TIMEZONES = [
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

export function FirmSettingsForm({ settings }: { settings: FirmSettings }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateFirmSettingsAction,
    null
  );

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="firmName">{t("settings.firmName")}</Label>
        <Input
          id="firmName"
          name="firmName"
          required
          defaultValue={settings.firmName}
        />
        <p className="text-xs text-slate-500">{t("settings.firmNameHint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">{t("settings.timezone")}</Label>
        <Input
          id="timezone"
          name="timezone"
          list="timezone-options"
          required
          defaultValue={settings.timezone}
        />
        <datalist id="timezone-options">
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
        <p className="text-xs text-slate-500">{t("settings.timezoneHint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultLanguage">{t("settings.defaultLanguage")}</Label>
        <Select
          id="defaultLanguage"
          name="defaultLanguage"
          defaultValue={settings.defaultLanguage}
        >
          <option value="th">{tc("language.th")}</option>
          <option value="en">{tc("language.en")}</option>
        </Select>
        <p className="text-xs text-slate-500">
          {t("settings.defaultLanguageHint")}
        </p>
      </div>
      <fieldset className="space-y-3 rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-900">
          {t("settings.featuresTitle")}
        </legend>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="enableEntityNotes"
            defaultChecked={settings.enableEntityNotes}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="text-sm font-medium text-slate-900">
              {t("settings.enableEntityNotes")}
            </span>
            <span className="block text-xs text-slate-500">
              {t("settings.enableEntityNotesHint")}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="enableComments"
            defaultChecked={settings.enableComments}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="text-sm font-medium text-slate-900">
              {t("settings.enableComments")}
            </span>
            <span className="block text-xs text-slate-500">
              {t("settings.enableCommentsHint")}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="enableBilling"
            defaultChecked={settings.enableBilling}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="text-sm font-medium text-slate-900">
              {t("settings.enableBilling")}
            </span>
            <span className="block text-xs text-slate-500">
              {t("settings.enableBillingHint")}
            </span>
          </span>
        </label>
      </fieldset>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{t("settings.saved")}</p>
      )}
      <SubmitButton label={t("settings.save")} />
    </form>
  );
}
