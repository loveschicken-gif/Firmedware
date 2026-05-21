const BLOCKED_URL_PREFIXES = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "ftp:",
  "chrome:",
  "about:",
] as const;

function isUncOrWindowsPath(input: string): boolean {
  return input.startsWith("\\\\") || /^[a-zA-Z]:\\/.test(input);
}

function isUnixStylePath(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//") && !trimmed.startsWith("//http")) return true;
  return true;
}

export function normalizeDocumentUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
  const normalized = hasScheme ? trimmed : `https://${trimmed}`;

  const url = new URL(normalized);
  return url.href;
}

/** External http(s) links only — not UNC, drive letters, or POSIX paths. */
export function isValidExternalDocumentUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (BLOCKED_URL_PREFIXES.some((p) => lower.startsWith(p))) {
    return false;
  }

  if (isUncOrWindowsPath(trimmed) || isUnixStylePath(trimmed)) {
    return false;
  }

  try {
    const href = normalizeDocumentUrl(trimmed);
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** @deprecated Use isValidExternalDocumentUrl for EXTERNAL_URL references. */
export function isValidDocumentUrl(input: string): boolean {
  return isValidExternalDocumentUrl(input);
}

/** Non-blocking hints for common DMS hosts (playbook alignment). */
export function documentUrlHostHint(url: string): string | null {
  try {
    const host = new URL(normalizeDocumentUrl(url)).hostname.toLowerCase();
    if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
      return "google_drive";
    }
    if (host.includes("sharepoint.com") || host.includes("sharepoint.")) {
      return "sharepoint";
    }
    if (host.includes("onedrive") || host.includes("1drv.ms")) {
      return "onedrive";
    }
    if (host.includes("dropbox.com")) return "dropbox";
    return null;
  } catch {
    return null;
  }
}
