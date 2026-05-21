import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TaskStatusBadge } from "@/components/status-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTasksForUser } from "@/lib/actions/tasks";
import { canWrite } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { formatSprintLabel } from "@/lib/sprint";
import { getServerI18n, getServerNamespaceI18n } from "@/lib/i18n/server";
import type { Translator } from "@/lib/i18n/messages";
import type { Task } from "@prisma/client";

type TaskRow = Task & {
  client: { id: string; displayName: string } | null;
  matter: { id: string; title: string } | null;
  assignee: { id: string; name: string } | null;
};

function groupTasksBySprint(tasks: TaskRow[]) {
  const groups = new Map<string, TaskRow[]>();
  const unscheduled: TaskRow[] = [];

  for (const task of tasks) {
    if (!task.sprintWeekStart) {
      unscheduled.push(task);
      continue;
    }
    const key = task.sprintWeekStart.toISOString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(task);
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  return { sorted, unscheduled };
}

function TaskTable({
  tasks,
  tn,
  tc,
}: {
  tasks: TaskRow[];
  tn: Translator;
  tc: Translator;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tc("title")}</TableHead>
          <TableHead>{tc("status")}</TableHead>
          <TableHead>{tn("table.due")}</TableHead>
          <TableHead>{tc("assignee")}</TableHead>
          <TableHead>{tc("matter")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                {task.title}
              </Link>
            </TableCell>
            <TableCell>
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell>{formatDate(task.dueAt)}</TableCell>
            <TableCell>{task.assignee?.name ?? tc("emptyValue")}</TableCell>
            <TableCell>
              {task.matter ? (
                <Link href={`/matters/${task.matter.id}`} className="hover:underline">
                  {task.matter.title}
                </Link>
              ) : (
                tc("emptyValue")
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireSessionUser();
  const [{ tn }, { tn: tc }, { t, locale }] = await Promise.all([
    getServerNamespaceI18n("tasks", user.id),
    getServerNamespaceI18n("common", user.id),
    getServerI18n(user.id),
  ]);
  const { filter } = await searchParams;
  const tasks = await getTasksForUser(filter);
  const { sorted, unscheduled } = groupTasksBySprint(tasks);

  return (
    <div>
      <PageHeader
        title={tn("title")}
        description={tn("description")}
        action={canWrite(user) ? { label: tn("newTask"), href: "/tasks/new" } : undefined}
      />
      <div className="mb-4 flex gap-2">
        <Link
          href="/tasks"
          className={`rounded-md px-3 py-1.5 text-sm ${!filter ? "bg-slate-900 text-white" : "bg-white text-slate-600 border"}`}
        >
          {tn("filter.all")}
        </Link>
        <Link
          href="/tasks?filter=overdue"
          className={`rounded-md px-3 py-1.5 text-sm ${filter === "overdue" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border"}`}
        >
          {tn("filter.overdue")}
        </Link>
        <Link
          href="/tasks?filter=week"
          className={`rounded-md px-3 py-1.5 text-sm ${filter === "week" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border"}`}
        >
          {tn("filter.dueThisWeek")}
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">{tn("empty")}</p>
      ) : (
        <div className="space-y-8">
          {sorted.map(([key, sprintTasks]) => (
            <section key={key} className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                {formatSprintLabel(new Date(key), t, locale)}
              </h2>
              <TaskTable tasks={sprintTasks} tn={tn} tc={tc} />
            </section>
          ))}
          {unscheduled.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-4 text-sm font-semibold text-slate-500">{tn("unscheduled")}</h2>
              <TaskTable tasks={unscheduled} tn={tn} tc={tc} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
