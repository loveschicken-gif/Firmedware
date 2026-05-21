import { PageHeader } from "@/components/page-header";
import { UserForm } from "../user-form";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function NewUserPage() {
  const admin = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", admin.id);
  return (
    <div>
      <PageHeader title={tn("users.newTitle")} />
      <UserForm />
    </div>
  );
}
