import { PageHeader } from "@/components/page-header";
import { GroupForm } from "../group-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function NewGroupPage() {
  const admin = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", admin.id);
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  return (
    <div>
      <PageHeader title={tn("groups.newTitle")} />
      <GroupForm users={users} />
    </div>
  );
}
