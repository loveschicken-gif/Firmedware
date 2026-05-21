import type { Locale } from "@/lib/i18n/config";
import type { MatterStatus, WorkflowStatus } from "@prisma/client";

export function workflowStatusLabel(
  status: Pick<WorkflowStatus, "labelEn" | "labelTh" | "name">,
  locale: Locale
) {
  if (locale === "th" && status.labelTh) return status.labelTh;
  if (status.labelEn) return status.labelEn;
  return status.name;
}

/** Map workflow status to legacy MatterStatus for backward compatibility. */
export function legacyMatterStatusFromWorkflow(
  status: Pick<WorkflowStatus, "name" | "isFinal">
): MatterStatus {
  const n = status.name.toLowerCase();
  if (status.isFinal || n.includes("closed") || n.includes("archived")) {
    return "CLOSED";
  }
  if (n.includes("pending") || n.includes("waiting")) {
    return "PENDING";
  }
  if (n.includes("hold")) {
    return "ON_HOLD";
  }
  return "OPEN";
}
