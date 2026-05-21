import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BillingForm } from "@/app/(app)/billing/billing-form";
import {
  getClientsForBillingForm,
  getMattersForBillingForm,
} from "@/lib/actions/billing";
import { requireBillingEnabled } from "@/lib/billing";
import { canWrite } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function NewBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; matterId?: string }>;
}) {
  await requireBillingEnabled();
  const user = await requireSessionUser();
  if (!canWrite(user)) redirect("/billing");

  const { clientId, matterId } = await searchParams;
  const { tn } = await getServerNamespaceI18n("billing", user.id);
  const [clients, matters] = await Promise.all([
    getClientsForBillingForm(),
    getMattersForBillingForm(),
  ]);

  return (
    <div>
      <PageHeader title={tn("newRecord")} />
      <BillingForm
        clients={clients}
        matters={matters}
        defaultClientId={clientId}
        defaultMatterId={matterId}
      />
    </div>
  );
}
