import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "../../client-form";
import { getAllTags } from "@/lib/actions/tags";
import { prisma } from "@/lib/prisma";
import { canWrite, clientWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect(`/clients/${id}`);
  const { tn } = await getServerNamespaceI18n("clients", user.id);

  const [client, tags, { enableEntityNotes }] = await Promise.all([
    prisma.client.findFirst({
      where: { id, ...clientWhereForUser(user) },
      include: { tags: { include: { tag: true } } },
    }),
    getAllTags(),
    getFirmFeatureFlags(),
  ]);

  if (!client) notFound();

  return (
    <div>
      <PageHeader title={tn("editTitle")} />
      <ClientForm client={client} tags={tags} enableEntityNotes={enableEntityNotes} />
    </div>
  );
}
