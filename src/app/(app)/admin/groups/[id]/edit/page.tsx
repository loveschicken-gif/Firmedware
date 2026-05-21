import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { GroupForm } from "../../group-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { notDeleted } from "@/lib/soft-delete";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", admin.id);
  const { id } = await params;

  const [group, users] = await Promise.all([
    prisma.userGroup.findFirst({
      where: { id, ...notDeleted },
      include: { members: true },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  if (!group) notFound();

  return (
    <div>
      <PageHeader title={tn("groups.editTitle")} />
      <GroupForm group={group} users={users} />
    </div>
  );
}
