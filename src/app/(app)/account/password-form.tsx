"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/account";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n/client";

export function PasswordForm() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    changePasswordAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{t("security.currentPassword")}</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t("security.newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("security.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
