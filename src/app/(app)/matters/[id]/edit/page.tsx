import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { MatterForm } from "../../matter-form";
import { getActiveGroups } from "@/lib/actions/matters";
import { getAllTags } from "@/lib/actions/tags";
import { prisma } from "@/lib/prisma";
import { canWrite, clientWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { getMatterForUser } from "@/lib/matters";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";
import { getActiveWorkflowStatuses } from "@/lib/workflow";

export default async function EditMatterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect(`/matters/${id}`);
  const { tn } = await getServerNamespaceI18n("matters", user.id);

  const [matter, clients, users, tags, groups, workflowStatuses, { enableEntityNotes }] =
    await Promise.all([
    getMatterForUser(user, id),
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

  if (!matter) notFound();

  const matterForForm = {
    ...matter,
    assignments: matter.assignments.map((a) => ({ userId: a.userId })),
    groupAssignments: matter.groupAssignments.map((ga) => ({
      groupId: ga.groupId,
      label: ga.label,
      directoryPath: ga.directoryPath ?? "",
    })),
  };

  return (
    <div>
      <PageHeader title={tn("editTitle")} />
      <MatterForm
        matter={matterForForm}
        clients={clients}
        users={users}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        tags={tags}
        workflowStatuses={workflowStatuses}
        currentUserId={user.id}
        enableEntityNotes={enableEntityNotes}
      />
    </div>
  );
}
