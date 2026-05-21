import bcrypt from "bcryptjs";
import {
  ActivityAction,
  ActivityCategory,
  EntityType,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getFirmSettings } from "@/lib/firm-settings";
import { getSecurityAuditUserId } from "@/lib/security/audit-user";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

async function logAuthEvent(
  userId: string,
  entityId: string,
  summary: string,
  metadata?: Prisma.InputJsonValue
) {
  await logActivity({
    userId,
    entityType: EntityType.USER,
    entityId,
    category: ActivityCategory.AUTH,
    action: ActivityAction.VIEW,
    summary,
    metadata,
  });
}

/** Pure lockout check (AUTH-001); exported for security tests. */
export function isAccountLockedOut(
  failedLoginCount: number,
  lastFailedLoginAt: Date | null,
  threshold: number,
  lockoutMinutes: number,
  now: Date = new Date()
) {
  if (failedLoginCount < threshold || !lastFailedLoginAt) return false;
  const lockoutUntil = new Date(
    lastFailedLoginAt.getTime() + lockoutMinutes * 60 * 1000
  );
  return now < lockoutUntil;
}

export async function authenticateCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const settings = await getFirmSettings();
  const auditUserId = await getSecurityAuditUserId();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await logAuthEvent(
      auditUserId,
      auditUserId,
      `Failed login attempt for unknown email`,
      { attemptedEmail: email, category: "failed_login" }
    );
    return null;
  }

  if (!user.active) {
    await logAuthEvent(
      auditUserId,
      user.id,
      `Failed login attempt for deactivated account (${user.email})`,
      { category: "failed_login" }
    );
    return null;
  }

  if (
    isAccountLockedOut(
      user.failedLoginCount,
      user.lastFailedLoginAt,
      settings.failedLoginLockoutThreshold,
      settings.failedLoginLockoutMinutes
    )
  ) {
    await logAuthEvent(
      auditUserId,
      user.id,
      `Login blocked — account temporarily locked (${user.email})`,
      { category: "failed_login", locked: true }
    );
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    });
    await logAuthEvent(
      auditUserId,
      user.id,
      `Failed login attempt (${user.email})`,
      { category: "failed_login" }
    );
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      failedLoginCount: 0,
      lastFailedLoginAt: null,
    },
  });

  await logAuthEvent(
    user.id,
    user.id,
    `Successful login (${user.email})`,
    { category: "login_success" }
  );

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
