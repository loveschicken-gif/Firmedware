export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "th";
export const FALLBACK_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "locale";

export const NAMESPACES = [
  "common",
  "dashboard",
  "clients",
  "matters",
  "documents",
  "tasks",
  "admin",
  "account",
  "billing",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export function isValidLocale(value: string | undefined | null): value is Locale {
  return value === "th" || value === "en";
}
