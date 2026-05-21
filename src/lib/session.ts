import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/rbac";

/** Reload role and profile from DB; reject deactivated users (AUTH-010, AUTH-011). */
export async function loadActiveSessionUser(
  userId: string
): Promise<SessionUser | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
    },
  });
  if (!dbUser?.active) return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return loadActiveSessionUser(session.user.id);
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
