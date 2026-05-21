import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TagList } from "@/components/tag-list";
import { ClientStatusBadge } from "@/components/status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClientsForUser } from "@/lib/actions/clients";
import { canWrite } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function ClientsPage() {
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }] = await Promise.all([
    getServerNamespaceI18n("clients", user.id),
    getServerNamespaceI18n("common", user.id),
  ]);
  const clients = await getClientsForUser();

  return (
    <div>
      <PageHeader
        title={tn("title")}
        description={tn("description")}
        action={
          canWrite(user) ? { label: tn("newClient"), href: "/clients/new" } : undefined
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tn("table.name")}</TableHead>
              <TableHead>{tn("table.company")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead>{tn("table.matters")}</TableHead>
              <TableHead>{tc("tags")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  {tn("empty")}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {client.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>{client.companyName ?? tc("emptyValue")}</TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                  <TableCell>{client._count.matters}</TableCell>
                  <TableCell>
                    <TagList tags={client.tags} />
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
