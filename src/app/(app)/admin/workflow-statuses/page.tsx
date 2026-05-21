import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deactivateWorkflowStatusAction } from "@/lib/actions/workflow-statuses";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function WorkflowStatusesPage() {
  const user = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", user.id);

  const statuses = await prisma.workflowStatus.findMany({
    orderBy: [{ entityType: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title={tn("workflow.title")}
        description={tn("workflow.description")}
        action={{
          label: tn("workflow.newStatus"),
          href: "/admin/workflow-statuses/new",
        }}
      />
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tn("workflow.table.entity")}</TableHead>
              <TableHead>{tn("workflow.table.name")}</TableHead>
              <TableHead>{tn("workflow.table.label")}</TableHead>
              <TableHead>{tn("workflow.table.order")}</TableHead>
              <TableHead>{tn("workflow.table.flags")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((s) => (
              <TableRow key={s.id} className={!s.active ? "opacity-50" : ""}>
                <TableCell className="font-mono text-xs">{s.entityType}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  <WorkflowStatusBadge status={s} />
                </TableCell>
                <TableCell>{s.sortOrder}</TableCell>
                <TableCell className="text-xs text-slate-500">
                  {s.isDefault ? tn("workflow.flag.default") : ""}
                  {s.isDefault && s.isFinal ? " · " : ""}
                  {s.isFinal ? tn("workflow.flag.final") : ""}
                  {!s.active ? ` · ${tn("workflow.flag.inactive")}` : ""}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/workflow-statuses/${s.id}/edit`}>
                      {tn("workflow.edit")}
                    </Link>
                  </Button>
                  {s.active && (
                    <form
                      action={deactivateWorkflowStatusAction.bind(null, s.id)}
                      className="mt-2 inline"
                    >
                      <Button type="submit" variant="outline" size="sm">
                        {tn("workflow.deactivate")}
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
