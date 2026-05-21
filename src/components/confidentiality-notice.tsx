"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/client";

const STORAGE_KEY = "fw_confidentiality_ack";

export function ConfidentialityNotice({ enabled }: { enabled: boolean }) {
  const t = useTranslations("common");
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  });

  if (!enabled || dismissed) return null;

  return (
    <div
      role="note"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-3">
        <p className="flex-1 leading-relaxed">{t("confidentiality.notice")}</p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        >
          {t("confidentiality.dismiss")}
        </button>
      </div>
    </div>
  );
}
