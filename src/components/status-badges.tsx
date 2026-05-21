"use client";

import { Badge } from "@/components/ui/badge";
import {
  ClientStatus,
  MatterStatus,
  TaskStatus,
} from "@prisma/client";
import { useI18n } from "@/lib/i18n/client";
import {
  billingStatusLabel,
  clientStatusLabel,
  matterStatusLabel,
  taskStatusLabel,
} from "@/lib/i18n/enums";
import type { BillingStatus } from "@/lib/billing-status";

export function MatterStatusBadge({ status }: { status: MatterStatus }) {
  const { t } = useI18n();
  const variant =
    status === "OPEN"
      ? "success"
      : status === "CLOSED"
        ? "secondary"
        : status === "ON_HOLD"
          ? "warning"
          : "outline";
  return (
    <Badge variant={variant}>{matterStatusLabel(t, status)}</Badge>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { t } = useI18n();
  const variant =
    status === "ACTIVE" ? "success" : status === "INACTIVE" ? "secondary" : "outline";
  return (
    <Badge variant={variant}>{clientStatusLabel(t, status)}</Badge>
  );
}

export function BillingStatusBadge({ status }: { status: BillingStatus | string }) {
  const { t } = useI18n();
  const variant =
    status === "PAID"
      ? "success"
      : status === "OVERDUE"
        ? "danger"
        : status === "PARTIALLY_PAID"
          ? "warning"
          : status === "CANCELLED" || status === "WRITTEN_OFF"
            ? "secondary"
            : status === "SENT"
              ? "outline"
              : "outline";
  return (
    <Badge variant={variant}>{billingStatusLabel(t, status)}</Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useI18n();
  const variant =
    status === "DONE"
      ? "success"
      : status === "CANCELLED"
        ? "secondary"
        : status === "IN_PROGRESS"
          ? "warning"
          : "outline";
  return (
    <Badge variant={variant}>{taskStatusLabel(t, status)}</Badge>
  );
}
