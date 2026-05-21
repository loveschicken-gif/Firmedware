import { Role, Prisma } from "@prisma/client";
import { notDeleted } from "@/lib/soft-delete";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/** Prisma filter: user is direct assignee OR member of an active group on a non-deleted matter */
export function matterAccessForUser(userId: string): Prisma.MatterWhereInput {
  return {
    ...notDeleted,
    OR: [
      { assignments: { some: { userId } } },
      {
        groupAssignments: {
          some: {
            group: {
              active: true,
              ...notDeleted,
              members: { some: { userId } },
            },
          },
        },
      },
    ],
  };
}

export function isAdmin(user: SessionUser) {
  return user.role === Role.ADMIN;
}

export function canWrite(user: SessionUser) {
  return user.role !== Role.VIEWER;
}

export function canManageUsers(user: SessionUser) {
  return user.role === Role.ADMIN;
}

export function matterWhereForUser(
  user: SessionUser
): Prisma.MatterWhereInput {
  if (isAdmin(user)) return notDeleted;
  return matterAccessForUser(user.id);
}

/** Admin: all non-deleted clients. Others: client with at least one accessible non-deleted matter. */
export function clientWhereForUser(
  user: SessionUser
): Prisma.ClientWhereInput {
  if (isAdmin(user)) return notDeleted;
  return {
    ...notDeleted,
    matters: {
      some: matterAccessForUser(user.id),
    },
  };
}

export function documentWhereForUser(
  user: SessionUser
): Prisma.DocumentLinkWhereInput {
  const base = notDeleted;
  if (isAdmin(user)) return base;
  const matterAccess = matterAccessForUser(user.id);
  return {
    ...base,
    OR: [
      { matter: matterAccess },
      {
        matterId: null,
        client: { matters: { some: matterAccess } },
      },
    ],
  };
}

export function billingWhereForUser(
  user: SessionUser
): Prisma.BillingRecordWhereInput {
  const base = notDeleted;
  if (isAdmin(user)) return base;
  const matterAccess = matterAccessForUser(user.id);
  return {
    ...base,
    OR: [
      { matter: matterAccess },
      {
        matterId: null,
        client: { matters: { some: matterAccess } },
      },
    ],
  };
}

export function taskWhereForUser(user: SessionUser): Prisma.TaskWhereInput {
  const base = notDeleted;
  if (isAdmin(user)) return base;
  const matterAccess = matterAccessForUser(user.id);
  return {
    ...base,
    OR: [
      { assigneeId: user.id },
      { matter: matterAccess },
      {
        matterId: null,
        client: { matters: { some: matterAccess } },
      },
    ],
  };
}

export function tagWhereActive(): Prisma.TagWhereInput {
  return notDeleted;
}

export function groupWhereActive(): Prisma.UserGroupWhereInput {
  return { ...notDeleted, active: true };
}

export async function canAccessMatter(
  user: SessionUser,
  matterId: string
): Promise<boolean> {
  if (isAdmin(user)) {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.matter.count({
      where: { id: matterId, ...notDeleted },
    });
    return count > 0;
  }
  const { prisma } = await import("@/lib/prisma");
  const count = await prisma.matter.count({
    where: {
      id: matterId,
      ...matterAccessForUser(user.id),
    },
  });
  return count > 0;
}

export async function canAccessBillingRecord(
  user: SessionUser,
  billingId: string
): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");
  const count = await prisma.billingRecord.count({
    where: {
      id: billingId,
      ...billingWhereForUser(user),
    },
  });
  return count > 0;
}

export async function canAccessClient(
  user: SessionUser,
  clientId: string
): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");
  const count = await prisma.client.count({
    where: {
      id: clientId,
      ...clientWhereForUser(user),
    },
  });
  return count > 0;
}
