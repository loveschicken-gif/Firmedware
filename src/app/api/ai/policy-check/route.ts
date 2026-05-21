import { logAIPolicyChecked } from "@/lib/ai/activity";
import { assertCanUseAIGateway, evaluateFirmAIPolicy } from "@/lib/ai/gateway";
import {
  detectExternalLinks,
  detectLocalPaths,
} from "@/lib/ai/redaction";
import { aiPolicyCheckBodySchema } from "@/lib/validations/ai-connector";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = assertCanUseAIGateway(user);
  if (forbidden) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = aiPolicyCheckBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const advisoryLinks = detectExternalLinks(
    `${data.prompt}\n${data.contextSummary ?? ""}`
  );
  const advisoryPaths = detectLocalPaths(
    `${data.prompt}\n${data.contextSummary ?? ""}`
  );

  const decision = await evaluateFirmAIPolicy({
    provider: data.provider,
    mode: data.mode,
    userId: user.id,
    matterId: data.matterId,
    clientId: data.clientId,
    purpose: data.purpose,
    prompt: data.prompt,
    contextSummary: data.contextSummary,
    includesClientConfidentialInfo: data.includesClientConfidentialInfo,
    includesPrivilegedInfo: data.includesPrivilegedInfo,
    includesPersonalData: data.includesPersonalData,
    includesExternalDocumentLinks:
      data.includesExternalDocumentLinks || advisoryLinks.length > 0,
    includesLocalPaths: data.includesLocalPaths || advisoryPaths.length > 0,
    userConfirmed: data.userConfirmed,
    adminApproved: data.adminApproved,
    otherProviderLabel: data.otherProviderLabel,
  });

  await logAIPolicyChecked(user.id, {
    allowed: decision.allowed,
    provider: data.provider,
    mode: data.mode,
    purpose: data.purpose,
    matterId: data.matterId,
    clientId: data.clientId,
    requiresAdminApproval: decision.requiresAdminApproval,
    requiresRedaction: decision.requiresRedaction,
  });

  return Response.json({
    decision,
    advisory: {
      detectedExternalLinks: advisoryLinks.length,
      detectedLocalPaths: advisoryPaths.length,
    },
  });
}
