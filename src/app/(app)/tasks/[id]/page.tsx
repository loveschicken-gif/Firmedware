import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityAction, EntityType } from "@prisma/client";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { TaskStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { logActivity } from "@/lib/activity";
import { getEntityActivityForUser, canViewEntityActivity } from "@/lib/activity-access";
import { prisma } from "@/lib/prisma";
import { canWrite, taskWhereForUser } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { deleteTaskAction } from "@/lib/actions/tasks";
import { formatDate } from "@/lib/utils";
import { formatSprintLabel } from "@/lib/sprint";
import { getServerI18n, getServerNamespaceI18n } from "@/lib/i18n/server";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }, { t, locale }] = await Promise.all([
    getServerNamespaceI18n("tasks", user.id),
    getServerNamespaceI18n("common", user.id),
    getServerI18n(user.id),
  ]);

  const task = await prisma.task.findFirst({
    where: { id, ...taskWhereForUser(user) },
    include: {
      client: true,
      matter: true,
      assignee: true,
    },
  });

  if (!task) notFound();

  await logActivity({
    userId: user.id,
    entityType: EntityType.TASK,
    entityId: id,
    action: ActivityAction.VIEW,
    summary: `Viewed task "${task.title}"`,
  });

  const showActivity = await canViewEntityActivity(user, EntityType.TASK, id);
  const activity = showActivity
    ? await getEntityActivityForUser(user, EntityType.TASK, id)
    : [];

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
          <TaskStatusBadge status={task.status} />
        </div>
        {canWrite(user) && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/tasks/${id}/edit`}>{tc("edit")}</Link>
            </Button>
            <DeleteButton action={deleteTaskAction.bind(null, id)} label={tn("archive")} />
          </div>
        )}
      </div>
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">{tn("detail.due")}</p>
                <p>{formatDate(task.dueAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{tn("detail.sprintWeek")}</p>
                <p>
                  {task.sprintWeekStart
                    ? formatSprintLabel(task.sprintWeekStart, t, locale)
                    : tc("emptyValue")}
                </p>
              </div>
          <div>
            <p className="text-xs text-slate-500">{tc("assignee")}</p>
            <p>{task.assignee?.name ?? tc("emptyValue")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tc("client")}</p>
            {task.client ? (
              <Link href={`/clients/${task.client.id}`} className="hover:underline">
                {task.client.displayName}
              </Link>
            ) : (
              tc("emptyValue")
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">{tc("matter")}</p>
            {task.matter ? (
              <Link href={`/matters/${task.matter.id}`} className="hover:underline">
                {task.matter.title}
              </Link>
            ) : (
              tc("emptyValue")
            )}
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500">{tn("detail.description")}</p>
            <p className="whitespace-pre-wrap">{task.description ?? tc("emptyValue")}</p>
          </div>
        </CardContent>
      </Card>
      {showActivity && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">{tc("activity")}</h2>
          <ActivityLogPanel
            items={activity}
            emptyLabel={tc("activityLog.empty")}
            immutableNotice={tc("activityLog.immutableNotice")}
            downloadLabel={tc("activityLog.downloadCsv")}
            entryCountLabel={tc("activityLog.entryCount", {
              count: String(activity.length),
            })}
            entityType={EntityType.TASK}
            entityId={id}
          />
        </div>
      )}
    </div>
  );
}
