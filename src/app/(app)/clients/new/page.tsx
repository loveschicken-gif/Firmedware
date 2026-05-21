import { PageHeader } from "@/components/page-header";
import { ClientForm } from "../client-form";
import { getAllTags } from "@/lib/actions/tags";
import { requireSessionUser } from "@/lib/session";
import { canWrite } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { getFirmFeatureFlags } from "@/lib/firm-feature-flags";

export default async function NewClientPage() {
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect("/clients");
  const { tn } = await getServerNamespaceI18n("clients", user.id);
  const [tags, { enableEntityNotes }] = await Promise.all([
    getAllTags(),
    getFirmFeatureFlags(),
  ]);

  return (
    <div>
      <PageHeader title={tn("newTitle")} description={tn("newDescription")} />
      <ClientForm tags={tags} enableEntityNotes={enableEntityNotes} />
    </div>
  );
}
