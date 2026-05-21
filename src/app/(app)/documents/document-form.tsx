"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  createDocumentAction,
  updateDocumentAction,
} from "@/lib/actions/documents";
import type { ActionResult } from "@/lib/actions/utils";
import { SubmitButton } from "@/components/forms/submit-button";
import { TagCheckboxes } from "@/components/forms/tag-checkboxes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import type {
  DocumentLink,
  DocumentReferenceType,
  Tag,
  Client,
  Matter,
  DocumentProvider,
} from "@prisma/client";

type DocWithTags = DocumentLink & { tags: { tag: Tag }[] };

export function DocumentForm({
  document,
  clients,
  matters,
  tags,
  defaultClientId,
  defaultMatterId,
  enableEntityNotes = true,
  requirePermissionConfirm = true,
}: {
  document?: DocWithTags;
  clients: Pick<Client, "id" | "displayName">[];
  matters: (Pick<Matter, "id" | "title" | "clientId">)[];
  tags: Tag[];
  defaultClientId?: string;
  defaultMatterId?: string;
  enableEntityNotes?: boolean;
  requirePermissionConfirm?: boolean;
}) {
  const t = useTranslations("documents");
  const tc = useTranslations("common");
  const isEdit = !!document;
  const action = isEdit
    ? updateDocumentAction.bind(null, document.id)
    : createDocumentAction;

  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  const [referenceType, setReferenceType] = useState<DocumentReferenceType>(
    document?.referenceType ?? "EXTERNAL_URL"
  );

  const [provider, setProvider] = useState<DocumentProvider>(
    document?.provider ?? "OTHER"
  );

  const [clientId, setClientId] = useState(
    document?.clientId ?? defaultClientId ?? ""
  );
  const filteredMatters = matters.filter(
    (m) => !clientId || m.clientId === clientId
  );

  const permissionWarning = useMemo(() => {
    switch (referenceType) {
      case "LOCAL_PATH":
        return t("form.permissionWarningLocal");
      case "MANUAL_REFERENCE":
        return t("form.permissionWarningManual");
      default:
        return t("form.permissionWarningExternal");
    }
  }, [referenceType, t]);

  const valueLabel =
    referenceType === "EXTERNAL_URL"
      ? t("form.url")
      : referenceType === "LOCAL_PATH"
        ? t("form.pathLabel")
        : t("form.manualLabel");

  const valuePlaceholder =
    referenceType === "EXTERNAL_URL"
      ? t("form.urlPlaceholder")
      : referenceType === "LOCAL_PATH"
        ? t("form.pathPlaceholder")
        : t("form.manualPlaceholder");

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6">
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
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="matterId">{t("form.matterOptional")}</Label>
        <Select
          id="matterId"
          name="matterId"
          defaultValue={document?.matterId ?? defaultMatterId ?? ""}
        >
          <option value="">{t("form.noMatter")}</option>
          {filteredMatters.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">{t("form.title")}</Label>
        <Input id="title" name="title" required defaultValue={document?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referenceType">{t("form.referenceType")}</Label>
        <Select
          id="referenceType"
          name="referenceType"
          value={referenceType}
          onChange={(e) =>
            setReferenceType(e.target.value as DocumentReferenceType)
          }
        >
          <option value="EXTERNAL_URL">{t("form.referenceTypeExternalUrl")}</option>
          <option value="LOCAL_PATH">{t("form.referenceTypeLocalPath")}</option>
          <option value="MANUAL_REFERENCE">
            {t("form.referenceTypeManualReference")}
          </option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">{valueLabel}</Label>
        <Input
          id="url"
          name="url"
          type="text"
          required
          placeholder={valuePlaceholder}
          defaultValue={document?.url}
        />
        {referenceType === "LOCAL_PATH" && (
          <p className="text-xs text-slate-600">{t("form.helperLocalPath")}</p>
        )}
        {referenceType === "MANUAL_REFERENCE" && (
          <p className="text-xs text-slate-600">{t("form.helperManualReference")}</p>
        )}
      </div>
      {referenceType === "EXTERNAL_URL" && (
        <div className="space-y-2">
          <Label htmlFor="provider">{t("form.storageProvider")}</Label>
          <Select
            id="provider"
            name="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as DocumentProvider)}
          >
            <option value="GOOGLE_DRIVE">{t("form.providerGoogleDrive")}</option>
            <option value="ONEDRIVE">{t("form.providerOneDrive")}</option>
            <option value="SHAREPOINT">{t("form.providerSharePoint")}</option>
            <option value="DROPBOX">{t("form.providerDropbox")}</option>
            <option value="OTHER">{t("form.providerOther")}</option>
          </Select>
        </div>
      )}
      {referenceType === "LOCAL_PATH" && (
        <input type="hidden" name="provider" value="LOCAL_FOLDER" />
      )}
      {referenceType === "MANUAL_REFERENCE" && (
        <input type="hidden" name="provider" value="OTHER" />
      )}
      {referenceType === "EXTERNAL_URL" && provider === "OTHER" && (
        <div className="space-y-2">
          <Label htmlFor="providerLabel">{t("form.providerName")}</Label>
          <Input
            id="providerLabel"
            name="providerLabel"
            required
            placeholder={t("form.providerNamePlaceholder")}
            defaultValue={document?.providerLabel ?? ""}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="sensitivity">{t("form.sensitivity")}</Label>
        <Select
          id="sensitivity"
          name="sensitivity"
          defaultValue={document?.sensitivity ?? "NORMAL"}
        >
          <option value="NORMAL">{t("sensitivity.NORMAL")}</option>
          <option value="CONFIDENTIAL">{t("sensitivity.CONFIDENTIAL")}</option>
          <option value="HIGHLY_CONFIDENTIAL">
            {t("sensitivity.HIGHLY_CONFIDENTIAL")}
          </option>
          <option value="PRIVILEGED">{t("sensitivity.PRIVILEGED")}</option>
        </Select>
      </div>
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
        {permissionWarning}
      </p>
      {requirePermissionConfirm && (
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="permissionConfirmed"
            required
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>{t("form.permissionConfirmLabel")}</span>
        </label>
      )}
      {enableEntityNotes && (
        <div className="space-y-2">
          <Label htmlFor="notes">{tc("notes")}</Label>
          <Textarea id="notes" name="notes" defaultValue={document?.notes ?? ""} />
        </div>
      )}
      <TagCheckboxes
        tags={tags}
        selectedIds={document?.tags.map((t) => t.tag.id) ?? []}
      />
      {state && !state.success && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">{tc("savedSuccessfully")}</p>
      )}
      <div className="flex gap-3">
        <SubmitButton
          label={isEdit ? tc("saveChanges") : t("form.addLink")}
          pendingLabel={tc("saving")}
        />
        <Button variant="outline" asChild>
          <Link href={isEdit ? `/documents/${document.id}` : "/documents"}>{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
