import { PageHeader } from "@/components/page-header";
import { getFirmSettings } from "@/lib/firm-settings";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import { FirmSettingsForm } from "./firm-settings-form";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", admin.id);
  const settings = await getFirmSettings();

  return (
    <div>
      <PageHeader
        title={tn("settings.title")}
        description={tn("settings.description")}
      />
      <FirmSettingsForm settings={settings} />
    </div>
  );
}
