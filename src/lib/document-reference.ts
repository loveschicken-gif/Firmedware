import type { DocumentReferenceType } from "@prisma/client";
import { isValidExternalDocumentUrl } from "@/lib/validations/url";

export function isExternalReference(type: DocumentReferenceType): boolean {
  return type === "EXTERNAL_URL";
}

export function canOpenInBrowser(
  type: DocumentReferenceType,
  referenceValue: string
): boolean {
  return (
    type === "EXTERNAL_URL" && isValidExternalDocumentUrl(referenceValue)
  );
}

/** Infer type for legacy rows created before referenceType existed. */
export function inferReferenceType(
  referenceType: DocumentReferenceType | null | undefined,
  provider: string,
  url: string
): DocumentReferenceType {
  if (referenceType) return referenceType;
  if (
    provider === "LOCAL_FOLDER" &&
    !url.toLowerCase().startsWith("http://") &&
    !url.toLowerCase().startsWith("https://")
  ) {
    return "LOCAL_PATH";
  }
  return "EXTERNAL_URL";
}
