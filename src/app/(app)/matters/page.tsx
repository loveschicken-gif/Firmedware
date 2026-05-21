import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TagList } from "@/components/tag-list";
import { WorkflowStatusBadge } from "@/components/workflow-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMattersForUser } from "@/lib/actions/matters";
import { canWrite, isAdmin } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function MattersPage() {
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }] = await Promise.all([
    getServerNamespaceI18n("matters", user.id),
    getServerNamespaceI18n("common", user.id),
  ]);
  const matters = await getMattersForUser();

  return (
    <div>
      <PageHeader
        title={tn("title")}
        description={tn("description")}
        action={
          canWrite(user) ? { label: tn("newMatter"), href: "/matters/new" } : undefined
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tn("table.title")}</TableHead>
              <TableHead>{tc("client")}</TableHead>
              <TableHead>{tn("table.caseNumber")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead>{tn("table.assigned")}</TableHead>
              <TableHead>{tc("tags")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500">
                  <p>{tn("empty")}</p>
                  {!isAdmin(user) && (
                    <p className="mt-1 text-xs">{tn("emptyHint")}</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              matters.map((matter) => (
                <TableRow key={matter.id}>
                  <TableCell>
                    <Link
                      href={`/matters/${matter.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {matter.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${matter.client.id}`} className="hover:underline">
                      {matter.client.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>{matter.caseNumber ?? tc("emptyValue")}</TableCell>
                  <TableCell>
                    {matter.workflowStatus ? (
                      <WorkflowStatusBadge status={matter.workflowStatus} />
                    ) : (
                      <span className="text-sm text-slate-500">{tc("emptyValue")}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {matter.assignments.map((a) => a.user.name).join(", ") || tc("emptyValue")}
                  </TableCell>
                  <TableCell>
                    <TagList tags={matter.tags} />
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
