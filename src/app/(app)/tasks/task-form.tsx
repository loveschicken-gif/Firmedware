"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toWeekInputValue } from "@/lib/sprint";
import { useTranslations } from "@/lib/i18n/client";
import type { Task, User, Client, Matter } from "@prisma/client";

export function TaskForm({
  task,
  clients,
  matters,
  users,
}: {
  task?: Task;
  clients: Pick<Client, "id" | "displayName">[];
  matters: Pick<Matter, "id" | "title" | "clientId">[];
  users: Pick<User, "id" | "name">[];
}) {
  const t = useTranslations("tasks");
  const tc = useTranslations("common");
  const isEdit = !!task;
  const action = isEdit ? updateTaskAction.bind(null, task.id) : createTaskAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  const [useAutoSprint, setUseAutoSprint] = useState(!task?.sprintWeekStart);
  const sprintDefault = task?.sprintWeekStart
    ? toWeekInputValue(task.sprintWeekStart)
    : "";

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-2">
        <Label htmlFor="title">{t("form.title")}</Label>
        <Input id="title" name="title" required defaultValue={task?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("form.description")}</Label>
        <Textarea id="description" name="description" defaultValue={task?.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">{t("form.status")}</Label>
          <Select id="status" name="status" defaultValue={task?.status ?? "TODO"}>
            <option value="TODO">{t("form.statusTodo")}</option>
            <option value="IN_PROGRESS">{t("form.statusInProgress")}</option>
            <option value="DONE">{t("form.statusDone")}</option>
            <option value="CANCELLED">{t("form.statusCancelled")}</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueAt">{t("form.dueDate")}</Label>
          <Input
            id="dueAt"
            name="dueAt"
            type="date"
            defaultValue={
              task?.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : ""
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadlineType">{t("form.deadlineType")}</Label>
          <Input
            id="deadlineType"
            name="deadlineType"
            list="deadline-type-options"
            placeholder={t("form.deadlineTypePlaceholder")}
            defaultValue={task?.deadlineType ?? ""}
          />
          <datalist id="deadline-type-options">
            <option value="court" />
            <option value="filing" />
            <option value="client" />
            <option value="internal" />
            <option value="statute" />
          </datalist>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="sprintWeekStart">{t("form.sprintWeek")}</Label>
          <label className="mb-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="useAutoSprint"
              value="true"
              checked={useAutoSprint}
              onChange={(e) => setUseAutoSprint(e.target.checked)}
            />
            {t("form.autoSprint")}
          </label>
          {!useAutoSprint && (
            <Input
              id="sprintWeekStart"
              name="sprintWeekStart"
              type="week"
              defaultValue={sprintDefault}
            />
          )}
          {useAutoSprint && (
            <p className="text-xs text-slate-500">{t("form.autoSprintHint")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientId">{t("form.client")}</Label>
          <Select id="clientId" name="clientId" defaultValue={task?.clientId ?? ""}>
            <option value="">{t("form.none")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.displayName}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="matterId">{tc("matter")}</Label>
          <Select id="matterId" name="matterId" defaultValue={task?.matterId ?? ""}>
            <option value="">{t("form.none")}</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="assigneeId">{t("form.assignee")}</Label>
          <Select id="assigneeId" name="assigneeId" defaultValue={task?.assigneeId ?? ""}>
            <option value="">{t("form.unassigned")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
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
          label={isEdit ? tc("saveChanges") : t("form.create")}
          pendingLabel={tc("saving")}
        />
        <Button variant="outline" asChild>
          <Link href={isEdit ? `/tasks/${task.id}` : "/tasks"}>{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
