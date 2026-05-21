import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getGroupsForAdmin } from "@/lib/actions/groups";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function AdminGroupsPage() {
  const admin = await requireAdmin();
  const [{ tn }, { tn: tc }] = await Promise.all([
    getServerNamespaceI18n("admin", admin.id),
    getServerNamespaceI18n("common", admin.id),
  ]);
  const groups = await getGroupsForAdmin();

  return (
    <div>
      <PageHeader
        title={tn("groups.title")}
        description={tn("groups.description")}
        action={{ label: tn("groups.newGroup"), href: "/admin/groups/new" }}
      />
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{tn("groups.table.members")}</TableHead>
              <TableHead>{tn("groups.table.matters")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500">
                  {tn("groups.empty")}
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Link
                      href={`/admin/groups/${group.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell>{group._count.members}</TableCell>
                  <TableCell>{group._count.matterLinks}</TableCell>
                  <TableCell>
                    {group.active ? (
                      <Badge variant="success">{tc("active")}</Badge>
                    ) : (
                      <Badge variant="secondary">{tc("inactive")}</Badge>
                    )}
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
