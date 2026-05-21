import "server-only";

import path from "path";
import { readFile } from "fs/promises";
import {
  FALLBACK_LOCALE,
  type Locale,
  NAMESPACES,
  type Namespace,
} from "./config";
import type { Messages } from "./translate";

function deepMerge(target: Messages, source: Messages): Messages {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      out[key] = deepMerge(tv as Messages, sv as Messages);
    } else {
      out[key] = sv;
    }
  }
  return out;
}

async function loadNamespace(
  locale: Locale,
  namespace: Namespace
): Promise<Messages> {
  const filePath = path.join(
    process.cwd(),
    "locales",
    locale,
    `${namespace}.json`
  );
  const raw = await readFile(filePath, "utf-8");
  return { [namespace]: JSON.parse(raw) as Messages };
}

export async function loadMessages(locale: Locale): Promise<Messages> {
  const parts = await Promise.all(
    NAMESPACES.map((ns) => loadNamespace(locale, ns))
  );
  return parts.reduce((acc, part) => deepMerge(acc, part), {});
}

export async function loadMessagesWithFallback(
  locale: Locale
): Promise<{ locale: Locale; messages: Messages; fallback: Messages }> {
  const [primary, fallback] = await Promise.all([
    loadMessages(locale),
    locale === FALLBACK_LOCALE
      ? Promise.resolve({} as Messages)
      : loadMessages(FALLBACK_LOCALE),
  ]);
  return { locale, messages: primary, fallback };
}
