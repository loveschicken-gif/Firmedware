import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { WorkflowStatusForm } from "../workflow-status-form";

export default async function NewWorkflowStatusPage() {
  const user = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", user.id);

  return (
    <div>
      <PageHeader title={tn("workflow.newTitle")} />
      <WorkflowStatusForm />
    </div>
  );
}
