export const BILLING_STATUSES = [
  "DRAFT",
  "SENT",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "WRITTEN_OFF",
] as const;

export type BillingStatus = (typeof BILLING_STATUSES)[number];

export function isBillingStatus(value: string): value is BillingStatus {
  return (BILLING_STATUSES as readonly string[]).includes(value);
}
