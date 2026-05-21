import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TagList } from "@/components/tag-list";
import { MatterStatusBadge } from "@/components/status-badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { globalSearch } from "@/lib/search";
import { requireSessionUser } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireSessionUser();
  const { tn } = await getServerNamespaceI18n("common", user.id);
  const { q } = await searchParams;
  const results = q ? await globalSearch(user, q) : null;

  return (
    <div>
      <PageHeader
        title={tn("search.title")}
        description={tn("search.description")}
      />
      <form method="get" className="mb-8 flex max-w-xl gap-2">
        <Input
          name="q"
          placeholder={tn("search.placeholder")}
          defaultValue={q ?? ""}
          className="flex-1"
        />
        <Button type="submit">{tn("search.submit")}</Button>
      </form>

      {results && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {tn("search.clientsSection", { count: results.clients.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.clients.length === 0 ? (
                <p className="text-sm text-slate-500">{tn("search.noClients")}</p>
              ) : (
                <ul className="space-y-2">
                  {results.clients.map((c) => (
                    <li key={c.id}>
                      <Link href={`/clients/${c.id}`} className="font-medium hover:underline">
                        {c.displayName}
                      </Link>
                      {c.companyName && (
                        <span className="text-slate-500"> · {c.companyName}</span>
                      )}
                      <div className="mt-1">
                        <TagList tags={c.tags} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {tn("search.mattersSection", { count: results.matters.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.matters.length === 0 ? (
                <p className="text-sm text-slate-500">{tn("search.noMatters")}</p>
              ) : (
                <ul className="space-y-2">
                  {results.matters.map((m) => (
                    <li key={m.id}>
                      <Link href={`/matters/${m.id}`} className="font-medium hover:underline">
                        {m.title}
                      </Link>
                      <span className="text-slate-500"> · {m.client.displayName}</span>
                      <div className="mt-1 flex gap-2">
                        <MatterStatusBadge status={m.status} />
                        <TagList tags={m.tags} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {tn("search.documentsSection", { count: results.documents.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.documents.length === 0 ? (
                <p className="text-sm text-slate-500">{tn("search.noDocuments")}</p>
              ) : (
                <ul className="space-y-2">
                  {results.documents.map((d) => (
                    <li key={d.id}>
                      <Link href={`/documents/${d.id}`} className="font-medium hover:underline">
                        {d.title}
                      </Link>
                      <span className="text-slate-500">
                        {" "}
                        · {d.client.displayName}
                        {d.matter ? ` · ${d.matter.title}` : ""}
                      </span>
                      <div className="mt-1">
                        <TagList tags={d.tags} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
