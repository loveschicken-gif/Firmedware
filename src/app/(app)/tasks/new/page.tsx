import { PageHeader } from "@/components/page-header";
import { TaskForm } from "../task-form";
import { prisma } from "@/lib/prisma";
import { clientWhereForUser, matterWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { canWrite } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function NewTaskPage() {
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect("/tasks");
  const { tn } = await getServerNamespaceI18n("tasks", user.id);

  const [clients, matters, users] = await Promise.all([
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

  return (
    <div>
      <PageHeader title={tn("newTitle")} />
      <TaskForm clients={clients} matters={matters} users={users} />
    </div>
  );
}
