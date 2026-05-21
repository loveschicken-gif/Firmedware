"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  createNamespaceTranslator,
  createTranslator,
  type Messages,
  type Translator,
} from "./translate";
import type { Locale, Namespace } from "./config";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  fallback: Messages;
  t: Translator;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  fallback,
  children,
}: {
  locale: Locale;
  messages: Messages;
  fallback: Messages;
  children: ReactNode;
}) {
  const t = useMemo(
    () => createTranslator(messages, fallback),
    [messages, fallback]
  );

  const value = useMemo(
    () => ({ locale, messages, fallback, t }),
    [locale, messages, fallback, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useTranslations(namespace: Namespace) {
  const { messages, fallback } = useI18n();
  return useMemo(
    () => createNamespaceTranslator(namespace, messages, fallback),
    [namespace, messages, fallback]
  );
}

export function useTranslate() {
  return useI18n().t;
}
