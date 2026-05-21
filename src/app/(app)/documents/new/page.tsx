import { PageHeader } from "@/components/page-header";
import { DocumentForm } from "../document-form";
import { getAllTags } from "@/lib/actions/tags";
import { prisma } from "@/lib/prisma";
import { clientWhereForUser, matterWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { canWrite } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";
import { getFirmSettings } from "@/lib/firm-settings";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; matterId?: string }>;
}) {
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect("/documents");
  const { tn } = await getServerNamespaceI18n("documents", user.id);
  const { clientId, matterId } = await searchParams;

  const [clients, matters, tags, settings, { enableEntityNotes }] = await Promise.all([
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

  return (
    <div>
      <PageHeader title={tn("newTitle")} />
      <DocumentForm
        clients={clients}
        matters={matters}
        tags={tags}
        defaultClientId={clientId}
        defaultMatterId={matterId}
        enableEntityNotes={enableEntityNotes}
        requirePermissionConfirm={settings.requireDocumentPermissionConfirm}
      />
    </div>
  );
}
