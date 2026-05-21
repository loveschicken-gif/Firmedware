import Link from "next/link";
import {
  Activity,
  Settings,
  UserCog,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivityLogsForAssignee } from "@/lib/activity-access";
import { isAdmin } from "@/lib/rbac";
import { requireSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getServerNamespaceI18n } from "@/lib/i18n/server";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export default async function AccountPage() {
  const sessionUser = await requireSessionUser();
  const [{ tn }, { tn: tc }] = await Promise.all([
    getServerNamespaceI18n("account", sessionUser.id),
    getServerNamespaceI18n("common", sessionUser.id),
  ]);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { email: true, name: true, preferredLanguage: true, role: true },
  });

  const admin = isAdmin(sessionUser);
  const myActivity = admin
    ? []
    : await getActivityLogsForAssignee(sessionUser, 20);

  const adminLinks = [
    {
      href: "/admin/users",
      title: tn("adminHub.usersTitle"),
      description: tn("adminHub.usersDescription"),
      icon: UserCog,
    },
    {
      href: "/admin/groups",
      title: tn("adminHub.groupsTitle"),
      description: tn("adminHub.groupsDescription"),
      icon: UsersRound,
    },
    {
      href: "/activity",
      title: tn("adminHub.activityTitle"),
      description: tn("adminHub.activityDescription"),
      icon: Activity,
    },
    {
      href: "/admin/security",
      title: tn("adminHub.securityTitle"),
      description: tn("adminHub.securityDescription"),
      icon: Settings,
    },
    {
      href: "/admin/workflow-statuses",
      title: tn("adminHub.workflowTitle"),
      description: tn("adminHub.workflowDescription"),
      icon: Settings,
    },
    {
      href: "/admin/settings",
      title: tn("adminHub.settingsTitle"),
      description: tn("adminHub.settingsDescription"),
      icon: Settings,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader title={tn("title")} description={tn("description")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tn("profile.title")}</CardTitle>
            <CardDescription>{tn("profile.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tn("security.title")}</CardTitle>
            <CardDescription>{tn("security.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>

      {!admin && (
        <Card>
          <CardHeader>
            <CardTitle>{tn("myActivity.title")}</CardTitle>
            <CardDescription>{tn("myActivity.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityLogPanel
              items={myActivity}
              emptyLabel={tn("myActivity.empty")}
              immutableNotice={tc("activityLog.immutableNotice")}
              downloadLabel={tc("activityLog.downloadCsv")}
              entryCountLabel={tc("activityLog.entryCount", {
                count: String(myActivity.length),
              })}
            />
          </CardContent>
        </Card>
      )}

      {admin && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {tn("adminHub.title")}
          </h2>
          <p className="mb-4 text-sm text-slate-500">{tn("adminHub.description")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
