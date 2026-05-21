import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getFirmSettings } from "@/lib/firm-settings";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_LOCALE,
  isValidLocale,
  LOCALE_COOKIE,
  type Locale,
  type Namespace,
} from "./config";
import { loadMessagesWithFallback } from "./load-messages";
import {
  createNamespaceTranslator,
  createTranslator,
  type Messages,
  type Translator,
} from "./translate";

export async function resolveLocale(userId?: string | null): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isValidLocale(cookieLocale)) return cookieLocale;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });
    if (isValidLocale(user?.preferredLanguage)) return user.preferredLanguage;
  }

  const settings = await getFirmSettings();
  if (isValidLocale(settings.defaultLanguage)) return settings.defaultLanguage;

  return DEFAULT_LOCALE;
}

export async function getServerI18n(userId?: string | null) {
  const locale = await resolveLocale(userId);
  const { messages, fallback } = await loadMessagesWithFallback(locale);
  const t = createTranslator(messages, fallback);
  return { locale, messages, fallback, t };
}

export async function getServerNamespaceI18n(
  namespace: Namespace,
  userId?: string | null
) {
  const { locale, messages, fallback, t } = await getServerI18n(userId);
  const tn = createNamespaceTranslator(namespace, messages, fallback);
  return { locale, messages, fallback, t, tn };
}

export type ServerI18n = {
  locale: Locale;
  messages: Messages;
  fallback: Messages;
  t: Translator;
};
