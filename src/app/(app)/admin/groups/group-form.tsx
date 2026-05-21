"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createGroupAction, updateGroupAction } from "@/lib/actions/groups";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslate, useTranslations } from "@/lib/i18n/client";
import { roleLabel } from "@/lib/i18n/enums";
import type { User, UserGroup } from "@prisma/client";

type GroupWithMembers = UserGroup & {
  members: { userId: string }[];
};

export function GroupForm({
  group,
  users,
}: {
  group?: GroupWithMembers;
  users: Pick<User, "id" | "name" | "role">[];
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const translate = useTranslate();
  const isEdit = !!group;
  const action = isEdit
    ? updateGroupAction.bind(null, group.id)
    : createGroupAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t("groups.form.name")}</Label>
        <Input id="name" name="name" required defaultValue={group?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("groups.form.description")}</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={group?.description ?? ""}
        />
      </div>
      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="active">{tc("status")}</Label>
          <Select id="active" name="active" defaultValue={group.active ? "true" : "false"}>
            <option value="true">{tc("active")}</option>
            <option value="false">{tc("inactive")}</option>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">{t("groups.form.members")}</p>
        <div className="flex flex-wrap gap-3">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="memberIds"
                value={u.id}
                defaultChecked={group?.members.some((m) => m.userId === u.id)}
              />
              {u.name} ({roleLabel(translate, u.role)})
            </label>
          ))}
        </div>
      </div>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{tc("savedSuccessfully")}</p>
      )}
      <div className="flex gap-3">
        <SubmitButton
          label={isEdit ? t("groups.form.save") : t("groups.form.create")}
          pendingLabel={tc("saving")}
        />
        <Button variant="outline" asChild>
          <Link href="/admin/groups">{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
