import { canWrite, type SessionUser } from "@/lib/rbac";
import { getFirmSettings } from "@/lib/firm-settings";
import { evaluateAIConnectorPolicy } from "./policy";
import type { AIConnectorDecision, AIConnectorRequest } from "./types";

export function assertCanUseAIGateway(user: SessionUser): Response | null {
  if (!canWrite(user)) {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}

export async function evaluateFirmAIPolicy(
  request: AIConnectorRequest
): Promise<AIConnectorDecision> {
  const settings = await getFirmSettings();

  if (!settings.enableAIConnectors) {
    return {
      allowed: false,
      reason: "AI connectors are disabled for this firm.",
      shouldLogPrompt: false,
      shouldLogOutput: false,
    };
  }

  const firmMode = settings.aiConnectorMode ?? "DISABLED";
  if (firmMode === "DISABLED") {
    return {
      allowed: false,
      reason: "AI connector mode is DISABLED in firm settings.",
      shouldLogPrompt: false,
      shouldLogOutput: false,
    };
  }

  const effectiveRequest: AIConnectorRequest = {
    ...request,
    otherProviderLabel:
      request.otherProviderLabel ??
      (request.provider === "OTHER"
        ? settings.aiConnectorProvider ?? undefined
        : undefined),
  };

  return evaluateAIConnectorPolicy(effectiveRequest);
}
