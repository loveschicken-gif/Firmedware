"use client";

import { Badge } from "@/components/ui/badge";
import type { WorkflowStatus } from "@prisma/client";
import { useI18n } from "@/lib/i18n/client";
import { workflowStatusLabel } from "@/lib/workflow-labels";

export function WorkflowStatusBadge({
  status,
}: {
  status: Pick<WorkflowStatus, "labelEn" | "labelTh" | "name" | "color" | "isFinal">;
}) {
  const { locale } = useI18n();
  const label = workflowStatusLabel(status, locale);
  const variant = status.isFinal ? "secondary" : "outline";
  const style = status.color
    ? { borderColor: status.color, color: status.color }
    : undefined;

  return (
    <Badge variant={variant} style={style}>
      {label}
    </Badge>
  );
}
