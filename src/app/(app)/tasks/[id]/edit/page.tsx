import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "../../task-form";
import { prisma } from "@/lib/prisma";
import { canWrite, clientWhereForUser, matterWhereForUser, taskWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect(`/tasks/${id}`);
  const { tn } = await getServerNamespaceI18n("tasks", user.id);

  const [task, clients, matters, users] = await Promise.all([
    prisma.task.findFirst({ where: { id, ...taskWhereForUser(user) } }),
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
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!task) notFound();

  return (
    <div>
      <PageHeader title={tn("editTitle")} />
      <TaskForm task={task} clients={clients} matters={matters} users={users} />
    </div>
  );
}
