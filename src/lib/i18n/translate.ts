export type Messages = Record<string, unknown>;

export function getNestedValue(
  obj: Messages,
  keyPath: string
): string | undefined {
  const parts = keyPath.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export type Translator = (
  key: string,
  params?: Record<string, string | number>
) => string;

export function createTranslator(
  messages: Messages,
  fallback: Messages
): Translator {
  return (key: string, params?: Record<string, string | number>) => {
    let text =
      getNestedValue(messages, key) ??
      getNestedValue(fallback, key) ??
      key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

/** Shorthand: namespace.key → key with namespace prefix */
export function createNamespaceTranslator(
  namespace: string,
  messages: Messages,
  fallback: Messages
): Translator {
  const t = createTranslator(messages, fallback);
  return (key: string, params?: Record<string, string | number>) =>
    t(`${namespace}.${key}`, params);
}
