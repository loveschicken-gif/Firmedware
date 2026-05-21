"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createClientAction,
  updateClientAction,
} from "@/lib/actions/clients";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { TagCheckboxes } from "@/components/forms/tag-checkboxes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import type { Client, Tag } from "@prisma/client";

type ClientWithTags = Client & {
  tags: { tag: Tag }[];
};

export function ClientForm({
  client,
  tags,
  enableEntityNotes = true,
}: {
  client?: ClientWithTags;
  tags: Tag[];
  enableEntityNotes?: boolean;
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const isEdit = !!client;
  const action = isEdit
    ? updateClientAction.bind(null, client.id)
    : createClientAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">{t("form.displayName")}</Label>
          <Input
            id="displayName"
            name="displayName"
            required
            defaultValue={client?.displayName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">{t("form.companyName")}</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={client?.companyName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientType">{t("form.type")}</Label>
          <Select id="clientType" name="clientType" defaultValue={client?.clientType ?? "INDIVIDUAL"}>
            <option value="INDIVIDUAL">{t("form.typeIndividual")}</option>
            <option value="COMPANY">{t("form.typeCompany")}</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{t("form.status")}</Label>
          <Select id="status" name="status" defaultValue={client?.status ?? "ACTIVE"}>
            <option value="ACTIVE">{t("form.statusActive")}</option>
            <option value="INACTIVE">{t("form.statusInactive")}</option>
            <option value="PROSPECT">{t("form.statusProspect")}</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{tc("email")}</Label>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{tc("phone")}</Label>
          <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">{tc("address")}</Label>
        <Textarea id="address" name="address" defaultValue={client?.address ?? ""} />
      </div>
      {enableEntityNotes && (
        <div className="space-y-2">
          <Label htmlFor="notes">{tc("notes")}</Label>
          <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} />
        </div>
      )}
      <TagCheckboxes
        tags={tags}
        selectedIds={client?.tags.map((t) => t.tag.id) ?? []}
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
          <Link href={isEdit ? `/clients/${client.id}` : "/clients"}>{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
