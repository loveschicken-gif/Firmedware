"use client";

import { useActionState } from "react";
import type { User } from "@prisma/client";
import { updateProfileAction } from "@/lib/actions/account";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTranslations } from "@/lib/i18n/client";

export function ProfileForm({ user }: { user: Pick<User, "email" | "name" | "preferredLanguage"> }) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateProfileAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("profile.email")}</Label>
        <Input id="email" value={user.email} disabled readOnly className="bg-slate-50" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">{t("profile.name")}</Label>
        <Input id="name" name="name" required defaultValue={user.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferredLanguage">{t("profile.preferredLanguage")}</Label>
        <Select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue={user.preferredLanguage}
        >
          <option value="th">{tc("language.th")}</option>
          <option value="en">{tc("language.en")}</option>
        </Select>
      </div>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{t("profile.saved")}</p>
      )}
      <SubmitButton label={t("profile.save")} pendingLabel={tc("saving")} />
    </form>
  );
}
