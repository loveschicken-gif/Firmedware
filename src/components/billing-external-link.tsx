"use client";

import { ExternalLink } from "lucide-react";
import { logBillingExternalLinkAction } from "@/lib/actions/billing";

export function BillingExternalLink({
  href,
  billingId,
  title,
  label,
  ariaLabel,
}: {
  href: string;
  billingId: string;
  title: string;
  label: string;
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 text-slate-900 hover:underline"
      onClick={() => {
        void logBillingExternalLinkAction(billingId, title);
      }}
    >
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}
