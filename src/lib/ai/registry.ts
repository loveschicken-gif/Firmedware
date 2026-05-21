import type { AIConnectorProvider } from "./types";

export type AIProviderRegistryEntry = {
  enabled: boolean;
  label: string;
};

/** All providers disabled by default — no API calls in core. */
export const aiProviderRegistry: Record<
  AIConnectorProvider,
  AIProviderRegistryEntry
> = {
  OPENAI: { enabled: false, label: "OpenAI / ChatGPT" },
  ANTHROPIC: { enabled: false, label: "Anthropic Claude" },
  GOOGLE_GEMINI: { enabled: false, label: "Google Gemini" },
  PERPLEXITY: { enabled: false, label: "Perplexity" },
  LOCAL_MODEL: { enabled: false, label: "Local model" },
  OTHER: { enabled: false, label: "Other provider" },
};
