"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createMatterAction,
  updateMatterAction,
} from "@/lib/actions/matters";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { TagCheckboxes } from "@/components/forms/tag-checkboxes";
import {
  MatterGroupFields,
  type GroupAssignmentDefaults,
  type GroupOption,
} from "@/components/forms/matter-group-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n, useTranslate, useTranslations } from "@/lib/i18n/client";
import { roleLabel } from "@/lib/i18n/enums";
import type { Matter, Tag, User, Client, WorkflowStatus } from "@prisma/client";
import { workflowStatusLabel } from "@/lib/workflow-labels";

type MatterWithRelations = Matter & {
  tags: { tag: Tag }[];
  assignments: { userId: string }[];
  groupAssignments?: GroupAssignmentDefaults[];
};

export function MatterForm({
  matter,
  clients,
  users,
  groups,
  tags,
  defaultClientId,
  currentUserId,
  enableEntityNotes = true,
  workflowStatuses,
}: {
  matter?: MatterWithRelations;
  clients: Pick<Client, "id" | "displayName">[];
  users: Pick<User, "id" | "name" | "role">[];
  groups: GroupOption[];
  tags: Tag[];
  workflowStatuses: WorkflowStatus[];
  defaultClientId?: string;
  currentUserId?: string;
  enableEntityNotes?: boolean;
}) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const translate = useTranslate();
  const { locale } = useI18n();
  const defaultStatusId =
    matter?.statusId ??
    workflowStatuses.find((s) => s.isDefault)?.id ??
    workflowStatuses[0]?.id ??
    "";
  const isEdit = !!matter;
  const action = isEdit
    ? updateMatterAction.bind(null, matter.id)
    : createMatterAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  const groupDefaults: GroupAssignmentDefaults[] =
    matter?.groupAssignments ?? [];

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-2">
        <Label htmlFor="clientId">{t("form.client")}</Label>
        <Select
          id="clientId"
          name="clientId"
          required
          defaultValue={matter?.clientId ?? defaultClientId ?? ""}
        >
          <option value="">{t("form.selectClient")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">{t("form.title")}</Label>
          <Input id="title" name="title" required defaultValue={matter?.title} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="caseNumber">{t("form.caseNumber")}</Label>
          <Input id="caseNumber" name="caseNumber" defaultValue={matter?.caseNumber ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="statusId">{t("form.status")}</Label>
          <Select id="statusId" name="statusId" required defaultValue={defaultStatusId}>
            {workflowStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {workflowStatusLabel(s, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="openedAt">{t("form.opened")}</Label>
          <Input
            id="openedAt"
            name="openedAt"
            type="date"
            defaultValue={
              matter?.openedAt
                ? new Date(matter.openedAt).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10)
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="closedAt">{t("form.closedDate")}</Label>
          <Input
            id="closedAt"
            name="closedAt"
            type="date"
            defaultValue={
              matter?.closedAt
                ? new Date(matter.closedAt).toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
      </div>
      {enableEntityNotes && (
        <div className="space-y-2">
          <Label htmlFor="notes">{tc("notes")}</Label>
          <Textarea id="notes" name="notes" defaultValue={matter?.notes ?? ""} />
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">{t("form.assignedUsers")}</p>
        <div className="flex flex-wrap gap-3">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="assigneeIds"
                value={u.id}
                defaultChecked={
                  matter
                    ? matter.assignments.some((a) => a.userId === u.id)
                    : currentUserId === u.id
                }
              />
              {u.name} ({roleLabel(translate, u.role)})
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">{t("form.assignedGroups")}</p>
        <MatterGroupFields groups={groups} defaults={groupDefaults} />
      </div>
      <TagCheckboxes
        tags={tags}
        selectedIds={matter?.tags.map((t) => t.tag.id) ?? []}
      />
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{tc("savedSuccessfully")}</p>
      )}
      <div className="flex gap-3">
        <SubmitButton
          label={isEdit ? tc("saveChanges") : t("form.create")}
          pendingLabel={tc("saving")}
        />
        <Button variant="outline" asChild>
          <Link href={isEdit ? `/matters/${matter.id}` : "/matters"}>{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
