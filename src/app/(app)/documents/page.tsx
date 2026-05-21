import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TagList } from "@/components/tag-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDocumentsForUser } from "@/lib/actions/documents";
import { canWrite } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { SensitivityBadge } from "@/components/sensitivity-badge";
import {
  documentProviderLabel,
  documentReferenceTypeLabel,
} from "@/lib/i18n/enums";
import { canOpenInBrowser } from "@/lib/document-reference";
import { getServerI18n, getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function DocumentsPage() {
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }, { t }] = await Promise.all([
    getServerNamespaceI18n("documents", user.id),
    getServerNamespaceI18n("common", user.id),
    getServerI18n(user.id),
  ]);
  const documents = await getDocumentsForUser();

  return (
    <div>
      <PageHeader
        title={tn("title")}
        description={tn("description")}
        action={
          canWrite(user)
            ? { label: tn("addLink"), href: "/documents/new" }
            : undefined
        }
      />
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("title")}</TableHead>
              <TableHead>{tc("client")}</TableHead>
              <TableHead>{tc("matter")}</TableHead>
              <TableHead>{tn("table.referenceType")}</TableHead>
              <TableHead>{tn("table.provider")}</TableHead>
              <TableHead>{tn("table.sensitivity")}</TableHead>
              <TableHead>{tc("tags")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500">
                  {tn("empty")}
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {doc.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${doc.client.id}`} className="hover:underline">
                      {doc.client.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {doc.matter ? (
                      <Link href={`/matters/${doc.matter.id}`} className="hover:underline">
                        {doc.matter.title}
                      </Link>
                    ) : (
                      tc("emptyValue")
                    )}
                  </TableCell>
                  <TableCell>
                    {documentReferenceTypeLabel(t, doc.referenceType)}
                  </TableCell>
                  <TableCell>
                    {documentProviderLabel(t, doc.provider, doc.providerLabel)}
                  </TableCell>
                  <TableCell>
                    <SensitivityBadge sensitivity={doc.sensitivity} />
                  </TableCell>
                  <TableCell>
                    <TagList tags={doc.tags} />
                  </TableCell>
                  <TableCell>
                    {canOpenInBrowser(doc.referenceType, doc.url) ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-slate-500 hover:text-slate-900"
                        aria-label={tn("detail.openExternalAria")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-xs text-slate-500 hover:text-slate-900"
                      >
                        {tn("detail.openReference")}
                      </Link>
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
