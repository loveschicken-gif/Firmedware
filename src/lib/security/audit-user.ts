import { prisma } from "@/lib/prisma";

export const SECURITY_AUDIT_EMAIL = "security-audit@firm.local";

/** Inactive system user for orphan security events (unknown email login attempts). */
export async function getSecurityAuditUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: SECURITY_AUDIT_EMAIL },
    create: {
      email: SECURITY_AUDIT_EMAIL,
      name: "Security Audit",
      passwordHash: "$2a$12$invalidhashforauditonly00000000000000000000000",
      role: "ADMIN",
      active: false,
    },
    update: {},
    select: { id: true },
  });
  return user.id;
}
