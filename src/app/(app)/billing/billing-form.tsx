"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createBillingAction,
  updateBillingAction,
} from "@/lib/actions/billing";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n, useTranslations } from "@/lib/i18n/client";
import { BILLING_STATUSES } from "@/lib/billing-status";
import { billingStatusLabel } from "@/lib/i18n/enums";
import type { BillingRecord, Client, Matter } from "@prisma/client";

export function BillingForm({
  record,
  clients,
  matters,
  defaultClientId,
  defaultMatterId,
}: {
  record?: BillingRecord;
  clients: Pick<Client, "id" | "displayName">[];
  matters: Pick<Matter, "id" | "title" | "clientId">[];
  defaultClientId?: string;
  defaultMatterId?: string;
}) {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const { t: tAll } = useI18n();
  const isEdit = !!record;
  const action = isEdit
    ? updateBillingAction.bind(null, record.id)
    : createBillingAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  const [clientId, setClientId] = useState(
    record?.clientId ?? defaultClientId ?? ""
  );
  const filteredMatters = matters.filter(
    (m) => !clientId || m.clientId === clientId
  );

  const formatDateInput = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().slice(0, 10) : "";

  return (
    <form
      action={formAction}
      className="max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6"
    >
      <p className="text-sm text-slate-600">{t("detail.disclaimer")}</p>
      <div className="space-y-2">
        <Label htmlFor="clientId">{t("form.client")}</Label>
        <Select
          id="clientId"
          name="clientId"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">{t("form.selectClient")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="matterId">{t("form.matter")}</Label>
        <Select
          id="matterId"
          name="matterId"
          defaultValue={record?.matterId ?? defaultMatterId ?? ""}
        >
          <option value="">{t("form.noMatter")}</option>
          {filteredMatters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">{t("form.invoiceNumber")}</Label>
          <Input
            id="invoiceNumber"
            name="invoiceNumber"
            defaultValue={record?.invoiceNumber ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{t("form.status")}</Label>
          <Select
            id="status"
            name="status"
            defaultValue={record?.status ?? "DRAFT"}
            required
          >
            {BILLING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {billingStatusLabel(tAll, s)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">{t("form.title")}</Label>
        <Input id="title" name="title" required defaultValue={record?.title ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("form.description")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={record?.description ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">{t("form.amount")}</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={record?.amount.toString() ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">{t("form.currency")}</Label>
          <Input
            id="currency"
            name="currency"
            maxLength={8}
            defaultValue={record?.currency ?? "THB"}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="issueDate">{t("form.issueDate")}</Label>
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            defaultValue={formatDateInput(record?.issueDate)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">{t("form.dueDate")}</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={formatDateInput(record?.dueDate)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paidAt">{t("form.paidAt")}</Label>
          <Input
            id="paidAt"
            name="paidAt"
            type="date"
            defaultValue={formatDateInput(record?.paidAt)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="externalLink">{t("form.externalLink")}</Label>
        <Input
          id="externalLink"
          name="externalLink"
          type="url"
          placeholder="https://"
          defaultValue={record?.externalLink ?? ""}
        />
        <p className="text-xs text-slate-500">{t("form.externalLinkHint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t("form.notes")}</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={record?.notes ?? ""} />
      </div>
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{tc("savedSuccessfully")}</p>
      )}
      <div className="flex gap-3">
        <SubmitButton label={isEdit ? t("form.save") : t("form.create")} />
        <Button variant="outline" asChild>
          <Link href={isEdit ? `/billing/${record.id}` : "/billing"}>
            {tc("cancel")}
          </Link>
        </Button>
      </div>
    </form>
  );
}
