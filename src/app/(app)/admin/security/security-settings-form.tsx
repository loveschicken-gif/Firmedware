"use client";

import { useActionState } from "react";
import type { FirmSettings } from "@prisma/client";
import { updateSecuritySettingsAction } from "@/lib/actions/security-settings";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n/client";

export function SecuritySettingsForm({
  settings,
}: {
  settings: FirmSettings;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateSecuritySettingsAction,
    null
  );

  return (
    <form
      action={formAction}
      className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="confidentialityNoticeEnabled"
          defaultChecked={settings.confidentialityNoticeEnabled}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          <span className="text-sm font-medium">{t("security.confidentialityNotice")}</span>
          <span className="block text-xs text-slate-500">
            {t("security.confidentialityNoticeHint")}
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="requireDocumentPermissionConfirm"
          defaultChecked={settings.requireDocumentPermissionConfirm}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          <span className="text-sm font-medium">{t("security.requirePermissionConfirm")}</span>
          <span className="block text-xs text-slate-500">
            {t("security.requirePermissionConfirmHint")}
          </span>
        </span>
      </label>
      <div className="space-y-2">
        <Label htmlFor="failedLoginLockoutThreshold">
          {t("security.lockoutThreshold")}
        </Label>
        <Input
          id="failedLoginLockoutThreshold"
          name="failedLoginLockoutThreshold"
          type="number"
          min={1}
          max={50}
          required
          defaultValue={settings.failedLoginLockoutThreshold}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="failedLoginLockoutMinutes">
          {t("security.lockoutMinutes")}
        </Label>
        <Input
          id="failedLoginLockoutMinutes"
          name="failedLoginLockoutMinutes"
          type="number"
          min={1}
          max={1440}
          required
          defaultValue={settings.failedLoginLockoutMinutes}
        />
      </div>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{t("security.saved")}</p>
      )}
      <SubmitButton label={t("security.save")} pendingLabel={tc("saving")} />
    </form>
  );
}
