"use client";

import { Suspense } from "react";
import { LoginConfidentialityNotice } from "@/components/login-confidentiality-notice";
import { LoginForm } from "./login-form";
import { useTranslations } from "@/lib/i18n/client";

export default function LoginPage() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Firmedware</h1>
          <p className="mt-1 text-sm text-slate-500">{t("auth.signInTitle")}</p>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-500">{t("auth.loading")}</p>}>
          <LoginForm />
        </Suspense>
        <LoginConfidentialityNotice />
      </div>
    </div>
  );
}
