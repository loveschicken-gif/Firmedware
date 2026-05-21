import Link from "next/link";
import { MatterStatus } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  clientWhereForUser,
  matterWhereForUser,
  taskWhereForUser,
} from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/rbac";
import { getActivityForUser } from "@/lib/search";
import { formatDateTime } from "@/lib/utils";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { Activity, Briefcase, CheckSquare, Receipt, Users } from "lucide-react";
import { getBillingDashboardStats } from "@/lib/actions/billing";
import { isBillingEnabled } from "@/lib/billing";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const { tn } = await getServerNamespaceI18n("dashboard", user.id);
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const billingOn = await isBillingEnabled();

  const [
    openMatters,
    clientsCount,
    overdueTasks,
    dueSoonTasks,
    recentActivity,
    billingStats,
  ] = await Promise.all([
    prisma.matter.count({
      where: {
        ...matterWhereForUser(user),
        status: MatterStatus.OPEN,
      },
    }),
    prisma.client.count({ where: clientWhereForUser(user) }),
    prisma.task.count({
      where: {
        ...taskWhereForUser(user),
        dueAt: { lt: now },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    prisma.task.count({
      where: {
        ...taskWhereForUser(user),
        dueAt: { gte: now, lte: weekAhead },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    getActivityForUser(user, 10),
    billingOn ? getBillingDashboardStats(user) : null,
  ]);

  const stats = [
    { label: tn("stat.openMatters"), value: openMatters, icon: Briefcase, href: "/matters" },
    { label: tn("stat.clients"), value: clientsCount, icon: Users, href: "/clients" },
    { label: tn("stat.overdueTasks"), value: overdueTasks, icon: CheckSquare, href: "/tasks?filter=overdue" },
    { label: tn("stat.dueThisWeek"), value: dueSoonTasks, icon: CheckSquare, href: "/tasks?filter=week" },
    ...(billingOn && billingStats
      ? [
          {
            label: tn("stat.billingOutstanding"),
            value: billingStats.outstanding,
            icon: Receipt,
            href: "/billing",
          },
          {
            label: tn("stat.billingOverdue"),
            value: billingStats.overdue,
            icon: Receipt,
            href: "/billing",
          },
          {
            label: tn("stat.billingPaidMonth"),
            value: billingStats.paidThisMonth,
            icon: Receipt,
            href: "/billing",
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title={tn("title")}
        description={tn("description")}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/clients/new"
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {tn("quickAction.newClient")}
        </Link>
        <Link
          href="/matters/new"
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {tn("quickAction.newMatter")}
        </Link>
        <Link
          href="/documents/new"
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {tn("quickAction.documentLink")}
        </Link>
        {billingOn && (
          <Link
            href="/billing/new"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {tn("quickAction.billingRecord")}
          </Link>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            {tn("recentActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">{tn("noRecentActivity")}</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={item.id} className="text-sm">
                  <span className="text-slate-900">{item.summary}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {item.user.name} · {formatDateTime(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {isAdmin(user) && (
            <Link
              href="/activity"
              className="mt-4 inline-block text-sm font-medium text-slate-700 hover:underline"
            >
              {tn("viewAllActivity")}
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
