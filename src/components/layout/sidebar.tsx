"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CheckSquare,
  Search,
  Activity,
  Tags,
  UserCog,
  UsersRound,
  Settings,
  Shield,
  ListOrdered,
  LogOut,
  Receipt,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/client";
import { roleLabel } from "@/lib/i18n/enums";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/clients", labelKey: "nav.clients", icon: Users },
  { href: "/matters", labelKey: "nav.matters", icon: Briefcase },
  { href: "/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { href: "/billing", labelKey: "nav.billing", icon: Receipt, billingOnly: true },
  { href: "/search", labelKey: "nav.search", icon: Search },
  { href: "/tags", labelKey: "nav.tags", icon: Tags, adminOnly: true },
] as const;

export function Sidebar({
  userName,
  userRole,
  firmName,
  enableBilling = false,
}: {
  userName: string;
  userRole: Role;
  firmName: string;
  enableBilling?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isAdmin = userRole === "ADMIN";

  const visibleNav = navItems.filter((item) => {
    if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
    if ("billingOnly" in item && item.billingOnly && !enableBilling) return false;
    return true;
  });

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-6 py-5">
        <Link href="/dashboard" className="block">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            {firmName}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {t("common.appTagline")}
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(`common.${item.labelKey}`)}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/activity"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/activity"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
            )}
          >
            <Activity className="h-4 w-4 shrink-0" />
            {t("common.nav.activity")}
          </Link>
        )}
        {isAdmin && (
          <>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/users")
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <UserCog className="h-4 w-4 shrink-0" />
              {t("common.nav.users")}
            </Link>
            <Link
              href="/admin/groups"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/groups")
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <UsersRound className="h-4 w-4 shrink-0" />
              {t("common.nav.groups")}
            </Link>
            <Link
              href="/admin/security"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/security")
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              {t("common.nav.security")}
            </Link>
            <Link
              href="/admin/ai-connectors"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/ai-connectors")
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <Bot className="h-4 w-4 shrink-0" />
              {t("common.nav.aiConnectors")}
            </Link>
            <Link
              href="/admin/workflow-statuses"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/workflow-statuses")
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <ListOrdered className="h-4 w-4 shrink-0" />
              {t("common.nav.workflowStatuses")}
            </Link>
            <Link
              href="/admin/settings"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin/settings")
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {t("common.nav.settings")}
            </Link>
          </>
        )}
      </nav>
      <div className="border-t border-slate-200 px-4 py-4">
        <Link
          href="/account"
          className={cn(
            "block rounded-md px-2 py-1.5 transition-colors hover:bg-white",
            pathname.startsWith("/account") && "bg-white shadow-sm"
          )}
        >
          <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{roleLabel(t, userRole)}</p>
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-white hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          {t("common.signOut")}
        </button>
      </div>
    </aside>
  );
}
