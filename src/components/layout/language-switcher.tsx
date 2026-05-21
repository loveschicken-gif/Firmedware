"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPreferredLanguageAction } from "@/lib/actions/locale";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setPreferredLanguageAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 text-xs"
      role="group"
      aria-label={t("common.language.label")}
    >
      {(["th", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => switchTo(code)}
          className={cn(
            "rounded px-2.5 py-1 font-medium transition-colors",
            locale === code
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          {t(`common.language.${code}`)}
        </button>
      ))}
    </div>
  );
}
