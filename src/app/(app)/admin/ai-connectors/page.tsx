import { PageHeader } from "@/components/page-header";
import { getFirmSettings } from "@/lib/firm-settings";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { requireAdmin } from "@/lib/session";
import { AIConnectorsForm } from "./ai-connectors-form";

export default async function AdminAIConnectorsPage() {
  const admin = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", admin.id);
  const settings = await getFirmSettings();

  return (
    <div>
      <PageHeader
        title={tn("aiConnectors.title")}
        description={tn("aiConnectors.description")}
      />
      <AIConnectorsForm settings={settings} />
    </div>
  );
}
