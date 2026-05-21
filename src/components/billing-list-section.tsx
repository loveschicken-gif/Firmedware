import Link from "next/link";
import { BillingStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BillingStatus } from "@/lib/billing-status";

type BillingListItem = {
  id: string;
  title: string;
  invoiceNumber: string | null;
  amount: { toString(): string };
  currency: string;
  dueDate: Date | null;
  status: string;
  matter?: { id: string; title: string } | null;
};

export function BillingListSection({
  records,
  title,
  emptyLabel,
  viewAllHref,
  viewAllLabel,
  newHref,
  newLabel,
  canAdd,
}: {
  records: BillingListItem[];
  title: string;
  emptyLabel: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  newHref?: string;
  newLabel?: string;
  canAdd?: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {canAdd && newHref && newLabel && (
          <Button asChild size="sm" variant="outline">
            <Link href={newHref}>{newLabel}</Link>
          </Button>
        )}
      </div>
      {records.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
              <Link href={`/billing/${r.id}`} className="font-medium hover:underline">
                {r.title}
              </Link>
              {r.invoiceNumber && (
                <span className="text-slate-500">({r.invoiceNumber})</span>
              )}
              <span className="text-slate-600">
                {formatCurrency(r.amount, r.currency)}
              </span>
              {r.dueDate && (
                <span className="text-slate-500">{formatDate(r.dueDate)}</span>
              )}
              <BillingStatusBadge status={r.status as BillingStatus} />
              {r.matter && (
                <Link
                  href={`/matters/${r.matter.id}`}
                  className="text-slate-500 hover:underline"
                >
                  {r.matter.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {viewAllHref && viewAllLabel && records.length > 0 && (
        <Link
          href={viewAllHref}
          className="mt-3 inline-block text-sm font-medium text-slate-700 hover:underline"
        >
          {viewAllLabel}
        </Link>
      )}
    </div>
  );
}
