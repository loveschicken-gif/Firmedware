"use client";

import { LanguageSwitcher } from "./language-switcher";
import { useI18n } from "@/lib/i18n/client";

export function AppHeader() {
  const { t } = useI18n();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <span className="text-sm text-slate-500">{t("common.appTagline")}</span>
      <LanguageSwitcher />
    </header>
  );
}
