import { ActivityAction, ActivityCategory, EntityType } from "@prisma/client";
import { logActivity } from "@/lib/activity";

/**
 * Future ActivityAction values for forks that execute AI requests.
 * Core v1.2 logs policy checks via metadata.kind only.
 */
export const AI_ACTIVITY_KIND = {
  AI_POLICY_CHECKED: "AI_POLICY_CHECKED",
  AI_REQUEST_BLOCKED: "AI_REQUEST_BLOCKED",
  AI_CONNECTOR_ENABLED: "AI_CONNECTOR_ENABLED",
  AI_CONNECTOR_DISABLED: "AI_CONNECTOR_DISABLED",
  AI_PROVIDER_CHANGED: "AI_PROVIDER_CHANGED",
  AI_REQUEST_CREATED: "AI_REQUEST_CREATED",
  AI_OUTPUT_GENERATED: "AI_OUTPUT_GENERATED",
} as const;

export type AIPolicyCheckMetadata = {
  kind: typeof AI_ACTIVITY_KIND.AI_POLICY_CHECKED;
  allowed: boolean;
  provider: string;
  mode: string;
  purpose: string;
  matterId?: string;
  clientId?: string;
  requiresAdminApproval?: boolean;
  requiresRedaction?: boolean;
};

/** Metadata only — never prompts, outputs, secrets, or privileged text. */
export async function logAIPolicyChecked(
  userId: string,
  meta: Omit<AIPolicyCheckMetadata, "kind">
) {
  const summary = meta.allowed
    ? "AI policy check: allowed"
    : "AI policy check: blocked";

  await logActivity({
    userId,
    entityType: EntityType.FIRM_SETTINGS,
    entityId: "default",
    category: ActivityCategory.ADMIN,
    action: ActivityAction.VIEW,
    summary,
    metadata: {
      kind: AI_ACTIVITY_KIND.AI_POLICY_CHECKED,
      ...meta,
    },
  });
}
