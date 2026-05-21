import { PageHeader } from "@/components/page-header";
import { MatterForm } from "../matter-form";
import { getActiveGroups } from "@/lib/actions/matters";
import { getAllTags } from "@/lib/actions/tags";
import { prisma } from "@/lib/prisma";
import { clientWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { canWrite } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";
import { getActiveWorkflowStatuses } from "@/lib/workflow";

export default async function NewMatterPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect("/matters");
  const { tn } = await getServerNamespaceI18n("matters", user.id);
  const { clientId } = await searchParams;

  const [clients, users, tags, groups, workflowStatuses, { enableEntityNotes }] =
    await Promise.all([
    prisma.client.findMany({
      where: clientWhereForUser(user),
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    getAllTags(),
    getActiveGroups(),
    getActiveWorkflowStatuses("MATTER"),
    getFirmFeatureFlags(),
  ]);

  return (
    <div>
      <PageHeader title={tn("newTitle")} description={tn("newDescription")} />
      <MatterForm
        clients={clients}
        users={users}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        tags={tags}
        workflowStatuses={workflowStatuses}
        defaultClientId={clientId}
        currentUserId={user.id}
        enableEntityNotes={enableEntityNotes}
      />
    </div>
  );
}
