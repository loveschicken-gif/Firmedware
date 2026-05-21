"use client";

import { useState } from "react";
import { ExternalLink, Copy } from "lucide-react";
import type { DocumentReferenceType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  logDocumentPathCopiedAction,
  logManualReferenceCopiedAction,
} from "@/lib/actions/document-reference-log";
import { canOpenInBrowser } from "@/lib/document-reference";
import { useTranslations } from "@/lib/i18n/client";

export function DocumentReferenceActions({
  documentId,
  referenceType,
  referenceValue,
}: {
  documentId: string;
  referenceType: DocumentReferenceType;
  referenceValue: string;
}) {
  const t = useTranslations("documents");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referenceValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (referenceType === "LOCAL_PATH") {
        await logDocumentPathCopiedAction(documentId);
      } else if (referenceType === "MANUAL_REFERENCE") {
        await logManualReferenceCopiedAction(documentId);
      }
    } catch {
      setCopied(false);
    }
  }

  if (referenceType === "EXTERNAL_URL" && canOpenInBrowser(referenceType, referenceValue)) {
    return (
      <a
        href={referenceValue}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-slate-900 hover:underline"
      >
        {t("detail.openLink")} <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  const copyLabel =
    referenceType === "LOCAL_PATH"
      ? copied
        ? t("detail.copiedPath")
        : t("detail.copyPath")
      : copied
        ? t("detail.copiedReference")
        : t("detail.copyReference");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="font-mono text-sm break-all text-slate-800">{referenceValue}</p>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="mr-1 h-3 w-3" />
        {copyLabel}
      </Button>
    </div>
  );
}
