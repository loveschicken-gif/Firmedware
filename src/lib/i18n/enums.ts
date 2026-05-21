import type {
  ClientStatus,
  ClientType,
  DocumentProvider,
  DocumentReferenceType,
  MatterStatus,
  Role,
  TaskStatus,
} from "@prisma/client";
import type { Translator } from "./translate";

export function matterStatusLabel(t: Translator, status: MatterStatus) {
  return t(`common.enum.matterStatus.${status}`);
}

export function clientStatusLabel(t: Translator, status: ClientStatus) {
  return t(`common.enum.clientStatus.${status}`);
}

export function taskStatusLabel(t: Translator, status: TaskStatus) {
  return t(`common.enum.taskStatus.${status}`);
}

export function roleLabel(t: Translator, role: Role) {
  return t(`common.enum.role.${role}`);
}

export function clientTypeLabel(t: Translator, type: ClientType) {
  return t(`common.enum.clientType.${type}`);
}

const PROVIDER_KEYS: Record<DocumentProvider, string> = {
  GOOGLE_DRIVE: "documents.provider.googleDrive",
  ONEDRIVE: "documents.provider.oneDrive",
  SHAREPOINT: "documents.provider.sharePoint",
  DROPBOX: "documents.provider.dropbox",
  LOCAL_FOLDER: "documents.provider.localFolder",
  OTHER: "documents.provider.other",
};

const REFERENCE_TYPE_KEYS: Record<DocumentReferenceType, string> = {
  EXTERNAL_URL: "documents.referenceType.externalUrl",
  LOCAL_PATH: "documents.referenceType.localPath",
  MANUAL_REFERENCE: "documents.referenceType.manualReference",
};

export function billingStatusLabel(t: Translator, status: string) {
  return t(`common.enum.billingStatus.${status}`);
}

export function documentProviderLabel(
  t: Translator,
  provider: DocumentProvider,
  providerLabel?: string | null
) {
  if (provider === "OTHER" && providerLabel) return providerLabel;
  return t(PROVIDER_KEYS[provider]);
}

export function documentReferenceTypeLabel(
  t: Translator,
  referenceType: DocumentReferenceType
) {
  return t(REFERENCE_TYPE_KEYS[referenceType]);
}
