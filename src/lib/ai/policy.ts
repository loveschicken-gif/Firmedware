import type { AIConnectorDecision, AIConnectorRequest } from "./types";

const GENERIC_PURPOSES = new Set([
  "WORKFLOW_TEMPLATE",
  "CHECKLIST_DRAFT",
  "TRANSLATION",
  "STATUS_TAXONOMY",
]);

function blocked(
  reason: string,
  extra?: Partial<AIConnectorDecision>
): AIConnectorDecision {
  return {
    allowed: false,
    reason,
    shouldLogPrompt: false,
    shouldLogOutput: false,
    ...extra,
  };
}

function allowed(reason: string): AIConnectorDecision {
  return {
    allowed: true,
    reason,
    shouldLogPrompt: false,
    shouldLogOutput: false,
  };
}

/** Conservative policy gate — does not call providers or read database records. */
export function evaluateAIConnectorPolicy(
  request: AIConnectorRequest
): AIConnectorDecision {
  if (request.mode === "DISABLED") {
    return blocked("AI connectors are disabled for this request.");
  }

  if (!request.userConfirmed) {
    return blocked(
      "User confirmation is required before any AI policy check or request."
    );
  }

  if (!request.provider) {
    return blocked("A provider must be selected.");
  }

  if (request.provider === "OTHER" && !request.otherProviderLabel?.trim()) {
    return blocked(
      "OTHER provider requires a configured provider label (otherProviderLabel or firm settings)."
    );
  }

  if (request.includesExternalDocumentLinks) {
    return blocked("External document links are blocked by default.");
  }

  if (request.includesLocalPaths) {
    return blocked("Local file paths are blocked by default.");
  }

  if (request.includesPrivilegedInfo) {
    if (
      request.mode !== "CONFIDENTIAL_WITH_APPROVAL" ||
      !request.adminApproved
    ) {
      return blocked(
        "Privileged information requires CONFIDENTIAL_WITH_APPROVAL mode and admin approval.",
        { requiresAdminApproval: true }
      );
    }
  }

  if (
    request.includesClientConfidentialInfo &&
    (request.mode === "PUBLIC_RESEARCH_ONLY" ||
      request.mode === "WORKFLOW_TEMPLATES_ONLY")
  ) {
    return blocked(
      "Client confidential information is not allowed in this mode."
    );
  }

  if (
    request.includesPersonalData &&
    request.mode === "PUBLIC_RESEARCH_ONLY"
  ) {
    return blocked("Personal data is not allowed in public research mode.");
  }

  if (request.purpose === "PUBLIC_RESEARCH") {
    if (
      request.includesClientConfidentialInfo ||
      request.includesPrivilegedInfo ||
      request.includesExternalDocumentLinks ||
      request.includesLocalPaths
    ) {
      return blocked(
        "Public research may not include client confidential information, privileged information, external document links, or local paths."
      );
    }
  }

  if (GENERIC_PURPOSES.has(request.purpose)) {
    if (
      request.includesClientConfidentialInfo ||
      request.includesPrivilegedInfo
    ) {
      return blocked(
        "This purpose allows only generic, non-client-specific content."
      );
    }
  }

  if (request.purpose === "REDACTED_MATTER_HELP") {
    if (request.includesPrivilegedInfo) {
      return blocked(
        "Redacted matter help cannot include privileged information unless confidential approval mode applies."
      );
    }
    if (
      request.includesClientConfidentialInfo &&
      request.mode === "REDACTED_CONTEXT_ONLY"
    ) {
      return blocked(
        "Client identifiers should be redacted before use in REDACTED_CONTEXT_ONLY mode.",
        { requiresRedaction: true }
      );
    }
  }

  return allowed(
    "Request permitted by policy (no provider call is made by this check)."
  );
}
