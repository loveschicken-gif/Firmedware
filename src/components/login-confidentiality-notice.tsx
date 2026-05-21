"use client";

import { useTranslations } from "@/lib/i18n/client";

export function LoginConfidentialityNotice() {
  const t = useTranslations("common");
  return (
    <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
      {t("confidentiality.notice")}
    </p>
  );
}
