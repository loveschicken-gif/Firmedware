import { AI_CONNECTOR_MODES } from "@/lib/ai/types";
import { aiProviderRegistry } from "@/lib/ai/registry";
import { assertCanUseAIGateway } from "@/lib/ai/gateway";
import { getFirmSettings } from "@/lib/firm-settings";
import { getSessionUser } from "@/lib/session";

const WARNINGS = [
  "AI connectors are disabled by default. No provider API calls are made in this version.",
  "Do not send client names, matter notes, privileged communications, document references, external links, local paths, or personal data to third-party AI unless firm policy explicitly allows it and approvals are in place.",
  "Provider API keys must be stored in server environment variables or a secret manager — never in the database or repository.",
  "Firmedware does not fetch, proxy, or export documents to AI providers.",
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = assertCanUseAIGateway(user);
  if (forbidden) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getFirmSettings();

  return Response.json({
    enabled: settings.enableAIConnectors,
    firmMode: settings.aiConnectorMode ?? "DISABLED",
    firmProvider: settings.aiConnectorProvider,
    providers: aiProviderRegistry,
    supportedModes: AI_CONNECTOR_MODES,
    warnings: WARNINGS,
  });
}
