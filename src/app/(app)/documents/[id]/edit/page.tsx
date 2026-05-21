import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DocumentForm } from "../../document-form";
import { getAllTags } from "@/lib/actions/tags";
import { prisma } from "@/lib/prisma";
import { canWrite, clientWhereForUser, documentWhereForUser, matterWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";
import { getFirmSettings } from "@/lib/firm-settings";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect(`/documents/${id}`);
  const { tn } = await getServerNamespaceI18n("documents", user.id);

  const [document, clients, matters, tags, settings, { enableEntityNotes }] =
    await Promise.all([
    prisma.documentLink.findFirst({
      where: { id, ...documentWhereForUser(user) },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.client.findMany({
      where: clientWhereForUser(user),
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true },
    }),
    prisma.matter.findMany({
      where: matterWhereForUser(user),
      orderBy: { title: "asc" },
      select: { id: true, title: true, clientId: true },
    }),
    getAllTags(),
    getFirmSettings(),
    getFirmFeatureFlags(),
  ]);

  if (!document) notFound();

  return (
    <div>
      <PageHeader title={tn("editTitle")} />
      <DocumentForm
        document={document}
        clients={clients}
        matters={matters}
        tags={tags}
        enableEntityNotes={enableEntityNotes}
        requirePermissionConfirm={settings.requireDocumentPermissionConfirm}
      />
    </div>
  );
}
