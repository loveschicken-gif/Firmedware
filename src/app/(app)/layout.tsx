import { ConfidentialityNotice } from "@/components/confidentiality-notice";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { getFirmSettings } from "@/lib/firm-settings";
import { requireSessionUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUser();
  const settings = await getFirmSettings();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        userName={user.name}
        userRole={user.role}
        firmName={settings.firmName}
        enableBilling={settings.enableBilling}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ConfidentialityNotice
          enabled={settings.confidentialityNoticeEnabled}
        />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
