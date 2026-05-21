import { PageHeader } from "@/components/page-header";
import { getFirmSettings } from "@/lib/firm-settings";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { SecuritySettingsForm } from "./security-settings-form";

export default async function AdminSecurityPage() {
  const user = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", user.id);
  const settings = await getFirmSettings();

  return (
    <div>
      <PageHeader
        title={tn("security.title")}
        description={tn("security.description")}
      />
      <SecuritySettingsForm settings={settings} />
    </div>
  );
}
