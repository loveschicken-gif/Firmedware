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
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getServerI18n, getServerNamespaceI18n } from "@/lib/i18n/server";
import { roleLabel } from "@/lib/i18n/enums";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const [{ tn }, { tn: tc }, { t }] = await Promise.all([
    getServerNamespaceI18n("admin", admin.id),
    getServerNamespaceI18n("common", admin.id),
    getServerI18n(admin.id),
  ]);
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={tn("users.title")}
        description={tn("users.description")}
        action={{ label: tn("users.newUser"), href: "/admin/users/new" }}
      />
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tn("users.form.name")}</TableHead>
              <TableHead>{tn("users.table.email")}</TableHead>
              <TableHead>{tn("users.table.role")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {user.name}
                  </Link>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabel(t, user.role)}</Badge>
                </TableCell>
                <TableCell>
                  {user.active ? (
                    <Badge variant="success">{tc("active")}</Badge>
                  ) : (
                    <Badge variant="secondary">{tc("inactive")}</Badge>
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
