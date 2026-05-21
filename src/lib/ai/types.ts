export type AIConnectorProvider =
  | "OPENAI"
  | "ANTHROPIC"
  | "GOOGLE_GEMINI"
  | "PERPLEXITY"
  | "LOCAL_MODEL"
  | "OTHER";

export type AIConnectorMode =
  | "DISABLED"
  | "PUBLIC_RESEARCH_ONLY"
  | "WORKFLOW_TEMPLATES_ONLY"
  | "REDACTED_CONTEXT_ONLY"
  | "CONFIDENTIAL_WITH_APPROVAL";

export type AIRequestPurpose =
  | "PUBLIC_RESEARCH"
  | "WORKFLOW_TEMPLATE"
  | "CHECKLIST_DRAFT"
  | "TRANSLATION"
  | "STATUS_TAXONOMY"
  | "REDACTED_MATTER_HELP"
  | "OTHER";

export type AIConnectorRequest = {
  provider: AIConnectorProvider;
  mode: AIConnectorMode;
  userId: string;
  matterId?: string;
  clientId?: string;
  purpose: AIRequestPurpose;
  prompt: string;
  contextSummary?: string;
  includesClientConfidentialInfo: boolean;
  includesPrivilegedInfo: boolean;
  includesPersonalData: boolean;
  includesExternalDocumentLinks: boolean;
  includesLocalPaths: boolean;
  userConfirmed: boolean;
  adminApproved?: boolean;
  /** Required when provider is OTHER */
  otherProviderLabel?: string;
};

export type AIConnectorDecision = {
  allowed: boolean;
  reason: string;
  requiresAdminApproval?: boolean;
  requiresRedaction?: boolean;
  shouldLogPrompt?: boolean;
  shouldLogOutput?: boolean;
};

export const AI_CONNECTOR_PROVIDERS = [
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE_GEMINI",
  "PERPLEXITY",
  "LOCAL_MODEL",
  "OTHER",
] as const satisfies readonly AIConnectorProvider[];

export const AI_CONNECTOR_MODES = [
  "DISABLED",
  "PUBLIC_RESEARCH_ONLY",
  "WORKFLOW_TEMPLATES_ONLY",
  "REDACTED_CONTEXT_ONLY",
  "CONFIDENTIAL_WITH_APPROVAL",
] as const satisfies readonly AIConnectorMode[];

export const AI_REQUEST_PURPOSES = [
  "PUBLIC_RESEARCH",
  "WORKFLOW_TEMPLATE",
  "CHECKLIST_DRAFT",
  "TRANSLATION",
  "STATUS_TAXONOMY",
  "REDACTED_MATTER_HELP",
  "OTHER",
] as const satisfies readonly AIRequestPurpose[];
