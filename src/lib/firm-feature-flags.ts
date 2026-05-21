import { getFirmSettings } from "@/lib/firm-settings";

export async function getFirmFeatureFlags() {
  const settings = await getFirmSettings();
  return {
    enableEntityNotes: settings.enableEntityNotes,
    enableComments: settings.enableComments,
    enableBilling: settings.enableBilling,
    enableAIConnectors: settings.enableAIConnectors,
    aiConnectorMode: settings.aiConnectorMode,
    aiConnectorProvider: settings.aiConnectorProvider,
  };
}
