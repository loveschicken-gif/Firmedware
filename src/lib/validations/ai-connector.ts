import { z } from "zod";
import {
  AI_CONNECTOR_MODES,
  AI_CONNECTOR_PROVIDERS,
  AI_REQUEST_PURPOSES,
} from "@/lib/ai/types";

export const aiPolicyCheckBodySchema = z.object({
  provider: z.enum(AI_CONNECTOR_PROVIDERS),
  mode: z.enum(AI_CONNECTOR_MODES),
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  purpose: z.enum(AI_REQUEST_PURPOSES),
  prompt: z.string().max(32_000),
  contextSummary: z.string().max(8_000).optional(),
  includesClientConfidentialInfo: z.boolean(),
  includesPrivilegedInfo: z.boolean(),
  includesPersonalData: z.boolean(),
  includesExternalDocumentLinks: z.boolean(),
  includesLocalPaths: z.boolean(),
  userConfirmed: z.boolean(),
  adminApproved: z.boolean().optional(),
  otherProviderLabel: z.string().max(120).optional(),
});

export type AIPolicyCheckBody = z.infer<typeof aiPolicyCheckBodySchema>;
