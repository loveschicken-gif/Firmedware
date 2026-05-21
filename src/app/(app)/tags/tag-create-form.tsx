"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n/client";

export function TagCreateForm({
  action,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
}) {
  const t = useTranslations("admin");
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="space-y-1">
        <Label htmlFor="name">{t("tags.form.name")}</Label>
        <Input id="name" name="name" required placeholder={t("tags.form.namePlaceholder")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="color">{t("tags.form.color")}</Label>
        <Input id="color" name="color" placeholder={t("tags.form.colorPlaceholder")} />
      </div>
      <SubmitButton label={t("tags.add")} />
      {state && !state.success && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="w-full text-sm text-emerald-600">{t("tags.created")}</p>
      )}
    </form>
  );
}
