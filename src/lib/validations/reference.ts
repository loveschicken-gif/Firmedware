import {
  normalizeDocumentUrl,
  isValidExternalDocumentUrl,
} from "@/lib/validations/url";
import type { DocumentReferenceType } from "@prisma/client";

const BLOCKED_REFERENCE_PREFIXES = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "ftp:",
  "chrome:",
  "about:",
] as const;

const MAX_REFERENCE_LENGTH = 2048;

function hasBlockedPrefix(input: string): boolean {
  const lower = input.trim().toLowerCase();
  return BLOCKED_REFERENCE_PREFIXES.some((p) => lower.startsWith(p));
}

/** Windows UNC, drive letter, macOS/Linux absolute paths, or //server/share style. */
export function isValidLocalPath(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_REFERENCE_LENGTH) return false;
  if (hasBlockedPrefix(trimmed)) return false;
  if (isValidExternalDocumentUrl(trimmed)) return false;

  if (trimmed.startsWith("\\\\")) return true;
  if (trimmed.startsWith("//") && trimmed.length > 2) return true;
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) return true;
  if (trimmed.startsWith("/")) return true;

  return false;
}

export function normalizeLocalPath(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("//") && !trimmed.startsWith("//http")) {
    return `\\\\${trimmed.slice(2).replace(/\//g, "\\")}`;
  }
  return trimmed;
}

export function isValidManualReference(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_REFERENCE_LENGTH) return false;
  return !hasBlockedPrefix(trimmed);
}

export function normalizeManualReference(input: string): string {
  return input.trim();
}

export function normalizeReferenceValue(
  referenceType: DocumentReferenceType,
  value: string
): string {
  switch (referenceType) {
    case "EXTERNAL_URL":
      return normalizeDocumentUrl(value);
    case "LOCAL_PATH":
      return normalizeLocalPath(value);
    case "MANUAL_REFERENCE":
      return normalizeManualReference(value);
    default:
      return value.trim();
  }
}

export function isValidReferenceValue(
  referenceType: DocumentReferenceType,
  value: string
): boolean {
  switch (referenceType) {
    case "EXTERNAL_URL":
      return isValidExternalDocumentUrl(value);
    case "LOCAL_PATH":
      return isValidLocalPath(value);
    case "MANUAL_REFERENCE":
      return isValidManualReference(value);
    default:
      return false;
  }
}
