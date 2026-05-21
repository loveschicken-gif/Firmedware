import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { BillingStatusBadge } from "@/components/status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBillingRecordsForUser } from "@/lib/actions/billing";
import { requireBillingEnabled } from "@/lib/billing";
import { canWrite } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import type { BillingStatus } from "@/lib/billing-status";

export default async function BillingPage() {
  await requireBillingEnabled();
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }] = await Promise.all([
    getServerNamespaceI18n("billing", user.id),
    getServerNamespaceI18n("common", user.id),
  ]);
  const records = await getBillingRecordsForUser();

  return (
    <div>
      <PageHeader
        title={tn("title")}
        description={tn("description")}
        action={
          canWrite(user)
            ? { label: tn("newRecord"), href: "/billing/new" }
            : undefined
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("title")}</TableHead>
              <TableHead>{tn("table.invoiceNumber")}</TableHead>
              <TableHead>{tc("client")}</TableHead>
              <TableHead>{tc("matter")}</TableHead>
              <TableHead>{tn("table.amount")}</TableHead>
              <TableHead>{tn("table.dueDate")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500">
                  {tn("empty")}
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/billing/${r.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </TableCell>
                  <TableCell>{r.invoiceNumber ?? tc("emptyValue")}</TableCell>
                  <TableCell>
                    <Link href={`/clients/${r.client.id}`} className="hover:underline">
                      {r.client.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {r.matter ? (
                      <Link href={`/matters/${r.matter.id}`} className="hover:underline">
                        {r.matter.title}
                      </Link>
                    ) : (
                      tc("emptyValue")
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(r.amount, r.currency)}</TableCell>
                  <TableCell>{formatDate(r.dueDate)}</TableCell>
                  <TableCell>
                    <BillingStatusBadge status={r.status as BillingStatus} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
