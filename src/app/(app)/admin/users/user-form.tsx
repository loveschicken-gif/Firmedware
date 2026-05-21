"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createUserAction, updateUserAction } from "@/lib/actions/users";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import type { User } from "@prisma/client";

export function UserForm({ user }: { user?: User }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const isEdit = !!user;
  const action = isEdit ? updateUserAction.bind(null, user.id) : createUserAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t("users.form.name")}</Label>
        <Input id="name" name="name" required defaultValue={user?.name} />
      </div>
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="email">{tc("email")}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="role">{t("users.form.role")}</Label>
        <Select id="role" name="role" defaultValue={user?.role ?? "STAFF"}>
          <option value="ADMIN">{t("users.form.roleAdmin")}</option>
          <option value="LAWYER">{t("users.form.roleLawyer")}</option>
          <option value="STAFF">{t("users.form.roleStaff")}</option>
          <option value="VIEWER">{t("users.form.roleViewer")}</option>
        </Select>
      </div>
      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="active">{tc("status")}</Label>
          <Select id="active" name="active" defaultValue={user.active ? "true" : "false"}>
            <option value="true">{tc("active")}</option>
            <option value="false">{tc("inactive")}</option>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="password">
          {isEdit ? t("users.form.passwordEdit") : t("users.form.password")}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required={!isEdit}
          minLength={8}
        />
      </div>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{tc("savedSuccessfully")}</p>
      )}
      <div className="flex gap-3">
        <SubmitButton
          label={isEdit ? t("users.form.save") : t("users.form.create")}
          pendingLabel={tc("saving")}
        />
        <Button variant="outline" asChild>
          <Link href="/admin/users">{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
