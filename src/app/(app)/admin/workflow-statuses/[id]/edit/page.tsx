import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { WorkflowStatusForm } from "../../workflow-status-form";

export default async function EditWorkflowStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  const { tn } = await getServerNamespaceI18n("admin", user.id);

  const status = await prisma.workflowStatus.findUnique({ where: { id } });
  if (!status) notFound();

  return (
    <div>
      <PageHeader title={tn("workflow.editTitle")} />
      <WorkflowStatusForm status={status} />
    </div>
  );
}
