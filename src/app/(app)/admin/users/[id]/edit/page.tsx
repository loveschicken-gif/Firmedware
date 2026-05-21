import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "../../user-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", admin.id);
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div>
      <PageHeader title={tn("users.editTitle")} />
      <UserForm user={user} />
    </div>
  );
}
