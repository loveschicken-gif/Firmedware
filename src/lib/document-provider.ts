import { DocumentProvider } from "@prisma/client";

const providerLabels: Record<DocumentProvider, string> = {
  GOOGLE_DRIVE: "Google Drive",
  ONEDRIVE: "OneDrive",
  SHAREPOINT: "SharePoint",
  DROPBOX: "Dropbox",
  LOCAL_FOLDER: "Local folder",
  OTHER: "Other",
};

export function formatDocumentProvider(
  provider: DocumentProvider,
  providerLabel?: string | null
): string {
  if (provider === DocumentProvider.OTHER && providerLabel) {
    return providerLabel;
  }
  return providerLabels[provider] ?? provider;
}
