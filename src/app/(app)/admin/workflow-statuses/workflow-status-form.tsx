"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { WorkflowStatus } from "@prisma/client";
import {
  createWorkflowStatusAction,
  updateWorkflowStatusAction,
} from "@/lib/actions/workflow-statuses";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";

export function WorkflowStatusForm({ status }: { status?: WorkflowStatus }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const isEdit = !!status;
  const action = isEdit
    ? updateWorkflowStatusAction.bind(null, status.id)
    : createWorkflowStatusAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <form
      action={formAction}
      className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="entityType">{t("workflow.form.entityType")}</Label>
        <Select
          id="entityType"
          name="entityType"
          required
          defaultValue={status?.entityType ?? "MATTER"}
          disabled={isEdit}
        >
          <option value="MATTER">MATTER</option>
          <option value="TASK">TASK</option>
          <option value="DOCUMENT_LINK">DOCUMENT_LINK</option>
          <option value="CONTRACT">CONTRACT</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">{t("workflow.form.name")}</Label>
        <Input
          id="name"
          name="name"
          required
          pattern="[a-z0-9_]+"
          defaultValue={status?.name}
          disabled={isEdit}
        />
        <p className="text-xs text-slate-500">{t("workflow.form.nameHint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="labelEn">{t("workflow.form.labelEn")}</Label>
        <Input id="labelEn" name="labelEn" required defaultValue={status?.labelEn ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="labelTh">{t("workflow.form.labelTh")}</Label>
        <Input id="labelTh" name="labelTh" defaultValue={status?.labelTh ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">{t("workflow.form.color")}</Label>
        <Input id="color" name="color" placeholder="#2563eb" defaultValue={status?.color ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sortOrder">{t("workflow.form.sortOrder")}</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={status?.sortOrder ?? 0}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={status?.isDefault}
          className="h-4 w-4 rounded border-slate-300"
        />
        {t("workflow.form.isDefault")}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isFinal"
          defaultChecked={status?.isFinal}
          className="h-4 w-4 rounded border-slate-300"
        />
        {t("workflow.form.isFinal")}
      </label>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={status?.active ?? true}
            className="h-4 w-4 rounded border-slate-300"
          />
          {t("workflow.form.active")}
        </label>
      )}
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{tc("savedSuccessfully")}</p>
      )}
      <div className="flex gap-3">
        <SubmitButton
          label={isEdit ? tc("saveChanges") : t("workflow.form.create")}
          pendingLabel={tc("saving")}
        />
        <Button variant="outline" asChild>
          <Link href="/admin/workflow-statuses">{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
